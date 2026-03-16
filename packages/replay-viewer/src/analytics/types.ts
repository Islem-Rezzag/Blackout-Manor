import type { AgentDecisionResolvedTrace } from "@blackout-manor/agents";
import type {
  EngineEvent,
  EngineReplayLog,
  EngineWinner,
} from "@blackout-manor/engine";
import type { PlayerId, RoleId, TeamId } from "@blackout-manor/shared";

export type PersonaRotationAssignment = {
  playerId: PlayerId;
  displayName: string;
  personaId: string;
  slotIndex: number;
};

export type PersonaRotationScheduleEntry = {
  entryId: string;
  matchId: string;
  baseSeed: number;
  matchSeed: number;
  rotationIndex: number;
  slotOffset: number;
  variant: "forward" | "swapped";
  assignments: PersonaRotationAssignment[];
};

export type FairnessThreshold = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

export type FairnessThresholdCheck = FairnessThreshold & {
  actual: number;
  pass: boolean;
};

export type TeamWinRate = {
  teamId: TeamId;
  wins: number;
  matches: number;
  winRate: number;
};

export type RoleNormalizedWinRate = {
  roleId: RoleId;
  appearances: number;
  wins: number;
  winRate: number;
};

export type PersonaRoleCoverage = {
  personaId: string;
  displayName: string;
  appearances: number;
  shadowAppearances: number;
  householdAppearances: number;
  roleCounts: Record<RoleId, number>;
  winsByRole: Record<RoleId, number>;
};

export type SuspicionCalibrationBucket = {
  bucketLabel: string;
  range: {
    min: number;
    max: number;
  };
  sampleCount: number;
  meanPrediction: number;
  actualShadowRate: number;
  absoluteError: number;
};

export type SuspicionCalibrationMetrics = {
  sampleCount: number;
  brierScore: number;
  meanShadowScore: number;
  meanHouseholdScore: number;
  buckets: SuspicionCalibrationBucket[];
};

export type RateMetric = {
  numerator: number;
  denominator: number;
  rate: number;
};

export type PromiseBreakCostMetrics = {
  breakCount: number;
  averageTrustDrop: number;
  averageSuspectIncrease: number;
  publicPenaltyRate: number;
  compositeCost: number;
};

export type FalseAccusationRepairMetrics = {
  repairCount: number;
  averageTrustRepair: number;
  averageSuspectRepair: number;
  repairScore: number;
};

export type TomPredictionMetrics = {
  sampleCount: number;
  brierScore: number;
  hitRate: number;
};

export type FairnessMetrics = {
  suspicionCalibration: SuspicionCalibrationMetrics;
  evidenceGroundedAccusationRate: RateMetric;
  promiseBreakCost: PromiseBreakCostMetrics;
  witnessStabilizationRate: RateMetric;
  falseAccusationRepairScore: FalseAccusationRepairMetrics;
  tomPredictionBrier: TomPredictionMetrics;
};

export type FairnessRunSummary = {
  matchId: string;
  baseSeed: number;
  matchSeed: number;
  rotationIndex: number;
  slotOffset: number;
  variant: "forward" | "swapped";
  winner: EngineWinner | null;
  finalTick: number;
  roleAssignments: Array<{
    playerId: PlayerId;
    roleId: RoleId;
    teamId: TeamId;
    personaId: string;
    displayName: string;
  }>;
  metrics: {
    accusations: number;
    evidenceGroundedAccusations: number;
    promiseBreaks: number;
    falseAccusations: number;
    repairs: number;
  };
};

export type TournamentFairnessReport = {
  formatVersion: "1.0.0";
  generatedAt: string;
  simulationCount: number;
  passed: boolean;
  thresholds: FairnessThresholdCheck[];
  schedule: {
    baseSeeds: number[];
    rotationPairsPerSeed: number;
    scheduleEntries: PersonaRotationScheduleEntry[];
  };
  overallWinRates: TeamWinRate[];
  roleNormalizedWinRates: RoleNormalizedWinRate[];
  specialRoleSwing: {
    investigator: number;
    steward: number;
  };
  personaCoverage: PersonaRoleCoverage[];
  metrics: FairnessMetrics;
  runs: FairnessRunSummary[];
};

export type TournamentDecisionTrace = AgentDecisionResolvedTrace & {
  sequence: number;
  actorRole: RoleId;
  actorTeam: TeamId;
  actorDisplayName: string;
  actorPersonaId: string;
  actionTargetPlayerId?: PlayerId;
};

export type InstrumentedSimulationRun = {
  scheduleEntry: PersonaRotationScheduleEntry;
  replay: EngineReplayLog;
  winner: EngineWinner | null;
  traces: TournamentDecisionTrace[];
  events: EngineEvent[];
};

export type SeedSwapTournamentOptions = {
  baseSeeds: readonly number[];
  rotationPairsPerSeed?: number;
  matchPrefix?: string;
  maxRuns?: number;
  nowIso?: string;
};

export type SeedSwapTournamentResult = {
  report: TournamentFairnessReport;
  runs: InstrumentedSimulationRun[];
};
