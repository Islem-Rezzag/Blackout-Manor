import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const workspaceRoot = resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@blackout-manor/client-game": resolve(
        workspaceRoot,
        "packages/client-game/src/index.ts",
      ),
      "@blackout-manor/content": resolve(
        workspaceRoot,
        "packages/content/src/index.ts",
      ),
      "@blackout-manor/engine": resolve(
        workspaceRoot,
        "packages/engine/src/index.ts",
      ),
      "@blackout-manor/replay-viewer": resolve(
        workspaceRoot,
        "packages/replay-viewer/src/index.ts",
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
