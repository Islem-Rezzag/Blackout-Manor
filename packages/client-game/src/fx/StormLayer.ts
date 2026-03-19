import * as Phaser from "phaser";

import type {
  ManorBackdropRect,
  ManorWeatherWindow,
} from "../tiled/manorLayout";

export class StormLayer {
  readonly #scene: Phaser.Scene;
  readonly #container: Phaser.GameObjects.Container;
  readonly #rain: Phaser.GameObjects.Graphics;
  readonly #lightningBolts: Phaser.GameObjects.Graphics;
  readonly #windowSheen: Phaser.GameObjects.Image[] = [];
  readonly #cloudBands: Phaser.GameObjects.Image[] = [];
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
    this.#container.setDepth(230);
  }

  get lightningStrength() {
    return this.#lightningStrength;
  }

  setStormIntensity(intensity: number) {
    this.#stormIntensity = Phaser.Math.Clamp(intensity, 0.15, 1);
  }

  setBackdropBands(bands: ManorBackdropRect[]) {
    const weatherBands = bands.filter(
      (band) => band.className === "weather-band",
    );

    while (this.#cloudBands.length > weatherBands.length) {
      this.#cloudBands.pop()?.destroy();
    }

    for (const [index, band] of weatherBands.entries()) {
      let image = this.#cloudBands[index];

      if (!image) {
        image = this.#scene.add.image(0, 0, "storm-cloud");
        image.setBlendMode(Phaser.BlendModes.SCREEN);
        this.#cloudBands[index] = image;
        this.#container.addAt(image, 0);
      }

      image
        .setPosition(band.x + band.width / 2, band.y + band.height / 2)
        .setDisplaySize(band.width * 1.08, band.height * 1.3)
        .setTint(band.fill)
        .setAlpha(band.alpha);
    }
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
      Math.max(0, Math.sin(this.#time / 3100) - 0.93) * this.#stormIntensity;
    this.#lightningStrength = Phaser.Math.Linear(
      this.#lightningStrength,
      flicker * 4.4,
      0.2,
    );
    this.#flash.setAlpha(this.#lightningStrength * 0.34);

    for (const [index, image] of this.#windowSheen.entries()) {
      image.setAlpha(
        Phaser.Math.Clamp(
          0.14 +
            Math.sin(this.#time * 0.0022 + index * 0.6) * 0.08 +
            this.#lightningStrength * 0.38,
          0,
          0.78,
        ),
      );
    }

    for (const [index, image] of this.#cloudBands.entries()) {
      image.setX(image.x + Math.sin(this.#time * 0.0004 + index * 0.8) * 0.12);
      image.setAlpha(
        Phaser.Math.Clamp(
          0.18 +
            Math.sin(this.#time * 0.0007 + index * 0.9) * 0.04 +
            this.#stormIntensity * 0.16,
          0.08,
          0.44,
        ),
      );
    }
  }

  destroy() {
    this.#container.destroy(true);
  }

  #drawRain() {
    this.#rain.clear();
    this.#rain.lineStyle(1, 0x92c3e4, 0.14 * this.#stormIntensity);

    for (let index = 0; index < 118; index += 1) {
      const x =
        ((index * 41 + this.#time * (0.12 + this.#stormIntensity * 0.05)) %
          1850) -
        120;
      const y =
        ((index * 57 + this.#time * (0.28 + this.#stormIntensity * 0.12)) %
          1320) -
        120;
      const length = 20 + (index % 5) * 4;

      this.#rain.beginPath();
      this.#rain.moveTo(x, y);
      this.#rain.lineTo(x - 12, y + length);
      this.#rain.strokePath();
    }
  }

  #drawLightningBolts() {
    this.#lightningBolts.clear();

    if (this.#lightningStrength < 0.08) {
      return;
    }

    this.#lightningBolts.lineStyle(2, 0xe6f2ff, this.#lightningStrength * 0.72);

    for (let boltIndex = 0; boltIndex < 2; boltIndex += 1) {
      const startX = 180 + boltIndex * 1180;
      let currentX = startX;
      let currentY = -40;

      this.#lightningBolts.beginPath();
      this.#lightningBolts.moveTo(currentX, currentY);

      for (let segment = 0; segment < 9; segment += 1) {
        currentX += Math.sin(this.#time * 0.001 + segment) * 18;
        currentY += 52 + segment * 7;
        this.#lightningBolts.lineTo(currentX, currentY);
      }

      this.#lightningBolts.strokePath();
    }
  }
}
