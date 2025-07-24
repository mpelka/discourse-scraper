import { describe, expect, test } from "vitest";
import { processImageGalleries } from "../index";

describe("processImageGalleries", () => {
  test("should leave single sized image unchanged", () => {
    const markdown = "![|320](image.jpg)";
    const result = processImageGalleries(markdown);
    expect(result).toBe("![|320](image.jpg)");
  });

  test("should group multiple consecutive sized images", () => {
    const markdown = "![|320](image1.jpg)\n![|320](image2.jpg)\n![|320](image3.jpg)";
    const result = processImageGalleries(markdown);
    expect(result).toBe("![|320](image1.jpg) ![|320](image2.jpg) ![|320](image3.jpg)");
  });

  test("should not group images separated by text", () => {
    const markdown = "![|320](image1.jpg)\nSome text\n![|320](image2.jpg)";
    const result = processImageGalleries(markdown);
    expect(result).toBe("![|320](image1.jpg)\nSome text\n![|320](image2.jpg)");
  });

  test("should leave non-sized images unchanged", () => {
    const markdown = "![alt text](image.jpg)\nRegular text\n![another](photo.png)";
    const result = processImageGalleries(markdown);
    expect(result).toBe("![alt text](image.jpg)\nRegular text\n![another](photo.png)");
  });
});
