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
  supportProps: readonly ImportedHeroPropPlacement[];
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
const PRODUCTION_ART_ROOM_IDS = new Set<RoomId>([
  "grand-hall",
  "kitchen",
  "library",
  "study",
  "ballroom",
  "greenhouse",
  "surveillance-hall",
  "generator-room",
  "cellar",
  "servants-corridor",
]);

export const isVerticalSliceRoomId = (roomId: RoomId) =>
  VERTICAL_SLICE_ROOM_IDS.has(roomId);

export const isProductionArtRoomId = (roomId: RoomId) =>
  PRODUCTION_ART_ROOM_IDS.has(roomId);

export type CorridorArtProfile =
  | "front-house"
  | "gallery"
  | "intelligence"
  | "service";

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

export const isProductionArtDoorNode = (node: ManorDoorNode) =>
  [node.roomId, ...node.targetRoomIds].some(isProductionArtRoomId);

export const getCorridorArtProfile = (
  corridor:
    | Pick<ManorCorridorSegment, "className" | "x" | "y" | "width" | "height">
    | string,
): CorridorArtProfile => {
  if (typeof corridor === "string") {
    if (corridor === "meeting-wing") {
      return "front-house";
    }

    if (corridor === "gallery") {
      return "gallery";
    }

    if (corridor === "service-band" || corridor === "service-link") {
      return "service";
    }

    return "front-house";
  }

  if (
    corridor.className === "service-band" ||
    corridor.className === "service-link" ||
    (corridor.className === "corridor" &&
      corridor.x <= 560 &&
      corridor.y >= 320)
  ) {
    return "service";
  }

  if (corridor.className === "meeting-wing") {
    return "front-house";
  }

  if (corridor.className === "gallery") {
    return "gallery";
  }

  if (
    corridor.className === "corridor" &&
    corridor.x >= 940 &&
    corridor.y <= 240
  ) {
    return "intelligence";
  }

  return "front-house";
};

const ROOM_ART: Record<
  RoomId,
  {
    floorKey: string;
    wallKey: string;
    supportProps?: readonly ImportedHeroPropBlueprint[];
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
    floorKey: "floor-kitchen-premium",
    wallKey: "wall-kitchen-premium",
    supportProps: [
      {
        key: "prop-kitchen-dish-shelf",
        roomPosition: { x: 0.18, y: 0.54 },
        width: 88,
        height: 84,
        alpha: 0.82,
      },
      {
        key: "prop-kitchen-butcher-block",
        roomPosition: { x: 0.52, y: 0.68 },
        width: 94,
        height: 68,
        alpha: 0.84,
      },
    ],
    heroProps: [
      {
        key: "prop-kitchen-range-premium",
        taskId: "balance-hot-water-pressure",
        width: 116,
        height: 82,
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
        key: "prop-kitchen-utensil-rack",
        roomPosition: { x: 0.24, y: 0.28 },
        width: 88,
        height: 48,
        alpha: 0.86,
      },
      {
        key: "prop-kitchen-pantry",
        roomPosition: { x: 0.82, y: 0.31 },
        width: 84,
        height: 108,
        alpha: 0.88,
      },
      {
        key: "prop-kitchen-tea-cart",
        roomPosition: { x: 0.78, y: 0.64 },
        width: 90,
        height: 68,
        alpha: 0.9,
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
    floorKey: "floor-study-premium",
    wallKey: "wall-study-premium",
    supportProps: [
      {
        key: "prop-study-side-table",
        roomPosition: { x: 0.22, y: 0.64 },
        width: 78,
        height: 76,
        alpha: 0.8,
      },
      {
        key: "prop-study-portrait-rail",
        roomPosition: { x: 0.56, y: 0.22 },
        width: 112,
        height: 48,
        alpha: 0.78,
      },
    ],
    heroProps: [
      {
        key: "prop-study-desk-premium",
        taskId: "file-guest-ledger",
        width: 128,
        height: 92,
        alpha: 0.97,
        offsetX: 4,
        offsetY: 6,
      },
      {
        key: "prop-study-evidence-board",
        roomPosition: { x: 0.3, y: 0.29 },
        width: 102,
        height: 76,
        alpha: 0.9,
      },
      {
        key: "prop-study-safe",
        roomPosition: { x: 0.84, y: 0.31 },
        width: 70,
        height: 92,
        alpha: 0.9,
      },
      {
        key: "prop-study-filing-cabinet",
        roomPosition: { x: 0.74, y: 0.58 },
        width: 78,
        height: 98,
        alpha: 0.88,
      },
    ],
  },
  ballroom: {
    floorKey: "floor-ballroom-premium",
    wallKey: "wall-ballroom-premium",
    supportProps: [
      {
        key: "prop-ballroom-bench",
        roomPosition: { x: 0.77, y: 0.64 },
        width: 102,
        height: 56,
        alpha: 0.8,
      },
      {
        key: "prop-ballroom-drape-stand",
        roomPosition: { x: 0.18, y: 0.5 },
        width: 96,
        height: 96,
        alpha: 0.76,
      },
    ],
    heroProps: [
      {
        key: "prop-ballroom-organ",
        taskId: "synchronize-organ-pipes",
        width: 142,
        height: 98,
        alpha: 0.96,
        offsetY: -4,
      },
      {
        key: "prop-ballroom-stage",
        taskId: "sort-masque-inventory",
        width: 156,
        height: 104,
        alpha: 0.92,
        offsetX: 10,
        offsetY: -10,
      },
      {
        key: "prop-ballroom-mask-wall",
        roomPosition: { x: 0.78, y: 0.29 },
        width: 110,
        height: 82,
        alpha: 0.9,
      },
      {
        key: "prop-ballroom-candelabra",
        roomPosition: { x: 0.28, y: 0.34 },
        width: 64,
        height: 108,
        alpha: 0.84,
      },
    ],
  },
  greenhouse: {
    floorKey: "floor-greenhouse-premium",
    wallKey: "wall-greenhouse-premium",
    supportProps: [
      {
        key: "prop-greenhouse-pot-shelf",
        roomPosition: { x: 0.18, y: 0.28 },
        width: 94,
        height: 84,
        alpha: 0.8,
      },
      {
        key: "prop-greenhouse-hanging-basket",
        roomPosition: { x: 0.78, y: 0.18 },
        width: 74,
        height: 92,
        alpha: 0.82,
      },
    ],
    heroProps: [
      {
        key: "prop-greenhouse-planter-bed",
        roomPosition: { x: 0.26, y: 0.47 },
        width: 126,
        height: 88,
        alpha: 0.88,
      },
      {
        key: "prop-greenhouse-planter-bed",
        roomPosition: { x: 0.74, y: 0.47 },
        width: 126,
        height: 88,
        alpha: 0.88,
      },
      {
        key: "prop-greenhouse-bench",
        roomPosition: { x: 0.5, y: 0.31 },
        width: 122,
        height: 84,
        alpha: 0.9,
      },
      {
        key: "prop-greenhouse-valve-bank",
        taskId: "rebalance-greenhouse-valves",
        width: 104,
        height: 76,
        alpha: 0.95,
        offsetX: 10,
        offsetY: 6,
      },
    ],
  },
  "surveillance-hall": {
    floorKey: "floor-surveillance-hall-premium",
    wallKey: "wall-surveillance-hall-premium",
    supportProps: [
      {
        key: "prop-surveillance-cable-rack",
        roomPosition: { x: 0.52, y: 0.18 },
        width: 144,
        height: 52,
        alpha: 0.74,
      },
      {
        key: "prop-surveillance-task-lamp",
        roomPosition: { x: 0.38, y: 0.58 },
        width: 64,
        height: 74,
        alpha: 0.84,
      },
      {
        key: "prop-surveillance-reel-stack",
        roomPosition: { x: 0.8, y: 0.65 },
        width: 92,
        height: 94,
        alpha: 0.82,
      },
    ],
    heroProps: [
      {
        key: "prop-surveillance-screenwall",
        roomPosition: { x: 0.48, y: 0.28 },
        width: 154,
        height: 98,
        alpha: 0.9,
      },
      {
        key: "prop-surveillance-switchboard",
        roomPosition: { x: 0.22, y: 0.35 },
        width: 92,
        height: 74,
        alpha: 0.86,
      },
      {
        key: "prop-surveillance-desk",
        taskId: "rewind-corridor-film",
        width: 118,
        height: 86,
        alpha: 0.95,
        offsetY: 4,
      },
      {
        key: "prop-surveillance-archive",
        roomPosition: { x: 0.81, y: 0.34 },
        width: 92,
        height: 88,
        alpha: 0.88,
      },
    ],
  },
  "generator-room": {
    floorKey: "floor-generator-room-premium",
    wallKey: "wall-generator-room-premium",
    supportProps: [
      {
        key: "prop-generator-fuse-crate",
        roomPosition: { x: 0.16, y: 0.28 },
        width: 82,
        height: 62,
        alpha: 0.78,
      },
      {
        key: "prop-generator-cable-bundle",
        roomPosition: { x: 0.18, y: 0.68 },
        width: 92,
        height: 54,
        alpha: 0.82,
      },
    ],
    heroProps: [
      {
        key: "prop-generator-core",
        roomPosition: { x: 0.29, y: 0.42 },
        width: 136,
        height: 106,
        alpha: 0.92,
      },
      {
        key: "prop-generator-breaker-wall",
        taskId: "reset-breaker-lattice",
        width: 112,
        height: 90,
        alpha: 0.96,
        offsetX: 10,
        offsetY: 6,
      },
      {
        key: "prop-generator-pipes",
        roomPosition: { x: 0.74, y: 0.27 },
        width: 118,
        height: 88,
        alpha: 0.84,
      },
      {
        key: "prop-generator-tool-cart",
        roomPosition: { x: 0.73, y: 0.63 },
        width: 92,
        height: 70,
        alpha: 0.88,
      },
    ],
  },
  cellar: {
    floorKey: "floor-cellar-premium",
    wallKey: "wall-cellar-premium",
    supportProps: [
      {
        key: "prop-cellar-workbench",
        roomPosition: { x: 0.24, y: 0.66 },
        width: 112,
        height: 78,
        alpha: 0.8,
      },
      {
        key: "prop-cellar-coal-scuttle",
        roomPosition: { x: 0.56, y: 0.66 },
        width: 74,
        height: 58,
        alpha: 0.84,
      },
    ],
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
        key: "prop-cellar-boiler-premium",
        taskId: "restore-boiler-pressure",
        width: 128,
        height: 136,
        alpha: 0.97,
        offsetX: 10,
        offsetY: 8,
      },
      {
        key: "prop-cellar-valve-bank",
        roomPosition: { x: 0.28, y: 0.32 },
        width: 108,
        height: 86,
        alpha: 0.86,
      },
      {
        key: "prop-crate-stack",
        roomPosition: { x: 0.8, y: 0.37 },
        width: 84,
        height: 72,
        alpha: 0.86,
      },
    ],
  },
  "servants-corridor": {
    floorKey: "floor-service-corridor-premium",
    wallKey: "wall-service-corridor-premium",
    supportProps: [
      {
        key: "prop-service-umbrella-stand",
        roomPosition: { x: 0.16, y: 0.66 },
        width: 56,
        height: 90,
        alpha: 0.82,
      },
      {
        key: "prop-service-hamper",
        roomPosition: { x: 0.78, y: 0.6 },
        width: 82,
        height: 72,
        alpha: 0.82,
      },
    ],
    heroProps: [
      {
        key: "prop-service-hooks",
        roomPosition: { x: 0.24, y: 0.28 },
        width: 94,
        height: 62,
        alpha: 0.84,
      },
      {
        key: "prop-service-linen-shelf",
        roomPosition: { x: 0.76, y: 0.28 },
        width: 94,
        height: 88,
        alpha: 0.86,
      },
      {
        key: "prop-service-trolley",
        roomPosition: { x: 0.38, y: 0.49 },
        width: 106,
        height: 70,
        alpha: 0.88,
      },
      {
        key: "prop-crate-stack",
        taskId: "move-portrait-crate-into-storage",
        width: 88,
        height: 72,
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
    supportProps:
      roomArt.supportProps?.map((prop) => resolveHeroProp(roomId, prop)) ?? [],
    heroProps:
      roomArt.heroProps?.map((prop) => resolveHeroProp(roomId, prop)) ?? [],
  };
};

export const getCorridorFloorTextureKey = (
  corridor:
    | Pick<ManorCorridorSegment, "className" | "x" | "y" | "width" | "height">
    | string,
) => {
  const profile = getCorridorArtProfile(corridor);

  switch (profile) {
    case "service":
      return "floor-service-link-premium";
    case "intelligence":
      return "floor-intelligence-spine";
    case "gallery":
      return "floor-cross-gallery-premium";
    case "front-house":
      return typeof corridor === "string"
        ? corridor === "meeting-wing"
          ? "floor-meeting-wing"
          : "floor-cross-gallery-premium"
        : corridor.className === "meeting-wing"
          ? "floor-meeting-wing"
          : "floor-cross-gallery-premium";
    default:
      return "floor-cross-gallery-premium";
  }
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
