import { describe, expect, it } from "vitest";

import {
  createPersonaRotationSchedule,
  evaluateFairnessThresholds,
  fairnessThresholdsPassed,
  runSeedSwapTournament,
} from "./index";

describe("fairness analytics", () => {
  it("rotates personas across all slot offsets for one seed block", () => {
    const schedule = createPersonaRotationSchedule([101], {
      rotationPairsPerSeed: 5,
      matchPrefix: "rotation",
    });

    expect(schedule).toHaveLength(10);

    const slotZeroPersonaIds = new Set(
      schedule.map((entry) => entry.assignments[0]?.personaId),
    );

    expect(slotZeroPersonaIds.size).toBe(10);
  });

  it("produces a fairness report for a small seed-swap tournament", async () => {
    const tournament = await runSeedSwapTournament({
      baseSeeds: [111],
      rotationPairsPerSeed: 5,
      matchPrefix: "fairness-test",
      maxRuns: 10,
      nowIso: "2026-03-15T12:00:00.000Z",
    });

    expect(tournament.report.simulationCount).toBe(10);
    expect(tournament.report.schedule.scheduleEntries).toHaveLength(10);
    expect(tournament.report.roleNormalizedWinRates).toHaveLength(4);
    expect(
      tournament.report.eqMetrics.contradictionHandling.contradictionCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      tournament.report.eqMetrics.promiseIntegrity.promiseCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      tournament.report.eqMetrics.meetingInfluenceQuality.influenceScore,
    ).toBeGreaterThanOrEqual(-1);
    expect(
      tournament.report.metrics.suspicionCalibration.sampleCount,
    ).toBeGreaterThan(0);
    expect(
      tournament.report.metrics.tomPredictionBrier.sampleCount,
    ).toBeGreaterThan(0);
  }, 90_000);

  it("flags failing official fairness thresholds", () => {
    const thresholds = evaluateFairnessThresholds({
      overallWinRates: [
        { teamId: "household", wins: 9, matches: 10, winRate: 0.9 },
        { teamId: "shadow", wins: 1, matches: 10, winRate: 0.1 },
      ],
      specialRoleSwing: {
        investigator: 0.22,
        steward: 0.14,
      },
    });

    expect(thresholds.some((threshold) => !threshold.pass)).toBe(true);
    expect(fairnessThresholdsPassed(thresholds)).toBe(false);
  });
});
