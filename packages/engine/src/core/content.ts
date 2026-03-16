import {
  DEFAULT_ROOM_IDS,
  DEFAULT_TASK_IDS,
  DEFAULT_TASK_KIND_BY_ID,
  DEFAULT_TASK_ROOM_IDS,
  DEFAULT_TIMINGS,
  type MatchConfig,
  OFFICIAL_V1_CAST,
  type PlayerState,
  type RelationshipState,
  ROOM_IDS,
  type RoleId,
  type RoomId,
  type RoomState,
  TASK_IDS,
  type TaskId,
  type TaskState,
} from "@blackout-manor/shared";

import type { EngineBootstrapPlayer, EnginePhaseId } from "./types";

export const ROOM_GRAPH: Record<RoomId, RoomId[]> = {
  "grand-hall": ["library", "study", "ballroom", "kitchen"],
  library: ["grand-hall", "study", "surveillance-hall"],
  study: ["grand-hall", "library", "greenhouse"],
  kitchen: ["grand-hall", "ballroom", "cellar", "servants-corridor"],
  ballroom: ["grand-hall", "kitchen", "greenhouse"],
  greenhouse: ["ballroom", "study", "generator-room"],
  "generator-room": ["greenhouse", "surveillance-hall", "cellar"],
  "surveillance-hall": ["library", "generator-room"],
  cellar: ["kitchen", "generator-room", "servants-corridor"],
  "servants-corridor": ["kitchen", "cellar"],
};

export const NEUTRAL_RELATIONSHIP: RelationshipState = {
  trust: 0.5,
  warmth: 0.5,
  fear: 0,
  respect: 0.5,
  debt: 0,
  grievance: 0,
  suspectScore: 0.5,
  predictedSuspicionOfMe: 0.5,
};

export const createDefaultMatchConfig = (
  matchId: string,
  seed: number,
): MatchConfig => ({
  matchId,
  seed,
  speedProfileId: "showcase",
  playerCount: 10,
  officialPublicMode: true,
  modelPackId: "official/gpt-5.4-season-1",
  allowPrivateWhispers: true,
  roomIds: [...DEFAULT_ROOM_IDS],
  taskIds: [...DEFAULT_TASK_IDS],
  roleDistribution: { ...OFFICIAL_V1_CAST },
  timings: DEFAULT_TIMINGS.showcase,
});

export const createInitialPlayers = (
  players: EngineBootstrapPlayer[],
): PlayerState[] =>
  players.map((player) => {
    const relationships = Object.fromEntries(
      players
        .filter((candidate) => candidate.id !== player.id)
        .map((candidate) => [candidate.id, { ...NEUTRAL_RELATIONSHIP }]),
    );

    return {
      id: player.id,
      displayName: player.displayName,
      role: "household",
      team: "household",
      roomId: ROOM_IDS[0],
      status: "alive",
      connected: true,
      isBot: player.isBot ?? true,
      completedTaskIds: [],
      publicImage: {
        credibility: 0.5,
        suspiciousness: 0.5,
      },
      emotion: {
        pleasure: 0,
        arousal: 0,
        dominance: 0,
        label: "calm",
        intensity: 0.2,
        updatedAtTick: 0,
      },
      relationships,
      memories: [],
    };
  });

export const createInitialRooms = (config: MatchConfig): RoomState[] =>
  config.roomIds.map((roomId) => ({
    roomId,
    lightLevel: "lit",
    doorState: "open",
    occupantIds: [],
    taskIds: config.taskIds.filter(
      (taskId) => DEFAULT_TASK_ROOM_IDS[taskId] === roomId,
    ),
  }));

export const createInitialTasks = (config: MatchConfig): TaskState[] =>
  config.taskIds.map((taskId) => ({
    taskId,
    roomId: DEFAULT_TASK_ROOM_IDS[taskId],
    kind: DEFAULT_TASK_KIND_BY_ID[taskId],
    status: "available",
    assignedPlayerIds: [],
    progress: 0,
  }));

export const phaseDurationById = (
  config: MatchConfig,
  phaseId: EnginePhaseId,
): number | null => {
  switch (phaseId) {
    case "intro":
      return config.timings.castIntroSeconds;
    case "roam":
      return config.timings.roamRoundSeconds;
    case "report":
      return 5;
    case "meeting":
      return config.timings.discussionSeconds;
    case "vote":
      return config.timings.voteSeconds;
    case "reveal":
      return 5;
    case "resolution":
      return null;
  }
};

export const roleTeamFromRole = (role: RoleId) =>
  role === "shadow" ? "shadow" : "household";

export const getNeighboringRooms = (
  roomId: RoomId,
  servicePassageUnlocked: boolean,
): RoomId[] => {
  const neighbors = ROOM_GRAPH[roomId];

  if (!servicePassageUnlocked) {
    return neighbors;
  }

  if (roomId === "study") {
    return [...neighbors, "servants-corridor"];
  }

  if (roomId === "servants-corridor") {
    return [...neighbors, "study"];
  }

  return neighbors;
};

export const isAdjacentRoom = (
  fromRoomId: RoomId,
  toRoomId: RoomId,
  servicePassageUnlocked: boolean,
): boolean =>
  getNeighboringRooms(fromRoomId, servicePassageUnlocked).includes(toRoomId);

export const isTwoPersonTask = (taskId: TaskId) =>
  DEFAULT_TASK_KIND_BY_ID[taskId] === "two-person";

export const isKnownRoomId = (value: string): value is RoomId =>
  (ROOM_IDS as readonly string[]).includes(value);

export const isKnownTaskId = (value: string): value is TaskId =>
  (TASK_IDS as readonly string[]).includes(value);
