import type * as Phaser from "phaser";

import type { ManorRenderMap } from "../../tiled/manorLayout";
import type { EnvironmentStageLayers } from "./EnvironmentRenderTypes";

export const drawEnvironmentBackdrop = (options: {
  scene: Phaser.Scene;
  layers: Pick<EnvironmentStageLayers, "backdrop">;
  renderMap: ManorRenderMap;
  worldBounds: { width: number; height: number };
}) => {
  const { layers, scene, worldBounds } = options;
  layers.backdrop.add(
    scene.add
      .image(0, 0, "estate-grounds")
      .setOrigin(0)
      .setDisplaySize(worldBounds.width, worldBounds.height),
  );
};
