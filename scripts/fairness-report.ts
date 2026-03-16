import { runSeedSwapTournament } from "../packages/replay-viewer/src/index";
import {
  getCsvNumberArg,
  getNumberArg,
  getStringArg,
  parseCliArgs,
} from "./lib/cli";
import { writeJsonFile } from "./lib/io";

const main = async () => {
  const args = parseCliArgs(process.argv.slice(2));
  const count = getNumberArg(args, "count", 100) ?? 100;
  const rotationPairs = getNumberArg(args, "rotation-pairs", 5) ?? 5;
  const explicitSeeds = getCsvNumberArg(args, "base-seeds");
  const startSeed = getNumberArg(args, "start", 1001) ?? 1001;
  const seedStep = getNumberArg(args, "step", 37) ?? 37;
  const baseSeedCount = Math.max(
    1,
    Math.ceil(count / Math.max(1, rotationPairs * 2)),
  );
  const baseSeeds =
    explicitSeeds.length > 0
      ? explicitSeeds
      : Array.from(
          { length: baseSeedCount },
          (_, index) => startSeed + index * seedStep,
        );
  const outputPath =
    getStringArg(
      args,
      "out",
      "artifacts/fairness/latest/fairness-report.json",
    ) ?? "artifacts/fairness/latest/fairness-report.json";
  const webOutputPath =
    getStringArg(
      args,
      "web-out",
      "apps/web/public/data/fairness-report.latest.json",
    ) ?? "apps/web/public/data/fairness-report.latest.json";
  const matchPrefix =
    getStringArg(args, "match-prefix", "fairness") ?? "fairness";
  const assertThresholds = args.get("assert-thresholds") === true;

  const tournament = await runSeedSwapTournament({
    baseSeeds,
    rotationPairsPerSeed: rotationPairs,
    matchPrefix,
    maxRuns: count,
  });
  const payload = JSON.stringify(tournament.report, null, 2);
  const reportPath = writeJsonFile(outputPath, payload);
  const dashboardPath = writeJsonFile(webOutputPath, payload);

  console.info(`base-seeds: ${baseSeeds.join(", ")}`);
  console.info(`simulation-count: ${tournament.report.simulationCount}`);
  console.info(`passed: ${tournament.report.passed}`);
  console.info(`report: ${reportPath}`);
  console.info(`dashboard: ${dashboardPath}`);

  if (assertThresholds && !tournament.report.passed) {
    console.error("Fairness thresholds failed.");
    process.exitCode = 1;
  }
};

void main();
