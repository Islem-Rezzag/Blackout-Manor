import * as Phaser from "phaser";

import { INLINE_ASSETS } from "../bootstrap/inlineAssets";
import { SCENE_KEYS } from "./keys";

export class PreloadScene extends Phaser.Scene {
  readonly #barWidth = 320;
  readonly #barHeight = 14;

  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 40, "Blackout Manor", {
      color: "#f5f7fa",
      fontFamily: "Georgia, Times, serif",
      fontSize: "30px",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);

    const frame = this.add.rectangle(
      width / 2,
      height / 2 + 14,
      this.#barWidth,
      this.#barHeight,
    );
    frame.setStrokeStyle(1, 0x8fe3ff, 0.35);

    const bar = this.add.rectangle(
      width / 2 - this.#barWidth / 2,
      height / 2 + 14,
      4,
      this.#barHeight - 4,
      0xe9c77c,
      1,
    );
    bar.setOrigin(0, 0.5);

    this.load.on("progress", (progress: number) => {
      bar.width = Math.max(4, (this.#barWidth - 4) * progress);
    });

    this.load.image("room-floor", INLINE_ASSETS.roomFloor);
    this.load.image("player-token", INLINE_ASSETS.playerToken);
    this.load.image("room-glow", INLINE_ASSETS.roomGlow);
    this.load.image("clue-marker", INLINE_ASSETS.clueMarker);
    this.load.image("sabotage-stripe", INLINE_ASSETS.sabotageStripe);
    this.load.image("rain-sheen", INLINE_ASSETS.rainSheen);
  }

  create() {
    this.scene.start(SCENE_KEYS.manor);
  }
}
