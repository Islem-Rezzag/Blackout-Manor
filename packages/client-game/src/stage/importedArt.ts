import type { RoomId, TaskId } from "@blackout-manor/shared";

import { getTaskInteractionGeometry } from "../tasking/taskReadability";
import {
  getRoomRenderData,
  type ManorCorridorSegment,
  type ManorDoorNode,
} from "../tiled/manorLayout";

export type ImportedHeroPropPlacement = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
};

export type ImportedRoomArt = {
  floorKey: string;
  wallKey: string;
  heroProps: readonly ImportedHeroPropPlacement[];
};

type ImportedHeroPropBlueprint = {
  key: string;
  width: number;
  height: number;
  alpha?: number;
  offsetX?: number;
  offsetY?: number;
} & (
  | { taskId: TaskId }
  | {
      roomPosition: {
        x: number;
        y: number;
      };
    }
);

const propFromTask = (
  key: string,
  taskId: TaskId,
  width: number,
  height: number,
  options?: {
    alpha?: number;
    offsetX?: number;
    offsetY?: number;
  },
): ImportedHeroPropPlacement => {
  const point = getTaskInteractionGeometry(taskId).propPoint;

  return {
    key,
    x: point.x + (options?.offsetX ?? 0),
    y: point.y + (options?.offsetY ?? 0),
    width,
    height,
    alpha: options?.alpha ?? 0.9,
  };
};

const propFromRoomPosition = (
  roomId: RoomId,
  key: string,
  roomPosition: { x: number; y: number },
  width: number,
  height: number,
  options?: {
    alpha?: number;
    offsetX?: number;
    offsetY?: number;
  },
): ImportedHeroPropPlacement => {
  const room = getRoomRenderData(roomId);

  return {
    key,
    x: room.bounds.x + room.width * roomPosition.x + (options?.offsetX ?? 0),
    y:
      room.bounds.y +
      room.height * roomPosition.y +
      room.framing.floorInsetY * 0.42 +
      (options?.offsetY ?? 0),
    width,
    height,
    alpha: options?.alpha ?? 0.9,
  };
};

const resolveHeroProp = (
  roomId: RoomId,
  prop: ImportedHeroPropBlueprint,
): ImportedHeroPropPlacement => {
  const options = {
    ...(prop.alpha !== undefined ? { alpha: prop.alpha } : {}),
    ...(prop.offsetX !== undefined ? { offsetX: prop.offsetX } : {}),
    ...(prop.offsetY !== undefined ? { offsetY: prop.offsetY } : {}),
  };

  if ("taskId" in prop) {
    return propFromTask(
      prop.key,
      prop.taskId,
      prop.width,
      prop.height,
      Object.keys(options).length > 0 ? options : undefined,
    );
  }

  return propFromRoomPosition(
    roomId,
    prop.key,
    prop.roomPosition,
    prop.width,
    prop.height,
    Object.keys(options).length > 0 ? options : undefined,
  );
};

const VERTICAL_SLICE_ROOM_IDS = new Set<RoomId>(["grand-hall", "library"]);

export const isVerticalSliceRoomId = (roomId: RoomId) =>
  VERTICAL_SLICE_ROOM_IDS.has(roomId);

export const isVerticalSliceCorridorSegment = (
  corridor:
    | Pick<ManorCorridorSegment, "className" | "x" | "y" | "width" | "height">
    | string,
) => {
  if (typeof corridor === "string") {
    return corridor === "meeting-wing";
  }

  return (
    corridor.className === "meeting-wing" ||
    (corridor.className === "corridor" &&
      corridor.x >= 940 &&
      corridor.y <= 240 &&
      corridor.height >= 300)
  );
};

export const isVerticalSliceDoorNode = (node: ManorDoorNode) =>
  [node.roomId, ...node.targetRoomIds].some(isVerticalSliceRoomId);

const ROOM_ART: Record<
  RoomId,
  {
    floorKey: string;
    wallKey: string;
    heroProps?: readonly ImportedHeroPropBlueprint[];
  }
> = {
  "grand-hall": {
    floorKey: "floor-grand-hall-premium",
    wallKey: "wall-grand-hall-premium",
    heroProps: [
      {
        key: "prop-grand-stair",
        roomPosition: { x: 0.22, y: 0.28 },
        width: 156,
        height: 114,
        alpha: 0.94,
      },
      {
        key: "prop-grand-console",
        roomPosition: { x: 0.2, y: 0.56 },
        width: 124,
        height: 90,
        alpha: 0.9,
      },
      {
        key: "prop-grand-tribunal-chairbank",
        roomPosition: { x: 0.54, y: 0.57 },
        width: 260,
        height: 120,
        alpha: 0.88,
      },
      {
        key: "prop-grand-tribunal-table",
        roomPosition: { x: 0.54, y: 0.57 },
        width: 228,
        height: 96,
        alpha: 0.95,
        offsetY: 4,
      },
      {
        key: "prop-grand-clock",
        taskId: "wind-grandfather-clock",
        width: 76,
        height: 148,
        alpha: 0.97,
        offsetY: -10,
      },
    ],
  },
  kitchen: {
    floorKey: "floor-kitchen",
    wallKey: "wall-kitchen",
    heroProps: [
      {
        key: "prop-kitchen-range",
        taskId: "balance-hot-water-pressure",
        width: 98,
        height: 70,
        alpha: 0.96,
        offsetX: -6,
        offsetY: 2,
      },
      {
        key: "prop-kitchen-island",
        taskId: "prepare-silver-tea-service",
        width: 120,
        height: 72,
        alpha: 0.94,
        offsetX: 6,
        offsetY: 8,
      },
      {
        key: "prop-kitchen-pantry",
        roomPosition: { x: 0.82, y: 0.31 },
        width: 84,
        height: 108,
        alpha: 0.88,
      },
    ],
  },
  library: {
    floorKey: "floor-library-premium",
    wallKey: "wall-library-premium",
    heroProps: [
      {
        key: "prop-library-fireplace",
        roomPosition: { x: 0.24, y: 0.31 },
        width: 110,
        height: 86,
        alpha: 0.9,
      },
      {
        key: "prop-library-stacks",
        roomPosition: { x: 0.76, y: 0.3 },
        width: 146,
        height: 122,
        alpha: 0.92,
      },
      {
        key: "prop-library-reading-club",
        roomPosition: { x: 0.34, y: 0.64 },
        width: 144,
        height: 86,
        alpha: 0.9,
      },
      {
        key: "prop-library-ladder",
        roomPosition: { x: 0.79, y: 0.35 },
        width: 66,
        height: 118,
        alpha: 0.88,
      },
      {
        key: "prop-library-desk",
        taskId: "tune-police-band-radio",
        width: 136,
        height: 98,
        alpha: 0.96,
        offsetX: 4,
        offsetY: 8,
      },
    ],
  },
  study: {
    floorKey: "floor-study",
    wallKey: "wall-study",
    heroProps: [
      {
        key: "prop-study-desk",
        taskId: "file-guest-ledger",
        width: 104,
        height: 76,
        alpha: 0.97,
        offsetX: 10,
        offsetY: 2,
      },
      {
        key: "prop-study-safe",
        roomPosition: { x: 0.84, y: 0.31 },
        width: 70,
        height: 92,
        alpha: 0.9,
      },
    ],
  },
  ballroom: {
    floorKey: "floor-ballroom",
    wallKey: "wall-ballroom",
    heroProps: [
      {
        key: "prop-ballroom-organ",
        taskId: "synchronize-organ-pipes",
        width: 134,
        height: 94,
        alpha: 0.96,
        offsetY: -4,
      },
      {
        key: "prop-ballroom-stage",
        taskId: "sort-masque-inventory",
        width: 146,
        height: 98,
        alpha: 0.92,
        offsetX: 10,
        offsetY: -10,
      },
    ],
  },
  greenhouse: {
    floorKey: "floor-greenhouse",
    wallKey: "wall-greenhouse",
    heroProps: [
      {
        key: "prop-greenhouse-bench",
        roomPosition: { x: 0.31, y: 0.31 },
        width: 112,
        height: 82,
        alpha: 0.88,
      },
      {
        key: "prop-planter",
        taskId: "rebalance-greenhouse-valves",
        width: 90,
        height: 90,
        alpha: 0.95,
        offsetX: 6,
        offsetY: 8,
      },
    ],
  },
  "surveillance-hall": {
    floorKey: "floor-surveillance-hall",
    wallKey: "wall-surveillance-hall",
    heroProps: [
      {
        key: "prop-surveillance-screenwall",
        roomPosition: { x: 0.48, y: 0.28 },
        width: 148,
        height: 94,
        alpha: 0.9,
      },
      {
        key: "prop-console-bank",
        taskId: "rewind-corridor-film",
        width: 96,
        height: 68,
        alpha: 0.95,
        offsetY: 4,
      },
      {
        key: "prop-surveillance-archive",
        roomPosition: { x: 0.81, y: 0.34 },
        width: 88,
        height: 84,
        alpha: 0.88,
      },
    ],
  },
  "generator-room": {
    floorKey: "floor-generator-room",
    wallKey: "wall-generator-room",
    heroProps: [
      {
        key: "prop-generator-core",
        roomPosition: { x: 0.29, y: 0.42 },
        width: 128,
        height: 98,
        alpha: 0.92,
      },
      {
        key: "prop-console-bank",
        taskId: "reset-breaker-lattice",
        width: 84,
        height: 66,
        alpha: 0.96,
        offsetX: 6,
        offsetY: 4,
      },
      {
        key: "prop-generator-pipes",
        roomPosition: { x: 0.74, y: 0.27 },
        width: 110,
        height: 84,
        alpha: 0.84,
      },
    ],
  },
  cellar: {
    floorKey: "floor-cellar",
    wallKey: "wall-cellar",
    heroProps: [
      {
        key: "prop-cellar-coal",
        taskId: "carry-coal-to-the-boiler",
        width: 70,
        height: 58,
        alpha: 0.92,
        offsetY: 6,
      },
      {
        key: "prop-boiler",
        taskId: "restore-boiler-pressure",
        width: 106,
        height: 118,
        alpha: 0.97,
        offsetX: 10,
        offsetY: 8,
      },
    ],
  },
  "servants-corridor": {
    floorKey: "floor-service-corridor",
    wallKey: "wall-service-corridor",
    heroProps: [
      {
        key: "prop-crate-stack",
        taskId: "move-portrait-crate-into-storage",
        width: 82,
        height: 68,
        alpha: 0.92,
      },
    ],
  },
};

export const getImportedRoomArt = (roomId: RoomId): ImportedRoomArt => {
  const roomArt = ROOM_ART[roomId];

  return {
    floorKey: roomArt.floorKey,
    wallKey: roomArt.wallKey,
    heroProps:
      roomArt.heroProps?.map((prop) => resolveHeroProp(roomId, prop)) ?? [],
  };
};

export const getCorridorFloorTextureKey = (
  corridor:
    | Pick<ManorCorridorSegment, "className" | "x" | "y" | "width" | "height">
    | string,
) => {
  const className =
    typeof corridor === "string" ? corridor : corridor.className;

  if (className === "service-band" || className === "service-link") {
    return "floor-service-corridor";
  }

  if (isVerticalSliceCorridorSegment(corridor)) {
    return "floor-meeting-wing";
  }

  if (className === "gallery") {
    return "floor-gallery";
  }

  return "floor-gallery";
};

const isMechanicalRoom = (roomId: RoomId) =>
  roomId === "generator-room" || roomId === "cellar";

const isGlassRoom = (roomId: RoomId) => roomId === "greenhouse";

const isServiceRoom = (roomId: RoomId) =>
  roomId === "kitchen" ||
  roomId === "surveillance-hall" ||
  roomId === "servants-corridor";

export const getDoorThresholdConfig = (node: ManorDoorNode) => {
  const connectedRoomIds = [node.roomId, ...node.targetRoomIds];
  const key =
    node.kind === "stair"
      ? "door-threshold-stair"
      : connectedRoomIds.some(isGlassRoom)
        ? "door-threshold-greenhouse"
        : connectedRoomIds.some(isMechanicalRoom)
          ? "door-threshold-mechanical"
          : connectedRoomIds.some(isServiceRoom)
            ? "door-threshold-service"
            : "door-threshold-social";

  const tint =
    key === "door-threshold-greenhouse"
      ? 0xe9fff7
      : key === "door-threshold-mechanical"
        ? 0xe5eef8
        : key === "door-threshold-service"
          ? 0xf2ede4
          : 0xfff7ea;

  return {
    key,
    angle: node.orientation === "east" || node.orientation === "west" ? 90 : 0,
    tint,
  };
};
