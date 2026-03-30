import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import { createFinaleSeatResolver } from "../stage/seatResolvers";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

export class EndgameScene extends Phaser.Scene {
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #banner: RuntimeBanner | null = null;
  #resultPlate: Phaser.GameObjects.Container | null = null;
  #resultTitle: Phaser.GameObjects.Text | null = null;
  #resultDetail: Phaser.GameObjects.Text | null = null;
  #resultTag: Phaser.GameObjects.Text | null = null;
  #unsubscribe: (() => void) | null = null;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.endgame);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
    this.#banner = new RuntimeBanner({ scene: this, width: 540 });

    const plate = this.add
      .rectangle(0, 0, 620, 134, 0x081018, 0.8)
      .setStrokeStyle(1, 0xb99d68, 0.22);
    const title = this.add.text(-284, -34, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "24px",
      fontStyle: "bold",
      wordWrap: { width: 556 },
    });
    const detail = this.add.text(-284, 6, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: 556 },
    });
    const tag = this.add.text(-284, 44, "", {
      color: "#d5be88",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      letterSpacing: 2,
    });

    this.#resultTitle = title;
    this.#resultDetail = detail;
    this.#resultTag = tag;
    this.#resultPlate = this.add.container(0, 0, [plate, title, detail, tag]);
    this.#resultPlate.setDepth(322);
    this.#resultPlate.setScrollFactor(0);
    this.#resizePanels();

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (state.activeScene !== "endgame" || !state.endgame) {
        return;
      }

      this.#banner?.setContent(state.banner);
      this.#resultTitle?.setText(state.endgame.title);
      this.#resultDetail?.setText(state.endgame.subtitle);
      this.#resultTag?.setText(state.endgame.summaryTag.toUpperCase());
      this.#stage?.render({
        snapshot: state.endgame.stagedSnapshot,
        focusRoomId: state.camera.roomId,
        inspection: {
          mode: "inspect",
          roomId: state.camera.roomId,
          immediate: state.camera.immediate,
          label: "Finale focus",
          detail: "Resolution staging holds on the public outcome.",
        },
        seatResolver: createFinaleSeatResolver("grand-hall"),
        showTaskChips: false,
      });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#banner?.destroy();
      this.#banner = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#resultPlate?.destroy(true);
      this.#resultPlate = null;
      this.#resultTitle = null;
      this.#resultDetail = null;
      this.#resultTag = null;
    });
  }

  update(_time: number, delta: number) {
    this.#stage?.update(delta);
  }

  #resizePanels() {
    this.#banner?.resize(this.scale.width);
    this.#resultPlate?.setPosition(
      this.scale.width / 2,
      this.scale.height - 96,
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
