import { type PlayerId, ROOM_IDS } from "@blackout-manor/shared";

import type {
  BetrayalRecord,
  ContradictionRecord,
  PromiseLedgerEntry,
  SocialClaim,
  SpeechInterpretation,
} from "../social/types";

const HOSTILE_ACTION_IDS = new Set(["press", "vote-player", "eliminate"]);

const roomAliases = new Map(
  ROOM_IDS.map((roomId) => [roomId.replaceAll("-", " "), roomId]),
);

const compactText = (text: string, maxLength = 160) => {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeRoomReference = (value: string) => {
  const normalized = normalizeToken(value);

  return roomAliases.get(normalized) ?? normalized.replaceAll(" ", "-");
};

const createPlayerAliasMap = (
  playerIds: readonly PlayerId[],
  displayNames: Record<PlayerId, string>,
) => {
  const aliases = new Map<string, PlayerId>();

  for (const playerId of playerIds) {
    aliases.set(normalizeToken(playerId), playerId);

    const displayName = displayNames[playerId];

    if (!displayName) {
      continue;
    }

    aliases.set(normalizeToken(displayName), playerId);
    aliases.set(normalizeToken(displayName.replace(/\s+/g, "-")), playerId);

    const firstToken = displayName.split(/\s+/)[0];

    if (firstToken) {
      aliases.set(normalizeToken(firstToken), playerId);
    }
  }

  return aliases;
};

export const extractPlayerReferences = (
  text: string,
  playerIds: readonly PlayerId[],
  displayNames: Record<PlayerId, string>,
) => {
  const normalized = normalizeToken(text);
  const aliasMap = createPlayerAliasMap(playerIds, displayNames);
  const matches = new Set<PlayerId>();

  for (const [alias, playerId] of aliasMap.entries()) {
    if (alias && normalized.includes(alias)) {
      matches.add(playerId);
    }
  }

  return [...matches];
};

const createClaim = (
  id: string,
  playerId: PlayerId,
  key: string,
  value: string,
  tick: number,
  sourceText: string,
): SocialClaim => ({
  id,
  playerId,
  key,
  value,
  tick,
  summary: compactText(`${playerId} claimed ${key} = ${value}.`, 120),
  sourceText: compactText(sourceText, 180),
});

const addUniquePlayerIds = (
  target: Set<PlayerId>,
  playerIds: readonly PlayerId[],
) => {
  for (const playerId of playerIds) {
    target.add(playerId);
  }
};

export const interpretSpeech = ({
  speakerId,
  text,
  tick,
  playerIds,
  displayNames,
}: {
  speakerId: PlayerId;
  text: string;
  tick: number;
  playerIds: readonly PlayerId[];
  displayNames: Record<PlayerId, string>;
}): SpeechInterpretation => {
  const claims: SocialClaim[] = [];
  const accusationTargetIds = new Set<PlayerId>();
  const supportTargetIds = new Set<PlayerId>();
  const sourceText = compactText(text, 180);

  for (const match of sourceText.matchAll(
    /\bi was in the ([a-z][a-z -]+?)(?= with |[.!?,]|$)/gi,
  )) {
    const roomCapture = match[1];

    if (!roomCapture) {
      continue;
    }

    claims.push(
      createClaim(
        `${speakerId}:self-room:${tick}:${claims.length}`,
        speakerId,
        "self-room",
        normalizeRoomReference(roomCapture),
        tick,
        sourceText,
      ),
    );
  }

  for (const match of sourceText.matchAll(
    /\bi was with ([a-z0-9][a-z0-9 _-]+?)(?:[.!?,]|$)/gi,
  )) {
    const playerCapture = match[1];

    if (!playerCapture) {
      continue;
    }

    const references = extractPlayerReferences(
      playerCapture,
      playerIds,
      displayNames,
    );

    if (!references[0]) {
      continue;
    }

    claims.push(
      createClaim(
        `${speakerId}:self-with:${tick}:${claims.length}`,
        speakerId,
        "self-with",
        references[0],
        tick,
        sourceText,
      ),
    );
    addUniquePlayerIds(supportTargetIds, references);
  }

  for (const match of sourceText.matchAll(
    /\bi was in the [a-z][a-z -]+ with ([a-z0-9][a-z0-9 _-]+?)(?:[.!?,]|$)/gi,
  )) {
    const playerCapture = match[1];

    if (!playerCapture) {
      continue;
    }

    addUniquePlayerIds(
      supportTargetIds,
      extractPlayerReferences(playerCapture, playerIds, displayNames),
    );
  }

  for (const match of sourceText.matchAll(
    /\bi saw ([a-z0-9][a-z0-9 _-]+?) in the ([a-z][a-z -]+?)(?:[.!?,]|$)/gi,
  )) {
    const playerCapture = match[1];
    const roomCapture = match[2];

    if (!playerCapture || !roomCapture) {
      continue;
    }

    const references = extractPlayerReferences(
      playerCapture,
      playerIds,
      displayNames,
    );

    for (const playerId of references) {
      claims.push(
        createClaim(
          `${speakerId}:saw:${playerId}:room:${tick}:${claims.length}`,
          speakerId,
          `saw:${playerId}:room`,
          normalizeRoomReference(roomCapture),
          tick,
          sourceText,
        ),
      );
      accusationTargetIds.add(playerId);
    }
  }

  const lowerText = sourceText.toLowerCase();
  const referencedPlayers = extractPlayerReferences(
    sourceText,
    playerIds,
    displayNames,
  ).filter((playerId) => playerId !== speakerId);

  if (
    lowerText.includes("don't trust") ||
    lowerText.includes("do not trust") ||
    lowerText.includes("lied") ||
    lowerText.includes("false") ||
    lowerText.includes("shadow")
  ) {
    addUniquePlayerIds(accusationTargetIds, referencedPlayers);
  }

  if (
    lowerText.includes("trust") ||
    lowerText.includes("with me") ||
    lowerText.includes("vouch for") ||
    lowerText.includes("clear")
  ) {
    addUniquePlayerIds(supportTargetIds, referencedPlayers);
  }

  return {
    claims,
    accusationTargetIds: [...accusationTargetIds],
    supportTargetIds: [...supportTargetIds],
  };
};

export const applyClaimObservations = (
  trackedClaims: Record<PlayerId, Record<string, SocialClaim>>,
  contradictions: readonly ContradictionRecord[],
  claims: readonly SocialClaim[],
) => {
  let nextTrackedClaims = trackedClaims;
  const nextContradictions = [...contradictions];
  const contradictionPlayerIds = new Set<PlayerId>();

  for (const claim of claims) {
    const playerClaims = nextTrackedClaims[claim.playerId] ?? {};
    const previousClaim = playerClaims[claim.key];

    if (previousClaim && previousClaim.value !== claim.value) {
      nextContradictions.push({
        id: `${claim.playerId}:${claim.key}:${claim.tick}`,
        playerId: claim.playerId,
        claimKey: claim.key,
        previousValue: previousClaim.value,
        currentValue: claim.value,
        firstTick: previousClaim.tick,
        latestTick: claim.tick,
        severity: 0.74,
        summary: compactText(
          `${claim.playerId} changed ${claim.key} from ${previousClaim.value} to ${claim.value}.`,
        ),
      });
      contradictionPlayerIds.add(claim.playerId);
    }

    nextTrackedClaims = {
      ...nextTrackedClaims,
      [claim.playerId]: {
        ...playerClaims,
        [claim.key]: claim,
      },
    };
  }

  return {
    trackedClaims: nextTrackedClaims,
    contradictions: nextContradictions,
    contradictionPlayerIds: [...contradictionPlayerIds],
  };
};

export const recordPromise = (
  ledger: readonly PromiseLedgerEntry[],
  entry: Omit<PromiseLedgerEntry, "id" | "status">,
) => [
  ...ledger,
  {
    ...entry,
    id: `${entry.promiserId}:${entry.promiseeId}:${entry.createdAtTick}`,
    status: "open" as const,
  },
];

export const resolvePromiseBetrayals = ({
  ledger,
  betrayals,
  actorId,
  targetPlayerId,
  actionId,
  tick,
}: {
  ledger: readonly PromiseLedgerEntry[];
  betrayals: readonly BetrayalRecord[];
  actorId: PlayerId;
  targetPlayerId: PlayerId;
  actionId: string;
  tick: number;
}) => {
  if (!HOSTILE_ACTION_IDS.has(actionId)) {
    return {
      ledger: [...ledger],
      betrayals: [...betrayals],
      betrayedPlayerIds: [] as PlayerId[],
    };
  }

  let betrayedPlayerIds: PlayerId[] = [];
  const nextLedger = ledger.map((entry) => {
    if (
      entry.status !== "open" ||
      entry.promiserId !== actorId ||
      entry.promiseeId !== targetPlayerId
    ) {
      return entry;
    }

    betrayedPlayerIds = [...betrayedPlayerIds, entry.promiseeId];

    return {
      ...entry,
      status: "broken" as const,
      resolvedAtTick: tick,
      resolutionReason: actionId,
    };
  });

  if (betrayedPlayerIds.length === 0) {
    return {
      ledger: nextLedger,
      betrayals: [...betrayals],
      betrayedPlayerIds,
    };
  }

  const nextBetrayals = [...betrayals];

  for (const playerId of betrayedPlayerIds) {
    nextBetrayals.push({
      id: `${actorId}:${playerId}:${tick}:broken-promise`,
      kind: "broken-promise",
      tick,
      sourcePlayerId: actorId,
      targetPlayerId: playerId,
      severity: 0.88,
      summary: compactText(
        `${actorId} broke a promise to ${playerId} by choosing ${actionId}.`,
      ),
    });
  }

  return {
    ledger: nextLedger,
    betrayals: nextBetrayals,
    betrayedPlayerIds,
  };
};
