import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  createSavedReplayEnvelope,
  deserializeSavedReplayEnvelope,
  extractReplayHighlights,
  replayViewerPackageManifest,
  runHeadlessSimulation,
  runRegressionSeedPack,
  serializeSavedReplayEnvelope,
} from "./index";

const fixturePayload = readFileSync(
  new URL("./fixtures/highlight-replay.json", import.meta.url),
  "utf8",
);

describe("replay-viewer package", () => {
  it("exposes a ready manifest", () => {
    expect(replayViewerPackageManifest.status).toBe("ready");
    expect(replayViewerPackageManifest.defaultFormatVersion).toBe("1.0.0");
  });

  it("round-trips saved replay envelopes", () => {
    const fixture = deserializeSavedReplayEnvelope(fixturePayload);
    const serialized = serializeSavedReplayEnvelope(fixture, {
      pretty: false,
    });
    const reparsed = deserializeSavedReplayEnvelope(serialized);

    expect(reparsed.summary).toEqual(fixture.summary);
    expect(reparsed.highlights).toEqual(fixture.highlights);
    expect(reparsed.replay.replayId).toBe("fixture-replay");
  });

  it("extracts all requested highlight marker categories from event logs", () => {
    const fixture = deserializeSavedReplayEnvelope(fixturePayload);
    const highlights = extractReplayHighlights(fixture.replay);

    expect(highlights).toEqual(fixture.highlights);
    expect(highlights.map((marker) => marker.kind)).toEqual([
      "report",
      "promise-break",
      "betrayal",
      "wrong-vote",
      "clutch-save",
    ]);
  });

  it("creates a saved replay envelope from an engine replay", () => {
    const run = runHeadlessSimulation({
      seed: 17,
      matchId: "test-run",
      nowIso: "2026-03-14T00:00:00.000Z",
      mode: "headless",
    });
    const envelope = createSavedReplayEnvelope(run.replay, {
      exportedAt: "2026-03-14T00:00:00.000Z",
    });

    expect(envelope.formatVersion).toBe("1.0.0");
    expect(envelope.summary.replayId).toBe(run.replay.replayId);
    expect(envelope.summary.totalEvents).toBe(run.replay.events.length);
  });

  it("runs deterministic headless matches from a fixed seed", () => {
    const first = runHeadlessSimulation({
      seed: 31,
      matchId: "deterministic-31",
      nowIso: "2026-03-14T00:00:00.000Z",
      mode: "headless",
    });
    const second = runHeadlessSimulation({
      seed: 31,
      matchId: "deterministic-31",
      nowIso: "2026-03-14T00:00:00.000Z",
      mode: "headless",
    });

    expect(second.summary).toEqual(first.summary);
    expect(second.highlights).toEqual(first.highlights);
    expect(second.replay.events).toEqual(first.replay.events);
  });

  it("runs regression seed packs with aggregated results", {
    timeout: 10_000,
  }, () => {
    const pack = runRegressionSeedPack("smoke", "2026-03-14T00:00:00.000Z");

    expect(pack.seedCount).toBe(3);
    expect(pack.runs).toHaveLength(3);
    expect(
      Object.values(pack.winCounts).reduce((total, count) => total + count, 0),
    ).toBe(3);
  });
});
