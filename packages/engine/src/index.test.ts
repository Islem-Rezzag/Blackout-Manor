import { readFileSync } from "node:fs";
import type {
  AgentActionProposal,
  MatchConfig,
  PlayerId,
} from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import {
  advanceServerTick,
  bootstrapMatch,
  buildReplayLog,
  dispatchAction,
  type EngineBootstrapPlayer,
  type EngineState,
  getDefaultMatchConfig,
  validateAction,
} from "./index";

const players = Array.from({ length: 10 }, (_, index) => ({
  id: `agent-${index + 1}` as PlayerId,
  displayName: `Agent ${index + 1}`,
})) satisfies EngineBootstrapPlayer[];

const createConfig = (seed: number): MatchConfig => ({
  ...getDefaultMatchConfig(`match-${seed}`, seed),
  speedProfileId: "headless-regression",
  timings: {
    castIntroSeconds: 1,
    roamRoundCount: { min: 1, max: 1 },
    roamRoundSeconds: 3,
    discussionSeconds: 2,
    voteSeconds: 2,
    hardCapSeconds: 20,
  },
});

const requireValue = <T>(value: T | undefined, label: string): T => {
  if (value === undefined) {
    throw new Error(`Missing ${label}.`);
  }

  return value;
};

const actionBase = (state: EngineState, actorId: PlayerId) => ({
  actorId,
  phaseId: state.phaseId,
  confidence: 0.8,
  emotionalIntent: "confident" as const,
});

const syncOccupants = (state: EngineState) => {
  for (const room of state.rooms) {
    room.occupantIds = state.players
      .filter(
        (player) => player.status === "alive" && player.roomId === room.roomId,
      )
      .map((player) => player.id);
  }
};

const advanceToPhase = (
  state: EngineState,
  targetPhase: EngineState["phaseId"],
  maxSteps = 50,
): EngineState => {
  let nextState = state;

  for (let step = 0; step < maxSteps; step += 1) {
    if (nextState.phaseId === targetPhase) {
      return nextState;
    }

    nextState = advanceServerTick(nextState, 1).state;
  }

  throw new Error(`Failed to reach ${targetPhase} within ${maxSteps} ticks.`);
};

const getShadowIds = (state: EngineState) =>
  state.players
    .filter((player) => player.role === "shadow")
    .map((player) => player.id);

const getHouseholdIds = (state: EngineState) =>
  state.players
    .filter((player) => player.team === "household")
    .map((player) => player.id);

const movePlayer = (
  state: EngineState,
  playerId: PlayerId,
  roomId: EngineState["rooms"][number]["roomId"] | null,
) => {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    throw new Error(`Missing player ${playerId}.`);
  }

  player.roomId = roomId;
};

const runDeterministicScenario = () => {
  let state = bootstrapMatch(createConfig(17), players).state;
  state = advanceToPhase(state, "roam");

  const shadowId = requireValue(getShadowIds(state)[0], "shadow");
  const householdIds = getHouseholdIds(state);
  const victimId = requireValue(householdIds[0], "victim");
  const reporterId = requireValue(householdIds[1], "reporter");
  const staged = structuredClone(state);

  movePlayer(staged, shadowId, "cellar");
  movePlayer(staged, victimId, "cellar");
  movePlayer(staged, reporterId, "library");
  syncOccupants(staged);
  state = staged;

  state = dispatchAction(state, {
    ...actionBase(state, shadowId),
    actionId: "eliminate",
    targetPlayerId: victimId,
  }).state;

  const reported = structuredClone(state);
  movePlayer(reported, reporterId, "cellar");
  syncOccupants(reported);
  state = reported;

  state = dispatchAction(state, {
    ...actionBase(state, reporterId),
    actionId: "report-body",
    discoveredPlayerId: victimId,
  }).state;

  state = advanceToPhase(state, "meeting");
  state = advanceToPhase(state, "vote");

  const livingPlayerIds = state.players
    .filter((player) => player.status === "alive")
    .map((player) => player.id);

  for (const playerId of livingPlayerIds) {
    state = dispatchAction(state, {
      ...actionBase(state, playerId),
      actionId: "skip-vote",
    }).state;
  }

  state = advanceToPhase(state, "roam");

  return buildReplayLog(state);
};

const summarizeReplay = (replay: ReturnType<typeof buildReplayLog>) => ({
  replayId: replay.replayId,
  matchId: replay.matchId,
  seed: replay.seed,
  eventTypes: replay.events.map((event) => event.type),
  roleAssignments: replay.events.find(
    (event) => event.type === "roles-assigned",
  )?.assignments,
  phaseTimeline: replay.frames.map((frame) => `${frame.tick}:${frame.phaseId}`),
  finalPlayers: replay.frames.at(-1)?.players.map((player) => ({
    id: player.id,
    role: player.role,
    status: player.status,
    roomId: player.roomId,
  })),
  finalWinner: replay.frames.at(-1)?.winner ?? null,
});

describe("engine", () => {
  it("produces the same replay for the same seed and action stream", () => {
    const firstReplay = runDeterministicScenario();
    const secondReplay = runDeterministicScenario();
    const fixture = JSON.parse(
      readFileSync(
        new URL("./tests/fixtures/deterministic-replay.json", import.meta.url),
        "utf8",
      ),
    );

    expect(secondReplay).toEqual(firstReplay);
    expect(summarizeReplay(firstReplay)).toEqual(fixture);
  });

  it("walks the full report path and returns to roam when nobody is exiled", () => {
    let state = bootstrapMatch(createConfig(23), players).state;

    expect(state.phaseId).toBe("intro");

    state = advanceToPhase(state, "roam");
    const shadowId = requireValue(getShadowIds(state)[0], "shadow");
    const householdIds = getHouseholdIds(state);
    const victimId = requireValue(householdIds[0], "victim");
    const reporterId = requireValue(householdIds[1], "reporter");
    const staged = structuredClone(state);

    movePlayer(staged, shadowId, "cellar");
    movePlayer(staged, victimId, "cellar");
    movePlayer(staged, reporterId, "library");
    syncOccupants(staged);
    state = staged;

    state = dispatchAction(state, {
      ...actionBase(state, shadowId),
      actionId: "eliminate",
      targetPlayerId: victimId,
    }).state;

    const reported = structuredClone(state);
    movePlayer(reported, reporterId, "cellar");
    syncOccupants(reported);
    state = reported;

    state = dispatchAction(state, {
      ...actionBase(state, reporterId),
      actionId: "report-body",
      discoveredPlayerId: victimId,
    }).state;

    expect(state.phaseId).toBe("report");

    state = advanceToPhase(state, "meeting");
    expect(state.phaseId).toBe("meeting");

    state = advanceToPhase(state, "vote");
    expect(state.phaseId).toBe("vote");

    for (const playerId of state.players
      .filter((player) => player.status === "alive")
      .map((player) => player.id)) {
      state = dispatchAction(state, {
        ...actionBase(state, playerId),
        actionId: "skip-vote",
      }).state;
    }

    expect(state.phaseId).toBe("reveal");

    state = advanceToPhase(state, "roam");
    expect(state.phaseId).toBe("roam");
    expect(state.winner).toBeNull();
  });

  it("declares a household win when the final shadow is exiled", () => {
    let state = bootstrapMatch(createConfig(31), players).state;
    state = advanceToPhase(state, "roam");

    const firstShadowId = requireValue(getShadowIds(state)[0], "first shadow");
    const secondShadowId = requireValue(
      getShadowIds(state)[1],
      "second shadow",
    );
    const staged = structuredClone(state);
    const firstShadow = staged.players.find(
      (player) => player.id === firstShadowId,
    );

    if (!firstShadow) {
      throw new Error("Missing first shadow.");
    }

    firstShadow.status = "exiled";
    firstShadow.roomId = null;
    syncOccupants(staged);

    state = staged;

    const callerId = requireValue(
      state.players.find((player) => player.team === "household")?.id,
      "caller",
    );
    state = dispatchAction(state, {
      ...actionBase(state, callerId),
      actionId: "call-meeting",
      reason: "We have enough evidence.",
    }).state;

    state = advanceToPhase(state, "vote");

    for (const playerId of state.players
      .filter((player) => player.status === "alive")
      .map((player) => player.id)) {
      const proposal: AgentActionProposal =
        playerId === secondShadowId
          ? {
              ...actionBase(state, playerId),
              actionId: "skip-vote",
            }
          : {
              ...actionBase(state, playerId),
              actionId: "vote-player",
              targetPlayerId: secondShadowId,
            };

      state = dispatchAction(state, proposal).state;
    }

    expect(state.phaseId).toBe("reveal");
    expect(state.winner).toEqual({
      team: "household",
      reason: "all-shadows-exiled",
      decidedAtTick: state.tick,
    });

    state = advanceToPhase(state, "resolution");
    expect(state.phaseId).toBe("resolution");
  });

  it("declares a shadow win on parity after an elimination", () => {
    let state = bootstrapMatch(createConfig(37), players).state;
    state = advanceToPhase(state, "roam");

    const shadowIds = getShadowIds(state);
    const staged = structuredClone(state);
    const householdIds = staged.players
      .filter((player) => player.team === "household")
      .map((player) => player.id);

    for (const playerId of householdIds.slice(0, 5)) {
      const player = staged.players.find(
        (candidate) => candidate.id === playerId,
      );

      if (player) {
        player.status = "exiled";
        player.roomId = null;
      }
    }

    syncOccupants(staged);
    state = staged;

    const remainingHouseholdId = state.players.find(
      (player) => player.team === "household" && player.status === "alive",
    )?.id;

    movePlayer(state, requireValue(shadowIds[0], "parity shadow"), "cellar");
    movePlayer(
      state,
      requireValue(remainingHouseholdId, "remaining household"),
      "cellar",
    );
    syncOccupants(state);

    state = dispatchAction(state, {
      ...actionBase(state, requireValue(shadowIds[0], "parity shadow")),
      actionId: "eliminate",
      targetPlayerId: requireValue(remainingHouseholdId, "remaining household"),
    }).state;

    expect(state.phaseId).toBe("resolution");
    expect(state.winner?.reason).toBe("shadow-parity");
    expect(state.winner?.team).toBe("shadow");
  });

  it("declares a household win when the final task completes", () => {
    let state = bootstrapMatch(createConfig(41), players).state;
    state = advanceToPhase(state, "roam");

    const staged = structuredClone(state);
    const workerId = requireValue(
      staged.players.find((player) => player.team === "household")?.id,
      "worker",
    );
    const finalTask = staged.tasks.find(
      (task) => task.taskId === "wind-grandfather-clock",
    ) as EngineState["tasks"][number];

    for (const task of staged.tasks) {
      if (task.taskId === finalTask.taskId) {
        task.status = "in-progress";
        task.progress = 0.5;
        task.assignedPlayerIds = [workerId];
        continue;
      }

      task.status = "completed";
      task.progress = 1;
      task.assignedPlayerIds = [];
    }

    const worker = staged.players.find((player) => player.id === workerId);

    if (!worker) {
      throw new Error("Missing worker.");
    }

    worker.roomId = "grand-hall";
    worker.activeTaskId = finalTask.taskId;
    syncOccupants(staged);
    state = staged;

    state = dispatchAction(state, {
      ...actionBase(state, workerId),
      actionId: "continue-task",
      taskId: finalTask.taskId,
    }).state;

    expect(state.phaseId).toBe("resolution");
    expect(state.winner?.reason).toBe("tasks-completed");
    expect(state.winner?.team).toBe("household");
  });

  it("declares a shadow win when the hard cap is reached", () => {
    const config = {
      ...createConfig(43),
      timings: {
        ...createConfig(43).timings,
        castIntroSeconds: 0,
        hardCapSeconds: 2,
      },
    } satisfies MatchConfig;

    let state = bootstrapMatch(config, players).state;
    state = advanceServerTick(state, 2).state;

    expect(state.phaseId).toBe("resolution");
    expect(state.winner?.reason).toBe("hard-cap");
    expect(state.winner?.team).toBe("shadow");
  });

  it("declares a household win on hard cap when stabilization progress is high enough", () => {
    const config = {
      ...createConfig(44),
      timings: {
        ...createConfig(44).timings,
        castIntroSeconds: 0,
        hardCapSeconds: 2,
      },
    } satisfies MatchConfig;

    let state = bootstrapMatch(config, players).state;
    const staged = structuredClone(state);

    for (const task of staged.tasks.slice(0, 6)) {
      task.status = "completed";
      task.progress = 1;
      task.assignedPlayerIds = [];
    }

    state = staged;
    state = advanceServerTick(state, 2).state;

    expect(state.phaseId).toBe("resolution");
    expect(state.winner?.reason).toBe("hard-cap");
    expect(state.winner?.team).toBe("household");
  });

  it("rejects illegal actions", () => {
    let state = bootstrapMatch(createConfig(47), players).state;
    state = advanceToPhase(state, "roam");

    const actorId = requireValue(state.players[0]?.id, "actor");
    const legality = validateAction(state, {
      ...actionBase(state, actorId),
      actionId: "move",
      targetRoomId: "cellar",
    });

    expect(legality).toEqual({
      isLegal: false,
      reason: "cellar is not adjacent to grand-hall.",
    });
  });

  it("rejects witnessed eliminations", () => {
    let state = bootstrapMatch(createConfig(53), players).state;
    state = advanceToPhase(state, "roam");

    const shadowId = requireValue(getShadowIds(state)[0], "shadow");
    const householdIds = getHouseholdIds(state);
    const victimId = requireValue(householdIds[0], "victim");
    const witnessId = requireValue(householdIds[1], "witness");
    const staged = structuredClone(state);

    movePlayer(staged, shadowId, "cellar");
    movePlayer(staged, victimId, "cellar");
    movePlayer(staged, witnessId, "cellar");
    syncOccupants(staged);
    state = staged;

    const legality = validateAction(state, {
      ...actionBase(state, shadowId),
      actionId: "eliminate",
      targetPlayerId: victimId,
    });

    expect(legality).toEqual({
      isLegal: false,
      reason: "Elimination requires privacy. Another live witness is present.",
    });
  });

  it("rejects blackout retriggers while a blackout is already active", () => {
    let state = bootstrapMatch(createConfig(59), players).state;
    state = advanceToPhase(state, "roam");

    const shadowId = requireValue(getShadowIds(state)[0], "shadow");

    state = dispatchAction(state, {
      ...actionBase(state, shadowId),
      actionId: "trigger-blackout",
    }).state;

    const legality = validateAction(state, {
      ...actionBase(state, shadowId),
      actionId: "trigger-blackout",
    });

    expect(legality).toEqual({
      isLegal: false,
      reason: "Blackout is already active.",
    });
  });
});
