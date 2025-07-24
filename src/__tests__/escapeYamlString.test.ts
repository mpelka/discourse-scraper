import { describe, expect, test } from "vitest";
import { escapeYamlString } from "../index";

describe("escapeYamlString", () => {
  test("should escape double quotes", () => {
    expect(escapeYamlString('Hello "world"')).toBe('Hello \\"world\\"');
  });

  test("should return unchanged string when no quotes present", () => {
    const input = "Hello world";
    expect(escapeYamlString(input)).toBe(input);
  });

  test("should return empty string for empty input", () => {
    expect(escapeYamlString("")).toBe("");
  });

  test("should handle consecutive quotes", () => {
    expect(escapeYamlString('""')).toBe('\\"\\"');
  });
});
