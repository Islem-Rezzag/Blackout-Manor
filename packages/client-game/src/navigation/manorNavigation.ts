import { MANOR_V1_MAP } from "@blackout-manor/content";
import type { PhaseId, RoomId } from "@blackout-manor/shared";

import type { AvatarInteractionCue } from "../entities/avatar/presentation";
import { getTaskInteractionGeometry } from "../tasking/taskReadability";
import {
  getDoorNodesForRoom,
  getRoomRenderData,
  MANOR_RENDER_MAP,
  type ManorCorridorSegment,
  type ManorDoorNode,
} from "../tiled/manorLayout";

export type NavigationPoint = {
  x: number;
  y: number;
};

export type NavigationWaypointKind =
  | "room-exit"
  | "door-threshold"
  | "corridor"
  | "room-entry"
  | "task-approach"
  | "hotspot";

export type NavigationWaypoint = NavigationPoint & {
  kind: NavigationWaypointKind;
  roomId: RoomId | null;
  speedPxPerSecond: number;
  pauseMs: number;
};

export type EmbodiedMovementPlan = {
  fromRoomId: RoomId;
  toRoomId: RoomId;
  roomPath: RoomId[];
  targetPosition: NavigationPoint;
  hotspotPosition: NavigationPoint;
  usesEmbodiedTraversal: boolean;
  waypoints: NavigationWaypoint[];
};

const ROOM_SPEED_PX_PER_SECOND = 58;
const HALLWAY_SPEED_PX_PER_SECOND = 74;
const THRESHOLD_PAUSE_MS = 190;
const TASK_SETTLE_DELAY_MS = 430;
const DOOR_INTERIOR_OFFSET = 22;
const CONTAINMENT_MARGIN = 24;
const CORRIDOR_TOUCH_MARGIN = 16;
const POINT_EPSILON = 4;

export const MOVEMENT_PACING = {
  hallwayPxPerSecond: HALLWAY_SPEED_PX_PER_SECOND,
  roomPxPerSecond: ROOM_SPEED_PX_PER_SECOND,
  thresholdPauseMs: THRESHOLD_PAUSE_MS,
  taskSettleDelayMs: TASK_SETTLE_DELAY_MS,
} as const;

const ORIENTATION_VECTOR = {
  north: { x: 0, y: 1 },
  south: { x: 0, y: -1 },
  east: { x: -1, y: 0 },
  west: { x: 1, y: 0 },
} as const satisfies Record<
  ManorDoorNode["orientation"],
  { x: number; y: number }
>;

type CorridorRoute = {
  segmentIds: number[];
  points: NavigationPoint[];
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const distanceBetween = (from: NavigationPoint, to: NavigationPoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

const roughlySamePoint = (from: NavigationPoint, to: NavigationPoint) =>
  distanceBetween(from, to) <= POINT_EPSILON;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const expandRect = (rect: Rect, amount: number): Rect => ({
  x: rect.x - amount,
  y: rect.y - amount,
  width: rect.width + amount * 2,
  height: rect.height + amount * 2,
});

const pointInsideRect = (point: NavigationPoint, rect: Rect) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const rectIntersection = (left: Rect, right: Rect): Rect | null => {
  const x = Math.max(left.x, right.x);
  const y = Math.max(left.y, right.y);
  const maxX = Math.min(left.x + left.width, right.x + right.width);
  const maxY = Math.min(left.y + left.height, right.y + right.height);

  if (maxX < x || maxY < y) {
    return null;
  }

  return {
    x,
    y,
    width: maxX - x,
    height: maxY - y,
  };
};

const roomGraph = MANOR_V1_MAP.rooms.reduce<Record<RoomId, readonly RoomId[]>>(
  (graph, room) => {
    graph[room.id] = room.neighboringRoomIds;
    return graph;
  },
  {} as Record<RoomId, readonly RoomId[]>,
);

const roomCorridorRects = MANOR_RENDER_MAP.corridors.map((segment) => ({
  segment,
  rect: expandRect(segment, CONTAINMENT_MARGIN),
}));

const corridorAdjacency = new Map<number, number[]>();

for (const corridor of MANOR_RENDER_MAP.corridors) {
  corridorAdjacency.set(corridor.id, []);
}

for (let index = 0; index < MANOR_RENDER_MAP.corridors.length; index += 1) {
  const current = MANOR_RENDER_MAP.corridors[index];
  if (!current) {
    continue;
  }

  for (
    let nextIndex = index + 1;
    nextIndex < MANOR_RENDER_MAP.corridors.length;
    nextIndex += 1
  ) {
    const next = MANOR_RENDER_MAP.corridors[nextIndex];
    if (!next) {
      continue;
    }
    const overlap = rectIntersection(
      expandRect(current, CORRIDOR_TOUCH_MARGIN),
      expandRect(next, CORRIDOR_TOUCH_MARGIN),
    );

    if (!overlap) {
      continue;
    }

    corridorAdjacency.get(current.id)?.push(next.id);
    corridorAdjacency.get(next.id)?.push(current.id);
  }
}

const getDoorCenter = (door: ManorDoorNode): NavigationPoint => ({
  x: door.x,
  y: door.y,
});

const getDoorInteriorPoint = (door: ManorDoorNode): NavigationPoint => {
  const vector = ORIENTATION_VECTOR[door.orientation];

  return {
    x: door.x + vector.x * DOOR_INTERIOR_OFFSET,
    y: door.y + vector.y * DOOR_INTERIOR_OFFSET,
  };
};

const projectToCorridorCenterline = (
  point: NavigationPoint,
  corridor: ManorCorridorSegment,
): NavigationPoint => {
  const horizontal = corridor.width >= corridor.height;
  const centerX = corridor.x + corridor.width / 2;
  const centerY = corridor.y + corridor.height / 2;

  return horizontal
    ? {
        x: clamp(point.x, corridor.x + 10, corridor.x + corridor.width - 10),
        y: centerY,
      }
    : {
        x: centerX,
        y: clamp(point.y, corridor.y + 10, corridor.y + corridor.height - 10),
      };
};

const corridorConnectionPoint = (
  from: ManorCorridorSegment,
  to: ManorCorridorSegment,
): NavigationPoint => {
  const overlap = rectIntersection(
    expandRect(from, CORRIDOR_TOUCH_MARGIN),
    expandRect(to, CORRIDOR_TOUCH_MARGIN),
  );

  if (overlap) {
    return {
      x: overlap.x + overlap.width / 2,
      y: overlap.y + overlap.height / 2,
    };
  }

  const fromProjected = projectToCorridorCenterline(
    { x: to.x + to.width / 2, y: to.y + to.height / 2 },
    from,
  );
  const toProjected = projectToCorridorCenterline(fromProjected, to);

  return {
    x: (fromProjected.x + toProjected.x) / 2,
    y: (fromProjected.y + toProjected.y) / 2,
  };
};

const getCorridorsForPoint = (point: NavigationPoint) =>
  roomCorridorRects
    .filter(({ rect }) => pointInsideRect(point, rect))
    .map(({ segment }) => segment);

const buildRoomPath = (fromRoomId: RoomId, toRoomId: RoomId) => {
  if (fromRoomId === toRoomId) {
    return [fromRoomId];
  }

  const queue: RoomId[] = [fromRoomId];
  const visited = new Set<RoomId>([fromRoomId]);
  const previous = new Map<RoomId, RoomId>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    for (const next of roomGraph[current]) {
      if (visited.has(next)) {
        continue;
      }

      visited.add(next);
      previous.set(next, current);

      if (next === toRoomId) {
        const path = [toRoomId];
        let cursor: RoomId | undefined = toRoomId;

        while (cursor && cursor !== fromRoomId) {
          cursor = previous.get(cursor);
          if (cursor) {
            path.push(cursor);
          }
        }

        return path.reverse();
      }

      queue.push(next);
    }
  }

  return [fromRoomId, toRoomId];
};

const selectDoorNode = (
  roomId: RoomId,
  targetRoomId: RoomId,
  fromPoint: NavigationPoint,
) => {
  const matchingDoors = getDoorNodesForRoom(roomId).filter((doorNode) =>
    doorNode.targetRoomIds.includes(targetRoomId),
  );

  if (matchingDoors.length === 0) {
    return null;
  }

  return [...matchingDoors].sort(
    (left, right) =>
      distanceBetween(getDoorCenter(left), fromPoint) -
      distanceBetween(getDoorCenter(right), fromPoint),
  )[0];
};

const selectEntryDoorNode = (
  roomId: RoomId,
  previousRoomId: RoomId,
  fallbackPoint: NavigationPoint,
) => {
  const reciprocal = getDoorNodesForRoom(roomId).filter((doorNode) =>
    doorNode.targetRoomIds.includes(previousRoomId),
  );

  if (reciprocal.length > 0) {
    return [...reciprocal].sort(
      (left, right) =>
        distanceBetween(getDoorCenter(left), fallbackPoint) -
        distanceBetween(getDoorCenter(right), fallbackPoint),
    )[0];
  }

  const room = getRoomRenderData(roomId);
  return [...getDoorNodesForRoom(roomId)].sort(
    (left, right) =>
      distanceBetween(getDoorCenter(left), room.focusPoint) -
      distanceBetween(getDoorCenter(right), room.focusPoint),
  )[0];
};

const buildCorridorRoute = (
  startPoint: NavigationPoint,
  endPoint: NavigationPoint,
): CorridorRoute => {
  const startCorridors = getCorridorsForPoint(startPoint);
  const endCorridors = getCorridorsForPoint(endPoint);

  if (startCorridors.length === 0 || endCorridors.length === 0) {
    return { segmentIds: [], points: [] };
  }

  const endIds = new Set(endCorridors.map((segment) => segment.id));
  const queue = startCorridors.map((segment) => segment.id);
  const previous = new Map<number, number | null>(
    startCorridors.map((segment) => [segment.id, null]),
  );
  const visited = new Set(queue);
  let targetId: number | null = queue.find((id) => endIds.has(id)) ?? null;

  while (queue.length > 0 && targetId === null) {
    const currentId = queue.shift();

    if (currentId === undefined) {
      break;
    }

    for (const nextId of corridorAdjacency.get(currentId) ?? []) {
      if (visited.has(nextId)) {
        continue;
      }

      visited.add(nextId);
      previous.set(nextId, currentId);

      if (endIds.has(nextId)) {
        targetId = nextId;
        break;
      }

      queue.push(nextId);
    }
  }

  if (targetId === null) {
    return { segmentIds: [], points: [] };
  }

  const segmentIds: number[] = [targetId];
  let cursor = previous.get(targetId) ?? null;

  while (cursor !== null) {
    segmentIds.push(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  segmentIds.reverse();

  const segments = segmentIds
    .map((segmentId) =>
      MANOR_RENDER_MAP.corridors.find((segment) => segment.id === segmentId),
    )
    .filter((segment): segment is ManorCorridorSegment => Boolean(segment));

  const points: NavigationPoint[] = [];
  let cursorPoint = startPoint;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) {
      continue;
    }
    const projectedStart = projectToCorridorCenterline(cursorPoint, segment);
    if (!roughlySamePoint(projectedStart, cursorPoint)) {
      points.push(projectedStart);
    }

    const nextSegment = segments[index + 1];

    if (!nextSegment) {
      const projectedEnd = projectToCorridorCenterline(endPoint, segment);
      if (!roughlySamePoint(projectedEnd, projectedStart)) {
        points.push(projectedEnd);
      }
      break;
    }

    const connection = corridorConnectionPoint(segment, nextSegment);
    const projectedConnection = projectToCorridorCenterline(
      connection,
      segment,
    );
    if (!roughlySamePoint(projectedConnection, projectedStart)) {
      points.push(projectedConnection);
    }

    const nextProjected = projectToCorridorCenterline(connection, nextSegment);
    if (!roughlySamePoint(nextProjected, projectedConnection)) {
      points.push(nextProjected);
    }
    cursorPoint = nextProjected;
  }

  return { segmentIds, points };
};

const resolveRoomHotspotTarget = (
  roomId: RoomId,
  fallback: NavigationPoint,
  phaseId: PhaseId,
  cue: AvatarInteractionCue,
) => {
  if (cue.taskId) {
    const taskGeometry = getTaskInteractionGeometry(cue.taskId);

    if (taskGeometry.roomId === roomId) {
      return taskGeometry.hotspotPoint;
    }
  }

  if (
    phaseId === "meeting" ||
    phaseId === "vote" ||
    phaseId === "reveal" ||
    phaseId === "resolution"
  ) {
    return fallback;
  }

  const room = getRoomRenderData(roomId);

  switch (cue.actionIcon) {
    case "report":
    case "clue":
      return room.cluePoint;
    case "sabotage":
      return {
        x: room.focusPoint.x,
        y: room.bounds.y + room.height * 0.68,
      };
    default:
      return fallback;
  }
};

const pushWaypoint = (
  waypoints: NavigationWaypoint[],
  waypoint: NavigationWaypoint,
) => {
  const last = waypoints[waypoints.length - 1];

  if (
    last &&
    last.kind === waypoint.kind &&
    last.roomId === waypoint.roomId &&
    roughlySamePoint(last, waypoint)
  ) {
    last.pauseMs = Math.max(last.pauseMs, waypoint.pauseMs);
    last.speedPxPerSecond = waypoint.speedPxPerSecond;
    return;
  }

  waypoints.push(waypoint);
};

const createWaypoint = (
  point: NavigationPoint,
  kind: NavigationWaypointKind,
  roomId: RoomId | null,
  speedPxPerSecond: number,
  pauseMs = 0,
): NavigationWaypoint => ({
  x: point.x,
  y: point.y,
  kind,
  roomId,
  speedPxPerSecond,
  pauseMs,
});

export const buildEmbodiedMovementPlan = (options: {
  fromRoomId: RoomId;
  toRoomId: RoomId;
  currentPosition: NavigationPoint;
  targetPosition: NavigationPoint;
  phaseId: PhaseId;
  cue: AvatarInteractionCue;
}): EmbodiedMovementPlan => {
  const {
    cue,
    currentPosition,
    fromRoomId,
    phaseId,
    targetPosition,
    toRoomId,
  } = options;
  const hotspotPosition = resolveRoomHotspotTarget(
    toRoomId,
    targetPosition,
    phaseId,
    cue,
  );
  const taskGeometry =
    cue.taskId && getTaskInteractionGeometry(cue.taskId).roomId === toRoomId
      ? getTaskInteractionGeometry(cue.taskId)
      : null;

  if (fromRoomId === toRoomId) {
    const waypoints: NavigationWaypoint[] = [];

    if (
      taskGeometry &&
      !roughlySamePoint(currentPosition, taskGeometry.approachPoint)
    ) {
      waypoints.push(
        createWaypoint(
          taskGeometry.approachPoint,
          "task-approach",
          toRoomId,
          ROOM_SPEED_PX_PER_SECOND,
          THRESHOLD_PAUSE_MS,
        ),
      );
    }

    waypoints.push(
      createWaypoint(
        hotspotPosition,
        "hotspot",
        toRoomId,
        ROOM_SPEED_PX_PER_SECOND,
        TASK_SETTLE_DELAY_MS,
      ),
    );

    return {
      fromRoomId,
      toRoomId,
      roomPath: [toRoomId],
      targetPosition,
      hotspotPosition,
      usesEmbodiedTraversal: false,
      waypoints,
    };
  }

  const roomPath = buildRoomPath(fromRoomId, toRoomId);
  const waypoints: NavigationWaypoint[] = [];
  let traversalPoint = currentPosition;
  let usesEmbodiedTraversal = false;

  for (let index = 0; index < roomPath.length - 1; index += 1) {
    const currentRoomId = roomPath[index];
    const nextRoomId = roomPath[index + 1];
    if (!currentRoomId || !nextRoomId) {
      continue;
    }
    const exitDoor = selectDoorNode(currentRoomId, nextRoomId, traversalPoint);

    if (!exitDoor) {
      continue;
    }

    const entryDoor =
      selectEntryDoorNode(nextRoomId, currentRoomId, getDoorCenter(exitDoor)) ??
      null;
    const exitInterior = getDoorInteriorPoint(exitDoor);

    if (!roughlySamePoint(traversalPoint, exitInterior)) {
      pushWaypoint(
        waypoints,
        createWaypoint(
          exitInterior,
          "room-exit",
          currentRoomId,
          ROOM_SPEED_PX_PER_SECOND,
        ),
      );
    }

    pushWaypoint(
      waypoints,
      createWaypoint(
        getDoorCenter(exitDoor),
        "door-threshold",
        currentRoomId,
        ROOM_SPEED_PX_PER_SECOND,
        THRESHOLD_PAUSE_MS,
      ),
    );

    if (entryDoor) {
      const corridorRoute = buildCorridorRoute(
        getDoorCenter(exitDoor),
        getDoorCenter(entryDoor),
      );

      for (const point of corridorRoute.points) {
        pushWaypoint(
          waypoints,
          createWaypoint(point, "corridor", null, HALLWAY_SPEED_PX_PER_SECOND),
        );
      }

      pushWaypoint(
        waypoints,
        createWaypoint(
          getDoorCenter(entryDoor),
          "door-threshold",
          nextRoomId,
          HALLWAY_SPEED_PX_PER_SECOND,
          THRESHOLD_PAUSE_MS,
        ),
      );
      pushWaypoint(
        waypoints,
        createWaypoint(
          getDoorInteriorPoint(entryDoor),
          "room-entry",
          nextRoomId,
          ROOM_SPEED_PX_PER_SECOND,
        ),
      );
      traversalPoint = getDoorInteriorPoint(entryDoor);
      usesEmbodiedTraversal =
        usesEmbodiedTraversal || corridorRoute.segmentIds.length > 0;
    } else {
      traversalPoint = getDoorCenter(exitDoor);
    }
  }

  if (
    taskGeometry &&
    !roughlySamePoint(traversalPoint, taskGeometry.approachPoint)
  ) {
    pushWaypoint(
      waypoints,
      createWaypoint(
        taskGeometry.approachPoint,
        "task-approach",
        toRoomId,
        ROOM_SPEED_PX_PER_SECOND,
        THRESHOLD_PAUSE_MS,
      ),
    );
  }

  pushWaypoint(
    waypoints,
    createWaypoint(
      hotspotPosition,
      "hotspot",
      toRoomId,
      ROOM_SPEED_PX_PER_SECOND,
      TASK_SETTLE_DELAY_MS,
    ),
  );

  return {
    fromRoomId,
    toRoomId,
    roomPath,
    targetPosition,
    hotspotPosition,
    usesEmbodiedTraversal: usesEmbodiedTraversal || roomPath.length > 1,
    waypoints,
  };
};

export const estimateMovementPlanDurationMs = (
  plan: Pick<EmbodiedMovementPlan, "waypoints">,
) =>
  plan.waypoints.reduce((totalMs, waypoint, index) => {
    const previousPoint = index > 0 ? plan.waypoints[index - 1] : null;
    const distance = previousPoint
      ? distanceBetween(previousPoint, waypoint)
      : 0;

    return (
      totalMs +
      waypoint.pauseMs +
      (distance > 0 ? (distance / waypoint.speedPxPerSecond) * 1000 : 0)
    );
  }, 0);
