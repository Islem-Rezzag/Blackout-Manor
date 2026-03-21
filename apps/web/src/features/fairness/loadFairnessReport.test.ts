import { describe, expect, it } from "vitest";

import { loadFairnessReport } from "./loadFairnessReport";

describe("loadFairnessReport", () => {
  it("loads a fairness export that includes replay-backed EQ metrics", async () => {
    const { report, source } = await loadFairnessReport();

    expect(["latest", "sample"]).toContain(source);
    expect(
      report.eqMetrics.contradictionHandling.contradictionCount,
    ).toBeTypeOf("number");
    expect(
      report.eqMetrics.falseAccusationRecovery.falseAccusationCount,
    ).toBeTypeOf("number");
    expect(report.eqMetrics.witnessStabilization.stabilizationRate).toBeTypeOf(
      "number",
    );
    expect(report.eqMetrics.promiseIntegrity.promiseCount).toBeTypeOf("number");
    expect(report.eqMetrics.allianceShift.allianceEpisodeCount).toBeTypeOf(
      "number",
    );
    expect(
      report.eqMetrics.evidenceGroundedAccusationQuality.groundedPrecision,
    ).toBeTypeOf("number");
    expect(report.eqMetrics.meetingInfluenceQuality.influenceScore).toBeTypeOf(
      "number",
    );
  });
});
