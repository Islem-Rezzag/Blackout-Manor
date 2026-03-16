import {
  ClientMatchProposeActionMessageSchema,
  type ClientMessage,
  ClientPingMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
  parseServerMessage,
  type ServerMessage,
} from "@blackout-manor/shared";

import type { MatchConnection } from "./types";

type LiveConnectionOptions = {
  serverUrl: string;
  roomId: string;
  actorId?: string;
};

export class ColyseusMatchConnection implements MatchConnection {
  readonly mode = "live" as const;
  readonly roomId: string;
  readonly #serverUrl: string;
  readonly #actorId: string | undefined;
  readonly #listeners = new Set<(message: ServerMessage) => void>();
  readonly #errorListeners = new Set<(error: Error) => void>();
  #client: InstanceType<typeof import("colyseus.js")["Client"]> | null = null;
  #room: InstanceType<typeof import("colyseus.js")["Room"]> | null = null;

  constructor(options: LiveConnectionOptions) {
    this.#serverUrl = options.serverUrl;
    this.roomId = options.roomId;
    this.#actorId = options.actorId;
  }

  async connect() {
    const { Client } = await import("colyseus.js");

    this.#client = new Client(this.#serverUrl);
    this.#room = await this.#client.joinById(this.roomId, {
      ...(this.#actorId ? { playerId: this.#actorId } : {}),
    });

    this.#room.onMessage("*", (type, payload) => {
      try {
        const message = parseServerMessage({
          type,
          ...((payload as Record<string, unknown>) ?? {}),
        });

        for (const listener of this.#listeners) {
          listener(message);
        }
      } catch (error) {
        this.#emitError(
          error instanceof Error
            ? error
            : new Error("Received an invalid server payload."),
        );
      }
    });

    this.#room.onError((code, message) => {
      this.#emitError(
        new Error(`Colyseus room error ${String(code)}: ${message}`),
      );
    });

    this.#room.onLeave((code) => {
      if (code !== 0) {
        this.#emitError(
          new Error(
            `Match room closed unexpectedly with code ${String(code)}.`,
          ),
        );
      }
    });
  }

  async send(message: ClientMessage) {
    if (!this.#room) {
      throw new Error("Cannot send before the live room has connected.");
    }

    switch (message.type) {
      case "client.match.propose-action":
        this.#room.send(
          "client.match.propose-action",
          ClientMatchProposeActionMessageSchema.parse(message),
        );
        return;
      case "client.ping":
        this.#room.send("client.ping", ClientPingMessageSchema.parse(message));
        return;
      case "client.replay.request":
        this.#room.send(
          "client.replay.request",
          ClientReplayRequestMessageSchema.parse(message),
        );
        return;
      case "client.replay.seek":
        this.#room.send(
          "client.replay.seek",
          ClientReplaySeekMessageSchema.parse(message),
        );
        return;
      default:
        throw new Error(`Unsupported live client message: ${message.type}.`);
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
    await this.#room?.leave(false);
    this.#room = null;
    this.#client = null;
  }

  #emitError(error: Error) {
    for (const listener of this.#errorListeners) {
      listener(error);
    }
  }
}
