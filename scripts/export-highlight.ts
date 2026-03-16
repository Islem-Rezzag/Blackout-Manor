import { readFileSync } from "node:fs";

import {
  deserializeSavedReplayEnvelope,
  extractReplayHighlights,
} from "../packages/replay-viewer/src/index";
import { getStringArg, parseCliArgs } from "./lib/cli";
import { buildReplayOutputPath, writeJsonFile } from "./lib/io";

const args = parseCliArgs(process.argv.slice(2));
const inputPath = getStringArg(args, "input");

if (!inputPath) {
  throw new Error("Missing --input path to a saved replay envelope.");
}

const outputPath =
  getStringArg(args, "out") ??
  buildReplayOutputPath("artifacts/highlights", "highlight-export", ".json");
const savedReplay = deserializeSavedReplayEnvelope(
  readFileSync(inputPath, "utf8"),
);
const highlights = extractReplayHighlights(savedReplay.replay);
const writtenPath = writeJsonFile(
  outputPath,
  JSON.stringify(highlights, null, 2),
);

console.info(`input: ${inputPath}`);
console.info(`markers: ${highlights.length}`);
console.info(`output: ${writtenPath}`);
