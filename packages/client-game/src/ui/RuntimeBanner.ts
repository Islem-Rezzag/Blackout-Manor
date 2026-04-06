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
  #baseY = 96;
  #offsetY = 0;
  #scale = 1;
  #alpha = 1;

  constructor(options: RuntimeBannerOptions) {
    const width = options.width ?? 640;
    this.#backplate = options.scene.add
      .rectangle(0, 0, width, 126, 0x050b12, 0.78)
      .setStrokeStyle(1, 0xa1c4d9, 0.2);
    this.#eyebrow = options.scene.add.text(-width / 2 + 28, -38, "", {
      color: "#a5cadf",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      letterSpacing: 2.2,
    });
    this.#title = options.scene.add.text(-width / 2 + 28, -8, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "28px",
      fontStyle: "bold",
      wordWrap: { width: width - 64 },
    });
    this.#detail = options.scene.add.text(-width / 2 + 28, 32, "", {
      color: "#dfe6ee",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
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
  }

  destroy() {
    this.#container.destroy(true);
  }

  #applyPresentation() {
    this.#container.setPosition(this.#baseX, this.#baseY + this.#offsetY);
    this.#container.setScale(this.#scale);
    this.#container.setAlpha(this.#alpha);
  }
}
