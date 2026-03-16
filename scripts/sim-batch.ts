import {
  runBatchSimulations,
  serializeSavedReplayEnvelope,
} from "../packages/replay-viewer/src/index";
import {
  getCsvNumberArg,
  getNumberArg,
  getStringArg,
  parseCliArgs,
} from "./lib/cli";
import { buildReplayOutputPath, writeJsonFile } from "./lib/io";

const args = parseCliArgs(process.argv.slice(2));
const explicitSeeds = getCsvNumberArg(args, "seeds");
const startSeed = getNumberArg(args, "start", 101) ?? 101;
const count = getNumberArg(args, "count", 5) ?? 5;
const seeds =
  explicitSeeds.length > 0
    ? explicitSeeds
    : Array.from({ length: count }, (_, index) => startSeed + index);
const outputDirectory =
  getStringArg(args, "out-dir", "artifacts/batch") ?? "artifacts/batch";
const matchPrefix = getStringArg(args, "match-prefix", "batch") ?? "batch";
const writeReplays = args.get("write-replays") === true;

const result = runBatchSimulations({
  seeds,
  matchPrefix,
});

if (writeReplays) {
  for (const run of result.runs) {
    const replayPath = buildReplayOutputPath(
      outputDirectory,
      run.summary.matchId,
    );
    writeJsonFile(replayPath, serializeSavedReplayEnvelope(run.envelope));
  }
}

const summaryPath = writeJsonFile(
  buildReplayOutputPath(outputDirectory, `${matchPrefix}-summary`, ".json"),
  JSON.stringify(
    {
      seedCount: result.seedCount,
      winCounts: result.winCounts,
      runs: result.runs.map((run) => run.summary),
    },
    null,
    2,
  ),
);

console.info(`seeds: ${seeds.join(", ")}`);
console.info(`runs: ${result.seedCount}`);
console.info(`win-counts: ${JSON.stringify(result.winCounts)}`);
console.info(`replays-written: ${writeReplays ? "yes" : "no"}`);
console.info(`summary: ${summaryPath}`);
