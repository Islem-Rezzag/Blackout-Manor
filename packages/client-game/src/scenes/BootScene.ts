import * as Phaser from "phaser";

import { SCENE_KEYS } from "./keys";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create() {
    this.scene.start(SCENE_KEYS.loading);
  }
}
