import { HttpResponse, http } from "msw";
import type { Post } from "../src/types";

// Mock data generator for posts
function createMockPost(id: number, postNumber: number): Post {
  return {
    id,
    username: `user${id}`,
    cooked: `<p>Mock post content for post ${id}</p>`,
    created_at: `2024-01-01T10:${String(id % 60).padStart(2, "0")}:00Z`,
    post_number: postNumber,
    reply_to_post_number: null,
    link_counts:
      id % 3 === 0
        ? [{ url: "https://external.com", internal: false, reflection: false, title: "External Link", clicks: 1 }]
        : undefined,
  };
}

export const handlers = [
  // Mock error scenario for specific topic (must come first to catch specific cases)
  http.get("*/t/error-topic/posts.json", () => {
    return HttpResponse.json({ error: "Internal server error" }, { status: 500 });
  }),

  // Mock network timeout scenario
  http.get("*/t/timeout-topic/posts.json", () => {
    return new Promise(() => {
      // Never resolve to simulate timeout
    });
  }),

  // Mock Discourse posts.json endpoint (general case)
  http.get("*/t/:topicId/posts.json", ({ request, params }) => {
    const url = new URL(request.url);
    const postIds = url.searchParams.getAll("post_ids[]");

    // If no post_ids specified, return empty
    if (postIds.length === 0) {
      return HttpResponse.json({
        post_stream: {
          posts: [],
        },
      });
    }

    // Generate mock posts for the requested IDs
    const posts = postIds.map((idStr, index) => {
      const id = parseInt(idStr, 10);
      return createMockPost(id, id);
    });

    return HttpResponse.json({
      post_stream: {
        posts,
      },
    });
  }),
];
