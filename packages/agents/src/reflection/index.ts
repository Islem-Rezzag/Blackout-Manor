import type { PlayerId, RelationshipState } from "@blackout-manor/shared";

import { rankRelationshipTargets } from "../heart/relationships";
import type {
  BetrayalRecord,
  ContradictionRecord,
  PlayerBeliefEstimate,
  PromiseLedgerEntry,
  SocialReflection,
} from "../heart/social/types";

const compactSummary = (parts: string[], maxLength = 160) => {
  let summary = parts.filter(Boolean).join(" ");

  if (summary.length <= maxLength) {
    return summary;
  }

  while (summary.length > maxLength && parts.length > 1) {
    parts.pop();
    summary = parts.filter(Boolean).join(" ");
  }

  if (summary.length <= maxLength) {
    return summary;
  }

  return `${summary.slice(0, maxLength - 1).trimEnd()}…`;
};

const displayNameOf = (
  displayNames: Record<PlayerId, string>,
  playerId: PlayerId,
) => displayNames[playerId] ?? playerId;

const createTrustSummary = ({
  relationships,
  displayNames,
}: {
  relationships: Record<PlayerId, RelationshipState>;
  displayNames: Record<PlayerId, string>;
}) => {
  const trusted = rankRelationshipTargets(
    relationships,
    (relationship) =>
      relationship.trust * 0.45 +
      relationship.warmth * 0.25 +
      relationship.respect * 0.2 -
      relationship.grievance * 0.3 -
      relationship.fear * 0.2,
  )
    .filter((entry) => entry.score >= 0.34)
    .slice(0, 3)
    .map((entry) => displayNameOf(displayNames, entry.playerId));

  if (trusted.length === 0) {
    return "Trust is thin; nobody feels fully reliable yet.";
  }

  return compactSummary([`Trust: ${trusted.join(", ")} feel usable.`]);
};

const createFearSummary = ({
  relationships,
  displayNames,
}: {
  relationships: Record<PlayerId, RelationshipState>;
  displayNames: Record<PlayerId, string>;
}) => {
  const feared = rankRelationshipTargets(
    relationships,
    (relationship) =>
      relationship.fear * 0.5 +
      relationship.suspectScore * 0.35 +
      relationship.grievance * 0.2,
  )
    .filter((entry) => entry.score >= 0.26)
    .slice(0, 2)
    .map((entry) => displayNameOf(displayNames, entry.playerId));

  if (feared.length === 0) {
    return "Fear is manageable; nobody is controlling the room yet.";
  }

  return compactSummary([`Fear: ${feared.join(", ")} feel dangerous.`]);
};

const createRoomThinksOfMeSummary = ({
  tom,
  displayNames,
}: {
  tom: Record<PlayerId, PlayerBeliefEstimate>;
  displayNames: Record<PlayerId, string>;
}) => {
  const estimates = Object.values(tom);
  const doubters = estimates
    .filter((entry) => entry.suspicionOfMe >= 0.58)
    .sort((left, right) => right.suspicionOfMe - left.suspicionOfMe)
    .slice(0, 2)
    .map((entry) => displayNameOf(displayNames, entry.playerId));
  const supporters = estimates
    .filter((entry) => entry.supportOfMe >= 0.18)
    .sort((left, right) => right.supportOfMe - left.supportOfMe)
    .slice(0, 2)
    .map((entry) => displayNameOf(displayNames, entry.playerId));

  if (doubters.length === 0 && supporters.length === 0) {
    return "The room still reads me as ambiguous.";
  }

  const parts = [];

  if (doubters.length > 0) {
    parts.push(`${doubters.join(", ")} doubt me.`);
  }

  if (supporters.length > 0) {
    parts.push(`${supporters.join(", ")} still back me.`);
  }

  return compactSummary(parts);
};

const createNarrativeSummary = ({
  relationships,
  contradictions,
  betrayals,
  promiseLedger,
  tom,
  displayNames,
}: {
  relationships: Record<PlayerId, RelationshipState>;
  contradictions: readonly ContradictionRecord[];
  betrayals: readonly BetrayalRecord[];
  promiseLedger: readonly PromiseLedgerEntry[];
  tom: Record<PlayerId, PlayerBeliefEstimate>;
  displayNames: Record<PlayerId, string>;
}) => {
  const contradictionCounts = new Map<PlayerId, number>();
  const betrayalSeverity = new Map<PlayerId, number>();
  const roomConsensus = new Map<PlayerId, number>();

  for (const contradiction of contradictions) {
    contradictionCounts.set(
      contradiction.playerId,
      (contradictionCounts.get(contradiction.playerId) ?? 0) + 1,
    );
  }

  for (const betrayal of betrayals) {
    betrayalSeverity.set(
      betrayal.sourcePlayerId,
      (betrayalSeverity.get(betrayal.sourcePlayerId) ?? 0) + betrayal.severity,
    );
  }

  for (const estimate of Object.values(tom)) {
    if (!estimate.likelyNextAccusationTarget) {
      continue;
    }

    roomConsensus.set(
      estimate.likelyNextAccusationTarget,
      (roomConsensus.get(estimate.likelyNextAccusationTarget) ?? 0) + 1,
    );
  }

  const focusTarget = Object.entries(relationships)
    .map(([playerId, relationship]) => ({
      playerId: playerId as PlayerId,
      score:
        relationship.suspectScore * 0.42 +
        (contradictionCounts.get(playerId as PlayerId) ?? 0) * 0.14 +
        (betrayalSeverity.get(playerId as PlayerId) ?? 0) * 0.09 +
        (roomConsensus.get(playerId as PlayerId) ?? 0) * 0.07 -
        relationship.trust * 0.2,
    }))
    .sort((left, right) => right.score - left.score)[0];
  const openPromisesToMe = promiseLedger.filter(
    (entry) => entry.status === "open",
  );

  if (!focusTarget || focusTarget.score < 0.38) {
    return compactSummary([
      "Next meeting: keep my timeline tight, avoid split blame, and lean on corroboration.",
    ]);
  }

  const focusName = displayNameOf(displayNames, focusTarget.playerId);
  const reasons = [];

  if ((contradictionCounts.get(focusTarget.playerId) ?? 0) > 0) {
    reasons.push("their story moved");
  }

  if ((betrayalSeverity.get(focusTarget.playerId) ?? 0) > 0) {
    reasons.push("their promises look weak");
  }

  if ((roomConsensus.get(focusTarget.playerId) ?? 0) > 1) {
    reasons.push("the room is already circling them");
  }

  if (
    reasons.length === 0 &&
    openPromisesToMe.some((entry) => entry.promiserId === focusTarget.playerId)
  ) {
    reasons.push("their promise to me is leverage");
  }

  return compactSummary([
    `Next meeting: center ${focusName}`,
    reasons.length > 0
      ? `because ${reasons.join(" and ")}.`
      : "because their timeline still feels soft.",
  ]);
};

export const createSocialReflection = ({
  relationships,
  contradictions,
  betrayals,
  promiseLedger,
  tom,
  displayNames,
}: {
  relationships: Record<PlayerId, RelationshipState>;
  contradictions: readonly ContradictionRecord[];
  betrayals: readonly BetrayalRecord[];
  promiseLedger: readonly PromiseLedgerEntry[];
  tom: Record<PlayerId, PlayerBeliefEstimate>;
  displayNames: Record<PlayerId, string>;
}): SocialReflection => ({
  trustSummary: createTrustSummary({ relationships, displayNames }),
  fearSummary: createFearSummary({ relationships, displayNames }),
  roomThinksOfMeSummary: createRoomThinksOfMeSummary({
    tom,
    displayNames,
  }),
  nextMeetingNarrativeSummary: createNarrativeSummary({
    relationships,
    contradictions,
    betrayals,
    promiseLedger,
    tom,
    displayNames,
  }),
});

export const SOCIAL_REFLECTION_MAX_LENGTH = 160;
