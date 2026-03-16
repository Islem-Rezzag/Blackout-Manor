import type { MatchEvent, MatchSnapshot } from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import type { ClientGameState } from "../types";

const describeEvent = (event: MatchEvent) => {
  switch (event.eventId) {
    case "phase-changed":
      return `${event.toPhaseId.toUpperCase()} phase engaged`;
    case "task-progressed":
      return `${event.playerId} progressed ${event.taskId}`;
    case "task-completed":
      return `${event.playerId} completed ${event.taskId}`;
    case "body-reported":
      return `${event.playerId} reported ${event.targetPlayerId}`;
    case "discussion-turn":
      return `${event.playerId}: ${event.text}`;
    case "vote-cast":
      return `${event.playerId} voted ${event.targetPlayerId ?? "skip"}`;
    case "player-exiled":
      return `${event.playerId} was exiled`;
    default:
      return event.eventId;
  }
};

export class MatchHud {
  readonly #container: Phaser.GameObjects.Container;
  readonly #phaseText: Phaser.GameObjects.Text;
  readonly #statusText: Phaser.GameObjects.Text;
  readonly #footerText: Phaser.GameObjects.Text;
  readonly #eventLines: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    const panel = scene.add
      .rectangle(120, 120, 220, 150, 0x081018, 0.72)
      .setStrokeStyle(1, 0x6eb2d9, 0.16)
      .setOrigin(0, 0);
    this.#phaseText = scene.add.text(144, 142, "Awaiting snapshot", {
      color: "#f5f7fa",
      fontFamily: "Georgia, Times, serif",
      fontSize: "20px",
      fontStyle: "bold",
    });
    this.#statusText = scene.add.text(144, 174, "", {
      color: "#8fe3ff",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      letterSpacing: 2,
    });
    this.#footerText = scene.add.text(144, 205, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: 180 },
    });

    const feedPanel = scene.add
      .rectangle(1200, 80, 320, 210, 0x081018, 0.72)
      .setStrokeStyle(1, 0x6eb2d9, 0.16)
      .setOrigin(0, 0);
    const feedTitle = scene.add.text(1228, 102, "Live transcript", {
      color: "#f5f7fa",
      fontFamily: "Georgia, Times, serif",
      fontSize: "18px",
      fontStyle: "bold",
    });

    for (let index = 0; index < 5; index += 1) {
      const line = scene.add.text(1228, 136 + index * 30, "", {
        color: "#d7dee9",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "12px",
        wordWrap: { width: 270 },
      });
      this.#eventLines.push(line);
    }

    this.#container = scene.add.container(0, 0, [
      panel,
      feedPanel,
      this.#phaseText,
      this.#statusText,
      this.#footerText,
      feedTitle,
      ...this.#eventLines,
    ]);
    this.#container.setScrollFactor(0);
    this.#container.setDepth(90);
  }

  update(state: ClientGameState) {
    const snapshot = state.snapshot;
    this.#phaseText.setText(
      snapshot
        ? `${snapshot.phaseId.toUpperCase()}  ·  Tick ${snapshot.tick}`
        : "Connecting to manor",
    );
    this.#statusText.setText(
      `${state.mode.toUpperCase()}  ·  ${state.status.toUpperCase()}  ·  ${state.fpsEstimate} FPS`,
    );
    this.#footerText.setText(this.#buildFooter(snapshot, state));

    const feed = state.recentEvents.slice(-5).reverse();
    for (const [index, line] of this.#eventLines.entries()) {
      const event = feed[index];
      line.setText(event ? describeEvent(event) : "");
    }
  }

  destroy() {
    this.#container.destroy(true);
  }

  #buildFooter(snapshot: MatchSnapshot | null, state: ClientGameState) {
    if (!snapshot) {
      return "Waiting for the authoritative snapshot.";
    }

    if (state.lastValidationError) {
      return `Rejected: ${state.lastValidationError.message}`;
    }

    if (state.actorId) {
      return "Click an adjacent room to move. Click a room task chip to start work when legal.";
    }

    return "Spectator mode. Server snapshots remain authoritative.";
  }
}
