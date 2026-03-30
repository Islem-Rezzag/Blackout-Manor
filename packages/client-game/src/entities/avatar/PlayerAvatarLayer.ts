import type {
  MatchEvent,
  PhaseId,
  PlayerId,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import {
  buildEmbodiedMovementPlan,
  type NavigationPoint,
  type NavigationWaypoint,
} from "../../navigation/manorNavigation";
import type {
  TaskPlayerCue,
  TaskReadabilityPresentation,
} from "../../tasking/taskReadability";
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

const POSITION_EPSILON = 6;
const TARGET_EPSILON = 10;

const distanceBetween = (from: NavigationPoint, to: NavigationPoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

const mergeAvatarCue = (
  baseCue: AvatarInteractionCue,
  taskCue: TaskPlayerCue | undefined,
): AvatarInteractionCue => {
  if (!taskCue) {
    return baseCue;
  }

  if (baseCue.eventId) {
    return baseCue;
  }

  return {
    ...baseCue,
    eventId: taskCue.eventId,
    emphasis: Math.max(baseCue.emphasis, taskCue.emphasis),
    taskId: taskCue.taskId,
    badgeText: taskCue.badgeText,
    lookAt: taskCue.lookAt,
  };
};

export type AvatarMovementOrigin = {
  roomId: RoomId;
  position: NavigationPoint;
};

export type AvatarNavigationState = {
  roomId: RoomId | null;
  moving: boolean;
  paused: boolean;
  arrived: boolean;
  waypointKind: NavigationWaypoint["kind"] | null;
};

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
  #authoritativeRoomId: RoomId | null = null;
  #position: NavigationPoint | null = null;
  #targetPosition: NavigationPoint | null = null;
  #waypoints: NavigationWaypoint[] = [];
  #waypointIndex = 0;
  #pauseMs = 0;
  #velocity: NavigationPoint = { x: 0, y: 0 };
  #facing: AvatarFacing = "south";
  #lastPlanSignature = "";

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
    roomId: RoomId,
    targetPosition: NavigationPoint,
    phaseId: PhaseId,
    cue: AvatarInteractionCue,
    targetSeat: NavigationPoint | null,
    movementOrigin: AvatarMovementOrigin | null,
    inspectionRoomId: RoomId | null,
  ) {
    const appearance = resolveAvatarAppearance(player);
    this.#syncNavigation(roomId, targetPosition, phaseId, cue, movementOrigin);

    const visiblePosture = resolveVisiblePosture(player, cue);
    const currentPosition = this.#position ?? targetPosition;
    const moving = this.#isMoving();
    const navigationVector =
      Math.abs(this.#velocity.x) > 0.1 || Math.abs(this.#velocity.y) > 0.1
        ? this.#velocity
        : this.#targetPosition
          ? {
              x: this.#targetPosition.x - currentPosition.x,
              y: this.#targetPosition.y - currentPosition.y,
            }
          : { x: 0, y: 0 };
    const targetVector =
      cue.lookAt &&
      (!moving || distanceBetween(currentPosition, cue.lookAt) <= 110)
        ? {
            x: cue.lookAt.x - currentPosition.x,
            y: cue.lookAt.y - currentPosition.y,
          }
        : cue.targetPlayerId && targetSeat
          ? {
              x: targetSeat.x - currentPosition.x,
              y: targetSeat.y - currentPosition.y,
            }
          : navigationVector;

    this.#facing = directionFromVector(
      targetVector.x,
      targetVector.y,
      this.#facing,
    );

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
    const inspected = inspectionRoomId === roomId;
    const dimmed = inspectionRoomId !== null && !inspected;
    this.container.setScale(inspected ? 1.06 : 1);
    this.container.setAlpha(
      (player.status === "alive" ? 1 : 0.52) * (dimmed ? 0.36 : 1),
    );
    this.container.setVisible(true);
    this.#applyPosition(currentPosition);
  }

  update(delta: number) {
    this.#advanceNavigation(delta);
    this.#applyPosition(this.#position);
    this.#rig.update(delta);
  }

  hide() {
    this.container.setVisible(false);
    this.#velocity = { x: 0, y: 0 };
  }

  getNavigationState(): AvatarNavigationState {
    const activeWaypoint = this.#waypoints[this.#waypointIndex] ?? null;

    return {
      roomId: this.#authoritativeRoomId,
      moving: this.#isMoving(),
      paused: this.#pauseMs > 0,
      arrived: activeWaypoint === null,
      waypointKind: activeWaypoint?.kind ?? null,
    };
  }

  destroy() {
    this.container.destroy(true);
  }

  #syncNavigation(
    roomId: RoomId,
    targetPosition: NavigationPoint,
    phaseId: PhaseId,
    cue: AvatarInteractionCue,
    movementOrigin: AvatarMovementOrigin | null,
  ) {
    if (!this.#position) {
      const initialPosition = movementOrigin?.position ?? targetPosition;
      const initialRoomId = movementOrigin?.roomId ?? roomId;

      this.#position = initialPosition;
      this.#targetPosition = initialPosition;
      this.#authoritativeRoomId = initialRoomId;
      this.#waypoints = [];
      this.#waypointIndex = 0;
      this.#pauseMs = 0;
    }

    const previousRoomId = this.#authoritativeRoomId ?? roomId;
    const roomChanged = previousRoomId !== roomId;
    const targetChanged =
      !this.#targetPosition ||
      distanceBetween(this.#targetPosition, targetPosition) > TARGET_EPSILON;
    const planSignature = [
      previousRoomId,
      roomId,
      Math.round(targetPosition.x),
      Math.round(targetPosition.y),
      phaseId,
      cue.actionIcon ?? "none",
      cue.taskId ?? "task:none",
      cue.badgeText ?? "badge:none",
    ].join(":");

    this.#authoritativeRoomId = roomId;

    if (
      !roomChanged &&
      !targetChanged &&
      this.#lastPlanSignature === planSignature
    ) {
      return;
    }

    const plan = buildEmbodiedMovementPlan({
      fromRoomId: previousRoomId,
      toRoomId: roomId,
      currentPosition: this.#position,
      targetPosition,
      phaseId,
      cue,
    });

    this.#targetPosition = plan.hotspotPosition;
    this.#waypoints = plan.waypoints;
    this.#waypointIndex = 0;
    this.#pauseMs = 0;
    this.#lastPlanSignature = planSignature;
  }

  #advanceNavigation(delta: number) {
    if (!this.#position) {
      return;
    }

    let remainingMs = delta;
    this.#velocity = { x: 0, y: 0 };

    while (remainingMs > 0) {
      if (this.#pauseMs > 0) {
        const consumed = Math.min(this.#pauseMs, remainingMs);
        this.#pauseMs -= consumed;
        remainingMs -= consumed;

        if (this.#pauseMs > 0) {
          break;
        }
      }

      const waypoint = this.#waypoints[this.#waypointIndex];

      if (!waypoint) {
        break;
      }

      const distance = distanceBetween(this.#position, waypoint);

      if (distance <= POSITION_EPSILON) {
        this.#position = { x: waypoint.x, y: waypoint.y };
        this.#waypointIndex += 1;
        this.#pauseMs = waypoint.pauseMs;
        continue;
      }

      const maxDistance = waypoint.speedPxPerSecond * (remainingMs / 1000);

      if (maxDistance >= distance) {
        const consumedMs = (distance / waypoint.speedPxPerSecond) * 1000;
        this.#velocity = {
          x:
            ((waypoint.x - this.#position.x) / distance) *
            waypoint.speedPxPerSecond,
          y:
            ((waypoint.y - this.#position.y) / distance) *
            waypoint.speedPxPerSecond,
        };
        this.#position = { x: waypoint.x, y: waypoint.y };
        this.#waypointIndex += 1;
        this.#pauseMs = waypoint.pauseMs;
        remainingMs = Math.max(0, remainingMs - consumedMs);
        continue;
      }

      const ratio = maxDistance / distance;
      this.#velocity = {
        x:
          ((waypoint.x - this.#position.x) / distance) *
          waypoint.speedPxPerSecond,
        y:
          ((waypoint.y - this.#position.y) / distance) *
          waypoint.speedPxPerSecond,
      };
      this.#position = {
        x: this.#position.x + (waypoint.x - this.#position.x) * ratio,
        y: this.#position.y + (waypoint.y - this.#position.y) * ratio,
      };
      remainingMs = 0;
    }
  }

  #isMoving() {
    const waypoint = this.#waypoints[this.#waypointIndex];

    if (!this.#position || !waypoint || this.#pauseMs > 0) {
      return false;
    }

    return distanceBetween(this.#position, waypoint) > POSITION_EPSILON;
  }

  #applyPosition(position: NavigationPoint | null) {
    if (!position) {
      return;
    }

    this.container.setPosition(position.x, position.y);
    this.container.setDepth(50 + position.y / 10);
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
    ) => NavigationPoint,
    positionOverrides?: ReadonlyMap<PlayerId, NavigationPoint>,
    movementOrigins?: ReadonlyMap<PlayerId, AvatarMovementOrigin>,
    taskReadability?: TaskReadabilityPresentation | null,
    inspectionRoomId?: RoomId | null,
  ) {
    const activeTaskReadability =
      phaseId === "roam" || phaseId === "report" ? taskReadability : null;
    const byRoom = new Map<RoomId, PublicPlayerState[]>();
    const positions = new Map<PublicPlayerState["id"], NavigationPoint>();

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
        positionOverrides?.get(player.id) ??
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
        avatar.hide();
        continue;
      }

      const position = positions.get(player.id);
      if (!position) {
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
      const mergedCue = mergeAvatarCue(
        cue,
        activeTaskReadability?.playerCues.get(player.id),
      );

      avatar.apply(
        player,
        player.roomId,
        position,
        phaseId,
        mergedCue,
        mergedCue.targetPlayerId
          ? (positions.get(mergedCue.targetPlayerId) ?? null)
          : null,
        movementOrigins?.get(player.id) ?? null,
        inspectionRoomId ?? null,
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

  getNavigationStates() {
    return new Map(
      [...this.#avatars.entries()].map(([playerId, avatar]) => [
        playerId,
        avatar.getNavigationState(),
      ]),
    );
  }

  destroy() {
    for (const avatar of this.#avatars.values()) {
      avatar.destroy();
    }

    this.#avatars.clear();
  }
}
