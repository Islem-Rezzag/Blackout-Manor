import type { EngineReplayLog } from "@blackout-manor/engine";

import { extractReplayHighlights } from "./highlights";
import { parseSavedReplayEnvelope } from "./schemas";
import type { SavedReplayEnvelope, SavedReplaySummary } from "./types";

export const createSavedReplaySummary = (
  replay: EngineReplayLog,
  highlightCount: number,
): SavedReplaySummary => ({
  replayId: replay.replayId,
  matchId: replay.matchId,
  seed: replay.seed,
  finalTick: replay.frames.at(-1)?.tick ?? 0,
  totalEvents: replay.events.length,
  totalHighlights: highlightCount,
  winner: replay.frames.at(-1)?.winner ?? null,
});

export const createSavedReplayEnvelope = (
  replay: EngineReplayLog,
  options?: { exportedAt?: string },
): SavedReplayEnvelope => {
  const highlights = extractReplayHighlights(replay);
  const exportedAt = options?.exportedAt ?? new Date().toISOString();

  return {
    formatVersion: "1.0.0",
    exportedAt,
    replay,
    highlights,
    summary: createSavedReplaySummary(replay, highlights.length),
  };
};

export const serializeSavedReplayEnvelope = (
  replayOrEnvelope: EngineReplayLog | SavedReplayEnvelope,
  options?: { exportedAt?: string; pretty?: boolean },
) => {
  const envelope =
    "formatVersion" in replayOrEnvelope
      ? replayOrEnvelope
      : createSavedReplayEnvelope(replayOrEnvelope, {
          ...(options?.exportedAt ? { exportedAt: options.exportedAt } : {}),
        });

  return JSON.stringify(
    envelope,
    null,
    options?.pretty === false ? undefined : 2,
  );
};

export const deserializeSavedReplayEnvelope = (payload: string) =>
  parseSavedReplayEnvelope(JSON.parse(payload));
