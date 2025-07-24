import { describe, expect, test } from "vitest";
import { formatDateISO } from "../index";

describe("formatDateISO", () => {
  test("should format Date object to ISO date string", () => {
    const date = new Date("2023-12-25T15:30:45.123Z");
    expect(formatDateISO(date)).toBe("2023-12-25");
  });

  test("should format date string to ISO date string", () => {
    expect(formatDateISO("2023-12-25T15:30:45.123Z")).toBe("2023-12-25");
  });

  test("should return 'Invalid Date' for invalid date", () => {
    expect(formatDateISO("invalid-date")).toBe("Invalid Date");
  });
});
