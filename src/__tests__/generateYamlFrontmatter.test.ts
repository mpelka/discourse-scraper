import { describe, expect, test } from "vitest";
import { generateYamlFrontmatter } from "../index";
import type { Post, TopicData } from "../types";

describe("generateYamlFrontmatter", () => {
  const mockPost: Post = {
    id: 1,
    username: "testuser",
    cooked: "content",
    created_at: "2023-12-25T10:30:00Z",
    post_number: 1,
    reply_to_post_number: null,
  };

  test("should generate frontmatter with tags", () => {
    const topicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: ["javascript", "testing"],
      post_stream: { posts: [], stream: [] },
    };

    const result = generateYamlFrontmatter(
      topicData,
      mockPost,
      "https://example.com",
      "Sample content for description",
    );

    expect(result).toEqual([
      "---",
      'title: "Test Topic"',
      'source: "https://example.com"',
      "author:",
      '  - "[[testuser]]"',
      "published: 2023-12-25",
      expect.stringMatching(/created: \d{4}-\d{2}-\d{2}/),
      'description: "Sample content for description..."',
      "tags:",
      '  - "javascript"',
      '  - "testing"',
      "---",
    ]);
  });

  test("should generate frontmatter without tags (default)", () => {
    const topicData: TopicData = {
      title: "No Tags Topic",
      slug: "no-tags",
      tags: [],
      post_stream: { posts: [], stream: [] },
    };

    const result = generateYamlFrontmatter(topicData, mockPost, "https://example.com", "Content");

    expect(result).toEqual([
      "---",
      'title: "No Tags Topic"',
      'source: "https://example.com"',
      "author:",
      '  - "[[testuser]]"',
      "published: 2023-12-25",
      expect.stringMatching(/created: \d{4}-\d{2}-\d{2}/),
      'description: "Content..."',
      "tags:",
      '  - "discourse-clipping"',
      "---",
    ]);
  });

  test("should handle long description by truncating to 150 chars", () => {
    const longContent = "a".repeat(200);
    const topicData: TopicData = {
      title: "Long Description",
      slug: "long",
      tags: ["test"],
      post_stream: { posts: [], stream: [] },
    };

    const result = generateYamlFrontmatter(topicData, mockPost, "https://example.com", longContent);
    const descriptionLine = result.find((line) => line.startsWith("description:"));

    expect(descriptionLine).toBe(`description: "${"a".repeat(150)}..."`);
  });

  test("should normalize whitespace in description", () => {
    const content = "Multiple   spaces\n\nand\tlines";
    const topicData: TopicData = {
      title: "Whitespace Test",
      slug: "whitespace",
      tags: ["test"],
      post_stream: { posts: [], stream: [] },
    };

    const result = generateYamlFrontmatter(topicData, mockPost, "https://example.com", content);
    const descriptionLine = result.find((line) => line.startsWith("description:"));

    expect(descriptionLine).toBe('description: "Multiple spaces and lines..."');
  });
});
