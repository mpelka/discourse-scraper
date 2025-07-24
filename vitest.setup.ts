import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./__mocks__/node";

// Global mock for ora to prevent spinner output in any test
vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Clean up after tests are finished
afterAll(() => server.close());
