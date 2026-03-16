import type {
  MatchEvent,
  PhaseId,
  PublicPlayerState,
} from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import { AvatarRig } from "./AvatarRig";
import {
  type AvatarInteractionCue,
  buildAvatarCueMap,
  resolveAvatarAppearance,
  resolveAvatarPose,
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
  readonly #status: Phaser.GameObjects.Text;
  readonly #name: Phaser.GameObjects.Text;
  readonly #rig: AvatarRig;

  constructor(scene: Phaser.Scene, player: PublicPlayerState) {
    const appearance = resolveAvatarAppearance(player);
    this.id = player.id;
    this.#background = scene.add
      .rectangle(0, 0, 112, 124, 0x091117, 0.84)
      .setOrigin(0.5);
    this.#frame = scene.add
      .rectangle(0, 0, 112, 124)
      .setOrigin(0.5)
      .setStrokeStyle(2, appearance.trimColor, 0.26);
    this.#rig = new AvatarRig(scene, appearance, "portrait");
    this.#rig.container.setPosition(0, 10);
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
      letterSpacing: 1.1,
    });
    this.#status.setOrigin(0.5);
    this.container = scene.add.container(0, 0, [
      this.#background,
      this.#frame,
      this.#rig.container,
      this.#status,
      this.#name,
    ]);
  }

  apply(
    player: PublicPlayerState,
    phaseId: PhaseId,
    cue: AvatarInteractionCue,
    spotlightPlayerId: PublicPlayerState["id"] | null,
    targetPlayerId: PublicPlayerState["id"] | null,
  ) {
    const appearance = resolveAvatarAppearance(player);
    const spotlight = spotlightPlayerId === player.id;
    const targeted = targetPlayerId === player.id;

    this.#rig.setMovementState(false);
    this.#rig.applyState({
      pose: resolveAvatarPose(player),
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
      spotlight ? 0x13212b : targeted ? 0x24151a : 0x091117,
      spotlight ? 0.9 : 0.84,
    );
    this.#frame.setStrokeStyle(
      spotlight ? 3 : 2,
      targeted ? 0xff997b : appearance.trimColor,
      spotlight ? 0.78 : targeted ? 0.62 : 0.28,
    );
    this.#name.setText(player.displayName);
    this.#name.setAlpha(player.status === "alive" ? 1 : 0.5);
    this.#status.setText(
      spotlight
        ? phaseId.toUpperCase()
        : player.status === "alive"
          ? resolveAvatarPose(player).toUpperCase()
          : "OUT",
    );
    this.container.setAlpha(player.connected ? 1 : 0.58);
    this.container.setScale(spotlight ? 1.03 : 1);
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
      .rectangle(0, 0, 660, 290, 0x050b12, 0.72)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    this.#title = scene.add.text(0, -122, "Meeting theatre", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "18px",
      fontStyle: "bold",
    });
    this.#title.setOrigin(0.5);
    this.#container = scene.add.container(0, 0, [this.#backplate, this.#title]);
    this.#container.setDepth(94);
    this.#container.setScrollFactor(0);
    this.resize(scene.scale.width, scene.scale.height);
  }

  render(
    players: readonly PublicPlayerState[],
    phaseId: PhaseId,
    recentEvents: readonly MatchEvent[],
  ) {
    this.#container.setVisible(MEETING_PHASES.has(phaseId));
    if (!MEETING_PHASES.has(phaseId)) {
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
      card.container.setPosition(-248 + column * 124, -36 + row * 136);
      card.apply(
        player,
        phaseId,
        cues.get(player.id) ?? {
          eventId: null,
          gesture: "idle",
          speechText: null,
          targetPlayerId: null,
          emphasis: 0,
        },
        spotlightPlayerId,
        targetPlayerId,
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
    this.#container.setPosition(width / 2, height - 160);
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
