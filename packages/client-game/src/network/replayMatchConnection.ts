import {
  ClientMatchProposeActionMessageSchema,
  type ClientMessage,
  ClientPingMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
  type MatchPrivateState,
  type PlayerId,
  PROTOCOL_VERSION,
  type ReplayFrame,
  ServerHelloMessageSchema,
  ServerMatchPrivateStateMessageSchema,
  ServerMatchSnapshotMessageSchema,
  type ServerMessage,
  ServerReplayChunkMessageSchema,
  ServerValidationErrorMessageSchema,
} from "@blackout-manor/shared";

import {
  createReplayPresentationFrames,
  findReplayPresentationFrameIndex,
} from "../replay/presentation";
import type { ClientGameConnectionOptions } from "../types";
import type { MatchConnection } from "./types";

type ReplayConnectionOptions = Extract<
  ClientGameConnectionOptions,
  { mode: "replay" }
>;

const teamFromRole = (
  role: MatchPrivateState["role"],
): MatchPrivateState["team"] => (role === "shadow" ? "shadow" : "household");

export class ReplayMatchConnection implements MatchConnection {
  readonly mode = "replay" as const;
  readonly roomId: string;
  readonly #listeners = new Set<(message: ServerMessage) => void>();
  readonly #errorListeners = new Set<(error: Error) => void>();
  readonly #options: ReplayConnectionOptions;
  readonly #presentationFrames: ReturnType<
    typeof createReplayPresentationFrames
  >;
  readonly #replayFrames: ReplayFrame[];
  #selectedFrameIndex = 0;
  #disposed = false;

  constructor(options: ReplayConnectionOptions) {
    this.#options = options;
    this.#presentationFrames = createReplayPresentationFrames(options.replay);
    this.#replayFrames = this.#presentationFrames.map(
      (frame) => frame.replayFrame,
    );
    this.roomId = options.roomId ?? options.replay.replay.matchId;
  }

  async connect() {
    if (this.#disposed) {
      throw new Error("Replay connection has been disposed.");
    }

    this.#emit(
      ServerHelloMessageSchema.parse({
        type: "server.hello",
        protocolVersion: PROTOCOL_VERSION,
        serverTime: new Date().toISOString(),
        roomChannelId: "replay",
      }),
    );
    this.#emitPrivateState();
    this.#emitReplayChunk();
    this.#emitCurrentSnapshot();
  }

  async send(message: ClientMessage) {
    switch (message.type) {
      case "client.ping":
        ClientPingMessageSchema.parse(message);
        return;
      case "client.replay.request":
        ClientReplayRequestMessageSchema.parse(message);
        this.#emitReplayChunk();
        this.#emitCurrentSnapshot();
        return;
      case "client.replay.seek": {
        const seekMessage = ClientReplaySeekMessageSchema.parse(message);
        this.#selectedFrameIndex = findReplayPresentationFrameIndex(
          this.#presentationFrames,
          seekMessage.tick,
        );
        this.#emitCurrentSnapshot();
        return;
      }
      case "client.match.propose-action":
        ClientMatchProposeActionMessageSchema.parse(message);
        this.#emitValidationError(
          "replay-read-only",
          "Replay mode is read-only and does not accept live action intents.",
        );
        return;
      default:
        this.#emitValidationError(
          "unsupported-message",
          `Replay mode does not support ${message.type}.`,
        );
    }
  }

  subscribe(listener: (message: ServerMessage) => void) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  onError(listener: (error: Error) => void) {
    this.#errorListeners.add(listener);
    return () => {
      this.#errorListeners.delete(listener);
    };
  }

  async disconnect() {
    this.#disposed = true;
  }

  #emitCurrentSnapshot() {
    const frame = this.#presentationFrames[this.#selectedFrameIndex];
    if (!frame) {
      return;
    }

    this.#emit(
      ServerMatchSnapshotMessageSchema.parse({
        type: "server.match.snapshot",
        match: frame.snapshot,
      }),
    );
  }

  #emitReplayChunk() {
    this.#emit(
      ServerReplayChunkMessageSchema.parse({
        type: "server.replay.chunk",
        replayId: this.#options.replay.replay.replayId,
        matchId: this.#options.replay.replay.matchId,
        startIndex: 0,
        totalFrames: this.#replayFrames.length,
        isFinalChunk: true,
        frames: this.#replayFrames,
      }),
    );
  }

  #emitPrivateState() {
    const actorId =
      this.#options.actorId ??
      this.#presentationFrames[0]?.snapshot.players[0]?.id;
    const sourcePlayer = this.#options.replay.replay.frames[0]?.players.find(
      (player) => player.id === actorId,
    );

    if (!actorId || !sourcePlayer) {
      return;
    }

    const role = sourcePlayer.role;
    const privateState: MatchPrivateState = {
      playerId: actorId as PlayerId,
      role,
      team: teamFromRole(role),
      knownAllyPlayerIds:
        role === "shadow"
          ? (this.#options.replay.replay.frames[0]?.players
              .filter(
                (player) => player.role === "shadow" && player.id !== actorId,
              )
              .map((player) => player.id as PlayerId) ?? [])
          : [],
      revealedAtTick: this.#presentationFrames[0]?.tick ?? 0,
    };

    this.#emit(
      ServerMatchPrivateStateMessageSchema.parse({
        type: "server.match.private-state",
        matchId: this.#options.replay.replay.matchId,
        privateState,
      }),
    );
  }

  #emitValidationError(code: string, message: string) {
    this.#emit(
      ServerValidationErrorMessageSchema.parse({
        type: "server.validation-error",
        code,
        message,
        issues: [],
      }),
    );
  }

  #emit(message: ServerMessage) {
    for (const listener of this.#listeners) {
      try {
        listener(message);
      } catch (error) {
        this.#emitError(
          error instanceof Error
            ? error
            : new Error(
                "Replay listener failed while handling a server message.",
              ),
        );
      }
    }
  }

  #emitError(error: Error) {
    for (const listener of this.#errorListeners) {
      listener(error);
    }
  }
}
