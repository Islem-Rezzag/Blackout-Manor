import type {
  EngineEvent,
  EngineReplayLog,
  EngineState,
} from "@blackout-manor/engine";
import {
  type MatchEvent,
  type MatchSnapshot,
  type PlayerId,
  type PlayerState,
  PROTOCOL_VERSION,
  type PublicPlayerState,
  type ReplayEnvelope,
  type ReplayFrame,
  type RoomState,
  type ServerValidationErrorMessage,
  type TaskState,
} from "@blackout-manor/shared";

const MAX_RECENT_EVENTS = 32;

const toBodyLanguage = (
  player: PlayerState,
): PublicPlayerState["bodyLanguage"] => {
  if (
    player.emotion.label === "afraid" ||
    player.emotion.label === "guilty" ||
    player.emotion.label === "shaken"
  ) {
    return "shaken";
  }

  if (player.emotion.intensity >= 0.75 && player.emotion.dominance > 0.2) {
    return "defiant";
  }

  if (player.emotion.intensity >= 0.6 || player.emotion.arousal >= 0.5) {
    return "agitated";
  }

  return "calm";
};

export const createValidationError = (
  code: string,
  message: string,
  issues: string[] = [],
): ServerValidationErrorMessage => ({
  type: "server.validation-error",
  code,
  message,
  issues,
});

const findPlayer = (players: PlayerState[], playerId: PlayerId) =>
  players.find((player) => player.id === playerId) ?? null;

const findTask = (tasks: TaskState[], taskId: string) =>
  tasks.find((task) => task.taskId === taskId) ?? null;

const eventIdFromSequence = (suffix: string, sequence: number) =>
  `${suffix}-${sequence}`;

const actionEventToMatchEvents = (
  engineEvent: Extract<EngineEvent, { type: "action-recorded" }>,
  previousPlayers: PlayerState[],
  currentPlayers: PlayerState[],
  previousTasks: TaskState[],
  currentTasks: TaskState[],
): MatchEvent[] => {
  const { proposal, sequence, tick } = engineEvent;
  const actorBefore = findPlayer(previousPlayers, proposal.actorId);
  const actorAfter = findPlayer(currentPlayers, proposal.actorId);
  const phaseId = proposal.phaseId;
  const roomId = actorBefore?.roomId ?? actorAfter?.roomId;
  const events: MatchEvent[] = [];

  switch (proposal.actionId) {
    case "continue-task": {
      const previousTask = findTask(previousTasks, proposal.taskId);
      const currentTask = findTask(currentTasks, proposal.taskId);

      if (!currentTask) {
        break;
      }

      if (
        currentTask.status === "completed" &&
        previousTask?.status !== "completed"
      ) {
        events.push({
          id: eventIdFromSequence("task-completed", sequence),
          eventId: "task-completed",
          tick,
          phaseId,
          playerId: proposal.actorId,
          taskId: proposal.taskId,
          roomId: currentTask.roomId,
        });
      } else if ((currentTask.progress ?? 0) > (previousTask?.progress ?? 0)) {
        events.push({
          id: eventIdFromSequence("task-progressed", sequence),
          eventId: "task-progressed",
          tick,
          phaseId,
          playerId: proposal.actorId,
          taskId: proposal.taskId,
          roomId: currentTask.roomId,
          progress: currentTask.progress,
        });
      }
      break;
    }
    case "trigger-blackout":
    case "jam-door":
    case "loop-cameras":
    case "forge-ledger-entry":
    case "plant-false-clue":
    case "mimic-task-audio":
    case "delay-two-person-task":
    case "seal-room": {
      events.push({
        id: eventIdFromSequence("sabotage", sequence),
        eventId: "sabotage-triggered",
        tick,
        phaseId,
        playerId: proposal.actorId,
        actionId: proposal.actionId,
        ...("targetRoomId" in proposal
          ? { roomId: proposal.targetRoomId }
          : roomId
            ? { roomId }
            : {}),
        ...("taskId" in proposal ? { taskId: proposal.taskId } : {}),
      });
      break;
    }
    case "eliminate": {
      if (!roomId) {
        break;
      }

      events.push({
        id: eventIdFromSequence("elimination", sequence),
        eventId: "player-eliminated",
        tick,
        phaseId,
        playerId: proposal.actorId,
        targetPlayerId: proposal.targetPlayerId,
        roomId,
      });
      break;
    }
    case "report-body": {
      if (!roomId) {
        break;
      }

      events.push({
        id: eventIdFromSequence("report", sequence),
        eventId: "body-reported",
        tick,
        phaseId,
        playerId: proposal.actorId,
        targetPlayerId: proposal.discoveredPlayerId,
        roomId,
      });
      break;
    }
    case "call-meeting": {
      events.push({
        id: eventIdFromSequence("meeting", sequence),
        eventId: "meeting-called",
        tick,
        phaseId,
        playerId: proposal.actorId,
        reason: "Emergency bell",
      });
      break;
    }
    case "vote-player": {
      events.push({
        id: eventIdFromSequence("vote", sequence),
        eventId: "vote-cast",
        tick,
        phaseId,
        playerId: proposal.actorId,
        targetPlayerId: proposal.targetPlayerId,
      });
      break;
    }
    case "skip-vote": {
      events.push({
        id: eventIdFromSequence("skip-vote", sequence),
        eventId: "vote-cast",
        tick,
        phaseId,
        playerId: proposal.actorId,
        targetPlayerId: null,
      });
      break;
    }
    case "recover-clue":
    case "dust-room": {
      if (!roomId) {
        break;
      }

      events.push({
        id: eventIdFromSequence("clue", sequence),
        eventId: "clue-discovered",
        tick,
        phaseId,
        playerId: proposal.actorId,
        clueId: `clue-${sequence}`,
        roomId,
      });
      break;
    }
    default: {
      if (!proposal.speech) {
        break;
      }

      events.push({
        id: eventIdFromSequence("discussion", sequence),
        eventId: "discussion-turn",
        tick,
        phaseId,
        playerId: proposal.actorId,
        text: proposal.speech.text,
        ...("targetPlayerId" in proposal
          ? { targetPlayerId: proposal.targetPlayerId }
          : {}),
      });
    }
  }

  return events;
};

export const mapEngineEventsToMatchEvents = (
  engineEvents: EngineEvent[],
  previousPlayers: PlayerState[],
  currentPlayers: PlayerState[],
  previousTasks: TaskState[],
  currentTasks: TaskState[],
): MatchEvent[] => {
  const matchEvents: MatchEvent[] = [];

  for (const engineEvent of engineEvents) {
    switch (engineEvent.type) {
      case "phase-changed": {
        matchEvents.push({
          id: eventIdFromSequence("phase", engineEvent.sequence),
          eventId: "phase-changed",
          tick: engineEvent.tick,
          phaseId: engineEvent.toPhaseId,
          fromPhaseId: engineEvent.fromPhaseId,
          toPhaseId: engineEvent.toPhaseId,
        });
        break;
      }
      case "action-recorded": {
        matchEvents.push(
          ...actionEventToMatchEvents(
            engineEvent,
            previousPlayers,
            currentPlayers,
            previousTasks,
            currentTasks,
          ),
        );
        break;
      }
      case "vote-resolved": {
        if (!engineEvent.exiledPlayerId) {
          break;
        }

        matchEvents.push({
          id: eventIdFromSequence("exile", engineEvent.sequence),
          eventId: "player-exiled",
          tick: engineEvent.tick,
          phaseId: "reveal",
          playerId: engineEvent.exiledPlayerId,
        });
        break;
      }
      default:
        break;
    }
  }

  return matchEvents;
};

export const toPublicPlayerState = (
  player: PlayerState,
  connectedOverride?: boolean,
): PublicPlayerState => ({
  id: player.id,
  displayName: player.displayName,
  roomId: player.roomId,
  status: player.status,
  connected: connectedOverride ?? player.connected,
  publicImage: player.publicImage,
  emotion: player.emotion,
  bodyLanguage: toBodyLanguage(player),
  completedTaskCount: player.completedTaskIds.length,
});

export const createMatchSnapshot = (
  state: EngineState,
  recentEvents: MatchEvent[],
  connectedOverrides?: Partial<Record<PlayerId, boolean>>,
): MatchSnapshot => ({
  matchId: state.config.matchId,
  phaseId: state.phaseId,
  tick: state.tick,
  config: state.config,
  players: state.players.map((player) =>
    toPublicPlayerState(player, connectedOverrides?.[player.id]),
  ),
  rooms: structuredClone(state.rooms),
  tasks: structuredClone(state.tasks),
  recentEvents: recentEvents.slice(-MAX_RECENT_EVENTS),
});

const createReplayFrame = (
  replayLog: EngineReplayLog,
  frameIndex: number,
): ReplayFrame => {
  const frame = replayLog.frames[frameIndex];

  if (!frame) {
    throw new Error(`Missing replay frame at index ${frameIndex}.`);
  }

  const previousFrame = replayLog.frames[frameIndex - 1];
  const matchEvents = mapEngineEventsToMatchEvents(
    frame.events,
    previousFrame?.players ?? frame.players,
    frame.players,
    previousFrame?.tasks ?? frame.tasks,
    frame.tasks,
  );

  return {
    tick: frame.tick,
    phaseId: frame.phaseId,
    events: matchEvents,
    players: frame.players.map((player) => toPublicPlayerState(player)),
    rooms: structuredClone(frame.rooms) as RoomState[],
    tasks: structuredClone(frame.tasks),
  };
};

export const createReplayEnvelopeFromEngineReplay = (
  replayLog: EngineReplayLog,
  createdAt = new Date().toISOString(),
): ReplayEnvelope => ({
  protocolVersion: PROTOCOL_VERSION,
  replayId: replayLog.replayId,
  matchId: replayLog.matchId,
  seed: replayLog.seed,
  createdAt,
  config: replayLog.config,
  frames: replayLog.frames.map((_frame, frameIndex) =>
    createReplayFrame(replayLog, frameIndex),
  ),
});
