import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const workspaceRoot = resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@blackout-manor/content": resolve(
        workspaceRoot,
        "packages/content/src/index.ts",
      ),
      "@blackout-manor/shared": resolve(
        workspaceRoot,
        "packages/shared/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
  },
});
