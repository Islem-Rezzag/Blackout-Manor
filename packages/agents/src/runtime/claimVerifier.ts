import {
  type AgentActionProposal,
  type ClaimRef,
  type ClaimSupportLevel,
  type EvidenceRef,
  type PlayerId,
  type PrivateObservation,
  type PublicClaim,
  ROOM_IDS,
} from "@blackout-manor/shared";

type ParsedClaim = {
  kind: PublicClaim["kind"];
  text: string;
  relatedPlayerIds: PlayerId[];
  roomId?: PublicClaim["roomId"];
  claimKey?: string;
  value?: string;
};

type VerifyPublicSpeechInput = {
  proposal: AgentActionProposal;
  observation: PrivateObservation;
};

const FACTUAL_CLAIM_TERMS = [
  "i was",
  "i saw",
  "with ",
  "clue",
  "evidence",
  "body",
  "vote",
  "voted",
  "shadow",
  "killed",
  "eliminated",
  "sabotaged",
  "lied",
  "false",
];

const ACCUSATION_TERMS = [
  "shadow",
  "killed",
  "eliminated",
  "sabotaged",
  "lied",
  "false",
  "don't trust",
  "do not trust",
];

const DECEPTION_ACTION_IDS = new Set<AgentActionProposal["actionId"]>([
  "confide",
  "plant-false-clue",
  "forge-ledger-entry",
  "mimic-task-audio",
  "loop-cameras",
]);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const compactText = (value: string, maxLength = 180) => {
  const compact = value.replace(/\s+/g, " ").trim();

  return compact.length <= maxLength
    ? compact
    : `${compact.slice(0, maxLength - 3).trimEnd()}...`;
};

const sentenceParts = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

const roomAliases = new Map(
  ROOM_IDS.map((roomId) => [roomId.replaceAll("-", " "), roomId]),
);

const playerAliasMatches = (text: string, playerId: PlayerId) => {
  const normalized = normalizeText(text);
  const compactPlayerId = normalizeText(playerId);
  const spacedPlayerId = normalizeText(playerId.replaceAll("-", " "));

  return (
    normalized.includes(compactPlayerId) || normalized.includes(spacedPlayerId)
  );
};

const extractPlayers = (
  text: string,
  observation: PrivateObservation,
): PlayerId[] => {
  const playerIds = new Set<PlayerId>();
  const knownPlayerIds = [
    observation.self.id,
    ...Object.keys(observation.relationships),
    ...observation.visiblePlayers.map((player) => player.id),
  ] as PlayerId[];

  for (const playerId of knownPlayerIds) {
    if (playerAliasMatches(text, playerId)) {
      playerIds.add(playerId);
    }
  }

  return [...playerIds];
};

const extractRoom = (text: string) => {
  const normalized = normalizeText(text);

  for (const [alias, roomId] of roomAliases.entries()) {
    if (normalized.includes(alias)) {
      return roomId;
    }
  }

  return undefined;
};

const factualSentence = (text: string) => {
  const normalized = normalizeText(text);

  return FACTUAL_CLAIM_TERMS.some((term) => normalized.includes(term));
};

const parseClaims = (
  text: string,
  observation: PrivateObservation,
): ParsedClaim[] => {
  const claims: ParsedClaim[] = [];

  for (const sentence of sentenceParts(text)) {
    if (!factualSentence(sentence)) {
      continue;
    }

    const normalized = normalizeText(sentence);
    const relatedPlayerIds = extractPlayers(sentence, observation).filter(
      (playerId) => playerId !== observation.self.id,
    );
    const roomId = extractRoom(sentence);

    if (/\bi was\b/.test(normalized)) {
      claims.push({
        kind: "alibi",
        text: compactText(sentence),
        relatedPlayerIds,
        ...(roomId ? { roomId, claimKey: "self-room", value: roomId } : {}),
      });
    }

    if (/\bi saw\b/.test(normalized)) {
      const targetPlayerId = relatedPlayerIds[0];

      claims.push({
        kind: "timeline",
        text: compactText(sentence),
        relatedPlayerIds,
        ...(roomId ? { roomId } : {}),
        ...(targetPlayerId && roomId
          ? {
              claimKey: `saw:${targetPlayerId}:room`,
              value: roomId,
            }
          : {}),
      });
    }

    if (normalized.includes("with ") && relatedPlayerIds.length > 0) {
      const supportPlayerId = relatedPlayerIds[0];

      if (!supportPlayerId) {
        continue;
      }

      claims.push({
        kind: "support",
        text: compactText(sentence),
        relatedPlayerIds,
        ...(roomId ? { roomId } : {}),
        claimKey: "self-with",
        value: supportPlayerId,
      });
    }

    if (
      ACCUSATION_TERMS.some((term) => normalized.includes(term)) &&
      relatedPlayerIds.length > 0
    ) {
      claims.push({
        kind: "accusation",
        text: compactText(sentence),
        relatedPlayerIds,
        ...(roomId ? { roomId } : {}),
        claimKey: `accuse:${relatedPlayerIds[0]}`,
        value: "suspicious",
      });
    }

    if (
      normalized.includes("clue") ||
      normalized.includes("evidence") ||
      normalized.includes("body")
    ) {
      claims.push({
        kind: "clue",
        text: compactText(sentence),
        relatedPlayerIds,
        ...(roomId ? { roomId } : {}),
      });
    }
  }

  return claims.length > 0
    ? claims
    : factualSentence(text)
      ? [
          {
            kind: "unknown",
            text: compactText(text),
            relatedPlayerIds: extractPlayers(text, observation),
            ...(extractRoom(text) ? { roomId: extractRoom(text) } : {}),
          },
        ]
      : [];
};

const factScore = (claim: ParsedClaim, fact: EvidenceRef) => {
  let score = 0;
  const normalizedFact = normalizeText(fact.summary);
  const normalizedClaim = normalizeText(claim.text);

  if (claim.roomId && fact.roomId === claim.roomId) {
    score += 2;
  }

  for (const playerId of claim.relatedPlayerIds) {
    if (
      fact.playerIds.includes(playerId) ||
      playerAliasMatches(fact.summary, playerId)
    ) {
      score += 2;
    }
  }

  if (claim.kind === "clue" && fact.kind === "clue") {
    score += 2;
  }

  if (claim.kind === "accusation" && fact.kind === "meeting-speech") {
    score += 1;
  }

  if (
    claim.claimKey === "self-room" &&
    fact.kind === "visible-player" &&
    claim.relatedPlayerIds.some((playerId) =>
      fact.playerIds.includes(playerId),
    ) &&
    normalizedFact.includes("with you")
  ) {
    score += 1;
  }

  if (normalizedFact.length > 0 && normalizedClaim.includes(normalizedFact)) {
    score += 3;
  }

  return score;
};

const supportingFacts = (claim: ParsedClaim, facts: readonly EvidenceRef[]) =>
  facts
    .map((fact) => ({ fact, score: factScore(claim, fact) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.fact)
    .slice(0, 4);

const matchingReportedClaims = (
  claim: ParsedClaim,
  claims: readonly ClaimRef[],
) =>
  claims.filter((entry) => {
    const sameRoom =
      claim.roomId !== undefined &&
      (entry.value === claim.roomId || entry.summary.includes(claim.roomId));
    const samePlayer = claim.relatedPlayerIds.some((playerId) =>
      entry.summary.includes(playerId),
    );

    return sameRoom || samePlayer;
  });

const contradictingClaims = (
  speakerId: PlayerId,
  claim: ParsedClaim,
  claims: readonly ClaimRef[],
) =>
  claims.filter(
    (entry) =>
      entry.speakerId === speakerId &&
      claim.claimKey !== undefined &&
      entry.claimKey === claim.claimKey &&
      claim.value !== undefined &&
      entry.value !== undefined &&
      entry.value !== claim.value,
  );

const supportsIntentionalDeception = (
  proposal: AgentActionProposal,
  observation: PrivateObservation,
) =>
  observation.self.role === "shadow" ||
  proposal.emotionalIntent === "evasive" ||
  DECEPTION_ACTION_IDS.has(proposal.actionId);

const supportLevelForClaim = ({
  claim,
  facts,
  reportedClaims,
  proposal,
  observation,
}: {
  claim: ParsedClaim;
  facts: readonly EvidenceRef[];
  reportedClaims: readonly ClaimRef[];
  proposal: AgentActionProposal;
  observation: PrivateObservation;
}): ClaimSupportLevel => {
  if (facts.some((fact) => fact.kind !== "meeting-speech")) {
    return facts.length >= 2 || claim.kind === "accusation"
      ? "inferred"
      : "observed";
  }

  if (
    reportedClaims.length > 0 ||
    facts.some((fact) => fact.kind === "meeting-speech")
  ) {
    return "reported-by-other";
  }

  return supportsIntentionalDeception(proposal, observation)
    ? "deceptive"
    : "unsupported";
};

const softenUnsupportedSpeech = (
  text: string,
  claims: readonly PublicClaim[],
) =>
  claims.some((claim) => claim.supportLevel === "unsupported")
    ? compactText(`I cannot verify this yet: ${text}`)
    : text;

export const verifyPublicSpeechClaims = ({
  proposal,
  observation,
}: VerifyPublicSpeechInput): AgentActionProposal => {
  if (!proposal.speech) {
    return proposal;
  }

  const parsedClaims = parseClaims(proposal.speech.text, observation);

  if (parsedClaims.length === 0) {
    return proposal;
  }

  const publicClaims = parsedClaims.map((claim, index): PublicClaim => {
    const facts = supportingFacts(claim, observation.allowedFacts);
    const reportedClaims = matchingReportedClaims(
      claim,
      observation.allowedClaims,
    );
    const supportLevel = supportLevelForClaim({
      claim,
      facts,
      reportedClaims,
      proposal,
      observation,
    });
    const contradicts = contradictingClaims(
      proposal.actorId,
      claim,
      observation.allowedClaims,
    );

    return {
      id: `claim:${proposal.actorId}:${observation.phaseId}:${index}`,
      speakerId: proposal.actorId,
      text: claim.text,
      kind: claim.kind,
      supportLevel,
      evidenceRefs:
        supportLevel === "deceptive" || supportLevel === "unsupported"
          ? []
          : facts,
      relatedPlayerIds: claim.relatedPlayerIds,
      ...(claim.roomId ? { roomId: claim.roomId } : {}),
      ...(claim.claimKey ? { claimKey: claim.claimKey } : {}),
      ...(claim.value ? { value: claim.value } : {}),
      contradicts,
    };
  });
  const text = softenUnsupportedSpeech(proposal.speech.text, publicClaims);

  return {
    ...proposal,
    speech: {
      ...proposal.speech,
      text,
      publicClaims,
    },
  } as AgentActionProposal;
};
