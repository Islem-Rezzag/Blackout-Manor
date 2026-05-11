import * as Phaser from "phaser";

import type { ManorRenderRoom } from "../../tiled/manorLayout";
import type {
  ImportedHeroPropPlacement,
  ImportedRoomArt,
} from "../importedArt";

export const createEnvironmentDecorShape = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  decor: ManorRenderRoom["decor"][number],
) => {
  const x = decor.x - room.x;
  const y = decor.y - room.y + room.framing.floorInsetY;

  if (decor.ellipse) {
    return scene.add.ellipse(
      x,
      y,
      decor.width,
      decor.height,
      decor.fill,
      decor.alpha,
    );
  }

  return scene.add.rectangle(
    x,
    y,
    decor.width,
    decor.height,
    decor.fill,
    decor.alpha,
  );
};

export const createDecorPropVisuals = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
) => {
  const decorShadows = room.decor.map((decor) =>
    scene.add
      .image(
        decor.x - room.x,
        decor.y - room.y + room.framing.floorInsetY + decor.height * 0.18,
        "room-shadow",
      )
      .setDisplaySize(
        Math.max(30, decor.width * 1.18),
        Math.max(18, decor.height * 0.58),
      )
      .setAlpha(0.16),
  );
  const decorObjects = room.decor.map((decor) => {
    const object = createEnvironmentDecorShape(scene, room, decor);
    object.setBlendMode(Phaser.BlendModes.NORMAL);
    object.setStrokeStyle(2, room.accentColor, 0.12);
    return object;
  });
  const decorHighlights = room.decor.map((decor) =>
    scene.add
      .image(
        decor.x - room.x,
        decor.y - room.y + room.framing.floorInsetY,
        "room-specular",
      )
      .setDisplaySize(decor.width * 1.08, decor.height * 1.08)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.1),
  );

  return {
    decorShadows,
    decorObjects,
    decorHighlights,
  };
};

const createHeroPropShadow = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  prop: ImportedHeroPropPlacement,
) =>
  scene.add
    .image(prop.x - room.x, prop.y - room.y + prop.height * 0.18, "room-shadow")
    .setDisplaySize(prop.width * 1.08, Math.max(26, prop.height * 0.42))
    .setAlpha(0.22);

const createHeroPropImage = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  prop: ImportedHeroPropPlacement,
) =>
  scene.add
    .image(prop.x - room.x, prop.y - room.y, prop.key)
    .setDisplaySize(prop.width, prop.height)
    .setAlpha(prop.alpha);

export const createHeroPropVisuals = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  art: ImportedRoomArt,
) => ({
  heroPropShadows: art.heroProps.map((prop) =>
    createHeroPropShadow(scene, room, prop),
  ),
  heroProps: art.heroProps.map((prop) =>
    createHeroPropImage(scene, room, prop),
  ),
});
