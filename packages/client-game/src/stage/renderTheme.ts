import type { LightLevelId, MatchSnapshot } from "@blackout-manor/shared";

import type { ManorRenderRoom } from "../tiled/manorLayout";
import { lightLevelToFactor, mixColor, type RoomSignal } from "./signals";

export type RoomRenderPalette = {
  shellFill: number;
  shellStroke: number;
  floorTint: number;
  floorSpecularTint: number;
  accentTint: number;
  ambienceTint: number;
  dustTint: number;
  cutawayTint: number;
  cutawayShadowAlpha: number;
  blackoutOverlayAlpha: number;
  emergencyTint: number;
  emergencyAlpha: number;
  statePlateTint: number;
  focusTint: number;
  windowAlpha: number;
};

export const createRoomRenderPalette = (options: {
  room: ManorRenderRoom;
  roomState: MatchSnapshot["rooms"][number];
  signal: RoomSignal;
  focused: boolean;
}) => {
  const { focused, room, roomState, signal } = options;
  const lightFactor = lightLevelToFactor(roomState.lightLevel);
  const eventPressure =
    (signal.body ? 0.48 : 0) +
    (signal.sabotage ? 0.34 : 0) +
    (signal.clue ? 0.16 : 0);
  const shellFill = mixColor(
    room.surfaces.shellColor,
    room.cutawayColor,
    0.14 + eventPressure * 0.08,
  );
  const shellStroke = mixColor(
    room.accentColor,
    0xd9e7f4,
    focused ? 0.12 : 0.04,
  );
  const floorTint = mixColor(room.fillColor, 0x081019, 1 - lightFactor);
  const floorSpecularTint = mixColor(
    room.ambienceColor,
    0xffffff,
    0.16 + lightFactor * 0.12,
  );
  const accentTint = mixColor(
    room.accentColor,
    0x15222b,
    1 - lightFactor * 0.88,
  );
  const ambienceTint = mixColor(
    room.ambienceColor,
    0x183041,
    1 - lightFactor * 0.72,
  );
  const dustTint = mixColor(room.surfaces.dustColor, room.ambienceColor, 0.08);
  const cutawayTint = mixColor(
    room.cutawayColor,
    0x06090d,
    1 - lightFactor * 0.74,
  );
  const blackoutOverlayAlpha = Math.max(
    0,
    0.1 + (1 - lightFactor) * 0.38 + roomState.occupantIds.length * 0.006,
  );
  const emergencyTint = signal.body
    ? 0xff8a72
    : signal.sabotage
      ? 0xf5ba78
      : signal.clue
        ? 0xffe28d
        : room.surfaces.focusColor;

  return {
    shellFill,
    shellStroke,
    floorTint,
    floorSpecularTint,
    accentTint,
    ambienceTint,
    dustTint,
    cutawayTint,
    cutawayShadowAlpha: focused ? 0.14 : 0.28,
    blackoutOverlayAlpha,
    emergencyTint,
    emergencyAlpha:
      signal.body || signal.sabotage ? 0.24 : signal.clue ? 0.12 : 0.04,
    statePlateTint: mixColor(room.surfaces.statePlateColor, 0x061018, 0.32),
    focusTint: mixColor(
      room.surfaces.focusColor,
      0xf5e0ad,
      focused ? 0.18 : 0.04,
    ),
    windowAlpha: 0.38 + lightFactor * 0.26,
  } satisfies RoomRenderPalette;
};

export const createFeedPalette = (options: {
  room: ManorRenderRoom;
  lightLevel: LightLevelId;
  selected: boolean;
  flagged: boolean;
}) => {
  const { flagged, lightLevel, room, selected } = options;
  const lightFactor = lightLevelToFactor(lightLevel);
  const baseStroke = selected ? 0xd8c18a : room.accentColor;

  return {
    plateFill: selected ? 0x091521 : 0x081018,
    plateStroke: flagged ? mixColor(baseStroke, 0xf2b188, 0.44) : baseStroke,
    frameFill: mixColor(room.fillColor, 0x05080c, 1 - lightFactor),
    accentFill: mixColor(room.accentColor, 0x0d141a, 1 - lightFactor * 0.86),
    cutawayFill: mixColor(room.cutawayColor, 0x05080c, 1 - lightFactor * 0.74),
    dustTint: mixColor(room.surfaces.dustColor, room.ambienceColor, 0.12),
  };
};
