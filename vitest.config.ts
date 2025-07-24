import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test file patterns
    include: ["src/**/*.test.ts"],

    // Environment for DOM testing
    environment: "happy-dom",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "__mocks__/**/*"],
      thresholds: {
        functions: 70,
        lines: 60,
        branches: 60,
        statements: 60,
      },
    },

    // Global test configuration
    globals: false, // Use explicit imports for better tree-shaking

    // Setup files for MSW integration
    setupFiles: ["./vitest.setup.ts"],
  },
});
