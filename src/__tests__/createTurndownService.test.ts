/// <reference lib="dom" />

import TurndownService from "turndown";
import { describe, expect, test } from "vitest";
import { createTurndownService } from "../index";

describe("createTurndownService", () => {
  test("should return TurndownService instance", () => {
    const service = createTurndownService();
    expect(service).toBeInstanceOf(TurndownService);
  });

  test("should convert basic HTML to markdown", () => {
    const service = createTurndownService();
    const html = "<p>Hello <strong>world</strong></p>";
    const result = service.turndown(html);

    expect(result).toBe("Hello **world**");
  });

  test("should use ATX heading style", () => {
    const service = createTurndownService();
    const html = "<h1>Heading</h1>";
    const result = service.turndown(html);

    expect(result).toBe("# Heading");
  });

  test("should use fenced code block style", () => {
    const service = createTurndownService();
    const html = "<pre><code>console.log('hello');</code></pre>";
    const result = service.turndown(html);

    expect(result).toBe("```\nconsole.log('hello');\n```");
  });

  test("should filter out avatar images", () => {
    const service = createTurndownService();
    const html = '<img src="https://example.com/user_avatar/username.png" alt="avatar">';
    const result = service.turndown(html);

    expect(result.trim()).toBe(""); // Avatar should be filtered out
  });

  test("should convert emoji images with unicode alt text", () => {
    const service = createTurndownService();
    const html = '<img src="https://example.com/emoji/smile.png" alt="😀" class="emoji">';
    const result = service.turndown(html);

    expect(result.trim()).toBe("😀"); // Should use unicode emoji from alt
  });

  test("should preserve regular content images with default sizing", () => {
    const service = createTurndownService();
    const html = '<img src="https://example.com/content/image.jpg" alt="description">';
    const result = service.turndown(html);

    expect(result.trim()).toBe("![|320](https://example.com/content/image.jpg)");
  });

  test("should handle images without alt text with default sizing", () => {
    const service = createTurndownService();
    const html = '<img src="https://example.com/image.jpg">';
    const result = service.turndown(html);

    expect(result.trim()).toBe("![|320](https://example.com/image.jpg)");
  });
});
