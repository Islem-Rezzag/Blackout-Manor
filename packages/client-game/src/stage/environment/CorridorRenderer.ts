import type { RoomId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type { ManorRenderRoom } from "../../tiled/manorLayout";
import type {
  EnvironmentCorridorRenderPlan,
  EnvironmentCorridorVisual,
  EnvironmentStageLayers,
} from "./EnvironmentRenderTypes";

const distanceBetween = (
  from: { x: number; y: number },
  to: { x: number; y: number },
) => Math.hypot(to.x - from.x, to.y - from.y);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const drawCorridors = (options: {
  scene: Phaser.Scene;
  layers: EnvironmentStageLayers;
  corridors: readonly EnvironmentCorridorRenderPlan[];
}) => {
  const { corridors, layers, scene } = options;
  const visuals: EnvironmentCorridorVisual[] = [];

  for (const corridor of corridors) {
    const { segment } = corridor;
    const centerX = segment.x + segment.width / 2;
    const centerY = segment.y + segment.height / 2;
    const isTechnical =
      segment.className === "service-band" ||
      segment.className === "service-link";
    const isMeetingWing = segment.className === "meeting-wing";
    const shellTint = isTechnical
      ? 0x243039
      : isMeetingWing
        ? 0x433127
        : 0x2f2823;
    const accentTint = isTechnical ? 0x7fb7cf : 0xd5b183;
    const shellShadow = scene.add
      .image(centerX, centerY + 10, "room-shadow")
      .setDisplaySize(segment.width + 28, segment.height + 24)
      .setAlpha(0.22);
    const shell = scene.add
      .image(centerX, centerY + 4, "room-shell")
      .setDisplaySize(segment.width + 12, segment.height + 12)
      .setTint(shellTint)
      .setAlpha(0.95);
    const floor = scene.add
      .image(centerX, centerY + 4, corridor.floorKey)
      .setDisplaySize(segment.width, segment.height)
      .setTint(0xf6f0e2)
      .setAlpha(0.96);
    const specular = scene.add
      .image(centerX, centerY + 4, "room-specular")
      .setDisplaySize(
        Math.max(42, segment.width - 10),
        Math.max(32, segment.height - 10),
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setTint(isTechnical ? 0x96daf0 : 0xf0d39a)
      .setAlpha(0.16);
    const vignette = scene.add
      .image(centerX, centerY + 4, "room-vignette")
      .setDisplaySize(segment.width * 1.02, segment.height * 0.98)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(isTechnical ? 0.24 : 0.18);
    const glow = scene.add
      .image(centerX, centerY, "room-glow")
      .setDisplaySize(segment.width * 1.18, segment.height * 0.82)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setTint(isTechnical ? 0x79bfd8 : 0xd9ac72)
      .setAlpha(isTechnical ? 0.15 : 0.11);
    const trim = scene.add
      .rectangle(
        centerX,
        centerY - segment.height / 2 + 6,
        segment.width - 10,
        8,
        accentTint,
        0.22,
      )
      .setOrigin(0.5);

    layers.floor.add([shellShadow, shell, floor, specular]);
    layers.props.add(vignette);
    layers.lights.add(glow);
    layers.walls.add(trim);

    visuals.push({
      segment,
      shellShadow,
      shell,
      floor,
      specular,
      glow,
      trim,
    });
  }

  return visuals;
};

export const refreshCorridorFocus = (options: {
  visuals: readonly EnvironmentCorridorVisual[];
  focusedRoom: ManorRenderRoom | null;
  inspectedRoom: ManorRenderRoom | null;
  inspectedRoomId: RoomId | null;
  dimStrength: number;
  corridorEmphasis: number;
}) => {
  const {
    corridorEmphasis,
    dimStrength,
    focusedRoom,
    inspectedRoom,
    inspectedRoomId,
    visuals,
  } = options;

  for (const visual of visuals) {
    const center = {
      x: visual.segment.x + visual.segment.width / 2,
      y: visual.segment.y + visual.segment.height / 2,
    };
    const focusDistance = focusedRoom
      ? distanceBetween(center, focusedRoom.cameraAnchor)
      : Number.POSITIVE_INFINITY;
    const inspectDistance = inspectedRoom
      ? distanceBetween(center, inspectedRoom.cameraAnchor)
      : Number.POSITIVE_INFINITY;
    const proximity = focusedRoom
      ? clamp(
          1 -
            Math.min(focusDistance, inspectDistance) /
              (inspectedRoomId ? 360 : 430),
          0,
          1,
        )
      : 0;
    const highlight = proximity * corridorEmphasis;

    visual.shellShadow.setAlpha(0.18 + highlight * 0.16);
    visual.shell.setAlpha(
      inspectedRoomId !== null
        ? 0.76 - dimStrength * 0.14 + highlight * 0.12
        : 0.9 + highlight * 0.06,
    );
    visual.floor.setAlpha(
      inspectedRoomId !== null
        ? 0.84 - dimStrength * 0.12 + highlight * 0.12
        : 0.94 + highlight * 0.04,
    );
    visual.specular.setAlpha(0.08 + highlight * 0.18);
    visual.glow.setAlpha(0.08 + highlight * 0.28);
    visual.trim.setAlpha(0.18 + highlight * 0.48);
  }
};
