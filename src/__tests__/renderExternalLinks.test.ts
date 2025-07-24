import { describe, expect, test } from "vitest";
import { renderExternalLinks } from "../index";
import type { Post } from "../types";

describe("renderExternalLinks", () => {
  test("should return empty string when no link_counts", () => {
    const post: Post = {
      id: 1,
      username: "user",
      cooked: "content",
      created_at: "2023-01-01",
      post_number: 1,
      reply_to_post_number: null,
    };

    const result = renderExternalLinks(post);
    expect(result).toBe("");
  });

  test("should format external non-image links", () => {
    const post: Post = {
      id: 1,
      username: "user",
      cooked: "content",
      created_at: "2023-01-01",
      post_number: 1,
      reply_to_post_number: null,
      link_counts: [
        {
          url: "https://example.com",
          internal: false,
          reflection: false,
          title: "Example Site",
          clicks: 5,
        },
      ],
    };

    const result = renderExternalLinks(post);
    expect(result).toBe("\n**External Links:**\n- [Example Site](https://example.com)");
  });

  test("should filter out internal links", () => {
    const post: Post = {
      id: 1,
      username: "user",
      cooked: "content",
      created_at: "2023-01-01",
      post_number: 1,
      reply_to_post_number: null,
      link_counts: [
        {
          url: "/internal/path",
          internal: true,
          reflection: false,
          title: "Internal Link",
          clicks: 2,
        },
      ],
    };

    const result = renderExternalLinks(post);
    expect(result).toBe("");
  });

  test("should filter out image URLs", () => {
    const post: Post = {
      id: 1,
      username: "user",
      cooked: "content",
      created_at: "2023-01-01",
      post_number: 1,
      reply_to_post_number: null,
      link_counts: [
        {
          url: "https://example.com/image.jpg",
          internal: false,
          reflection: false,
          title: "Image",
          clicks: 1,
        },
      ],
    };

    const result = renderExternalLinks(post);
    expect(result).toBe("");
  });
});
