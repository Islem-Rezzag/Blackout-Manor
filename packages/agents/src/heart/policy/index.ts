import {
  type RoleContentDefinition,
  SEASON_01_ROLES,
} from "@blackout-manor/content";
import type { PlayerId, RelationshipState } from "@blackout-manor/shared";

import { getAssignedPersona } from "../../personas";
import { createSuggestedSpeech } from "./speech";
import type {
  CreateLiveDecisionPolicyInput,
  LiveDecisionPolicy,
  LivePolicyId,
  PersonaPolicyProfile,
  PolicyCandidateInput,
  PolicyCandidatePlan,
  PolicyEvidence,
  PolicyReflection,
} from "./types";

const PUBLIC_SPEECH_RULES = [
  "Use at most 2 sentences.",
  "Stay concise, socially believable, and tactical.",
  "Do not reveal chain-of-thought.",
  "Ground public claims in visible evidence or strategic deception.",
];

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const relationshipFor = (
  relationships: Record<PlayerId, RelationshipState> | undefined,
  playerId: PlayerId | undefined,
) => (playerId ? relationships?.[playerId] : undefined);

const roleById = new Map(SEASON_01_ROLES.map((role) => [role.id, role]));

const getRoleDirective = (roleId: RoleContentDefinition["id"]) =>
  roleById.get(roleId as RoleContentDefinition["id"])?.secretBrief ??
  "Protect your win condition without breaking the action schema.";

const normalizePersona = (
  persona: ReturnType<typeof getAssignedPersona>["persona"],
): PersonaPolicyProfile => ({
  id: persona.id,
  label: persona.label,
  archetype: persona.archetype,
  summary: persona.summary,
  pressureBehavior: persona.pressureBehavior,
  allianceBehavior: persona.allianceBehavior,
  suspicionBehavior: persona.suspicionBehavior,
  preferredTones: persona.preferredTones,
  emotionalDefaults: persona.emotionalDefaults,
  socialStyle: persona.socialStyle,
});

const activePolicyIdsForPhase = (
  phaseId: CreateLiveDecisionPolicyInput["phaseId"],
  candidates: readonly PolicyCandidateInput[],
): LivePolicyId[] => {
  if (phaseId === "roam") {
    return ["roam-planning", "post-meeting-reflection"];
  }

  if (phaseId === "report") {
    return ["body-report-reaction"];
  }

  if (phaseId === "meeting") {
    return candidates.some(
      (candidate) => candidate.template.actionId === "confide",
    )
      ? ["meeting-discussion", "private-whispers"]
      : ["meeting-discussion"];
  }

  if (phaseId === "vote") {
    return ["vote-selection", "post-meeting-reflection"];
  }

  return ["post-meeting-reflection"];
};

const createEvidenceBank = (
  input: CreateLiveDecisionPolicyInput,
): PolicyEvidence[] => {
  const memoryEvidence = input.observation.topMemories.map((memory) => ({
    kind: "memory" as const,
    summary: memory.summary,
    salience: memory.salience * 100 + memory.evidenceStrength * 15,
    playerIds: memory.playersInvolved,
  }));
  const contradictionEvidence = input.socialContext.contradictions.map(
    (record) => ({
      kind: "contradiction" as const,
      summary: record.summary,
      salience: record.severity * 100,
      playerIds: [record.playerId],
    }),
  );
  const betrayalEvidence = input.socialContext.recentBetrayals.map(
    (record) => ({
      kind: "betrayal" as const,
      summary: record.summary,
      salience: record.severity * 100,
      playerIds: [record.sourcePlayerId, record.targetPlayerId],
    }),
  );
  const claimEvidence = input.observation.recentClaims.map((claim) => ({
    kind: "claim" as const,
    summary: claim,
    salience: 42,
    playerIds: input.state.players
      .filter(
        (player) =>
          claim.includes(player.id) || claim.includes(player.displayName),
      )
      .map((player) => player.id),
  }));
  const eventEvidence = input.observation.visibleEvents.map((event) => ({
    kind: "event" as const,
    summary: event,
    salience: 34,
    playerIds: input.state.players
      .filter(
        (player) =>
          event.includes(player.id) || event.includes(player.displayName),
      )
      .map((player) => player.id),
  }));

  return [
    ...contradictionEvidence,
    ...betrayalEvidence,
    ...memoryEvidence,
    ...claimEvidence,
    ...eventEvidence,
  ]
    .filter((entry) => entry.summary.length > 0)
    .sort((left, right) => right.salience - left.salience)
    .slice(0, 10);
};

const evidenceForTarget = (
  evidenceBank: readonly PolicyEvidence[],
  targetPlayerId?: PlayerId,
) => {
  if (!targetPlayerId) {
    return evidenceBank;
  }

  const targeted = evidenceBank.filter((entry) =>
    entry.playerIds.includes(targetPlayerId),
  );

  return targeted.length > 0 ? targeted : evidenceBank;
};

const topEvidenceSummary = (
  evidenceBank: readonly PolicyEvidence[],
  targetPlayerId?: PlayerId,
) =>
  evidenceForTarget(evidenceBank, targetPlayerId)
    .slice(0, 3)
    .map((entry) => entry.summary)
    .join(" | ");

const buildReflection = (
  input: CreateLiveDecisionPolicyInput,
  evidenceBank: readonly PolicyEvidence[],
): PolicyReflection => ({
  trust: input.socialContext.reflection.trustSummary.slice(0, 160),
  fear: input.socialContext.reflection.fearSummary.slice(0, 160),
  selfImage: input.socialContext.reflection.roomThinksOfMeSummary.slice(0, 160),
  nextMeetingNarrative:
    input.socialContext.reflection.nextMeetingNarrativeSummary.slice(0, 160),
  postMeetingAdjustment: (
    input.privateSummaries.at(-1) ??
    topEvidenceSummary(evidenceBank) ??
    "Reset the room around one clean timeline."
  ).slice(0, 160),
});

const genericActionScore = (
  actionId: PolicyCandidateInput["template"]["actionId"],
) => {
  switch (actionId) {
    case "report-body":
      return 98;
    case "continue-task":
      return 84;
    case "start-task":
      return 80;
    case "move":
      return 58;
    case "call-meeting":
      return 42;
    case "recover-clue":
    case "dust-room":
      return 80;
    case "ask-forensic-question":
      return 76;
    case "compare-clue-fragments":
      return 74;
    case "comfort":
      return 62;
    case "reassure":
      return 61;
    case "press":
      return 56;
    case "confide":
      return 63;
    case "promise":
      return 58;
    case "apologize":
      return 55;
    case "vote-player":
      return 66;
    case "skip-vote":
      return 52;
    case "eliminate":
      return 68;
    case "trigger-blackout":
      return 64;
    case "jam-door":
    case "loop-cameras":
    case "plant-false-clue":
    case "mimic-task-audio":
    case "forge-ledger-entry":
    case "delay-two-person-task":
      return 60;
    case "escort-player":
      return 72;
    case "seal-room":
      return 60;
    case "unlock-service-passage":
      return 57;
    default:
      return 50;
  }
};

const personaModifier = (
  persona: PersonaPolicyProfile,
  candidate: PolicyCandidateInput,
) => {
  const { socialStyle } = persona;

  switch (candidate.template.actionId) {
    case "press":
      return socialStyle.assertiveness * 8 + socialStyle.analyticalFocus * 6;
    case "comfort":
    case "reassure":
    case "apologize":
      return socialStyle.empathy * 12;
    case "confide":
    case "promise":
      return socialStyle.empathy * 6 + socialStyle.deception * 6;
    case "eliminate":
    case "trigger-blackout":
    case "plant-false-clue":
      return socialStyle.deception * 10 + socialStyle.riskTolerance * 8;
    case "move":
      return socialStyle.riskTolerance * 4;
    case "continue-task":
    case "start-task":
      return socialStyle.analyticalFocus * 5;
    case "vote-player":
      return socialStyle.assertiveness * 5 + socialStyle.analyticalFocus * 4;
    case "skip-vote":
      return (1 - socialStyle.riskTolerance) * 6;
    default:
      return 0;
  }
};

const phaseModifier = (
  input: CreateLiveDecisionPolicyInput,
  candidate: PolicyCandidateInput,
  evidenceBank: readonly PolicyEvidence[],
) => {
  const targetPlayerId =
    "targetPlayerId" in candidate.template
      ? candidate.template.targetPlayerId
      : undefined;
  const relationship = relationshipFor(
    input.socialContext.relationships,
    targetPlayerId,
  );
  const evidence = evidenceForTarget(evidenceBank, targetPlayerId);
  const contradictionCount = evidence.filter(
    (entry) => entry.kind === "contradiction",
  ).length;
  const betrayalCount = evidence.filter(
    (entry) => entry.kind === "betrayal",
  ).length;
  const suspicion = relationship?.suspectScore ?? 0.5;
  const trust = relationship?.trust ?? 0.5;
  const fear = relationship?.fear ?? 0;
  const visiblePlayer = targetPlayerId
    ? input.observation.visiblePlayers.find(
        (player) => player.id === targetPlayerId,
      )
    : undefined;
  const sameRoomLiving = input.observation.visiblePlayers.length;
  const actor = input.state.players.find(
    (player) => player.id === input.actorId,
  );
  const actorRoom = actor?.roomId
    ? input.state.rooms.find((room) => room.roomId === actor.roomId)
    : undefined;
  const blackoutActive =
    typeof input.state.blackoutUntilTick === "number" &&
    input.state.tick < input.state.blackoutUntilTick;
  const roomIsBlackout = actorRoom?.lightLevel === "blackout";

  if (!actor) {
    return 0;
  }

  switch (input.phaseId) {
    case "roam":
      switch (candidate.template.actionId) {
        case "report-body":
          return 18;
        case "continue-task":
          return actor.role === "shadow" ? -4 : 24;
        case "start-task":
          return actor.role === "shadow" ? -2 : 20;
        case "move":
          return candidate.template.targetRoomId === "generator-room" ||
            candidate.template.targetRoomId === "cellar"
            ? 10
            : 4;
        case "call-meeting":
          return suspicion > 0.88 || contradictionCount > 1 ? 4 : -12;
        case "eliminate":
          return actor.role === "shadow"
            ? roomIsBlackout
              ? 16
              : input.state.currentRound <= 1
                ? -24
                : sameRoomLiving <= 1
                  ? 8
                  : -8
            : 0;
        case "trigger-blackout":
          return actor.role === "shadow"
            ? blackoutActive || roomIsBlackout
              ? -40
              : input.state.currentRound <= 2
                ? 18
                : 8
            : 0;
        case "jam-door":
          return actor.role === "shadow" ? 10 : 0;
        case "escort-player":
          return trust * 18 + fear * 12;
        case "unlock-service-passage":
          return input.state.servicePassageUnlocked ? -20 : 9;
        default:
          return 0;
      }
    case "report":
      if (candidate.template.actionId === "ask-forensic-question") {
        return contradictionCount * 8 + betrayalCount * 4;
      }

      return 6 + evidence.length * 2;
    case "meeting":
      switch (candidate.template.actionId) {
        case "press":
          return contradictionCount === 0 && betrayalCount === 0
            ? suspicion * 8 - 12
            : suspicion * 10 + contradictionCount * 18 + betrayalCount * 8;
        case "comfort":
          return visiblePlayer?.state === "shaken" ? 22 : trust * 10 + fear * 4;
        case "reassure":
          return (
            input.observation.self.publicImage.suspiciousness * 12 + trust * 8
          );
        case "apologize":
          return (relationship?.grievance ?? 0) * 24 + trust * 6;
        case "confide":
          return trust * 22 + (relationship?.respect ?? 0.5) * 8;
        case "promise":
          return trust * 20 + (relationship?.debt ?? 0) * 10;
        case "ask-forensic-question":
          return contradictionCount * 10 + evidence.length * 3;
        case "compare-clue-fragments":
          return contradictionCount * 7 + evidence.length * 2;
        default:
          return 0;
      }
    case "vote":
      if (candidate.template.actionId === "skip-vote") {
        return contradictionCount === 0 && suspicion < 0.62 ? 18 : -6;
      }

      if (candidate.template.actionId === "vote-player" && targetPlayerId) {
        if (actor.role === "shadow") {
          const target = input.state.players.find(
            (player) => player.id === targetPlayerId,
          );

          if (target?.team === "shadow") {
            return -60;
          }
        }

        return contradictionCount === 0 && betrayalCount === 0
          ? suspicion * 10 - 10
          : suspicion * 18 + contradictionCount * 14 + betrayalCount * 10;
      }

      return 0;
    default:
      return 0;
  }
};

const recommendedIntentFor = (
  persona: PersonaPolicyProfile,
  candidate: PolicyCandidateInput,
): PolicyCandidatePlan["recommendedIntent"] => {
  switch (candidate.template.actionId) {
    case "comfort":
    case "reassure":
    case "apologize":
      return persona.socialStyle.empathy >= 0.75 ? "warm" : "calm";
    case "press":
      return persona.socialStyle.assertiveness >= 0.75
        ? "aggressive"
        : "confident";
    case "confide":
      return persona.socialStyle.deception >= 0.65 ? "evasive" : "warm";
    case "promise":
      return "confident";
    case "vote-player":
      return "confident";
    case "skip-vote":
      return "calm";
    case "eliminate":
      return "aggressive";
    case "trigger-blackout":
    case "jam-door":
    case "plant-false-clue":
      return "evasive";
    default:
      return "confident";
  }
};

const suggestionTagsFor = (
  candidate: PolicyCandidateInput,
  score: number,
  evidenceBank: readonly PolicyEvidence[],
) => {
  const targetPlayerId =
    "targetPlayerId" in candidate.template
      ? candidate.template.targetPlayerId
      : undefined;
  const evidence = evidenceForTarget(evidenceBank, targetPlayerId);
  const tags: string[] = [candidate.template.actionId];

  if (score >= 85) {
    tags.push("high-priority");
  }

  if (evidence.some((entry) => entry.kind === "contradiction")) {
    tags.push("contradiction");
  }

  if (evidence.some((entry) => entry.kind === "betrayal")) {
    tags.push("betrayal");
  }

  if (candidate.template.actionId === "confide") {
    tags.push("private");
  }

  return tags;
};

const createRationale = (
  candidate: PolicyCandidateInput,
  evidenceBank: readonly PolicyEvidence[],
  score: number,
) => {
  const targetPlayerId =
    "targetPlayerId" in candidate.template
      ? candidate.template.targetPlayerId
      : undefined;
  const evidence = topEvidenceSummary(evidenceBank, targetPlayerId);
  const focus = evidence ? ` Evidence: ${evidence}.` : "";

  return `${candidate.template.actionId} scores ${Math.round(
    score,
  )} for the current phase.${focus}`.slice(0, 220);
};

const createPrivateSummary = (
  candidate: PolicyCandidateInput,
  rationale: string,
) => {
  const targetPlayerId =
    "targetPlayerId" in candidate.template
      ? candidate.template.targetPlayerId
      : undefined;
  const targetFragment = targetPlayerId ? ` on ${targetPlayerId}` : "";

  return `${candidate.template.actionId}${targetFragment}: ${rationale}`.slice(
    0,
    280,
  );
};

const createCandidatePlan = (
  input: CreateLiveDecisionPolicyInput,
  persona: PersonaPolicyProfile,
  evidenceBank: readonly PolicyEvidence[],
  candidate: PolicyCandidateInput,
): PolicyCandidatePlan => {
  const score = clamp(
    genericActionScore(candidate.template.actionId) +
      personaModifier(persona, candidate) +
      phaseModifier(input, candidate, evidenceBank),
  );
  const recommendedIntent = recommendedIntentFor(persona, candidate);
  const targetPlayerId =
    "targetPlayerId" in candidate.template
      ? candidate.template.targetPlayerId
      : undefined;
  const suggestedSpeechText =
    candidate.allowSpeech || candidate.template.actionId === "confide"
      ? createSuggestedSpeech({
          actionId: candidate.template.actionId,
          ...(targetPlayerId ? { targetPlayerId } : {}),
          tone: recommendedIntent,
          persona,
          evidence: evidenceForTarget(evidenceBank, targetPlayerId),
        })
      : undefined;
  const rationale = createRationale(candidate, evidenceBank, score);

  return {
    candidateIndex: candidate.index,
    score,
    tags: suggestionTagsFor(candidate, score, evidenceBank),
    rationale,
    recommendedIntent,
    ...(suggestedSpeechText
      ? {
          suggestedSpeech: {
            channel:
              candidate.template.actionId === "confide" ? "private" : "meeting",
            text: suggestedSpeechText,
            tone: recommendedIntent,
          } as const,
        }
      : {}),
    suggestedPrivateSummary: createPrivateSummary(candidate, rationale),
  };
};

const phaseObjectiveFor = (
  input: CreateLiveDecisionPolicyInput,
  persona: PersonaPolicyProfile,
) => {
  switch (input.phaseId) {
    case "roam":
      return `${persona.label} should build alibis, finish evidence-generating tasks, and protect room clarity.`;
    case "report":
      return `${persona.label} should convert the report window into the cleanest clue before discussion starts.`;
    case "meeting":
      return `${persona.label} should steer the room with one believable claim at a time and use social verbs deliberately.`;
    case "vote":
      return `${persona.label} should choose the safest elimination line, or refuse a bad exile if the room is still muddy.`;
    default:
      return `${persona.label} should preserve a coherent narrative for the next phase.`;
  }
};

export const createLiveDecisionPolicy = (
  input: CreateLiveDecisionPolicyInput,
): LiveDecisionPolicy => {
  const actor = input.state.players.find(
    (player) => player.id === input.actorId,
  );

  if (!actor) {
    throw new Error(`Unknown policy actor ${input.actorId}.`);
  }

  const persona = normalizePersona(
    getAssignedPersona(
      input.state.config.seed,
      input.state.players.map((player) => player.id),
      input.actorId,
    ).persona,
  );
  const evidenceBank = createEvidenceBank(input);
  const candidatePlans = input.candidates
    .map((candidate) =>
      createCandidatePlan(input, persona, evidenceBank, candidate),
    )
    .sort(
      (left, right) =>
        right.score - left.score || left.candidateIndex - right.candidateIndex,
    );

  return {
    activePolicies: activePolicyIdsForPhase(input.phaseId, input.candidates),
    actorRole: actor.role,
    persona,
    roleDirective: getRoleDirective(actor.role),
    phaseObjective: phaseObjectiveFor(input, persona),
    evidenceFocus: evidenceBank
      .slice(0, 5)
      .map((entry) => entry.summary.slice(0, 160)),
    publicSpeechRules: PUBLIC_SPEECH_RULES,
    ...(candidatePlans.some((plan) => plan.tags.includes("private"))
      ? {
          whisperGuidance:
            "Use private whispers only to lock an ally, trade timing, or repair trust without exposing the whole plan.",
        }
      : {}),
    reflection: buildReflection(input, evidenceBank),
    candidatePlans,
  };
};

export type * from "./types";
