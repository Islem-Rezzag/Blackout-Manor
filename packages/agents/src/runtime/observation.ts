import type { EngineEvent, EngineState } from "@blackout-manor/engine";
import {
  type BodyLanguageId,
  type MemoryEvent,
  type PlayerId,
  type PrivateObservation,
  PrivateObservationSchema,
} from "@blackout-manor/shared";

import type { PhaseActionBudget } from "../config/actionBudgets";
import type { AgentDecisionCandidate } from "../model/types";

const toBodyLanguage = (
  pleasure: number,
  arousal: number,
  dominance: number,
  intensity: number,
  label: string,
): BodyLanguageId => {
  if (label === "afraid" || label === "guilty" || intensity >= 0.8) {
    return "shaken";
  }

  if (dominance >= 0.45 && pleasure >= 0.18 && intensity <= 0.78) {
    return "confident";
  }

  if (dominance > 0.35 && intensity >= 0.5) {
    return "defiant";
  }

  if (arousal >= 0.45 || pleasure <= -0.25) {
    return "agitated";
  }

  return "calm";
};

const stringifyEngineEvent = (event: EngineEvent) => {
  switch (event.type) {
    case "phase-changed":
      return `Phase shifted from ${event.fromPhaseId} to ${event.toPhaseId}.`;
    case "vote-resolved":
      return event.exiledPlayerId
        ? `${event.exiledPlayerId} was exiled after the vote.`
        : "The vote resolved without an exile.";
    case "win-declared":
      return `${event.winner.team} won by ${event.winner.reason}.`;
    case "action-recorded":
      return `${event.proposal.actorId} chose ${event.proposal.actionId}.`;
    case "roles-assigned":
      return "Roles were assigned.";
    case "tick-advanced":
      return `Tick advanced to ${event.nextTick}.`;
    case "match-bootstrapped":
      return "The match was bootstrapped.";
    default:
      return "Engine event recorded.";
  }
};

const speechClaimsFromEvents = (events: readonly EngineEvent[]) =>
  events
    .flatMap((event) =>
      event.type === "action-recorded" && event.proposal.speech
        ? [
            `${event.proposal.actorId}: ${event.proposal.speech.text}`.slice(
              0,
              180,
            ),
          ]
        : [],
    )
    .reverse();

const sortedMemories = (memories: readonly MemoryEvent[]) =>
  [...memories].sort((left, right) => right.salience - left.salience);

export const createPrivateObservation = (
  state: EngineState,
  actorId: PlayerId,
  candidates: readonly AgentDecisionCandidate[],
  budget: PhaseActionBudget,
): PrivateObservation => {
  const actor = state.players.find((player) => player.id === actorId);

  if (!actor || actor.roomId === null) {
    throw new Error(
      `Cannot build observation for unavailable actor ${actorId}.`,
    );
  }

  const recentEvents = state.eventLog.slice(-budget.maxVisibleEvents);
  const recentClaims = speechClaimsFromEvents(state.eventLog).slice(
    0,
    budget.maxRecentClaims,
  );

  return PrivateObservationSchema.parse({
    phaseId: state.phaseId,
    self: {
      id: actor.id,
      role: actor.role,
      roomId: actor.roomId,
      emotion: actor.emotion,
      publicImage: actor.publicImage,
    },
    visiblePlayers: state.players
      .filter(
        (player) =>
          player.id !== actor.id &&
          player.status === "alive" &&
          player.roomId === actor.roomId,
      )
      .slice(0, 9)
      .map((player) => ({
        id: player.id,
        roomId: player.roomId ?? actor.roomId,
        state: toBodyLanguage(
          player.emotion.pleasure,
          player.emotion.arousal,
          player.emotion.dominance,
          player.emotion.intensity,
          player.emotion.label,
        ),
      })),
    visibleEvents: recentEvents.map(stringifyEngineEvent),
    recentClaims,
    topMemories: sortedMemories(actor.memories).slice(0, budget.maxMemories),
    relationships: actor.relationships,
    legalActions: [
      ...new Set(candidates.map((candidate) => candidate.template.actionId)),
    ],
  });
};
