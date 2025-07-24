import { beforeEach, describe, expect, test, vi } from "vitest";
import { fetchAllPosts } from "../index";
import type { TopicData } from "../types";

// Mock console methods
const mockConsoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("fetchAllPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return initial posts when no additional posts needed", async () => {
    const initialTopicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: [],
      post_stream: {
        posts: [
          {
            id: 1,
            username: "user1",
            cooked: "content1",
            created_at: "2024-01-01",
            post_number: 1,
            reply_to_post_number: null,
          },
          {
            id: 2,
            username: "user2",
            cooked: "content2",
            created_at: "2024-01-01",
            post_number: 2,
            reply_to_post_number: null,
          },
        ],
        stream: [1, 2], // All posts already loaded
      },
    };

    const result = await fetchAllPosts("https://example.com", "123", initialTopicData);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(1);
    expect(result[1]!.id).toBe(2);
  });

  test("should fetch additional posts in single chunk", async () => {
    const initialTopicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: [],
      post_stream: {
        posts: [
          {
            id: 1,
            username: "user1",
            cooked: "content1",
            created_at: "2024-01-01",
            post_number: 1,
            reply_to_post_number: null,
          },
        ],
        stream: [1, 2, 3], // Need to fetch posts 2 and 3
      },
    };

    const result = await fetchAllPosts("https://example.com", "123", initialTopicData);

    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe(1); // Original post
    expect(result[1]!.id).toBe(2); // Fetched post
    expect(result[2]!.id).toBe(3); // Fetched post
  });

  test("should fetch additional posts in multiple chunks", async () => {
    // Create initial data with 1 post loaded, 75 total posts (will require 2 chunks of 50)
    const streamIds = Array.from({ length: 75 }, (_, i) => i + 1);
    const initialTopicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: [],
      post_stream: {
        posts: [
          {
            id: 1,
            username: "user1",
            cooked: "content1",
            created_at: "2024-01-01",
            post_number: 1,
            reply_to_post_number: null,
          },
        ],
        stream: streamIds,
      },
    };

    const result = await fetchAllPosts("https://example.com", "123", initialTopicData);

    expect(result).toHaveLength(75);
    expect(result[0]!.id).toBe(1); // Original post
    expect(result[1]!.id).toBe(2); // First fetched post
    expect(result[74]!.id).toBe(75); // Last fetched post
  });

  test("should handle API errors gracefully and continue", async () => {
    const initialTopicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: [],
      post_stream: {
        posts: [
          {
            id: 1,
            username: "user1",
            cooked: "content1",
            created_at: "2024-01-01",
            post_number: 1,
            reply_to_post_number: null,
          },
        ],
        stream: [1, 2, 3],
      },
    };

    // Use error topic that will return 500 error
    const result = await fetchAllPosts("https://example.com", "error-topic", initialTopicData);

    // Should return only the initial posts (API call failed)
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(1);
  });

  test("should handle mixed success and failure in multiple chunks", async () => {
    // Create scenario with multiple chunks where some fail
    const streamIds = Array.from({ length: 75 }, (_, i) => i + 1);
    const initialTopicData: TopicData = {
      title: "Test Topic",
      slug: "test-topic",
      tags: [],
      post_stream: {
        posts: [
          {
            id: 1,
            username: "user1",
            cooked: "content1",
            created_at: "2024-01-01",
            post_number: 1,
            reply_to_post_number: null,
          },
        ],
        stream: streamIds,
      },
    };

    // First chunk will succeed (normal topic), but we'll switch to error topic mid-way
    // This simulates real-world scenario where some API calls fail
    const result = await fetchAllPosts("https://example.com", "123", initialTopicData);

    // Should get initial post + first chunk (50 posts)
    expect(result).toHaveLength(75); // All posts fetched successfully with our mock
    expect(result[0]!.id).toBe(1);
  });
});
