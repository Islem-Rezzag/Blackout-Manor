import type {
  MatchSnapshot,
  PhaseId,
  RoomId,
  TaskId,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import {
  deriveAmbienceState,
  deriveMovementFeedbackStates,
  deriveNavigationSoundCues,
  deriveSnapshotSoundCues,
  type PublicMovementFeedbackState,
} from "../audio/publicEventFeedback";
import { SoundBus } from "../audio/SoundBus";
import type { CameraPlan, InspectionPresentation } from "../directors/types";
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
  MANOR_WORLD_BOUNDS,
  type ManorRenderRoom,
} from "../tiled/manorLayout";
import {
  type DirectedCameraPlan,
  resolveDirectedCameraPlan,
  type StageDirectionVariant,
} from "./cameraDirection";
import {
  createEnvironmentFocusContext,
  EnvironmentRenderer,
} from "./environment/EnvironmentRenderer";
import type {
  EnvironmentRoomVisual,
  EnvironmentStageLayers,
} from "./environment/EnvironmentRenderTypes";
import { configureEnvironmentStormLayer } from "./environment/LightingWeatherRenderer";
import { createRoomRenderPalette } from "./renderTheme";
import {
  blackoutStrengthFromSnapshot,
  createRoomSignalMap,
  describeSignalLabel,
  eventRoomId,
  lightLevelToFactor,
  mixColor,
  type RoomSignal,
  readableTaskLabel,
} from "./signals";
import { TaskReadabilityLayer } from "./TaskReadabilityLayer";

export type SeatResolver = (
  roomId: RoomId,
  seatIndex: number,
  seatCount: number,
) => { x: number; y: number };

export type ManorWorldStageRenderOptions = {
  snapshot: MatchSnapshot;
  camera?: CameraPlan;
  focusRoomId?: RoomId | null;
  inspection: InspectionPresentation;
  directionVariant?: StageDirectionVariant;
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

export class ManorWorldStage {
  readonly #scene: Phaser.Scene;
  readonly #soundBus = new SoundBus();
  readonly #environmentRenderer: EnvironmentRenderer;
  readonly #playerLayer: PlayerAvatarLayer;
  readonly #taskReadabilityLayer: TaskReadabilityLayer;
  readonly #stormLayer: StormLayer;
  readonly #atmosphereVeil: AtmosphereVeil;
  readonly #layers: EnvironmentStageLayers;
  readonly #onInspectRoom: ((roomId: RoomId) => void) | null;
  readonly #onStartTask: ((taskId: TaskId) => void) | null;
  #activeRoomId: RoomId | null = null;
  #inspectedRoomId: RoomId | null = null;
  #hoveredRoomId: RoomId | null = null;
  #baseZoom = 1;
  #lastSnapshot: MatchSnapshot | null = null;
  #phaseId: PhaseId | null = null;
  #directedCameraPlan: DirectedCameraPlan | null = null;
  #cameraPlanSignature = "";
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
    this.#environmentRenderer = new EnvironmentRenderer({
      scene: this.#scene,
      layers: this.#layers,
      onHoverRoomChange: (roomId) => {
        this.#hoveredRoomId = roomId;
        this.#refreshRoomFocus();
      },
      onInspectRoom: (roomId) => {
        this.#onInspectRoom?.(roomId);
      },
      onSelectRoom: (roomId) => {
        this.#soundBus.play("hover");
        this.#onInspectRoom?.(roomId);
      },
      onStartTask: (taskId) => {
        this.#onStartTask?.(taskId);
      },
    });

    this.#environmentRenderer.draw();
    configureEnvironmentStormLayer(
      this.#stormLayer,
      this.#environmentRenderer.plan,
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
    const fallbackRoomId =
      options.focusRoomId ??
      [...options.snapshot.recentEvents]
        .reverse()
        .map((event) => eventRoomId(event))
        .find((roomId): roomId is RoomId => roomId !== null) ??
      options.snapshot.rooms[0]?.roomId ??
      null;
    const camera = options.camera ?? {
      roomId: fallbackRoomId,
      immediate: options.inspection.immediate,
      reason: fallbackRoomId ? "interaction" : "default",
      detail: options.inspection.detail,
    };
    const inspectionRoomId =
      options.inspection.mode === "inspect"
        ? (options.inspection.roomId ?? camera.roomId ?? fallbackRoomId)
        : null;
    const directedPlan = resolveDirectedCameraPlan({
      camera,
      inspection: {
        ...options.inspection,
        roomId: inspectionRoomId,
      },
      variant: options.directionVariant ?? "manor",
    });
    this.#activeRoomId = directedPlan.activeRoomId;
    this.#inspectedRoomId = directedPlan.inspectionRoomId;
    this.#applyDirectedCameraPlan(directedPlan, camera.reason);

    const stormPressure =
      options.snapshot.rooms.filter(
        (roomState) => roomState.lightLevel === "blackout",
      ).length / Math.max(1, options.snapshot.rooms.length);
    this.#stormPressure = stormPressure;
    this.#stormLayer.setStormIntensity(0.72 + stormPressure * 0.28);

    for (const roomState of options.snapshot.rooms) {
      const visual = this.#environmentRenderer.roomVisuals.get(
        roomState.roomId,
      );
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
      focusRoomId: directedPlan.focusRoomId,
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
        focusedRoomId: directedPlan.focusRoomId,
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
    this.#environmentRenderer.destroy();

    for (const layer of Object.values(this.#layers)) {
      layer.destroy(true);
    }

    this.#lastNavigationStates.clear();
  }

  #applyRoomState(
    visual: EnvironmentRoomVisual,
    room: ManorRenderRoom,
    roomState: MatchSnapshot["rooms"][number],
    signal: RoomSignal,
    showTaskChips: boolean,
    snapshot: MatchSnapshot,
    taskReadability: TaskReadabilityPresentation,
  ) {
    const focused =
      (this.#directedCameraPlan?.focusRoomId ?? this.#activeRoomId) ===
      room.roomId;
    const palette = createRoomRenderPalette({
      room,
      roomState,
      signal,
      focused,
    });
    const lightFactor = lightLevelToFactor(roomState.lightLevel);
    const attentionActive =
      signal.body ||
      signal.sabotage ||
      signal.clue ||
      roomState.lightLevel !== "lit" ||
      roomState.doorState !== "open";
    const occupied = roomState.occupantIds.length > 0;
    const crowded = roomState.occupantIds.length >= 3;
    const showTheme = focused || attentionActive || crowded;
    const showState = focused || attentionActive || crowded;

    visual.shell.setTint(palette.shellFill);
    visual.shell.setAlpha(0.97);
    visual.shellShadow.setAlpha(focused ? 0.28 : 0.34);
    visual.floor.setTint(mixColor(0xffffff, palette.floorTint, 0.2));
    visual.floorSpecular.setTint(palette.floorSpecularTint);
    visual.floorSpecular.setAlpha(0.18 + lightFactor * 0.16);
    visual.accent.setTint(palette.accentTint);
    visual.accent.setAlpha(0.16 + lightFactor * 0.1 + (focused ? 0.04 : 0));
    visual.dust.setTint(palette.dustTint);
    visual.dust.setAlpha(0.1 + roomState.occupantIds.length * 0.014);
    visual.interiorVignette.setAlpha(
      0.14 + (1 - lightFactor) * 0.18 + roomState.occupantIds.length * 0.008,
    );
    visual.ambientGlow.setTint(palette.ambienceTint);
    visual.ambientGlow.setAlpha(
      0.2 + lightFactor * 0.24 + roomState.occupantIds.length * 0.016,
    );
    visual.blackoutShade.setAlpha(palette.blackoutOverlayAlpha);
    visual.emergencyWash.setTint(palette.emergencyTint);
    visual.emergencyWash.setAlpha(palette.emergencyAlpha);
    visual.cutawayBacking.setTint(
      mixColor(room.surfaces.shellColor, palette.cutawayTint, 0.38),
    );
    visual.cutawayWall.setTint(mixColor(0xffffff, palette.cutawayTint, 0.24));
    visual.cutawayShadow.setAlpha(palette.cutawayShadowAlpha);
    visual.cutawayTrim.setFillStyle(room.accentColor, focused ? 0.42 : 0.24);
    visual.titlePlate.setFillStyle(
      room.surfaces.titlePlateColor,
      focused ? 0.28 : 0.2,
    );
    visual.titlePlate.setStrokeStyle(
      1,
      palette.shellStroke,
      focused ? 0.24 : 0.14,
    );
    visual.statePlate.setFillStyle(
      palette.statePlateTint,
      focused ? 0.38 : 0.3,
    );
    visual.statePlate.setStrokeStyle(
      1,
      palette.shellStroke,
      focused ? 0.16 : 0.1,
    );
    visual.title.setColor(lightFactor < 0.2 ? "#f0f4f7" : "#f5f0e4");
    visual.title.setAlpha(
      signal.body || signal.sabotage
        ? 1
        : focused
          ? 0.98
          : occupied
            ? 0.92
            : 0.8,
    );
    visual.titlePlate.setAlpha(
      focused ? 1 : attentionActive || occupied ? 0.92 : 0.74,
    );
    visual.theme.setVisible(showTheme);
    visual.theme.setAlpha(
      showTheme ? 0.72 + lightFactor * 0.16 + (focused ? 0.06 : 0) : 0,
    );
    visual.state.setText(
      `${describeSignalLabel(roomState, signal)} | ${roomState.occupantIds.length} present`,
    );
    visual.state.setColor(focused ? "#eef4fb" : "#d8e2eb");
    visual.statePlate.setVisible(showState);
    visual.state.setVisible(showState);
    visual.statePlate.setAlpha(
      showState ? (focused ? 1 : attentionActive ? 0.92 : 0.8) : 0,
    );
    visual.state.setAlpha(showState ? (focused ? 1 : 0.92) : 0);

    for (const [index, shadow] of visual.decorShadows.entries()) {
      const decor = room.decor[index];

      if (!decor) {
        continue;
      }

      shadow.setAlpha(0.12 + decor.alpha * 0.12 + (focused ? 0.04 : 0));
    }

    for (const [index, object] of visual.decorObjects.entries()) {
      const decor = room.decor[index];

      if (!decor) {
        continue;
      }

      object.setFillStyle(
        mixColor(decor.fill, palette.accentTint, focused ? 0.16 : 0.08),
        decor.alpha +
          roomState.occupantIds.length * 0.014 +
          (focused ? 0.04 : 0),
      );
      object.setStrokeStyle(
        2,
        mixColor(room.accentColor, palette.shellStroke, 0.18),
        focused ? 0.18 : 0.1,
      );
    }

    for (const [index, highlight] of visual.decorHighlights.entries()) {
      const decor = room.decor[index];

      if (!decor) {
        continue;
      }

      highlight.setTint(palette.floorSpecularTint);
      highlight.setAlpha(
        0.06 + lightFactor * 0.1 + roomState.occupantIds.length * 0.006,
      );
    }

    for (const heroPropShadow of visual.heroPropShadows) {
      heroPropShadow.setAlpha(0.16 + lightFactor * 0.08 + (focused ? 0.04 : 0));
    }

    for (const heroProp of visual.heroProps) {
      heroProp.setAlpha(0.6 + lightFactor * 0.34 + (focused ? 0.06 : 0));
      heroProp.setTint(
        mixColor(0xffffff, palette.floorSpecularTint, focused ? 0.04 : 0.02),
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
          ? 0.24
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
    visual.sabotageBanner.setAlpha(sabotageText ? 0.98 : 0);
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
    visual: EnvironmentRoomVisual,
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
      ((this.#directedCameraPlan?.focusRoomId ?? this.#activeRoomId) ===
        roomId ||
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

  #applyDirectedCameraPlan(
    plan: DirectedCameraPlan,
    reason: CameraPlan["reason"],
  ) {
    const signature = [
      plan.activeRoomId ?? "room:none",
      plan.focusRoomId ?? "focus:none",
      plan.inspectionRoomId ?? "inspect:none",
      reason,
      Math.round(plan.targetX),
      Math.round(plan.targetY),
      plan.zoomMultiplier.toFixed(3),
      plan.transitionMs,
    ].join(":");

    this.#directedCameraPlan = plan;

    if (plan.transitionMs === 0) {
      this.#cameraPlanSignature = signature;
      this.#scene.cameras.main.centerOn(plan.targetX, plan.targetY);
      this.#scene.cameras.main.setZoom(this.#baseZoom * plan.zoomMultiplier);
      return;
    }

    if (this.#cameraPlanSignature === signature) {
      return;
    }

    this.#cameraPlanSignature = signature;
    this.#scene.cameras.main.pan(
      plan.targetX,
      plan.targetY,
      plan.transitionMs,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#scene.cameras.main.zoomTo(
      this.#baseZoom * plan.zoomMultiplier,
      plan.transitionMs,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
  }

  #refreshRoomFocus() {
    this.#environmentRenderer.refreshFocus(
      createEnvironmentFocusContext({
        directedPlan: this.#directedCameraPlan,
        activeRoomId: this.#activeRoomId,
        inspectedRoomId: this.#inspectedRoomId,
        hoveredRoomId: this.#hoveredRoomId,
      }),
    );
  }

  #calculateZoom() {
    return Math.min(
      this.#scene.scale.width / (MANOR_WORLD_BOUNDS.width + 260),
      this.#scene.scale.height / (MANOR_WORLD_BOUNDS.height + 220),
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
          focusedRoomId:
            this.#directedCameraPlan?.focusRoomId ?? this.#activeRoomId,
          stormLevel: 0.72 + this.#stormPressure * 0.28,
        }),
      );
    }

    if (this.#directedCameraPlan) {
      this.#scene.cameras.main.centerOn(
        this.#directedCameraPlan.targetX,
        this.#directedCameraPlan.targetY,
      );
      this.#scene.cameras.main.setZoom(
        this.#baseZoom * this.#directedCameraPlan.zoomMultiplier,
      );
      return;
    }

    this.#scene.cameras.main.centerOn(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
    );
    this.#scene.cameras.main.setZoom(this.#baseZoom);
  }
}
