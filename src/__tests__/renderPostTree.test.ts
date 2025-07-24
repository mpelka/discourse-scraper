import { describe, expect, test } from "vitest";
import { renderPostTree } from "../index";
import type { Post } from "../types";

describe("renderPostTree", () => {
  const mockTurndownService = {
    turndown: (html: string) => html.replace(/<[^>]*>/g, ""), // Simple HTML strip
  } as any;

  test("should render single post with correct format", () => {
    const posts: Post[] = [
      {
        id: 2,
        username: "testuser",
        cooked: "<p>Test content</p>",
        created_at: "2023-01-01T10:00:00Z",
        post_number: 2,
        reply_to_post_number: null,
      },
    ];

    const childrenMap = new Map<number, Post[]>();
    const result = renderPostTree(posts, childrenMap, "https://example.com", "123", mockTurndownService);

    expect(result.join("\n")).toContain("> **testuser**");
    expect(result.join("\n")).toContain("Post #2");
    expect(result.join("\n")).toContain("2023-01-01");
    expect(result.join("\n")).toContain("Test content");
  });

  test("should render nested replies with increased blockquote depth", () => {
    const parentPost: Post = {
      id: 2,
      username: "parent",
      cooked: "<p>Parent post</p>",
      created_at: "2023-01-01",
      post_number: 2,
      reply_to_post_number: null,
    };

    const childPost: Post = {
      id: 3,
      username: "child",
      cooked: "<p>Child reply</p>",
      created_at: "2023-01-02",
      post_number: 3,
      reply_to_post_number: 2,
    };

    const posts = [parentPost];
    const childrenMap = new Map<number, Post[]>();
    childrenMap.set(2, [childPost]);

    const result = renderPostTree(posts, childrenMap, "https://example.com", "123", mockTurndownService);
    const output = result.join("\n");

    // Parent should have single blockquote level
    expect(output).toContain("> **parent**");

    // Child should have double blockquote level
    expect(output).toContain("> > **child**");
  });

  test("should handle multiple top-level posts", () => {
    const posts: Post[] = [
      {
        id: 2,
        username: "user1",
        cooked: "<p>First post</p>",
        created_at: "2023-01-01",
        post_number: 2,
        reply_to_post_number: null,
      },
      {
        id: 3,
        username: "user2",
        cooked: "<p>Second post</p>",
        created_at: "2023-01-02",
        post_number: 3,
        reply_to_post_number: null,
      },
    ];

    const childrenMap = new Map<number, Post[]>();
    const result = renderPostTree(posts, childrenMap, "https://example.com", "123", mockTurndownService);
    const output = result.join("\n");

    expect(output).toContain("user1");
    expect(output).toContain("user2");
    expect(output).toContain("First post");
    expect(output).toContain("Second post");
  });

  test("should generate correct post links", () => {
    const posts: Post[] = [
      {
        id: 2,
        username: "testuser",
        cooked: "<p>Content</p>",
        created_at: "2023-01-01",
        post_number: 5,
        reply_to_post_number: null,
      },
    ];

    const childrenMap = new Map<number, Post[]>();
    const result = renderPostTree(posts, childrenMap, "https://discourse.example.com", "456", mockTurndownService);
    const output = result.join("\n");

    expect(output).toContain("[Post #5](https://discourse.example.com/t/456/5)");
  });

  test("should render external links when post has link_counts", () => {
    const posts: Post[] = [
      {
        id: 2,
        username: "testuser",
        cooked: "<p>Test content</p>",
        created_at: "2023-01-01",
        post_number: 2,
        reply_to_post_number: null,
        link_counts: [
          { url: "https://external.com", internal: false, reflection: false, title: "External Site", clicks: 3 },
          { url: "https://example.com/internal", internal: true, reflection: false, title: "Internal Link", clicks: 1 },
        ],
      },
    ];

    const childrenMap = new Map<number, Post[]>();
    const result = renderPostTree(posts, childrenMap, "https://example.com", "123", mockTurndownService);
    const output = result.join("\n");

    expect(output).toContain("> **testuser**");
    expect(output).toContain("Test content");
    expect(output).toContain("> **External Links:**");
    expect(output).toContain("> - [External Site](https://external.com)");
    expect(output).not.toContain("Internal Link"); // Internal links should be filtered
  });
});
