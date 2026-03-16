import type { PlayerId, RelationshipState } from "@blackout-manor/shared";

import type { RelationshipDelta } from "../social/types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const NEUTRAL_RELATIONSHIP_VECTOR: RelationshipState = {
  trust: 0.5,
  warmth: 0.5,
  fear: 0,
  respect: 0.5,
  debt: 0,
  grievance: 0,
  suspectScore: 0.5,
  predictedSuspicionOfMe: 0.5,
};

export const createRelationshipGraph = (
  playerIds: readonly PlayerId[],
  initialRelationships: Record<PlayerId, RelationshipState> = {},
) =>
  Object.fromEntries(
    playerIds.map((playerId) => [
      playerId,
      {
        ...NEUTRAL_RELATIONSHIP_VECTOR,
        ...(initialRelationships[playerId] ?? {}),
      },
    ]),
  ) as Record<PlayerId, RelationshipState>;

export const applyRelationshipDelta = (
  relationships: Record<PlayerId, RelationshipState>,
  targetPlayerId: PlayerId,
  delta: RelationshipDelta,
) => {
  const current = relationships[targetPlayerId] ?? NEUTRAL_RELATIONSHIP_VECTOR;

  return {
    ...relationships,
    [targetPlayerId]: {
      trust: clamp01(current.trust + (delta.trust ?? 0)),
      warmth: clamp01(current.warmth + (delta.warmth ?? 0)),
      fear: clamp01(current.fear + (delta.fear ?? 0)),
      respect: clamp01(current.respect + (delta.respect ?? 0)),
      debt: clamp01(current.debt + (delta.debt ?? 0)),
      grievance: clamp01(current.grievance + (delta.grievance ?? 0)),
      suspectScore: clamp01(current.suspectScore + (delta.suspectScore ?? 0)),
      predictedSuspicionOfMe: clamp01(
        current.predictedSuspicionOfMe + (delta.predictedSuspicionOfMe ?? 0),
      ),
    },
  };
};

export const rankRelationshipTargets = (
  relationships: Record<PlayerId, RelationshipState>,
  scorer: (relationship: RelationshipState) => number,
) =>
  Object.entries(relationships)
    .map(([playerId, relationship]) => ({
      playerId: playerId as PlayerId,
      relationship,
      score: scorer(relationship),
    }))
    .sort((left, right) => right.score - left.score);
