import type {
  ClientMatchProposeActionMessage,
  ClientReplayRequestMessage,
  ClientReplaySeekMessage,
  MatchEvent,
  MatchSnapshot,
  ServerHelloMessage,
  ServerReplayChunkMessage,
} from "@blackout-manor/shared";

import type { MatchConnection } from "../network/types";
import type {
  ClientGameConnectionMode,
  ClientGameState,
  ClientGameStateListener,
} from "../types";

type ViewStoreOptions = {
  mode: ClientGameConnectionMode;
  roomId: string | null;
  actorId: ClientGameState["actorId"];
  connection: MatchConnection;
};

const MAX_RECENT_EVENTS = 10;

const createInitialState = ({
  mode,
  roomId,
  actorId,
}: Pick<ViewStoreOptions, "mode" | "roomId" | "actorId">): ClientGameState => ({
  mode,
  status: "idle",
  roomId,
  actorId,
  hello: null,
  privateState: null,
  snapshot: null,
  recentEvents: [],
  replay: {
    status: "idle",
    replayId: null,
    matchId: null,
    frames: [],
    totalFrames: 0,
    isComplete: false,
  },
  lastValidationError: null,
  lastErrorMessage: null,
  fpsEstimate: 60,
});

export class MatchViewStore {
  readonly #connection: MatchConnection;
  readonly #listeners = new Set<ClientGameStateListener>();
  readonly #unsubscribeFns: Array<() => void> = [];
  #state: ClientGameState;

  constructor(options: ViewStoreOptions) {
    this.#connection = options.connection;
    this.#state = createInitialState(options);
  }

  getState() {
    return this.#state;
  }

  subscribe(listener: ClientGameStateListener) {
    this.#listeners.add(listener);
    listener(this.#state);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  async connect() {
    this.#setState({
      status: "connecting",
      lastErrorMessage: null,
    });

    this.#unsubscribeFns.push(
      this.#connection.subscribe((message) => {
        switch (message.type) {
          case "server.hello":
            this.#handleHello(message);
            break;
          case "server.match.snapshot":
            this.#handleSnapshot(message.match);
            break;
          case "server.match.private-state":
            this.#setState({
              privateState: message.privateState,
            });
            break;
          case "server.match.event":
            this.#handleEvent(message.event);
            break;
          case "server.replay.chunk":
            this.#handleReplayChunk(message);
            break;
          case "server.validation-error":
            this.#setState({
              lastValidationError: message,
            });
            break;
          default:
            break;
        }
      }),
    );

    this.#unsubscribeFns.push(
      this.#connection.onError((error) => {
        this.#setState({
          status: "error",
          lastErrorMessage: error.message,
        });
      }),
    );

    await this.#connection.connect();

    this.#setState({
      status: "connected",
    });
  }

  async sendIntent(message: ClientMatchProposeActionMessage) {
    await this.#connection.send(message);
  }

  async requestReplay(message: ClientReplayRequestMessage) {
    this.#setState({
      replay: {
        status: "loading",
        replayId: message.replayId ?? null,
        matchId: message.matchId ?? this.#state.snapshot?.matchId ?? null,
        frames: [],
        totalFrames: 0,
        isComplete: false,
      },
    });
    await this.#connection.send(message);
  }

  async seekReplay(message: ClientReplaySeekMessage) {
    this.#setState({
      replay: {
        ...this.#state.replay,
        status: "loading",
        replayId: message.replayId,
        frames: [],
        totalFrames: 0,
        isComplete: false,
      },
    });
    await this.#connection.send(message);
  }

  setFpsEstimate(fpsEstimate: number) {
    if (Number.isFinite(fpsEstimate) && fpsEstimate > 0) {
      this.#setState({
        fpsEstimate: Math.max(1, Math.round(fpsEstimate)),
      });
    }
  }

  async disconnect() {
    for (const unsubscribe of this.#unsubscribeFns.splice(0)) {
      unsubscribe();
    }

    await this.#connection.disconnect();
    this.#setState({
      status: "closed",
    });
  }

  #handleHello(message: ServerHelloMessage) {
    this.#setState({
      hello: message,
    });
  }

  #handleSnapshot(snapshot: MatchSnapshot) {
    this.#setState({
      snapshot,
      recentEvents: snapshot.recentEvents.slice(-MAX_RECENT_EVENTS),
      lastValidationError: null,
    });
  }

  #handleEvent(event: MatchEvent) {
    this.#setState({
      recentEvents: [...this.#state.recentEvents, event].slice(
        -MAX_RECENT_EVENTS,
      ),
    });
  }

  #handleReplayChunk(message: ServerReplayChunkMessage) {
    const frameMap = new Map(
      this.#state.replay.frames.map((frame) => [frame.tick, frame]),
    );

    for (const frame of message.frames) {
      frameMap.set(frame.tick, frame);
    }

    this.#setState({
      replay: {
        status: message.isFinalChunk ? "ready" : "loading",
        replayId: message.replayId,
        matchId: message.matchId,
        frames: [...frameMap.values()].sort(
          (left, right) => left.tick - right.tick,
        ),
        totalFrames: message.totalFrames,
        isComplete: message.isFinalChunk,
      },
    });
  }

  #setState(nextState: Partial<ClientGameState>) {
    this.#state = {
      ...this.#state,
      ...nextState,
    };

    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}
