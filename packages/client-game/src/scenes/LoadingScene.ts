import * as Phaser from "phaser";

import { loadClientGameAssetManifest } from "../bootstrap/assetManifest";
import type { GameDirector } from "../directors/GameDirector";
import { SCENE_KEYS } from "./keys";

export class LoadingScene extends Phaser.Scene {
  readonly #barWidth = 320;
  readonly #barHeight = 14;
  readonly #director: GameDirector;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.loading);
    this.#director = director;
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

    loadClientGameAssetManifest(this.load);
  }

  create() {
    this.scene.launch(SCENE_KEYS.manorWorld);
    this.scene.launch(SCENE_KEYS.meeting);
    this.scene.launch(SCENE_KEYS.endgame);
    this.scene.launch(SCENE_KEYS.replay);
    this.#director.attachScenePlugin(this.scene);
    this.scene.stop();
  }
}
