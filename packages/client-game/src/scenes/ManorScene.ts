import { MANOR_V1_MAP } from "@blackout-manor/content";
import type { MatchEvent, MatchSnapshot, RoomId } from "@blackout-manor/shared";
import { DEFAULT_ROOM_LABELS } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import { SoundBus } from "../audio/SoundBus";
import type { ClientGameRuntime } from "../bootstrap/runtime";
import { MeetingPortraitStrip } from "../entities/avatar/MeetingPortraitStrip";
import { PlayerTokenLayer } from "../entities/PlayerTokens";
import { AtmosphereVeil } from "../fx/AtmosphereVeil";
import { StormLayer } from "../fx/StormLayer";
import {
  getRoomRenderData,
  getRoomSeatPosition,
  MANOR_RENDER_MAP,
  MANOR_WORLD_BOUNDS,
  type ManorRenderRoom,
} from "../tiled/manorLayout";
import type { ClientGameState } from "../types";
import { MatchHud } from "../ui/MatchHud";
import { SCENE_KEYS } from "./keys";

type RoomSignal = {
  clue: boolean;
  body: boolean;
  sabotage: boolean;
  sabotageLabel: string | null;
};

type RoomVisual = {
  roomId: RoomId;
  container: Phaser.GameObjects.Container;
  shell: Phaser.GameObjects.Rectangle;
  floor: Phaser.GameObjects.Image;
  accent: Phaser.GameObjects.Image;
  ambientGlow: Phaser.GameObjects.Image;
  cutawayShadow: Phaser.GameObjects.Rectangle;
  cutawayWall: Phaser.GameObjects.Rectangle;
  cutawayTrim: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  theme: Phaser.GameObjects.Text;
  state: Phaser.GameObjects.Text;
  focusFrame: Phaser.GameObjects.Rectangle;
  taskChips: Phaser.GameObjects.Text[];
  lightGlows: Phaser.GameObjects.Image[];
  windowOverlays: Phaser.GameObjects.Image[];
  clueMarker: Phaser.GameObjects.Image;
  sabotageBanner: Phaser.GameObjects.Image;
  sabotageLabel: Phaser.GameObjects.Text;
};

const readableTaskLabel = (taskId: string) =>
  taskId
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const splitColor = (color: number) => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

const mixColor = (fromColor: number, toColor: number, amount: number) => {
  const from = splitColor(fromColor);
  const to = splitColor(toColor);
  const clamped = Phaser.Math.Clamp(amount, 0, 1);
  const r = Math.round(from.r + (to.r - from.r) * clamped);
  const g = Math.round(from.g + (to.g - from.g) * clamped);
  const b = Math.round(from.b + (to.b - from.b) * clamped);

  return (r << 16) | (g << 8) | b;
};

const lightLevelToFactor = (
  lightLevel: MatchSnapshot["rooms"][number]["lightLevel"],
) => {
  switch (lightLevel) {
    case "blackout":
      return 0.14;
    case "dim":
      return 0.48;
    default:
      return 1;
  }
};

const eventRoomId = (event: MatchEvent): RoomId | null => {
  switch (event.eventId) {
    case "task-progressed":
    case "task-completed":
    case "player-eliminated":
    case "body-reported":
    case "clue-discovered":
      return event.roomId;
    case "sabotage-triggered":
      return event.roomId ?? null;
    default:
      return null;
  }
};

const describeSignalLabel = (
  roomState: MatchSnapshot["rooms"][number],
  signal: RoomSignal,
) => {
  if (signal.body) {
    return "Report site";
  }

  if (signal.sabotageLabel) {
    return signal.sabotageLabel;
  }

  if (signal.clue) {
    return "Fresh clue";
  }

  if (roomState.lightLevel === "blackout") {
    return "Blackout";
  }

  if (roomState.doorState === "sealed") {
    return "Sealed";
  }

  if (roomState.doorState === "jammed") {
    return "Jammed";
  }

  if (roomState.occupantIds.length >= 4) {
    return "Crowded";
  }

  if (roomState.occupantIds.length === 0) {
    return "Quiet";
  }

  return "Under watch";
};

const createSignalMap = (snapshot: MatchSnapshot) => {
  const signals = new Map<RoomId, RoomSignal>();

  for (const roomState of snapshot.rooms) {
    signals.set(roomState.roomId, {
      clue: false,
      body: false,
      sabotage: false,
      sabotageLabel: null,
    });
  }

  for (const event of snapshot.recentEvents) {
    switch (event.eventId) {
      case "clue-discovered": {
        const roomSignal = signals.get(event.roomId);

        if (roomSignal) {
          roomSignal.clue = true;
        }
        break;
      }
      case "player-eliminated":
      case "body-reported": {
        const roomSignal = signals.get(event.roomId);

        if (roomSignal) {
          roomSignal.body = true;
        }
        break;
      }
      case "sabotage-triggered":
        if (event.roomId) {
          const roomSignal = signals.get(event.roomId);

          if (roomSignal) {
            roomSignal.sabotage = true;
            roomSignal.sabotageLabel = readableTaskLabel(event.actionId);
          }
        }
        break;
      default:
        break;
    }
  }

  return signals;
};

const focusRoomFromState = (state: ClientGameState): RoomId | null => {
  const snapshot = state.snapshot;

  if (!snapshot) {
    return null;
  }

  for (const event of [...snapshot.recentEvents].reverse()) {
    const roomId = eventRoomId(event);

    if (roomId) {
      return roomId;
    }
  }

  const actorRoom = state.actorId
    ? snapshot.players.find((player) => player.id === state.actorId)?.roomId
    : null;

  return actorRoom ?? snapshot.rooms[0]?.roomId ?? null;
};

const blackoutStrengthFromSnapshot = (snapshot: MatchSnapshot) => {
  const blackoutRooms = snapshot.rooms.filter(
    (roomState) => roomState.lightLevel === "blackout",
  ).length;
  const dimRooms = snapshot.rooms.filter(
    (roomState) => roomState.lightLevel === "dim",
  ).length;

  if (blackoutRooms > 0) {
    return 0.58 + (blackoutRooms / snapshot.rooms.length) * 0.34;
  }

  if (dimRooms > 0) {
    return 0.22 + (dimRooms / snapshot.rooms.length) * 0.18;
  }

  return 0.08;
};

export class ManorScene extends Phaser.Scene {
  readonly #runtime: ClientGameRuntime;
  readonly #soundBus = new SoundBus();
  readonly #roomVisuals = new Map<RoomId, RoomVisual>();
  #playerLayer: PlayerTokenLayer | null = null;
  #portraitStrip: MeetingPortraitStrip | null = null;
  #hud: MatchHud | null = null;
  #stormLayer: StormLayer | null = null;
  #atmosphereVeil: AtmosphereVeil | null = null;
  #backdrop: Phaser.GameObjects.Graphics | null = null;
  #unsubscribe: (() => void) | null = null;
  #currentState: ClientGameState | null = null;
  #focusedRoomId: RoomId | null = null;
  #hoveredRoomId: RoomId | null = null;
  #baseZoom = 1;
  #lastFpsSample = 60;

  constructor(runtime: ClientGameRuntime) {
    super(SCENE_KEYS.manor);
    this.#runtime = runtime;
  }

  create() {
    this.#backdrop = this.add.graphics();
    this.#playerLayer = new PlayerTokenLayer(this);
    this.#portraitStrip = new MeetingPortraitStrip(this);
    this.#hud = new MatchHud(this);
    this.#stormLayer = new StormLayer(this);
    this.#atmosphereVeil = new AtmosphereVeil(this);
    this.#drawBackdrop();
    this.#drawRooms();
    this.#stormLayer.setWindows(
      MANOR_RENDER_MAP.roomOrder.flatMap(
        (roomId) => MANOR_RENDER_MAP.rooms[roomId].windows,
      ),
    );

    this.#baseZoom = this.#calculateZoom();
    this.cameras.main.setBounds(
      0,
      0,
      MANOR_WORLD_BOUNDS.width,
      MANOR_WORLD_BOUNDS.height,
    );
    this.cameras.main.centerOn(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
    );
    this.cameras.main.setZoom(this.#baseZoom);

    this.scale.on("resize", this.#handleResize, this);
    this.#handleResize(this.scale.gameSize);

    this.#unsubscribe = this.#runtime.subscribe((state) => {
      this.#currentState = state;
      this.#hud?.update(state);

      if (state.snapshot) {
        this.#applyState(state);
      }
    });

    const initialState = this.#runtime.getState();
    this.#currentState = initialState;
    this.#hud?.update(initialState);
    if (initialState.snapshot) {
      this.#applyState(initialState);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.#playerLayer?.destroy();
      this.#playerLayer = null;
      this.#portraitStrip?.destroy();
      this.#portraitStrip = null;
      this.#stormLayer?.destroy();
      this.#stormLayer = null;
      this.#atmosphereVeil?.destroy();
      this.#atmosphereVeil = null;
      this.#hud?.destroy();
      this.#hud = null;
      this.scale.off("resize", this.#handleResize, this);
    });
  }

  update(_time: number, delta: number) {
    const smoothDelta = Math.max(1, delta);
    this.#lastFpsSample = Phaser.Math.Linear(
      this.#lastFpsSample,
      1000 / smoothDelta,
      0.08,
    );
    this.#runtime.setFpsEstimate(this.#lastFpsSample);
    this.#playerLayer?.update(delta);
    this.#portraitStrip?.update(delta);
    this.#stormLayer?.update(delta);
    this.#atmosphereVeil?.setLightningLevel(
      this.#stormLayer?.lightningStrength ?? 0,
    );
    this.#atmosphereVeil?.update();
  }

  #drawBackdrop() {
    if (!this.#backdrop) {
      return;
    }

    this.#backdrop.clear();

    for (const rect of MANOR_RENDER_MAP.backdropRects) {
      if (rect.stroke !== null) {
        this.#backdrop.lineStyle(2, rect.stroke, rect.alpha * 0.4);
      } else {
        this.#backdrop.lineStyle(0, 0, 0);
      }
      this.#backdrop.fillStyle(rect.fill, rect.alpha);
      this.#backdrop.fillRoundedRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        32,
      );
    }

    const stormGlow = this.add
      .ellipse(1390, 110, 440, 260, 0x78add5, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(3);
    const southShadow = this.add
      .ellipse(820, 1060, 920, 160, 0x02060a, 0.28)
      .setDepth(3);

    this.#backdrop.setDepth(1);
    stormGlow.setDepth(2);
    southShadow.setDepth(2);
  }

  #drawRooms() {
    for (const roomId of MANOR_RENDER_MAP.roomOrder) {
      const room = getRoomRenderData(roomId);
      const container = this.add.container(room.x, room.y);
      container.setDepth(20 + room.y / 40);

      const shellShadow = this.add
        .rectangle(10, 14, room.width + 22, room.height + 26, 0x000000, 0.24)
        .setOrigin(0.5);
      const shell = this.add
        .rectangle(0, 0, room.width + 14, room.height + 18, 0x131a21, 0.98)
        .setStrokeStyle(2, room.accentColor, 0.15)
        .setOrigin(0.5);
      const ambientGlow = this.add
        .image(0, 4, "room-glow")
        .setDisplaySize(room.width * 1.14, room.height * 0.94)
        .setTint(room.ambienceColor)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.42);
      const floor = this.add
        .image(0, 8, "room-floor")
        .setDisplaySize(room.width, room.height)
        .setTint(room.fillColor)
        .setAlpha(0.96);
      const accent = this.add
        .image(0, 16, "room-floor")
        .setDisplaySize(room.width * 0.78, room.height * 0.56)
        .setTint(room.accentColor)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0.16);

      const decorObjects = room.decor.map((decor) => {
        const object = decor.ellipse
          ? this.add.ellipse(
              decor.x - room.x,
              decor.y - room.y + 8,
              decor.width,
              decor.height,
              decor.fill,
              decor.alpha,
            )
          : this.add.rectangle(
              decor.x - room.x,
              decor.y - room.y + 8,
              decor.width,
              decor.height,
              decor.fill,
              decor.alpha,
            );

        object.setBlendMode(Phaser.BlendModes.MULTIPLY);
        return object;
      });

      const lightGlows = room.lights.map((light) =>
        this.add
          .image(light.x - room.x, light.y - room.y - 8, "room-glow")
          .setDisplaySize(light.radius * 1.5, light.radius * 0.96)
          .setTint(light.color)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(light.intensity * 0.55),
      );

      const windowOverlays = room.windows.map((windowSlice) =>
        this.add
          .image(windowSlice.x - room.x, windowSlice.y - room.y, "rain-sheen")
          .setDisplaySize(windowSlice.width, windowSlice.height)
          .setTint(windowSlice.fill)
          .setBlendMode(Phaser.BlendModes.SCREEN)
          .setAlpha(windowSlice.alpha * 0.65),
      );

      const cutawayShadow = this.add
        .rectangle(
          0,
          -room.height / 2 + room.cutawayHeight / 2 + 6,
          room.width + 14,
          room.cutawayHeight + 12,
          0x000000,
          0.24,
        )
        .setOrigin(0.5);
      const cutawayWall = this.add
        .rectangle(
          0,
          -room.height / 2 + room.cutawayHeight / 2,
          room.width + 6,
          room.cutawayHeight,
          room.cutawayColor,
          0.9,
        )
        .setOrigin(0.5);
      const cutawayTrim = this.add
        .rectangle(
          0,
          -room.height / 2 + 10,
          room.width - 20,
          10,
          room.accentColor,
          0.28,
        )
        .setOrigin(0.5);
      const focusFrame = this.add
        .rectangle(0, 0, room.width + 18, room.height + 22)
        .setStrokeStyle(2, room.accentColor, 0)
        .setFillStyle(room.accentColor, 0)
        .setOrigin(0.5);
      const title = this.add.text(
        0,
        -room.height / 2 + room.cutawayHeight / 2 - 7,
        DEFAULT_ROOM_LABELS[room.roomId],
        {
          color: "#f5f0e4",
          fontFamily: "Palatino Linotype, Georgia, serif",
          fontSize: "20px",
          fontStyle: "bold",
        },
      );
      title.setOrigin(0.5);
      const theme = this.add.text(
        0,
        -room.height / 2 + room.cutawayHeight + 12,
        room.theme,
        {
          color: "#d8e1eb",
          fontFamily: "Georgia, Times, serif",
          fontSize: "12px",
          fontStyle: "italic",
        },
      );
      theme.setOrigin(0.5);
      const state = this.add.text(0, room.height / 2 - 24, "", {
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
            const chip = this.add.text(
              -room.width / 2 + 24,
              -room.height / 2 + room.cutawayHeight + 34 + index * 24,
              readableTaskLabel(taskId),
              {
                color: "#091018",
                backgroundColor: "#ead08c",
                fontFamily: "Segoe UI, sans-serif",
                fontSize: "11px",
                padding: { left: 9, right: 9, top: 4, bottom: 4 },
              },
            );
            chip.setOrigin(0, 0.5);
            chip.setInteractive({ useHandCursor: true });
            chip.on("pointerdown", () => {
              this.#focusRoom(room.roomId, false);
              void this.#runtime.proposeStartTask(taskId);
            });
            return chip;
          }) ?? [];

      const clueMarker = this.add
        .image(
          room.cluePoint.x - room.x,
          room.cluePoint.y - room.y,
          "clue-marker",
        )
        .setDisplaySize(42, 42)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0);
      this.tweens.add({
        targets: clueMarker,
        scaleX: 1.14,
        scaleY: 1.14,
        yoyo: true,
        repeat: -1,
        duration: 820,
        ease: "Sine.easeInOut",
      });

      const sabotageBanner = this.add
        .image(0, -room.height / 2 + 22, "sabotage-stripe")
        .setDisplaySize(room.width * 0.84, 44)
        .setAlpha(0);
      const sabotageLabel = this.add.text(0, -room.height / 2 + 22, "", {
        color: "#fff6ed",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        letterSpacing: 1.2,
      });
      sabotageLabel.setOrigin(0.5);
      sabotageLabel.setAlpha(0);

      const hitTarget = this.add
        .rectangle(0, 0, room.width, room.height, 0xffffff, 0.001)
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
        this.#focusRoom(room.roomId, false);
        void this.#runtime.proposeMove(room.roomId);
      });

      container.add([
        shellShadow,
        shell,
        ambientGlow,
        floor,
        accent,
        ...decorObjects,
        ...lightGlows,
        ...windowOverlays,
        cutawayShadow,
        cutawayWall,
        cutawayTrim,
        focusFrame,
        title,
        theme,
        state,
        ...taskChips,
        clueMarker,
        sabotageBanner,
        sabotageLabel,
        hitTarget,
      ]);

      this.#roomVisuals.set(room.roomId, {
        roomId: room.roomId,
        container,
        shell,
        floor,
        accent,
        ambientGlow,
        cutawayShadow,
        cutawayWall,
        cutawayTrim,
        title,
        theme,
        state,
        focusFrame,
        taskChips,
        lightGlows,
        windowOverlays,
        clueMarker,
        sabotageBanner,
        sabotageLabel,
      });
    }
  }

  #applyState(state: ClientGameState) {
    const snapshot = state.snapshot;

    if (!snapshot) {
      return;
    }

    const signals = createSignalMap(snapshot);
    const focusedRoomId = focusRoomFromState(state);

    if (focusedRoomId) {
      this.#focusRoom(focusedRoomId, this.#focusedRoomId === null);
    }

    for (const roomState of snapshot.rooms) {
      const visual = this.#roomVisuals.get(roomState.roomId);

      if (!visual) {
        continue;
      }

      const room = getRoomRenderData(roomState.roomId);
      const signal = signals.get(roomState.roomId);

      if (!signal) {
        continue;
      }

      this.#applyRoomState(visual, room, roomState, signal);
    }

    this.#playerLayer?.render(
      snapshot.players,
      snapshot.recentEvents,
      snapshot.phaseId,
      getRoomSeatPosition,
    );
    this.#portraitStrip?.render(
      snapshot.players,
      snapshot.phaseId,
      snapshot.recentEvents,
    );
    this.#atmosphereVeil?.setBlackoutLevel(
      blackoutStrengthFromSnapshot(snapshot),
    );
    this.#refreshRoomFocus();
  }

  #applyRoomState(
    visual: RoomVisual,
    room: ManorRenderRoom,
    roomState: MatchSnapshot["rooms"][number],
    signal: RoomSignal,
  ) {
    const lightFactor = lightLevelToFactor(roomState.lightLevel);
    const focused = this.#focusedRoomId === room.roomId;
    const floorTint = mixColor(room.fillColor, 0x0b1217, 1 - lightFactor);
    const accentTint = mixColor(
      room.accentColor,
      0x162029,
      1 - lightFactor * 0.9,
    );
    const ambienceTint = mixColor(
      room.ambienceColor,
      0x1d3646,
      1 - lightFactor * 0.8,
    );

    visual.floor.setTint(floorTint);
    visual.floor.setAlpha(0.94);
    visual.accent.setTint(accentTint);
    visual.accent.setAlpha(0.14 + lightFactor * 0.06);
    visual.ambientGlow.setTint(ambienceTint);
    visual.ambientGlow.setAlpha(
      0.18 + lightFactor * 0.16 + roomState.occupantIds.length * 0.015,
    );
    visual.shell.setFillStyle(
      mixColor(0x151d25, room.cutawayColor, 0.18),
      0.98,
    );
    visual.cutawayShadow.setAlpha(focused ? 0.12 : 0.22);
    visual.cutawayWall.setFillStyle(
      mixColor(room.cutawayColor, 0x080d12, 1 - lightFactor * 0.7),
      focused ? 0.38 : 0.84,
    );
    visual.cutawayTrim.setFillStyle(room.accentColor, focused ? 0.38 : 0.22);
    visual.title.setColor(lightFactor < 0.2 ? "#f0f4f7" : "#f5f0e4");
    visual.theme.setAlpha(0.62 + lightFactor * 0.18);
    visual.state.setText(
      `${describeSignalLabel(roomState, signal)} · ${roomState.occupantIds.length} present`,
    );

    for (const [index, lightGlow] of visual.lightGlows.entries()) {
      const light = room.lights[index];
      if (!light) {
        continue;
      }

      lightGlow.setTint(light.color);
      lightGlow.setAlpha(light.intensity * (0.14 + lightFactor * 0.52));
    }

    for (const [index, windowOverlay] of visual.windowOverlays.entries()) {
      const windowSlice = room.windows[index];
      if (!windowSlice) {
        continue;
      }

      windowOverlay.setTint(windowSlice.fill);
      windowOverlay.setAlpha(windowSlice.alpha * (0.46 + lightFactor * 0.2));
    }

    visual.clueMarker
      .setVisible(signal.clue || signal.body)
      .setTint(signal.body ? 0xff8b78 : 0xffe38d)
      .setAlpha(signal.clue || signal.body ? 0.88 : 0);
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
      room,
      roomState.roomId,
      roomState.lightLevel,
    );
  }

  #applyTaskStateLabels(
    visual: RoomVisual,
    _room: ManorRenderRoom,
    roomId: RoomId,
    lightLevel: MatchSnapshot["rooms"][number]["lightLevel"],
  ) {
    const snapshot = this.#currentState?.snapshot;
    const roomTasks =
      snapshot?.tasks.filter((task) => task.roomId === roomId) ?? [];
    const lightFactor = lightLevelToFactor(lightLevel);

    for (const [index, chip] of visual.taskChips.entries()) {
      const task = roomTasks[index];

      if (!task) {
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
      chip.setAlpha(0.72 + lightFactor * 0.22);
    }
  }

  #focusRoom(roomId: RoomId, immediate: boolean) {
    if (this.#focusedRoomId === roomId && !immediate) {
      return;
    }

    const room = getRoomRenderData(roomId);
    this.#focusedRoomId = roomId;
    const duration = immediate ? 0 : 520;

    this.cameras.main.pan(
      room.focusPoint.x,
      room.focusPoint.y,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.cameras.main.zoomTo(
      this.#baseZoom * room.focusZoom,
      duration,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
    this.#refreshRoomFocus();
  }

  #refreshRoomFocus() {
    for (const [roomId, visual] of this.#roomVisuals.entries()) {
      const focused = this.#focusedRoomId === roomId;
      const hovered = this.#hoveredRoomId === roomId;
      const room = getRoomRenderData(roomId);

      visual.focusFrame.setStrokeStyle(
        2,
        room.accentColor,
        focused ? 0.78 : hovered ? 0.38 : 0,
      );
      visual.container.setScale(focused ? 1.015 : hovered ? 1.008 : 1);
    }
  }

  #calculateZoom() {
    return Math.min(
      this.scale.width / (MANOR_WORLD_BOUNDS.width + 160),
      this.scale.height / (MANOR_WORLD_BOUNDS.height + 140),
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    const width = gameSize?.width ?? this.scale.width;
    const height = gameSize?.height ?? this.scale.height;

    this.#baseZoom = this.#calculateZoom();
    this.#atmosphereVeil?.resize(width, height);
    this.#portraitStrip?.resize(width, height);

    if (this.#focusedRoomId) {
      const focusedRoom = getRoomRenderData(this.#focusedRoomId);
      this.cameras.main.centerOn(
        focusedRoom.focusPoint.x,
        focusedRoom.focusPoint.y,
      );
      this.cameras.main.setZoom(this.#baseZoom * focusedRoom.focusZoom);
      return;
    }

    this.cameras.main.centerOn(
      MANOR_WORLD_BOUNDS.width / 2,
      MANOR_WORLD_BOUNDS.height / 2,
    );
    this.cameras.main.setZoom(this.#baseZoom);
  }
}
