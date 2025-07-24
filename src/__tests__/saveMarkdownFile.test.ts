import { mkdir, writeFile } from "node:fs/promises";
import { afterEach, describe, expect, test, vi } from "vitest";
import { saveMarkdownFile } from "../index";

vi.mock("node:fs/promises", async () => {
  const mkdirMock = vi.fn();
  const writeFileMock = vi.fn();

  return {
    mkdir: mkdirMock,
    writeFile: writeFileMock,
    default: {
      mkdir: mkdirMock,
      writeFile: writeFileMock,
    },
  };
});

describe("saveMarkdownFile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should save file with correct path and content", async () => {
    // Configure the mocks to simulate success for this test.
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const content = "# Test Content";
    const targetDir = "./test-output";
    const topicId = "123";
    const slug = "test-topic";

    await saveMarkdownFile(content, targetDir, topicId, slug);

    // Assert that the mocks were called with the correct arguments.
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("test-output"), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining("123-test-topic.md"), content);
  });

  test("should handle file write errors", async () => {
    // Configure mocks to simulate a failure in `writeFile`.
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockRejectedValue(new Error("Write failed"));

    const content = "# Test Content";
    const targetDir = "./test-output";
    const topicId = "123";
    const slug = "test-topic";

    // Expect the promise to reject with the correct error.
    await expect(saveMarkdownFile(content, targetDir, topicId, slug)).rejects.toThrow("Write failed");
  });

  test("should return relative path after successful save", async () => {
    // Configure mocks for a successful run.
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const content = "# Test Content";
    const targetDir = "./output";
    const topicId = "456";
    const slug = "another-topic";

    const result = await saveMarkdownFile(content, targetDir, topicId, slug);

    expect(result).toBe("output/456-another-topic.md");
  });
});
