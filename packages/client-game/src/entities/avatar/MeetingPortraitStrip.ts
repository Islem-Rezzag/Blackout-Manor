import type {
  MatchEvent,
  PhaseId,
  PublicPlayerState,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import { AvatarRig } from "./AvatarRig";
import {
  type AvatarInteractionCue,
  actionIconLabel,
  buildAvatarCueMap,
  resolveAvatarAppearance,
  resolveAvatarPose,
  resolveVisiblePosture,
  visiblePostureLabel,
} from "./presentation";

const MEETING_PHASES = new Set<PhaseId>([
  "report",
  "meeting",
  "vote",
  "reveal",
]);

class PortraitCard {
  readonly id: PublicPlayerState["id"];
  readonly container: Phaser.GameObjects.Container;
  readonly #background: Phaser.GameObjects.Rectangle;
  readonly #halo: Phaser.GameObjects.Ellipse;
  readonly #innerMatte: Phaser.GameObjects.Rectangle;
  readonly #frame: Phaser.GameObjects.Rectangle;
  readonly #ornament: Phaser.GameObjects.Graphics;
  readonly #accentBar: Phaser.GameObjects.Rectangle;
  readonly #eyebrow: Phaser.GameObjects.Text;
  readonly #status: Phaser.GameObjects.Text;
  readonly #name: Phaser.GameObjects.Text;
  readonly #pressurePlate: Phaser.GameObjects.Rectangle;
  readonly #pressureText: Phaser.GameObjects.Text;
  readonly #rig: AvatarRig;

  constructor(scene: Phaser.Scene, player: PublicPlayerState) {
    const appearance = resolveAvatarAppearance(player);
    this.id = player.id;
    this.#background = scene.add
      .rectangle(0, 0, 136, 164, 0x081018, 0.92)
      .setOrigin(0.5);
    this.#halo = scene.add
      .ellipse(0, -10, 94, 112, appearance.portraitGlowColor, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.#innerMatte = scene.add
      .rectangle(0, -2, 104, 116, 0x0c1620, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(1, appearance.maskAccentColor, 0.18);
    this.#frame = scene.add
      .rectangle(0, 0, 136, 164)
      .setOrigin(0.5)
      .setStrokeStyle(2, appearance.trimColor, 0.3);
    this.#ornament = scene.add.graphics();
    this.#accentBar = scene.add
      .rectangle(0, -66, 112, 8, appearance.trimColor, 0.38)
      .setOrigin(0.5);
    this.#eyebrow = scene.add.text(0, -58, "PRESENT", {
      color: "#a5cadf",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      letterSpacing: 2.1,
    });
    this.#eyebrow.setOrigin(0.5);
    this.#rig = new AvatarRig(scene, appearance, "portrait");
    this.#rig.container.setPosition(0, 10);
    this.#name = scene.add.text(0, 57, player.displayName, {
      align: "center",
      color: appearance.nameColor,
      fontFamily: "Georgia, Times, serif",
      fontSize: "13px",
      fontStyle: "600",
      wordWrap: { width: 104, useAdvancedWrap: true },
    });
    this.#name.setOrigin(0.5);
    this.#status = scene.add.text(0, -60, "", {
      color: "#dfe6ee",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      letterSpacing: 1.5,
    });
    this.#status.setOrigin(0.5);
    this.#pressurePlate = scene.add
      .rectangle(0, 78, 106, 22, 0x101a23, 0.82)
      .setStrokeStyle(1, appearance.trimColor, 0.24);
    this.#pressureText = scene.add.text(0, 78, "", {
      color: "#dfe6ee",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      letterSpacing: 1,
    });
    this.#pressureText.setOrigin(0.5);
    this.container = scene.add.container(0, 0, [
      this.#background,
      this.#halo,
      this.#innerMatte,
      this.#frame,
      this.#ornament,
      this.#accentBar,
      this.#eyebrow,
      this.#rig.container,
      this.#status,
      this.#name,
      this.#pressurePlate,
      this.#pressureText,
    ]);
  }

  apply(
    player: PublicPlayerState,
    phaseId: PhaseId,
    cue: AvatarInteractionCue,
    spotlightPlayerId: PublicPlayerState["id"] | null,
    targetPlayerId: PublicPlayerState["id"] | null,
    travelStatusLabel: string | null,
  ) {
    const appearance = resolveAvatarAppearance(player);
    const visiblePosture = resolveVisiblePosture(player, cue);
    const spotlight = spotlightPlayerId === player.id;
    const targeted = targetPlayerId === player.id;
    const actionLabel = cue.actionIcon ? actionIconLabel(cue.actionIcon) : null;

    this.#rig.setMovementState(false);
    this.#rig.applyState({
      pose: resolveAvatarPose(player),
      visiblePosture,
      facing: spotlight ? "south" : "south-east",
      cue: spotlight
        ? cue
        : {
            ...cue,
            eventId: null,
            speechText: null,
          },
      connected: player.connected,
      suspiciousness: player.publicImage.suspiciousness,
      alive: player.status === "alive",
    });

    this.#background.setFillStyle(
      spotlight ? 0x122230 : targeted ? 0x24151a : 0x081018,
      spotlight ? 0.95 : 0.9,
    );
    this.#halo.setFillStyle(
      targeted ? 0xff8c78 : appearance.portraitGlowColor,
      spotlight ? 0.24 : targeted ? 0.18 : 0.12,
    );
    this.#innerMatte.setFillStyle(
      spotlight ? 0x101b26 : targeted ? 0x1b1014 : 0x0c1620,
      spotlight ? 0.94 : 0.9,
    );
    this.#innerMatte.setStrokeStyle(
      spotlight ? 1.6 : 1,
      targeted ? 0xff9d83 : appearance.maskAccentColor,
      spotlight ? 0.4 : 0.22,
    );
    this.#frame.setStrokeStyle(
      spotlight ? 3 : targeted ? 2.5 : 2,
      targeted ? 0xff997b : appearance.trimColor,
      spotlight ? 0.78 : targeted ? 0.62 : 0.28,
    );
    this.#accentBar.setFillStyle(
      targeted ? 0xff997b : appearance.trimColor,
      spotlight ? 0.5 : 0.3,
    );
    this.#accentBar.setSize(
      (
        {
          arch: 88,
          velvet: 102,
          brass: 82,
          laurel: 90,
          thorn: 94,
          gallery: 92,
        } as const
      )[appearance.portraitFrameStyle],
      8,
    );
    this.#eyebrow.setText(
      travelStatusLabel ??
        (spotlight
          ? phaseId.toUpperCase()
          : player.status === "alive"
            ? "SURVIVOR"
            : "REMOVED"),
    );
    this.#name.setText(player.displayName);
    this.#name.setAlpha(player.status === "alive" ? 1 : 0.5);
    this.#status.setText(
      spotlight
        ? visiblePostureLabel(visiblePosture).toUpperCase()
        : player.status === "alive"
          ? visiblePostureLabel(visiblePosture).toUpperCase()
          : "OUT",
    );
    this.#pressureText.setText(
      actionLabel ??
        (player.status === "alive"
          ? visiblePostureLabel(visiblePosture).toUpperCase()
          : "SILENCED"),
    );
    this.#pressurePlate.setFillStyle(actionLabel ? 0x1a1416 : 0x101a23, 0.86);
    this.#pressurePlate.setStrokeStyle(
      1,
      actionLabel ? 0xe7a282 : appearance.trimColor,
      actionLabel ? 0.42 : 0.28,
    );
    this.#drawFrameMotif(appearance, spotlight, targeted);
    this.container.setAlpha(player.connected ? 1 : 0.58);
    this.container.setScale(spotlight ? 1.06 : targeted ? 1.03 : 1);
  }

  update(delta: number) {
    this.#rig.update(delta);
  }

  destroy() {
    this.container.destroy(true);
  }

  #drawFrameMotif(
    appearance: ReturnType<typeof resolveAvatarAppearance>,
    spotlight: boolean,
    targeted: boolean,
  ) {
    const stroke = targeted ? 0xff997b : appearance.trimColor;
    const fill = targeted ? 0x31171d : appearance.accessoryColor;
    const alpha = spotlight ? 0.72 : 0.44;

    this.#ornament.clear();
    this.#ornament.lineStyle(1.4, stroke, alpha);
    this.#ornament.fillStyle(fill, 0.18 + (spotlight ? 0.08 : 0));

    switch (appearance.portraitFrameStyle) {
      case "arch":
        this.#ornament.strokeRoundedRect(-43, -31, 86, 62, 14);
        this.#ornament.beginPath();
        this.#ornament.moveTo(-26, -56);
        this.#ornament.lineTo(0, -66);
        this.#ornament.lineTo(26, -56);
        this.#ornament.strokePath();
        break;
      case "velvet":
        this.#ornament.fillTriangle(-42, -61, -26, -50, -42, -38);
        this.#ornament.fillTriangle(42, -61, 26, -50, 42, -38);
        this.#ornament.fillCircle(-34, -47, 2.2);
        this.#ornament.fillCircle(34, -47, 2.2);
        this.#ornament.strokeRoundedRect(-45, -34, 90, 66, 10);
        break;
      case "brass":
        this.#drawCornerBracket(-47, -60, 1, 1);
        this.#drawCornerBracket(47, -60, -1, 1);
        this.#drawCornerBracket(-47, 45, 1, -1);
        this.#drawCornerBracket(47, 45, -1, -1);
        this.#ornament.fillRoundedRect(-14, 50, 28, 8, 3);
        this.#ornament.strokeRoundedRect(-14, 50, 28, 8, 3);
        break;
      case "laurel":
        for (const offset of [-18, -6, 6, 18] as const) {
          this.#ornament.fillCircle(-44, offset, 2.1);
          this.#ornament.fillCircle(44, offset, 2.1);
        }
        this.#ornament.strokeRoundedRect(-42, -32, 84, 64, 9);
        break;
      case "thorn":
        this.#ornament.strokePoints(
          [
            { x: -44, y: -30 },
            { x: -50, y: -14 },
            { x: -44, y: 0 },
            { x: -50, y: 15 },
            { x: -44, y: 31 },
          ].map((point) => new Phaser.Geom.Point(point.x, point.y)),
          false,
        );
        this.#ornament.strokePoints(
          [
            { x: 44, y: -30 },
            { x: 50, y: -14 },
            { x: 44, y: 0 },
            { x: 50, y: 15 },
            { x: 44, y: 31 },
          ].map((point) => new Phaser.Geom.Point(point.x, point.y)),
          false,
        );
        this.#ornament.strokeRoundedRect(-42, -32, 84, 64, 8);
        break;
      default:
        this.#ornament.strokeRoundedRect(-42, -32, 84, 64, 8);
        this.#ornament.strokeRoundedRect(-32, 50, 64, 10, 4);
        this.#ornament.fillCircle(-26, 55, 2);
        this.#ornament.fillCircle(26, 55, 2);
        break;
    }
  }

  #drawCornerBracket(x: number, y: number, dirX: 1 | -1, dirY: 1 | -1) {
    this.#ornament.beginPath();
    this.#ornament.moveTo(x, y);
    this.#ornament.lineTo(x + dirX * 12, y);
    this.#ornament.lineTo(x + dirX * 12, y + dirY * 12);
    this.#ornament.strokePath();
  }
}

export class MeetingPortraitStrip {
  readonly #scene: Phaser.Scene;
  readonly #backplate: Phaser.GameObjects.Rectangle;
  readonly #title: Phaser.GameObjects.Text;
  readonly #container: Phaser.GameObjects.Container;
  readonly #cards = new Map<string, PortraitCard>();
  #baseX = 0;
  #baseY = 0;
  #offsetY = 0;
  #scale = 1;
  #alpha = 1;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
    this.#backplate = scene.add
      .rectangle(0, 0, 794, 360, 0x050b12, 0.84)
      .setStrokeStyle(1, 0xcbb58d, 0.22);
    this.#title = scene.add.text(0, -154, "Grand Hall Tribunal", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "25px",
      fontStyle: "bold",
      letterSpacing: 0.6,
    });
    this.#title.setOrigin(0.5);
    this.#container = scene.add.container(0, 0, [this.#backplate, this.#title]);
    this.#container.setDepth(324);
    this.#container.setScrollFactor(0);
    this.resize(scene.scale.width, scene.scale.height);
  }

  render(
    players: readonly PublicPlayerState[],
    phaseId: PhaseId,
    recentEvents: readonly MatchEvent[],
    travelStatusByPlayerId?: ReadonlyMap<PublicPlayerState["id"], string>,
  ) {
    if (!MEETING_PHASES.has(phaseId)) {
      this.#container.setVisible(false);
      return;
    }

    const cues = buildAvatarCueMap(players, recentEvents, phaseId);
    const spotlightEvent = [...recentEvents]
      .reverse()
      .find((event) =>
        [
          "discussion-turn",
          "vote-cast",
          "body-reported",
          "meeting-called",
        ].includes(event.eventId),
      );
    const spotlightPlayerId =
      spotlightEvent && "playerId" in spotlightEvent
        ? spotlightEvent.playerId
        : null;
    const targetPlayerId =
      spotlightEvent && "targetPlayerId" in spotlightEvent
        ? (spotlightEvent.targetPlayerId ?? null)
        : null;
    const activeIds = new Set(players.map((player) => player.id));

    players.forEach((player, index) => {
      let card = this.#cards.get(player.id);
      if (!card) {
        card = new PortraitCard(this.#scene, player);
        this.#cards.set(player.id, card);
        this.#container.add(card.container);
      }

      const column = index % 5;
      const row = Math.floor(index / 5);
      card.container.setPosition(-292 + column * 146, -28 + row * 172);
      card.apply(
        player,
        phaseId,
        cues.get(player.id) ?? {
          eventId: null,
          gesture: "idle",
          speechText: null,
          targetPlayerId: null,
          emphasis: 0,
          actionIcon: null,
        },
        spotlightPlayerId,
        targetPlayerId,
        travelStatusByPlayerId?.get(player.id) ?? null,
      );
    });

    for (const [playerId, card] of this.#cards.entries()) {
      if (!activeIds.has(playerId)) {
        card.destroy();
        this.#cards.delete(playerId);
      }
    }
  }

  resize(width: number, height: number) {
    this.#baseX = width / 2;
    this.#baseY = height - 196;
    this.#applyPresentation();
  }

  setVisible(visible: boolean) {
    this.#container.setVisible(visible);
  }

  setPresentation(options?: {
    alpha?: number;
    offsetY?: number;
    scale?: number;
  }) {
    this.#alpha = options?.alpha ?? 1;
    this.#offsetY = options?.offsetY ?? 0;
    this.#scale = options?.scale ?? 1;
    this.#applyPresentation();
  }

  update(delta: number) {
    if (!this.#container.visible) {
      return;
    }

    for (const card of this.#cards.values()) {
      card.update(delta);
    }
  }

  destroy() {
    this.#container.destroy(true);
    this.#cards.clear();
  }

  #applyPresentation() {
    this.#container.setPosition(this.#baseX, this.#baseY + this.#offsetY);
    this.#container.setScale(this.#scale);
    this.#container.setAlpha(this.#alpha);
  }
}
