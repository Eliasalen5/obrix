import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      RATE_LIMIT_STORE: "memory",
    },
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
  },
});
