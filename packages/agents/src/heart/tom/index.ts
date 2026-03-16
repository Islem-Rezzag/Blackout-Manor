import type {
  AgentActionProposal,
  PlayerId,
  RelationshipState,
} from "@blackout-manor/shared";

import type {
  PlayerBeliefEstimate,
  SpeechInterpretation,
  TheoryOfMindSignal,
} from "../social/types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const accusationWeightByActionId: Partial<
  Record<AgentActionProposal["actionId"], number>
> = {
  press: 0.26,
  "vote-player": 0.4,
  eliminate: 0.55,
  "report-body": 0.08,
};

const supportWeightByActionId: Partial<
  Record<AgentActionProposal["actionId"], number>
> = {
  comfort: 0.18,
  reassure: 0.2,
  apologize: 0.12,
  confide: 0.22,
  promise: 0.18,
  "escort-player": 0.22,
};

const createTargetRecord = (playerIds: readonly PlayerId[]) =>
  Object.fromEntries(playerIds.map((playerId) => [playerId, 0])) as Record<
    PlayerId,
    number
  >;

const addSignal = (
  record: Record<PlayerId, number>,
  playerId: PlayerId,
  delta: number,
) => ({
  ...record,
  [playerId]: clamp01((record[playerId] ?? 0) + delta),
});

const cosineSimilarity = (
  left: Record<PlayerId, number>,
  right: Record<PlayerId, number>,
  playerIds: readonly PlayerId[],
) => {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const playerId of playerIds) {
    const leftValue = left[playerId] ?? 0;
    const rightValue = right[playerId] ?? 0;

    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
};

export const createTomSignalGraph = (playerIds: readonly PlayerId[]) =>
  Object.fromEntries(
    playerIds.map((playerId) => [
      playerId,
      {
        suspicionByTarget: createTargetRecord(playerIds),
        supportByTarget: createTargetRecord(playerIds),
        lastAccusationTarget: null,
        lastSupportTarget: null,
      } satisfies TheoryOfMindSignal,
    ]),
  ) as Record<PlayerId, TheoryOfMindSignal>;

export const updateTomSignalsForProposal = ({
  signals,
  selfId,
  proposal,
  interpretation,
  playerIds,
}: {
  signals: Record<PlayerId, TheoryOfMindSignal>;
  selfId: PlayerId;
  proposal: AgentActionProposal;
  interpretation?: SpeechInterpretation;
  playerIds: readonly PlayerId[];
}) => {
  const actorSignals = signals[proposal.actorId] ?? {
    suspicionByTarget: createTargetRecord(playerIds),
    supportByTarget: createTargetRecord(playerIds),
    lastAccusationTarget: null,
    lastSupportTarget: null,
  };
  let nextSignals = signals;
  const accusationWeight = accusationWeightByActionId[proposal.actionId] ?? 0;
  const supportWeight = supportWeightByActionId[proposal.actionId] ?? 0;
  const targetPlayerId =
    "targetPlayerId" in proposal ? proposal.targetPlayerId : undefined;
  let nextActorSignals = actorSignals;

  if (targetPlayerId && accusationWeight > 0) {
    nextActorSignals = {
      ...nextActorSignals,
      suspicionByTarget: addSignal(
        nextActorSignals.suspicionByTarget,
        targetPlayerId,
        accusationWeight,
      ),
      lastAccusationTarget: targetPlayerId,
    };
  }

  if (targetPlayerId && supportWeight > 0) {
    nextActorSignals = {
      ...nextActorSignals,
      supportByTarget: addSignal(
        nextActorSignals.supportByTarget,
        targetPlayerId,
        supportWeight,
      ),
      lastSupportTarget: targetPlayerId,
    };
  }

  if (interpretation) {
    for (const playerId of interpretation.accusationTargetIds) {
      nextActorSignals = {
        ...nextActorSignals,
        suspicionByTarget: addSignal(
          nextActorSignals.suspicionByTarget,
          playerId,
          0.18,
        ),
        lastAccusationTarget: playerId,
      };
    }

    for (const playerId of interpretation.supportTargetIds) {
      nextActorSignals = {
        ...nextActorSignals,
        supportByTarget: addSignal(
          nextActorSignals.supportByTarget,
          playerId,
          0.14,
        ),
        lastSupportTarget: playerId,
      };
    }
  }

  nextSignals = {
    ...nextSignals,
    [proposal.actorId]: nextActorSignals,
  };

  if (proposal.actorId === selfId && targetPlayerId) {
    const targetSignals = nextSignals[targetPlayerId] ?? {
      suspicionByTarget: createTargetRecord(playerIds),
      supportByTarget: createTargetRecord(playerIds),
      lastAccusationTarget: null,
      lastSupportTarget: null,
    };

    nextSignals = {
      ...nextSignals,
      [targetPlayerId]: {
        ...targetSignals,
        suspicionByTarget:
          accusationWeight > 0
            ? addSignal(
                targetSignals.suspicionByTarget,
                selfId,
                accusationWeight * 0.8,
              )
            : targetSignals.suspicionByTarget,
        supportByTarget:
          supportWeight > 0
            ? addSignal(
                targetSignals.supportByTarget,
                selfId,
                supportWeight * 0.85,
              )
            : targetSignals.supportByTarget,
      },
    };
  }

  return nextSignals;
};

export const deriveTheoryOfMindEstimates = ({
  selfId,
  playerIds,
  signals,
  relationships,
}: {
  selfId: PlayerId;
  playerIds: readonly PlayerId[];
  signals: Record<PlayerId, TheoryOfMindSignal>;
  relationships: Record<PlayerId, RelationshipState>;
}) =>
  Object.fromEntries(
    playerIds
      .filter((playerId) => playerId !== selfId)
      .map((playerId) => {
        const signal = signals[playerId];
        const relationship = relationships[playerId];
        const likelyBeliefs = playerIds
          .filter((targetPlayerId) => targetPlayerId !== playerId)
          .map((targetPlayerId) => {
            const suspicionWeight =
              signal?.suspicionByTarget[targetPlayerId] ?? 0;
            const supportWeight = signal?.supportByTarget[targetPlayerId] ?? 0;
            const suspectScore = clamp01(
              0.28 + suspicionWeight * 0.78 - supportWeight * 0.32,
            );

            return {
              playerId: targetPlayerId,
              suspectScore,
              likelyRole:
                suspectScore >= 0.65
                  ? ("shadow" as const)
                  : suspectScore <= 0.3 && supportWeight >= 0.12
                    ? ("household" as const)
                    : ("unknown" as const),
            };
          })
          .sort((left, right) => right.suspectScore - left.suspectScore)
          .slice(0, 3);
        const suspicionOfMe = clamp01(
          (relationship?.predictedSuspicionOfMe ?? 0.5) * 0.45 +
            (signal?.suspicionByTarget[selfId] ?? 0) * 0.65 -
            (signal?.supportByTarget[selfId] ?? 0) * 0.22,
        );
        const supportOfMe = clamp01(
          (signal?.supportByTarget[selfId] ?? 0) * 0.85 +
            Math.max(0, (relationship?.trust ?? 0.5) - 0.5) * 0.25,
        );
        const likelyAllies = playerIds
          .filter(
            (candidateId) => candidateId !== playerId && candidateId !== selfId,
          )
          .map((candidateId) => {
            const candidateSignal = signals[candidateId];
            const allyScore = clamp01(
              (signal?.supportByTarget[candidateId] ?? 0) * 0.5 +
                (candidateSignal?.supportByTarget[playerId] ?? 0) * 0.35 +
                cosineSimilarity(
                  signal?.suspicionByTarget ?? createTargetRecord(playerIds),
                  candidateSignal?.suspicionByTarget ??
                    createTargetRecord(playerIds),
                  playerIds,
                ) *
                  0.35 -
                (signal?.suspicionByTarget[candidateId] ?? 0) * 0.45,
            );

            return {
              playerId: candidateId,
              allyScore,
            };
          })
          .filter((entry) => entry.allyScore >= 0.25)
          .sort((left, right) => right.allyScore - left.allyScore)
          .slice(0, 2)
          .map((entry) => entry.playerId);
        const likelyNextAccusationTarget =
          likelyBeliefs.find(
            (entry) => entry.playerId !== selfId && entry.suspectScore >= 0.46,
          )?.playerId ??
          signal?.lastAccusationTarget ??
          null;

        return [
          playerId,
          {
            playerId,
            likelyBeliefs,
            suspicionOfMe,
            supportOfMe,
            likelyAllies,
            likelyNextAccusationTarget,
          } satisfies PlayerBeliefEstimate,
        ];
      }),
  ) as Record<PlayerId, PlayerBeliefEstimate>;
