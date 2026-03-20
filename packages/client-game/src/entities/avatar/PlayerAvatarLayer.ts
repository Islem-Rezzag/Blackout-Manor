import type {
  MatchEvent,
  PhaseId,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import { AvatarRig } from "./AvatarRig";
import {
  type AvatarFacing,
  type AvatarInteractionCue,
  buildAvatarCueMap,
  directionFromVector,
  resolveAvatarAppearance,
  resolveAvatarPose,
  resolveVisiblePosture,
  visiblePostureLabel,
} from "./presentation";

class PlayerAvatar {
  readonly id: PublicPlayerState["id"];
  readonly container: Phaser.GameObjects.Container;
  readonly #rig: AvatarRig;
  readonly #label: Phaser.GameObjects.Text;
  readonly #presenceRing: Phaser.GameObjects.Ellipse;
  readonly #presenceGlow: Phaser.GameObjects.Ellipse;
  readonly #statusPip: Phaser.GameObjects.Arc;
  readonly #statusPlate: Phaser.GameObjects.Rectangle;
  readonly #statusText: Phaser.GameObjects.Text;
  #lastPosition: { x: number; y: number } | null = null;
  #facing: AvatarFacing = "south";

  constructor(scene: Phaser.Scene, player: PublicPlayerState) {
    const appearance = resolveAvatarAppearance(player);
    this.id = player.id;
    this.#rig = new AvatarRig(scene, appearance, "world");
    this.#presenceGlow = scene.add
      .ellipse(0, 8, 46, 18, appearance.trimColor, 0.14)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.#presenceRing = scene.add
      .ellipse(0, 8, 38, 11, appearance.trimColor, 0.12)
      .setStrokeStyle(2, appearance.trimColor, 0.42);
    this.#label = scene.add.text(0, 40, player.displayName, {
      align: "center",
      color: appearance.nameColor,
      fontFamily: "Georgia, Times, serif",
      fontSize: "12px",
      fontStyle: "600",
      stroke: "#05070a",
      strokeThickness: 4,
      wordWrap: { width: 104, useAdvancedWrap: true },
    });
    this.#label.setOrigin(0.5);
    this.#statusPip = scene.add.circle(19, -34, 4.5, 0x8de4ff, 1);
    this.#statusPlate = scene.add
      .rectangle(0, 61, 74, 18, 0x081118, 0.76)
      .setStrokeStyle(1, appearance.trimColor, 0.36);
    this.#statusText = scene.add.text(0, 61, "CALM", {
      align: "center",
      color: "#eef4fb",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      letterSpacing: 1.1,
    });
    this.#statusText.setOrigin(0.5);
    this.container = scene.add.container(0, 0, [
      this.#presenceGlow,
      this.#presenceRing,
      this.#rig.container,
      this.#statusPip,
      this.#label,
      this.#statusPlate,
      this.#statusText,
    ]);
  }

  apply(
    player: PublicPlayerState,
    seat: { x: number; y: number },
    phaseId: PhaseId,
    cue: AvatarInteractionCue,
    targetSeat: { x: number; y: number } | null,
  ) {
    const appearance = resolveAvatarAppearance(player);
    const visiblePosture = resolveVisiblePosture(player, cue);
    const previous = this.#lastPosition;
    const delta = previous
      ? { x: seat.x - previous.x, y: seat.y - previous.y }
      : { x: 0, y: 0 };
    const targetVector =
      cue.targetPlayerId && targetSeat
        ? { x: targetSeat.x - seat.x, y: targetSeat.y - seat.y }
        : delta;

    this.#facing = directionFromVector(
      targetVector.x,
      targetVector.y,
      this.#facing,
    );

    const distance = previous
      ? Phaser.Math.Distance.Between(previous.x, previous.y, seat.x, seat.y)
      : 0;
    const moving = distance > 6 && phaseId === "roam";
    this.#rig.setMovementState(moving);
    this.#rig.applyState({
      pose: resolveAvatarPose(player),
      visiblePosture,
      facing: this.#facing,
      cue,
      connected: player.connected,
      suspiciousness: player.publicImage.suspiciousness,
      alive: player.status === "alive",
    });

    this.#statusPip.setFillStyle(
      player.status === "alive" ? 0x92efc5 : 0xff907a,
      1,
    );
    this.#statusPip.setAlpha(player.connected ? 1 : 0.48);
    this.#statusPip.setScale(
      visiblePosture === "alert" || visiblePosture === "defiant" ? 1.08 : 1,
    );
    this.#label.setText(player.displayName);
    this.#label.setColor(appearance.nameColor);
    this.#label.setAlpha(player.status === "alive" ? 1 : 0.55);
    this.#presenceGlow.setFillStyle(
      appearance.trimColor,
      player.status === "alive"
        ? moving
          ? 0.18
          : visiblePosture === "shaken"
            ? 0.08
            : 0.13
        : 0.04,
    );
    this.#presenceGlow.setScale(
      moving ? 1.08 : visiblePosture === "confident" ? 1.04 : 1,
      1,
    );
    this.#presenceRing.setStrokeStyle(
      visiblePosture === "defiant" ? 2.4 : 2,
      appearance.trimColor,
      player.status === "alive"
        ? visiblePosture === "shaken"
          ? 0.2
          : 0.5
        : 0.16,
    );
    this.#presenceRing.setFillStyle(
      appearance.trimColor,
      visiblePosture === "alert" || visiblePosture === "suspicious"
        ? 0.18
        : 0.1,
    );
    this.#statusPlate.setFillStyle(
      player.status === "alive" ? 0x081118 : 0x180d0f,
      player.status === "alive" ? 0.82 : 0.7,
    );
    this.#statusPlate.setStrokeStyle(
      1,
      appearance.trimColor,
      player.connected ? 0.38 : 0.2,
    );
    this.#statusText.setText(
      player.status === "alive"
        ? visiblePostureLabel(visiblePosture).toUpperCase()
        : "OUT",
    );
    this.#statusText.setColor(
      player.status === "alive" ? "#eef4fb" : "#ffd5cb",
    );
    this.container.setAlpha(player.status === "alive" ? 1 : 0.52);
    this.container.setVisible(player.roomId !== null);

    if (previous) {
      this.container.scene.tweens.add({
        targets: this.container,
        x: seat.x,
        y: seat.y,
        duration: moving
          ? Phaser.Math.Clamp(180 + distance * 1.8, 220, 420)
          : 180,
        ease: Phaser.Math.Easing.Cubic.Out,
      });
    } else {
      this.container.setPosition(seat.x, seat.y);
    }

    this.container.setDepth(50 + seat.y / 10);
    this.#lastPosition = seat;
  }

  update(delta: number) {
    this.#rig.update(delta);
  }

  destroy() {
    this.container.destroy(true);
  }
}

export class PlayerAvatarLayer {
  readonly #scene: Phaser.Scene;
  readonly #avatars = new Map<string, PlayerAvatar>();

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
  }

  render(
    players: readonly PublicPlayerState[],
    recentEvents: readonly MatchEvent[],
    phaseId: PhaseId,
    roomSeatResolver: (
      roomId: RoomId,
      seatIndex: number,
      seatCount: number,
    ) => { x: number; y: number },
  ) {
    const byRoom = new Map<RoomId, PublicPlayerState[]>();
    const positions = new Map<
      PublicPlayerState["id"],
      { x: number; y: number }
    >();

    for (const player of players) {
      if (!player.roomId) {
        continue;
      }

      const roomPlayers = byRoom.get(player.roomId) ?? [];
      roomPlayers.push(player);
      byRoom.set(player.roomId, roomPlayers);
    }

    for (const player of players) {
      if (!player.roomId) {
        continue;
      }

      const roomPlayers = byRoom.get(player.roomId) ?? [player];
      const seatIndex = roomPlayers.findIndex(
        (candidate) => candidate.id === player.id,
      );
      positions.set(
        player.id,
        roomSeatResolver(player.roomId, seatIndex, roomPlayers.length),
      );
    }

    const cues = buildAvatarCueMap(players, recentEvents, phaseId);
    const activeIds = new Set(players.map((player) => player.id));

    for (const player of players) {
      let avatar = this.#avatars.get(player.id);
      if (!avatar) {
        avatar = new PlayerAvatar(this.#scene, player);
        this.#avatars.set(player.id, avatar);
      }

      if (!player.roomId) {
        avatar.container.setVisible(false);
        continue;
      }

      const seat = positions.get(player.id);
      if (!seat) {
        continue;
      }

      const cue = cues.get(player.id) ?? {
        eventId: null,
        gesture: "idle",
        speechText: null,
        targetPlayerId: null,
        emphasis: 0,
        actionIcon: null,
      };

      avatar.apply(
        player,
        seat,
        phaseId,
        cue,
        cue.targetPlayerId ? (positions.get(cue.targetPlayerId) ?? null) : null,
      );
    }

    for (const [playerId, avatar] of this.#avatars.entries()) {
      if (!activeIds.has(playerId)) {
        avatar.destroy();
        this.#avatars.delete(playerId);
      }
    }
  }

  update(delta: number) {
    for (const avatar of this.#avatars.values()) {
      avatar.update(delta);
    }
  }

  destroy() {
    for (const avatar of this.#avatars.values()) {
      avatar.destroy();
    }

    this.#avatars.clear();
  }
}
