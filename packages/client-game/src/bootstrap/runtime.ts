import {
  type ClientMatchProposeActionMessage,
  ClientMatchProposeActionMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
  type MatchSnapshot,
} from "@blackout-manor/shared";

import { createMatchConnection } from "../network/createMatchConnection";
import { MatchViewStore } from "../state/MatchViewStore";
import type {
  ClientGameConnectionOptions,
  ClientGameController,
  ClientGameStateListener,
} from "../types";

type RuntimeOptions = {
  connection: ClientGameConnectionOptions;
  onStateChange?: ClientGameStateListener;
};

export class ClientGameRuntime implements ClientGameController {
  readonly #viewStore: MatchViewStore;
  readonly mode: ClientGameController["mode"];
  readonly roomId: ClientGameController["roomId"];

  constructor(options: RuntimeOptions) {
    const connection = createMatchConnection(options.connection);
    this.#viewStore = new MatchViewStore({
      mode: options.connection.mode,
      roomId: connection.roomId,
      actorId: options.connection.actorId ?? null,
      connection,
    });
    this.mode = options.connection.mode;
    this.roomId = connection.roomId;

    if (options.onStateChange) {
      this.#viewStore.subscribe(options.onStateChange);
    }
  }

  getState() {
    return this.#viewStore.getState();
  }

  subscribe(listener: ClientGameStateListener) {
    return this.#viewStore.subscribe(listener);
  }

  async start() {
    await this.#viewStore.connect();
  }

  setFpsEstimate(fpsEstimate: number) {
    this.#viewStore.setFpsEstimate(fpsEstimate);
  }

  async sendIntent(message: ClientMatchProposeActionMessage) {
    await this.#viewStore.sendIntent(
      ClientMatchProposeActionMessageSchema.parse(message),
    );
  }

  async requestReplay(request: { matchId?: string; replayId?: string }) {
    await this.#viewStore.requestReplay(
      ClientReplayRequestMessageSchema.parse({
        type: "client.replay.request",
        ...request,
      }),
    );
  }

  async seekReplay(replayId: string, tick: number) {
    await this.#viewStore.seekReplay(
      ClientReplaySeekMessageSchema.parse({
        type: "client.replay.seek",
        replayId,
        tick,
      }),
    );
  }

  async proposeMove(targetRoomId: MatchSnapshot["rooms"][number]["roomId"]) {
    const snapshot = this.getState().snapshot;
    const actorId = this.getState().actorId;

    if (!snapshot || !actorId) {
      return;
    }

    await this.sendIntent(
      ClientMatchProposeActionMessageSchema.parse({
        type: "client.match.propose-action",
        matchId: snapshot.matchId,
        proposal: {
          actionId: "move",
          actorId,
          phaseId: snapshot.phaseId,
          confidence: 0.72,
          emotionalIntent: "confident",
          targetRoomId,
        },
      }),
    );
  }

  async proposeStartTask(taskId: MatchSnapshot["tasks"][number]["taskId"]) {
    const snapshot = this.getState().snapshot;
    const actorId = this.getState().actorId;

    if (!snapshot || !actorId) {
      return;
    }

    await this.sendIntent(
      ClientMatchProposeActionMessageSchema.parse({
        type: "client.match.propose-action",
        matchId: snapshot.matchId,
        proposal: {
          actionId: "start-task",
          actorId,
          phaseId: snapshot.phaseId,
          confidence: 0.68,
          emotionalIntent: "calm",
          taskId,
        },
      }),
    );
  }

  async destroy() {
    await this.#viewStore.disconnect();
  }
}
