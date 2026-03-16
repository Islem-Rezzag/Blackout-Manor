import type { EngineState } from "@blackout-manor/engine";
import type { PlayerId } from "@blackout-manor/shared";

import {
  applySocialReasoningEvents,
  createSocialReasoningSnapshot,
  createSocialReasoningState,
  type SocialReasoningSnapshot,
  type SocialReasoningState,
} from "../heart/social";

type StoredSocialState = {
  state: SocialReasoningState;
  lastProcessedSequence: number;
};

const samePlayerRoster = (
  state: SocialReasoningState,
  engineState: EngineState,
) =>
  state.playerIds.length === engineState.players.length &&
  state.playerIds.every((playerId) =>
    engineState.players.some((player) => player.id === playerId),
  );

export class AgentSocialStateStore {
  readonly #states = new Map<PlayerId, StoredSocialState>();

  inspect(
    engineState: EngineState,
    actorId: PlayerId,
  ): {
    snapshot: SocialReasoningSnapshot;
    state: SocialReasoningState;
  } {
    const actor = engineState.players.find((player) => player.id === actorId);

    if (!actor) {
      throw new Error(
        `Cannot build social state for unknown actor ${actorId}.`,
      );
    }

    const existing = this.#states.get(actorId);
    const shouldReplayFromStart =
      !existing || !samePlayerRoster(existing.state, engineState);
    const baseState = shouldReplayFromStart
      ? createSocialReasoningState({
          selfId: actorId,
          players: engineState.players.map((player) => ({
            id: player.id,
            displayName: player.displayName,
          })),
          initialRelationships: actor.relationships,
        })
      : existing.state;
    const lastProcessedSequence = shouldReplayFromStart
      ? 0
      : existing.lastProcessedSequence;
    const nextEvents = engineState.eventLog.filter(
      (event) => event.sequence > lastProcessedSequence,
    );
    const nextState = applySocialReasoningEvents(baseState, nextEvents);
    const nextSequence = nextEvents.at(-1)?.sequence ?? lastProcessedSequence;

    this.#states.set(actorId, {
      state: nextState,
      lastProcessedSequence: nextSequence,
    });

    return {
      snapshot: createSocialReasoningSnapshot(nextState),
      state: nextState,
    };
  }

  getSnapshot(
    engineState: EngineState,
    actorId: PlayerId,
  ): SocialReasoningSnapshot {
    return this.inspect(engineState, actorId).snapshot;
  }
}
