import {
  DEFAULT_ROOM_LABELS,
  type RoomId,
  type TaskId,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import { readableTaskLabel } from "../signals";
import type {
  EnvironmentRenderPlan,
  EnvironmentRoomLayerContainers,
  EnvironmentRoomVisual,
  EnvironmentStageLayers,
} from "./EnvironmentRenderTypes";
import { createRoomLightingWeatherVisuals } from "./LightingWeatherRenderer";
import { createDecorPropVisuals, createHeroPropVisuals } from "./PropRenderer";

const taskChipStyle = {
  color: "#091018",
  backgroundColor: "#ead08c",
  fontFamily: "Segoe UI, sans-serif",
  fontSize: "12px",
  padding: { left: 10, right: 10, top: 5, bottom: 5 },
} as const;

type RoomPlateCallbacks = {
  onHoverRoomChange?: (roomId: RoomId | null) => void;
  onInspectRoom?: (roomId: RoomId) => void;
  onSelectRoom?: (roomId: RoomId) => void;
  onStartTask?: (taskId: TaskId) => void;
};

const createRoomContainers = (
  scene: Phaser.Scene,
  layers: EnvironmentStageLayers,
  roomX: number,
  roomY: number,
) => {
  const containers = {
    floor: scene.add.container(roomX, roomY),
    props: scene.add.container(roomX, roomY),
    lights: scene.add.container(roomX, roomY),
    walls: scene.add.container(roomX, roomY),
    interaction: scene.add.container(roomX, roomY),
    focus: scene.add.container(roomX, roomY),
  } satisfies EnvironmentRoomLayerContainers;

  layers.floor.add(containers.floor);
  layers.props.add(containers.props);
  layers.lights.add(containers.lights);
  layers.walls.add(containers.walls);
  layers.interaction.add(containers.interaction);
  layers.focus.add(containers.focus);

  return containers;
};

const createTaskChips = (options: {
  scene: Phaser.Scene;
  roomId: RoomId;
  taskIds: readonly TaskId[];
  anchors: { taskStartX: number; taskStartY: number };
  callbacks: RoomPlateCallbacks;
}) => {
  const { anchors, callbacks, roomId, scene, taskIds } = options;

  return taskIds.map((taskId, index) => {
    const chip = scene.add.text(
      anchors.taskStartX,
      anchors.taskStartY + index * 24,
      readableTaskLabel(taskId),
      taskChipStyle,
    );
    chip.setOrigin(0, 0.5);
    chip.setInteractive({ useHandCursor: true });
    chip.on("pointerdown", () => {
      callbacks.onInspectRoom?.(roomId);
      callbacks.onStartTask?.(taskId);
    });
    return chip;
  });
};

export const drawRoomPlates = (options: {
  scene: Phaser.Scene;
  layers: EnvironmentStageLayers;
  plan: EnvironmentRenderPlan;
  callbacks: RoomPlateCallbacks;
}) => {
  const { callbacks, layers, plan, scene } = options;
  const roomVisuals = new Map<RoomId, EnvironmentRoomVisual>();

  for (const roomPlan of plan.rooms) {
    const { art, room, taskIds } = roomPlan;
    const containers = createRoomContainers(scene, layers, room.x, room.y);
    const allContainers = Object.values(containers);
    const shellShadow = scene.add
      .image(0, 18, "room-shadow")
      .setDisplaySize(
        room.width + room.framing.shellPaddingX * 2.6,
        room.height + room.framing.shellPaddingY * 1.9,
      )
      .setAlpha(0.38);
    const shell = scene.add
      .image(0, 6, "room-shell")
      .setDisplaySize(
        room.width + room.framing.shellPaddingX * 1.7,
        room.height + room.framing.shellPaddingY * 1.7,
      )
      .setAlpha(0.98);
    const floor = scene.add
      .image(0, room.framing.floorInsetY, art.floorKey)
      .setDisplaySize(room.width, room.height)
      .setAlpha(0.97);
    const floorSpecular = scene.add
      .image(0, room.framing.floorInsetY, "room-specular")
      .setDisplaySize(room.width * 0.98, room.height * 0.98)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.26);
    const accent = scene.add
      .image(0, room.framing.floorInsetY + 14, "room-glow")
      .setDisplaySize(room.width * 0.9, room.height * 0.68)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.18);
    const dust = scene.add
      .image(0, room.framing.floorInsetY, "room-dust")
      .setDisplaySize(room.width * 0.96, room.height * 0.9)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.12);
    const interiorVignette = scene.add
      .image(0, room.framing.floorInsetY, "room-vignette")
      .setDisplaySize(room.width * 1.02, room.height * 1.02)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.22);
    const ambientGlow = scene.add
      .image(0, room.framing.floorInsetY, "room-glow")
      .setDisplaySize(room.width * 1.22, room.height * 1.06)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.44);
    const blackoutShade = scene.add
      .rectangle(
        0,
        room.framing.floorInsetY,
        room.width * 0.98,
        room.height * 0.96,
        0x04070b,
        0.16,
      )
      .setStrokeStyle(0, 0, 0);
    const emergencyWash = scene.add
      .image(0, room.framing.floorInsetY, "focus-beam")
      .setDisplaySize(room.width * 1.14, room.height * 0.98)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.08);

    const { decorHighlights, decorObjects, decorShadows } =
      createDecorPropVisuals(scene, room);
    const { heroPropShadows, heroProps } = createHeroPropVisuals(
      scene,
      room,
      art,
    );
    const { lightGlows, windowOverlays } = createRoomLightingWeatherVisuals(
      scene,
      room,
    );

    const cutawayShadow = scene.add
      .image(0, -room.height / 2 + room.cutawayHeight / 2 + 10, "room-shadow")
      .setDisplaySize(
        room.width + room.framing.shellPaddingX * 2.1,
        room.cutawayHeight + 30,
      )
      .setAlpha(0.3);
    const cutawayBacking = scene.add
      .image(
        0,
        -room.height / 2 + room.cutawayHeight / 2 + room.framing.wallInsetY,
        "room-wall",
      )
      .setDisplaySize(
        room.width + room.framing.wallInsetX * 2 + 6,
        room.cutawayHeight + 18,
      )
      .setAlpha(0.4);
    const cutawayWall = scene.add
      .image(
        0,
        -room.height / 2 + room.cutawayHeight / 2 + room.framing.wallInsetY,
        art.wallKey,
      )
      .setDisplaySize(
        room.width + room.framing.wallInsetX * 2,
        room.cutawayHeight + 12,
      )
      .setAlpha(0.94);
    const cutawayTrim = scene.add
      .rectangle(
        0,
        -room.height / 2 + 12,
        room.width - 16,
        12,
        room.accentColor,
        0.32,
      )
      .setOrigin(0.5);
    const titlePlate = scene.add
      .rectangle(
        0,
        room.anchors.titleY + 6,
        Math.min(room.width - 26, 244),
        38,
        room.surfaces.titlePlateColor,
        0.26,
      )
      .setStrokeStyle(1, room.accentColor, 0.14);
    const title = scene.add.text(
      0,
      room.anchors.titleY,
      DEFAULT_ROOM_LABELS[room.roomId],
      {
        color: "#f5f0e4",
        fontFamily: "Palatino Linotype, Georgia, serif",
        fontSize: "24px",
        fontStyle: "bold",
      },
    );
    title.setOrigin(0.5);
    const theme = scene.add.text(0, room.anchors.themeY, room.theme, {
      color: "#d8e1eb",
      fontFamily: "Georgia, Times, serif",
      fontSize: "13px",
      fontStyle: "italic",
    });
    theme.setOrigin(0.5);
    const statePlate = scene.add
      .rectangle(
        0,
        room.anchors.stateY,
        Math.min(room.width - 22, 258),
        30,
        room.surfaces.statePlateColor,
        0.22,
      )
      .setStrokeStyle(1, room.accentColor, 0.12);
    const state = scene.add.text(0, room.anchors.stateY - 8, "", {
      color: "#dce4ed",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      letterSpacing: 1.1,
    });
    state.setOrigin(0.5);

    const taskChips = createTaskChips({
      scene,
      roomId: room.roomId,
      taskIds,
      anchors: room.anchors,
      callbacks,
    });
    const clueMarker = scene.add
      .image(
        room.cluePoint.x - room.x,
        room.cluePoint.y - room.y,
        "clue-marker",
      )
      .setDisplaySize(42, 42)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0);
    const sabotagePulse = scene.add
      .image(0, room.anchors.sabotageY + 14, "signal-pulse")
      .setDisplaySize(room.width * 0.6, 92)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    scene.tweens.add({
      targets: sabotagePulse,
      scaleX: 1.08,
      scaleY: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });
    scene.tweens.add({
      targets: clueMarker,
      scaleX: 1.16,
      scaleY: 1.16,
      yoyo: true,
      repeat: -1,
      duration: 820,
      ease: "Sine.easeInOut",
    });

    const sabotageBanner = scene.add
      .image(0, room.anchors.sabotageY, "sabotage-stripe")
      .setDisplaySize(room.width * 0.88, 48)
      .setAlpha(0);
    const sabotageLabel = scene.add.text(0, room.anchors.sabotageY, "", {
      color: "#fff6ed",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      letterSpacing: 1.2,
    });
    sabotageLabel.setOrigin(0.5);
    sabotageLabel.setAlpha(0);
    const focusBeam = scene.add
      .image(0, room.framing.floorInsetY, "focus-beam")
      .setDisplaySize(
        room.width + room.framing.focusPaddingX * 2.2,
        room.height + room.framing.focusPaddingY * 2.2,
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0);
    const focusFrame = scene.add
      .rectangle(
        0,
        room.framing.floorInsetY,
        room.width + room.framing.focusPaddingX * 2,
        room.height + room.framing.focusPaddingY * 2,
      )
      .setStrokeStyle(2.4, room.accentColor, 0)
      .setFillStyle(room.accentColor, 0)
      .setOrigin(0.5);
    const hitTarget = scene.add
      .rectangle(
        0,
        room.framing.floorInsetY,
        room.width * 0.94,
        room.height * 0.94,
        0xffffff,
        0.001,
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hitTarget.on("pointerover", () => {
      callbacks.onHoverRoomChange?.(room.roomId);
    });
    hitTarget.on("pointerout", () => {
      callbacks.onHoverRoomChange?.(null);
    });
    hitTarget.on("pointerdown", () => {
      callbacks.onSelectRoom?.(room.roomId);
    });

    containers.floor.add([
      shellShadow,
      shell,
      floor,
      floorSpecular,
      accent,
      dust,
    ]);
    containers.props.add([
      interiorVignette,
      ambientGlow,
      blackoutShade,
      emergencyWash,
      ...decorShadows,
      ...decorObjects,
      ...decorHighlights,
      ...heroPropShadows,
      ...heroProps,
    ]);
    containers.lights.add([...lightGlows, ...windowOverlays]);
    containers.walls.add([
      cutawayShadow,
      cutawayBacking,
      cutawayWall,
      cutawayTrim,
      titlePlate,
      title,
      theme,
      statePlate,
      state,
    ]);
    containers.interaction.add([
      ...taskChips,
      clueMarker,
      sabotagePulse,
      sabotageBanner,
      sabotageLabel,
      hitTarget,
    ]);
    containers.focus.add([focusBeam, focusFrame]);

    roomVisuals.set(room.roomId, {
      roomId: room.roomId,
      containers,
      allContainers,
      shellShadow,
      shell,
      floor,
      floorSpecular,
      accent,
      dust,
      interiorVignette,
      ambientGlow,
      blackoutShade,
      emergencyWash,
      decorShadows,
      decorObjects,
      decorHighlights,
      heroPropShadows,
      heroProps,
      lightGlows,
      windowOverlays,
      cutawayShadow,
      cutawayBacking,
      cutawayWall,
      cutawayTrim,
      titlePlate,
      title,
      theme,
      statePlate,
      state,
      clueMarker,
      sabotagePulse,
      sabotageBanner,
      sabotageLabel,
      focusBeam,
      focusFrame,
      taskChips,
      hitTarget,
    });
  }

  return roomVisuals;
};
