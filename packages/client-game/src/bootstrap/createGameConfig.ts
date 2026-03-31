import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import { BootScene } from "../scenes/BootScene";
import { EndgameScene } from "../scenes/EndgameScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { ManorWorldScene } from "../scenes/ManorWorldScene";
import { MeetingScene } from "../scenes/MeetingScene";
import { ReplayScene } from "../scenes/ReplayScene";
import type { ClientGameRuntime } from "./runtime";

type CreateGameConfigOptions = {
  container: HTMLElement;
  runtime: ClientGameRuntime;
  director: GameDirector;
  width?: number;
  height?: number;
  assetBaseUrl?: string;
};

export const createGameConfig = ({
  assetBaseUrl,
  container,
  director,
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
  scene: [
    new BootScene(),
    new LoadingScene(director, assetBaseUrl),
    new ManorWorldScene(runtime, director),
    new MeetingScene(director),
    new EndgameScene(director),
    new ReplayScene(director),
  ],
});
