import { SEASON_01_PERSONA_CARDS } from "@blackout-manor/content";
import {
  advanceServerTick,
  bootstrapMatch,
  buildReplayLog,
  dispatchAction,
  type EngineBootstrapPlayer,
  type EngineState,
  getDefaultMatchConfig,
  getNeighboringRooms,
  shuffleDeterministically,
  validateAction,
} from "@blackout-manor/engine";
import {
  type AgentActionProposal,
  DEFAULT_TIMINGS,
  type MatchConfig,
  type PlayerId,
  type RoomId,
  type SpeedProfileId,
} from "@blackout-manor/shared";

import { createSavedReplayEnvelope } from "./serializer";
import type {
  BatchSimulationOptions,
  BatchSimulationResult,
  HeadlessSimulationOptions,
  HeadlessSimulationResult,
  RegressionSeedPack,
  SeedPackName,
  SimulationMode,
} from "./types";

type SimulationMemory = {
  meetingKey: string | null;
  reportKey: string | null;
  meetingActors: Set<PlayerId>;
  reportActors: Set<PlayerId>;
  promisedTargets: Map<PlayerId, PlayerId>;
  confidedTargets: Map<PlayerId, PlayerId>;
};

const SEED_PACKS: Record<SeedPackName, RegressionSeedPack> = {
  smoke: {
    name: "smoke",
    seeds: [7, 13, 17],
  },
  regression: {
    name: "regression",
    seeds: [23, 31, 37, 41, 47, 53],
  },
  balance: {
    name: "balance",
    seeds: [101, 131, 151, 181, 211, 241, 271, 307],
  },
};

const ROAM_ACTIONS_PER_TICK = 2;
const REPORT_ACTIONS_PER_TICK = 1;
const MEETING_ACTIONS_PER_TICK = 2;

const getProfileId = (mode: SimulationMode): SpeedProfileId => {
  if (mode === "showcase") {
    return "showcase";
  }

  if (mode === "fast") {
    return "fast-sim";
  }

  return "headless-regression";
};

const createSimulationConfig = (
  seed: number,
  matchId: string,
  mode: SimulationMode,
): MatchConfig => {
  const speedProfileId = getProfileId(mode);
  const timings =
    mode === "headless"
      ? {
          ...DEFAULT_TIMINGS["headless-regression"],
          roamRoundSeconds: 6,
          discussionSeconds: 3,
          voteSeconds: 2,
          hardCapSeconds: 24,
        }
      : {
          ...DEFAULT_TIMINGS[speedProfileId],
        };

  return {
    ...getDefaultMatchConfig(matchId, seed),
    speedProfileId,
    timings,
  };
};

const createSimulationPlayers = (seed: number): EngineBootstrapPlayer[] => {
  const personaOrder = shuffleDeterministically(
    SEASON_01_PERSONA_CARDS,
    seed,
  ).items;

  return personaOrder.slice(0, 10).map((persona, index) => ({
    id: `agent-${String(index + 1).padStart(2, "0")}`,
    displayName: persona.label,
    isBot: true,
  }));
};

const isAlive = (state: EngineState, playerId: PlayerId) =>
  state.players.some(
    (player) => player.id === playerId && player.status === "alive",
  );

const getLivingPlayers = (state: EngineState) =>
  state.players.filter((player) => player.status === "alive");

const getOpenNeighbors = (state: EngineState, roomId: RoomId) =>
  getNeighboringRooms(roomId, state.servicePassageUnlocked).filter(
    (neighborId) =>
      state.rooms.find((room) => room.roomId === neighborId)?.doorState ===
      "open",
  );

const getPlayerIndex = (state: EngineState, playerId: PlayerId) =>
  Math.max(
    0,
    state.players.findIndex((player) => player.id === playerId),
  );

const syncSimulationMemory = (state: EngineState, memory: SimulationMemory) => {
  const phaseKey = `${state.phaseId}:${state.phaseStartedAtTick}`;

  if (state.phaseId === "meeting" && memory.meetingKey !== phaseKey) {
    memory.meetingKey = phaseKey;
    memory.meetingActors = new Set<PlayerId>();
    memory.promisedTargets = new Map<PlayerId, PlayerId>();
    memory.confidedTargets = new Map<PlayerId, PlayerId>();
  }

  if (state.phaseId === "report" && memory.reportKey !== phaseKey) {
    memory.reportKey = phaseKey;
    memory.reportActors = new Set<PlayerId>();
  }

  if (state.phaseId === "roam") {
    memory.meetingKey = null;
    memory.reportKey = null;
    memory.meetingActors = new Set<PlayerId>();
    memory.reportActors = new Set<PlayerId>();
    memory.promisedTargets = new Map<PlayerId, PlayerId>();
    memory.confidedTargets = new Map<PlayerId, PlayerId>();
  }
};

const buildActionBase = (state: EngineState, actorId: PlayerId) => ({
  actorId,
  phaseId: state.phaseId,
  confidence: 0.67,
  emotionalIntent: "confident" as const,
});

const isActionLegal = (state: EngineState, proposal: AgentActionProposal) =>
  validateAction(state, proposal).isLegal;

const chooseReportAction = (
  state: EngineState,
  actorId: PlayerId,
  memory: SimulationMemory,
): AgentActionProposal | null => {
  if (memory.reportActors.has(actorId)) {
    return null;
  }

  const actor = state.players.find((player) => player.id === actorId);

  if (!actor || actor.role !== "investigator" || actor.roomId === null) {
    return null;
  }

  const proposals: AgentActionProposal[] = [
    {
      ...buildActionBase(state, actorId),
      actionId: "recover-clue",
      targetRoomId: actor.roomId,
    },
    {
      ...buildActionBase(state, actorId),
      actionId: "dust-room",
      targetRoomId: actor.roomId,
    },
  ];

  const proposal = proposals.find((candidate) =>
    isActionLegal(state, candidate),
  );

  if (!proposal) {
    return null;
  }

  memory.reportActors.add(actorId);
  return proposal;
};

const chooseMeetingAction = (
  state: EngineState,
  actorId: PlayerId,
  memory: SimulationMemory,
): AgentActionProposal | null => {
  if (memory.meetingActors.has(actorId)) {
    return null;
  }

  const actor = state.players.find((player) => player.id === actorId);

  if (!actor) {
    return null;
  }

  const targets = getLivingPlayers(state)
    .filter((player) => player.id !== actorId)
    .map((player) => player.id);

  if (targets.length === 0) {
    return null;
  }

  const actorIndex = getPlayerIndex(state, actorId);
  const targetPlayerId =
    targets[(actorIndex + state.currentRound) % targets.length] ?? targets[0];

  if (!targetPlayerId) {
    return null;
  }

  const proposals: AgentActionProposal[] = [];

  if (actorIndex % 2 === 0) {
    proposals.push({
      ...buildActionBase(state, actorId),
      actionId: "promise",
      targetPlayerId,
      promiseText: "I will not vote against you this round.",
    });
  }

  if (actorIndex % 3 === 0) {
    proposals.push({
      ...buildActionBase(state, actorId),
      actionId: "confide",
      targetPlayerId,
    });
  }

  proposals.push({
    ...buildActionBase(state, actorId),
    actionId: "reassure",
    targetPlayerId,
  });

  const proposal = proposals.find((candidate) =>
    isActionLegal(state, candidate),
  );

  if (!proposal) {
    return null;
  }

  memory.meetingActors.add(actorId);

  if (proposal.actionId === "promise") {
    memory.promisedTargets.set(actorId, proposal.targetPlayerId);
  }

  if (proposal.actionId === "confide") {
    memory.confidedTargets.set(actorId, proposal.targetPlayerId);
  }

  return proposal;
};

const findTaskForPlayer = (state: EngineState, actorId: PlayerId) => {
  const actor = state.players.find((player) => player.id === actorId);

  if (!actor || actor.roomId === null) {
    return null;
  }

  if (actor.activeTaskId) {
    const activeTask = state.tasks.find(
      (task) => task.taskId === actor.activeTaskId,
    );

    if (
      activeTask &&
      activeTask.roomId === actor.roomId &&
      activeTask.status !== "completed" &&
      activeTask.status !== "blocked"
    ) {
      return activeTask;
    }
  }

  return state.tasks.find(
    (task) =>
      task.roomId === actor.roomId &&
      !actor.completedTaskIds.includes(task.taskId) &&
      task.status !== "completed" &&
      task.status !== "blocked" &&
      (task.assignedPlayerIds.includes(actorId) ||
        task.assignedPlayerIds.length < (task.kind === "two-person" ? 2 : 1)),
  );
};

const chooseRoamAction = (
  state: EngineState,
  actorId: PlayerId,
): AgentActionProposal | null => {
  const actor = state.players.find((player) => player.id === actorId);

  if (!actor || actor.roomId === null) {
    return null;
  }

  const reportableBodyId = Object.entries(state.bodyLocations).find(
    ([playerId, roomId]) =>
      roomId === actor.roomId &&
      !state.reportedBodyIds.includes(playerId) &&
      isAlive(state, actorId),
  )?.[0] as PlayerId | undefined;

  if (reportableBodyId) {
    const proposal: AgentActionProposal = {
      ...buildActionBase(state, actorId),
      actionId: "report-body",
      discoveredPlayerId: reportableBodyId,
    };

    if (isActionLegal(state, proposal)) {
      return proposal;
    }
  }

  if (actor.role === "shadow") {
    const eliminationTarget = getLivingPlayers(state).find(
      (player) =>
        player.id !== actorId &&
        player.team === "household" &&
        player.roomId === actor.roomId &&
        !Object.hasOwn(state.bodyLocations, player.id),
    );

    if (eliminationTarget) {
      const proposal: AgentActionProposal = {
        ...buildActionBase(state, actorId),
        actionId: "eliminate",
        targetPlayerId: eliminationTarget.id,
      };

      if (isActionLegal(state, proposal)) {
        return proposal;
      }
    }

    const sabotageTaskId = state.tasks.find(
      (task) =>
        task.kind === "two-person" &&
        task.status !== "completed" &&
        task.status !== "blocked",
    )?.taskId;
    const sabotageActions: AgentActionProposal[] = [
      {
        ...buildActionBase(state, actorId),
        actionId: "trigger-blackout",
      },
      {
        ...buildActionBase(state, actorId),
        actionId: "jam-door",
        targetRoomId: actor.roomId,
      },
      ...(sabotageTaskId
        ? [
            {
              ...buildActionBase(state, actorId),
              actionId: "delay-two-person-task" as const,
              taskId: sabotageTaskId,
            },
          ]
        : []),
    ];
    const sabotageAction = sabotageActions.find((proposal) =>
      isActionLegal(state, proposal),
    );

    if (
      sabotageAction &&
      state.tick % 3 === getPlayerIndex(state, actorId) % 3
    ) {
      return sabotageAction;
    }
  }

  if (
    actor.role === "steward" &&
    !state.servicePassageUnlocked &&
    state.currentRound >= 2
  ) {
    const proposal: AgentActionProposal = {
      ...buildActionBase(state, actorId),
      actionId: "unlock-service-passage",
    };

    if (isActionLegal(state, proposal)) {
      return proposal;
    }
  }

  const task = findTaskForPlayer(state, actorId);

  if (task) {
    const actionId =
      task.assignedPlayerIds.includes(actorId) || task.progress > 0
        ? "continue-task"
        : "start-task";
    const proposal: AgentActionProposal =
      actionId === "continue-task"
        ? {
            ...buildActionBase(state, actorId),
            actionId,
            taskId: task.taskId,
          }
        : {
            ...buildActionBase(state, actorId),
            actionId,
            taskId: task.taskId,
          };

    if (isActionLegal(state, proposal)) {
      return proposal;
    }
  }

  const neighbors = shuffleDeterministically(
    getOpenNeighbors(state, actor.roomId),
    state.seed + state.tick + getPlayerIndex(state, actorId) * 17,
  ).items;
  const targetRoomId = neighbors[0];

  if (!targetRoomId) {
    return null;
  }

  const moveProposal: AgentActionProposal = {
    ...buildActionBase(state, actorId),
    actionId: "move",
    targetRoomId,
  };

  return isActionLegal(state, moveProposal) ? moveProposal : null;
};

const chooseVoteAction = (
  state: EngineState,
  actorId: PlayerId,
  memory: SimulationMemory,
): AgentActionProposal | null => {
  if (Object.hasOwn(state.votes, actorId)) {
    return null;
  }

  const actor = state.players.find((player) => player.id === actorId);

  if (!actor) {
    return null;
  }

  const candidates = getLivingPlayers(state)
    .filter((player) => player.id !== actorId)
    .map((player) => player.id);

  if (candidates.length === 0) {
    return {
      ...buildActionBase(state, actorId),
      actionId: "skip-vote",
    };
  }

  const actorIndex = getPlayerIndex(state, actorId);
  const promisedTarget = memory.promisedTargets.get(actorId);
  const confidedTarget = memory.confidedTargets.get(actorId);
  const aliveShadows = getLivingPlayers(state).filter(
    (player) => player.role === "shadow",
  );
  const aliveHousehold = getLivingPlayers(state).filter(
    (player) => player.role !== "shadow",
  );

  let targetPlayerId: PlayerId | null = null;

  if (
    promisedTarget &&
    isAlive(state, promisedTarget) &&
    actorIndex % 2 === 0
  ) {
    targetPlayerId = promisedTarget;
  } else if (
    confidedTarget &&
    isAlive(state, confidedTarget) &&
    actorIndex % 3 === 0
  ) {
    targetPlayerId = confidedTarget;
  } else if (
    actor.role !== "shadow" &&
    aliveHousehold.length - aliveShadows.length <= 1 &&
    aliveShadows.length > 0
  ) {
    targetPlayerId = aliveShadows[0]?.id ?? null;
  } else if (actor.role === "shadow") {
    targetPlayerId =
      getLivingPlayers(state).find((player) => player.role !== "shadow")?.id ??
      null;
  } else {
    const orderedCandidates = shuffleDeterministically(
      candidates,
      state.seed + state.tick + actorIndex * 23 + state.currentRound,
    ).items;
    targetPlayerId = orderedCandidates[0] ?? null;
  }

  if (!targetPlayerId) {
    return {
      ...buildActionBase(state, actorId),
      actionId: "skip-vote",
    };
  }

  const voteProposal: AgentActionProposal = {
    ...buildActionBase(state, actorId),
    actionId: "vote-player",
    targetPlayerId,
  };

  if (isActionLegal(state, voteProposal)) {
    return voteProposal;
  }

  return {
    ...buildActionBase(state, actorId),
    actionId: "skip-vote",
  };
};

const getActorOrderForTick = (state: EngineState) =>
  shuffleDeterministically(
    getLivingPlayers(state).map((player) => player.id),
    state.seed + state.tick + state.currentRound * 97,
  ).items;

export const getRegressionSeedPack = (name: SeedPackName) => SEED_PACKS[name];

export const runHeadlessSimulation = (
  options: HeadlessSimulationOptions,
): HeadlessSimulationResult => {
  const matchId = options.matchId ?? `headless-${options.seed}`;
  const mode = options.mode ?? "headless";
  const config = createSimulationConfig(options.seed, matchId, mode);
  const players = createSimulationPlayers(options.seed);
  let state = bootstrapMatch(config, players).state;
  const memory: SimulationMemory = {
    meetingKey: null,
    reportKey: null,
    meetingActors: new Set<PlayerId>(),
    reportActors: new Set<PlayerId>(),
    promisedTargets: new Map<PlayerId, PlayerId>(),
    confidedTargets: new Map<PlayerId, PlayerId>(),
  };

  const maxTicks = options.maxTicks ?? config.timings.hardCapSeconds + 15;

  for (
    let step = 0;
    step < maxTicks && state.phaseId !== "resolution";
    step += 1
  ) {
    syncSimulationMemory(state, memory);

    if (state.phaseId === "roam") {
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        if (state.phaseId !== "roam" || actionsTaken >= ROAM_ACTIONS_PER_TICK) {
          break;
        }

        const proposal = chooseRoamAction(state, actorId);

        if (!proposal) {
          continue;
        }

        state = dispatchAction(state, proposal).state;
        syncSimulationMemory(state, memory);
        actionsTaken += 1;
      }
    }

    if (state.phaseId === "report") {
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        if (
          state.phaseId !== "report" ||
          actionsTaken >= REPORT_ACTIONS_PER_TICK
        ) {
          break;
        }

        const proposal = chooseReportAction(state, actorId, memory);

        if (!proposal) {
          continue;
        }

        state = dispatchAction(state, proposal).state;
        syncSimulationMemory(state, memory);
        actionsTaken += 1;
      }
    }

    if (state.phaseId === "meeting") {
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        if (
          state.phaseId !== "meeting" ||
          actionsTaken >= MEETING_ACTIONS_PER_TICK
        ) {
          break;
        }

        const proposal = chooseMeetingAction(state, actorId, memory);

        if (!proposal) {
          continue;
        }

        state = dispatchAction(state, proposal).state;
        syncSimulationMemory(state, memory);
        actionsTaken += 1;
      }
    }

    if (state.phaseId === "vote") {
      for (const actorId of getActorOrderForTick(state)) {
        if (state.phaseId !== "vote") {
          break;
        }

        const proposal = chooseVoteAction(state, actorId, memory);

        if (!proposal) {
          continue;
        }

        state = dispatchAction(state, proposal).state;
        syncSimulationMemory(state, memory);
      }
    }

    if (state.phaseId === "resolution") {
      break;
    }

    state = advanceServerTick(state, 1).state;
  }

  const replay = buildReplayLog(state);
  const envelope = createSavedReplayEnvelope(replay, {
    ...(options.nowIso ? { exportedAt: options.nowIso } : {}),
  });

  return {
    replay,
    envelope,
    highlights: envelope.highlights,
    summary: envelope.summary,
  };
};

export const runBatchSimulations = (
  options: BatchSimulationOptions,
): BatchSimulationResult => {
  const runs = options.seeds.map((seed) =>
    runHeadlessSimulation({
      seed,
      matchId: `${options.matchPrefix ?? "batch"}-${seed}`,
      ...(options.nowIso ? { nowIso: options.nowIso } : {}),
    }),
  );
  const winCounts = runs.reduce<Record<string, number>>((accumulator, run) => {
    const key = run.summary.winner?.team ?? "unresolved";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    runs,
    seedCount: runs.length,
    winCounts,
  };
};

export const runRegressionSeedPack = (name: SeedPackName, nowIso?: string) =>
  runBatchSimulations({
    seeds: SEED_PACKS[name].seeds,
    matchPrefix: name,
    ...(nowIso ? { nowIso } : {}),
  });
