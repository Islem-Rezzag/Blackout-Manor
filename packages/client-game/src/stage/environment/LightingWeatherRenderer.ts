import * as Phaser from "phaser";

import type { StormLayer } from "../../fx/StormLayer";
import type { ManorRenderRoom } from "../../tiled/manorLayout";
import type { EnvironmentRenderPlan } from "./EnvironmentRenderTypes";

export const configureEnvironmentStormLayer = (
  stormLayer: StormLayer,
  plan: EnvironmentRenderPlan,
) => {
  stormLayer.setBackdropBands([...plan.backdropRects]);
  stormLayer.setWindows(plan.rooms.flatMap(({ room }) => room.windows));
};

export const createRoomLightingWeatherVisuals = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
) => {
  const lightGlows = room.lights.map((light) =>
    scene.add
      .image(light.x - room.x, light.y - room.y - 6, "room-glow")
      .setDisplaySize(light.radius * 1.65, light.radius * 1.04)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(light.intensity * 0.55),
  );

  const windowOverlays = room.windows.map((windowSlice) =>
    scene.add
      .image(windowSlice.x - room.x, windowSlice.y - room.y, "rain-sheen")
      .setDisplaySize(windowSlice.width, windowSlice.height)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(windowSlice.alpha * 0.7),
  );

  return {
    lightGlows,
    windowOverlays,
  };
};
