import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import type {
  ClientMatchProposeActionMessage,
  MatchEvent,
  MatchPrivateState,
  MatchSnapshot,
  PlayerId,
  ReplayFrame,
  ServerHelloMessage,
  ServerValidationErrorMessage,
} from "@blackout-manor/shared";

export type ClientGameConnectionMode = "mock" | "live" | "replay";

export type ClientGameState = {
  mode: ClientGameConnectionMode;
  status: "idle" | "connecting" | "connected" | "error" | "closed";
  roomId: string | null;
  actorId: PlayerId | null;
  hello: ServerHelloMessage | null;
  privateState: MatchPrivateState | null;
  snapshot: MatchSnapshot | null;
  recentEvents: MatchEvent[];
  replay: {
    status: "idle" | "loading" | "ready" | "error";
    replayId: string | null;
    matchId: string | null;
    frames: ReplayFrame[];
    totalFrames: number;
    isComplete: boolean;
  };
  lastValidationError: ServerValidationErrorMessage | null;
  lastErrorMessage: string | null;
  fpsEstimate: number;
};

export type ClientGameStateListener = (state: ClientGameState) => void;

export type ClientGameIntentContext = {
  matchId: string;
  phaseId: MatchSnapshot["phaseId"];
  actorId: PlayerId;
};

export type ClientGameConnectionOptions =
  | {
      mode: "mock";
      roomId?: string;
      actorId?: PlayerId;
      seed?: number;
      tickMs?: number;
    }
  | {
      mode: "live";
      serverUrl: string;
      roomId: string;
      actorId?: PlayerId;
    }
  | {
      mode: "replay";
      replay: SavedReplayEnvelope;
      roomId?: string;
      actorId?: PlayerId;
    };

export type BlackoutGameMountOptions = {
  container: HTMLElement;
  connection: ClientGameConnectionOptions;
  width?: number;
  height?: number;
  onStateChange?: ClientGameStateListener;
};

export type ClientGameController = {
  mode: ClientGameConnectionMode;
  roomId: string | null;
  getState(): ClientGameState;
  subscribe(listener: ClientGameStateListener): () => void;
  sendIntent(message: ClientMatchProposeActionMessage): Promise<void>;
  requestReplay(request: {
    matchId?: string;
    replayId?: string;
  }): Promise<void>;
  seekReplay(replayId: string, tick: number): Promise<void>;
  destroy(): Promise<void>;
};
