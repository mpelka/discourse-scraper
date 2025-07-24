#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import DOMPurify from "isomorphic-dompurify";
import ky from "ky";
import * as emoji from "node-emoji";
import ora from "ora";
import TurndownService from "turndown";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { ConversationTree, Post, TopicData } from "./types";

const api = ky.create({
  timeout: 30000,
  retry: {
    limit: 3,
    methods: ["get"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("User-Agent", "Discourse-Scraper/1.0");
      },
    ],
  },
});

/**
 * Sanitizes HTML content using DOMPurify with allowed tags for markdown conversion
 */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "img",
      "blockquote",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "aside",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Generates a safe file path with sanitized filename and path traversal protection
 */
export function getSafeOutputPath(targetDir: string, topicId: string, slug: string): string {
  // Resolve to absolute path and ensure it's within bounds
  const baseDir = path.resolve(targetDir);

  // Validate the target directory isn't trying to escape
  if (path.isAbsolute(targetDir) && !targetDir.startsWith(process.cwd())) {
    throw new Error("Target directory must be within the current working directory");
  }

  // Extra sanitization for the filename
  const sanitizedSlug = slug
    .replace(/[^a-z0-9\-_]/gi, "_") // Allow hyphens for readability
    .replace(/\.{2,}/g, "_") // Remove any double dots
    .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
    .substring(0, 200); // Limit length for filesystem compatibility

  const filename = `${topicId}-${sanitizedSlug}.md`;
  const fullPath = path.join(baseDir, filename);

  // Ensure the final path is still within our base directory
  const relativePath = path.relative(baseDir, fullPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid filename generated");
  }

  return fullPath;
}

/**
 * Checks if a URL points to a user avatar image
 */
export function isAvatarUrl(url: string): boolean {
  return url.includes("user_avatar") || url.includes("/avatar/");
}

/**
 * Checks if a DOM node is inside an onebox embed
 */
export function isInsideOnebox(node: Element): boolean {
  return !!(node as Element).closest?.(".onebox");
}

/**
 * Formats a date as ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = new Date(date);

  // Handle invalid dates
  if (Number.isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const isoString = dateObj.toISOString();
  const datePart = isoString.split("T")[0];
  return datePart ?? isoString; // Fallback to full ISO string if split fails
}

/**
 * Escapes quotes in strings for YAML compatibility
 */
export function escapeYamlString(str: string): string {
  return str.replace(/"/g, '\\"');
}

/**
 * Converts emoji images to Unicode symbols using node-emoji
 */
export function convertEmojiImage(alt: string, src: string): string {
  // Check if alt text already contains Unicode emoji
  const unicodeEmojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const unicodeMatch = alt.match(unicodeEmojiRegex);

  if (unicodeMatch) {
    return unicodeMatch[0]; // Return the first Unicode emoji found
  }

  // Extract emoji name from URL: /emoji/twitter/grinning.png → grinning
  const urlMatch = src.match(/\/emoji\/[^/]+\/([^/.]+)/);
  const emojiName = urlMatch?.[1] || alt.replace(/^:+|:+$/g, "");

  // Use node-emoji to convert (handles both 'heart' and ':heart:' formats)
  const emojiChar = emoji.get(emojiName);

  return emojiChar || alt; // Fallback to alt text if not found
}

/**
 * Parses a Discourse URL to extract base URL and topic ID
 */
export function parseDiscourseUrl(fullUrl: string): { baseUrl: string; topicId: string } | null {
  try {
    const url = new URL(fullUrl);
    const pathParts = url.pathname.split("/").filter((p) => p);
    const tIndex = pathParts.indexOf("t");
    if (tIndex !== -1) {
      for (let i = tIndex + 1; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part && /^\d+$/.test(part)) {
          return { baseUrl: url.origin, topicId: part };
        }
      }
    }
  } catch (e) {
    if (e instanceof TypeError) {
      // Invalid URL format - return null as documented behavior
      return null;
    }
    throw e; // Re-throw unexpected errors
  }
  return null;
}

/**
 * Creates a TurndownService configured with Discourse-specific conversion rules
 */
export function createTurndownService(): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Handle onebox embeds FIRST (external content previews) - highest priority
  turndownService.addRule("onebox", {
    filter: (node) => {
      const isAside = node.nodeName === "ASIDE";
      const hasOneboxClass = node.classList?.contains("onebox");
      const hasAllowlistedClass = node.classList?.contains("allowlistedgeneric");

      return isAside && (hasOneboxClass || hasAllowlistedClass);
    },
    replacement: (_content, _node) => {
      // Remove onebox content entirely - we'll add clean links from link_counts instead
      return "";
    },
  });

  // Handle lightbox images (discourse wrapped images) - these are actual content images
  turndownService.addRule("discourseImage", {
    filter: (node) => node.nodeName === "A" && node.classList.contains("lightbox"),
    replacement: (_, node) => {
      const href = (node as HTMLAnchorElement).getAttribute("href") || "";

      // Skip avatars even in lightbox
      if (isAvatarUrl(href)) {
        return "";
      }

      // Skip if this is inside an onebox (already handled)
      if (isInsideOnebox(node as Element)) {
        return "";
      }

      return `![|320](${href})`;
    },
  });

  // Handle regular images - but exclude emojis and avatars
  turndownService.addRule("regularImage", {
    filter: "img",
    replacement: (_, node) => {
      const src = (node as HTMLImageElement).getAttribute("src") || "";
      const alt = (node as HTMLImageElement).getAttribute("alt") || "";

      // Skip if this image is inside a lightbox (already handled above)
      if (node.parentNode && (node.parentNode as Element).classList?.contains("lightbox")) {
        return "";
      }

      // Skip if this image is inside an onebox embed (preview images)
      if (isInsideOnebox(node as Element)) {
        return "";
      }

      // Convert emoji images to Unicode symbols
      if (src.includes("/emoji/") || src.includes("emoji") || alt.includes("emoji")) {
        return convertEmojiImage(alt, src);
      }

      // Skip user avatars completely - don't render them
      if (isAvatarUrl(src)) {
        return "";
      }

      // Skip very small images (likely icons/emojis) - check dimensions if available
      const width = (node as HTMLImageElement).getAttribute("width");
      const height = (node as HTMLImageElement).getAttribute("height");
      if ((width && parseInt(width) < 100) || (height && parseInt(height) < 100)) {
        return `![${alt}](${src})`;
      }

      // For actual content images, use the sizing
      return `![|320](${src})`;
    },
  });

  return turndownService;
}

/**
 * Post-processes markdown to group consecutive images into gallery layout
 */
export function processImageGalleries(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let consecutiveImages: string[] = [];

  const flushImages = () => {
    if (consecutiveImages.length > 1) {
      // Group multiple images on the same line for gallery effect
      result.push(consecutiveImages.join(" "));
    } else if (consecutiveImages.length === 1) {
      // Single image stays on its own line
      const firstImage = consecutiveImages[0];
      if (firstImage) {
        result.push(firstImage);
      }
    }
    consecutiveImages = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line is a sized image (content image, not emoji/avatar)
    if (trimmedLine.match(/^!\[\|\d+\]\(.+\)$/)) {
      consecutiveImages.push(trimmedLine);
    } else {
      // Not an image, flush any accumulated images
      flushImages();
      result.push(line);
    }
  }

  // Flush any remaining images
  flushImages();

  return result.join("\n");
}

/**
 * Builds a hierarchical conversation tree from flat post data
 */
export function buildConversationTree(posts: Post[]): ConversationTree {
  const postMap = new Map<number, Post>(posts.map((p) => [p.post_number, p]));
  const childrenMap = new Map<number, Post[]>();
  const topLevelPosts: Post[] = [];

  for (const post of posts) {
    if (post.reply_to_post_number) {
      if (!childrenMap.has(post.reply_to_post_number)) {
        childrenMap.set(post.reply_to_post_number, []);
      }
      childrenMap.get(post.reply_to_post_number)?.push(post);
    } else if (post.post_number !== 1) {
      topLevelPosts.push(post);
    }
  }

  // Sort children and top-level posts
  for (const children of childrenMap.values()) {
    children.sort((a, b) => a.post_number - b.post_number);
  }
  topLevelPosts.sort((a, b) => a.post_number - b.post_number);

  return { postMap, childrenMap, topLevelPosts };
}

/**
 * Generates markdown for external links from post link_counts
 */
export function renderExternalLinks(post: Post): string {
  if (!post.link_counts || post.link_counts.length === 0) {
    return "";
  }

  // Only include external (non-internal) links
  const externalLinks = post.link_counts.filter((link) => !link.internal);

  if (externalLinks.length === 0) {
    return "";
  }

  const linkLines: string[] = [];
  const filteredLinks: string[] = [];

  externalLinks.forEach((link) => {
    // Skip image URLs to avoid duplication with displayed images
    if (!link.url.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i)) {
      filteredLinks.push(`- [${link.title}](${link.url})`);
    }
  });

  // Only add the section if there are actual non-image links
  if (filteredLinks.length > 0) {
    linkLines.push(""); // Empty line before links
    linkLines.push("**External Links:**");
    linkLines.push(...filteredLinks);
    return linkLines.join("\n");
  }

  return "";
}

/**
 * Fetches all posts for a topic, including paginated content
 */
export async function fetchAllPosts(baseUrl: string, topicId: string, initialTopicData: TopicData): Promise<Post[]> {
  const allPosts: Post[] = [...initialTopicData.post_stream.posts];
  const fetchedPostIds = new Set(allPosts.map((p) => p.id));
  const remainingPostIds = initialTopicData.post_stream.stream.filter((id) => !fetchedPostIds.has(id));

  if (remainingPostIds.length === 0) {
    return allPosts;
  }

  const chunkSize = 50;
  const spinner = ora();

  for (let i = 0; i < remainingPostIds.length; i += chunkSize) {
    const chunk = remainingPostIds.slice(i, i + chunkSize);
    const postQuery = chunk.map((id) => `post_ids[]=${id}`).join("&");
    const postsUrl = `${baseUrl}/t/${topicId}/posts.json?${postQuery}`;

    try {
      spinner.start(
        `Fetching additional posts (${Math.ceil((i + chunkSize) / chunkSize)}/${Math.ceil(remainingPostIds.length / chunkSize)})`,
      );

      const postsData = await api.get(postsUrl).json<{ post_stream: { posts: Post[] } }>();
      allPosts.push(...postsData.post_stream.posts);
      spinner.succeed();
    } catch (_) {
      spinner.fail();
      console.warn(`Failed to fetch a chunk of posts. Some posts may be missing.`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
  }

  return allPosts;
}

/**
 * Generates YAML frontmatter for Obsidian compatibility
 */
export function generateYamlFrontmatter(
  topicData: TopicData,
  originalPost: Post,
  sourceUrl: string,
  originalPostMarkdown: string,
): string[] {
  const outputLines: string[] = [];

  outputLines.push("---");
  outputLines.push(`title: "${escapeYamlString(topicData.title)}"`);
  outputLines.push(`source: "${sourceUrl}"`);
  outputLines.push("author:");
  outputLines.push(`  - "[[${originalPost.username}]]"`);
  outputLines.push(`published: ${formatDateISO(originalPost.created_at)}`);
  outputLines.push(`created: ${formatDateISO(new Date())}`);
  outputLines.push(
    `description: "${escapeYamlString(originalPostMarkdown.substring(0, 150).replace(/\s+/g, " "))}..."`,
  );
  outputLines.push("tags:");

  if (topicData.tags && topicData.tags.length > 0) {
    topicData.tags.forEach((tag) => outputLines.push(`  - "${escapeYamlString(tag)}"`));
  } else {
    outputLines.push('  - "discourse-clipping"');
  }

  outputLines.push("---");

  return outputLines;
}

/**
 * Renders posts and replies as nested markdown blockquotes
 */
export function renderPostTree(
  posts: Post[],
  childrenMap: Map<number, Post[]>,
  baseUrl: string,
  topicId: string,
  turndownService: TurndownService,
): string[] {
  const outputLines: string[] = [];

  const renderPost = (post: Post, depth: number) => {
    const prefix = "> ".repeat(depth);
    const postDate = formatDateISO(post.created_at);
    const postLink = `${baseUrl}/t/${topicId}/${post.post_number}`;

    outputLines.push(`${prefix}**${post.username}** • [Post #${post.post_number}](${postLink}) • ${postDate}`);
    outputLines.push(`${prefix}`);

    const sanitizedHtml = sanitize(post.cooked);

    let markdownContent = turndownService.turndown(sanitizedHtml);
    markdownContent = processImageGalleries(markdownContent);
    markdownContent.split("\n").forEach((line) => outputLines.push(`${prefix}${line}`));

    // Add external links if they exist
    const externalLinks = renderExternalLinks(post);
    if (externalLinks) {
      externalLinks.split("\n").forEach((line) => outputLines.push(`${prefix}${line}`));
    }

    outputLines.push("");

    const children = childrenMap.get(post.post_number);
    if (children) {
      children.forEach((child) => renderPost(child, depth + 1));
    }
  };

  posts.forEach((post) => renderPost(post, 1));
  return outputLines;
}

/**
 * Saves markdown content to file with safe path handling
 */
export async function saveMarkdownFile(
  content: string,
  targetDir: string,
  topicId: string,
  slug: string,
): Promise<string> {
  const outputPath = getSafeOutputPath(targetDir, topicId, slug);
  const relativePath = path.relative(process.cwd(), outputPath);

  const spinner = ora(`Saving to ${outputPath}`).start();

  try {
    const outputDir = path.dirname(outputPath);
    await mkdir(outputDir, { recursive: true });

    await writeFile(outputPath, content);

    spinner.succeed();
    return relativePath;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

/**
 * Orchestrates the complete markdown content generation pipeline
 */
export function generateMarkdownContent(
  topicData: TopicData,
  allPosts: Post[],
  sourceUrl: string,
  baseUrl: string,
  topicId: string,
): string {
  const tree = buildConversationTree(allPosts);
  const turndownService = createTurndownService();

  // Find original post
  const originalPost = tree.postMap.get(1);
  if (!originalPost) {
    throw new Error("Could not find the Original Post (post #1).");
  }

  // Generate original post markdown
  const sanitizedHtml = sanitize(originalPost.cooked);

  let originalPostMarkdown = turndownService.turndown(sanitizedHtml);
  originalPostMarkdown = processImageGalleries(originalPostMarkdown);

  // Add external links to original post if they exist
  const originalPostLinks = renderExternalLinks(originalPost);

  // Generate all content sections
  const frontmatter = generateYamlFrontmatter(topicData, originalPost, sourceUrl, originalPostMarkdown);
  const comments = renderPostTree(tree.topLevelPosts, tree.childrenMap, baseUrl, topicId, turndownService);

  // Combine all content
  const outputLines: string[] = [
    ...frontmatter,
    "",
    originalPostMarkdown,
    originalPostLinks, // Add external links after original post content
    "",
    "---",
    "",
    "## Comments",
    "",
    ...comments,
  ];

  return outputLines.join("\n");
}

/**
 * Main application entry point - orchestrates the complete scraping workflow
 */
export async function main(sourceUrl: string, targetDir: string) {
  // 1. Parse and validate URL
  const urlInfo = parseDiscourseUrl(sourceUrl);
  if (!urlInfo) {
    console.error(`Could not extract topic ID from URL: ${sourceUrl}`);
    process.exit(1);
  }

  const { baseUrl, topicId } = urlInfo;
  const domain = new URL(baseUrl).hostname;

  // 2. Fetch topic data
  const spinner = ora(`Fetching thread from ${domain}`).start();
  const topicData = await api.get(`${baseUrl}/t/${topicId}.json`).json<TopicData>();

  spinner.succeed(`Retrieved "${topicData.title}" (${topicData.post_stream.stream.length} posts)`);

  // 3. Fetch all posts
  const allPosts = await fetchAllPosts(baseUrl, topicId, topicData);

  // 4. Generate markdown content
  const markdownContent = generateMarkdownContent(topicData, allPosts, sourceUrl, baseUrl, topicId);

  // 5. Save file
  await saveMarkdownFile(markdownContent, targetDir, topicId, topicData.slug);
}

// Only run CLI when this file is executed directly (not when imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = yargs(hideBin(process.argv))
    .option("url", {
      alias: "u",
      type: "string",
      description: "The full URL to any post within the Discourse thread",
      demandOption: true,
    })
    .option("target-dir", {
      alias: "t",
      type: "string",
      description: "The directory where the output file will be saved",
      default: "./archive",
    })
    .help()
    .parseSync();

  const { url: sourceUrl, targetDir } = argv;

  main(sourceUrl, targetDir).catch((error) => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
  });
}
