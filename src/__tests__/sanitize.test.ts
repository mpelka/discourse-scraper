import { describe, expect, test } from "vitest";
import { sanitize } from "../index";

describe("sanitize", () => {
  test("should keep allowed tags", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    const result = sanitize(html);
    expect(result).toBe("<p>Hello <strong>world</strong></p>");
  });

  test("should remove disallowed tags", () => {
    const html = "<p>Safe content</p><div>unwanted div</div>";
    const result = sanitize(html);
    expect(result).toBe("<p>Safe content</p>unwanted div");
  });

  test("should keep allowed attributes", () => {
    const html = '<a href="https://example.com" title="Link">Text</a>';
    const result = sanitize(html);
    expect(result).toBe('<a href="https://example.com" title="Link">Text</a>');
  });

  test("should remove disallowed attributes", () => {
    const html = '<p onclick="evil()">Text</p>';
    const result = sanitize(html);
    expect(result).toBe("<p>Text</p>");
  });
});
