import type { EngineReplayLog, EngineWinner } from "@blackout-manor/engine";
import type { PlayerId } from "@blackout-manor/shared";

export const REPLAY_HIGHLIGHT_KIND_IDS = [
  "betrayal",
  "report",
  "promise-break",
  "wrong-vote",
  "clutch-save",
] as const;

export type ReplayHighlightKind = (typeof REPLAY_HIGHLIGHT_KIND_IDS)[number];

export type ReplayHighlightMarker = {
  id: string;
  kind: ReplayHighlightKind;
  tick: number;
  sequence: number;
  title: string;
  description: string;
  playersInvolved: PlayerId[];
  metadata: Record<string, string | number | boolean | null>;
};

export type SavedReplaySummary = {
  replayId: string;
  matchId: string;
  seed: number;
  finalTick: number;
  totalEvents: number;
  totalHighlights: number;
  winner: EngineWinner | null;
};

export type SavedReplayEnvelope = {
  formatVersion: "1.0.0";
  exportedAt: string;
  replay: EngineReplayLog;
  highlights: ReplayHighlightMarker[];
  summary: SavedReplaySummary;
};

export type SimulationMode = "showcase" | "fast" | "headless";

export type HeadlessSimulationOptions = {
  seed: number;
  matchId?: string;
  maxTicks?: number;
  nowIso?: string;
  mode?: SimulationMode;
};

export type HeadlessSimulationResult = {
  replay: EngineReplayLog;
  envelope: SavedReplayEnvelope;
  highlights: ReplayHighlightMarker[];
  summary: SavedReplaySummary;
};

export type BatchSimulationOptions = {
  seeds: readonly number[];
  matchPrefix?: string;
  nowIso?: string;
};

export type BatchSimulationResult = {
  runs: HeadlessSimulationResult[];
  seedCount: number;
  winCounts: Record<string, number>;
};

export type SeedPackName = "smoke" | "regression" | "balance";

export type RegressionSeedPack = {
  name: SeedPackName;
  seeds: readonly number[];
};
