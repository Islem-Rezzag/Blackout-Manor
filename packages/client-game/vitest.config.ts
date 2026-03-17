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
      "@blackout-manor/replay-viewer": resolve(
        workspaceRoot,
        "packages/replay-viewer/src/index.ts",
      ),
      "@blackout-manor/replay-viewer/schemas": resolve(
        workspaceRoot,
        "packages/replay-viewer/src/schemas.ts",
      ),
    },
  },
  test: {
    environment: "node",
  },
});
