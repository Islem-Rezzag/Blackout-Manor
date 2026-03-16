import type { AgentDecisionGateway } from "@blackout-manor/agents";
import type { BlackoutManorDatabase } from "@blackout-manor/db";
import type { EngineReplayLog, EngineState } from "@blackout-manor/engine";
import type {
  MatchEvent,
  MatchId,
  MatchSnapshot,
  PlayerId,
  ReplayEnvelope,
  ServerValidationErrorMessage,
  SpeedProfileId,
} from "@blackout-manor/shared";
import type { PersistentReplayStore } from "../replay-service/PersistentReplayStore";
import type { MatchRegistry } from "./MatchRegistry";

export type ManagedMatchPlayer = {
  id: PlayerId;
  displayName: string;
  isBot: boolean;
};

export type MatchRoomCreateOptions = {
  runtime: ServerRuntime;
  matchId?: MatchId;
  seed?: number;
  speedProfileId?: SpeedProfileId;
  botOnly?: boolean;
  autoStart?: boolean;
  players?: ManagedMatchPlayer[];
  sourceLobbyRoomId?: string;
};

export type MatchLifecycleStatus =
  | "staging"
  | "running"
  | "paused"
  | "completed"
  | "terminated";

export type RegisteredMatch = {
  matchId: MatchId;
  roomId: string;
  roomName: "match";
  botOnly: boolean;
  status: MatchLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  sourceLobbyRoomId?: string;
  replayId?: string;
};

export type MatchControllerUpdate = {
  snapshot: MatchSnapshot;
  recentEvents: MatchEvent[];
};

export type MatchActionResult =
  | { ok: true; update: MatchControllerUpdate }
  | { ok: false; error: ServerValidationErrorMessage };

export type ReplaySaveResult = {
  replay: ReplayEnvelope;
  engineReplay: EngineReplayLog;
  payloadJson: string;
};

export type ServerRuntime = {
  matchRegistry: MatchRegistry;
  database: BlackoutManorDatabase;
  replayStore: PersistentReplayStore;
  agentDecisionGateway: AgentDecisionGateway;
  adminAuthToken: string;
};

export type MatchEventMappingContext = {
  engineEvents: EngineState["eventLog"];
};
