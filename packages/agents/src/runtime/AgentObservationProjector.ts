import type { EngineEvent, EngineState } from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PlayerId,
  PlayerState,
  RoomId,
  TaskState,
} from "@blackout-manor/shared";

export const AGENT_EVENT_VISIBILITY_CATEGORIES = [
  "public-to-all",
  "same-room",
  "actor-only",
  "target-only",
  "witnesses",
  "replay-only",
] as const;

export type AgentEventVisibilityCategory =
  (typeof AGENT_EVENT_VISIBILITY_CATEGORIES)[number];

export type ProjectedAgentObservationEvent = {
  sequence: number;
  tick: number;
  category: AgentEventVisibilityCategory;
  summary: string;
  speechClaim?: string | undefined;
  socialEvent?: EngineEvent | undefined;
};

type EventFrameContext = {
  playersBefore: PlayerState[];
  playersAfter: PlayerState[];
  tasksBefore: TaskState[];
  tasksAfter: TaskState[];
};

const MAX_SUMMARY_LENGTH = 180;

const truncateSummary = (summary: string) =>
  summary.length <= MAX_SUMMARY_LENGTH
    ? summary
    : `${summary.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;

const findPlayer = (players: readonly PlayerState[], playerId: PlayerId) =>
  players.find((player) => player.id === playerId) ?? null;

const findTask = (tasks: readonly TaskState[], taskId: string) =>
  tasks.find((task) => task.taskId === taskId) ?? null;

const eventFrameContext = (
  state: EngineState,
  event: EngineEvent,
): EventFrameContext => {
  const frameIndex = state.replayFrames.findIndex((frame) =>
    frame.events.some((entry) => entry.sequence === event.sequence),
  );
  const frame = frameIndex >= 0 ? state.replayFrames[frameIndex] : undefined;
  const previousFrame =
    frameIndex > 0 ? state.replayFrames[frameIndex - 1] : undefined;

  return {
    playersBefore: previousFrame?.players ?? frame?.players ?? state.players,
    playersAfter: frame?.players ?? state.players,
    tasksBefore: previousFrame?.tasks ?? frame?.tasks ?? state.tasks,
    tasksAfter: frame?.tasks ?? state.tasks,
  };
};

const targetPlayerIdFromProposal = (proposal: AgentActionProposal) => {
  if ("targetPlayerId" in proposal) {
    return proposal.targetPlayerId;
  }

  if ("discoveredPlayerId" in proposal) {
    return proposal.discoveredPlayerId;
  }

  return null;
};

const cloneEventWithoutPrivateSummary = (event: EngineEvent): EngineEvent => {
  if (event.type !== "action-recorded") {
    return structuredClone(event);
  }

  const { privateSummary: _privateSummary, ...proposal } = event.proposal;

  return {
    ...event,
    proposal,
  } as EngineEvent;
};

const createProjectedEvent = (
  event: EngineEvent,
  category: AgentEventVisibilityCategory,
  summary: string,
  options: {
    speechClaim?: string | undefined;
    includeSocialEvent?: boolean | undefined;
  } = {},
): ProjectedAgentObservationEvent => ({
  sequence: event.sequence,
  tick: event.tick,
  category,
  summary: truncateSummary(summary),
  ...(options.speechClaim
    ? { speechClaim: truncateSummary(options.speechClaim) }
    : {}),
  ...(options.includeSocialEvent
    ? { socialEvent: cloneEventWithoutPrivateSummary(event) }
    : {}),
});

const playerRoomBefore = (context: EventFrameContext, playerId: PlayerId) =>
  findPlayer(context.playersBefore, playerId)?.roomId ?? null;

const playerRoomAfter = (context: EventFrameContext, playerId: PlayerId) =>
  findPlayer(context.playersAfter, playerId)?.roomId ?? null;

const viewerWasInRoom = (
  context: EventFrameContext,
  viewerId: PlayerId,
  roomId: RoomId | null,
) =>
  roomId !== null &&
  (playerRoomBefore(context, viewerId) === roomId ||
    playerRoomAfter(context, viewerId) === roomId);

const actorActionSummary = (proposal: AgentActionProposal) => {
  switch (proposal.actionId) {
    case "move":
      return `You moved to ${proposal.targetRoomId}.`;
    case "start-task":
      return `You started ${proposal.taskId}.`;
    case "continue-task":
      return `You worked on ${proposal.taskId}.`;
    case "report-body":
      return `You reported ${proposal.discoveredPlayerId}'s body.`;
    case "call-meeting":
      return "You called a meeting.";
    case "eliminate":
      return `You eliminated ${proposal.targetPlayerId}.`;
    case "trigger-blackout":
      return "You triggered a blackout.";
    case "jam-door":
      return `You jammed the door to ${proposal.targetRoomId}.`;
    case "loop-cameras":
      return `You looped cameras in ${proposal.targetRoomId}.`;
    case "forge-ledger-entry":
      return `You forged evidence around ${proposal.taskId}.`;
    case "plant-false-clue":
      return `You planted a false clue in ${proposal.targetRoomId}.`;
    case "mimic-task-audio":
      return `You mimicked task audio near ${proposal.taskId}.`;
    case "delay-two-person-task":
      return `You disrupted ${proposal.taskId}.`;
    case "dust-room":
      return `You dusted ${proposal.targetRoomId} for clues.`;
    case "recover-clue":
      return `You recovered a clue in ${proposal.targetRoomId}.`;
    case "compare-clue-fragments":
      return "You compared clue fragments.";
    case "ask-forensic-question":
      return `You asked: ${proposal.question}`;
    case "escort-player":
      return `You escorted ${proposal.targetPlayerId}.`;
    case "seal-room":
      return `You sealed ${proposal.targetRoomId}.`;
    case "unlock-service-passage":
      return "You unlocked the service passage.";
    case "vote-player":
      return `You voted for ${proposal.targetPlayerId}.`;
    case "skip-vote":
      return "You skipped the vote.";
    case "comfort":
    case "reassure":
    case "press":
    case "promise":
    case "apologize":
    case "confide":
      return `You used ${proposal.actionId} with ${proposal.targetPlayerId}.`;
  }
};

const publicActionSummary = (
  proposal: AgentActionProposal,
  context: EventFrameContext,
) => {
  const actorRoom = playerRoomBefore(context, proposal.actorId);

  switch (proposal.actionId) {
    case "move": {
      const fromRoomId = actorRoom ?? "another room";
      return `${proposal.actorId} moved from ${fromRoomId} to ${proposal.targetRoomId}.`;
    }
    case "start-task":
      return `${proposal.actorId} started ${proposal.taskId}.`;
    case "continue-task":
      return `${proposal.actorId} worked on ${proposal.taskId}.`;
    case "report-body":
      return `${proposal.actorId} reported ${proposal.discoveredPlayerId}'s body in ${actorRoom ?? "the room"}.`;
    case "call-meeting":
      return `${proposal.actorId} called a meeting.`;
    case "comfort":
    case "reassure":
    case "press":
    case "promise":
    case "apologize":
    case "confide":
      return `${proposal.actorId} used ${proposal.actionId} with ${proposal.targetPlayerId}.`;
    case "escort-player":
      return `${proposal.actorId} escorted ${proposal.targetPlayerId}.`;
    case "unlock-service-passage":
      return `${proposal.actorId} unlocked the service passage.`;
    case "jam-door":
      return `${proposal.actorId} jammed the door to ${proposal.targetRoomId}.`;
    case "loop-cameras":
      return `${proposal.actorId} looped cameras in ${proposal.targetRoomId}.`;
    case "forge-ledger-entry":
      return `${proposal.actorId} forged evidence around ${proposal.taskId}.`;
    case "plant-false-clue":
      return `${proposal.actorId} planted a false clue in ${proposal.targetRoomId}.`;
    case "mimic-task-audio":
      return `${proposal.actorId} mimicked task audio near ${proposal.taskId}.`;
    case "delay-two-person-task":
      return `${proposal.actorId} disrupted ${proposal.taskId}.`;
    case "seal-room":
      return `${proposal.actorId} sealed ${proposal.targetRoomId}.`;
    case "recover-clue":
      return `${proposal.actorId} recovered a clue in ${proposal.targetRoomId}.`;
    case "dust-room":
      return `${proposal.actorId} dusted ${proposal.targetRoomId} for clues.`;
    case "ask-forensic-question":
      return `${proposal.actorId} asked: ${proposal.question}`;
    case "compare-clue-fragments":
      return `${proposal.actorId} compared clue fragments.`;
    case "vote-player":
      return `${proposal.actorId} voted for ${proposal.targetPlayerId}.`;
    case "skip-vote":
      return `${proposal.actorId} skipped the vote.`;
    default:
      return actorActionSummary(proposal);
  }
};

const sabotageEffectSummary = (proposal: AgentActionProposal) => {
  switch (proposal.actionId) {
    case "trigger-blackout":
      return "A blackout started.";
    case "jam-door":
      return `The door to ${proposal.targetRoomId} jammed.`;
    case "loop-cameras":
      return `The cameras in ${proposal.targetRoomId} were disrupted.`;
    case "forge-ledger-entry":
      return `The ledger around ${proposal.taskId} looked tampered with.`;
    case "plant-false-clue":
      return `A suspicious clue appeared in ${proposal.targetRoomId}.`;
    case "mimic-task-audio":
      return `Task audio near ${proposal.taskId} sounded wrong.`;
    case "delay-two-person-task":
      return `${proposal.taskId} was disrupted.`;
    case "seal-room":
      return `${proposal.targetRoomId} was sealed.`;
    default:
      return "Something suspicious happened.";
  }
};

const actionEffectRoom = (
  proposal: AgentActionProposal,
  context: EventFrameContext,
) => {
  if ("targetRoomId" in proposal) {
    return proposal.targetRoomId;
  }

  if ("taskId" in proposal) {
    return playerRoomBefore(context, proposal.actorId);
  }

  return playerRoomBefore(context, proposal.actorId);
};

const taskProgressBecamePublic = (
  proposal: AgentActionProposal,
  context: EventFrameContext,
) => {
  if (proposal.actionId !== "continue-task") {
    return false;
  }

  const before = findTask(context.tasksBefore, proposal.taskId);
  const after = findTask(context.tasksAfter, proposal.taskId);

  if (!after) {
    return false;
  }

  return (
    after.status === "completed" ||
    (after.progress ?? 0) > (before?.progress ?? 0)
  );
};

const projectSpeechAction = (
  event: Extract<EngineEvent, { type: "action-recorded" }>,
  actorId: PlayerId,
  context: EventFrameContext,
) => {
  const { proposal } = event;
  const speech = proposal.speech;

  if (!speech) {
    return null;
  }

  const targetPlayerId = targetPlayerIdFromProposal(proposal);
  const speechClaim = `${proposal.actorId}: ${speech.text}`;

  if (speech.channel === "meeting") {
    return createProjectedEvent(
      event,
      "public-to-all",
      `${proposal.actorId} said: ${speech.text}`,
      { speechClaim, includeSocialEvent: true },
    );
  }

  if (
    speech.channel === "private" &&
    targetPlayerId &&
    actorId === targetPlayerId
  ) {
    return createProjectedEvent(
      event,
      "target-only",
      `${proposal.actorId} privately said: ${speech.text}`,
      { speechClaim, includeSocialEvent: true },
    );
  }

  if (speech.channel === "private" && actorId === proposal.actorId) {
    return createProjectedEvent(
      event,
      "actor-only",
      `You privately said: ${speech.text}`,
      { speechClaim, includeSocialEvent: true },
    );
  }

  if (
    speech.channel === "proximity" &&
    viewerWasInRoom(
      context,
      actorId,
      playerRoomBefore(context, proposal.actorId),
    )
  ) {
    return createProjectedEvent(
      event,
      "same-room",
      `${proposal.actorId} said nearby: ${speech.text}`,
      { speechClaim, includeSocialEvent: true },
    );
  }

  return null;
};

const projectActionEvent = (
  state: EngineState,
  actorId: PlayerId,
  event: Extract<EngineEvent, { type: "action-recorded" }>,
) => {
  const { proposal } = event;
  const context = eventFrameContext(state, event);
  const targetPlayerId = targetPlayerIdFromProposal(proposal);
  const speechProjection = projectSpeechAction(event, actorId, context);

  if (speechProjection) {
    return speechProjection;
  }

  if (actorId === proposal.actorId) {
    return createProjectedEvent(
      event,
      "actor-only",
      actorActionSummary(proposal),
      {
        includeSocialEvent: true,
      },
    );
  }

  if (proposal.actionId === "eliminate") {
    const roomId = playerRoomBefore(context, proposal.actorId);

    if (
      actorId === proposal.targetPlayerId ||
      viewerWasInRoom(context, actorId, roomId)
    ) {
      return createProjectedEvent(
        event,
        "witnesses",
        `${proposal.targetPlayerId} was eliminated in ${roomId ?? "the room"}.`,
      );
    }

    return null;
  }

  if (
    proposal.actionId === "report-body" ||
    proposal.actionId === "call-meeting"
  ) {
    return createProjectedEvent(
      event,
      "public-to-all",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  if (proposal.actionId === "confide") {
    return targetPlayerId === actorId
      ? createProjectedEvent(
          event,
          "target-only",
          publicActionSummary(proposal, context),
          { includeSocialEvent: true },
        )
      : null;
  }

  if (proposal.phaseId === "meeting") {
    return createProjectedEvent(
      event,
      targetPlayerId === actorId ? "target-only" : "public-to-all",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  if (
    proposal.actionId === "vote-player" ||
    proposal.actionId === "skip-vote"
  ) {
    return createProjectedEvent(
      event,
      targetPlayerId === actorId ? "target-only" : "public-to-all",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  if (taskProgressBecamePublic(proposal, context)) {
    return createProjectedEvent(
      event,
      "public-to-all",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  if (
    proposal.actionId === "trigger-blackout" ||
    proposal.actionId === "jam-door" ||
    proposal.actionId === "loop-cameras" ||
    proposal.actionId === "forge-ledger-entry" ||
    proposal.actionId === "plant-false-clue" ||
    proposal.actionId === "mimic-task-audio" ||
    proposal.actionId === "delay-two-person-task" ||
    proposal.actionId === "seal-room"
  ) {
    const effectRoom = actionEffectRoom(proposal, context);
    const actorRoom = playerRoomBefore(context, proposal.actorId);
    const isPublic = proposal.actionId === "trigger-blackout";

    if (
      !isPublic &&
      actorRoom !== null &&
      viewerWasInRoom(context, actorId, actorRoom)
    ) {
      return createProjectedEvent(
        event,
        "witnesses",
        publicActionSummary(proposal, context),
        { includeSocialEvent: true },
      );
    }

    if (isPublic || viewerWasInRoom(context, actorId, effectRoom)) {
      return createProjectedEvent(
        event,
        isPublic ? "public-to-all" : "same-room",
        sabotageEffectSummary(proposal),
      );
    }

    return null;
  }

  if (
    proposal.phaseId === "report" &&
    (proposal.actionId === "dust-room" || proposal.actionId === "recover-clue")
  ) {
    return createProjectedEvent(
      event,
      "public-to-all",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  if (
    proposal.actionId === "dust-room" ||
    proposal.actionId === "recover-clue" ||
    proposal.actionId === "compare-clue-fragments" ||
    proposal.actionId === "ask-forensic-question"
  ) {
    return null;
  }

  const actionRoom = actionEffectRoom(proposal, context);

  if (
    actorId === targetPlayerId ||
    viewerWasInRoom(context, actorId, actionRoom)
  ) {
    return createProjectedEvent(
      event,
      actorId === targetPlayerId ? "target-only" : "same-room",
      publicActionSummary(proposal, context),
      { includeSocialEvent: true },
    );
  }

  return null;
};

const formatVoteTotals = (voteTotals: Record<string, number>) => {
  const entries = Object.entries(voteTotals).sort(
    ([leftPlayerId], [rightPlayerId]) =>
      leftPlayerId.localeCompare(rightPlayerId),
  );

  if (entries.length === 0) {
    return "no votes were cast";
  }

  return entries.map(([playerId, count]) => `${playerId}: ${count}`).join(", ");
};

const projectEventForAgent = (
  state: EngineState,
  actorId: PlayerId,
  event: EngineEvent,
): ProjectedAgentObservationEvent | null => {
  switch (event.type) {
    case "match-bootstrapped":
      return createProjectedEvent(event, "public-to-all", "The match began.");
    case "roles-assigned":
      return createProjectedEvent(
        event,
        "public-to-all",
        "Roles were assigned.",
      );
    case "phase-changed":
      return createProjectedEvent(
        event,
        "public-to-all",
        `Phase shifted from ${event.fromPhaseId} to ${event.toPhaseId}.`,
      );
    case "vote-resolved": {
      const exile = event.exiledPlayerId
        ? ` ${event.exiledPlayerId} was exiled.`
        : " No one was exiled.";

      return createProjectedEvent(
        event,
        "public-to-all",
        `Vote resolved: ${formatVoteTotals(event.voteTotals)}.${exile}`,
      );
    }
    case "win-declared":
      return createProjectedEvent(
        event,
        "public-to-all",
        `${event.winner.team} won by ${event.winner.reason}.`,
      );
    case "tick-advanced":
      return null;
    case "action-recorded":
      return projectActionEvent(state, actorId, event);
  }
};

export const projectAgentObservationEvents = (
  state: EngineState,
  actorId: PlayerId,
  events: readonly EngineEvent[] = state.eventLog,
): ProjectedAgentObservationEvent[] =>
  events.flatMap((event) => {
    const projected = projectEventForAgent(state, actorId, event);

    return projected ? [projected] : [];
  });

export const projectVisibleEventSummariesForAgent = (
  state: EngineState,
  actorId: PlayerId,
  events: readonly EngineEvent[] = state.eventLog,
) =>
  projectAgentObservationEvents(state, actorId, events).map(
    (event) => event.summary,
  );

export const projectVisibleSpeechClaimsForAgent = (
  state: EngineState,
  actorId: PlayerId,
  events: readonly EngineEvent[] = state.eventLog,
) =>
  projectAgentObservationEvents(state, actorId, events)
    .flatMap((event) => (event.speechClaim ? [event.speechClaim] : []))
    .reverse();

export const projectSocialEventsForAgent = (
  state: EngineState,
  actorId: PlayerId,
  events: readonly EngineEvent[] = state.eventLog,
) =>
  projectAgentObservationEvents(state, actorId, events).flatMap((event) =>
    event.socialEvent ? [event.socialEvent] : [],
  );
