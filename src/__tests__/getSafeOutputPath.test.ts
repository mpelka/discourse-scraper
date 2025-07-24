import { describe, expect, test } from "vitest";
import { getSafeOutputPath } from "../index";

describe("getSafeOutputPath", () => {
  test("should generate safe path for normal inputs", () => {
    const result = getSafeOutputPath("./output", "123", "my-topic-name");

    expect(result).toContain("123-my-topic-name.md");
    expect(result).toContain("output");
    expect(result.endsWith("123-my-topic-name.md")).toBe(true);
  });

  test("should throw error for absolute path outside current working directory", () => {
    // Use /tmp which should be outside the current working directory
    expect(() => {
      getSafeOutputPath("/tmp", "123", "topic");
    }).toThrow("Target directory must be within the current working directory");
  });

  test("should sanitize filenames with special characters and dots", () => {
    // Test various special characters, dots, and length
    const maliciousSlug = "../../../etc/passwd.txt..with.dots..and/slashes\\backslashes";
    const result = getSafeOutputPath("./output", "456", maliciousSlug);

    expect(result).toContain("456-");
    expect(result).toContain(".md");
    expect(result).not.toContain("../");
    expect(result).not.toContain("/etc/");
    expect(result).not.toContain("\\");
    expect(result).not.toContain("..");
    // Special characters should be converted to underscores
    expect(result).toContain("_etc_passwd_txt_");
  });

  test("should handle very long slugs by truncating to 200 characters", () => {
    const longSlug = "a".repeat(300); // 300 character slug
    const result = getSafeOutputPath("./output", "789", longSlug);

    const filename = result.split("/").pop();
    // Should be topicId + "-" + truncated_slug + ".md"
    // 789-aaa...aaa.md where aaa...aaa is 200 chars max
    expect(filename!.length).toBeLessThanOrEqual(200 + 4 + 3); // topicId + "-" + slug(200) + ".md"
  });

  test("should sanitize dots and special characters in slug", () => {
    const slugWithDots = "...leading-and-trailing...";
    const result = getSafeOutputPath("./output", "101", slugWithDots);

    // Dots get converted to underscores by the first sanitization step
    expect(result).toContain("101-___leading-and-trailing___");
    expect(result).toContain(".md");
    expect(result).not.toContain(".."); // No actual dots should remain
  });

  test("should handle empty slug gracefully", () => {
    const result = getSafeOutputPath("./output", "202", "");

    expect(result).toContain("202-.md");
    expect(result.endsWith("202-.md")).toBe(true);
  });

  test("should throw error for path traversal attempts via extremely long topic ID", () => {
    // Try to trigger path traversal by using a very long topicId that might cause issues
    const veryLongTopicId = "../".repeat(100) + "malicious";

    expect(() => {
      getSafeOutputPath("./output", veryLongTopicId, "topic");
    }).toThrow("Invalid filename generated");
  });
});
