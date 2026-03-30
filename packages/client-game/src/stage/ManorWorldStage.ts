import { MANOR_V1_MAP } from "@blackout-manor/content";
import type {
  MatchSnapshot,
  PhaseId,
  RoomId,
  TaskId,
} from "@blackout-manor/shared";
import { DEFAULT_ROOM_LABELS } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import {
  deriveAmbienceState,
  deriveMovementFeedbackStates,
  deriveNavigationSoundCues,
  deriveSnapshotSoundCues,
  type PublicMovementFeedbackState,
} from "../audio/publicEventFeedback";
import { SoundBus } from "../audio/SoundBus";
import type { InspectionPresentation } from "../directors/types";
import {
  type AvatarMovementOrigin,
  type AvatarNavigationState,
  PlayerAvatarLayer,
} from "../entities/avatar/PlayerAvatarLayer";
import { AtmosphereVeil } from "../fx/AtmosphereVeil";
import { StormLayer } from "../fx/StormLayer";
import {
  buildTaskReadabilityPresentation,
  type TaskReadabilityPresentation,
} from "../tasking/taskReadability";
import {
  getRoomRenderData,
  MANOR_RENDER_MAP,
  MANOR_WORLD_BOUNDS,
  type ManorCorridorSegment,
  type ManorDoorNode,
  type ManorRenderRoom,
} from "../tiled/manorLayout";
import { createRoomRenderPalette } from "./renderTheme";
import {
  blackoutStrengthFromSnapshot,
  createRoomSignalMap,
  describeSignalLabel,
  eventRoomId,
  lightLevelToFactor,
  type RoomSignal,
  readableTaskLabel,
} from "./signals";
import { TaskReadabilityLayer } from "./TaskReadabilityLayer";

type RoomLayerContainers = {
  floor: Phaser.GameObjects.Container;
  props: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.Container;
  walls: Phaser.GameObjects.Container;
  interaction: Phaser.GameObjects.Container;
  focus: Phaser.GameObjects.Container;
};

type RoomVisual = {
  roomId: RoomId;
  containers: RoomLayerContainers;
  allContainers: Phaser.GameObjects.Container[];
  shellShadow: Phaser.GameObjects.Image;
  shell: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  floorSpecular: Phaser.GameObjects.Image;
  accent: Phaser.GameObjects.Image;
  dust: Phaser.GameObjects.Image;
  ambientGlow: Phaser.GameObjects.Image;
  blackoutShade: Phaser.GameObjects.Rectangle;
  emergencyWash: Phaser.GameObjects.Image;
  decorObjects: Phaser.GameObjects.Shape[];
  decorHighlights: Phaser.GameObjects.Image[];
  lightGlows: Phaser.GameObjects.Image[];
  windowOverlays: Phaser.GameObjects.Image[];
  cutawayShadow: Phaser.GameObjects.Image;
  cutawayWall: Phaser.GameObjects.Image;
  cutawayTrim: Phaser.GameObjects.Rectangle;
  titlePlate: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  theme: Phaser.GameObjects.Text;
  statePlate: Phaser.GameObjects.Rectangle;
  state: Phaser.GameObjects.Text;
  clueMarker: Phaser.GameObjects.Image;
  sabotagePulse: Phaser.GameObjects.Image;
  sabotageBanner: Phaser.GameObjects.Image;
  sabotageLabel: Phaser.GameObjects.Text;
  focusBeam: Phaser.GameObjects.Image;
  focusFrame: Phaser.GameObjects.Rectangle;
  taskChips: Phaser.GameObjects.Text[];
  hitTarget: Phaser.GameObjects.Rectangle;
};

type StageLayers = {
  backdrop: Phaser.GameObjects.Container;
  floor: Phaser.GameObjects.Container;
  props: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.Container;
  walls: Phaser.GameObjects.Container;
  interaction: Phaser.GameObjects.Container;
  focus: Phaser.GameObjects.Container;
};

type CorridorVisual = {
  segment: ManorCorridorSegment;
  shellShadow: Phaser.GameObjects.Image;
  shell: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  specular: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  trim: Phaser.GameObjects.Rectangle;
};

type DoorNodeVisual = {
  node: ManorDoorNode;
  threshold: Phaser.GameObjects.Rectangle;
  frame: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Image;
  marker: Phaser.GameObjects.Rectangle;
};

export type SeatResolver = (
  roomId: RoomId,
  seatIndex: number,
  seatCount: number,
) => { x: number; y: number };

export type ManorWorldStageRenderOptions = {
  snapshot: MatchSnapshot;
  focusRoomId: RoomId | null;
  inspection: InspectionPresentation;
  phaseId?: PhaseId;
  seatResolver: SeatResolver;
  positionOverrides?: ReadonlyMap<string, { x: number; y: number }>;
  movementOrigins?: ReadonlyMap<string, AvatarMovementOrigin>;
  showTaskChips?: boolean;
};

type ManorWorldStageOptions = {
  scene: Phaser.Scene;
  onInspectRoom?: (roomId: RoomId) => void;
  onStartTask?: (taskId: TaskId) => void;
};

const STAGE_DEPTH = {
  backdrop: 10,
  floor: 30,
  props: 55,
  lights: 85,
  walls: 150,
  interaction: 175,
  focus: 190,
} as const;

const taskChipStyle = {
  color: "#091018",
  backgroundColor: "#ead08c",
  fontFamily: "Segoe UI, sans-serif",
  fontSize: "11px",
  padding: { left: 9, right: 9, top: 4, bottom: 4 },
} as const;

const createDecorShape = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  decor: ManorRenderRoom["decor"][number],
) => {
  const x = decor.x - room.x;
  const y = decor.y - room.y + room.framing.floorInsetY;

  if (decor.ellipse) {
    return scene.add.ellipse(
      x,
      y,
      decor.width,
      decor.height,
      decor.fill,
      decor.alpha,
    );
  }

  return scene.add.rectangle(
    x,
    y,
    decor.width,
    decor.height,
    decor.fill,
    decor.alpha,
  );
};

export class ManorWorldStage {
  readonly #scene: Phaser.Scene;
  readonly #soundBus = new SoundBus();
  readonly #roomVisuals = new Map<RoomId, RoomVisual>();
  readonly #corridorVisuals: CorridorVisual[] = [];
  readonly #doorNodeVisuals: DoorNodeVisual[] = [];
  readonly #playerLayer: PlayerAvatarLayer;
  readonly #taskReadabilityLayer: TaskReadabilityLayer;
  readonly #stormLayer: StormLayer;
  readonly #atmosphereVeil: AtmosphereVeil;
  readonly #layers: StageLayers;
  readonly #onInspectRoom: ((roomId: RoomId) => void) | null;
  readonly #onStartTask: ((taskId: TaskId) => void) | null;
  #activeRoomId: RoomId | null = null;
  #inspectedRoomId: RoomId | null = null;
  #cameraTargetRoomId: RoomId | null = null;
  #hoveredRoomId: RoomId | null = null;
  #baseZoom = 1;
  #lastSnapshot: MatchSnapshot | null = null;
  #phaseId: PhaseId | null = null;
  readonly #lastNavigationStates = new Map<string, AvatarNavigationState>();
  #movementFeedbackStates: PublicMovementFeedbackState[] = [];
  #stormPressure = 0;

  constructor(options: ManorWorldStageOptions) {
    this.#scene = options.scene;
    this.#onInspectRoom = options.onInspectRoom ?? null;
    this.#onStartTask = options.onStartTask ?? null;
    this.#layers = {
      backdrop: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.backdrop),
      floor: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.floor),
      props: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.props),
      lights: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.lights),
      walls: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.walls),
      interaction: this.#scene.add
        .container(0, 0)
        .setDepth(STAGE_DEPTH.interaction),
      focus: this.#scene.add.container(0, 0).setDepth(STAGE_DEPTH.focus),
    };
    this.#playerLayer = new PlayerAvatarLayer(this.#scene);
    this.#taskReadabilityLayer = new TaskReadabilityLayer({
      scene: this.#scene,
    });
    this.#stormLayer = new StormLayer(this.#scene);
    this.#atmosphereVeil = new AtmosphereVeil(this.#scene);

    this.#drawBackdrop();
    this.#drawCirculation();
    this.#drawRooms();
    this.#drawDoorNodes();
    this.#stormLayer.setBackdropBands(MANOR_RENDER_MAP.backdropRects);
    this.#stormLayer.setWindows(
      MANOR_RENDER_MAP.roomOrder.flatMap(
        (roomId) => MANOR_RENDER_MAP.rooms[roomId].windows,
      ),
    );

    this.#baseZoom = this.#calculateZoom();
    this.#scene.cameras.main.setBounds(
      0,
      0,
      MANOR_WORLD_BOUNDS.width,
      MANOR_WORLD_BOUNDS.height,
    );
    this.#scene.cameras.main.centerOn(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
    );
    this.#scene.cameras.main.setZoom(this.#baseZoom);
    this.#handleResize(this.#scene.scale.gameSize);
  }

  update(delta: number) {
    this.#playerLayer.update(delta);
    const navigationStates = this.#playerLayer.getNavigationStates();
    const phaseId = this.#phaseId ?? this.#lastSnapshot?.phaseId;

    if (phaseId) {
      const cues = deriveNavigationSoundCues({
        previousNavigationStates: this.#lastNavigationStates,
        navigationStates,
        phaseId,
      });

      for (const cue of cues) {
        this.#soundBus.play(
          cue.cueId,
          cue.intensity === undefined ? {} : { intensity: cue.intensity },
        );
      }
    }

    this.#movementFeedbackStates =
      deriveMovementFeedbackStates(navigationStates);
    this.#soundBus.syncMovement(this.#movementFeedbackStates, delta);

    for (const [playerId, state] of navigationStates.entries()) {
      this.#lastNavigationStates.set(playerId, state);
    }

    for (const playerId of [...this.#lastNavigationStates.keys()]) {
      if (!navigationStates.has(playerId)) {
        this.#lastNavigationStates.delete(playerId);
      }
    }

    this.#stormLayer.update(delta);
    this.#atmosphereVeil.setLightningLevel(
      this.#stormLayer.lightningStrength ?? 0,
    );
    this.#atmosphereVeil.update();
  }

  getAvatarNavigationStates() {
    return this.#playerLayer.getNavigationStates();
  }

  resize(gameSize?: Phaser.Structs.Size) {
    this.#handleResize(gameSize);
  }

  render(options: ManorWorldStageRenderOptions) {
    const phaseId = options.phaseId ?? options.snapshot.phaseId;
    const signals = createRoomSignalMap(options.snapshot);
    const taskReadability = buildTaskReadabilityPresentation(options.snapshot);
    const activeRoomId =
      options.focusRoomId ??
      [...options.snapshot.recentEvents]
        .reverse()
        .map((event) => eventRoomId(event))
        .find((roomId): roomId is RoomId => roomId !== null) ??
      options.snapshot.rooms[0]?.roomId ??
      null;
    const inspectionRoomId =
      options.inspection.mode === "inspect"
        ? (options.inspection.roomId ?? activeRoomId)
        : null;
    this.#activeRoomId = activeRoomId;
    this.#inspectedRoomId = inspectionRoomId;

    if (inspectionRoomId) {
      this.#focusRoom(inspectionRoomId, options.inspection.immediate);
    } else {
      this.#focusWholeManor(options.inspection.immediate);
    }

    const stormPressure =
      options.snapshot.rooms.filter(
        (roomState) => roomState.lightLevel === "blackout",
      ).length / Math.max(1, options.snapshot.rooms.length);
    this.#stormPressure = stormPressure;
    this.#stormLayer.setStormIntensity(0.72 + stormPressure * 0.28);

    for (const roomState of options.snapshot.rooms) {
      const visual = this.#roomVisuals.get(roomState.roomId);
      const signal = signals.get(roomState.roomId);

      if (!visual || !signal) {
        continue;
      }

      this.#applyRoomState(
        visual,
        getRoomRenderData(roomState.roomId),
        roomState,
        signal,
        options.showTaskChips ?? false,
        options.snapshot,
        taskReadability,
      );
    }

    this.#taskReadabilityLayer.render({
      presentation: taskReadability,
      phaseId,
      focusRoomId: this.#activeRoomId,
      hoveredRoomId: this.#hoveredRoomId,
      inspectionRoomId: this.#inspectedRoomId,
      showTaskChips: options.showTaskChips ?? false,
    });
    this.#playerLayer.render(
      options.snapshot.players,
      options.snapshot.recentEvents,
      phaseId,
      options.seatResolver,
      options.positionOverrides,
      options.movementOrigins,
      taskReadability,
      this.#inspectedRoomId,
    );
    const snapshotCues = deriveSnapshotSoundCues({
      previousSnapshot:
        this.#lastSnapshot && this.#lastSnapshot.tick <= options.snapshot.tick
          ? this.#lastSnapshot
          : null,
      snapshot: options.snapshot,
      taskReadability,
    });

    for (const cue of snapshotCues) {
      this.#soundBus.play(
        cue.cueId,
        cue.intensity === undefined ? {} : { intensity: cue.intensity },
      );
    }

    this.#soundBus.syncAmbience(
      deriveAmbienceState({
        snapshot: options.snapshot,
        focusedRoomId: inspectionRoomId ?? activeRoomId,
        stormLevel: 0.72 + stormPressure * 0.28,
      }),
    );
    this.#atmosphereVeil.setBlackoutLevel(
      blackoutStrengthFromSnapshot(options.snapshot),
    );
    this.#refreshRoomFocus();
    this.#lastSnapshot = options.snapshot;
    this.#phaseId = phaseId;
  }

  destroy() {
    this.#soundBus.destroy();
    this.#playerLayer.destroy();
    this.#taskReadabilityLayer.destroy();
    this.#stormLayer.destroy();
    this.#atmosphereVeil.destroy();

    for (const layer of Object.values(this.#layers)) {
      layer.destroy(true);
    }

    this.#roomVisuals.clear();
    this.#lastNavigationStates.clear();
  }

  #drawBackdrop() {
    const graphics = this.#scene.add.graphics();
    this.#layers.backdrop.add(graphics);

    for (const rect of MANOR_RENDER_MAP.backdropRects) {
      if (rect.className === "weather-band") {
        continue;
      }

      if (rect.stroke !== null) {
        graphics.lineStyle(2, rect.stroke, rect.alpha * 0.4);
      } else {
        graphics.lineStyle(0, 0, 0);
      }

      graphics.fillStyle(rect.fill, rect.alpha);
      graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 32);
    }

    const manorShadow = this.#scene.add
      .image(
        MANOR_WORLD_BOUNDS.width / 2,
        MANOR_WORLD_BOUNDS.height / 2 + 24,
        "room-shadow",
      )
      .setDisplaySize(
        MANOR_WORLD_BOUNDS.width * 0.96,
        MANOR_WORLD_BOUNDS.height * 0.82,
      )
      .setAlpha(0.34);
    const coldRim = this.#scene.add
      .image(MANOR_WORLD_BOUNDS.width / 2, 110, "storm-cloud")
      .setDisplaySize(MANOR_WORLD_BOUNDS.width * 0.92, 180)
      .setTint(0x79abd3)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.16);

    this.#layers.backdrop.add([manorShadow, coldRim]);
  }

  #drawCirculation() {
    for (const segment of MANOR_RENDER_MAP.corridors) {
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
      const floorTint = isTechnical
        ? 0x2b3d44
        : isMeetingWing
          ? 0x4a3529
          : 0x322a24;
      const accentTint = isTechnical ? 0x7fb7cf : 0xd5b183;
      const shellShadow = this.#scene.add
        .image(centerX, centerY + 10, "room-shadow")
        .setDisplaySize(segment.width + 36, segment.height + 28)
        .setAlpha(0.26);
      const shell = this.#scene.add
        .image(centerX, centerY + 4, "room-shell")
        .setDisplaySize(segment.width + 18, segment.height + 16)
        .setTint(shellTint)
        .setAlpha(0.95);
      const floor = this.#scene.add
        .image(centerX, centerY + 4, "room-floor")
        .setDisplaySize(segment.width, segment.height)
        .setTint(floorTint)
        .setAlpha(0.96);
      const specular = this.#scene.add
        .image(centerX, centerY + 4, "room-specular")
        .setDisplaySize(
          Math.max(42, segment.width - 10),
          Math.max(32, segment.height - 10),
        )
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setTint(isTechnical ? 0x96daf0 : 0xf0d39a)
        .setAlpha(0.12);
      const glow = this.#scene.add
        .image(centerX, centerY, "room-glow")
        .setDisplaySize(segment.width * 1.18, segment.height * 0.82)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setTint(isTechnical ? 0x79bfd8 : 0xd9ac72)
        .setAlpha(isTechnical ? 0.12 : 0.08);
      const trim = this.#scene.add
        .rectangle(
          centerX,
          centerY - segment.height / 2 + 6,
          segment.width - 10,
          8,
          accentTint,
          0.22,
        )
        .setOrigin(0.5);

      this.#layers.floor.add([shellShadow, shell, floor, specular]);
      this.#layers.lights.add(glow);
      this.#layers.walls.add(trim);

      this.#corridorVisuals.push({
        segment,
        shellShadow,
        shell,
        floor,
        specular,
        glow,
        trim,
      });
    }
  }

  #drawRooms() {
    for (const roomId of MANOR_RENDER_MAP.roomOrder) {
      const room = getRoomRenderData(roomId);
      const containers = {
        floor: this.#scene.add.container(room.x, room.y),
        props: this.#scene.add.container(room.x, room.y),
        lights: this.#scene.add.container(room.x, room.y),
        walls: this.#scene.add.container(room.x, room.y),
        interaction: this.#scene.add.container(room.x, room.y),
        focus: this.#scene.add.container(room.x, room.y),
      } satisfies RoomLayerContainers;
      const allContainers = Object.values(containers);

      this.#layers.floor.add(containers.floor);
      this.#layers.props.add(containers.props);
      this.#layers.lights.add(containers.lights);
      this.#layers.walls.add(containers.walls);
      this.#layers.interaction.add(containers.interaction);
      this.#layers.focus.add(containers.focus);

      const shellShadow = this.#scene.add
        .image(0, 18, "room-shadow")
        .setDisplaySize(
          room.width + room.framing.shellPaddingX * 3.2,
          room.height + room.framing.shellPaddingY * 2.2,
        )
        .setAlpha(0.34);
      const shell = this.#scene.add
        .image(0, 6, "room-shell")
        .setDisplaySize(
          room.width + room.framing.shellPaddingX * 2,
          room.height + room.framing.shellPaddingY * 2,
        )
        .setAlpha(0.98);
      const floor = this.#scene.add
        .image(0, room.framing.floorInsetY, "room-floor")
        .setDisplaySize(room.width, room.height)
        .setAlpha(0.97);
      const floorSpecular = this.#scene.add
        .image(0, room.framing.floorInsetY, "room-specular")
        .setDisplaySize(room.width * 0.98, room.height * 0.98)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.22);
      const accent = this.#scene.add
        .image(0, room.framing.floorInsetY + 16, "room-floor")
        .setDisplaySize(room.width * 0.8, room.height * 0.58)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.14);
      const dust = this.#scene.add
        .image(0, room.framing.floorInsetY, "room-dust")
        .setDisplaySize(room.width * 0.96, room.height * 0.9)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.16);
      const ambientGlow = this.#scene.add
        .image(0, room.framing.floorInsetY, "room-glow")
        .setDisplaySize(room.width * 1.18, room.height * 1.02)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.4);
      const blackoutShade = this.#scene.add
        .rectangle(
          0,
          room.framing.floorInsetY,
          room.width * 0.98,
          room.height * 0.92,
          0x04070b,
          0.12,
        )
        .setStrokeStyle(0, 0, 0);
      const emergencyWash = this.#scene.add
        .image(0, room.framing.floorInsetY, "focus-beam")
        .setDisplaySize(room.width * 1.08, room.height * 0.92)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.06);

      const decorObjects = room.decor.map((decor) => {
        const object = createDecorShape(this.#scene, room, decor);
        object.setBlendMode(Phaser.BlendModes.MULTIPLY);
        return object;
      });
      const decorHighlights = room.decor.map((decor) =>
        this.#scene.add
          .image(
            decor.x - room.x,
            decor.y - room.y + room.framing.floorInsetY,
            "room-specular",
          )
          .setDisplaySize(decor.width * 1.08, decor.height * 1.08)
          .setBlendMode(Phaser.BlendModes.SCREEN)
          .setAlpha(0.08),
      );

      const lightGlows = room.lights.map((light) =>
        this.#scene.add
          .image(light.x - room.x, light.y - room.y - 6, "room-glow")
          .setDisplaySize(light.radius * 1.65, light.radius * 1.04)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(light.intensity * 0.55),
      );

      const windowOverlays = room.windows.map((windowSlice) =>
        this.#scene.add
          .image(windowSlice.x - room.x, windowSlice.y - room.y, "rain-sheen")
          .setDisplaySize(windowSlice.width, windowSlice.height)
          .setBlendMode(Phaser.BlendModes.SCREEN)
          .setAlpha(windowSlice.alpha * 0.7),
      );

      const cutawayShadow = this.#scene.add
        .image(0, -room.height / 2 + room.cutawayHeight / 2 + 10, "room-shadow")
        .setDisplaySize(
          room.width + room.framing.shellPaddingX * 2.4,
          room.cutawayHeight + 26,
        )
        .setAlpha(0.24);
      const cutawayWall = this.#scene.add
        .image(
          0,
          -room.height / 2 + room.cutawayHeight / 2 + room.framing.wallInsetY,
          "room-wall",
        )
        .setDisplaySize(
          room.width + room.framing.wallInsetX * 2,
          room.cutawayHeight + 12,
        )
        .setAlpha(0.9);
      const cutawayTrim = this.#scene.add
        .rectangle(
          0,
          -room.height / 2 + 10,
          room.width - 20,
          10,
          room.accentColor,
          0.28,
        )
        .setOrigin(0.5);
      const titlePlate = this.#scene.add
        .rectangle(
          0,
          room.anchors.titleY + 6,
          Math.min(room.width - 30, 228),
          34,
          room.surfaces.titlePlateColor,
          0.22,
        )
        .setStrokeStyle(1, room.accentColor, 0.12);
      const title = this.#scene.add.text(
        0,
        room.anchors.titleY,
        DEFAULT_ROOM_LABELS[room.roomId],
        {
          color: "#f5f0e4",
          fontFamily: "Palatino Linotype, Georgia, serif",
          fontSize: "20px",
          fontStyle: "bold",
        },
      );
      title.setOrigin(0.5);
      const theme = this.#scene.add.text(0, room.anchors.themeY, room.theme, {
        color: "#d8e1eb",
        fontFamily: "Georgia, Times, serif",
        fontSize: "12px",
        fontStyle: "italic",
      });
      theme.setOrigin(0.5);
      const statePlate = this.#scene.add
        .rectangle(
          0,
          room.anchors.stateY,
          Math.min(room.width - 20, 240),
          28,
          room.surfaces.statePlateColor,
          0.18,
        )
        .setStrokeStyle(1, room.accentColor, 0.1);
      const state = this.#scene.add.text(0, room.anchors.stateY - 8, "", {
        color: "#dce4ed",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "12px",
        letterSpacing: 1,
      });
      state.setOrigin(0.5);

      const taskChips =
        MANOR_V1_MAP.rooms
          .find((candidate) => candidate.id === room.roomId)
          ?.taskIds.map((taskId, index) => {
            const chip = this.#scene.add.text(
              room.anchors.taskStartX,
              room.anchors.taskStartY + index * 24,
              readableTaskLabel(taskId),
              taskChipStyle,
            );
            chip.setOrigin(0, 0.5);
            chip.setInteractive({ useHandCursor: true });
            chip.on("pointerdown", () => {
              this.#onInspectRoom?.(room.roomId);
              this.#onStartTask?.(taskId);
            });
            return chip;
          }) ?? [];

      const clueMarker = this.#scene.add
        .image(
          room.cluePoint.x - room.x,
          room.cluePoint.y - room.y,
          "clue-marker",
        )
        .setDisplaySize(42, 42)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0);
      const sabotagePulse = this.#scene.add
        .image(0, room.anchors.sabotageY + 14, "signal-pulse")
        .setDisplaySize(room.width * 0.52, 78)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      this.#scene.tweens.add({
        targets: sabotagePulse,
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
        repeat: -1,
        duration: 900,
        ease: "Sine.easeInOut",
      });
      this.#scene.tweens.add({
        targets: clueMarker,
        scaleX: 1.16,
        scaleY: 1.16,
        yoyo: true,
        repeat: -1,
        duration: 820,
        ease: "Sine.easeInOut",
      });

      const sabotageBanner = this.#scene.add
        .image(0, room.anchors.sabotageY, "sabotage-stripe")
        .setDisplaySize(room.width * 0.84, 44)
        .setAlpha(0);
      const sabotageLabel = this.#scene.add.text(
        0,
        room.anchors.sabotageY,
        "",
        {
          color: "#fff6ed",
          fontFamily: "Segoe UI, sans-serif",
          fontSize: "13px",
          fontStyle: "bold",
          letterSpacing: 1.2,
        },
      );
      sabotageLabel.setOrigin(0.5);
      sabotageLabel.setAlpha(0);
      const focusBeam = this.#scene.add
        .image(0, room.framing.floorInsetY, "focus-beam")
        .setDisplaySize(
          room.width + room.framing.focusPaddingX * 2,
          room.height + room.framing.focusPaddingY * 2,
        )
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0);
      const focusFrame = this.#scene.add
        .rectangle(
          0,
          room.framing.floorInsetY,
          room.width + room.framing.focusPaddingX * 2,
          room.height + room.framing.focusPaddingY * 2,
        )
        .setStrokeStyle(2, room.accentColor, 0)
        .setFillStyle(room.accentColor, 0)
        .setOrigin(0.5);
      const hitTarget = this.#scene.add
        .rectangle(
          0,
          room.framing.floorInsetY,
          room.width,
          room.height,
          0xffffff,
          0.001,
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hitTarget.on("pointerover", () => {
        this.#hoveredRoomId = room.roomId;
        this.#refreshRoomFocus();
      });
      hitTarget.on("pointerout", () => {
        this.#hoveredRoomId = null;
        this.#refreshRoomFocus();
      });
      hitTarget.on("pointerdown", () => {
        this.#soundBus.play("hover");
        this.#onInspectRoom?.(room.roomId);
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
        ambientGlow,
        blackoutShade,
        emergencyWash,
        ...decorObjects,
        ...decorHighlights,
      ]);
      containers.lights.add([...lightGlows, ...windowOverlays]);
      containers.walls.add([
        cutawayShadow,
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

      this.#roomVisuals.set(room.roomId, {
        roomId: room.roomId,
        containers,
        allContainers,
        shellShadow,
        shell,
        floor,
        floorSpecular,
        accent,
        dust,
        ambientGlow,
        blackoutShade,
        emergencyWash,
        decorObjects,
        decorHighlights,
        lightGlows,
        windowOverlays,
        cutawayShadow,
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
  }

  #drawDoorNodes() {
    for (const node of MANOR_RENDER_MAP.doorNodes) {
      const threshold = this.#scene.add
        .rectangle(
          node.x,
          node.y,
          node.width,
          node.height,
          node.fill,
          node.alpha,
        )
        .setOrigin(0.5);
      const frame = this.#scene.add
        .rectangle(
          node.x,
          node.y,
          node.width + 10,
          node.height + 10,
          0xffffff,
          0,
        )
        .setStrokeStyle(2, node.stroke ?? 0xe4c391, 0.28)
        .setOrigin(0.5);
      const glow = this.#scene.add
        .image(node.x, node.y, "focus-beam")
        .setDisplaySize(
          Math.max(42, node.width * 2.1),
          Math.max(42, node.height * 2.1),
        )
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setTint(node.kind === "stair" ? 0xf1e3b6 : 0xdab37c)
        .setAlpha(0.05);
      const marker = this.#scene.add
        .rectangle(
          node.x,
          node.y,
          Math.max(8, Math.min(node.width, 14)),
          Math.max(8, Math.min(node.height, 14)),
          node.stroke ?? 0xe4c391,
          0.72,
        )
        .setOrigin(0.5);

      this.#layers.floor.add(threshold);
      this.#layers.lights.add(glow);
      this.#layers.walls.add(frame);
      this.#layers.interaction.add(marker);

      this.#doorNodeVisuals.push({
        node,
        threshold,
        frame,
        glow,
        marker,
      });
    }
  }

  #applyRoomState(
    visual: RoomVisual,
    room: ManorRenderRoom,
    roomState: MatchSnapshot["rooms"][number],
    signal: RoomSignal,
    showTaskChips: boolean,
    snapshot: MatchSnapshot,
    taskReadability: TaskReadabilityPresentation,
  ) {
    const focused = this.#activeRoomId === room.roomId;
    const palette = createRoomRenderPalette({
      room,
      roomState,
      signal,
      focused,
    });
    const lightFactor = lightLevelToFactor(roomState.lightLevel);

    visual.shell.setTint(palette.shellFill);
    visual.shell.setAlpha(0.97);
    visual.floor.setTint(palette.floorTint);
    visual.floorSpecular.setTint(palette.floorSpecularTint);
    visual.floorSpecular.setAlpha(0.12 + lightFactor * 0.14);
    visual.accent.setTint(palette.accentTint);
    visual.accent.setAlpha(0.12 + lightFactor * 0.08);
    visual.dust.setTint(palette.dustTint);
    visual.dust.setAlpha(0.07 + roomState.occupantIds.length * 0.012);
    visual.ambientGlow.setTint(palette.ambienceTint);
    visual.ambientGlow.setAlpha(
      0.14 + lightFactor * 0.2 + roomState.occupantIds.length * 0.014,
    );
    visual.blackoutShade.setAlpha(palette.blackoutOverlayAlpha);
    visual.emergencyWash.setTint(palette.emergencyTint);
    visual.emergencyWash.setAlpha(palette.emergencyAlpha);
    visual.cutawayWall.setTint(palette.cutawayTint);
    visual.cutawayShadow.setAlpha(palette.cutawayShadowAlpha);
    visual.cutawayTrim.setFillStyle(room.accentColor, focused ? 0.42 : 0.24);
    visual.titlePlate.setFillStyle(
      room.surfaces.titlePlateColor,
      focused ? 0.28 : 0.2,
    );
    visual.titlePlate.setStrokeStyle(
      1,
      palette.shellStroke,
      focused ? 0.18 : 0.12,
    );
    visual.statePlate.setFillStyle(palette.statePlateTint, 0.32);
    visual.statePlate.setStrokeStyle(1, palette.shellStroke, 0.1);
    visual.title.setColor(lightFactor < 0.2 ? "#f0f4f7" : "#f5f0e4");
    visual.theme.setAlpha(0.64 + lightFactor * 0.18);
    visual.state.setText(
      `${describeSignalLabel(roomState, signal)} · ${roomState.occupantIds.length} present`,
    );

    for (const [index, object] of visual.decorObjects.entries()) {
      const decor = room.decor[index];

      if (!decor) {
        continue;
      }

      object.setFillStyle(
        decor.fill,
        decor.alpha + roomState.occupantIds.length * 0.01,
      );
    }

    for (const [index, highlight] of visual.decorHighlights.entries()) {
      const decor = room.decor[index];

      if (!decor) {
        continue;
      }

      highlight.setTint(palette.floorSpecularTint);
      highlight.setAlpha(
        0.03 + lightFactor * 0.07 + roomState.occupantIds.length * 0.004,
      );
    }

    for (const [index, lightGlow] of visual.lightGlows.entries()) {
      const light = room.lights[index];

      if (!light) {
        continue;
      }

      lightGlow.setTint(light.color);
      lightGlow.setAlpha(light.intensity * (0.14 + lightFactor * 0.56));
    }

    for (const [index, windowOverlay] of visual.windowOverlays.entries()) {
      const windowSlice = room.windows[index];

      if (!windowSlice) {
        continue;
      }

      windowOverlay.setTint(windowSlice.fill);
      windowOverlay.setAlpha(windowSlice.alpha * palette.windowAlpha);
    }

    visual.clueMarker
      .setVisible(signal.clue || signal.body)
      .setTint(signal.body ? 0xff8b78 : 0xffe38d)
      .setAlpha(signal.clue || signal.body ? 0.9 : 0);
    visual.sabotagePulse
      .setVisible(
        signal.sabotage ||
          roomState.lightLevel === "blackout" ||
          roomState.doorState !== "open",
      )
      .setTint(
        signal.sabotage
          ? 0xf1b27e
          : roomState.lightLevel === "blackout"
            ? 0x86a7ff
            : 0xf0d99a,
      )
      .setAlpha(
        signal.sabotage ||
          roomState.lightLevel === "blackout" ||
          roomState.doorState !== "open"
          ? 0.18
          : 0,
      );
    visual.sabotageBanner.setVisible(
      signal.sabotage ||
        roomState.doorState !== "open" ||
        roomState.lightLevel === "blackout",
    );
    visual.sabotageLabel.setVisible(visual.sabotageBanner.visible);

    const sabotageText =
      signal.sabotageLabel ??
      (roomState.doorState === "sealed"
        ? "Room Sealed"
        : roomState.doorState === "jammed"
          ? "Door Jammed"
          : roomState.lightLevel === "blackout"
            ? "Blackout"
            : "");
    visual.sabotageBanner.setAlpha(sabotageText ? 0.94 : 0);
    visual.sabotageLabel.setAlpha(sabotageText ? 1 : 0);
    visual.sabotageLabel.setText(sabotageText);

    this.#applyTaskStateLabels(
      visual,
      roomState.roomId,
      roomState.lightLevel,
      snapshot,
      showTaskChips,
      taskReadability,
    );
  }

  #applyTaskStateLabels(
    visual: RoomVisual,
    roomId: RoomId,
    lightLevel: MatchSnapshot["rooms"][number]["lightLevel"],
    snapshot: MatchSnapshot,
    showTaskChips: boolean,
    taskReadability: TaskReadabilityPresentation,
  ) {
    const roomTasks = snapshot.tasks.filter((task) => task.roomId === roomId);
    const lightFactor = lightLevelToFactor(lightLevel);
    const hasImportantTaskCue =
      taskReadability.rooms
        .get(roomId)
        ?.some((task) => task.tone !== "available") ?? false;
    const showRoomTaskChips =
      showTaskChips &&
      ((this.#inspectedRoomId ?? this.#activeRoomId) === roomId ||
        hasImportantTaskCue);

    for (const [index, chip] of visual.taskChips.entries()) {
      const task = roomTasks[index];

      if (!showRoomTaskChips || !task) {
        chip.setVisible(false);
        continue;
      }

      chip.setVisible(true);
      chip.setText(
        `${readableTaskLabel(task.taskId)} ${Math.round(task.progress * 100)}%`,
      );
      chip.setStyle({
        color: task.status === "completed" ? "#06250f" : "#091018",
        backgroundColor:
          task.status === "completed"
            ? "#8ee7ba"
            : task.status === "blocked"
              ? "#ff9a76"
              : task.status === "in-progress"
                ? "#f2d998"
                : "#ead08c",
      });
      chip.setAlpha(0.74 + lightFactor * 0.2);
    }
  }

  #focusRoom(roomId: RoomId, immediate: boolean) {
    if (this.#cameraTargetRoomId === roomId && !immediate) {
      return;
    }

    const room = getRoomRenderData(roomId);
    this.#cameraTargetRoomId = roomId;
    const duration = immediate ? 0 : 520;

    this.#scene.cameras.main.pan(
      room.cameraAnchor.x,
      room.cameraAnchor.y,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#scene.cameras.main.zoomTo(
      this.#baseZoom * room.focusZoom,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#refreshRoomFocus();
  }

  #focusWholeManor(immediate: boolean) {
    if (this.#cameraTargetRoomId === null && !immediate) {
      return;
    }

    this.#cameraTargetRoomId = null;
    const duration = immediate ? 0 : 520;

    this.#scene.cameras.main.pan(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#scene.cameras.main.zoomTo(
      this.#baseZoom,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#refreshRoomFocus();
  }

  #refreshRoomFocus() {
    for (const [roomId, visual] of this.#roomVisuals.entries()) {
      const focused = this.#activeRoomId === roomId;
      const inspected = this.#inspectedRoomId === roomId;
      const hovered = this.#hoveredRoomId === roomId;
      const room = getRoomRenderData(roomId);
      const scale = inspected ? 1.045 : focused ? 1.018 : hovered ? 1.01 : 1;
      const dimmed = this.#inspectedRoomId !== null && !inspected;
      const alpha = dimmed ? (focused ? 0.7 : 0.42) : 1;

      for (const container of visual.allContainers) {
        container.setScale(scale);
        container.setAlpha(alpha);
      }

      visual.focusBeam
        .setTint(room.surfaces.focusColor)
        .setAlpha(inspected ? 0.34 : focused ? 0.22 : hovered ? 0.08 : 0);
      visual.focusFrame.setStrokeStyle(
        2,
        room.surfaces.focusColor,
        inspected ? 0.94 : focused ? 0.86 : hovered ? 0.4 : 0,
      );
      visual.hitTarget.setFillStyle(
        0xffffff,
        hovered && !inspected ? 0.03 : 0.001,
      );
      visual.cutawayWall.setAlpha(inspected ? 0.98 : focused ? 0.9 : 0.82);
      visual.cutawayTrim.setFillStyle(
        room.accentColor,
        inspected ? 0.54 : focused ? 0.42 : 0.24,
      );
      visual.titlePlate.setFillStyle(
        room.surfaces.titlePlateColor,
        inspected ? 0.34 : focused ? 0.28 : 0.2,
      );
    }

    for (const visual of this.#doorNodeVisuals) {
      const emphasized =
        visual.node.roomId === this.#activeRoomId ||
        visual.node.roomId === this.#hoveredRoomId ||
        visual.node.targetRoomIds.includes(
          this.#activeRoomId ?? visual.node.roomId,
        ) ||
        visual.node.targetRoomIds.includes(
          this.#hoveredRoomId ?? visual.node.roomId,
        );
      const inspected =
        visual.node.roomId === this.#inspectedRoomId ||
        visual.node.targetRoomIds.includes(
          this.#inspectedRoomId ?? visual.node.roomId,
        );

      visual.threshold.setAlpha(
        inspected
          ? visual.node.alpha
          : emphasized
            ? visual.node.alpha
            : visual.node.alpha * 0.74,
      );
      visual.frame.setStrokeStyle(
        2,
        visual.node.stroke ?? 0xe4c391,
        inspected ? 0.72 : emphasized ? 0.6 : 0.22,
      );
      visual.glow.setAlpha(inspected ? 0.18 : emphasized ? 0.12 : 0.035);
      visual.marker.setAlpha(inspected ? 1 : emphasized ? 0.9 : 0.5);
    }
  }

  #calculateZoom() {
    return Math.min(
      this.#scene.scale.width / (MANOR_WORLD_BOUNDS.width + 160),
      this.#scene.scale.height / (MANOR_WORLD_BOUNDS.height + 140),
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    const width = gameSize?.width ?? this.#scene.scale.width;
    const height = gameSize?.height ?? this.#scene.scale.height;

    this.#baseZoom = this.#calculateZoom();
    this.#atmosphereVeil.resize(width, height);
    if (this.#lastSnapshot) {
      this.#soundBus.syncAmbience(
        deriveAmbienceState({
          snapshot: this.#lastSnapshot,
          focusedRoomId: this.#inspectedRoomId ?? this.#activeRoomId,
          stormLevel: 0.72 + this.#stormPressure * 0.28,
        }),
      );
    }

    if (this.#cameraTargetRoomId) {
      const focusedRoom = getRoomRenderData(this.#cameraTargetRoomId);
      this.#scene.cameras.main.centerOn(
        focusedRoom.cameraAnchor.x,
        focusedRoom.cameraAnchor.y,
      );
      this.#scene.cameras.main.setZoom(this.#baseZoom * focusedRoom.focusZoom);
      return;
    }

    this.#scene.cameras.main.centerOn(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
    );
    this.#scene.cameras.main.setZoom(this.#baseZoom);
  }
}
