import * as Phaser from "phaser";

import type { ManorRenderMap } from "../../tiled/manorLayout";
import type { EnvironmentStageLayers } from "./EnvironmentRenderTypes";

export const drawEnvironmentBackdrop = (options: {
  scene: Phaser.Scene;
  layers: Pick<EnvironmentStageLayers, "backdrop">;
  renderMap: ManorRenderMap;
  worldBounds: { width: number; height: number };
}) => {
  const { layers, renderMap, scene, worldBounds } = options;
  const graphics = scene.add.graphics();
  layers.backdrop.add(graphics);

  for (const rect of renderMap.backdropRects) {
    if (rect.className === "weather-band") {
      continue;
    }

    if (rect.stroke !== null) {
      graphics.lineStyle(2, rect.stroke, rect.alpha * 0.4);
    } else {
      graphics.lineStyle(0, 0, 0);
    }

    graphics.fillStyle(rect.fill, rect.alpha);
    graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 32);
  }

  const manorShadow = scene.add
    .image(worldBounds.width / 2, worldBounds.height / 2 + 24, "room-shadow")
    .setDisplaySize(worldBounds.width * 1.02, worldBounds.height * 0.86)
    .setAlpha(0.4);
  const coldRim = scene.add
    .image(worldBounds.width / 2, 110, "storm-cloud")
    .setDisplaySize(worldBounds.width * 0.92, 180)
    .setTint(0x79abd3)
    .setBlendMode(Phaser.BlendModes.SCREEN)
    .setAlpha(0.22);
  const emberFloorGlow = scene.add
    .image(worldBounds.width / 2, worldBounds.height - 144, "storm-cloud")
    .setDisplaySize(worldBounds.width * 0.72, 196)
    .setTint(0xe0bc88)
    .setBlendMode(Phaser.BlendModes.SCREEN)
    .setAlpha(0.1);

  layers.backdrop.add([manorShadow, coldRim, emberFloorGlow]);
};
