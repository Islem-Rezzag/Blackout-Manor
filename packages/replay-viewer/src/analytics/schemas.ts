import { z } from "zod";

const nonNegativeIntegerSchema = z.number().int().nonnegative();
const normalizedRateSchema = z.number().min(0).max(1);

export const ContradictionHandlingMetricsSchema = z
  .object({
    contradictionCount: nonNegativeIntegerSchema,
    handledCount: nonNegativeIntegerSchema,
    explicitCalloutCount: nonNegativeIntegerSchema,
    ignoredCount: nonNegativeIntegerSchema,
    handlingRate: normalizedRateSchema,
  })
  .strict();

export const FalseAccusationRecoveryMetricsSchema = z
  .object({
    falseAccusationCount: nonNegativeIntegerSchema,
    repairAttemptCount: nonNegativeIntegerSchema,
    recoveredCount: nonNegativeIntegerSchema,
    redirectedVoteCount: nonNegativeIntegerSchema,
    recoveryRate: normalizedRateSchema,
  })
  .strict();

export const WitnessStabilizationMetricsSchema = z
  .object({
    reportCount: nonNegativeIntegerSchema,
    calmingAttemptCount: nonNegativeIntegerSchema,
    stabilizedCount: nonNegativeIntegerSchema,
    stabilizationRate: normalizedRateSchema,
  })
  .strict();

export const PromiseIntegrityMetricsSchema = z
  .object({
    promiseCount: nonNegativeIntegerSchema,
    keptCount: nonNegativeIntegerSchema,
    brokenCount: nonNegativeIntegerSchema,
    unresolvedCount: nonNegativeIntegerSchema,
    keptRate: normalizedRateSchema,
    brokenRate: normalizedRateSchema,
  })
  .strict();

export const AllianceShiftMetricsSchema = z
  .object({
    allianceEpisodeCount: nonNegativeIntegerSchema,
    shiftCount: nonNegativeIntegerSchema,
    betrayalShiftCount: nonNegativeIntegerSchema,
    volatilityRate: normalizedRateSchema,
  })
  .strict();

export const EvidenceGroundedAccusationQualityMetricsSchema = z
  .object({
    accusationCount: nonNegativeIntegerSchema,
    groundedCount: nonNegativeIntegerSchema,
    groundedRate: normalizedRateSchema,
    groundedShadowHitCount: nonNegativeIntegerSchema,
    groundedShadowHitRate: normalizedRateSchema,
    groundedPrecision: normalizedRateSchema,
  })
  .strict();

export const MeetingInfluenceQualityMetricsSchema = z
  .object({
    speechTurnCount: nonNegativeIntegerSchema,
    influentialTurnCount: nonNegativeIntegerSchema,
    alignedVoteCount: nonNegativeIntegerSchema,
    correctInfluenceCount: nonNegativeIntegerSchema,
    misleadingInfluenceCount: nonNegativeIntegerSchema,
    influenceScore: z.number().min(-1).max(1),
  })
  .strict();

export const ReplayEqMetricsSchema = z
  .object({
    contradictionHandling: ContradictionHandlingMetricsSchema,
    falseAccusationRecovery: FalseAccusationRecoveryMetricsSchema,
    witnessStabilization: WitnessStabilizationMetricsSchema,
    promiseIntegrity: PromiseIntegrityMetricsSchema,
    allianceShift: AllianceShiftMetricsSchema,
    evidenceGroundedAccusationQuality:
      EvidenceGroundedAccusationQualityMetricsSchema,
    meetingInfluenceQuality: MeetingInfluenceQualityMetricsSchema,
  })
  .strict();
