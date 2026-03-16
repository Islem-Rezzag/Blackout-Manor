import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const writeJsonFile = (outputPath: string, payload: string) => {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, payload, "utf8");
  return resolvedPath;
};

export const buildReplayOutputPath = (
  directory: string,
  matchId: string,
  suffix = ".replay.json",
) => resolve(directory, `${matchId}${suffix}`);
