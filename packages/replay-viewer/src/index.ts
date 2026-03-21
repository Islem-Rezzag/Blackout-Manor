export {
  AllianceShiftMetricsSchema,
  aggregateReplayEqMetrics,
  ContradictionHandlingMetricsSchema,
  createFairnessMetrics,
  createPersonaRotationSchedule,
  createReplayEqMetrics,
  EvidenceGroundedAccusationQualityMetricsSchema,
  evaluateFairnessThresholds,
  FalseAccusationRecoveryMetricsSchema,
  fairnessThresholdsPassed,
  MeetingInfluenceQualityMetricsSchema,
  PromiseIntegrityMetricsSchema,
  ReplayEqMetricsSchema,
  runInstrumentedSimulation,
  runSeedSwapTournament,
  WitnessStabilizationMetricsSchema,
} from "./analytics";
export type * from "./analytics/types";
export { extractReplayHighlights } from "./highlights";
export {
  parseSavedReplayEnvelope,
  ReplayHighlightMarkerSchema,
  SavedReplayEnvelopeSchema,
} from "./schemas";
export {
  createSavedReplayEnvelope,
  createSavedReplaySummary,
  deserializeSavedReplayEnvelope,
  serializeSavedReplayEnvelope,
} from "./serializer";
export {
  getRegressionSeedPack,
  runBatchSimulations,
  runHeadlessSimulation,
  runRegressionSeedPack,
} from "./simulation";
export type * from "./types";

export const replayViewerPackageManifest = {
  name: "@blackout-manor/replay-viewer",
  status: "ready",
  defaultFormatVersion: "1.0.0",
  smokeSeed: 7,
  sampleReplayId: "replay-manifest-sample-7",
} as const;
