import type {
  MatchEvent,
  PhaseId,
  PublicPlayerState,
} from "@blackout-manor/shared";
import type * as Phaser from "phaser";

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
  readonly #frame: Phaser.GameObjects.Rectangle;
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
      .rectangle(0, 0, 118, 138, 0x081018, 0.88)
      .setOrigin(0.5);
    this.#frame = scene.add
      .rectangle(0, 0, 118, 138)
      .setOrigin(0.5)
      .setStrokeStyle(2, appearance.trimColor, 0.26);
    this.#accentBar = scene.add
      .rectangle(0, -55, 92, 8, appearance.trimColor, 0.34)
      .setOrigin(0.5);
    this.#eyebrow = scene.add.text(0, -46, "PRESENT", {
      color: "#8ec9e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "9px",
      letterSpacing: 1.8,
    });
    this.#eyebrow.setOrigin(0.5);
    this.#rig = new AvatarRig(scene, appearance, "portrait");
    this.#rig.container.setPosition(0, 6);
    this.#name = scene.add.text(0, 44, player.displayName, {
      align: "center",
      color: appearance.nameColor,
      fontFamily: "Georgia, Times, serif",
      fontSize: "11px",
      fontStyle: "600",
      wordWrap: { width: 86, useAdvancedWrap: true },
    });
    this.#name.setOrigin(0.5);
    this.#status = scene.add.text(0, -48, "", {
      color: "#d7e2ef",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      letterSpacing: 1.1,
    });
    this.#status.setOrigin(0.5);
    this.#pressurePlate = scene.add
      .rectangle(0, 62, 92, 18, 0x101a23, 0.78)
      .setStrokeStyle(1, appearance.trimColor, 0.24);
    this.#pressureText = scene.add.text(0, 62, "", {
      color: "#d7e2ef",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      letterSpacing: 0.8,
    });
    this.#pressureText.setOrigin(0.5);
    this.container = scene.add.container(0, 0, [
      this.#background,
      this.#frame,
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
      spotlight ? 0x11212c : targeted ? 0x24151a : 0x081018,
      spotlight ? 0.92 : 0.88,
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
    this.#pressurePlate.setFillStyle(actionLabel ? 0x1a1416 : 0x101a23, 0.82);
    this.#pressurePlate.setStrokeStyle(
      1,
      actionLabel ? 0xe7a282 : appearance.trimColor,
      actionLabel ? 0.34 : 0.24,
    );
    this.container.setAlpha(player.connected ? 1 : 0.58);
    this.container.setScale(spotlight ? 1.05 : targeted ? 1.02 : 1);
  }

  update(delta: number) {
    this.#rig.update(delta);
  }

  destroy() {
    this.container.destroy(true);
  }
}

export class MeetingPortraitStrip {
  readonly #scene: Phaser.Scene;
  readonly #backplate: Phaser.GameObjects.Rectangle;
  readonly #title: Phaser.GameObjects.Text;
  readonly #container: Phaser.GameObjects.Container;
  readonly #cards = new Map<string, PortraitCard>();

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
    this.#backplate = scene.add
      .rectangle(0, 0, 696, 316, 0x050b12, 0.76)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    this.#title = scene.add.text(0, -134, "Grand Hall Tribunal", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "20px",
      fontStyle: "bold",
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
      card.container.setPosition(-260 + column * 130, -30 + row * 146);
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
    this.#container.setPosition(width / 2, height - 172);
  }

  setVisible(visible: boolean) {
    this.#container.setVisible(visible);
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
}
