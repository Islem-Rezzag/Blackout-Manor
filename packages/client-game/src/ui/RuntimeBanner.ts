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

  constructor(options: RuntimeBannerOptions) {
    const width = options.width ?? 560;
    this.#backplate = options.scene.add
      .rectangle(0, 0, width, 118, 0x050b12, 0.74)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    this.#eyebrow = options.scene.add.text(-width / 2 + 24, -34, "", {
      color: "#8ec9e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      letterSpacing: 2,
    });
    this.#title = options.scene.add.text(-width / 2 + 24, -10, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "24px",
      fontStyle: "bold",
      wordWrap: { width: width - 56 },
    });
    this.#detail = options.scene.add.text(-width / 2 + 24, 28, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: width - 56 },
    });

    this.#container = options.scene.add.container(0, 0, [
      this.#backplate,
      this.#eyebrow,
      this.#title,
      this.#detail,
    ]);
    this.#container.setDepth(96);
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

  resize(width: number) {
    this.#container.setPosition(width / 2, 88);
  }

  destroy() {
    this.#container.destroy(true);
  }
}
