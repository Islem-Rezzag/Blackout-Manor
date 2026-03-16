import * as Phaser from "phaser";
import type { ManorWeatherWindow } from "../tiled/manorLayout";

export class StormLayer {
  readonly #scene: Phaser.Scene;
  readonly #container: Phaser.GameObjects.Container;
  readonly #rain: Phaser.GameObjects.Graphics;
  readonly #lightningBolts: Phaser.GameObjects.Graphics;
  readonly #windowSheen: Phaser.GameObjects.Image[] = [];
  readonly #flash: Phaser.GameObjects.Rectangle;
  #time = 0;
  #stormIntensity = 0.82;
  #lightningStrength = 0;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
    this.#container = scene.add.container(0, 0);
    this.#rain = scene.add.graphics();
    this.#lightningBolts = scene.add.graphics();
    this.#flash = scene.add
      .rectangle(800, 560, 1800, 1280, 0xd7ecff, 0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.#container.add([this.#rain, this.#lightningBolts, this.#flash]);
    this.#container.setDepth(6);
  }

  get lightningStrength() {
    return this.#lightningStrength;
  }

  setStormIntensity(intensity: number) {
    this.#stormIntensity = Phaser.Math.Clamp(intensity, 0.15, 1);
  }

  setWindows(windows: ManorWeatherWindow[]) {
    while (this.#windowSheen.length > windows.length) {
      this.#windowSheen.pop()?.destroy();
    }

    for (const [index, windowSlice] of windows.entries()) {
      let image = this.#windowSheen[index];

      if (!image) {
        image = this.#scene.add.image(0, 0, "rain-sheen");
        image.setBlendMode(Phaser.BlendModes.SCREEN);
        this.#windowSheen[index] = image;
        this.#container.add(image);
      }

      image
        .setPosition(windowSlice.x, windowSlice.y)
        .setDisplaySize(windowSlice.width, windowSlice.height)
        .setTint(windowSlice.fill)
        .setAlpha(windowSlice.alpha);
    }
  }

  update(delta: number) {
    this.#time += delta;
    this.#drawRain();
    this.#drawLightningBolts();

    const flicker =
      Math.max(0, Math.sin(this.#time / 3100) - 0.935) * this.#stormIntensity;
    this.#lightningStrength = Phaser.Math.Linear(
      this.#lightningStrength,
      flicker * 3.8,
      0.18,
    );
    this.#flash.setAlpha(this.#lightningStrength * 0.3);

    for (const [index, image] of this.#windowSheen.entries()) {
      image.setAlpha(
        Phaser.Math.Clamp(
          0.16 +
            Math.sin(this.#time * 0.002 + index * 0.6) * 0.06 +
            this.#lightningStrength * 0.34,
          0,
          0.72,
        ),
      );
    }
  }

  destroy() {
    this.#container.destroy(true);
  }

  #drawRain() {
    this.#rain.clear();
    this.#rain.lineStyle(1, 0x87b6d6, 0.16 * this.#stormIntensity);

    for (let index = 0; index < 86; index += 1) {
      const x =
        ((index * 41 + this.#time * (0.11 + this.#stormIntensity * 0.04)) %
          1850) -
        120;
      const y =
        ((index * 57 + this.#time * (0.26 + this.#stormIntensity * 0.1)) %
          1320) -
        120;
      this.#rain.beginPath();
      this.#rain.moveTo(x, y);
      this.#rain.lineTo(x - 12, y + 28);
      this.#rain.strokePath();
    }
  }

  #drawLightningBolts() {
    this.#lightningBolts.clear();

    if (this.#lightningStrength < 0.08) {
      return;
    }

    this.#lightningBolts.lineStyle(2, 0xe6f2ff, this.#lightningStrength * 0.7);

    for (let boltIndex = 0; boltIndex < 2; boltIndex += 1) {
      const startX = 180 + boltIndex * 1180;
      let currentX = startX;
      let currentY = -40;

      this.#lightningBolts.beginPath();
      this.#lightningBolts.moveTo(currentX, currentY);

      for (let segment = 0; segment < 8; segment += 1) {
        currentX += Math.sin(this.#time * 0.001 + segment) * 18;
        currentY += 52 + segment * 7;
        this.#lightningBolts.lineTo(currentX, currentY);
      }

      this.#lightningBolts.strokePath();
    }
  }
}
