import { describe, expect, test } from "vitest";
import { convertEmojiImage } from "../index";

describe("convertEmojiImage", () => {
  test("should return unicode emoji when alt contains unicode", () => {
    const alt = "Text with 😀 emoji";
    const src = "/emoji/twitter/grinning.png";
    const result = convertEmojiImage(alt, src);

    expect(result).toBe("😀");
  });

  test("should convert emoji from URL when alt has no unicode", () => {
    const alt = "heart";
    const src = "/emoji/twitter/heart.png";
    const result = convertEmojiImage(alt, src);

    expect(result).toBe("❤️");
  });

  test("should fallback to alt text when emoji conversion fails", () => {
    const alt = "unknown_emoji";
    const src = "/emoji/twitter/nonexistent.png";
    const result = convertEmojiImage(alt, src);

    expect(result).toBe(alt);
  });

  test("should extract emoji name from alt when URL regex fails", () => {
    const alt = ":smile:";
    const src = "/not-emoji-path/image.png";
    const result = convertEmojiImage(alt, src);

    expect(result).toBe("😄");
  });
});
