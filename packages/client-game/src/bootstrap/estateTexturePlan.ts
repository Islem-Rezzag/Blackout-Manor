import type { RoomId } from "@blackout-manor/shared";

import { getImportedRoomArt } from "../stage/importedArt";
import { MANOR_RENDER_MAP } from "../tiled/manorLayout";

export type EstateMaterial = {
  floor: "marble" | "parquet" | "tile" | "stone" | "boards";
  base: string;
  alternate: string;
  wall: string;
  trim: string;
  rug: string | null;
};

export const ESTATE_MATERIALS: Record<RoomId, EstateMaterial> = {
  "grand-hall": {
    floor: "marble",
    base: "#b1aa90",
    alternate: "#394e48",
    wall: "#626a53",
    trim: "#d0b57d",
    rug: null,
  },
  library: {
    floor: "parquet",
    base: "#85664a",
    alternate: "#684c36",
    wall: "#424e43",
    trim: "#bc9c69",
    rug: "#77454c",
  },
  study: {
    floor: "parquet",
    base: "#7d634c",
    alternate: "#624936",
    wall: "#4a6660",
    trim: "#b6ab7f",
    rug: "#4e6761",
  },
  kitchen: {
    floor: "tile",
    base: "#b1b0a0",
    alternate: "#65756c",
    wall: "#829084",
    trim: "#b9b7a0",
    rug: null,
  },
  ballroom: {
    floor: "parquet",
    base: "#a4835a",
    alternate: "#7e5e41",
    wall: "#744854",
    trim: "#d2b785",
    rug: null,
  },
  greenhouse: {
    floor: "stone",
    base: "#68786b",
    alternate: "#52665c",
    wall: "#344f4c",
    trim: "#9daea0",
    rug: null,
  },
  "surveillance-hall": {
    floor: "tile",
    base: "#627572",
    alternate: "#3c5252",
    wall: "#344c4c",
    trim: "#8daca2",
    rug: null,
  },
  "generator-room": {
    floor: "stone",
    base: "#6d7567",
    alternate: "#565e53",
    wall: "#56594a",
    trim: "#bab285",
    rug: null,
  },
  cellar: {
    floor: "stone",
    base: "#867a64",
    alternate: "#685f51",
    wall: "#6d5d4f",
    trim: "#b3a185",
    rug: null,
  },
  "servants-corridor": {
    floor: "boards",
    base: "#8e8870",
    alternate: "#77735f",
    wall: "#687361",
    trim: "#c3bea2",
    rug: null,
  },
};

export const estateFloorKey = (roomId: RoomId) => `estate-floor-${roomId}`;
export const estateWallKey = (roomId: RoomId) => `estate-wall-${roomId}`;
export const estatePropKey = (key: string) => `estate-${key}`;

export const ESTATE_TEXTURE_PLAN = [
  {
    key: "estate-grounds",
    fallbackKey: "room-shadow",
    category: "exterior-storm-layers" as const,
    width: MANOR_RENDER_MAP.width,
    height: MANOR_RENDER_MAP.height,
  },
  {
    key: "estate-gallery",
    fallbackKey: "floor-gallery",
    category: "corridors" as const,
    width: 480,
    height: 160,
  },
  {
    key: "estate-dining-gallery",
    fallbackKey: "floor-gallery",
    category: "corridors" as const,
    width: 330,
    height: 150,
  },
  ...MANOR_RENDER_MAP.roomOrder.flatMap((roomId) => {
    const room = MANOR_RENDER_MAP.rooms[roomId];
    const art = getImportedRoomArt(roomId);
    return [
      {
        key: estateFloorKey(roomId),
        fallbackKey: art.floorKey,
        category: "room-floors" as const,
        width: room.width,
        height: room.height,
      },
      {
        key: estateWallKey(roomId),
        fallbackKey: art.wallKey,
        category: "room-walls" as const,
        width: room.width,
        height: room.cutawayHeight + 12,
      },
    ];
  }),
  ...Array.from(
    new Map(
      MANOR_RENDER_MAP.roomOrder
        .flatMap((roomId) => getImportedRoomArt(roomId).heroProps)
        .map((prop) => [prop.key, prop]),
    ).values(),
  ).map((prop) => ({
    key: estatePropKey(prop.key),
    fallbackKey: prop.key,
    category: "hero-props" as const,
    width: Math.max(160, prop.width),
    height: Math.max(160, prop.height),
  })),
] as const;
