import * as Phaser from "phaser";

import { BootScene } from "../scenes/BootScene";
import { ManorScene } from "../scenes/ManorScene";
import { PreloadScene } from "../scenes/PreloadScene";
import type { ClientGameRuntime } from "./runtime";

type CreateGameConfigOptions = {
  container: HTMLElement;
  runtime: ClientGameRuntime;
  width?: number;
  height?: number;
};

export const createGameConfig = ({
  container,
  runtime,
  width = 1280,
  height = 820,
}: CreateGameConfigOptions): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: container,
  width,
  height,
  backgroundColor: "#05070a",
  transparent: false,
  render: {
    antialias: true,
    powerPreference: "high-performance",
    roundPixels: false,
  },
  fps: {
    target: 60,
    deltaHistory: 6,
    smoothStep: true,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width,
    height,
  },
  scene: [new BootScene(), new PreloadScene(), new ManorScene(runtime)],
});
