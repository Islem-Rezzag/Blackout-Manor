import type * as Phaser from "phaser";

type RuntimeBannerOptions = {
  scene: Phaser.Scene;
  width?: number;
};

export class RuntimeBanner {
  readonly #container: Phaser.GameObjects.Container;
  readonly #backplate: Phaser.GameObjects.Rectangle;
  readonly #eyebrow: Phaser.GameObjects.Text;
  readonly #title: Phaser.GameObjects.Text;
  readonly #detail: Phaser.GameObjects.Text;
  #baseX = 0;
  #baseY = 88;
  #offsetY = 0;
  #scale = 1;
  #alpha = 1;

  constructor(options: RuntimeBannerOptions) {
    const width = options.width ?? 640;
    this.#backplate = options.scene.add
      .rectangle(0, 0, width, 110, 0x14251e, 0.94)
      .setStrokeStyle(1, 0xc6ad74, 0.3);
    this.#eyebrow = options.scene.add.text(-width / 2 + 28, -38, "", {
      color: "#c6ad74",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      letterSpacing: 0,
    });
    this.#title = options.scene.add.text(-width / 2 + 28, -8, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "24px",
      fontStyle: "normal",
      wordWrap: { width: width - 64 },
    });
    this.#detail = options.scene.add.text(-width / 2 + 28, 32, "", {
      color: "#bbc6b0",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: width - 64 },
    });

    this.#container = options.scene.add.container(0, 0, [
      this.#backplate,
      this.#eyebrow,
      this.#title,
      this.#detail,
    ]);
    this.#container.setDepth(320);
    this.#container.setScrollFactor(0);
    this.resize(options.scene.scale.width);
  }

  setContent(content: { eyebrow: string; title: string; detail: string }) {
    this.#eyebrow.setText(content.eyebrow);
    this.#title.setText(content.title);
    this.#detail.setText(content.detail);
  }

  setVisible(visible: boolean) {
    this.#container.setVisible(visible);
  }

  setPresentation(options?: {
    alpha?: number;
    offsetY?: number;
    scale?: number;
  }) {
    this.#alpha = options?.alpha ?? 1;
    this.#offsetY = options?.offsetY ?? 0;
    this.#scale = options?.scale ?? 1;
    this.#applyPresentation();
  }

  resize(width: number) {
    this.#baseX = width / 2;
    this.#applyPresentation();
    this.#container.setScale(
      this.#scale * Math.min(1, (width - 32) / this.#backplate.width),
    );
  }

  get screenSpaceRoot() {
    return this.#container;
  }

  destroy() {
    this.#container.destroy(true);
  }

  #applyPresentation() {
    this.#container.setPosition(this.#baseX, this.#baseY + this.#offsetY);
    this.#container.setScale(
      this.#scale * Math.min(1, (this.#baseX * 2 - 32) / this.#backplate.width),
    );
    this.#container.setAlpha(this.#alpha);
  }
}
