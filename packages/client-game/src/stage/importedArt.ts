import type { RoomId, TaskId } from "@blackout-manor/shared";

import { getTaskInteractionGeometry } from "../tasking/taskReadability";
import type { ManorDoorNode } from "../tiled/manorLayout";

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
  taskId: TaskId;
  width: number;
  height: number;
  alpha?: number;
  offsetX?: number;
  offsetY?: number;
};

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

const ROOM_ART: Record<
  RoomId,
  {
    floorKey: string;
    wallKey: string;
    heroProps?: readonly ImportedHeroPropBlueprint[];
  }
> = {
  "grand-hall": {
    floorKey: "floor-parquet",
    wallKey: "wall-panel",
  },
  kitchen: {
    floorKey: "floor-service",
    wallKey: "wall-service",
    heroProps: [
      {
        key: "prop-kitchen-range",
        taskId: "balance-hot-water-pressure",
        width: 94,
        height: 62,
        alpha: 0.96,
        offsetX: -6,
        offsetY: 4,
      },
      {
        key: "prop-study-desk",
        taskId: "prepare-silver-tea-service",
        width: 80,
        height: 62,
        alpha: 0.82,
        offsetX: 8,
        offsetY: 4,
      },
    ],
  },
  library: {
    floorKey: "floor-parquet",
    wallKey: "wall-panel",
    heroProps: [
      {
        key: "prop-bookshelf",
        taskId: "tune-police-band-radio",
        width: 96,
        height: 140,
        alpha: 0.92,
        offsetX: 10,
        offsetY: -10,
      },
    ],
  },
  study: {
    floorKey: "floor-parquet",
    wallKey: "wall-panel",
    heroProps: [
      {
        key: "prop-study-desk",
        taskId: "file-guest-ledger",
        width: 90,
        height: 70,
        alpha: 0.96,
        offsetX: 8,
        offsetY: 2,
      },
    ],
  },
  ballroom: {
    floorKey: "floor-parquet",
    wallKey: "wall-service",
  },
  greenhouse: {
    floorKey: "floor-greenhouse",
    wallKey: "wall-greenhouse",
    heroProps: [
      {
        key: "prop-planter",
        taskId: "rebalance-greenhouse-valves",
        width: 84,
        height: 84,
        alpha: 0.94,
        offsetX: 6,
        offsetY: 8,
      },
    ],
  },
  "surveillance-hall": {
    floorKey: "floor-service",
    wallKey: "wall-service",
    heroProps: [
      {
        key: "prop-console-bank",
        taskId: "rewind-corridor-film",
        width: 92,
        height: 68,
        alpha: 0.95,
        offsetX: 4,
        offsetY: 4,
      },
    ],
  },
  "generator-room": {
    floorKey: "floor-stone",
    wallKey: "wall-stone",
    heroProps: [
      {
        key: "prop-console-bank",
        taskId: "reset-breaker-lattice",
        width: 86,
        height: 68,
        alpha: 0.96,
        offsetX: 6,
        offsetY: 4,
      },
    ],
  },
  cellar: {
    floorKey: "floor-stone",
    wallKey: "wall-stone",
    heroProps: [
      {
        key: "prop-boiler",
        taskId: "restore-boiler-pressure",
        width: 92,
        height: 106,
        alpha: 0.96,
        offsetX: 10,
        offsetY: 8,
      },
    ],
  },
  "servants-corridor": {
    floorKey: "floor-service",
    wallKey: "wall-service",
  },
};

export const getImportedRoomArt = (roomId: RoomId): ImportedRoomArt => {
  const roomArt = ROOM_ART[roomId];

  return {
    floorKey: roomArt.floorKey,
    wallKey: roomArt.wallKey,
    heroProps:
      roomArt.heroProps?.map((prop) => {
        const options = {
          ...(prop.alpha !== undefined ? { alpha: prop.alpha } : {}),
          ...(prop.offsetX !== undefined ? { offsetX: prop.offsetX } : {}),
          ...(prop.offsetY !== undefined ? { offsetY: prop.offsetY } : {}),
        };

        return propFromTask(
          prop.key,
          prop.taskId,
          prop.width,
          prop.height,
          Object.keys(options).length > 0 ? options : undefined,
        );
      }) ?? [],
  };
};

export const getCorridorFloorTextureKey = (className: string) => {
  if (className === "service-band" || className === "service-link") {
    return "floor-service";
  }

  if (className === "meeting-wing" || className === "gallery") {
    return "floor-parquet";
  }

  return "floor-parquet";
};

export const getDoorThresholdConfig = (node: ManorDoorNode) => ({
  key: "door-threshold",
  angle: node.orientation === "east" || node.orientation === "west" ? 90 : 0,
  tint:
    node.kind === "stair"
      ? 0xc0c4d1
      : node.roomId === "cellar" || node.roomId === "generator-room"
        ? 0xcfc6b0
        : 0xe1c78e,
});
