import { describe, expect, test } from "vitest";
import { buildConversationTree } from "../index";
import type { Post } from "../types";

describe("buildConversationTree", () => {
  test("should handle single original post", () => {
    const posts: Post[] = [
      {
        id: 1,
        username: "author",
        cooked: "original post",
        created_at: "2023-01-01",
        post_number: 1,
        reply_to_post_number: null,
      },
    ] as const;

    const result = buildConversationTree(posts);

    expect(result.postMap.size).toBe(1);
    expect(result.postMap.get(1)).toBe(posts[0]!);
    expect(result.childrenMap.size).toBe(0);
    expect(result.topLevelPosts).toEqual([]);
  });

  test("should organize posts with replies", () => {
    const posts: Post[] = [
      {
        id: 1,
        username: "author",
        cooked: "original",
        created_at: "2023-01-01",
        post_number: 1,
        reply_to_post_number: null,
      },
      {
        id: 2,
        username: "user1",
        cooked: "reply to original",
        created_at: "2023-01-02",
        post_number: 2,
        reply_to_post_number: 1,
      },
    ] as const;

    const result = buildConversationTree(posts);

    expect(result.postMap.size).toBe(2);
    expect(result.childrenMap.get(1)).toEqual([posts[1]!]);
    expect(result.topLevelPosts).toEqual([]);
  });

  test("should identify top-level posts", () => {
    const posts: Post[] = [
      {
        id: 1,
        username: "author",
        cooked: "original",
        created_at: "2023-01-01",
        post_number: 1,
        reply_to_post_number: null,
      },
      {
        id: 2,
        username: "user1",
        cooked: "top level comment",
        created_at: "2023-01-02",
        post_number: 2,
        reply_to_post_number: null,
      },
    ] as const;

    const result = buildConversationTree(posts);

    expect(result.postMap.size).toBe(2);
    expect(result.childrenMap.size).toBe(0);
    expect(result.topLevelPosts).toEqual([posts[1]!]);
  });

  test("should sort children and top-level posts by post_number", () => {
    const posts: Post[] = [
      {
        id: 1,
        username: "author",
        cooked: "original",
        created_at: "2023-01-01",
        post_number: 1,
        reply_to_post_number: null,
      },
      {
        id: 4,
        username: "user3",
        cooked: "top level 4",
        created_at: "2023-01-04",
        post_number: 4,
        reply_to_post_number: null,
      },
      {
        id: 3,
        username: "user2",
        cooked: "reply 3",
        created_at: "2023-01-03",
        post_number: 3,
        reply_to_post_number: 1,
      },
      {
        id: 2,
        username: "user1",
        cooked: "top level 2",
        created_at: "2023-01-02",
        post_number: 2,
        reply_to_post_number: null,
      },
      {
        id: 5,
        username: "user4",
        cooked: "reply 5",
        created_at: "2023-01-05",
        post_number: 5,
        reply_to_post_number: 1,
      },
    ] as const;

    const result = buildConversationTree(posts);

    // Top-level posts should be sorted by post_number
    expect(result.topLevelPosts.map((p) => p.post_number)).toEqual([2, 4]);

    // Children should be sorted by post_number
    const childrenOfPost1 = result.childrenMap.get(1);
    expect(childrenOfPost1?.map((p) => p.post_number)).toEqual([3, 5]);
  });
});
