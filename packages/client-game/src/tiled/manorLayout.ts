import {
  MANOR_V1_MAP,
  MANOR_V1_TILED_MAP_JSON,
  type TiledMapJson,
  type TiledObject,
  type TiledPropertyValue,
} from "@blackout-manor/content";
import type { RoomId } from "@blackout-manor/shared";

export type ManorRoomLayout = {
  roomId: RoomId;
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor: number;
};

export type ManorBackdropRect = {
  id: number;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  stroke: number | null;
  alpha: number;
  depth: number;
};

export type ManorCorridorSegment = {
  id: number;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  stroke: number | null;
  alpha: number;
};

export type ManorDecorShape = {
  id: number;
  className: string;
  roomId: RoomId;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  alpha: number;
  ellipse: boolean;
};

export type ManorLightNode = {
  id: number;
  roomId: RoomId;
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
};

export type ManorWeatherWindow = {
  id: number;
  roomId: RoomId;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  alpha: number;
};

export type ManorDoorNode = {
  id: number;
  className: string;
  roomId: RoomId;
  targetRoomIds: readonly RoomId[];
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  stroke: number | null;
  alpha: number;
  kind: "door" | "arch" | "stair";
  orientation: "north" | "south" | "east" | "west";
};

export type ManorRenderRoom = ManorRoomLayout & {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fillColor: number;
  ambienceColor: number;
  focusZoom: number;
  cutawayHeight: number;
  theme: string;
  cutawayColor: number;
  cluePoint: { x: number; y: number };
  focusPoint: { x: number; y: number };
  cameraAnchor: { x: number; y: number };
  anchors: {
    titleY: number;
    themeY: number;
    stateY: number;
    taskStartX: number;
    taskStartY: number;
    sabotageY: number;
  };
  framing: {
    shellPaddingX: number;
    shellPaddingY: number;
    focusPaddingX: number;
    focusPaddingY: number;
    floorInsetY: number;
    wallInsetX: number;
    wallInsetY: number;
  };
  surfaces: {
    shellColor: number;
    shadowColor: number;
    dustColor: number;
    titlePlateColor: number;
    statePlateColor: number;
    focusColor: number;
  };
  decor: ManorDecorShape[];
  lights: ManorLightNode[];
  windows: ManorWeatherWindow[];
};

export type ManorRenderMap = {
  id: string;
  width: number;
  height: number;
  backdropRects: ManorBackdropRect[];
  corridors: ManorCorridorSegment[];
  doorNodes: ManorDoorNode[];
  roomOrder: RoomId[];
  rooms: Record<RoomId, ManorRenderRoom>;
};

type TiledPropertyBag = Record<string, TiledPropertyValue>;

const asPropertyBag = (object: TiledObject): TiledPropertyBag =>
  Object.fromEntries(
    (object.properties ?? []).map((property) => [
      property.name,
      property.value,
    ]),
  );

const asString = (
  properties: TiledPropertyBag,
  key: string,
  fallback: string,
) => {
  const value = properties[key];

  return typeof value === "string" && value.length > 0 ? value : fallback;
};

const asRoomIdList = (
  properties: TiledPropertyBag,
  key: string,
): readonly RoomId[] => {
  const value = properties[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(assertRoomId);
};

const asNumber = (
  properties: TiledPropertyBag,
  key: string,
  fallback: number,
) => {
  const value = properties[key];

  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const parseColor = (
  value: TiledPropertyValue | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.replace("#", "");
  const rgb = normalized.length === 8 ? normalized.slice(2) : normalized;
  const parsed = Number.parseInt(rgb, 16);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const getObjectLayer = (mapJson: TiledMapJson, layerName: string) => {
  const layer = mapJson.layers.find(
    (candidate) => candidate.name === layerName,
  );

  if (!layer) {
    throw new Error(`Missing required tiled layer: ${layerName}.`);
  }

  return layer;
};

const pointFromObject = (object: TiledObject) => ({
  x: object.x + object.width / 2,
  y: object.y + object.height / 2,
});

const assertRoomId = (value: string): RoomId => {
  const room = MANOR_V1_MAP.rooms.find((candidate) => candidate.id === value);

  if (!room) {
    throw new Error(`Unknown room id in tiled manor map: ${value}.`);
  }

  return room.id;
};

const buildRenderMap = (mapJson: TiledMapJson): ManorRenderMap => {
  const backdropRects = getObjectLayer(mapJson, "backdrop").objects.map(
    (object) => {
      const properties = asPropertyBag(object);

      return {
        id: object.id,
        className: object.class ?? "backdrop",
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        fill: parseColor(properties.fill, 0x0a1118),
        stroke:
          typeof properties.stroke === "string"
            ? parseColor(properties.stroke, 0x1e3344)
            : null,
        alpha: asNumber(properties, "alpha", 1),
        depth: asNumber(properties, "depth", 0),
      };
    },
  );

  const corridors = getObjectLayer(mapJson, "corridors").objects.map(
    (object) => {
      const properties = asPropertyBag(object);

      return {
        id: object.id,
        className: object.class ?? "corridor",
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        fill: parseColor(properties.fill, 0x231d1a),
        stroke:
          typeof properties.stroke === "string"
            ? parseColor(properties.stroke, 0x4e4237)
            : null,
        alpha: asNumber(properties, "alpha", 1),
      } satisfies ManorCorridorSegment;
    },
  );

  const doorNodes = getObjectLayer(mapJson, "door_nodes").objects.map(
    (object) => {
      const properties = asPropertyBag(object);

      return {
        id: object.id,
        className: object.class ?? "door-node",
        roomId: assertRoomId(asString(properties, "roomId", "")),
        targetRoomIds: asRoomIdList(properties, "targetRoomIds"),
        x: object.x + object.width / 2,
        y: object.y + object.height / 2,
        width: object.width,
        height: object.height,
        fill: parseColor(properties.fill, 0x8c6a44),
        stroke:
          typeof properties.stroke === "string"
            ? parseColor(properties.stroke, 0xd9be8c)
            : null,
        alpha: asNumber(properties, "alpha", 0.9),
        kind: asString(properties, "kind", "door") as ManorDoorNode["kind"],
        orientation: asString(
          properties,
          "orientation",
          object.width >= object.height ? "north" : "east",
        ) as ManorDoorNode["orientation"],
      } satisfies ManorDoorNode;
    },
  );

  const rooms = {} as Record<RoomId, ManorRenderRoom>;
  const roomLayer = getObjectLayer(mapJson, "rooms_floor");
  const cutawayLayer = getObjectLayer(mapJson, "cutaway_walls");
  const decorLayer = getObjectLayer(mapJson, "decor");
  const lightLayer = getObjectLayer(mapJson, "light_nodes");
  const cameraLayer = getObjectLayer(mapJson, "camera_points");
  const focusLayer = getObjectLayer(mapJson, "focus_points");
  const clueLayer = getObjectLayer(mapJson, "clue_points");
  const windowsLayer = getObjectLayer(mapJson, "weather_windows");

  for (const roomObject of roomLayer.objects) {
    const properties = asPropertyBag(roomObject);
    const roomId = assertRoomId(
      asString(properties, "roomId", roomObject.name),
    );
    const cameraObject = cameraLayer.objects.find((candidate) => {
      const cameraProps = asPropertyBag(candidate);
      return asString(cameraProps, "roomId", "") === roomId;
    });
    const cutawayObject = cutawayLayer.objects.find((candidate) => {
      const cutawayProps = asPropertyBag(candidate);
      return asString(cutawayProps, "roomId", "") === roomId;
    });
    const focusObject = focusLayer.objects.find((candidate) => {
      const focusProps = asPropertyBag(candidate);
      return asString(focusProps, "roomId", "") === roomId;
    });
    const clueObject = clueLayer.objects.find((candidate) => {
      const clueProps = asPropertyBag(candidate);
      return asString(clueProps, "roomId", "") === roomId;
    });

    rooms[roomId] = {
      roomId,
      x: roomObject.x + roomObject.width / 2,
      y: roomObject.y + roomObject.height / 2,
      width: roomObject.width,
      height: roomObject.height,
      accentColor: parseColor(properties.accent, 0xc4c4c4),
      bounds: {
        x: roomObject.x,
        y: roomObject.y,
        width: roomObject.width,
        height: roomObject.height,
      },
      fillColor: parseColor(properties.fill, 0x1f2630),
      ambienceColor: parseColor(properties.ambience, 0xffe5a5),
      focusZoom: asNumber(properties, "focusZoom", 1.16),
      cutawayHeight: asNumber(properties, "cutawayHeight", 48),
      theme: asString(properties, "theme", "storm pressure"),
      cutawayColor: parseColor(
        cutawayObject ? asPropertyBag(cutawayObject).fill : undefined,
        0x37414a,
      ),
      cluePoint: clueObject
        ? pointFromObject(clueObject)
        : {
            x: roomObject.x + roomObject.width * 0.78,
            y: roomObject.y + roomObject.height * 0.72,
          },
      focusPoint: focusObject
        ? pointFromObject(focusObject)
        : {
            x: roomObject.x + roomObject.width / 2,
            y: roomObject.y + roomObject.height / 2,
          },
      cameraAnchor: cameraObject
        ? pointFromObject(cameraObject)
        : focusObject
          ? pointFromObject(focusObject)
          : {
              x: roomObject.x + roomObject.width / 2,
              y: roomObject.y + roomObject.height / 2,
            },
      anchors: {
        titleY:
          -roomObject.height / 2 + asNumber(properties, "titleOffsetY", 20),
        themeY:
          -roomObject.height / 2 +
          asNumber(
            properties,
            "themeOffsetY",
            asNumber(properties, "cutawayHeight", 48) + 28,
          ),
        stateY:
          roomObject.height / 2 - asNumber(properties, "stateOffsetY", 24),
        taskStartX:
          -roomObject.width / 2 + asNumber(properties, "taskOffsetX", 24),
        taskStartY:
          -roomObject.height / 2 +
          asNumber(
            properties,
            "taskOffsetY",
            asNumber(properties, "cutawayHeight", 48) + 34,
          ),
        sabotageY:
          -roomObject.height / 2 + asNumber(properties, "sabotageOffsetY", 22),
      },
      framing: {
        shellPaddingX: asNumber(properties, "shellPaddingX", 14),
        shellPaddingY: asNumber(properties, "shellPaddingY", 18),
        focusPaddingX: asNumber(properties, "focusPaddingX", 18),
        focusPaddingY: asNumber(properties, "focusPaddingY", 22),
        floorInsetY: asNumber(properties, "floorInsetY", 8),
        wallInsetX: asNumber(properties, "wallInsetX", 6),
        wallInsetY: asNumber(properties, "wallInsetY", 0),
      },
      surfaces: {
        shellColor: parseColor(properties.shellColor, 0x131a21),
        shadowColor: parseColor(properties.shadowColor, 0x000000),
        dustColor: parseColor(properties.dustColor, 0xffffff),
        titlePlateColor: parseColor(
          properties.titlePlateColor,
          parseColor(properties.accent, 0xc4c4c4),
        ),
        statePlateColor: parseColor(
          properties.statePlateColor,
          parseColor(properties.fill, 0x1f2630),
        ),
        focusColor: parseColor(
          properties.focusColor,
          parseColor(properties.accent, 0xc4c4c4),
        ),
      },
      decor: [],
      lights: [],
      windows: [],
    };
  }

  for (const decorObject of decorLayer.objects) {
    const properties = asPropertyBag(decorObject);
    const roomId = assertRoomId(asString(properties, "roomId", ""));

    rooms[roomId].decor.push({
      id: decorObject.id,
      className: decorObject.class ?? "decor",
      roomId,
      x: decorObject.x + decorObject.width / 2,
      y: decorObject.y + decorObject.height / 2,
      width: decorObject.width,
      height: decorObject.height,
      fill: parseColor(properties.fill, 0x3f3f3f),
      alpha: asNumber(properties, "alpha", 0.65),
      ellipse: Boolean(decorObject.ellipse),
    });
  }

  for (const lightObject of lightLayer.objects) {
    const properties = asPropertyBag(lightObject);
    const roomId = assertRoomId(asString(properties, "roomId", ""));

    rooms[roomId].lights.push({
      id: lightObject.id,
      roomId,
      x: lightObject.x,
      y: lightObject.y,
      radius: asNumber(properties, "radius", 96),
      color: parseColor(properties.color, rooms[roomId].ambienceColor),
      intensity: asNumber(properties, "intensity", 0.7),
    });
  }

  for (const windowObject of windowsLayer.objects) {
    const properties = asPropertyBag(windowObject);
    const roomId = assertRoomId(asString(properties, "roomId", ""));

    rooms[roomId].windows.push({
      id: windowObject.id,
      roomId,
      x: windowObject.x + windowObject.width / 2,
      y: windowObject.y + windowObject.height / 2,
      width: windowObject.width,
      height: windowObject.height,
      fill: parseColor(properties.fill, 0x7aa6d8),
      alpha: asNumber(properties, "alpha", 0.32),
    });
  }

  for (const room of MANOR_V1_MAP.rooms) {
    if (!rooms[room.id]) {
      throw new Error(`Tiled manor render map is missing room ${room.id}.`);
    }
  }

  return {
    id: "manor_v1_tiled",
    width: mapJson.width * mapJson.tilewidth,
    height: mapJson.height * mapJson.tileheight,
    backdropRects,
    corridors,
    doorNodes,
    roomOrder: MANOR_V1_MAP.rooms.map((room) => room.id),
    rooms,
  };
};

export const MANOR_RENDER_MAP = buildRenderMap(MANOR_V1_TILED_MAP_JSON);

export const MANOR_WORLD_BOUNDS = {
  width: MANOR_RENDER_MAP.width,
  height: MANOR_RENDER_MAP.height,
} as const;

export const MANOR_ROOM_LAYOUTS = Object.fromEntries(
  MANOR_RENDER_MAP.roomOrder.map((roomId) => {
    const room = MANOR_RENDER_MAP.rooms[roomId];
    return [
      roomId,
      {
        roomId,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        accentColor: room.accentColor,
      } satisfies ManorRoomLayout,
    ];
  }),
) as Record<RoomId, ManorRoomLayout>;

export const getRoomLayout = (roomId: RoomId) => MANOR_ROOM_LAYOUTS[roomId];

export const getRoomRenderData = (roomId: RoomId) =>
  MANOR_RENDER_MAP.rooms[roomId];

export const getDoorNodesForRoom = (roomId: RoomId) =>
  MANOR_RENDER_MAP.doorNodes.filter((doorNode) => doorNode.roomId === roomId);

const ROOM_SEAT_LAYOUT_PRESETS: Record<
  RoomId,
  {
    maxColumns: number;
    horizontalPadding: number;
    topPaddingExtra: number;
    bottomPadding: number;
    staggerX: number;
  }
> = {
  "grand-hall": {
    maxColumns: 4,
    horizontalPadding: 58,
    topPaddingExtra: 54,
    bottomPadding: 42,
    staggerX: 16,
  },
  kitchen: {
    maxColumns: 3,
    horizontalPadding: 44,
    topPaddingExtra: 48,
    bottomPadding: 34,
    staggerX: 12,
  },
  library: {
    maxColumns: 3,
    horizontalPadding: 40,
    topPaddingExtra: 44,
    bottomPadding: 30,
    staggerX: 12,
  },
  study: {
    maxColumns: 3,
    horizontalPadding: 42,
    topPaddingExtra: 42,
    bottomPadding: 30,
    staggerX: 10,
  },
  ballroom: {
    maxColumns: 4,
    horizontalPadding: 52,
    topPaddingExtra: 48,
    bottomPadding: 34,
    staggerX: 16,
  },
  greenhouse: {
    maxColumns: 3,
    horizontalPadding: 42,
    topPaddingExtra: 42,
    bottomPadding: 28,
    staggerX: 12,
  },
  "surveillance-hall": {
    maxColumns: 3,
    horizontalPadding: 34,
    topPaddingExtra: 38,
    bottomPadding: 28,
    staggerX: 10,
  },
  "generator-room": {
    maxColumns: 3,
    horizontalPadding: 34,
    topPaddingExtra: 38,
    bottomPadding: 28,
    staggerX: 10,
  },
  cellar: {
    maxColumns: 3,
    horizontalPadding: 44,
    topPaddingExtra: 42,
    bottomPadding: 28,
    staggerX: 12,
  },
  "servants-corridor": {
    maxColumns: 2,
    horizontalPadding: 30,
    topPaddingExtra: 34,
    bottomPadding: 22,
    staggerX: 8,
  },
};

export const getRoomSeatPosition = (
  roomId: RoomId,
  seatIndex: number,
  seatCount: number,
) => {
  const room = getRoomRenderData(roomId);
  const preset = ROOM_SEAT_LAYOUT_PRESETS[roomId];
  const columns = Math.min(
    Math.max(1, preset.maxColumns),
    Math.max(1, seatCount),
  );
  const rows = Math.max(1, Math.ceil(seatCount / columns));
  const column = seatIndex % columns;
  const row = Math.floor(seatIndex / columns);
  const horizontalPadding = Math.min(
    room.width * 0.24,
    preset.horizontalPadding,
  );
  const verticalPadding = room.cutawayHeight + preset.topPaddingExtra;
  const usableWidth = Math.max(52, room.width - horizontalPadding * 2);
  const usableHeight = Math.max(
    48,
    room.height - verticalPadding - preset.bottomPadding,
  );
  const columnProgress = columns === 1 ? 0.5 : column / (columns - 1);
  const rowProgress = rows === 1 ? 0.56 : row / (rows - 1);
  const staggerX =
    rows > 1 && columns > 1 ? (row % 2 === 0 ? -1 : 1) * preset.staggerX : 0;
  const seatJitterX =
    columns > 1 ? ((seatIndex % 2 === 0 ? -1 : 1) * preset.staggerX) / 3 : 0;

  return {
    x:
      room.bounds.x +
      horizontalPadding +
      usableWidth * columnProgress +
      staggerX +
      seatJitterX,
    y:
      room.bounds.y +
      verticalPadding +
      usableHeight * rowProgress +
      (rows === 1 ? usableHeight * 0.08 : 0),
  };
};
