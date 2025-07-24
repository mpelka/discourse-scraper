import { describe, expect, test } from "vitest";
import { generateMarkdownContent } from "../index";
import type { Post, TopicData } from "../types";

describe("generateMarkdownContent", () => {
  const mockTopicData: TopicData = {
    title: "Test Topic",
    slug: "test-topic",
    tags: ["test"],
    post_stream: { posts: [], stream: [] },
  };

  const mockOriginalPost: Post = {
    id: 1,
    username: "author",
    cooked: "<p>Original post content</p>",
    created_at: "2023-01-01",
    post_number: 1,
    reply_to_post_number: null,
  };

  test("should generate markdown with frontmatter and content", () => {
    const posts = [mockOriginalPost];
    const result = generateMarkdownContent(
      mockTopicData,
      posts,
      "https://example.com",
      "https://discourse.example.com",
      "123",
    );

    expect(result).toContain("---");
    expect(result).toContain('title: "Test Topic"');
    expect(result).toContain("Original post content");
    expect(result).toContain("## Comments");
  });

  test("should include posts in comments section", () => {
    const replyPost: Post = {
      id: 2,
      username: "replier",
      cooked: "<p>Reply content</p>",
      created_at: "2023-01-02",
      post_number: 2,
      reply_to_post_number: null,
    };

    const posts = [mockOriginalPost, replyPost];
    const result = generateMarkdownContent(
      mockTopicData,
      posts,
      "https://example.com",
      "https://discourse.example.com",
      "123",
    );

    expect(result).toContain("## Comments");
    expect(result).toContain("replier");
  });

  test("should throw error when original post not found", () => {
    const posts: Post[] = [
      {
        id: 2,
        username: "user",
        cooked: "content",
        created_at: "2023-01-01",
        post_number: 2, // Not post #1
        reply_to_post_number: null,
      },
    ];

    expect(() => {
      generateMarkdownContent(mockTopicData, posts, "https://example.com", "https://discourse.example.com", "123");
    }).toThrow("Could not find the Original Post (post #1).");
  });

  test("should structure output in correct order", () => {
    const posts = [mockOriginalPost];
    const result = generateMarkdownContent(
      mockTopicData,
      posts,
      "https://example.com",
      "https://discourse.example.com",
      "123",
    );

    const lines = result.split("\n");
    const yamlStart = lines.indexOf("---");
    const yamlEnd = lines.indexOf("---", yamlStart + 1);
    const commentsSection = lines.indexOf("## Comments");

    expect(yamlStart).toBe(0);
    expect(yamlEnd).toBeGreaterThan(yamlStart);
    expect(commentsSection).toBeGreaterThan(yamlEnd);
  });
});
