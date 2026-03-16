import {
  getRegressionSeedPack,
  runRegressionSeedPack,
  type SeedPackName,
  serializeSavedReplayEnvelope,
} from "../packages/replay-viewer/src/index";
import { getStringArg, parseCliArgs } from "./lib/cli";
import { buildReplayOutputPath, writeJsonFile } from "./lib/io";

const args = parseCliArgs(process.argv.slice(2));
const packName = (getStringArg(args, "pack", "regression") ??
  "regression") as SeedPackName;
const pack = getRegressionSeedPack(packName);
const outputDirectory =
  getStringArg(args, "out-dir", `artifacts/seed-packs/${packName}`) ??
  `artifacts/seed-packs/${packName}`;

const result = runRegressionSeedPack(packName);

for (const run of result.runs) {
  const replayPath = buildReplayOutputPath(
    outputDirectory,
    run.summary.matchId,
  );
  writeJsonFile(replayPath, serializeSavedReplayEnvelope(run.envelope));
}

const suitePath = writeJsonFile(
  buildReplayOutputPath(outputDirectory, `${packName}-suite`, ".json"),
  JSON.stringify(
    {
      pack: pack.name,
      seeds: pack.seeds,
      winCounts: result.winCounts,
      runs: result.runs.map((run) => run.summary),
    },
    null,
    2,
  ),
);

console.info(`pack: ${pack.name}`);
console.info(`seeds: ${pack.seeds.join(", ")}`);
console.info(`summary: ${suitePath}`);
