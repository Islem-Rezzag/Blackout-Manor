import {
  runHeadlessSimulation,
  serializeSavedReplayEnvelope,
} from "../packages/replay-viewer/src/index";
import { getNumberArg, getStringArg, parseCliArgs } from "./lib/cli";
import { buildReplayOutputPath, writeJsonFile } from "./lib/io";

const getSimulationMode = (value: string | undefined) => {
  if (value === "showcase") {
    return "showcase" as const;
  }

  if (value === "fast") {
    return "fast" as const;
  }

  return "headless" as const;
};

const args = parseCliArgs(process.argv.slice(2));
const seed = getNumberArg(args, "seed", 17) ?? 17;
const mode = getSimulationMode(getStringArg(args, "mode", "headless"));
const matchId =
  getStringArg(args, "match-id", `${mode}-${seed}`) ?? `${mode}-${seed}`;
const outputDirectory =
  getStringArg(args, "out-dir", "artifacts/replays") ?? "artifacts/replays";
const outputPath =
  getStringArg(args, "out") ?? buildReplayOutputPath(outputDirectory, matchId);

const result = runHeadlessSimulation({
  seed,
  matchId,
  mode,
});
const replayPath = writeJsonFile(
  outputPath,
  serializeSavedReplayEnvelope(result.envelope),
);

console.info(`mode: ${mode}`);
console.info(`seed: ${seed}`);
console.info(`match: ${matchId}`);
console.info(`winner: ${result.summary.winner?.team ?? "unresolved"}`);
console.info(`events: ${result.summary.totalEvents}`);
console.info(`highlights: ${result.summary.totalHighlights}`);
console.info(`replay: ${replayPath}`);
