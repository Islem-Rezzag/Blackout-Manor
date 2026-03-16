import type {
  PlayerId,
  RelationshipState,
  RoleId,
} from "@blackout-manor/shared";

export type RelationshipDelta = Partial<
  Record<keyof RelationshipState, number>
>;

export type PromiseLedgerStatus = "open" | "kept" | "broken";

export type PromiseLedgerEntry = {
  id: string;
  promiserId: PlayerId;
  promiseeId: PlayerId;
  text: string;
  createdAtTick: number;
  status: PromiseLedgerStatus;
  resolvedAtTick?: number;
  resolutionReason?: string;
};

export type BetrayalKind =
  | "broken-promise"
  | "false-accusation"
  | "abandoned-vote"
  | "revealed-lie";

export type BetrayalRecord = {
  id: string;
  kind: BetrayalKind;
  tick: number;
  sourcePlayerId: PlayerId;
  targetPlayerId: PlayerId;
  severity: number;
  summary: string;
};

export type SocialClaim = {
  id: string;
  playerId: PlayerId;
  key: string;
  value: string;
  tick: number;
  summary: string;
  sourceText: string;
};

export type ContradictionRecord = {
  id: string;
  playerId: PlayerId;
  claimKey: string;
  previousValue: string;
  currentValue: string;
  firstTick: number;
  latestTick: number;
  severity: number;
  summary: string;
};

export type TheoryOfMindSignal = {
  suspicionByTarget: Record<PlayerId, number>;
  supportByTarget: Record<PlayerId, number>;
  lastAccusationTarget: PlayerId | null;
  lastSupportTarget: PlayerId | null;
};

export type PlayerBeliefEstimate = {
  playerId: PlayerId;
  likelyBeliefs: Array<{
    playerId: PlayerId;
    suspectScore: number;
    likelyRole: RoleId | "unknown";
  }>;
  suspicionOfMe: number;
  supportOfMe: number;
  likelyAllies: PlayerId[];
  likelyNextAccusationTarget: PlayerId | null;
};

export type SocialReflection = {
  trustSummary: string;
  fearSummary: string;
  roomThinksOfMeSummary: string;
  nextMeetingNarrativeSummary: string;
};

export type SocialReasoningState = {
  selfId: PlayerId;
  playerIds: PlayerId[];
  displayNames: Record<PlayerId, string>;
  relationships: Record<PlayerId, RelationshipState>;
  promiseLedger: PromiseLedgerEntry[];
  betrayals: BetrayalRecord[];
  contradictions: ContradictionRecord[];
  trackedClaims: Record<PlayerId, Record<string, SocialClaim>>;
  tomSignals: Record<PlayerId, TheoryOfMindSignal>;
  tom: Record<PlayerId, PlayerBeliefEstimate>;
  reflection: SocialReflection;
  lastUpdatedTick: number;
};

export type SocialReasoningSeed = {
  selfId: PlayerId;
  players: Array<{
    id: PlayerId;
    displayName: string;
  }>;
  initialRelationships?: Record<PlayerId, RelationshipState>;
};

export type SpeechInterpretation = {
  claims: SocialClaim[];
  accusationTargetIds: PlayerId[];
  supportTargetIds: PlayerId[];
};

export type SocialReasoningSnapshot = {
  reflection: SocialReflection;
  relationships: Record<PlayerId, RelationshipState>;
  relationshipFocus: Array<{
    playerId: PlayerId;
    trust: number;
    fear: number;
    suspectScore: number;
    predictedSuspicionOfMe: number;
  }>;
  openPromises: PromiseLedgerEntry[];
  recentBetrayals: BetrayalRecord[];
  contradictions: ContradictionRecord[];
  tomFocus: PlayerBeliefEstimate[];
};
