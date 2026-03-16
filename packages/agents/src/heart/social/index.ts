import type { EngineEvent } from "@blackout-manor/engine";
import type { AgentActionProposal, PlayerId } from "@blackout-manor/shared";

import { createSocialReflection } from "../../reflection";
import {
  applyClaimObservations,
  interpretSpeech,
  recordPromise,
  resolvePromiseBetrayals,
} from "../memory";
import {
  applyRelationshipDelta,
  createRelationshipGraph,
} from "../relationships";
import {
  createTomSignalGraph,
  deriveTheoryOfMindEstimates,
  updateTomSignalsForProposal,
} from "../tom";
import type {
  PlayerBeliefEstimate,
  SocialReasoningSeed,
  SocialReasoningSnapshot,
  SocialReasoningState,
} from "./types";

const selfSupportDeltas: Partial<
  Record<
    AgentActionProposal["actionId"],
    Parameters<typeof applyRelationshipDelta>[2]
  >
> = {
  comfort: {
    trust: 0.08,
    warmth: 0.08,
    respect: 0.04,
    debt: 0.05,
    suspectScore: -0.04,
    grievance: -0.03,
  },
  reassure: {
    trust: 0.1,
    warmth: 0.08,
    respect: 0.04,
    debt: 0.04,
    suspectScore: -0.05,
    grievance: -0.03,
  },
  apologize: {
    trust: 0.06,
    warmth: 0.05,
    grievance: -0.08,
    suspectScore: -0.04,
  },
  confide: {
    trust: 0.07,
    warmth: 0.08,
    debt: 0.06,
    suspectScore: -0.03,
  },
  promise: {
    trust: 0.09,
    warmth: 0.07,
    respect: 0.03,
    debt: 0.06,
    suspectScore: -0.04,
  },
  "escort-player": {
    trust: 0.08,
    warmth: 0.06,
    respect: 0.07,
    debt: 0.05,
    suspectScore: -0.04,
  },
};

const selfHostileDeltas: Partial<
  Record<
    AgentActionProposal["actionId"],
    Parameters<typeof applyRelationshipDelta>[2]
  >
> = {
  press: {
    trust: -0.12,
    warmth: -0.08,
    fear: 0.12,
    grievance: 0.16,
    suspectScore: 0.08,
    predictedSuspicionOfMe: 0.15,
  },
  "vote-player": {
    trust: -0.18,
    warmth: -0.12,
    fear: 0.15,
    grievance: 0.2,
    suspectScore: 0.1,
    predictedSuspicionOfMe: 0.22,
  },
  eliminate: {
    trust: -0.24,
    warmth: -0.2,
    fear: 0.35,
    grievance: 0.3,
    suspectScore: 0.24,
  },
};

const observedSupportDeltas = {
  trust: 0.01,
  warmth: 0.02,
  respect: 0.04,
  suspectScore: -0.01,
};

const observedHostileDeltas = {
  respect: -0.03,
  suspectScore: 0.04,
};

const contradictionDeltas = {
  trust: -0.12,
  respect: -0.04,
  grievance: 0.04,
  suspectScore: 0.14,
};

const betrayalDeltas = {
  trust: -0.24,
  warmth: -0.16,
  respect: -0.08,
  fear: 0.08,
  grievance: 0.18,
  suspectScore: 0.12,
};

const isHostileAction = (proposal: AgentActionProposal) =>
  proposal.actionId === "press" ||
  proposal.actionId === "vote-player" ||
  proposal.actionId === "eliminate";

const isSupportiveAction = (proposal: AgentActionProposal) =>
  proposal.actionId === "comfort" ||
  proposal.actionId === "reassure" ||
  proposal.actionId === "apologize" ||
  proposal.actionId === "confide" ||
  proposal.actionId === "promise" ||
  proposal.actionId === "escort-player";

const explicitTargetPlayerId = (proposal: AgentActionProposal) =>
  "targetPlayerId" in proposal ? proposal.targetPlayerId : null;

const hydrateDerivedState = (state: SocialReasoningState) => {
  const tom = deriveTheoryOfMindEstimates({
    selfId: state.selfId,
    playerIds: state.playerIds,
    signals: state.tomSignals,
    relationships: state.relationships,
  });
  const relationships = Object.fromEntries(
    Object.entries(state.relationships).map(([playerId, relationship]) => [
      playerId,
      {
        ...relationship,
        predictedSuspicionOfMe:
          tom[playerId as PlayerId]?.suspicionOfMe ??
          relationship.predictedSuspicionOfMe,
      },
    ]),
  ) as SocialReasoningState["relationships"];
  const reflection = createSocialReflection({
    relationships,
    contradictions: state.contradictions,
    betrayals: state.betrayals,
    promiseLedger: state.promiseLedger,
    tom,
    displayNames: state.displayNames,
  });

  return {
    ...state,
    relationships,
    tom,
    reflection,
  };
};

export const createSocialReasoningState = (
  seed: SocialReasoningSeed,
): SocialReasoningState => {
  const displayNames = Object.fromEntries(
    seed.players.map((player) => [player.id, player.displayName]),
  ) as Record<PlayerId, string>;
  const playerIds = seed.players.map((player) => player.id);

  return hydrateDerivedState({
    selfId: seed.selfId,
    playerIds,
    displayNames,
    relationships: createRelationshipGraph(
      playerIds.filter((playerId) => playerId !== seed.selfId),
      seed.initialRelationships,
    ),
    promiseLedger: [],
    betrayals: [],
    contradictions: [],
    trackedClaims: {},
    tomSignals: createTomSignalGraph(playerIds),
    tom: {},
    reflection: {
      trustSummary: "",
      fearSummary: "",
      roomThinksOfMeSummary: "",
      nextMeetingNarrativeSummary: "",
    },
    lastUpdatedTick: 0,
  });
};

const applyRelationshipObservation = (
  state: SocialReasoningState,
  proposal: AgentActionProposal,
) => {
  const targetPlayerId = explicitTargetPlayerId(proposal);
  let relationships = state.relationships;

  if (proposal.actorId !== state.selfId) {
    if (targetPlayerId === state.selfId) {
      if (isSupportiveAction(proposal)) {
        const delta = selfSupportDeltas[proposal.actionId];

        if (delta) {
          relationships = applyRelationshipDelta(
            relationships,
            proposal.actorId,
            delta,
          );
        }
      }

      if (isHostileAction(proposal)) {
        const delta = selfHostileDeltas[proposal.actionId];

        if (delta) {
          relationships = applyRelationshipDelta(
            relationships,
            proposal.actorId,
            delta,
          );
        }
      }
    } else if (isSupportiveAction(proposal)) {
      relationships = applyRelationshipDelta(
        relationships,
        proposal.actorId,
        observedSupportDeltas,
      );
    } else if (isHostileAction(proposal)) {
      relationships = applyRelationshipDelta(
        relationships,
        proposal.actorId,
        observedHostileDeltas,
      );
    } else if (proposal.actionId === "report-body") {
      relationships = applyRelationshipDelta(relationships, proposal.actorId, {
        respect: 0.07,
        suspectScore: -0.03,
      });
    } else if (proposal.actionId === "call-meeting") {
      relationships = applyRelationshipDelta(relationships, proposal.actorId, {
        respect: 0.03,
      });
    }
  }

  return relationships;
};

const applyProposalObservation = (
  state: SocialReasoningState,
  proposal: AgentActionProposal,
  tick: number,
) => {
  let nextState = {
    ...state,
    relationships: applyRelationshipObservation(state, proposal),
    lastUpdatedTick: tick,
  };
  const targetPlayerId = explicitTargetPlayerId(proposal);
  const interpretation = proposal.speech
    ? interpretSpeech({
        speakerId: proposal.actorId,
        text: proposal.speech.text,
        tick,
        playerIds: state.playerIds,
        displayNames: state.displayNames,
      })
    : undefined;

  if (proposal.actionId === "promise" && targetPlayerId) {
    nextState = {
      ...nextState,
      promiseLedger: recordPromise(nextState.promiseLedger, {
        promiserId: proposal.actorId,
        promiseeId: targetPlayerId,
        text: proposal.promiseText,
        createdAtTick: tick,
      }),
    };
  }

  if (targetPlayerId) {
    const resolved = resolvePromiseBetrayals({
      ledger: nextState.promiseLedger,
      betrayals: nextState.betrayals,
      actorId: proposal.actorId,
      targetPlayerId,
      actionId: proposal.actionId,
      tick,
    });

    nextState = {
      ...nextState,
      promiseLedger: resolved.ledger,
      betrayals: resolved.betrayals,
    };

    if (
      proposal.actorId !== state.selfId &&
      resolved.betrayedPlayerIds.length > 0
    ) {
      nextState = {
        ...nextState,
        relationships: applyRelationshipDelta(
          nextState.relationships,
          proposal.actorId,
          betrayalDeltas,
        ),
      };
    }
  }

  if (interpretation) {
    const claimUpdates = applyClaimObservations(
      nextState.trackedClaims,
      nextState.contradictions,
      interpretation.claims,
    );

    nextState = {
      ...nextState,
      trackedClaims: claimUpdates.trackedClaims,
      contradictions: claimUpdates.contradictions,
    };

    for (const playerId of claimUpdates.contradictionPlayerIds) {
      if (playerId === state.selfId) {
        continue;
      }

      nextState = {
        ...nextState,
        relationships: applyRelationshipDelta(
          nextState.relationships,
          playerId,
          contradictionDeltas,
        ),
      };
    }
  }

  nextState = {
    ...nextState,
    tomSignals: updateTomSignalsForProposal({
      signals: nextState.tomSignals,
      selfId: state.selfId,
      proposal,
      playerIds: state.playerIds,
      ...(interpretation ? { interpretation } : {}),
    }),
  };

  return nextState;
};

export const applySocialReasoningEvent = (
  state: SocialReasoningState,
  event: EngineEvent,
) => {
  let nextState = {
    ...state,
    lastUpdatedTick: event.tick,
  };

  if (event.type === "action-recorded") {
    nextState = applyProposalObservation(nextState, event.proposal, event.tick);
  }

  return hydrateDerivedState(nextState);
};

export const applySocialReasoningEvents = (
  state: SocialReasoningState,
  events: readonly EngineEvent[],
) => events.reduce(applySocialReasoningEvent, state);

export const createSocialReasoningSnapshot = (
  state: SocialReasoningState,
): SocialReasoningSnapshot => ({
  reflection: state.reflection,
  relationships: state.relationships,
  relationshipFocus: Object.entries(state.relationships)
    .map(([playerId, relationship]) => ({
      playerId: playerId as PlayerId,
      trust: relationship.trust,
      fear: relationship.fear,
      suspectScore: relationship.suspectScore,
      predictedSuspicionOfMe: relationship.predictedSuspicionOfMe,
    }))
    .sort((left, right) => {
      const leftScore = left.suspectScore + left.fear * 0.4 - left.trust * 0.25;
      const rightScore =
        right.suspectScore + right.fear * 0.4 - right.trust * 0.25;

      return rightScore - leftScore;
    })
    .slice(0, 4),
  openPromises: state.promiseLedger
    .filter((entry) => entry.status === "open")
    .slice(-3),
  recentBetrayals: state.betrayals.slice(-3),
  contradictions: state.contradictions.slice(-3),
  tomFocus: Object.values(state.tom)
    .sort((left, right) => {
      const leftScore =
        left.suspicionOfMe + (left.likelyNextAccusationTarget ? 0.15 : 0);
      const rightScore =
        right.suspicionOfMe + (right.likelyNextAccusationTarget ? 0.15 : 0);

      return rightScore - leftScore;
    })
    .slice(0, 4) as PlayerBeliefEstimate[],
});

export type * from "./types";
