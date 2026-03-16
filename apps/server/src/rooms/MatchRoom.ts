import type { MatchMetadataInput } from "@blackout-manor/db";
import {
  ClientMatchProposeActionMessageSchema,
  ClientPingMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
  type MatchId,
  type MatchSnapshot,
  type PlayerId,
  PROTOCOL_VERSION,
  type ReplayEnvelope,
  type ServerMatchEventMessage,
  type ServerMatchPrivateStateMessage,
  type ServerMatchSnapshotMessage,
  type ServerReplayChunkMessage,
  type ServerValidationErrorMessage,
} from "@blackout-manor/shared";
import { type Client, CloseCode, Room } from "@colyseus/core";
import { ZodError } from "zod";

import { MatchController } from "../services/match-orchestrator/MatchController";
import { createValidationError } from "../services/match-orchestrator/matchAdapters";
import type {
  MatchControllerUpdate,
  MatchRoomCreateOptions,
  ReplaySaveResult,
} from "../services/match-orchestrator/types";
import { ModelGatewayBotOrchestrator } from "../services/model-gateway/ModelGatewayBotOrchestrator";
import { createLeaderboardDeltasFromReplay } from "../services/replay-service/leaderboards";

const RECONNECT_WINDOW_SECONDS = 20;
const REPLAY_CHUNK_SIZE = 64;

const formatIssues = (error: ZodError) =>
  error.issues.map((issue) => issue.message).slice(0, 12);

export class MatchRoom extends Room {
  readonly #playerIdBySessionId = new Map<string, PlayerId>();
  readonly #sessionIdByPlayerId = new Map<PlayerId, string>();
  controller!: MatchController;
  runtime!: MatchRoomCreateOptions["runtime"];
  botOrchestrator: ModelGatewayBotOrchestrator | null = null;
  #savedReplay: ReplaySaveResult | null = null;
  #savedReplayPromise: Promise<ReplaySaveResult> | null = null;
  #startedAt = new Date().toISOString();
  #botStepPromise: Promise<void> | null = null;

  override onCreate(options: MatchRoomCreateOptions) {
    if (!options.runtime) {
      throw new Error("MatchRoom requires the server runtime.");
    }

    this.runtime = options.runtime;
    this.maxClients = options.botOnly ? 20 : 10;
    this.autoDispose = false;
    this.patchRate = null;
    this.controller = new MatchController({
      ...(options.matchId ? { matchId: options.matchId } : {}),
      ...(typeof options.seed === "number" ? { seed: options.seed } : {}),
      ...(options.speedProfileId
        ? { speedProfileId: options.speedProfileId }
        : {}),
      ...(typeof options.botOnly === "boolean"
        ? { botOnly: options.botOnly }
        : {}),
      ...(typeof options.autoStart === "boolean"
        ? { autoStart: options.autoStart }
        : {}),
      ...(options.players ? { players: options.players } : {}),
      ...(options.sourceLobbyRoomId
        ? { sourceLobbyRoomId: options.sourceLobbyRoomId }
        : {}),
    });

    options.runtime.matchRegistry.register({
      matchId: this.controller.matchId,
      roomId: this.roomId,
      roomName: "match",
      botOnly: this.controller.botOnly,
      status: options.autoStart === false ? "staging" : "running",
      ...(options.sourceLobbyRoomId
        ? { sourceLobbyRoomId: options.sourceLobbyRoomId }
        : {}),
    });
    void this.#syncMatchMetadata(
      options.autoStart === false ? "staging" : "running",
    );

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

    this.onMessage("client.match.propose-action", (client, payload) => {
      const assignedPlayerId = this.#playerIdBySessionId.get(client.sessionId);

      if (!assignedPlayerId) {
        this.#sendValidationError(
          client,
          createValidationError(
            "unassigned-client",
            "This client is observing only and cannot send match intents.",
          ),
        );
        return;
      }

      try {
        const message = ClientMatchProposeActionMessageSchema.parse({
          type: "client.match.propose-action",
          ...((payload as Record<string, unknown>) ?? {}),
        });
        const result = this.controller.handleClientProposal(
          assignedPlayerId,
          message,
        );

        if (!result.ok) {
          this.#sendValidationError(client, result.error);
          return;
        }

        this.#flushUpdate(result.update);
      } catch (error) {
        this.#sendValidationError(
          client,
          error instanceof ZodError
            ? createValidationError(
                "invalid-intent",
                "Invalid client intent payload.",
                formatIssues(error),
              )
            : createValidationError(
                "invalid-intent",
                "Invalid client intent payload.",
              ),
        );
      }
    });

    this.onMessage("client.replay.request", async (client, payload) => {
      try {
        const message = ClientReplayRequestMessageSchema.parse({
          type: "client.replay.request",
          ...((payload as Record<string, unknown>) ?? {}),
        });
        const replay =
          (message.replayId
            ? await this.runtime.replayStore.getByReplayId(message.replayId)
            : null) ??
          (message.matchId
            ? await this.runtime.replayStore.getByMatchId(message.matchId)
            : null);

        if (!replay) {
          this.#sendValidationError(
            client,
            createValidationError(
              "replay-not-found",
              "No replay is available for that request.",
            ),
          );
          return;
        }

        this.#sendReplay(client, replay);
      } catch (error) {
        this.#sendValidationError(
          client,
          error instanceof ZodError
            ? createValidationError(
                "invalid-replay-request",
                "Invalid replay request payload.",
                formatIssues(error),
              )
            : createValidationError(
                "invalid-replay-request",
                "Invalid replay request payload.",
              ),
        );
      }
    });

    this.onMessage("client.replay.seek", async (client, payload) => {
      try {
        const message = ClientReplaySeekMessageSchema.parse({
          type: "client.replay.seek",
          ...((payload as Record<string, unknown>) ?? {}),
        });
        const replay = await this.runtime.replayStore.getByReplayId(
          message.replayId,
        );

        if (!replay) {
          this.#sendValidationError(
            client,
            createValidationError(
              "replay-not-found",
              "No replay is available for that request.",
            ),
          );
          return;
        }

        this.#sendReplay(client, replay, message.tick);
      } catch (error) {
        this.#sendValidationError(
          client,
          error instanceof ZodError
            ? createValidationError(
                "invalid-replay-seek",
                "Invalid replay seek payload.",
                formatIssues(error),
              )
            : createValidationError(
                "invalid-replay-seek",
                "Invalid replay seek payload.",
              ),
        );
      }
    });

    this.onMessage("*", (client, type) => {
      this.#sendValidationError(
        client,
        createValidationError(
          "unsupported-message",
          "This match room only accepts intents, ping, and replay requests.",
          [`Unsupported message type: ${String(type)}.`],
        ),
      );
    });

    if (this.controller.botOnly && options.autoStart !== false) {
      this.botOrchestrator = new ModelGatewayBotOrchestrator(
        this.controller,
        this.runtime.agentDecisionGateway,
      );
      this.setSimulationInterval(() => {
        if (
          !this.botOrchestrator ||
          this.controller.paused ||
          this.controller.completed ||
          this.controller.terminated
        ) {
          return;
        }

        if (!this.#botStepPromise) {
          this.#botStepPromise = this.#runBotStep().finally(() => {
            this.#botStepPromise = null;
          });
        }
      }, 250);
    }
  }

  override onJoin(client: Client, options?: { playerId?: PlayerId }) {
    client.send("server.hello", {
      type: "server.hello",
      protocolVersion: PROTOCOL_VERSION,
      serverTime: new Date().toISOString(),
      roomChannelId: "match",
    });

    const playerId = this.#assignPlayer(client, options?.playerId);

    if (playerId) {
      this.#flushUpdate(this.controller.setPlayerConnected(playerId, true));
      this.#sendPrivateState(client, playerId);
    }

    this.#sendSnapshot(client, this.controller.getSnapshot());
  }

  override async onLeave(client: Client, code?: number) {
    const playerId = this.#playerIdBySessionId.get(client.sessionId);

    if (!playerId) {
      return;
    }

    if (code === CloseCode.CONSENTED || this.controller.terminated) {
      this.#releasePlayer(playerId, client.sessionId);
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
      this.#flushUpdate(this.controller.setPlayerConnected(playerId, true));

      reconnectedClient.send("server.hello", {
        type: "server.hello",
        protocolVersion: PROTOCOL_VERSION,
        serverTime: new Date().toISOString(),
        roomChannelId: "match",
      });
      this.#sendPrivateState(reconnectedClient, playerId);
      this.#sendSnapshot(reconnectedClient, this.controller.getSnapshot());
    } catch {
      this.#releasePlayer(playerId, client.sessionId);
    }
  }

  override onDispose() {
    void this.#persistReplayIfNeeded();
    this.runtime.matchRegistry.unregister(this.controller.matchId);
  }

  async pauseSimulation() {
    this.controller.pause();
    this.#broadcastSnapshot(this.controller.getSnapshot());
    return this.#syncStatus("paused");
  }

  async resumeSimulation() {
    this.controller.resume();
    this.#broadcastSnapshot(this.controller.getSnapshot());
    return this.#syncStatus("running");
  }

  async fastForwardSimulation(steps = 10) {
    const wasPaused = this.controller.paused;

    if (wasPaused) {
      this.controller.resume();
    }

    const update = this.botOrchestrator
      ? await this.botOrchestrator.runSteps(steps)
      : this.controller.advanceTicks(steps);

    if (
      wasPaused &&
      !this.controller.completed &&
      !this.controller.terminated
    ) {
      this.controller.pause();
    }

    this.#flushUpdate(update);
    return this.#syncStatus(
      this.controller.completed
        ? "completed"
        : this.controller.paused
          ? "paused"
          : "running",
    );
  }

  async #runBotStep() {
    if (!this.botOrchestrator) {
      return;
    }

    const previousTick = this.controller.state.tick;
    const update = await this.botOrchestrator.step();

    if (
      update.recentEvents.length > 0 ||
      this.controller.state.tick !== previousTick
    ) {
      this.#flushUpdate(update);
    }
  }

  async terminateSimulation() {
    this.controller.terminate();
    const replay = await this.#persistReplayIfNeeded();
    await this.#syncStatus("terminated");
    await this.disconnect(CloseCode.CONSENTED);

    return {
      matchId: this.controller.matchId,
      roomId: this.roomId,
      status: "terminated",
      replayId: replay?.replay.replayId ?? null,
    };
  }

  #assignPlayer(client: Client, requestedPlayerId?: PlayerId) {
    if (this.controller.botOnly) {
      return null;
    }

    if (
      requestedPlayerId &&
      this.controller.availableHumanPlayerIds.includes(requestedPlayerId)
    ) {
      this.#playerIdBySessionId.set(client.sessionId, requestedPlayerId);
      this.#sessionIdByPlayerId.set(requestedPlayerId, client.sessionId);
      return requestedPlayerId;
    }

    const availablePlayerId = this.controller.availableHumanPlayerIds[0];

    if (!availablePlayerId) {
      throw new Error("No human player slots are available in this match.");
    }

    this.#playerIdBySessionId.set(client.sessionId, availablePlayerId);
    this.#sessionIdByPlayerId.set(availablePlayerId, client.sessionId);
    return availablePlayerId;
  }

  #releasePlayer(playerId: PlayerId, sessionId: string) {
    this.#playerIdBySessionId.delete(sessionId);
    this.#sessionIdByPlayerId.delete(playerId);
    this.#flushUpdate(this.controller.setPlayerConnected(playerId, false));
  }

  #sendValidationError(client: Client, payload: ServerValidationErrorMessage) {
    client.send("server.validation-error", payload);
  }

  #sendSnapshot(client: Client, snapshot: MatchSnapshot) {
    const payload: ServerMatchSnapshotMessage = {
      type: "server.match.snapshot",
      match: snapshot,
    };

    client.send("server.match.snapshot", payload);
  }

  #sendPrivateState(client: Client, playerId: PlayerId) {
    const player = this.controller.state.players.find(
      (candidate) => candidate.id === playerId,
    );

    if (!player) {
      return;
    }

    const payload: ServerMatchPrivateStateMessage = {
      type: "server.match.private-state",
      matchId: this.controller.matchId,
      privateState: {
        playerId,
        role: player.role,
        team: player.team,
        knownAllyPlayerIds:
          player.role === "shadow"
            ? this.controller.state.players
                .filter(
                  (candidate) =>
                    candidate.role === "shadow" && candidate.id !== playerId,
                )
                .map((candidate) => candidate.id)
            : [],
        revealedAtTick: this.controller.state.tick,
      },
    };

    client.send("server.match.private-state", payload);
  }

  #broadcastSnapshot(snapshot: MatchSnapshot) {
    const payload: ServerMatchSnapshotMessage = {
      type: "server.match.snapshot",
      match: snapshot,
    };

    this.broadcast("server.match.snapshot", payload);
  }

  #broadcastEvents(
    matchId: MatchId,
    events: MatchControllerUpdate["recentEvents"],
  ) {
    for (const event of events) {
      const payload: ServerMatchEventMessage = {
        type: "server.match.event",
        matchId,
        event,
      };

      this.broadcast("server.match.event", payload);
    }
  }

  #flushUpdate(update: MatchControllerUpdate) {
    if (update.recentEvents.length > 0) {
      this.#broadcastEvents(this.controller.matchId, update.recentEvents);
    }

    this.#broadcastSnapshot(update.snapshot);

    if (this.controller.completed) {
      void this.#persistReplayIfNeeded();
      void this.#syncStatus("completed");
    }
  }

  async #persistReplayIfNeeded() {
    if (this.#savedReplay) {
      return this.#savedReplay;
    }

    if (this.#savedReplayPromise) {
      return this.#savedReplayPromise;
    }

    const engineReplay = this.controller.createReplayLog();

    this.#savedReplayPromise = this.runtime.replayStore
      .save(engineReplay)
      .then(async ({ replay, payloadJson }) => {
        const savedReplay: ReplaySaveResult = {
          replay,
          engineReplay,
          payloadJson,
        };

        await this.runtime.database.applyLeaderboardDeltas(
          createLeaderboardDeltasFromReplay(engineReplay),
        );

        this.#savedReplay = savedReplay;
        await this.#syncMatchMetadata(
          this.controller.terminated ? "terminated" : "completed",
          {
            replayId: replay.replayId,
            winnerTeam: this.controller.state.winner?.team ?? null,
            endedAt: new Date().toISOString(),
          },
        );

        return savedReplay;
      })
      .finally(() => {
        this.#savedReplayPromise = null;
      });

    return this.#savedReplayPromise;
  }

  #sendReplay(client: Client, replay: ReplayEnvelope, fromTick = 0) {
    const frames = replay.frames.filter((frame) => frame.tick >= fromTick);

    for (let index = 0; index < frames.length; index += REPLAY_CHUNK_SIZE) {
      const payload: ServerReplayChunkMessage = {
        type: "server.replay.chunk",
        replayId: replay.replayId,
        matchId: replay.matchId,
        startIndex: index,
        totalFrames: frames.length,
        isFinalChunk: index + REPLAY_CHUNK_SIZE >= frames.length,
        frames: frames.slice(index, index + REPLAY_CHUNK_SIZE),
      };

      client.send("server.replay.chunk", payload);
    }
  }

  async #syncStatus(status: "running" | "paused" | "completed" | "terminated") {
    this.runtime.matchRegistry.updateStatus(this.controller.matchId, status, {
      ...(this.#savedReplay?.replay.replayId
        ? { replayId: this.#savedReplay.replay.replayId }
        : {}),
    });

    await this.#syncMatchMetadata(status, {
      winnerTeam: this.controller.state.winner?.team ?? null,
      ...(this.#savedReplay?.replay.replayId
        ? { replayId: this.#savedReplay.replay.replayId }
        : {}),
      ...(status === "completed" || status === "terminated"
        ? { endedAt: new Date().toISOString() }
        : {}),
    });

    return this.#adminStatusPayload(status);
  }

  async #syncMatchMetadata(
    status: "staging" | "running" | "paused" | "completed" | "terminated",
    extra?: {
      replayId?: string;
      winnerTeam?: "household" | "shadow" | null;
      endedAt?: string;
    },
  ) {
    const replayId = extra?.replayId ?? this.#savedReplay?.replay.replayId;
    const metadata: MatchMetadataInput = {
      matchId: this.controller.matchId,
      roomId: this.roomId,
      roomName: "match",
      botOnly: this.controller.botOnly,
      seed: this.controller.state.seed,
      speedProfileId: this.controller.state.config.speedProfileId,
      status,
      startedAt: this.#startedAt,
      ...(extra?.winnerTeam !== undefined
        ? { winnerTeam: extra.winnerTeam }
        : this.controller.state.winner?.team
          ? { winnerTeam: this.controller.state.winner.team }
          : {}),
      ...(typeof replayId === "string" ? { replayId } : {}),
      ...(extra?.endedAt ? { endedAt: extra.endedAt } : {}),
    };

    await this.runtime.database.upsertMatchMetadata(metadata);
  }

  #adminStatusPayload(
    status: "running" | "paused" | "completed" | "terminated",
  ) {
    return {
      matchId: this.controller.matchId,
      roomId: this.roomId,
      phaseId: this.controller.state.phaseId,
      tick: this.controller.state.tick,
      botOnly: this.controller.botOnly,
      paused: this.controller.paused,
      completed: this.controller.completed,
      replayId: this.#savedReplay?.replay.replayId ?? null,
      status,
    };
  }
}
