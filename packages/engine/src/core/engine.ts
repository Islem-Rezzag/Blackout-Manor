import type {
  AgentActionProposal,
  MatchConfig,
  PlayerId,
  RoomId,
} from "@blackout-manor/shared";

import {
  createDefaultMatchConfig,
  createInitialPlayers,
  createInitialRooms,
  createInitialTasks,
  isAdjacentRoom,
  isKnownRoomId,
  isKnownTaskId,
  isTwoPersonTask,
  phaseDurationById,
  roleTeamFromRole,
} from "./content";
import { shuffleDeterministically } from "./rng";
import type {
  EngineBootstrapPlayer,
  EngineEvent,
  EngineLegalityResult,
  EngineReplayLog,
  EngineRoleAssignment,
  EngineState,
  EngineTransitionResult,
  EngineWinner,
  EngineWinReason,
} from "./types";

const TASK_PROGRESS_STEP = 0.5;
const BLACKOUT_DURATION_TICKS = 15;
const ROOM_LOCK_DURATION_TICKS = 20;
const HARD_CAP_STABILIZATION_THRESHOLD = 0.3;

type EngineEventInput = {
  [TType in EngineEvent["type"]]: Omit<
    Extract<EngineEvent, { type: TType }>,
    "sequence"
  >;
}[EngineEvent["type"]];

const cloneState = (state: EngineState): EngineState => structuredClone(state);

const assertTenPlayers = (players: EngineBootstrapPlayer[]) => {
  if (players.length !== 10) {
    throw new Error(
      `Blackout Manor requires exactly 10 players, received ${players.length}.`,
    );
  }
};

const makeReplayId = (matchId: string, seed: number) =>
  `replay-${matchId}-${seed}`;

const findPlayer = (state: EngineState, playerId: PlayerId) => {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    throw new Error(`Unknown player: ${playerId}`);
  }

  return player;
};

const findTask = (state: EngineState, taskId: string) => {
  const task = state.tasks.find((candidate) => candidate.taskId === taskId);

  if (!task) {
    throw new Error(`Unknown task: ${taskId}`);
  }

  return task;
};

const livingPlayers = (state: EngineState) =>
  state.players.filter((player) => player.status === "alive");

const aliveShadows = (state: EngineState) =>
  livingPlayers(state).filter((player) => player.team === "shadow");

const aliveHousehold = (state: EngineState) =>
  livingPlayers(state).filter((player) => player.team === "household");

const allTasksCompleted = (state: EngineState) =>
  state.tasks.every((task) => task.status === "completed");

const stabilizationProgress = (state: EngineState) =>
  state.tasks.length === 0
    ? 0
    : state.tasks.reduce((total, task) => total + task.progress, 0) /
      state.tasks.length;

const areAllLivingPlayersVoted = (state: EngineState) =>
  livingPlayers(state).every((player) => Object.hasOwn(state.votes, player.id));

const rebuildRoomOccupants = (state: EngineState) => {
  for (const room of state.rooms) {
    room.occupantIds = state.players
      .filter(
        (player) => player.roomId === room.roomId && player.status === "alive",
      )
      .map((player) => player.id);
  }
};

const recomputeRoomConditions = (state: EngineState) => {
  const blackoutActive =
    state.blackoutUntilTick !== null && state.tick < state.blackoutUntilTick;

  if (!blackoutActive) {
    state.blackoutUntilTick = null;
  }

  for (const room of state.rooms) {
    room.lightLevel = blackoutActive ? "blackout" : "lit";

    const sealedUntil = state.sealedRoomsUntilTick[room.roomId];
    const jammedUntil = state.jammedDoorsUntilTick[room.roomId];
    const sealedActive =
      typeof sealedUntil === "number" && state.tick < sealedUntil;
    const jammedActive =
      typeof jammedUntil === "number" && state.tick < jammedUntil;

    if (!sealedActive) {
      delete state.sealedRoomsUntilTick[room.roomId];
    }

    if (!jammedActive) {
      delete state.jammedDoorsUntilTick[room.roomId];
    }

    room.doorState = sealedActive ? "sealed" : jammedActive ? "jammed" : "open";
  }
};

const detachPlayerFromTasks = (state: EngineState, playerId: PlayerId) => {
  for (const task of state.tasks) {
    if (!task.assignedPlayerIds.includes(playerId)) {
      continue;
    }

    task.assignedPlayerIds = task.assignedPlayerIds.filter(
      (candidate) => candidate !== playerId,
    );

    if (
      task.status !== "completed" &&
      task.status !== "blocked" &&
      task.assignedPlayerIds.length === 0
    ) {
      task.status = task.progress > 0 ? "in-progress" : "available";
    }
  }
};

const appendReplayFrame = (state: EngineState, events: EngineEvent[]) => {
  state.replayFrames.push({
    tick: state.tick,
    phaseId: state.phaseId,
    events: structuredClone(events),
    players: structuredClone(state.players),
    rooms: structuredClone(state.rooms),
    tasks: structuredClone(state.tasks),
    winner: structuredClone(state.winner),
  });
};

const evaluateWinner = (state: EngineState): EngineWinner | null => {
  if (state.winner) {
    return state.winner;
  }

  if (aliveShadows(state).length === 0) {
    return {
      team: "household",
      reason: "all-shadows-exiled",
      decidedAtTick: state.tick,
    };
  }

  if (allTasksCompleted(state)) {
    return {
      team: "household",
      reason: "tasks-completed",
      decidedAtTick: state.tick,
    };
  }

  if (aliveShadows(state).length >= aliveHousehold(state).length) {
    return {
      team: "shadow",
      reason: "shadow-parity",
      decidedAtTick: state.tick,
    };
  }

  if (state.tick >= state.config.timings.hardCapSeconds) {
    return {
      team:
        stabilizationProgress(state) >= HARD_CAP_STABILIZATION_THRESHOLD
          ? "household"
          : "shadow",
      reason: "hard-cap",
      decidedAtTick: state.tick,
    };
  }

  return null;
};

const createEmptyState = (config: MatchConfig): EngineState => ({
  config,
  seed: config.seed,
  rngState: config.seed,
  tick: 0,
  phaseId: "intro",
  phaseStartedAtTick: 0,
  phaseEndsAtTick: phaseDurationById(config, "intro"),
  currentRound: 1,
  nextEventSequence: 1,
  players: [],
  rooms: [],
  tasks: [],
  bodyLocations: {},
  reportedBodyIds: [],
  votes: {},
  blackoutUntilTick: null,
  jammedDoorsUntilTick: {},
  sealedRoomsUntilTick: {},
  servicePassageUnlocked: false,
  winner: null,
  eventLog: [],
  replayFrames: [],
});

const makeEvent = (
  state: EngineState,
  offset: number,
  event: EngineEventInput,
): EngineEvent => ({
  ...event,
  sequence: state.nextEventSequence + offset,
});

const assignRoles = (
  state: EngineState,
): { assignments: EngineRoleAssignment[]; nextSeed: number } => {
  const playerIds = state.players.map((player) => player.id);
  const shuffled = shuffleDeterministically(playerIds, state.rngState);
  const assignments: EngineRoleAssignment[] = [];

  for (const [index, playerId] of shuffled.items.entries()) {
    let role: EngineRoleAssignment["role"] = "household";

    if (index < state.config.roleDistribution.shadow) {
      role = "shadow";
    } else if (
      index <
      state.config.roleDistribution.shadow +
        state.config.roleDistribution.investigator
    ) {
      role = "investigator";
    } else if (
      index <
      state.config.roleDistribution.shadow +
        state.config.roleDistribution.investigator +
        state.config.roleDistribution.steward
    ) {
      role = "steward";
    }

    assignments.push({
      playerId,
      role,
      team: roleTeamFromRole(role),
    });
  }

  return {
    assignments,
    nextSeed: shuffled.nextSeed,
  };
};

const applyActionToState = (
  state: EngineState,
  proposal: AgentActionProposal,
) => {
  const actor = findPlayer(state, proposal.actorId);
  actor.lastActionId = proposal.actionId;

  switch (proposal.actionId) {
    case "move": {
      actor.roomId = proposal.targetRoomId;
      rebuildRoomOccupants(state);
      return;
    }
    case "start-task": {
      const task = findTask(state, proposal.taskId);

      if (!task.assignedPlayerIds.includes(actor.id)) {
        task.assignedPlayerIds = [...task.assignedPlayerIds, actor.id];
      }

      task.status = "in-progress";
      actor.activeTaskId = task.taskId;
      return;
    }
    case "continue-task": {
      const task = findTask(state, proposal.taskId);

      if (!task.assignedPlayerIds.includes(actor.id)) {
        task.assignedPlayerIds = [...task.assignedPlayerIds, actor.id];
      }

      actor.activeTaskId = task.taskId;
      task.status = "in-progress";

      const requiredAssignees = task.kind === "two-person" ? 2 : 1;

      if (task.assignedPlayerIds.length < requiredAssignees) {
        return;
      }

      task.progress = Math.min(1, task.progress + TASK_PROGRESS_STEP);

      if (task.progress < 1) {
        return;
      }

      task.progress = 1;
      task.status = "completed";
      const completedBy = [...task.assignedPlayerIds];
      task.assignedPlayerIds = [];

      for (const playerId of completedBy) {
        const player = findPlayer(state, playerId);

        if (!player.completedTaskIds.includes(task.taskId)) {
          player.completedTaskIds = [...player.completedTaskIds, task.taskId];
        }

        delete player.activeTaskId;
      }

      return;
    }
    case "report-body": {
      state.reportedBodyIds = [
        ...state.reportedBodyIds,
        proposal.discoveredPlayerId,
      ];
      return;
    }
    case "eliminate": {
      const target = findPlayer(state, proposal.targetPlayerId);
      state.bodyLocations[target.id] = actor.roomId as RoomId;
      target.status = "eliminated";
      target.roomId = null;
      detachPlayerFromTasks(state, target.id);
      delete target.activeTaskId;
      rebuildRoomOccupants(state);
      return;
    }
    case "trigger-blackout": {
      state.blackoutUntilTick = state.tick + BLACKOUT_DURATION_TICKS;
      recomputeRoomConditions(state);
      return;
    }
    case "jam-door": {
      state.jammedDoorsUntilTick[proposal.targetRoomId] =
        state.tick + ROOM_LOCK_DURATION_TICKS;
      recomputeRoomConditions(state);
      return;
    }
    case "delay-two-person-task": {
      const task = findTask(state, proposal.taskId);
      task.status = "blocked";
      task.assignedPlayerIds = [];
      return;
    }
    case "seal-room": {
      state.sealedRoomsUntilTick[proposal.targetRoomId] =
        state.tick + ROOM_LOCK_DURATION_TICKS;
      recomputeRoomConditions(state);
      return;
    }
    case "unlock-service-passage": {
      state.servicePassageUnlocked = true;
      return;
    }
    case "vote-player": {
      state.votes[actor.id] = proposal.targetPlayerId;
      return;
    }
    case "skip-vote": {
      state.votes[actor.id] = null;
      return;
    }
    default: {
      return;
    }
  }
};

const applyEventMutable = (state: EngineState, event: EngineEvent) => {
  switch (event.type) {
    case "match-bootstrapped": {
      state.config = event.config;
      state.players = createInitialPlayers(event.players);
      state.rooms = createInitialRooms(event.config);
      state.tasks = createInitialTasks(event.config);
      rebuildRoomOccupants(state);
      return;
    }
    case "roles-assigned": {
      state.rngState = event.rngState;

      for (const assignment of event.assignments) {
        const player = findPlayer(state, assignment.playerId);
        player.role = assignment.role;
        player.team = assignment.team;
      }

      return;
    }
    case "tick-advanced": {
      state.tick = event.nextTick;
      recomputeRoomConditions(state);
      return;
    }
    case "phase-changed": {
      state.phaseId = event.toPhaseId;
      state.phaseStartedAtTick = event.tick;
      state.phaseEndsAtTick =
        event.toPhaseId === "resolution"
          ? null
          : event.tick +
            (phaseDurationById(state.config, event.toPhaseId) ?? 0);

      if (event.toPhaseId === "vote") {
        state.votes = {};
      }

      if (event.toPhaseId === "roam" && event.fromPhaseId !== "intro") {
        state.currentRound += 1;
      }

      return;
    }
    case "action-recorded": {
      applyActionToState(state, event.proposal);
      return;
    }
    case "vote-resolved": {
      if (event.exiledPlayerId) {
        const player = findPlayer(state, event.exiledPlayerId);
        player.status = "exiled";
        player.roomId = null;
        detachPlayerFromTasks(state, player.id);
        delete player.activeTaskId;
      }

      state.votes = {};
      rebuildRoomOccupants(state);
      return;
    }
    case "win-declared": {
      state.winner = event.winner;
      return;
    }
  }
};

const applyEvents = (
  state: EngineState,
  events: EngineEvent[],
): EngineState => {
  if (events.length === 0) {
    return state;
  }

  const nextState = cloneState(state);

  for (const event of events) {
    applyEventMutable(nextState, event);
  }

  nextState.eventLog.push(...structuredClone(events));
  nextState.nextEventSequence += events.length;
  appendReplayFrame(nextState, events);

  return nextState;
};

const resolveVoteEvents = (state: EngineState): EngineEvent[] => {
  const voteTotals: Record<string, number> = {};
  const skippedPlayerIds: PlayerId[] = [];

  for (const player of livingPlayers(state)) {
    const vote = state.votes[player.id];

    if (vote === null) {
      skippedPlayerIds.push(player.id);
      continue;
    }

    if (typeof vote === "string") {
      voteTotals[vote] = (voteTotals[vote] ?? 0) + 1;
    }
  }

  const sortedTotals = Object.entries(voteTotals).sort(
    (left, right) => right[1] - left[1],
  );
  const highestCount = sortedTotals[0]?.[1] ?? 0;
  const leaders = sortedTotals.filter(([, count]) => count === highestCount);
  const exiledPlayerId =
    leaders.length === 1 && highestCount > skippedPlayerIds.length
      ? (leaders[0]?.[0] as PlayerId)
      : null;

  return [
    makeEvent(state, 0, {
      type: "vote-resolved",
      tick: state.tick,
      voteTotals,
      exiledPlayerId,
      skippedPlayerIds,
    }),
    makeEvent(state, 1, {
      type: "phase-changed",
      tick: state.tick,
      fromPhaseId: "vote",
      toPhaseId: "reveal",
      reason: "vote",
    }),
  ];
};

const createAutoTransitionEvents = (state: EngineState): EngineEvent[] => {
  if (state.phaseEndsAtTick === null || state.tick < state.phaseEndsAtTick) {
    return [];
  }

  switch (state.phaseId) {
    case "intro":
      return [
        makeEvent(state, 0, {
          type: "phase-changed",
          tick: state.tick,
          fromPhaseId: "intro",
          toPhaseId: "roam",
          reason: "bootstrap",
        }),
      ];
    case "roam":
      return [
        makeEvent(state, 0, {
          type: "phase-changed",
          tick: state.tick,
          fromPhaseId: "roam",
          toPhaseId: "roam",
          reason: "timer",
        }),
      ];
    case "report":
      return [
        makeEvent(state, 0, {
          type: "phase-changed",
          tick: state.tick,
          fromPhaseId: "report",
          toPhaseId: "meeting",
          reason: "report",
        }),
      ];
    case "meeting":
      return [
        makeEvent(state, 0, {
          type: "phase-changed",
          tick: state.tick,
          fromPhaseId: "meeting",
          toPhaseId: "vote",
          reason: "meeting",
        }),
      ];
    case "vote":
      return resolveVoteEvents(state);
    case "reveal":
      return [
        makeEvent(state, 0, {
          type: "phase-changed",
          tick: state.tick,
          fromPhaseId: "reveal",
          toPhaseId: state.winner ? "resolution" : "roam",
          reason: "reveal",
        }),
      ];
    case "resolution":
      return [];
  }
};

const finalizeWinnerEvents = (state: EngineState): EngineEvent[] => {
  const winner = evaluateWinner(state);

  if (!winner || state.winner) {
    return [];
  }

  const events: EngineEvent[] = [
    makeEvent(state, 0, {
      type: "win-declared",
      tick: state.tick,
      winner,
    }),
  ];

  if (state.phaseId !== "reveal" && state.phaseId !== "resolution") {
    events.push(
      makeEvent(state, 1, {
        type: "phase-changed",
        tick: state.tick,
        fromPhaseId: state.phaseId,
        toPhaseId: "resolution",
        reason: "winner",
      }),
    );
  }

  return events;
};

export const bootstrapMatch = (
  config: MatchConfig,
  players: EngineBootstrapPlayer[],
): EngineTransitionResult => {
  assertTenPlayers(players);

  const initialState = createEmptyState(config);
  const bootstrapEvents: EngineEvent[] = [
    makeEvent(initialState, 0, {
      type: "match-bootstrapped",
      tick: 0,
      config,
      players,
    }),
  ];
  const bootstrappedState = applyEvents(initialState, bootstrapEvents);
  const assigned = assignRoles(bootstrappedState);
  const roleEvents: EngineEvent[] = [
    makeEvent(bootstrappedState, 0, {
      type: "roles-assigned",
      tick: 0,
      assignments: assigned.assignments,
      rngState: assigned.nextSeed,
    }),
  ];
  const nextState = applyEvents(bootstrappedState, roleEvents);

  return {
    state: nextState,
    events: [...bootstrapEvents, ...roleEvents],
  };
};

export const bootstrapOfficialMatch = (
  matchId: string,
  seed: number,
  players: EngineBootstrapPlayer[],
) => bootstrapMatch(createDefaultMatchConfig(matchId, seed), players);

export const validateAction = (
  state: EngineState,
  proposal: AgentActionProposal,
): EngineLegalityResult => {
  if (proposal.phaseId !== state.phaseId) {
    return {
      isLegal: false,
      reason: `Action phase ${proposal.phaseId} does not match engine phase ${state.phaseId}.`,
    };
  }

  const actor = state.players.find((player) => player.id === proposal.actorId);

  if (!actor) {
    return { isLegal: false, reason: `Unknown actor: ${proposal.actorId}.` };
  }

  if (actor.status !== "alive") {
    return { isLegal: false, reason: `${proposal.actorId} is not alive.` };
  }

  const targetPlayerAlive = (playerId: PlayerId) =>
    state.players.some(
      (player) => player.id === playerId && player.status === "alive",
    );

  switch (proposal.actionId) {
    case "move":
      if (state.phaseId !== "roam" || actor.roomId === null) {
        return {
          isLegal: false,
          reason: "Movement is only legal during roam.",
        };
      }
      if (
        !isAdjacentRoom(
          actor.roomId,
          proposal.targetRoomId,
          state.servicePassageUnlocked,
        )
      ) {
        return {
          isLegal: false,
          reason: `${proposal.targetRoomId} is not adjacent to ${actor.roomId}.`,
        };
      }
      if (
        state.rooms.find((room) => room.roomId === proposal.targetRoomId)
          ?.doorState !== "open"
      ) {
        return {
          isLegal: false,
          reason: `${proposal.targetRoomId} is not currently accessible.`,
        };
      }
      return { isLegal: true };
    case "start-task":
    case "continue-task": {
      if (state.phaseId !== "roam") {
        return {
          isLegal: false,
          reason: "Task actions are only legal during roam.",
        };
      }
      const task = state.tasks.find(
        (candidate) => candidate.taskId === proposal.taskId,
      );
      if (!task || actor.roomId !== task.roomId) {
        return { isLegal: false, reason: "Actor must be in the task room." };
      }
      if (task.status === "completed" || task.status === "blocked") {
        return {
          isLegal: false,
          reason: `Task ${task.taskId} is not currently actionable.`,
        };
      }
      const maxAssignees = task.kind === "two-person" ? 2 : 1;
      if (
        !task.assignedPlayerIds.includes(actor.id) &&
        task.assignedPlayerIds.length >= maxAssignees
      ) {
        return {
          isLegal: false,
          reason: `Task ${task.taskId} already has maximum assignees.`,
        };
      }
      return { isLegal: true };
    }
    case "comfort":
    case "reassure":
    case "press":
    case "promise":
    case "apologize":
    case "confide":
      return state.phaseId === "meeting" &&
        targetPlayerAlive(proposal.targetPlayerId)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: `${proposal.actionId} requires a live target during meeting.`,
          };
    case "report-body": {
      if (state.phaseId !== "roam" || actor.roomId === null) {
        return {
          isLegal: false,
          reason: "Bodies can only be reported during roam.",
        };
      }
      const bodyRoom = state.bodyLocations[proposal.discoveredPlayerId];
      if (
        bodyRoom !== actor.roomId ||
        state.reportedBodyIds.includes(proposal.discoveredPlayerId)
      ) {
        return {
          isLegal: false,
          reason: `No unreported body for ${proposal.discoveredPlayerId} is in ${actor.roomId}.`,
        };
      }
      return { isLegal: true };
    }
    case "call-meeting":
      return state.phaseId === "roam"
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: "Meetings may only be called during roam.",
          };
    case "eliminate": {
      if (
        state.phaseId !== "roam" ||
        actor.role !== "shadow" ||
        actor.roomId === null
      ) {
        return {
          isLegal: false,
          reason: "Elimination requires a shadow actor during roam.",
        };
      }
      if (
        proposal.targetPlayerId === actor.id ||
        !targetPlayerAlive(proposal.targetPlayerId)
      ) {
        return {
          isLegal: false,
          reason: "Elimination target must be another live player.",
        };
      }
      if (findPlayer(state, proposal.targetPlayerId).roomId !== actor.roomId) {
        return {
          isLegal: false,
          reason: "Elimination target must share the room.",
        };
      }
      const roomIsBlackout =
        state.rooms.find((room) => room.roomId === actor.roomId)?.lightLevel ===
        "blackout";
      if (
        !roomIsBlackout &&
        state.players.some(
          (player) =>
            player.status === "alive" &&
            player.roomId === actor.roomId &&
            player.id !== actor.id &&
            player.id !== proposal.targetPlayerId,
        )
      ) {
        return {
          isLegal: false,
          reason:
            "Elimination requires privacy. Another live witness is present.",
        };
      }
      return { isLegal: true };
    }
    case "trigger-blackout":
      if (state.phaseId !== "roam" || actor.role !== "shadow") {
        return {
          isLegal: false,
          reason: "Only shadows may trigger a blackout during roam.",
        };
      }

      if (
        state.blackoutUntilTick !== null &&
        state.tick < state.blackoutUntilTick
      ) {
        return {
          isLegal: false,
          reason: "Blackout is already active.",
        };
      }

      return { isLegal: true };
    case "jam-door":
    case "loop-cameras":
    case "plant-false-clue":
    case "seal-room":
      if (proposal.actionId === "seal-room") {
        return state.phaseId === "roam" &&
          actor.role === "steward" &&
          isKnownRoomId(proposal.targetRoomId)
          ? { isLegal: true }
          : {
              isLegal: false,
              reason: "Only the steward may seal rooms during roam.",
            };
      }
      return state.phaseId === "roam" &&
        actor.role === "shadow" &&
        isKnownRoomId(proposal.targetRoomId)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: `Only shadows may ${proposal.actionId} during roam.`,
          };
    case "forge-ledger-entry":
    case "mimic-task-audio":
      return state.phaseId === "roam" &&
        actor.role === "shadow" &&
        isKnownTaskId(proposal.taskId)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: `Only shadows may ${proposal.actionId} during roam.`,
          };
    case "delay-two-person-task":
      return state.phaseId === "roam" &&
        actor.role === "shadow" &&
        isKnownTaskId(proposal.taskId) &&
        isTwoPersonTask(proposal.taskId)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason:
              "Only shadows may delay active two-person tasks during roam.",
          };
    case "dust-room":
    case "recover-clue":
      return state.phaseId === "report" && actor.role === "investigator"
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: `Only the investigator may ${proposal.actionId} during report.`,
          };
    case "compare-clue-fragments":
    case "ask-forensic-question":
      return state.phaseId === "meeting" && actor.role === "investigator"
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: `Only the investigator may ${proposal.actionId} during meeting.`,
          };
    case "escort-player":
      return state.phaseId === "roam" &&
        actor.role === "steward" &&
        targetPlayerAlive(proposal.targetPlayerId)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: "Only the steward may escort a live player during roam.",
          };
    case "unlock-service-passage":
      return state.phaseId === "roam" &&
        actor.role === "steward" &&
        !state.servicePassageUnlocked
        ? { isLegal: true }
        : {
            isLegal: false,
            reason:
              "Service passage can only be unlocked once by the steward during roam.",
          };
    case "vote-player":
      if (state.phaseId !== "vote" || Object.hasOwn(state.votes, actor.id)) {
        return {
          isLegal: false,
          reason: "Vote is only legal once per player during vote phase.",
        };
      }
      return targetPlayerAlive(proposal.targetPlayerId) &&
        proposal.targetPlayerId !== actor.id
        ? { isLegal: true }
        : {
            isLegal: false,
            reason: "Vote target must be another live player.",
          };
    case "skip-vote":
      return state.phaseId === "vote" && !Object.hasOwn(state.votes, actor.id)
        ? { isLegal: true }
        : {
            isLegal: false,
            reason:
              "Skip vote is only legal once per player during vote phase.",
          };
  }
};

export const dispatchAction = (
  state: EngineState,
  proposal: AgentActionProposal,
): EngineTransitionResult => {
  const legality = validateAction(state, proposal);

  if (!legality.isLegal) {
    throw new Error(legality.reason);
  }

  const initialEvents: EngineEvent[] = [
    makeEvent(state, 0, {
      type: "action-recorded",
      tick: state.tick,
      proposal,
    }),
  ];

  if (proposal.actionId === "report-body") {
    initialEvents.push(
      makeEvent(state, 1, {
        type: "phase-changed",
        tick: state.tick,
        fromPhaseId: "roam",
        toPhaseId: "report",
        reason: "report",
      }),
    );
  }

  if (proposal.actionId === "call-meeting") {
    initialEvents.push(
      makeEvent(state, initialEvents.length, {
        type: "phase-changed",
        tick: state.tick,
        fromPhaseId: "roam",
        toPhaseId: "meeting",
        reason: "meeting",
      }),
    );
  }

  let nextState = applyEvents(state, initialEvents);
  const allEvents = [...initialEvents];

  if (
    nextState.phaseId === "vote" &&
    (proposal.actionId === "vote-player" ||
      proposal.actionId === "skip-vote") &&
    areAllLivingPlayersVoted(nextState)
  ) {
    const voteEvents = resolveVoteEvents(nextState);
    nextState = applyEvents(nextState, voteEvents);
    allEvents.push(...voteEvents);
  }

  const winnerEvents = finalizeWinnerEvents(nextState);

  if (winnerEvents.length > 0) {
    nextState = applyEvents(nextState, winnerEvents);
    allEvents.push(...winnerEvents);
  }

  return {
    state: nextState,
    events: allEvents,
  };
};

export const advanceServerTick = (
  state: EngineState,
  steps = 1,
): EngineTransitionResult => {
  let nextState = state;
  const allEvents: EngineEvent[] = [];

  for (let index = 0; index < steps; index += 1) {
    const tickEvents = [
      makeEvent(nextState, 0, {
        type: "tick-advanced",
        tick: nextState.tick,
        nextTick: nextState.tick + 1,
      }),
    ] as EngineEvent[];

    nextState = applyEvents(nextState, tickEvents);
    allEvents.push(...tickEvents);

    const autoEvents = createAutoTransitionEvents(nextState);

    if (autoEvents.length > 0) {
      nextState = applyEvents(nextState, autoEvents);
      allEvents.push(...autoEvents);
    }

    const winnerEvents = finalizeWinnerEvents(nextState);

    if (winnerEvents.length > 0) {
      nextState = applyEvents(nextState, winnerEvents);
      allEvents.push(...winnerEvents);
    }

    if (nextState.phaseId === "resolution" && nextState.winner) {
      break;
    }
  }

  return {
    state: nextState,
    events: allEvents,
  };
};

export const buildReplayLog = (state: EngineState): EngineReplayLog => ({
  replayId: makeReplayId(state.config.matchId, state.seed),
  matchId: state.config.matchId,
  seed: state.seed,
  config: state.config,
  events: structuredClone(state.eventLog),
  frames: structuredClone(state.replayFrames),
});

export const getDefaultMatchConfig = createDefaultMatchConfig;

export const getWinnerReasonLabel = (reason: EngineWinReason) => {
  switch (reason) {
    case "all-shadows-exiled":
      return "All shadows exiled";
    case "shadow-parity":
      return "Shadow parity";
    case "tasks-completed":
      return "Tasks completed";
    case "hard-cap":
      return "Hard cap reached";
  }
};
