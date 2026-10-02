import type * as Phaser from "phaser";

// UI cameras keep Phaser overlays independent of the estate's room-focus zoom.
export const createScreenSpaceCamera = (
  scene: Phaser.Scene,
  roots: Phaser.GameObjects.GameObject[],
) => {
  const camera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height);
  // Avatars and speech bubbles can join the display list after scene creation.
  const synchronize = () => {
    camera.ignore(
      scene.children.list.filter((object) => !roots.includes(object)),
    );
    scene.cameras.main.ignore(roots);
  };
  synchronize();
  scene.events.on("prerender", synchronize);
  scene.events.once("shutdown", () => {
    scene.events.off("prerender", synchronize);
  });
  return camera;
};
