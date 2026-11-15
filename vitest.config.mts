import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/services/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}"],
      reporter: ["text", "html"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});