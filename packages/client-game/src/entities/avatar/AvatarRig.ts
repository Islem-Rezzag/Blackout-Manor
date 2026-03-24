import type { BodyLanguageId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type {
  AvatarActionIconId,
  AvatarAppearance,
  AvatarBubbleStyle,
  AvatarFacing,
  AvatarGesture,
  AvatarInteractionCue,
  VisiblePostureId,
} from "./presentation";
import { actionIconLabel } from "./presentation";

type AvatarRigMode = "world" | "portrait";

type AvatarRigState = {
  pose: BodyLanguageId;
  visiblePosture: VisiblePostureId;
  facing: AvatarFacing;
  cue: AvatarInteractionCue;
  connected: boolean;
  suspiciousness: number;
  alive: boolean;
};

const MODE = {
  world: { scale: 1, bubbleWidth: 150, bubbleY: -92, fontSize: 12 },
  portrait: { scale: 1.18, bubbleWidth: 108, bubbleY: -106, fontSize: 11 },
} as const satisfies Record<
  AvatarRigMode,
  { scale: number; bubbleWidth: number; bubbleY: number; fontSize: number }
>;

const FACING = {
  north: { x: 0, y: -1 },
  "north-east": { x: 0.7, y: -0.7 },
  east: { x: 1, y: 0 },
  "south-east": { x: 0.7, y: 0.7 },
  south: { x: 0, y: 1 },
  "south-west": { x: -0.7, y: 0.7 },
  west: { x: -1, y: 0 },
  "north-west": { x: -0.7, y: -0.7 },
} as const satisfies Record<AvatarFacing, { x: number; y: number }>;

const splitColor = (color: number) => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

const mixColor = (fromColor: number, toColor: number, amount: number) => {
  const from = splitColor(fromColor);
  const to = splitColor(toColor);
  const t = Phaser.Math.Clamp(amount, 0, 1);

  return Phaser.Display.Color.GetColor(
    Math.round(from.r + (to.r - from.r) * t),
    Math.round(from.g + (to.g - from.g) * t),
    Math.round(from.b + (to.b - from.b) * t),
  );
};

const points = (value: ReadonlyArray<{ x: number; y: number }>) =>
  value.map((point) => new Phaser.Geom.Point(point.x, point.y));

const bubbleDuration = (text: string | null) =>
  text ? 2_800 + Math.min(1_700, text.length * 18) : 0;

const gestureDuration = (gesture: AvatarGesture) => {
  switch (gesture) {
    case "accuse":
      return 1_600;
    case "recoil":
      return 1_350;
    case "comfort":
    case "reassure":
      return 1_750;
    case "move":
      return 420;
    default:
      return 0;
  }
};

const poseProfile = (pose: BodyLanguageId) => {
  switch (pose) {
    case "agitated":
      return { lean: 2.4, lift: 1.8, tilt: -0.08, jitter: 0.45, aura: 0.24 };
    case "shaken":
      return { lean: -2.8, lift: 3.2, tilt: 0.1, jitter: 0.88, aura: 0.32 };
    case "defiant":
      return { lean: 4.2, lift: -0.5, tilt: -0.12, jitter: 0.12, aura: 0.3 };
    case "confident":
      return { lean: 1.4, lift: -0.1, tilt: -0.04, jitter: 0.06, aura: 0.2 };
    default:
      return { lean: 0, lift: 0, tilt: 0, jitter: 0.04, aura: 0.16 };
  }
};

const posturePalette = (
  posture: VisiblePostureId,
  trimColor: number,
  suspiciousness: number,
) => {
  switch (posture) {
    case "alert":
      return {
        aura: mixColor(trimColor, 0xf4c181, 0.62),
        accent: 0xf2cf91,
        badgeFill: 0x211815,
        badgeStroke: 0xf0b784,
        badgeText: "#fff1e8",
      };
    case "suspicious":
      return {
        aura: mixColor(trimColor, 0xff8f7d, 0.54 + suspiciousness * 0.18),
        accent: 0xe59d8d,
        badgeFill: 0x24161a,
        badgeStroke: 0xff9b84,
        badgeText: "#fff0ea",
      };
    case "shaken":
      return {
        aura: mixColor(trimColor, 0xb8d6ef, 0.42),
        accent: 0xdce8f7,
        badgeFill: 0x151d24,
        badgeStroke: 0xbdd7ef,
        badgeText: "#eef6fd",
      };
    case "confident":
      return {
        aura: mixColor(trimColor, 0xf0d89c, 0.38),
        accent: 0xf2deb0,
        badgeFill: 0x172012,
        badgeStroke: 0xcddc8f,
        badgeText: "#f5f7df",
      };
    case "defiant":
      return {
        aura: mixColor(trimColor, 0xff8a78, 0.68),
        accent: 0xffb19d,
        badgeFill: 0x271416,
        badgeStroke: 0xff8f79,
        badgeText: "#fff0eb",
      };
    default:
      return {
        aura: mixColor(trimColor, 0x9bc7d4, 0.22),
        accent: 0xc8dbe7,
        badgeFill: 0x12202a,
        badgeStroke: 0x8eb8da,
        badgeText: "#eef4fb",
      };
  }
};

const actionAnchor = (
  actionIcon: AvatarActionIconId | null,
  hasCustomLabel: boolean,
) => {
  if (hasCustomLabel && !actionIcon) {
    return { x: 0, y: -60 };
  }

  if (actionIcon === "report" || actionIcon === "sabotage") {
    return { x: 20, y: -62 };
  }

  return { x: 18, y: -58 };
};

export class AvatarRig {
  readonly container: Phaser.GameObjects.Container;
  readonly #root: Phaser.GameObjects.Container;
  readonly #shadow: Phaser.GameObjects.Graphics;
  readonly #aura: Phaser.GameObjects.Graphics;
  readonly #back: Phaser.GameObjects.Graphics;
  readonly #body: Phaser.GameObjects.Graphics;
  readonly #head: Phaser.GameObjects.Graphics;
  readonly #outfit: Phaser.GameObjects.Graphics;
  readonly #mask: Phaser.GameObjects.Graphics;
  readonly #front: Phaser.GameObjects.Graphics;
  readonly #bubble: Phaser.GameObjects.Container;
  readonly #bubbleBg: Phaser.GameObjects.Graphics;
  readonly #bubbleText: Phaser.GameObjects.Text;
  readonly #actionBadge: Phaser.GameObjects.Container;
  readonly #actionBadgeBg: Phaser.GameObjects.Graphics;
  readonly #actionBadgeText: Phaser.GameObjects.Text;
  readonly #appearance: AvatarAppearance;
  readonly #mode: AvatarRigMode;
  #state: AvatarRigState = {
    pose: "calm",
    visiblePosture: "calm",
    facing: "south",
    cue: {
      eventId: null,
      gesture: "idle",
      speechText: null,
      targetPlayerId: null,
      emphasis: 0,
      actionIcon: null,
    },
    connected: true,
    suspiciousness: 0.3,
    alive: true,
  };
  #lastEventId: string | null = null;
  #activeGesture: AvatarGesture = "idle";
  #bubbleMs = 0;
  #gestureMs = 0;
  #moving = false;
  #time = 0;
  #seed = 0;

  constructor(
    scene: Phaser.Scene,
    appearance: AvatarAppearance,
    mode: AvatarRigMode,
  ) {
    this.#appearance = appearance;
    this.#mode = mode;
    this.#seed = appearance.key.length * 47;
    this.#shadow = scene.add.graphics();
    this.#aura = scene.add.graphics().setBlendMode(Phaser.BlendModes.SCREEN);
    this.#back = scene.add.graphics();
    this.#body = scene.add.graphics();
    this.#head = scene.add.graphics();
    this.#outfit = scene.add.graphics();
    this.#mask = scene.add.graphics();
    this.#front = scene.add.graphics();
    this.#root = scene.add.container(0, 0, [
      this.#shadow,
      this.#aura,
      this.#back,
      this.#body,
      this.#head,
      this.#outfit,
      this.#mask,
      this.#front,
    ]);
    this.#root.setScale(MODE[mode].scale);

    this.#bubbleBg = scene.add.graphics();
    this.#bubbleText = scene.add.text(0, 0, "", {
      align: "center",
      color: appearance.bubbleTextColor,
      fontFamily: appearance.bubbleFontFamily,
      fontSize: `${MODE[mode].fontSize}px`,
      fontStyle: "600",
      wordWrap: {
        width: MODE[mode].bubbleWidth - 24,
        useAdvancedWrap: true,
      },
    });
    this.#bubbleText.setOrigin(0.5);
    this.#bubble = scene.add.container(0, MODE[mode].bubbleY, [
      this.#bubbleBg,
      this.#bubbleText,
    ]);
    this.#bubble.setVisible(false);

    this.#actionBadgeBg = scene.add.graphics();
    this.#actionBadgeText = scene.add.text(0, 0, "", {
      align: "center",
      color: "#eef4fb",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      letterSpacing: 0.8,
    });
    this.#actionBadgeText.setOrigin(0.5);
    this.#actionBadge = scene.add.container(0, -58, [
      this.#actionBadgeBg,
      this.#actionBadgeText,
    ]);
    this.#actionBadge.setVisible(false);

    this.container = scene.add.container(0, 0, [
      this.#root,
      this.#bubble,
      this.#actionBadge,
    ]);
    this.#render();
  }

  setMovementState(moving: boolean) {
    this.#moving = moving;
  }

  applyState(state: AvatarRigState) {
    this.#state = state;

    if (
      state.cue.eventId &&
      state.cue.eventId !== this.#lastEventId &&
      state.cue.gesture !== "idle"
    ) {
      this.#lastEventId = state.cue.eventId;
      this.#activeGesture = state.cue.gesture;
      this.#gestureMs = gestureDuration(state.cue.gesture);
      this.#bubbleMs = bubbleDuration(state.cue.speechText);
      this.#bubbleText.setText(state.cue.speechText ?? "");
    } else if (!state.cue.eventId && this.#bubbleMs <= 0) {
      this.#activeGesture = this.#moving ? "move" : "idle";
    }

    this.#render();
  }

  update(delta: number) {
    this.#time += delta;
    this.#gestureMs = Math.max(0, this.#gestureMs - delta);
    this.#bubbleMs = Math.max(0, this.#bubbleMs - delta);

    if (this.#gestureMs === 0 && this.#activeGesture !== "idle") {
      this.#activeGesture = this.#moving ? "move" : "idle";
    }

    this.#render();
  }

  destroy() {
    this.container.destroy(true);
  }

  #render() {
    const pose = poseProfile(this.#state.pose);
    const posture = posturePalette(
      this.#state.visiblePosture,
      this.#appearance.trimColor,
      this.#state.suspiciousness,
    );
    const facing = FACING[this.#state.facing];
    const mirror = facing.x < 0 ? -1 : 1;
    const side = Math.abs(facing.x);
    const cycle =
      (this.#time + this.#seed) * 0.0017 * this.#appearance.movementCadence;
    const stride = this.#moving ? Math.sin(cycle * 10) : 0;
    const motionLift = this.#moving ? Math.abs(Math.cos(cycle * 10)) * 1.6 : 0;
    const bob =
      Math.sin(cycle * 2.5) * this.#appearance.idleAmplitude * 0.8 +
      stride * 1.15 +
      motionLift;
    const jitter =
      pose.jitter > 0
        ? (Math.sin(cycle * 17) + Math.cos(cycle * 23)) * pose.jitter * 0.7
        : 0;
    const lean =
      pose.lean +
      (this.#moving ? mirror * 0.8 : 0) +
      (this.#activeGesture === "accuse"
        ? 3.2
        : this.#activeGesture === "recoil"
          ? -2.6
          : this.#activeGesture === "reassure"
            ? 0.8
            : 0);
    const lift = pose.lift + (this.#activeGesture === "recoil" ? 2.2 : 0);
    const headX = facing.x * 4.2 + jitter * 0.45;
    const headY = -47 + bob - lift * 0.3;
    const chestY = -33 + lift + bob;
    const hipY = -16 + bob;
    const torsoWidth =
      ({ slim: 17, poised: 19, broad: 22, compact: 18 } as const)[
        this.#appearance.silhouette
      ] *
      (1 - side * 0.08);
    const frontShoulderX = torsoWidth * 0.36 * mirror;
    const backShoulderX = -frontShoulderX;
    const aura = mixColor(
      posture.aura,
      0xff8d73,
      this.#state.visiblePosture === "defiant"
        ? 0.32
        : this.#state.suspiciousness * 0.28,
    );

    this.#root.setPosition(jitter, bob * 0.18);
    this.#root.setAlpha(
      (this.#state.connected ? 1 : 0.5) * (this.#state.alive ? 1 : 0.42),
    );

    this.#shadow.clear();
    this.#shadow.fillStyle(
      this.#appearance.shadowColor,
      0.25 * (this.#state.alive ? 1 : 0.6),
    );
    this.#shadow.fillEllipse(0, 4, 28 - facing.y * 2, 9);

    this.#aura.clear();
    this.#aura.fillStyle(
      aura,
      pose.aura +
        this.#state.suspiciousness * 0.08 +
        (this.#state.visiblePosture === "alert" ? 0.08 : 0),
    );
    this.#aura.fillEllipse(0, -22, 34, 56);

    this.#body.clear();
    this.#body.lineStyle(
      3.5,
      mixColor(this.#appearance.outfitColor, 0x090d12, 0.34),
    );
    const frontHand = this.#armTarget(
      frontShoulderX,
      chestY,
      mirror,
      stride,
      facing,
      true,
    );
    const backHand = this.#armTarget(
      backShoulderX,
      chestY,
      -mirror,
      stride,
      facing,
      false,
    );
    this.#body.beginPath();
    this.#body.moveTo(backShoulderX, chestY);
    this.#body.lineTo(backHand.x, backHand.y);
    this.#body.strokePath();
    this.#body.beginPath();
    this.#body.moveTo(frontShoulderX, chestY);
    this.#body.lineTo(frontHand.x, frontHand.y);
    this.#body.strokePath();
    this.#body.fillStyle(this.#appearance.bodyColor, 1);
    this.#body.fillCircle(frontHand.x, frontHand.y, 2.4);
    this.#body.fillCircle(backHand.x, backHand.y, 2.1);
    this.#body.fillRoundedRect(-4.2 + lean * 0.1, -14 + bob * 0.05, 3.8, 18, 2);
    this.#body.fillRoundedRect(0.6 + lean * 0.1, -14 - bob * 0.04, 3.8, 18, 2);

    this.#head.clear();
    this.#head.fillStyle(this.#appearance.bodyColor, 1);
    this.#head.fillEllipse(headX, headY, 18 - side * 1.4, 20);
    this.#head.lineStyle(
      1.4,
      mixColor(this.#appearance.bodyColor, 0x1a1412, 0.4),
    );
    this.#head.strokeEllipse(headX, headY, 18 - side * 1.4, 20);
    this.#head.setRotation(
      pose.tilt +
        Math.sin(cycle * 2.1) * 0.015 +
        (this.#activeGesture === "accuse" ? -0.03 * mirror : 0),
    );

    this.#back.clear();
    this.#front.clear();
    this.#drawPresenceSilhouette(
      torsoWidth,
      chestY,
      hipY,
      mirror,
      posture.accent,
    );

    this.#outfit.clear();
    this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
    this.#drawOutfit(torsoWidth, chestY, hipY, lean, mirror);
    this.#outfit.lineStyle(
      this.#state.visiblePosture === "confident" ? 2.6 : 2,
      this.#appearance.trimColor,
      this.#state.visiblePosture === "defiant" ? 1 : 0.84,
    );
    this.#outfit.beginPath();
    this.#outfit.moveTo(-torsoWidth * 0.45 + lean * 0.08, chestY + 2);
    this.#outfit.lineTo(torsoWidth * 0.45 + lean * 0.08, chestY + 2);
    this.#outfit.strokePath();

    this.#mask.clear();
    this.#mask.fillStyle(this.#appearance.maskColor, 0.96);
    this.#drawMask(headX, headY, mirror, false);
    this.#mask.lineStyle(
      1.25,
      mixColor(this.#appearance.maskColor, 0x111111, 0.45),
    );
    this.#drawMask(headX, headY, mirror, true);

    this.#drawAccessory(headX, headY, chestY, mirror, facing.y);

    this.#renderBubble();
    this.#renderActionBadge(posture);
  }

  #armTarget(
    shoulderX: number,
    shoulderY: number,
    mirror: number,
    stride: number,
    facing: { x: number; y: number },
    frontArm: boolean,
  ) {
    if (frontArm && this.#activeGesture === "accuse") {
      return {
        x: shoulderX + mirror * (15 + Math.abs(facing.x) * 8),
        y: shoulderY - 8 + facing.y * 2,
      };
    }

    if (this.#activeGesture === "recoil") {
      return {
        x: shoulderX - mirror * (frontArm ? 10 : 4),
        y: shoulderY + (frontArm ? 7 : 5),
      };
    }

    if (frontArm && this.#activeGesture === "comfort") {
      return { x: shoulderX + mirror * 8, y: shoulderY - 6 };
    }

    if (frontArm && this.#activeGesture === "reassure") {
      return { x: shoulderX + mirror * 10, y: shoulderY - 2 };
    }

    return {
      x: shoulderX + mirror * (frontArm ? 5 + stride * 2.8 : -4 - stride * 1.8),
      y: shoulderY + (frontArm ? 4 : 6),
    };
  }

  #drawOutfit(
    torsoWidth: number,
    chestY: number,
    hipY: number,
    lean: number,
    mirror: number,
  ) {
    const center = lean * 0.08;

    switch (this.#appearance.outfitStyle) {
      case "cloak":
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.82, y: chestY - 2 },
            { x: center + torsoWidth * 0.82, y: chestY - 2 },
            { x: center + torsoWidth * 0.55, y: hipY + 10 },
            { x: center, y: hipY + 16 },
            { x: center - torsoWidth * 0.55, y: hipY + 10 },
          ]),
          true,
        );
        return;
      case "gown":
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.58, y: chestY - 1 },
            { x: center + torsoWidth * 0.58, y: chestY - 1 },
            { x: center + torsoWidth * 0.92, y: hipY + 12 },
            { x: center, y: hipY + 18 },
            { x: center - torsoWidth * 0.92, y: hipY + 12 },
          ]),
          true,
        );
        return;
      case "vest":
        this.#outfit.fillRoundedRect(
          center - torsoWidth * 0.52,
          chestY - 3,
          torsoWidth * 1.04,
          29,
          8,
        );
        this.#outfit.fillStyle(this.#appearance.trimColor, 0.9);
        this.#outfit.fillRoundedRect(center - 2, chestY + 2, 4, 21, 2);
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
        return;
      default:
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.6, y: chestY - 2 },
            { x: center + torsoWidth * 0.6, y: chestY - 2 },
            { x: center + torsoWidth * 0.46, y: hipY + 10 },
            { x: center + mirror * 2, y: hipY + 16 },
            { x: center - mirror * 2, y: hipY + 16 },
            { x: center - torsoWidth * 0.46, y: hipY + 10 },
          ]),
          true,
        );
        return;
    }
  }

  #drawMask(headX: number, headY: number, _mirror: number, stroke: boolean) {
    const drawEyes = (leftX: number, rightX: number, y: number) => {
      if (stroke) {
        return;
      }

      this.#mask.fillStyle(0x10151a, 0.9);
      this.#mask.fillEllipse(leftX, y, 2.4, 1.6);
      this.#mask.fillEllipse(rightX, y, 2.4, 1.6);
    };

    switch (this.#appearance.maskStyle) {
      case "wing":
        if (stroke) {
          this.#mask.strokePoints(
            points([
              { x: headX - 8, y: headY - 1 },
              { x: headX, y: headY - 6 },
              { x: headX + 8, y: headY - 1 },
              { x: headX + 5, y: headY + 6 },
              { x: headX - 5, y: headY + 6 },
            ]),
            true,
          );
        } else {
          this.#mask.fillPoints(
            points([
              { x: headX - 8, y: headY - 1 },
              { x: headX, y: headY - 6 },
              { x: headX + 8, y: headY - 1 },
              { x: headX + 5, y: headY + 6 },
              { x: headX - 5, y: headY + 6 },
            ]),
            true,
          );
          drawEyes(headX - 3, headX + 3, headY);
        }
        return;
      case "owl":
        stroke
          ? this.#mask.strokeEllipse(headX, headY, 16, 12)
          : this.#mask.fillEllipse(headX, headY, 16, 12);
        drawEyes(headX - 4, headX + 4, headY);
        return;
      case "spire":
        if (stroke) {
          this.#mask.strokePoints(
            points([
              { x: headX, y: headY - 8 },
              { x: headX + 8, y: headY - 1 },
              { x: headX + 3, y: headY + 7 },
              { x: headX - 3, y: headY + 7 },
              { x: headX - 8, y: headY - 1 },
            ]),
            true,
          );
        } else {
          this.#mask.fillPoints(
            points([
              { x: headX, y: headY - 8 },
              { x: headX + 8, y: headY - 1 },
              { x: headX + 3, y: headY + 7 },
              { x: headX - 3, y: headY + 7 },
              { x: headX - 8, y: headY - 1 },
            ]),
            true,
          );
          drawEyes(headX - 2.5, headX + 2.5, headY + 0.5);
        }
        return;
      default:
        stroke
          ? this.#mask.strokeRoundedRect(headX - 8, headY - 5, 16, 10, 4)
          : this.#mask.fillRoundedRect(headX - 8, headY - 5, 16, 10, 4);
        drawEyes(headX - 3, headX + 3, headY);
        return;
    }
  }

  #drawAccessory(
    headX: number,
    headY: number,
    chestY: number,
    mirror: number,
    facingY: number,
  ) {
    const outline = mixColor(this.#appearance.accessoryColor, 0x090d12, 0.4);
    this.#back.fillStyle(this.#appearance.accessoryColor, 0.95);
    this.#front.fillStyle(this.#appearance.accessoryColor, 0.95);
    this.#back.lineStyle(1.2, outline);
    this.#front.lineStyle(1.2, outline);

    switch (this.#appearance.accessoryStyle) {
      case "plume":
        this.#back.fillPoints(
          points([
            { x: headX + mirror * 2, y: headY - 14 },
            { x: headX + mirror * 11, y: headY - 25 },
            { x: headX + mirror * 4, y: headY - 5 },
          ]),
          true,
        );
        break;
      case "brooch":
        this.#front.fillCircle(mirror * 5, chestY + 8, 3.2);
        this.#front.strokeCircle(mirror * 5, chestY + 8, 3.2);
        break;
      case "monocle":
        this.#front.strokeCircle(headX + mirror * 4.8, headY, 3);
        this.#front.beginPath();
        this.#front.moveTo(headX + mirror * 7.5, headY + 2);
        this.#front.lineTo(headX + mirror * 10.5, headY + 11);
        this.#front.strokePath();
        break;
      case "chain":
        this.#front.beginPath();
        this.#front.moveTo(-6 * mirror, chestY + 4);
        this.#front.lineTo(7 * mirror, chestY + 12);
        this.#front.strokePath();
        this.#front.fillCircle(9 * mirror, chestY + 13, 2.4);
        break;
      default:
        this.#front.fillCircle(mirror * 5, chestY + 6, 2.8);
        this.#front.fillCircle(mirror * 2.5, chestY + 3, 2.2);
        this.#front.fillCircle(mirror * 7.2, chestY + 3, 2.2);
        this.#front.fillStyle(
          mixColor(this.#appearance.accessoryColor, 0xf2dfa4, 0.5),
          1,
        );
        this.#front.fillCircle(mirror * 5, chestY + 6, 0.9);
        break;
    }

    this.#back.setAlpha(facingY < 0 ? 0.74 : 0.9);
    this.#front.setAlpha(facingY < 0 ? 0.82 : 1);
  }

  #drawPresenceSilhouette(
    torsoWidth: number,
    chestY: number,
    hipY: number,
    mirror: number,
    accentColor: number,
  ) {
    this.#back.fillStyle(accentColor, 0.14);
    this.#back.lineStyle(0, 0, 0);

    switch (this.#appearance.silhouette) {
      case "broad":
        this.#back.fillRoundedRect(
          -torsoWidth * 0.78,
          chestY - 7,
          torsoWidth * 1.56,
          14,
          6,
        );
        break;
      case "slim":
        this.#back.fillEllipse(0, chestY - 1, torsoWidth * 1.1, 12);
        break;
      case "compact":
        this.#back.fillPoints(
          points([
            { x: -torsoWidth * 0.7, y: chestY + 1 },
            { x: torsoWidth * 0.7, y: chestY + 1 },
            { x: torsoWidth * 0.38 * mirror, y: hipY + 4 },
            { x: -torsoWidth * 0.38 * mirror, y: hipY + 4 },
          ]),
          true,
        );
        break;
      default:
        this.#back.fillRoundedRect(
          -torsoWidth * 0.64,
          chestY - 5,
          torsoWidth * 1.28,
          11,
          5,
        );
        break;
    }

    this.#front.fillStyle(accentColor, 0.18);
    this.#front.fillRoundedRect(-7, hipY + 7, 14, 4, 2);
  }

  #renderBubble() {
    const visible =
      this.#bubbleMs > 0 && this.#bubbleText.text.trim().length > 0;
    this.#bubble.setVisible(visible);
    if (!visible) {
      return;
    }

    const visiblePosture = this.#state.visiblePosture;
    const width = Phaser.Math.Clamp(
      this.#bubbleText.width + 24,
      72,
      MODE[this.#mode].bubbleWidth,
    );
    const height = this.#bubbleText.height + 18;
    const alpha = this.#bubbleMs < 260 ? this.#bubbleMs / 260 : 0.98;
    const stroke = mixColor(
      this.#appearance.bubbleStroke,
      0xffa281,
      visiblePosture === "defiant" || visiblePosture === "suspicious"
        ? 0.25
        : 0,
    );
    const fill = mixColor(
      this.#appearance.bubbleFill,
      0xffffff,
      visiblePosture === "confident"
        ? 0.12
        : visiblePosture === "alert"
          ? 0.08
          : 0,
    );
    const wobble =
      visiblePosture === "shaken"
        ? Math.sin((this.#time + this.#seed) * 0.019) * 0.03
        : visiblePosture === "defiant"
          ? -0.03
          : visiblePosture === "confident"
            ? -0.01
            : 0;

    this.#bubbleBg.clear();
    this.#bubbleBg.fillStyle(fill, alpha);
    this.#bubbleBg.lineStyle(
      visiblePosture === "defiant" || visiblePosture === "suspicious" ? 3 : 2,
      stroke,
      alpha,
    );
    this.#drawBubbleShape(this.#appearance.bubbleStyle, width, height);
    this.#bubble.setRotation(wobble);
    this.#bubble.setAlpha(alpha);
    this.#bubbleText.setStyle({
      color: this.#appearance.bubbleTextColor,
      fontFamily: this.#appearance.bubbleFontFamily,
      fontSize: `${MODE[this.#mode].fontSize}px`,
      fontStyle:
        visiblePosture === "defiant" || visiblePosture === "confident"
          ? "bold"
          : "600",
    });
  }

  #renderActionBadge(posture: ReturnType<typeof posturePalette>) {
    const actionIcon = this.#state.cue.actionIcon;
    const label =
      this.#state.cue.badgeText ??
      (actionIcon ? actionIconLabel(actionIcon) : "");
    const visible = Boolean(
      label &&
        this.#state.alive &&
        (this.#state.cue.eventId || this.#state.cue.emphasis >= 0.45),
    );

    this.#actionBadge.setVisible(visible);
    if (!visible) {
      return;
    }

    const width = Phaser.Math.Clamp(44 + label.length * 5.8, 62, 106);
    const { x, y } = actionAnchor(
      actionIcon,
      Boolean(this.#state.cue.badgeText),
    );

    this.#actionBadge.setPosition(x, y);
    this.#actionBadge.setAlpha(
      this.#state.cue.emphasis >= 0.9
        ? 1
        : 0.84 + this.#state.cue.emphasis * 0.14,
    );
    this.#actionBadgeText.setText(label);
    this.#actionBadgeText.setStyle({
      color: posture.badgeText,
      fontFamily: "Segoe UI, sans-serif",
      fontSize: `${this.#mode === "portrait" ? 9 : 10}px`,
      fontStyle: "bold",
    });

    this.#actionBadgeBg.clear();
    this.#actionBadgeBg.fillStyle(posture.badgeFill, 0.92);
    this.#actionBadgeBg.lineStyle(2, posture.badgeStroke, 0.8);
    this.#actionBadgeBg.fillRoundedRect(-width / 2, -11, width, 22, 8);
    this.#actionBadgeBg.strokeRoundedRect(-width / 2, -11, width, 22, 8);
  }

  #drawBubbleShape(style: AvatarBubbleStyle, width: number, height: number) {
    const left = -width / 2;
    const top = -height / 2;
    const tailX = Phaser.Math.Clamp(
      FACING[this.#state.facing].x * 12,
      -width * 0.28,
      width * 0.28,
    );

    switch (style) {
      case "thorn":
        this.#bubbleBg.fillPoints(
          points([
            { x: left + 8, y: top },
            { x: left + width - 10, y: top + 2 },
            { x: left + width, y: top + height * 0.5 },
            { x: left + width - 12, y: top + height },
            { x: left + 18, y: top + height - 2 },
            { x: tailX, y: top + height + 10 },
            { x: left, y: top + height * 0.58 },
          ]),
          true,
        );
        this.#bubbleBg.strokePoints(
          points([
            { x: left + 8, y: top },
            { x: left + width - 10, y: top + 2 },
            { x: left + width, y: top + height * 0.5 },
            { x: left + width - 12, y: top + height },
            { x: left + 18, y: top + height - 2 },
            { x: tailX, y: top + height + 10 },
            { x: left, y: top + height * 0.58 },
          ]),
          true,
        );
        return;
      case "glass":
        this.#bubbleBg.fillRoundedRect(left, top, width, height, 16);
        this.#bubbleBg.strokeRoundedRect(left, top, width, height, 16);
        break;
      case "soft":
        this.#bubbleBg.fillRoundedRect(left, top, width, height, 18);
        this.#bubbleBg.strokeRoundedRect(left, top, width, height, 18);
        break;
      default:
        this.#bubbleBg.fillRoundedRect(left, top, width, height, 9);
        this.#bubbleBg.strokeRoundedRect(left, top, width, height, 9);
        break;
    }

    this.#bubbleBg.fillTriangle(
      tailX - 7,
      top + height - 1,
      tailX + 7,
      top + height - 1,
      tailX,
      top + height + 10,
    );
  }
}
