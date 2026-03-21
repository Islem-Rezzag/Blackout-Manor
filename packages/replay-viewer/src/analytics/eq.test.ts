import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { deserializeSavedReplayEnvelope } from "../serializer";
import { createReplayEqMetrics } from "./eq";
import { ReplayEqMetricsSchema } from "./schemas";

const fixturePayload = readFileSync(
  new URL("../fixtures/eq-replay.json", import.meta.url),
  "utf8",
);

const fixtureReplay = deserializeSavedReplayEnvelope(fixturePayload).replay;

describe("replay EQ metrics", () => {
  it("derives contradiction handling from public replay speech and follow-up actions", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.contradictionHandling).toEqual({
      contradictionCount: 1,
      handledCount: 1,
      explicitCalloutCount: 0,
      ignoredCount: 0,
      handlingRate: 1,
    });
  });

  it("measures false accusation recovery without using private reasoning", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.falseAccusationRecovery).toEqual({
      falseAccusationCount: 4,
      repairAttemptCount: 1,
      recoveredCount: 1,
      redirectedVoteCount: 1,
      recoveryRate: 0.25,
    });
  });

  it("measures witness calming and stabilization from report and meeting actions", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.witnessStabilization).toEqual({
      reportCount: 1,
      calmingAttemptCount: 1,
      stabilizedCount: 1,
      stabilizationRate: 1,
    });
  });

  it("tracks promise keeping, promise breaking, and alliance shifts", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.promiseIntegrity).toEqual({
      promiseCount: 2,
      keptCount: 1,
      brokenCount: 1,
      unresolvedCount: 0,
      keptRate: 0.5,
      brokenRate: 0.5,
    });
    expect(metrics.allianceShift).toEqual({
      allianceEpisodeCount: 4,
      shiftCount: 1,
      betrayalShiftCount: 1,
      volatilityRate: 0.25,
    });
  });

  it("scores evidence-grounded accusation quality from replay-visible evidence only", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.evidenceGroundedAccusationQuality).toEqual({
      accusationCount: 8,
      groundedCount: 4,
      groundedRate: 0.5,
      groundedShadowHitCount: 4,
      groundedShadowHitRate: 0.5,
      groundedPrecision: 1,
    });
  });

  it("measures meeting influence from public meeting speech and later votes", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(metrics.meetingInfluenceQuality).toEqual({
      speechTurnCount: 2,
      influentialTurnCount: 2,
      alignedVoteCount: 3,
      correctInfluenceCount: 1,
      misleadingInfluenceCount: 1,
      influenceScore: 0,
    });
  });

  it("validates the combined EQ metrics payload with the public schema", () => {
    const metrics = createReplayEqMetrics(fixtureReplay);

    expect(() => ReplayEqMetricsSchema.parse(metrics)).not.toThrow();
  });
});
