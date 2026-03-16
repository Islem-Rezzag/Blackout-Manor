import type {
  AgentActionProposal,
  MatchConfig,
  MatchId,
  PlayerId,
  PlayerState,
  ReplayId,
  RoleId,
  RoomId,
  RoomState,
  TaskState,
  TeamId,
} from "@blackout-manor/shared";

export const ENGINE_PHASE_IDS = [
  "intro",
  "roam",
  "report",
  "meeting",
  "vote",
  "reveal",
  "resolution",
] as const;

export const ENGINE_WIN_REASON_IDS = [
  "all-shadows-exiled",
  "shadow-parity",
  "tasks-completed",
  "hard-cap",
] as const;

export type EnginePhaseId = (typeof ENGINE_PHASE_IDS)[number];
export type EngineWinReason = (typeof ENGINE_WIN_REASON_IDS)[number];

export type EngineBootstrapPlayer = {
  id: PlayerId;
  displayName: string;
  isBot?: boolean;
};

export type EngineRoleAssignment = {
  playerId: PlayerId;
  role: RoleId;
  team: TeamId;
};

export type EngineWinner = {
  team: TeamId;
  reason: EngineWinReason;
  decidedAtTick: number;
};

export type EngineReplayFrame = {
  tick: number;
  phaseId: EnginePhaseId;
  events: EngineEvent[];
  players: PlayerState[];
  rooms: RoomState[];
  tasks: TaskState[];
  winner: EngineWinner | null;
};

export type EngineReplayLog = {
  replayId: ReplayId;
  matchId: MatchId;
  seed: number;
  config: MatchConfig;
  events: EngineEvent[];
  frames: EngineReplayFrame[];
};

export type EngineLegalityResult =
  | { isLegal: true }
  | { isLegal: false; reason: string };

export type EngineTransitionResult = {
  state: EngineState;
  events: EngineEvent[];
};

export type EngineMatchBootstrappedEvent = {
  sequence: number;
  type: "match-bootstrapped";
  tick: number;
  config: MatchConfig;
  players: EngineBootstrapPlayer[];
};

export type EngineRolesAssignedEvent = {
  sequence: number;
  type: "roles-assigned";
  tick: number;
  assignments: EngineRoleAssignment[];
  rngState: number;
};

export type EngineTickAdvancedEvent = {
  sequence: number;
  type: "tick-advanced";
  tick: number;
  nextTick: number;
};

export type EnginePhaseChangedEvent = {
  sequence: number;
  type: "phase-changed";
  tick: number;
  fromPhaseId: EnginePhaseId;
  toPhaseId: EnginePhaseId;
  reason:
    | "bootstrap"
    | "timer"
    | "report"
    | "meeting"
    | "vote"
    | "reveal"
    | "winner";
};

export type EngineActionRecordedEvent = {
  sequence: number;
  type: "action-recorded";
  tick: number;
  proposal: AgentActionProposal;
};

export type EngineVoteResolvedEvent = {
  sequence: number;
  type: "vote-resolved";
  tick: number;
  voteTotals: Record<string, number>;
  exiledPlayerId: PlayerId | null;
  skippedPlayerIds: PlayerId[];
};

export type EngineWinDeclaredEvent = {
  sequence: number;
  type: "win-declared";
  tick: number;
  winner: EngineWinner;
};

export type EngineEvent =
  | EngineMatchBootstrappedEvent
  | EngineRolesAssignedEvent
  | EngineTickAdvancedEvent
  | EnginePhaseChangedEvent
  | EngineActionRecordedEvent
  | EngineVoteResolvedEvent
  | EngineWinDeclaredEvent;

export type EngineState = {
  config: MatchConfig;
  seed: number;
  rngState: number;
  tick: number;
  phaseId: EnginePhaseId;
  phaseStartedAtTick: number;
  phaseEndsAtTick: number | null;
  currentRound: number;
  nextEventSequence: number;
  players: PlayerState[];
  rooms: RoomState[];
  tasks: TaskState[];
  bodyLocations: Record<string, RoomId>;
  reportedBodyIds: string[];
  votes: Record<string, PlayerId | null>;
  blackoutUntilTick: number | null;
  jammedDoorsUntilTick: Partial<Record<RoomId, number>>;
  sealedRoomsUntilTick: Partial<Record<RoomId, number>>;
  servicePassageUnlocked: boolean;
  winner: EngineWinner | null;
  eventLog: EngineEvent[];
  replayFrames: EngineReplayFrame[];
};
