import type {
  EngineEvent,
  EngineReplayLog,
  EngineRoleAssignment,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PlayerId,
  SpeechPayload,
} from "@blackout-manor/shared";

import { ReplayEqMetricsSchema } from "./schemas";
import type {
  AllianceShiftMetrics,
  ContradictionHandlingMetrics,
  EvidenceGroundedAccusationQualityMetrics,
  FalseAccusationRecoveryMetrics,
  MeetingInfluenceQualityMetrics,
  PromiseIntegrityMetrics,
  ReplayEqMetrics,
  WitnessStabilizationMetrics,
} from "./types";

const accusationActionIds = new Set<AgentActionProposal["actionId"]>([
  "press",
  "vote-player",
]);
const calmingActionIds = new Set<AgentActionProposal["actionId"]>([
  "comfort",
  "reassure",
]);
const repairActionIds = new Set<AgentActionProposal["actionId"]>([
  "apologize",
  "reassure",
  "comfort",
  "promise",
]);
const hostileActionIds = new Set<AgentActionProposal["actionId"]>([
  "press",
  "vote-player",
  "eliminate",
]);
const supportActionIds = new Set<AgentActionProposal["actionId"]>([
  "comfort",
  "reassure",
  "promise",
  "confide",
  "escort-player",
]);
const betrayalSupportActionIds = new Set<AgentActionProposal["actionId"]>([
  "promise",
  "confide",
]);

type ReplayAction = {
  sequence: number;
  tick: number;
  phaseId: AgentActionProposal["phaseId"];
  roundIndex: number;
  proposal: AgentActionProposal;
  actorId: PlayerId;
  targetPlayerId: PlayerId | null;
  speech: SpeechPayload | null;
};

type ContradictionRecord = {
  playerId: PlayerId;
  previousLocation: string;
  currentLocation: string;
  sequence: number;
  tick: number;
};

type EvidenceRecord = {
  sequence: number;
  targetPlayerId: PlayerId;
  kind: "contradiction" | "witness-claim";
};

type ReplayContext = {
  replay: EngineReplayLog;
  displayNames: Record<PlayerId, string>;
  roleAssignments: Record<PlayerId, EngineRoleAssignment>;
  actions: ReplayAction[];
  voteResolutions: EngineVoteResolvedEvent[];
};

type EngineVoteResolvedEvent = Extract<EngineEvent, { type: "vote-resolved" }>;

const averageRate = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLocation = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!,;:]+$/g, "");

const isPublicSpeech = (
  speech: SpeechPayload | undefined,
): speech is SpeechPayload =>
  !!speech && speech.channel !== "private" && speech.text.trim().length > 0;

const containsConcreteClaim = (text: string | undefined) =>
  !!text &&
  /\bi saw\b|\bi was in the\b|\bleave the\b|\bnear the\b|\bheaded to the\b|\bcame from the\b|\bwith\b/i.test(
    text,
  );

const containsContradictionCallout = (text: string | undefined) =>
  !!text &&
  /\bstory\b|\bchanged\b|\btimeline\b|\bcontradict\b|\bfirst said\b|\bthen said\b/i.test(
    text,
  );

const extractSelfLocation = (text: string | undefined) => {
  if (!text) {
    return null;
  }

  const match = text.match(/\bi was in the ([a-z][a-z -]+)\b/i);

  return match?.[1] ? normalizeLocation(match[1]) : null;
};

const extractDisplayNames = (replay: EngineReplayLog) => {
  const displayNames: Record<PlayerId, string> = {};

  for (const frame of replay.frames) {
    for (const player of frame.players) {
      displayNames[player.id] = player.displayName;
    }
  }

  return displayNames;
};

const getRoleAssignments = (replay: EngineReplayLog) => {
  const rolesAssignedEvent = replay.events.find(
    (event) => event.type === "roles-assigned",
  );

  if (!rolesAssignedEvent || rolesAssignedEvent.type !== "roles-assigned") {
    throw new Error(`Replay ${replay.matchId} is missing roles-assigned.`);
  }

  return Object.fromEntries(
    rolesAssignedEvent.assignments.map((assignment) => [
      assignment.playerId,
      assignment,
    ]),
  ) as Record<PlayerId, EngineRoleAssignment>;
};

const extractMentionedTargets = (
  text: string | undefined,
  displayNames: Record<PlayerId, string>,
) => {
  if (!text) {
    return [];
  }

  return Object.entries(displayNames)
    .sort((left, right) => right[1].length - left[1].length)
    .filter(([, displayName]) =>
      new RegExp(`(^|\\b)${escapeRegExp(displayName)}(\\b|$)`, "i").test(text),
    )
    .map(([playerId]) => playerId as PlayerId);
};

const hasConcreteTargetedSpeechEvidence = (
  action: ReplayAction,
  displayNames: Record<PlayerId, string>,
) => {
  if (!action.speech || !action.targetPlayerId) {
    return false;
  }

  const mentionedTargets = extractMentionedTargets(
    action.speech.text,
    displayNames,
  );

  return (
    containsConcreteClaim(action.speech.text) &&
    (mentionedTargets.includes(action.targetPlayerId) ||
      /\bi saw\b|\bleave the\b|\bnear the\b|\bcame from the\b|\bheaded to the\b/i.test(
        action.speech.text,
      ))
  );
};

const isInfluenceSpeech = (
  action: ReplayAction,
  displayNames: Record<PlayerId, string>,
) => {
  if (
    action.phaseId !== "meeting" ||
    !action.speech ||
    action.speech.channel !== "meeting" ||
    !action.targetPlayerId ||
    !accusationActionIds.has(action.proposal.actionId)
  ) {
    return false;
  }

  const mentionedTargets = extractMentionedTargets(
    action.speech.text,
    displayNames,
  );

  return (
    mentionedTargets.includes(action.targetPlayerId) ||
    hasConcreteTargetedSpeechEvidence(action, displayNames) ||
    containsContradictionCallout(action.speech.text)
  );
};

const resolveTargetPlayerId = (
  proposal: AgentActionProposal,
  displayNames: Record<PlayerId, string>,
) => {
  if ("targetPlayerId" in proposal) {
    return proposal.targetPlayerId;
  }

  const mentionedTargets = extractMentionedTargets(
    proposal.speech?.text,
    displayNames,
  );

  return mentionedTargets.length === 1 ? mentionedTargets[0] : null;
};

const createReplayContext = (replay: EngineReplayLog): ReplayContext => {
  const displayNames = extractDisplayNames(replay);
  const roleAssignments = getRoleAssignments(replay);
  const actions: ReplayAction[] = [];
  const voteResolutions: EngineVoteResolvedEvent[] = [];
  let roundIndex = 0;

  for (const event of replay.events) {
    if (event.type === "vote-resolved") {
      voteResolutions.push(event);
      roundIndex += 1;
      continue;
    }

    if (event.type !== "action-recorded") {
      continue;
    }

    actions.push({
      sequence: event.sequence,
      tick: event.tick,
      phaseId: event.proposal.phaseId,
      roundIndex,
      proposal: event.proposal,
      actorId: event.proposal.actorId,
      targetPlayerId:
        resolveTargetPlayerId(event.proposal, displayNames) ?? null,
      speech: isPublicSpeech(event.proposal.speech)
        ? event.proposal.speech
        : null,
    });
  }

  return {
    replay,
    displayNames,
    roleAssignments,
    actions,
    voteResolutions,
  };
};

const nextVoteResolutionAfter = (
  voteResolutions: readonly EngineVoteResolvedEvent[],
  sequence: number,
) => voteResolutions.find((event) => event.sequence > sequence) ?? null;

const detectContradictions = (actions: readonly ReplayAction[]) => {
  const lastSelfLocationByPlayer = new Map<
    PlayerId,
    { location: string; sequence: number }
  >();
  const contradictions: ContradictionRecord[] = [];

  for (const action of actions) {
    if (!action.speech) {
      continue;
    }

    const location = extractSelfLocation(action.speech.text);

    if (!location) {
      continue;
    }

    const previous = lastSelfLocationByPlayer.get(action.actorId);

    if (previous && previous.location !== location) {
      contradictions.push({
        playerId: action.actorId,
        previousLocation: previous.location,
        currentLocation: location,
        sequence: action.sequence,
        tick: action.tick,
      });
    }

    lastSelfLocationByPlayer.set(action.actorId, {
      location,
      sequence: action.sequence,
    });
  }

  return contradictions;
};

const createEvidenceRecords = (
  displayNames: Record<PlayerId, string>,
  actions: readonly ReplayAction[],
  contradictions: readonly ContradictionRecord[],
) => {
  const contradictionEvidence = contradictions.map(
    (contradiction): EvidenceRecord => ({
      sequence: contradiction.sequence,
      targetPlayerId: contradiction.playerId,
      kind: "contradiction",
    }),
  );
  const witnessEvidence = actions
    .filter((action) => hasConcreteTargetedSpeechEvidence(action, displayNames))
    .map(
      (action): EvidenceRecord => ({
        sequence: action.sequence,
        targetPlayerId: action.targetPlayerId as PlayerId,
        kind: "witness-claim",
      }),
    );

  return [...contradictionEvidence, ...witnessEvidence].sort(
    (left, right) => left.sequence - right.sequence,
  );
};

const collectContradictionHandling = (
  context: ReplayContext,
  contradictions: readonly ContradictionRecord[],
): ContradictionHandlingMetrics => {
  let handledCount = 0;
  let explicitCalloutCount = 0;

  for (const contradiction of contradictions) {
    const deadline =
      nextVoteResolutionAfter(context.voteResolutions, contradiction.sequence)
        ?.sequence ?? Number.POSITIVE_INFINITY;
    const followUp = context.actions.find(
      (action) =>
        action.sequence > contradiction.sequence &&
        action.sequence < deadline &&
        accusationActionIds.has(action.proposal.actionId) &&
        action.targetPlayerId === contradiction.playerId,
    );

    if (!followUp) {
      continue;
    }

    handledCount += 1;

    if (containsContradictionCallout(followUp.speech?.text)) {
      explicitCalloutCount += 1;
    }
  }

  return {
    contradictionCount: contradictions.length,
    handledCount,
    explicitCalloutCount,
    ignoredCount: contradictions.length - handledCount,
    handlingRate: averageRate(handledCount, contradictions.length),
  };
};

const collectFalseAccusationRecovery = (
  context: ReplayContext,
): FalseAccusationRecoveryMetrics => {
  const falseAccusations = context.actions.filter(
    (action) =>
      accusationActionIds.has(action.proposal.actionId) &&
      !!action.targetPlayerId &&
      context.roleAssignments[action.targetPlayerId]?.team === "household",
  );
  let repairAttemptCount = 0;
  let recoveredCount = 0;
  let redirectedVoteCount = 0;

  for (const accusation of falseAccusations) {
    const targetPlayerId = accusation.targetPlayerId as PlayerId;
    const deadline =
      nextVoteResolutionAfter(context.voteResolutions, accusation.sequence)
        ?.sequence ?? Number.POSITIVE_INFINITY;
    const repair = context.actions.find(
      (action) =>
        action.sequence > accusation.sequence &&
        action.sequence < deadline &&
        action.actorId === accusation.actorId &&
        repairActionIds.has(action.proposal.actionId) &&
        action.targetPlayerId === targetPlayerId,
    );

    if (!repair) {
      continue;
    }

    repairAttemptCount += 1;

    const voteResolution = nextVoteResolutionAfter(
      context.voteResolutions,
      accusation.sequence,
    );

    if (voteResolution?.exiledPlayerId !== targetPlayerId) {
      recoveredCount += 1;
    }

    const redirectedVote = context.actions.find(
      (action) =>
        action.sequence > repair.sequence &&
        action.sequence < deadline &&
        action.actorId === accusation.actorId &&
        action.proposal.actionId === "vote-player" &&
        !!action.targetPlayerId &&
        action.targetPlayerId !== targetPlayerId &&
        context.roleAssignments[action.targetPlayerId]?.team === "shadow",
    );

    if (redirectedVote) {
      redirectedVoteCount += 1;
    }
  }

  return {
    falseAccusationCount: falseAccusations.length,
    repairAttemptCount,
    recoveredCount,
    redirectedVoteCount,
    recoveryRate: averageRate(recoveredCount, falseAccusations.length),
  };
};

const collectWitnessStabilization = (
  context: ReplayContext,
): WitnessStabilizationMetrics => {
  const reports = context.actions.filter(
    (action) => action.proposal.actionId === "report-body",
  );
  let calmingAttemptCount = 0;
  let stabilizedCount = 0;

  for (const report of reports) {
    const deadline =
      nextVoteResolutionAfter(context.voteResolutions, report.sequence)
        ?.sequence ?? Number.POSITIVE_INFINITY;
    const calmingAttempt = context.actions.find(
      (action) =>
        action.sequence > report.sequence &&
        action.sequence < deadline &&
        action.actorId !== report.actorId &&
        calmingActionIds.has(action.proposal.actionId) &&
        action.targetPlayerId === report.actorId,
    );

    if (!calmingAttempt) {
      continue;
    }

    calmingAttemptCount += 1;

    const stabilizedWitness = context.actions.find(
      (action) =>
        action.sequence > calmingAttempt.sequence &&
        action.sequence < deadline &&
        action.actorId === report.actorId &&
        !!action.speech &&
        containsConcreteClaim(action.speech.text),
    );

    if (stabilizedWitness) {
      stabilizedCount += 1;
    }
  }

  return {
    reportCount: reports.length,
    calmingAttemptCount,
    stabilizedCount,
    stabilizationRate: averageRate(stabilizedCount, calmingAttemptCount),
  };
};

const collectPromiseIntegrity = (
  context: ReplayContext,
): PromiseIntegrityMetrics => {
  const promises = context.actions.filter(
    (action) =>
      action.proposal.actionId === "promise" && !!action.targetPlayerId,
  );
  let keptCount = 0;
  let brokenCount = 0;
  let unresolvedCount = 0;

  for (const promise of promises) {
    const targetPlayerId = promise.targetPlayerId as PlayerId;
    const deadline = nextVoteResolutionAfter(
      context.voteResolutions,
      promise.sequence,
    );
    const deadlineSequence = deadline?.sequence ?? Number.POSITIVE_INFINITY;
    const hostileFollowUp = context.actions.find(
      (action) =>
        action.sequence > promise.sequence &&
        action.sequence < deadlineSequence &&
        action.actorId === promise.actorId &&
        hostileActionIds.has(action.proposal.actionId) &&
        action.targetPlayerId === targetPlayerId,
    );

    if (hostileFollowUp) {
      brokenCount += 1;
      continue;
    }

    if (deadline) {
      keptCount += 1;
    } else {
      unresolvedCount += 1;
    }
  }

  return {
    promiseCount: promises.length,
    keptCount,
    brokenCount,
    unresolvedCount,
    keptRate: averageRate(keptCount, promises.length),
    brokenRate: averageRate(brokenCount, promises.length),
  };
};

const collectAllianceShift = (context: ReplayContext): AllianceShiftMetrics => {
  const episodes = new Map<
    string,
    {
      actorId: PlayerId;
      targetPlayerId: PlayerId;
      roundIndex: number;
      latestSupportSequence: number;
      supportActionIds: Set<AgentActionProposal["actionId"]>;
    }
  >();

  for (const action of context.actions) {
    if (
      !action.targetPlayerId ||
      !supportActionIds.has(action.proposal.actionId) ||
      (action.proposal.actionId === "confide" &&
        action.speech?.channel === "private")
    ) {
      continue;
    }

    const key = `${action.roundIndex}:${action.actorId}:${action.targetPlayerId}`;
    const entry = episodes.get(key) ?? {
      actorId: action.actorId,
      targetPlayerId: action.targetPlayerId,
      roundIndex: action.roundIndex,
      latestSupportSequence: action.sequence,
      supportActionIds: new Set<AgentActionProposal["actionId"]>(),
    };

    entry.latestSupportSequence = action.sequence;
    entry.supportActionIds.add(action.proposal.actionId);
    episodes.set(key, entry);
  }

  let shiftCount = 0;
  let betrayalShiftCount = 0;

  for (const episode of episodes.values()) {
    const deadline =
      nextVoteResolutionAfter(
        context.voteResolutions,
        episode.latestSupportSequence,
      )?.sequence ?? Number.POSITIVE_INFINITY;
    const hostility = context.actions.find(
      (action) =>
        action.sequence > episode.latestSupportSequence &&
        action.sequence < deadline &&
        action.actorId === episode.actorId &&
        hostileActionIds.has(action.proposal.actionId) &&
        action.targetPlayerId === episode.targetPlayerId,
    );

    if (!hostility) {
      continue;
    }

    shiftCount += 1;

    if (
      [...episode.supportActionIds].some((actionId) =>
        betrayalSupportActionIds.has(actionId),
      )
    ) {
      betrayalShiftCount += 1;
    }
  }

  return {
    allianceEpisodeCount: episodes.size,
    shiftCount,
    betrayalShiftCount,
    volatilityRate: averageRate(shiftCount, episodes.size),
  };
};

const collectEvidenceGroundedAccusationQuality = (
  context: ReplayContext,
  evidenceRecords: readonly EvidenceRecord[],
): EvidenceGroundedAccusationQualityMetrics => {
  const accusations = context.actions.filter(
    (action) =>
      accusationActionIds.has(action.proposal.actionId) &&
      !!action.targetPlayerId,
  );
  let groundedCount = 0;
  let groundedShadowHitCount = 0;

  for (const accusation of accusations) {
    const targetPlayerId = accusation.targetPlayerId as PlayerId;
    const hasDirectConcreteSpeech = hasConcreteTargetedSpeechEvidence(
      accusation,
      context.displayNames,
    );
    const hasPriorEvidence = evidenceRecords.some(
      (record) =>
        record.targetPlayerId === targetPlayerId &&
        record.sequence < accusation.sequence,
    );
    const grounded = hasDirectConcreteSpeech || hasPriorEvidence;

    if (!grounded) {
      continue;
    }

    groundedCount += 1;

    if (context.roleAssignments[targetPlayerId]?.team === "shadow") {
      groundedShadowHitCount += 1;
    }
  }

  return {
    accusationCount: accusations.length,
    groundedCount,
    groundedRate: averageRate(groundedCount, accusations.length),
    groundedShadowHitCount,
    groundedShadowHitRate: averageRate(
      groundedShadowHitCount,
      accusations.length,
    ),
    groundedPrecision: averageRate(groundedShadowHitCount, groundedCount),
  };
};

const collectMeetingInfluenceQuality = (
  context: ReplayContext,
): MeetingInfluenceQualityMetrics => {
  const meetingSpeeches = context.actions.filter((action) =>
    isInfluenceSpeech(action, context.displayNames),
  );
  let influentialTurnCount = 0;
  let alignedVoteCount = 0;
  let correctInfluenceCount = 0;
  let misleadingInfluenceCount = 0;

  for (const speech of meetingSpeeches) {
    const targetPlayerId = speech.targetPlayerId as PlayerId;
    const deadline =
      nextVoteResolutionAfter(context.voteResolutions, speech.sequence)
        ?.sequence ?? Number.POSITIVE_INFINITY;
    const alignedVotes = context.actions.filter(
      (action) =>
        action.sequence > speech.sequence &&
        action.sequence < deadline &&
        action.proposal.actionId === "vote-player" &&
        action.actorId !== speech.actorId &&
        action.targetPlayerId === targetPlayerId,
    );

    if (alignedVotes.length === 0) {
      continue;
    }

    influentialTurnCount += 1;
    alignedVoteCount += new Set(alignedVotes.map((vote) => vote.actorId)).size;

    if (context.roleAssignments[targetPlayerId]?.team === "shadow") {
      correctInfluenceCount += 1;
    } else {
      misleadingInfluenceCount += 1;
    }
  }

  const influenceScore =
    influentialTurnCount === 0
      ? 0
      : clamp01(averageRate(correctInfluenceCount, influentialTurnCount)) -
        clamp01(averageRate(misleadingInfluenceCount, influentialTurnCount));

  return {
    speechTurnCount: meetingSpeeches.length,
    influentialTurnCount,
    alignedVoteCount,
    correctInfluenceCount,
    misleadingInfluenceCount,
    influenceScore,
  };
};

export const createReplayEqMetrics = (
  replay: EngineReplayLog,
): ReplayEqMetrics => {
  const context = createReplayContext(replay);
  const contradictions = detectContradictions(context.actions);
  const evidenceRecords = createEvidenceRecords(
    context.displayNames,
    context.actions,
    contradictions,
  );

  return ReplayEqMetricsSchema.parse({
    contradictionHandling: collectContradictionHandling(
      context,
      contradictions,
    ),
    falseAccusationRecovery: collectFalseAccusationRecovery(context),
    witnessStabilization: collectWitnessStabilization(context),
    promiseIntegrity: collectPromiseIntegrity(context),
    allianceShift: collectAllianceShift(context),
    evidenceGroundedAccusationQuality: collectEvidenceGroundedAccusationQuality(
      context,
      evidenceRecords,
    ),
    meetingInfluenceQuality: collectMeetingInfluenceQuality(context),
  });
};
