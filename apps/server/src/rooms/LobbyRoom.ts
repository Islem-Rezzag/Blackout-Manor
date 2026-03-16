import {
  ClientLobbySetReadyMessageSchema,
  ClientPingMessageSchema,
  type LobbySnapshot,
  type PlayerId,
  PROTOCOL_VERSION,
  type ServerLobbySnapshotMessage,
  type ServerValidationErrorMessage,
  type SpeedProfileId,
} from "@blackout-manor/shared";
import { type Client, CloseCode, matchMaker, Room } from "@colyseus/core";
import { ZodError } from "zod";

import { createValidationError } from "../services/match-orchestrator/matchAdapters";
import type { ServerRuntime } from "../services/match-orchestrator/types";

type LobbyRoomCreateOptions = {
  runtime: ServerRuntime;
};

const RECONNECT_WINDOW_SECONDS = 20;

const formatIssues = (error: ZodError) =>
  error.issues.map((issue) => issue.message).slice(0, 12);

export class LobbyRoom extends Room {
  readonly #playerIdBySessionId = new Map<string, PlayerId>();
  readonly #sessionIdByPlayerId = new Map<PlayerId, string>();
  readonly #displayNameByPlayerId = new Map<PlayerId, string>();
  readonly #readyPlayerIds = new Set<PlayerId>();
  runtime!: ServerRuntime;

  override onCreate(options: LobbyRoomCreateOptions) {
    if (!options.runtime) {
      throw new Error("LobbyRoom requires the server runtime.");
    }

    this.runtime = options.runtime;
    this.maxClients = 10;
    this.autoDispose = false;
    this.patchRate = null;

    this.onMessage("client.ping", (client, payload) => {
      try {
        const message = ClientPingMessageSchema.parse({
          type: "client.ping",
          ...((payload as Record<string, unknown>) ?? {}),
        });

        client.send("server.pong", {
          type: "server.pong",
          timestamp: message.timestamp,
        });
      } catch (error) {
        this.#sendValidationError(
          client,
          error instanceof ZodError
            ? createValidationError(
                "invalid-ping",
                "Invalid ping payload.",
                formatIssues(error),
              )
            : createValidationError("invalid-ping", "Invalid ping payload."),
        );
      }
    });

    this.onMessage("client.lobby.set-ready", (client, payload) => {
      try {
        const message = ClientLobbySetReadyMessageSchema.parse({
          type: "client.lobby.set-ready",
          ...((payload as Record<string, unknown>) ?? {}),
        });
        const assignedPlayerId = this.#playerIdBySessionId.get(
          client.sessionId,
        );

        if (!assignedPlayerId || assignedPlayerId !== message.playerId) {
          this.#sendValidationError(
            client,
            createValidationError(
              "actor-mismatch",
              "Lobby clients may only update their own ready state.",
              assignedPlayerId
                ? [
                    `Assigned player: ${assignedPlayerId}. Requested player: ${message.playerId}.`,
                  ]
                : ["This client is not assigned to a lobby seat."],
            ),
          );
          return;
        }

        if (message.ready) {
          this.#readyPlayerIds.add(message.playerId);
        } else {
          this.#readyPlayerIds.delete(message.playerId);
        }

        this.#broadcastSnapshot();
      } catch (error) {
        this.#sendValidationError(
          client,
          error instanceof ZodError
            ? createValidationError(
                "invalid-ready-update",
                "Invalid ready-state payload.",
                formatIssues(error),
              )
            : createValidationError(
                "invalid-ready-update",
                "Invalid ready-state payload.",
              ),
        );
      }
    });

    this.onMessage("*", (client, type) => {
      this.#sendValidationError(
        client,
        createValidationError(
          "unsupported-message",
          "This lobby only accepts ping and ready-state messages.",
          [`Unsupported message type: ${String(type)}.`],
        ),
      );
    });
  }

  override onJoin(client: Client) {
    const playerId = this.#claimSeat(client);

    if (!playerId) {
      throw new Error("Lobby is full.");
    }

    client.send("server.hello", {
      type: "server.hello",
      protocolVersion: PROTOCOL_VERSION,
      serverTime: new Date().toISOString(),
      roomChannelId: "lobby",
    });
    this.#sendSnapshot(client);
    this.#broadcastSnapshot();
  }

  override async onLeave(client: Client, code?: number) {
    const playerId = this.#playerIdBySessionId.get(client.sessionId);

    if (!playerId) {
      return;
    }

    if (code === CloseCode.CONSENTED) {
      this.#releaseSeat(playerId, client.sessionId);
      return;
    }

    try {
      const reconnectedClient = await this.allowReconnection(
        client,
        RECONNECT_WINDOW_SECONDS,
      );

      this.#playerIdBySessionId.delete(client.sessionId);
      this.#playerIdBySessionId.set(reconnectedClient.sessionId, playerId);
      this.#sessionIdByPlayerId.set(playerId, reconnectedClient.sessionId);

      reconnectedClient.send("server.hello", {
        type: "server.hello",
        protocolVersion: PROTOCOL_VERSION,
        serverTime: new Date().toISOString(),
        roomChannelId: "lobby",
      });
      this.#sendSnapshot(reconnectedClient);
      this.#broadcastSnapshot();
    } catch {
      this.#releaseSeat(playerId, client.sessionId);
    }
  }

  async launchStagedMatch(options?: {
    seed?: number;
    speedProfileId?: SpeedProfileId;
  }) {
    const seed = options?.seed ?? 17;
    const speedProfileId = options?.speedProfileId ?? "showcase";
    const players = [...this.#sessionIdByPlayerId.keys()].map((playerId) => ({
      id: playerId,
      displayName:
        this.#displayNameByPlayerId.get(playerId) ??
        `Guest ${playerId.slice(-2)}`,
      isBot: false,
    }));
    const room = await matchMaker.createRoom("match", {
      botOnly: false,
      autoStart: false,
      players,
      sourceLobbyRoomId: this.roomId,
      seed,
      speedProfileId,
    });

    const registeredMatch = this.runtime.matchRegistry
      .list()
      .find((match) => match.roomId === room.roomId);

    if (registeredMatch) {
      await this.runtime.database.upsertMatchMetadata({
        matchId: registeredMatch.matchId,
        roomId: registeredMatch.roomId,
        roomName: registeredMatch.roomName,
        botOnly: registeredMatch.botOnly,
        seed,
        speedProfileId,
        status: registeredMatch.status,
        sourceLobbyRoomId: this.roomId,
      });
    }

    return {
      roomId: room.roomId,
      matchId: registeredMatch?.matchId ?? null,
    };
  }

  #claimSeat(client: Client) {
    for (let seat = 1; seat <= this.maxClients; seat += 1) {
      const playerId =
        `lobby-player-${String(seat).padStart(2, "0")}` as PlayerId;

      if (this.#sessionIdByPlayerId.has(playerId)) {
        continue;
      }

      this.#playerIdBySessionId.set(client.sessionId, playerId);
      this.#sessionIdByPlayerId.set(playerId, client.sessionId);
      this.#displayNameByPlayerId.set(
        playerId,
        `Lobby Guest ${String(seat).padStart(2, "0")}`,
      );

      return playerId;
    }

    return null;
  }

  #releaseSeat(playerId: PlayerId, sessionId: string) {
    this.#playerIdBySessionId.delete(sessionId);
    this.#sessionIdByPlayerId.delete(playerId);
    this.#displayNameByPlayerId.delete(playerId);
    this.#readyPlayerIds.delete(playerId);
    this.#broadcastSnapshot();
  }

  #snapshot(): LobbySnapshot {
    return {
      roomChannelId: "lobby",
      playerCount: this.#sessionIdByPlayerId.size,
      capacity: this.maxClients,
      readyPlayerIds: [...this.#readyPlayerIds.values()],
    };
  }

  #sendSnapshot(client: Client) {
    const payload: ServerLobbySnapshotMessage = {
      type: "server.lobby.snapshot",
      lobby: this.#snapshot(),
    };

    client.send("server.lobby.snapshot", payload);
  }

  #broadcastSnapshot() {
    const payload: ServerLobbySnapshotMessage = {
      type: "server.lobby.snapshot",
      lobby: this.#snapshot(),
    };

    this.broadcast("server.lobby.snapshot", payload);
  }

  #sendValidationError(client: Client, payload: ServerValidationErrorMessage) {
    client.send("server.validation-error", payload);
  }
}
