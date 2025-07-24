import { describe, expect, test, vi } from "vitest";
import { parseDiscourseUrl } from "../index";

describe("parseDiscourseUrl", () => {
  test("should return null for invalid URL", () => {
    const result = parseDiscourseUrl("invalid-url");
    expect(result).toBe(null);
  });

  test("should return null when URL has no 't' in path", () => {
    const result = parseDiscourseUrl("https://example.com/posts/123");
    expect(result).toBe(null);
  });

  test("should return null when URL has 't' but no numeric ID", () => {
    const result = parseDiscourseUrl("https://discourse.example.com/t/topic-name");
    expect(result).toBe(null);
  });

  test("should extract baseUrl and topicId from valid Discourse URL", () => {
    const result = parseDiscourseUrl("https://discourse.example.com/t/topic-name/12345");
    expect(result).toEqual({
      baseUrl: "https://discourse.example.com",
      topicId: "12345",
    });
  });

  test("should re-throw non-TypeError errors", () => {
    const originalURL = global.URL;
    const customError = new ReferenceError("Unexpected error");

    // Mock URL constructor to throw a non-TypeError
    global.URL = vi.fn().mockImplementation(() => {
      throw customError;
    }) as any;

    expect(() => {
      parseDiscourseUrl("https://example.com");
    }).toThrow(customError);

    // Restore original URL constructor
    global.URL = originalURL;
  });
});
