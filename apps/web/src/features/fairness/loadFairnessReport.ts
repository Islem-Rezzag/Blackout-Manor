import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { TournamentFairnessReport } from "@blackout-manor/replay-viewer";

const loadJson = async (filePath: string) => {
  const payload = await readFile(filePath, "utf8");
  return JSON.parse(payload) as TournamentFairnessReport;
};

export const loadFairnessReport = async () => {
  const latestPath = resolve(
    process.cwd(),
    "public",
    "data",
    "fairness-report.latest.json",
  );
  const samplePath = resolve(
    process.cwd(),
    "public",
    "data",
    "fairness-report.sample.json",
  );

  try {
    return {
      report: await loadJson(latestPath),
      source: "latest" as const,
    };
  } catch {
    return {
      report: await loadJson(samplePath),
      source: "sample" as const,
    };
  }
};
