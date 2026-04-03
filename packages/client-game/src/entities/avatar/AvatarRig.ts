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
  world: { scale: 1.07, bubbleWidth: 176, bubbleY: -100, fontSize: 12 },
  portrait: { scale: 1.38, bubbleWidth: 132, bubbleY: -120, fontSize: 11 },
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
      return { lean: 2.2, lift: 1.2, tilt: -0.07, jitter: 0.28, aura: 0.22 };
    case "shaken":
      return { lean: -2.6, lift: 2.6, tilt: 0.09, jitter: 0.62, aura: 0.28 };
    case "defiant":
      return { lean: 3.6, lift: -0.4, tilt: -0.1, jitter: 0.08, aura: 0.28 };
    case "confident":
      return { lean: 1.2, lift: -0.08, tilt: -0.035, jitter: 0.04, aura: 0.18 };
    default:
      return { lean: 0, lift: 0, tilt: 0, jitter: 0.03, aura: 0.14 };
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

const BODY_TYPE_PROFILE = {
  short: { scaleX: 0.91, scaleY: 0.9, heightOffset: 5, headScale: 0.93 },
  medium: { scaleX: 1, scaleY: 1, heightOffset: 0, headScale: 1 },
  tall: { scaleX: 1.06, scaleY: 1.12, heightOffset: -5, headScale: 1.04 },
} as const satisfies Record<
  AvatarAppearance["bodyType"],
  { scaleX: number; scaleY: number; heightOffset: number; headScale: number }
>;

const SILHOUETTE_PROFILE = {
  lithe: {
    torsoWidth: 15,
    shoulderWidth: 15,
    torsoHeight: 27,
    hemWidth: 17,
    auraWidth: 31,
    auraHeight: 54,
  },
  regal: {
    torsoWidth: 19,
    shoulderWidth: 22,
    torsoHeight: 30,
    hemWidth: 31,
    auraWidth: 38,
    auraHeight: 64,
  },
  broad: {
    torsoWidth: 23,
    shoulderWidth: 28,
    torsoHeight: 28,
    hemWidth: 25,
    auraWidth: 42,
    auraHeight: 60,
  },
  compact: {
    torsoWidth: 17,
    shoulderWidth: 17,
    torsoHeight: 24,
    hemWidth: 17,
    auraWidth: 30,
    auraHeight: 47,
  },
  draped: {
    torsoWidth: 18,
    shoulderWidth: 20,
    torsoHeight: 28,
    hemWidth: 32,
    auraWidth: 38,
    auraHeight: 62,
  },
  structured: {
    torsoWidth: 18,
    shoulderWidth: 24,
    torsoHeight: 27,
    hemWidth: 22,
    auraWidth: 35,
    auraHeight: 56,
  },
} as const satisfies Record<
  AvatarAppearance["silhouette"],
  {
    torsoWidth: number;
    shoulderWidth: number;
    torsoHeight: number;
    hemWidth: number;
    auraWidth: number;
    auraHeight: number;
  }
>;

const STANCE_PROFILE = {
  grounded: {
    leanBias: -0.4,
    strideScale: 0.88,
    sway: 0.12,
    restTilt: -0.01,
  },
  guarded: {
    leanBias: -1.1,
    strideScale: 0.8,
    sway: 0.18,
    restTilt: 0.02,
  },
  gliding: {
    leanBias: 0.8,
    strideScale: 1.02,
    sway: 0.28,
    restTilt: -0.03,
  },
  commanding: {
    leanBias: 1.7,
    strideScale: 1.1,
    sway: 0.1,
    restTilt: -0.05,
  },
  measured: {
    leanBias: 0.1,
    strideScale: 0.74,
    sway: 0.08,
    restTilt: -0.015,
  },
  buoyant: {
    leanBias: 0.45,
    strideScale: 1.14,
    sway: 0.34,
    restTilt: 0.01,
  },
} as const satisfies Record<
  AvatarAppearance["stanceBias"],
  { leanBias: number; strideScale: number; sway: number; restTilt: number }
>;

export class AvatarRig {
  readonly container: Phaser.GameObjects.Container;
  readonly #root: Phaser.GameObjects.Container;
  readonly #shadow: Phaser.GameObjects.Graphics;
  readonly #aura: Phaser.GameObjects.Graphics;
  readonly #back: Phaser.GameObjects.Graphics;
  readonly #body: Phaser.GameObjects.Graphics;
  readonly #head: Phaser.GameObjects.Graphics;
  readonly #hair: Phaser.GameObjects.Graphics;
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
    this.#hair = scene.add.graphics();
    this.#outfit = scene.add.graphics();
    this.#mask = scene.add.graphics();
    this.#front = scene.add.graphics();
    this.#root = scene.add.container(0, 0, [
      this.#shadow,
      this.#aura,
      this.#back,
      this.#body,
      this.#head,
      this.#hair,
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
    const bodyProfile = BODY_TYPE_PROFILE[this.#appearance.bodyType];
    const silhouette = SILHOUETTE_PROFILE[this.#appearance.silhouette];
    const stance = STANCE_PROFILE[this.#appearance.stanceBias];
    const facing = FACING[this.#state.facing];
    const mirror = facing.x < 0 ? -1 : 1;
    const side = Math.abs(facing.x);
    const cycle =
      (this.#time + this.#seed) * 0.00145 * this.#appearance.movementCadence;
    const stride = this.#moving
      ? Math.sin(cycle * 9.4) * stance.strideScale * 0.92
      : 0;
    const motionLift = this.#moving
      ? Math.abs(Math.cos(cycle * 9.4)) * (0.76 + bodyProfile.scaleY * 0.18)
      : 0;
    const bob =
      Math.sin(cycle * 2.15) *
        this.#appearance.idleAmplitude *
        (0.44 + stance.sway * 0.54) +
      stride * 0.42 +
      motionLift;
    const jitter =
      pose.jitter > 0
        ? (Math.sin(cycle * 17) + Math.cos(cycle * 23)) * pose.jitter * 0.7
        : 0;
    const lean =
      pose.lean +
      stance.leanBias +
      (this.#moving ? mirror * 0.8 : 0) +
      (this.#activeGesture === "accuse"
        ? 3.2
        : this.#activeGesture === "recoil"
          ? -2.6
          : this.#activeGesture === "reassure"
            ? 0.8
            : 0);
    const lift = pose.lift + (this.#activeGesture === "recoil" ? 2.2 : 0);
    const headX = facing.x * (4.2 + stance.sway * 5) + jitter * 0.45;
    const headY = -47 + bodyProfile.heightOffset + bob - lift * 0.3;
    const chestY = -33 + bodyProfile.heightOffset + lift + bob;
    const hipY = chestY + silhouette.torsoHeight;
    const torsoWidth = silhouette.torsoWidth * (1 - side * 0.08);
    const shoulderWidth = silhouette.shoulderWidth * (1 - side * 0.05);
    const hemWidth = silhouette.hemWidth * (1 - side * 0.02);
    const frontShoulderX = shoulderWidth * 0.36 * mirror;
    const backShoulderX = -frontShoulderX;
    const aura = mixColor(
      posture.aura,
      0xff8d73,
      this.#state.visiblePosture === "defiant"
        ? 0.32
        : this.#state.suspiciousness * 0.28,
    );
    const auraColor =
      this.#mode === "portrait"
        ? mixColor(aura, this.#appearance.portraitGlowColor, 0.38)
        : aura;
    const hairColor = mixColor(
      this.#appearance.outfitColor,
      0x0c0b0f,
      0.36 + this.#appearance.assertiveness * 0.1,
    );
    const shadowStretch = this.#moving ? 1.08 : 1;

    this.#root.setPosition(jitter * 0.75, bob * 0.08);
    this.#root.setScale(
      MODE[this.#mode].scale * bodyProfile.scaleX,
      MODE[this.#mode].scale * bodyProfile.scaleY,
    );
    this.#root.setAlpha(
      (this.#state.connected ? 1 : 0.5) * (this.#state.alive ? 1 : 0.42),
    );

    this.#shadow.clear();
    this.#shadow.fillStyle(
      this.#appearance.shadowColor,
      0.3 * (this.#state.alive ? 1 : 0.62),
    );
    this.#shadow.fillEllipse(
      0,
      6,
      (shoulderWidth + 10 - facing.y * 1.6) * shadowStretch,
      this.#moving ? 8.6 : 10,
    );

    this.#aura.clear();
    this.#aura.fillStyle(
      auraColor,
      pose.aura * 0.9 +
        this.#state.suspiciousness * 0.06 +
        (this.#state.visiblePosture === "alert" ? 0.05 : 0) +
        (this.#mode === "portrait" ? 0.07 : 0),
    );
    this.#aura.fillEllipse(
      0,
      -22 + bodyProfile.heightOffset * 0.25,
      silhouette.auraWidth * (this.#mode === "portrait" ? 1.08 : 1),
      silhouette.auraHeight * (this.#mode === "portrait" ? 0.96 : 1),
    );

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
    this.#head.fillEllipse(
      headX,
      headY,
      (18 - side * 1.4) * bodyProfile.headScale,
      20 * bodyProfile.headScale,
    );
    this.#head.lineStyle(
      1.4,
      mixColor(this.#appearance.bodyColor, 0x1a1412, 0.4),
    );
    this.#head.strokeEllipse(
      headX,
      headY,
      (18 - side * 1.4) * bodyProfile.headScale,
      20 * bodyProfile.headScale,
    );
    this.#head.setRotation(
      pose.tilt +
        stance.restTilt +
        Math.sin(cycle * 2.1) * 0.015 +
        (this.#activeGesture === "accuse" ? -0.03 * mirror : 0),
    );

    this.#hair.clear();
    this.#hair.fillStyle(hairColor, 0.96);
    this.#hair.lineStyle(1.1, mixColor(hairColor, 0x040608, 0.44), 0.9);
    this.#drawHair(headX, headY, mirror, bodyProfile.headScale);

    this.#back.clear();
    this.#front.clear();
    if (this.#mode === "portrait") {
      this.#back.fillStyle(this.#appearance.portraitGlowColor, 0.14);
      this.#back.fillEllipse(
        headX,
        headY - 2,
        silhouette.auraWidth * 0.68,
        silhouette.auraHeight * 0.52,
      );
      this.#back.fillStyle(this.#appearance.portraitGlowColor, 0.06);
      this.#back.fillRoundedRect(
        -hemWidth * 0.62,
        chestY - 12,
        hemWidth * 1.24,
        hipY - chestY + 30,
        12,
      );
    }
    this.#drawPresenceSilhouette(
      shoulderWidth,
      chestY,
      hipY,
      hemWidth,
      mirror,
      posture.accent,
    );
    this.#drawHeaddress(headX, headY, mirror, bodyProfile.headScale);

    this.#outfit.clear();
    this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
    this.#drawOutfit(
      torsoWidth,
      shoulderWidth,
      chestY,
      hipY,
      hemWidth,
      lean,
      mirror,
    );
    this.#outfit.lineStyle(
      this.#state.visiblePosture === "confident" ? 2.6 : 2,
      this.#appearance.trimColor,
      this.#state.visiblePosture === "defiant" ? 1 : 0.84,
    );
    this.#outfit.beginPath();
    this.#outfit.moveTo(-shoulderWidth * 0.35 + lean * 0.08, chestY + 2);
    this.#outfit.lineTo(shoulderWidth * 0.35 + lean * 0.08, chestY + 2);
    this.#outfit.strokePath();

    this.#mask.clear();
    this.#mask.fillStyle(this.#appearance.maskColor, 0.96);
    this.#drawMask(headX, headY, mirror, false);
    this.#mask.lineStyle(
      1.25,
      mixColor(this.#appearance.maskColor, 0x111111, 0.45),
    );
    this.#drawMask(headX, headY, mirror, true);
    this.#mask.lineStyle(1.15, this.#appearance.maskAccentColor, 0.84);
    this.#mask.fillStyle(this.#appearance.maskAccentColor, 0.86);
    this.#drawMaskDetails(headX, headY, mirror);

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
    shoulderWidth: number,
    chestY: number,
    hipY: number,
    hemWidth: number,
    lean: number,
    mirror: number,
  ) {
    const center = lean * 0.08;
    const trimAlpha = this.#mode === "portrait" ? 0.7 : 0.54;
    const liningAlpha = this.#mode === "portrait" ? 0.48 : 0.34;
    const trimOutline = mixColor(this.#appearance.trimColor, 0x0b1014, 0.34);
    const liningOutline = mixColor(
      this.#appearance.liningColor,
      0x080b0f,
      0.42,
    );

    this.#back.fillStyle(this.#appearance.liningColor, liningAlpha);
    this.#back.lineStyle(1, liningOutline, 0.36);
    this.#front.fillStyle(this.#appearance.secondaryColor, trimAlpha);
    this.#front.lineStyle(1.15, trimOutline, 0.76);

    switch (this.#appearance.outfitStyle) {
      case "cloakcoat":
        this.#back.fillPoints(
          points([
            { x: center - shoulderWidth * 0.7, y: chestY - 5 },
            { x: center + shoulderWidth * 0.48, y: chestY - 4 },
            { x: center + hemWidth * 0.56, y: hipY + 8 },
            { x: center + mirror * 2, y: hipY + 19 },
            { x: center - hemWidth * 0.7, y: hipY + 12 },
          ]),
          true,
        );
        this.#back.strokePoints(
          points([
            { x: center - shoulderWidth * 0.7, y: chestY - 5 },
            { x: center + shoulderWidth * 0.48, y: chestY - 4 },
            { x: center + hemWidth * 0.56, y: hipY + 8 },
            { x: center + mirror * 2, y: hipY + 19 },
            { x: center - hemWidth * 0.7, y: hipY + 12 },
          ]),
          true,
        );
        this.#outfit.fillPoints(
          points([
            { x: center - shoulderWidth * 0.58, y: chestY - 4 },
            { x: center + shoulderWidth * 0.58, y: chestY - 4 },
            { x: center + hemWidth * 0.48, y: hipY + 9 },
            { x: center, y: hipY + 16 },
            { x: center - hemWidth * 0.48, y: hipY + 9 },
          ]),
          true,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.26);
        this.#outfit.fillTriangle(
          center,
          chestY - 4,
          center + mirror * 7,
          hipY + 10,
          center - mirror * 7,
          hipY + 10,
        );
        this.#front.fillPoints(
          points([
            { x: center - shoulderWidth * 0.26, y: chestY - 1 },
            { x: center, y: chestY + 12 },
            { x: center - hemWidth * 0.18, y: hipY + 8 },
            { x: center - torsoWidth * 0.2, y: hipY + 2 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center + shoulderWidth * 0.26, y: chestY - 1 },
            { x: center, y: chestY + 12 },
            { x: center + hemWidth * 0.18, y: hipY + 8 },
            { x: center + torsoWidth * 0.2, y: hipY + 2 },
          ]),
          true,
        );
        this.#front.strokePoints(
          points([
            { x: center - shoulderWidth * 0.26, y: chestY - 1 },
            { x: center, y: chestY + 12 },
            { x: center + shoulderWidth * 0.26, y: chestY - 1 },
          ]),
          false,
        );
        this.#front.fillStyle(this.#appearance.trimColor, 0.92);
        this.#front.fillCircle(center, chestY + 6, 1.4);
        this.#front.fillCircle(center, chestY + 12, 1.2);
        return;
      case "ballgown":
        this.#back.fillPoints(
          points([
            { x: center - torsoWidth * 0.72, y: chestY + 2 },
            { x: center + torsoWidth * 0.72, y: chestY + 2 },
            { x: center + hemWidth, y: hipY + 10 },
            { x: center, y: hipY + 22 },
            { x: center - hemWidth, y: hipY + 10 },
          ]),
          true,
        );
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.58, y: chestY - 1 },
            { x: center + torsoWidth * 0.58, y: chestY - 1 },
            { x: center + hemWidth * 0.92, y: hipY + 10 },
            { x: center, y: hipY + 18 },
            { x: center - hemWidth * 0.92, y: hipY + 10 },
          ]),
          true,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.28);
        this.#outfit.fillRoundedRect(center - 2.2, chestY + 1, 4.4, 22, 2.2);
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.6, y: hipY + 4 },
            { x: center - torsoWidth * 0.18, y: hipY + 16 },
            { x: center - hemWidth * 0.72, y: hipY + 10 },
          ]),
          true,
        );
        this.#outfit.fillPoints(
          points([
            { x: center + torsoWidth * 0.6, y: hipY + 4 },
            { x: center + torsoWidth * 0.18, y: hipY + 16 },
            { x: center + hemWidth * 0.72, y: hipY + 10 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center - shoulderWidth * 0.54, y: chestY - 1 },
            { x: center + shoulderWidth * 0.54, y: chestY - 1 },
            { x: center + torsoWidth * 0.26, y: chestY + 7 },
            { x: center - torsoWidth * 0.26, y: chestY + 7 },
          ]),
          true,
        );
        this.#front.fillStyle(this.#appearance.trimColor, 0.86);
        this.#front.fillRoundedRect(center - 7, chestY + 7, 14, 3, 1.5);
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
        return;
      case "column-gown":
        this.#back.fillPoints(
          points([
            { x: center - torsoWidth * 0.46, y: chestY + 6 },
            { x: center + torsoWidth * 0.32, y: chestY + 4 },
            { x: center + hemWidth * 0.28, y: hipY + 18 },
            { x: center - hemWidth * 0.18, y: hipY + 20 },
          ]),
          true,
        );
        this.#outfit.fillRoundedRect(
          center - torsoWidth * 0.48,
          chestY - 2,
          torsoWidth * 0.96,
          hipY - chestY + 18,
          8,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.24);
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.24, y: chestY + 2 },
            { x: center + torsoWidth * 0.52, y: chestY + 8 },
            { x: center + hemWidth * 0.42, y: hipY + 12 },
            { x: center + torsoWidth * 0.04, y: hipY + 14 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center - torsoWidth * 0.32, y: chestY },
            { x: center + torsoWidth * 0.2, y: chestY + 6 },
            { x: center - torsoWidth * 0.04, y: hipY + 14 },
            { x: center - torsoWidth * 0.38, y: hipY + 9 },
          ]),
          true,
        );
        this.#front.fillStyle(this.#appearance.trimColor, 0.82);
        this.#front.fillRoundedRect(center - 8, hipY + 9, 16, 3, 1.5);
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
        return;
      case "shawl-drape":
        this.#back.fillPoints(
          points([
            { x: center - shoulderWidth * 0.62, y: chestY - 6 },
            { x: center + shoulderWidth * 0.18, y: chestY - 2 },
            { x: center - torsoWidth * 0.08, y: chestY + 10 },
            { x: center - hemWidth * 0.72, y: hipY + 14 },
            { x: center - hemWidth * 0.42, y: hipY + 5 },
          ]),
          true,
        );
        this.#outfit.fillRoundedRect(
          center - torsoWidth * 0.52,
          chestY - 2,
          torsoWidth * 1.04,
          hipY - chestY + 13,
          8,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.24);
        this.#outfit.fillPoints(
          points([
            { x: center - shoulderWidth * 0.5, y: chestY - 5 },
            { x: center + torsoWidth * 0.1, y: chestY + 4 },
            { x: center - hemWidth * 0.58, y: hipY + 12 },
            { x: center - torsoWidth * 0.2, y: hipY + 14 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center - shoulderWidth * 0.16, y: chestY - 2 },
            { x: center + shoulderWidth * 0.44, y: chestY + 2 },
            { x: center + torsoWidth * 0.2, y: hipY + 10 },
            { x: center - torsoWidth * 0.1, y: hipY + 8 },
          ]),
          true,
        );
        this.#front.fillStyle(this.#appearance.trimColor, 0.88);
        this.#front.fillCircle(center - mirror * 3, chestY + 8, 1.5);
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
        return;
      case "waistcoat":
        this.#back.fillPoints(
          points([
            { x: center - torsoWidth * 0.44, y: chestY + 7 },
            { x: center - torsoWidth * 0.14, y: chestY + 11 },
            { x: center - torsoWidth * 0.28, y: hipY + 18 },
            { x: center - torsoWidth * 0.54, y: hipY + 12 },
          ]),
          true,
        );
        this.#back.fillPoints(
          points([
            { x: center + torsoWidth * 0.44, y: chestY + 7 },
            { x: center + torsoWidth * 0.14, y: chestY + 11 },
            { x: center + torsoWidth * 0.28, y: hipY + 18 },
            { x: center + torsoWidth * 0.54, y: hipY + 12 },
          ]),
          true,
        );
        this.#outfit.fillRoundedRect(
          center - torsoWidth * 0.52,
          chestY - 3,
          torsoWidth * 1.04,
          29,
          8,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.94);
        this.#outfit.fillRoundedRect(
          center - torsoWidth * 0.2,
          chestY + 1,
          torsoWidth * 0.4,
          22,
          4,
        );
        this.#outfit.fillStyle(this.#appearance.trimColor, 0.92);
        this.#outfit.fillRoundedRect(center - 2, chestY + 2, 4, 21, 2);
        this.#outfit.fillCircle(center - torsoWidth * 0.26, chestY + 8, 1.3);
        this.#outfit.fillCircle(center + torsoWidth * 0.26, chestY + 8, 1.3);
        this.#outfit.fillCircle(center - torsoWidth * 0.24, chestY + 14, 1.2);
        this.#outfit.fillCircle(center + torsoWidth * 0.24, chestY + 14, 1.2);
        this.#front.fillPoints(
          points([
            { x: center - shoulderWidth * 0.42, y: chestY - 2 },
            { x: center - torsoWidth * 0.08, y: chestY + 7 },
            { x: center - torsoWidth * 0.22, y: chestY + 15 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center + shoulderWidth * 0.42, y: chestY - 2 },
            { x: center + torsoWidth * 0.08, y: chestY + 7 },
            { x: center + torsoWidth * 0.22, y: chestY + 15 },
          ]),
          true,
        );
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
        return;
      default:
        this.#back.fillPoints(
          points([
            { x: center - torsoWidth * 0.46, y: chestY + 8 },
            { x: center - torsoWidth * 0.1, y: chestY + 10 },
            { x: center - torsoWidth * 0.28, y: hipY + 18 },
            { x: center - torsoWidth * 0.54, y: hipY + 13 },
          ]),
          true,
        );
        this.#back.fillPoints(
          points([
            { x: center + torsoWidth * 0.46, y: chestY + 8 },
            { x: center + torsoWidth * 0.1, y: chestY + 10 },
            { x: center + torsoWidth * 0.28, y: hipY + 18 },
            { x: center + torsoWidth * 0.54, y: hipY + 13 },
          ]),
          true,
        );
        this.#outfit.fillPoints(
          points([
            { x: center - shoulderWidth * 0.44, y: chestY - 2 },
            { x: center + shoulderWidth * 0.44, y: chestY - 2 },
            { x: center + torsoWidth * 0.4, y: hipY + 8 },
            { x: center + mirror * 2, y: hipY + 16 },
            { x: center - mirror * 2, y: hipY + 16 },
            { x: center - torsoWidth * 0.4, y: hipY + 8 },
          ]),
          true,
        );
        this.#outfit.fillStyle(this.#appearance.secondaryColor, 0.24);
        this.#outfit.fillPoints(
          points([
            { x: center - torsoWidth * 0.18, y: hipY + 3 },
            { x: center, y: hipY + 16 },
            { x: center - torsoWidth * 0.42, y: hipY + 9 },
          ]),
          true,
        );
        this.#outfit.fillPoints(
          points([
            { x: center + torsoWidth * 0.18, y: hipY + 3 },
            { x: center, y: hipY + 16 },
            { x: center + torsoWidth * 0.42, y: hipY + 9 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center - shoulderWidth * 0.38, y: chestY - 2 },
            { x: center - torsoWidth * 0.04, y: chestY + 9 },
            { x: center - torsoWidth * 0.2, y: chestY + 16 },
          ]),
          true,
        );
        this.#front.fillPoints(
          points([
            { x: center + shoulderWidth * 0.38, y: chestY - 2 },
            { x: center + torsoWidth * 0.04, y: chestY + 9 },
            { x: center + torsoWidth * 0.2, y: chestY + 16 },
          ]),
          true,
        );
        this.#outfit.fillStyle(this.#appearance.outfitColor, 1);
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
      case "domino":
        stroke
          ? this.#mask.strokeRoundedRect(headX - 9, headY - 4, 18, 8, 4)
          : this.#mask.fillRoundedRect(headX - 9, headY - 4, 18, 8, 4);
        drawEyes(headX - 3.2, headX + 3.2, headY);
        return;
      case "half":
        if (stroke) {
          this.#mask.strokePoints(
            points([
              { x: headX - 8, y: headY - 5 },
              { x: headX + 1, y: headY - 5 },
              { x: headX + 7, y: headY },
              { x: headX + 1, y: headY + 6 },
              { x: headX - 8, y: headY + 6 },
            ]),
            true,
          );
        } else {
          this.#mask.fillPoints(
            points([
              { x: headX - 8, y: headY - 5 },
              { x: headX + 1, y: headY - 5 },
              { x: headX + 7, y: headY },
              { x: headX + 1, y: headY + 6 },
              { x: headX - 8, y: headY + 6 },
            ]),
            true,
          );
          drawEyes(headX - 3.4, headX + 1.2, headY);
        }
        return;
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
      case "petal":
        if (stroke) {
          this.#mask.strokePoints(
            points([
              { x: headX - 8, y: headY - 2 },
              { x: headX - 3, y: headY - 7 },
              { x: headX + 3, y: headY - 7 },
              { x: headX + 8, y: headY - 2 },
              { x: headX + 5, y: headY + 6 },
              { x: headX - 5, y: headY + 6 },
            ]),
            true,
          );
        } else {
          this.#mask.fillPoints(
            points([
              { x: headX - 8, y: headY - 2 },
              { x: headX - 3, y: headY - 7 },
              { x: headX + 3, y: headY - 7 },
              { x: headX + 8, y: headY - 2 },
              { x: headX + 5, y: headY + 6 },
              { x: headX - 5, y: headY + 6 },
            ]),
            true,
          );
          drawEyes(headX - 3.4, headX + 3.4, headY);
        }
        return;
      case "crescent":
        if (stroke) {
          this.#mask.strokePoints(
            points([
              { x: headX - 7, y: headY - 5 },
              { x: headX + 7, y: headY - 2 },
              { x: headX + 2, y: headY + 7 },
              { x: headX - 8, y: headY + 3 },
            ]),
            true,
          );
        } else {
          this.#mask.fillPoints(
            points([
              { x: headX - 7, y: headY - 5 },
              { x: headX + 7, y: headY - 2 },
              { x: headX + 2, y: headY + 7 },
              { x: headX - 8, y: headY + 3 },
            ]),
            true,
          );
          drawEyes(headX - 2.7, headX + 2.6, headY + 0.6);
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

  #drawMaskDetails(headX: number, headY: number, mirror: number) {
    switch (this.#appearance.maskDetailStyle) {
      case "filigree":
        this.#mask.beginPath();
        this.#mask.moveTo(headX - 6, headY - 2);
        this.#mask.lineTo(headX, headY - 5.5);
        this.#mask.lineTo(headX + 6, headY - 2);
        this.#mask.strokePath();
        this.#mask.beginPath();
        this.#mask.moveTo(headX - 5, headY + 2.5);
        this.#mask.lineTo(headX - 1.4, headY + 5.2);
        this.#mask.moveTo(headX + 5, headY + 2.5);
        this.#mask.lineTo(headX + 1.4, headY + 5.2);
        this.#mask.strokePath();
        break;
      case "jeweled":
        this.#mask.fillCircle(headX, headY - 5, 1.6);
        this.#mask.fillCircle(headX - 4.6, headY - 2, 1.1);
        this.#mask.fillCircle(headX + 4.6, headY - 2, 1.1);
        break;
      case "split":
        this.#mask.beginPath();
        this.#mask.moveTo(headX + mirror * 0.6, headY - 6);
        this.#mask.lineTo(headX + mirror * 0.6, headY + 6);
        this.#mask.strokePath();
        this.#mask.beginPath();
        this.#mask.moveTo(headX - mirror * 6.4, headY - 1.5);
        this.#mask.lineTo(headX - mirror * 1.4, headY - 4.8);
        this.#mask.strokePath();
        break;
      case "lace":
        for (const offset of [-5.5, -2.2, 2.2, 5.5] as const) {
          this.#mask.fillCircle(headX + offset, headY - 5.2, 0.8);
        }
        this.#mask.beginPath();
        this.#mask.moveTo(headX - 6.4, headY + 4.2);
        this.#mask.lineTo(headX - 2.4, headY + 5.4);
        this.#mask.lineTo(headX + 1.4, headY + 4.7);
        this.#mask.lineTo(headX + 5.8, headY + 5.4);
        this.#mask.strokePath();
        break;
      case "etched":
        this.#mask.beginPath();
        this.#mask.moveTo(headX - 5.2, headY - 3.6);
        this.#mask.lineTo(headX - 1.2, headY - 0.8);
        this.#mask.moveTo(headX + 5.2, headY - 3.6);
        this.#mask.lineTo(headX + 1.2, headY - 0.8);
        this.#mask.moveTo(headX, headY - 4.4);
        this.#mask.lineTo(headX, headY + 4.4);
        this.#mask.strokePath();
        break;
      case "winged":
        this.#mask.beginPath();
        this.#mask.moveTo(headX - 7.6, headY - 1);
        this.#mask.lineTo(headX - 11.2, headY - 4.4);
        this.#mask.moveTo(headX + 7.6, headY - 1);
        this.#mask.lineTo(headX + 11.2, headY - 4.4);
        this.#mask.moveTo(headX - 5.2, headY + 4.4);
        this.#mask.lineTo(headX, headY + 2.8);
        this.#mask.lineTo(headX + 5.2, headY + 4.4);
        this.#mask.strokePath();
        break;
      default:
        break;
    }
  }

  #drawHeaddress(
    headX: number,
    headY: number,
    _mirror: number,
    headScale: number,
  ) {
    const outline = mixColor(this.#appearance.maskAccentColor, 0x090d12, 0.44);
    const frontAlpha = this.#mode === "portrait" ? 0.94 : 0.82;
    const veilAlpha = this.#mode === "portrait" ? 0.3 : 0.2;

    this.#back.lineStyle(1, outline, 0.55);
    this.#front.lineStyle(1.1, outline, 0.84);
    this.#back.fillStyle(this.#appearance.maskAccentColor, 0.26);
    this.#front.fillStyle(this.#appearance.maskAccentColor, frontAlpha);

    switch (this.#appearance.headdressStyle) {
      case "tiara":
        this.#front.beginPath();
        this.#front.moveTo(headX - 8 * headScale, headY - 9 * headScale);
        this.#front.lineTo(headX - 4 * headScale, headY - 13 * headScale);
        this.#front.lineTo(headX, headY - 10.5 * headScale);
        this.#front.lineTo(headX + 4 * headScale, headY - 13 * headScale);
        this.#front.lineTo(headX + 8 * headScale, headY - 9 * headScale);
        this.#front.strokePath();
        this.#front.fillCircle(
          headX,
          headY - 12.5 * headScale,
          1.5 * headScale,
        );
        this.#front.fillCircle(
          headX - 4.4 * headScale,
          headY - 10.8 * headScale,
          1 * headScale,
        );
        this.#front.fillCircle(
          headX + 4.4 * headScale,
          headY - 10.8 * headScale,
          1 * headScale,
        );
        break;
      case "feather-halo":
        for (const feather of [-12, -4, 4, 12] as const) {
          this.#back.fillPoints(
            points([
              {
                x: headX + feather * 0.65 * headScale,
                y: headY - 10 * headScale,
              },
              {
                x: headX + feather * 0.95 * headScale,
                y: headY - 20 * headScale,
              },
              {
                x: headX + feather * 0.25 * headScale,
                y: headY - 7 * headScale,
              },
            ]),
            true,
          );
        }
        this.#front.fillCircle(headX, headY - 9.5 * headScale, 1.2 * headScale);
        break;
      case "veil":
        this.#back.fillStyle(this.#appearance.maskAccentColor, veilAlpha);
        this.#back.fillPoints(
          points([
            { x: headX - 8 * headScale, y: headY - 7 * headScale },
            { x: headX + 8 * headScale, y: headY - 7 * headScale },
            { x: headX + 13 * headScale, y: headY + 12 * headScale },
            { x: headX + 4 * headScale, y: headY + 17 * headScale },
            { x: headX - 11 * headScale, y: headY + 10 * headScale },
          ]),
          true,
        );
        this.#front.fillRoundedRect(
          headX - 8 * headScale,
          headY - 9 * headScale,
          16 * headScale,
          3 * headScale,
          1.5 * headScale,
        );
        break;
      case "crownlet":
        this.#front.beginPath();
        this.#front.moveTo(headX - 7 * headScale, headY - 9 * headScale);
        this.#front.lineTo(headX - 3.5 * headScale, headY - 15 * headScale);
        this.#front.lineTo(headX, headY - 10.5 * headScale);
        this.#front.lineTo(headX + 3.5 * headScale, headY - 15 * headScale);
        this.#front.lineTo(headX + 7 * headScale, headY - 9 * headScale);
        this.#front.strokePath();
        this.#front.fillCircle(
          headX,
          headY - 10.2 * headScale,
          1.2 * headScale,
        );
        break;
      case "laurel":
        for (const offset of [-7.5, -3.5, 3.5, 7.5] as const) {
          const x = headX + offset * headScale;
          const y = headY - 10 * headScale + Math.abs(offset) * 0.16;
          this.#front.fillEllipse(x, y, 2.2 * headScale, 4.4 * headScale);
        }
        this.#front.beginPath();
        this.#front.moveTo(headX - 6 * headScale, headY - 9 * headScale);
        this.#front.lineTo(headX, headY - 7.3 * headScale);
        this.#front.lineTo(headX + 6 * headScale, headY - 9 * headScale);
        this.#front.strokePath();
        break;
      default:
        break;
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
    const shine = mixColor(this.#appearance.accessoryColor, 0xf1dfb5, 0.48);
    this.#back.fillStyle(this.#appearance.accessoryColor, 0.95);
    this.#front.fillStyle(this.#appearance.accessoryColor, 0.95);
    this.#back.lineStyle(1.2, outline);
    this.#front.lineStyle(1.2, outline);

    switch (this.#appearance.accessoryStyle) {
      case "plume":
        for (const feather of [0, 1, 2] as const) {
          const offset = feather * 3.2;
          this.#back.fillPoints(
            points([
              { x: headX + mirror * (1 + offset), y: headY - (14 + feather) },
              {
                x: headX + mirror * (10 + offset),
                y: headY - (25 + feather * 2),
              },
              { x: headX + mirror * (4 + offset), y: headY - (5 + feather) },
            ]),
            true,
          );
        }
        break;
      case "brooch":
        this.#front.fillCircle(mirror * 5, chestY + 8, 3.2);
        this.#front.strokeCircle(mirror * 5, chestY + 8, 3.2);
        this.#front.fillStyle(shine, 1);
        this.#front.fillCircle(mirror * 5, chestY + 8, 1.2);
        break;
      case "monocle":
        this.#front.strokeCircle(headX + mirror * 4.8, headY, 3);
        this.#front.beginPath();
        this.#front.moveTo(headX + mirror * 7.5, headY + 2);
        this.#front.lineTo(headX + mirror * 10.5, headY + 11);
        this.#front.strokePath();
        this.#front.beginPath();
        this.#front.moveTo(headX + mirror * 2.8, headY - 1.2);
        this.#front.lineTo(headX + mirror * 1.2, headY + 1.1);
        this.#front.strokePath();
        break;
      case "chain":
        this.#front.beginPath();
        this.#front.moveTo(-6 * mirror, chestY + 4);
        this.#front.lineTo(7 * mirror, chestY + 12);
        this.#front.strokePath();
        this.#front.beginPath();
        this.#front.moveTo(-2 * mirror, chestY + 3);
        this.#front.lineTo(4 * mirror, chestY + 11);
        this.#front.strokePath();
        this.#front.fillCircle(9 * mirror, chestY + 13, 2.4);
        this.#front.fillStyle(shine, 1);
        this.#front.fillCircle(9 * mirror, chestY + 13, 0.9);
        break;
      case "rose":
        this.#front.fillCircle(mirror * 5, chestY + 7, 2.8);
        this.#front.fillCircle(mirror * 2.4, chestY + 5, 2.1);
        this.#front.fillCircle(mirror * 7.4, chestY + 4.8, 2.1);
        this.#front.fillStyle(shine, 0.92);
        this.#front.fillCircle(mirror * 5, chestY + 7, 0.8);
        this.#front.fillStyle(this.#appearance.accessoryColor, 0.88);
        this.#front.fillRoundedRect(
          mirror > 0 ? 4.3 : -6.1,
          chestY + 8.4,
          1.8,
          8,
          1,
        );
        break;
      case "fan":
        this.#front.fillPoints(
          points([
            { x: mirror * 3, y: chestY + 6 },
            { x: mirror * 14, y: chestY + 1 },
            { x: mirror * 14, y: chestY + 12 },
          ]),
          true,
        );
        this.#front.strokePoints(
          points([
            { x: mirror * 3, y: chestY + 6 },
            { x: mirror * 14, y: chestY + 1 },
            { x: mirror * 14, y: chestY + 12 },
          ]),
          true,
        );
        this.#front.beginPath();
        this.#front.moveTo(mirror * 5, chestY + 6);
        this.#front.lineTo(mirror * 12, chestY + 3);
        this.#front.moveTo(mirror * 5, chestY + 6);
        this.#front.lineTo(mirror * 12, chestY + 6.5);
        this.#front.moveTo(mirror * 5, chestY + 6);
        this.#front.lineTo(mirror * 12, chestY + 10);
        this.#front.strokePath();
        break;
      case "cane":
        this.#front.beginPath();
        this.#front.moveTo(mirror * 8, chestY + 4);
        this.#front.lineTo(mirror * 10, chestY + 24);
        this.#front.strokePath();
        this.#front.strokeCircle(mirror * 8, chestY + 3, 2.1);
        this.#front.fillStyle(shine, 0.9);
        this.#front.fillCircle(mirror * 8, chestY + 3, 0.9);
        break;
      case "keyring":
        this.#front.strokeCircle(mirror * 6, chestY + 11, 2.8);
        this.#front.beginPath();
        this.#front.moveTo(mirror * 6, chestY + 13);
        this.#front.lineTo(mirror * 10, chestY + 18);
        this.#front.strokePath();
        this.#front.fillCircle(mirror * 10, chestY + 18, 1.2);
        this.#front.fillCircle(mirror * 7.5, chestY + 20.5, 1.1);
        this.#front.fillStyle(shine, 0.92);
        this.#front.fillCircle(mirror * 6, chestY + 11, 0.7);
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
    shoulderWidth: number,
    chestY: number,
    hipY: number,
    hemWidth: number,
    mirror: number,
    accentColor: number,
  ) {
    const echoColor = mixColor(accentColor, this.#appearance.liningColor, 0.34);
    this.#back.fillStyle(echoColor, 0.17);
    this.#back.lineStyle(0, 0, 0);

    switch (this.#appearance.silhouette) {
      case "broad":
        this.#back.fillRoundedRect(
          -shoulderWidth * 0.56,
          chestY - 7,
          shoulderWidth * 1.12,
          14,
          6,
        );
        this.#back.fillRoundedRect(
          -shoulderWidth * 0.42,
          chestY + 3,
          shoulderWidth * 0.84,
          8,
          4,
        );
        break;
      case "lithe":
        this.#back.fillEllipse(0, chestY - 1, shoulderWidth * 0.72, 12);
        this.#back.fillEllipse(0, hipY + 8, hemWidth * 0.46, 9);
        break;
      case "regal":
        this.#back.fillPoints(
          points([
            { x: -shoulderWidth * 0.48, y: chestY - 5 },
            { x: shoulderWidth * 0.48, y: chestY - 5 },
            { x: hemWidth * 0.45, y: hipY + 10 },
            { x: 0, y: hipY + 14 },
            { x: -hemWidth * 0.45, y: hipY + 10 },
          ]),
          true,
        );
        this.#back.fillRoundedRect(-6, chestY - 8, 12, 5, 2);
        break;
      case "compact":
        this.#back.fillPoints(
          points([
            { x: -shoulderWidth * 0.42, y: chestY + 1 },
            { x: shoulderWidth * 0.42, y: chestY + 1 },
            { x: shoulderWidth * 0.18 * mirror, y: hipY + 4 },
            { x: -shoulderWidth * 0.18 * mirror, y: hipY + 4 },
          ]),
          true,
        );
        this.#back.fillEllipse(0, hipY + 7, hemWidth * 0.28, 7);
        break;
      case "draped":
        this.#back.fillPoints(
          points([
            { x: -shoulderWidth * 0.5, y: chestY - 4 },
            { x: shoulderWidth * 0.3, y: chestY - 2 },
            { x: hemWidth * 0.5, y: hipY + 10 },
            { x: 0, y: hipY + 15 },
            { x: -hemWidth * 0.58, y: hipY + 11 },
          ]),
          true,
        );
        this.#back.fillPoints(
          points([
            { x: -shoulderWidth * 0.42, y: chestY - 6 },
            { x: shoulderWidth * 0.1, y: chestY - 2 },
            { x: -hemWidth * 0.2, y: hipY + 12 },
          ]),
          true,
        );
        break;
      default:
        this.#back.fillRoundedRect(
          -shoulderWidth * 0.46,
          chestY - 5,
          shoulderWidth * 0.92,
          11,
          5,
        );
        this.#back.fillRoundedRect(-4, chestY + 6, 8, 8, 3);
        break;
    }

    this.#front.fillStyle(accentColor, 0.22);
    this.#front.fillRoundedRect(
      -hemWidth * 0.22,
      hipY + 7,
      hemWidth * 0.44,
      4,
      2,
    );
    this.#front.fillStyle(this.#appearance.trimColor, 0.16);
    this.#front.fillRoundedRect(
      -shoulderWidth * 0.14,
      chestY - 1,
      shoulderWidth * 0.28,
      6,
      2,
    );
  }

  #drawHair(headX: number, headY: number, mirror: number, headScale: number) {
    switch (this.#appearance.hairStyle) {
      case "cropped":
        this.#hair.fillEllipse(headX, headY - 7, 14 * headScale, 8 * headScale);
        this.#hair.strokeEllipse(
          headX,
          headY - 7,
          14 * headScale,
          8 * headScale,
        );
        break;
      case "swept":
        this.#hair.fillPoints(
          points([
            { x: headX - 7, y: headY - 8 },
            { x: headX + 8, y: headY - 10 },
            { x: headX + 4 + mirror * 2, y: headY - 2 },
            { x: headX - 6, y: headY - 1 },
          ]),
          true,
        );
        this.#hair.strokePoints(
          points([
            { x: headX - 7, y: headY - 8 },
            { x: headX + 8, y: headY - 10 },
            { x: headX + 4 + mirror * 2, y: headY - 2 },
            { x: headX - 6, y: headY - 1 },
          ]),
          true,
        );
        break;
      case "bun":
        this.#hair.fillEllipse(headX, headY - 7, 16 * headScale, 9 * headScale);
        this.#hair.fillCircle(headX - mirror * 2, headY - 13, 3.6 * headScale);
        this.#hair.strokeEllipse(
          headX,
          headY - 7,
          16 * headScale,
          9 * headScale,
        );
        break;
      case "braid":
        this.#hair.fillEllipse(headX, headY - 7, 15 * headScale, 9 * headScale);
        this.#hair.fillRoundedRect(
          headX + (mirror > 0 ? 4 : 1),
          headY - 3,
          3,
          12,
          2,
        );
        this.#hair.strokeEllipse(
          headX,
          headY - 7,
          15 * headScale,
          9 * headScale,
        );
        break;
      case "waved":
        this.#hair.fillEllipse(
          headX,
          headY - 8,
          17 * headScale,
          10 * headScale,
        );
        this.#hair.fillEllipse(
          headX - 5.6 * headScale,
          headY - 5.4 * headScale,
          6 * headScale,
          5.4 * headScale,
        );
        this.#hair.fillEllipse(
          headX + 5.6 * headScale,
          headY - 5.4 * headScale,
          6 * headScale,
          5.4 * headScale,
        );
        this.#hair.strokeEllipse(
          headX,
          headY - 8,
          17 * headScale,
          10 * headScale,
        );
        break;
      case "coiffed":
        this.#hair.fillPoints(
          points([
            { x: headX - 8, y: headY - 6 },
            { x: headX - 4, y: headY - 16 },
            { x: headX + 4, y: headY - 16 },
            { x: headX + 8, y: headY - 6 },
            { x: headX + 4, y: headY - 1 },
            { x: headX - 4, y: headY - 1 },
          ]),
          true,
        );
        this.#hair.strokePoints(
          points([
            { x: headX - 8, y: headY - 6 },
            { x: headX - 4, y: headY - 16 },
            { x: headX + 4, y: headY - 16 },
            { x: headX + 8, y: headY - 6 },
            { x: headX + 4, y: headY - 1 },
            { x: headX - 4, y: headY - 1 },
          ]),
          true,
        );
        break;
      default:
        this.#hair.fillEllipse(
          headX,
          headY - 8,
          17 * headScale,
          10 * headScale,
        );
        this.#hair.fillCircle(headX - 7, headY - 6, 3.2 * headScale);
        this.#hair.fillCircle(headX + 7, headY - 6, 3.2 * headScale);
        this.#hair.strokeEllipse(
          headX,
          headY - 8,
          17 * headScale,
          10 * headScale,
        );
        break;
    }
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
