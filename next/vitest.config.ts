import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // Make test globals (describe, it, expect, vi) available without importing
    globals: true,
  },
  resolve: {
    alias: {
      // Mirror tsconfig paths so @/ imports resolve in tests
      "@": path.resolve(__dirname, "."),
    },
  },
});
