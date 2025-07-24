import { describe, expect, test } from "vitest";
import { isAvatarUrl } from "../index";

describe("isAvatarUrl", () => {
  test("should return true when URL contains 'user_avatar'", () => {
    expect(isAvatarUrl("https://example.com/user_avatar/john.png")).toBe(true);
  });

  test("should return true when URL contains '/avatar/'", () => {
    expect(isAvatarUrl("https://example.com/avatar/42/image.png")).toBe(true);
  });

  test("should return false when URL contains neither pattern", () => {
    expect(isAvatarUrl("https://example.com/images/photo.jpg")).toBe(false);
  });

  test("should return false for empty string", () => {
    expect(isAvatarUrl("")).toBe(false);
  });
});
