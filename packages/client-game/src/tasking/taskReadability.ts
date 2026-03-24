import type {
  MatchEvent,
  MatchSnapshot,
  PlayerId,
  RoomId,
  TaskId,
  TaskKindId,
  TaskState,
  TaskStatusId,
} from "@blackout-manor/shared";

import { getRoomRenderData } from "../tiled/manorLayout";

export type TaskInteractionPoint = {
  x: number;
  y: number;
};

export type TaskReadabilityTone =
  | "available"
  | "busy"
  | "blocked"
  | "completed"
  | "attention";

export type TaskInteractionGeometry = {
  taskId: TaskId;
  roomId: RoomId;
  shortLabel: string;
  badgeText: string;
  propLabel: string;
  soundHookId: string;
  cueColor: number;
  propPoint: TaskInteractionPoint;
  hotspotPoint: TaskInteractionPoint;
  approachPoint: TaskInteractionPoint;
  lookAtPoint: TaskInteractionPoint;
};

export type TaskReadabilityNode = TaskInteractionGeometry & {
  kind: TaskKindId;
  status: TaskStatusId;
  progress: number;
  assignedPlayerIds: readonly PlayerId[];
  statusText: string;
  active: boolean;
  recent: boolean;
  recentEventId: string | null;
  recentEventType:
    | "task-progressed"
    | "task-completed"
    | "sabotage-triggered"
    | null;
  tone: TaskReadabilityTone;
};

export type TaskPlayerCue = {
  eventId: string;
  taskId: TaskId;
  badgeText: string;
  lookAt: TaskInteractionPoint;
  emphasis: number;
  tone: TaskReadabilityTone;
};

export type TaskReadabilityPresentation = {
  nodes: ReadonlyMap<TaskId, TaskReadabilityNode>;
  rooms: ReadonlyMap<RoomId, readonly TaskReadabilityNode[]>;
  playerCues: ReadonlyMap<PlayerId, TaskPlayerCue>;
};

type RoomPointBlueprint = {
  x: number;
  y: number;
};

type TaskBlueprint = {
  roomId: RoomId;
  shortLabel: string;
  badgeText: string;
  propLabel: string;
  soundHookId: string;
  cueColor: number;
  propPoint: RoomPointBlueprint;
  hotspotPoint: RoomPointBlueprint;
  approachPoint: RoomPointBlueprint;
};

const pointInRoom = (
  roomId: RoomId,
  blueprint: RoomPointBlueprint,
): TaskInteractionPoint => {
  const room = getRoomRenderData(roomId);

  return {
    x: room.bounds.x + room.width * blueprint.x,
    y:
      room.bounds.y +
      room.height * blueprint.y +
      room.framing.floorInsetY * 0.42,
  };
};

const TASK_BLUEPRINTS = {
  "reset-breaker-lattice": {
    roomId: "generator-room",
    shortLabel: "BREAKER",
    badgeText: "REPAIR",
    propLabel: "breaker lattice",
    soundHookId: "generator-breaker",
    cueColor: 0x8fe7b6,
    propPoint: { x: 0.79, y: 0.42 },
    hotspotPoint: { x: 0.66, y: 0.62 },
    approachPoint: { x: 0.52, y: 0.72 },
  },
  "file-guest-ledger": {
    roomId: "study",
    shortLabel: "LEDGER",
    badgeText: "LEDGER",
    propLabel: "guest ledger desk",
    soundHookId: "study-ledger",
    cueColor: 0x9fc6a1,
    propPoint: { x: 0.63, y: 0.55 },
    hotspotPoint: { x: 0.54, y: 0.7 },
    approachPoint: { x: 0.44, y: 0.78 },
  },
  "rewind-corridor-film": {
    roomId: "surveillance-hall",
    shortLabel: "FILM",
    badgeText: "FILM",
    propLabel: "corridor film console",
    soundHookId: "surveillance-film",
    cueColor: 0x86a8ff,
    propPoint: { x: 0.5, y: 0.47 },
    hotspotPoint: { x: 0.5, y: 0.68 },
    approachPoint: { x: 0.38, y: 0.76 },
  },
  "rebalance-greenhouse-valves": {
    roomId: "greenhouse",
    shortLabel: "VALVES",
    badgeText: "VALVES",
    propLabel: "irrigation valve bank",
    soundHookId: "greenhouse-valve",
    cueColor: 0x91d5a3,
    propPoint: { x: 0.76, y: 0.5 },
    hotspotPoint: { x: 0.66, y: 0.67 },
    approachPoint: { x: 0.54, y: 0.77 },
  },
  "sort-masque-inventory": {
    roomId: "ballroom",
    shortLabel: "MASKS",
    badgeText: "SORT",
    propLabel: "masque inventory stage",
    soundHookId: "ballroom-mask",
    cueColor: 0xe6a862,
    propPoint: { x: 0.72, y: 0.33 },
    hotspotPoint: { x: 0.61, y: 0.53 },
    approachPoint: { x: 0.49, y: 0.63 },
  },
  "prepare-silver-tea-service": {
    roomId: "kitchen",
    shortLabel: "SERVICE",
    badgeText: "SERVICE",
    propLabel: "silver service island",
    soundHookId: "kitchen-service",
    cueColor: 0xe2b482,
    propPoint: { x: 0.58, y: 0.64 },
    hotspotPoint: { x: 0.5, y: 0.74 },
    approachPoint: { x: 0.4, y: 0.81 },
  },
  "tune-police-band-radio": {
    roomId: "library",
    shortLabel: "RADIO",
    badgeText: "RADIO",
    propLabel: "police-band desk radio",
    soundHookId: "library-radio",
    cueColor: 0xd7b47b,
    propPoint: { x: 0.73, y: 0.56 },
    hotspotPoint: { x: 0.65, y: 0.68 },
    approachPoint: { x: 0.55, y: 0.76 },
  },
  "wind-grandfather-clock": {
    roomId: "grand-hall",
    shortLabel: "CLOCK",
    badgeText: "CLOCK",
    propLabel: "grandfather clock",
    soundHookId: "hall-clock",
    cueColor: 0xd1b07a,
    propPoint: { x: 0.79, y: 0.28 },
    hotspotPoint: { x: 0.73, y: 0.45 },
    approachPoint: { x: 0.62, y: 0.56 },
  },
  "restore-boiler-pressure": {
    roomId: "cellar",
    shortLabel: "BOILER",
    badgeText: "PRESSURE",
    propLabel: "boiler valve cluster",
    soundHookId: "cellar-boiler",
    cueColor: 0xd39a72,
    propPoint: { x: 0.62, y: 0.49 },
    hotspotPoint: { x: 0.53, y: 0.67 },
    approachPoint: { x: 0.42, y: 0.77 },
  },
  "carry-coal-to-the-boiler": {
    roomId: "cellar",
    shortLabel: "COAL",
    badgeText: "COAL",
    propLabel: "coal feed lane",
    soundHookId: "cellar-coal",
    cueColor: 0xb78b69,
    propPoint: { x: 0.31, y: 0.65 },
    hotspotPoint: { x: 0.39, y: 0.79 },
    approachPoint: { x: 0.5, y: 0.83 },
  },
  "move-portrait-crate-into-storage": {
    roomId: "servants-corridor",
    shortLabel: "CRATE",
    badgeText: "CRATE",
    propLabel: "portrait crate storage",
    soundHookId: "corridor-crate",
    cueColor: 0xd8c8a2,
    propPoint: { x: 0.68, y: 0.46 },
    hotspotPoint: { x: 0.55, y: 0.64 },
    approachPoint: { x: 0.42, y: 0.69 },
  },
  "synchronize-organ-pipes": {
    roomId: "ballroom",
    shortLabel: "ORGAN",
    badgeText: "ORGAN",
    propLabel: "organ and piano rig",
    soundHookId: "ballroom-organ",
    cueColor: 0xf0bc7b,
    propPoint: { x: 0.23, y: 0.47 },
    hotspotPoint: { x: 0.34, y: 0.61 },
    approachPoint: { x: 0.46, y: 0.68 },
  },
  "balance-hot-water-pressure": {
    roomId: "kitchen",
    shortLabel: "PRESSURE",
    badgeText: "PIPES",
    propLabel: "hot-water pressure wall",
    soundHookId: "kitchen-pressure",
    cueColor: 0xf0c795,
    propPoint: { x: 0.24, y: 0.39 },
    hotspotPoint: { x: 0.31, y: 0.56 },
    approachPoint: { x: 0.42, y: 0.68 },
  },
} as const satisfies Record<TaskId, TaskBlueprint>;

const getRecentTaskEvent = (
  recentEvents: readonly MatchEvent[],
  taskId: TaskId,
) => {
  for (let index = recentEvents.length - 1; index >= 0; index -= 1) {
    const event = recentEvents[index];

    if (!event) {
      continue;
    }

    if (event.eventId === "task-progressed" && event.taskId === taskId) {
      return event;
    }

    if (event.eventId === "task-completed" && event.taskId === taskId) {
      return event;
    }

    if (event.eventId === "sabotage-triggered" && event.taskId === taskId) {
      return event;
    }
  }

  return null;
};

const resolveStatusText = (
  task: TaskState,
  recentEvent: ReturnType<typeof getRecentTaskEvent>,
) => {
  if (recentEvent?.eventId === "task-completed") {
    return "just completed";
  }

  if (recentEvent?.eventId === "sabotage-triggered") {
    return "public disruption";
  }

  if (task.status === "completed") {
    return "completed";
  }

  if (task.status === "blocked") {
    return "blocked";
  }

  if (task.status === "in-progress") {
    const progressLabel = `${Math.round(task.progress * 100)}%`;
    return task.assignedPlayerIds.length > 1
      ? `${task.assignedPlayerIds.length} occupied | ${progressLabel}`
      : `occupied | ${progressLabel}`;
  }

  return task.kind === "two-person" ? "pair task ready" : "ready";
};

const resolveTone = (
  task: TaskState,
  recentEvent: ReturnType<typeof getRecentTaskEvent>,
): TaskReadabilityTone => {
  if (recentEvent?.eventId === "sabotage-triggered") {
    return "attention";
  }

  if (
    task.status === "completed" ||
    recentEvent?.eventId === "task-completed"
  ) {
    return "completed";
  }

  if (task.status === "blocked") {
    return "blocked";
  }

  if (
    task.status === "in-progress" ||
    recentEvent?.eventId === "task-progressed"
  ) {
    return "busy";
  }

  return "available";
};

const resolveGeometry = (taskId: TaskId): TaskInteractionGeometry => {
  const blueprint = TASK_BLUEPRINTS[taskId];

  return {
    taskId,
    roomId: blueprint.roomId,
    shortLabel: blueprint.shortLabel,
    badgeText: blueprint.badgeText,
    propLabel: blueprint.propLabel,
    soundHookId: blueprint.soundHookId,
    cueColor: blueprint.cueColor,
    propPoint: pointInRoom(blueprint.roomId, blueprint.propPoint),
    hotspotPoint: pointInRoom(blueprint.roomId, blueprint.hotspotPoint),
    approachPoint: pointInRoom(blueprint.roomId, blueprint.approachPoint),
    lookAtPoint: pointInRoom(blueprint.roomId, blueprint.propPoint),
  };
};

const formatPlayerCue = (
  node: TaskReadabilityNode,
  eventId: string,
  emphasis: number,
  badgeText = node.badgeText,
): TaskPlayerCue => ({
  eventId,
  taskId: node.taskId,
  badgeText,
  lookAt: node.lookAtPoint,
  emphasis,
  tone: node.tone,
});

export const getTaskInteractionGeometry = (taskId: TaskId) =>
  resolveGeometry(taskId);

export const TASK_INTERACTION_GEOMETRIES = Object.freeze(
  Object.keys(TASK_BLUEPRINTS).map((taskId) =>
    resolveGeometry(taskId as TaskId),
  ),
) as readonly TaskInteractionGeometry[];

export const buildTaskReadabilityPresentation = (
  snapshot: MatchSnapshot,
): TaskReadabilityPresentation => {
  const nodes = new Map<TaskId, TaskReadabilityNode>();
  const rooms = new Map<RoomId, TaskReadabilityNode[]>();
  const playerCues = new Map<PlayerId, TaskPlayerCue>();

  for (const task of snapshot.tasks) {
    const geometry = resolveGeometry(task.taskId);
    const recentEvent = getRecentTaskEvent(snapshot.recentEvents, task.taskId);
    const node: TaskReadabilityNode = {
      ...geometry,
      kind: task.kind,
      status: task.status,
      progress: recentEvent?.eventId === "task-completed" ? 1 : task.progress,
      assignedPlayerIds: task.assignedPlayerIds,
      statusText: resolveStatusText(task, recentEvent),
      active:
        task.status === "in-progress" ||
        task.status === "blocked" ||
        recentEvent !== null,
      recent: recentEvent !== null,
      recentEventId: recentEvent?.id ?? null,
      recentEventType: recentEvent?.eventId ?? null,
      tone: resolveTone(task, recentEvent),
    };

    nodes.set(task.taskId, node);
    const roomNodes = rooms.get(task.roomId) ?? [];
    roomNodes.push(node);
    rooms.set(task.roomId, roomNodes);
  }

  for (let index = snapshot.recentEvents.length - 1; index >= 0; index -= 1) {
    const event = snapshot.recentEvents[index];

    if (!event) {
      continue;
    }

    if (event.eventId === "task-progressed") {
      const node = nodes.get(event.taskId);

      if (node && !playerCues.has(event.playerId)) {
        playerCues.set(
          event.playerId,
          formatPlayerCue(
            node,
            event.id,
            0.62 + event.progress * 0.24,
            node.badgeText,
          ),
        );
      }
    }

    if (event.eventId === "task-completed") {
      const node = nodes.get(event.taskId);

      if (node && !playerCues.has(event.playerId)) {
        playerCues.set(
          event.playerId,
          formatPlayerCue(node, event.id, 0.94, "DONE"),
        );
      }
    }
  }

  for (const node of nodes.values()) {
    if (node.status !== "in-progress" && node.status !== "blocked") {
      continue;
    }

    for (const playerId of node.assignedPlayerIds) {
      if (playerCues.has(playerId)) {
        continue;
      }

      playerCues.set(
        playerId,
        formatPlayerCue(
          node,
          `task:${node.taskId}:${node.status}`,
          node.status === "blocked" ? 0.74 : 0.58 + node.progress * 0.16,
          node.status === "blocked" ? "BLOCKED" : node.badgeText,
        ),
      );
    }
  }

  return {
    nodes,
    rooms,
    playerCues,
  };
};
