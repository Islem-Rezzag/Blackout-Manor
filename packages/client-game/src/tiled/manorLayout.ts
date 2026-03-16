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
  decor: ManorDecorShape[];
  lights: ManorLightNode[];
  windows: ManorWeatherWindow[];
};

export type ManorRenderMap = {
  id: string;
  width: number;
  height: number;
  backdropRects: ManorBackdropRect[];
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

  const rooms = {} as Record<RoomId, ManorRenderRoom>;
  const roomLayer = getObjectLayer(mapJson, "rooms_floor");
  const cutawayLayer = getObjectLayer(mapJson, "cutaway_walls");
  const decorLayer = getObjectLayer(mapJson, "decor");
  const lightLayer = getObjectLayer(mapJson, "light_nodes");
  const focusLayer = getObjectLayer(mapJson, "focus_points");
  const clueLayer = getObjectLayer(mapJson, "clue_points");
  const windowsLayer = getObjectLayer(mapJson, "weather_windows");

  for (const roomObject of roomLayer.objects) {
    const properties = asPropertyBag(roomObject);
    const roomId = assertRoomId(
      asString(properties, "roomId", roomObject.name),
    );
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

export const getRoomSeatPosition = (
  roomId: RoomId,
  seatIndex: number,
  seatCount: number,
) => {
  const room = getRoomRenderData(roomId);
  const columns = Math.max(2, Math.ceil(Math.sqrt(Math.max(seatCount, 1))));
  const rows = Math.max(1, Math.ceil(seatCount / columns));
  const column = seatIndex % columns;
  const row = Math.floor(seatIndex / columns);
  const horizontalPadding = 44;
  const verticalPadding = room.cutawayHeight + 32;
  const usableWidth = Math.max(56, room.width - horizontalPadding * 2);
  const usableHeight = Math.max(56, room.height - verticalPadding - 26);

  return {
    x:
      room.bounds.x +
      horizontalPadding +
      (usableWidth * (column + 0.5)) / columns,
    y: room.bounds.y + verticalPadding + (usableHeight * (row + 0.5)) / rows,
  };
};
