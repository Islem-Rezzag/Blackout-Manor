import type { PhaseId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { SeatResolver } from "../stage/ManorWorldStage";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import {
  createFinaleSeatResolver,
  createMeetingSeatResolver,
  worldSeatResolver,
} from "../stage/seatResolvers";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

const resolveSeatResolver = (phaseId: PhaseId): SeatResolver => {
  if (phaseId === "meeting" || phaseId === "vote" || phaseId === "reveal") {
    return createMeetingSeatResolver("grand-hall", phaseId);
  }

  if (phaseId === "resolution") {
    return createFinaleSeatResolver("grand-hall");
  }

  return worldSeatResolver;
};

export class ReplayScene extends Phaser.Scene {
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #banner: RuntimeBanner | null = null;
  #controlPlate: Phaser.GameObjects.Container | null = null;
  #frameLabel: Phaser.GameObjects.Text | null = null;
  #highlightLabel: Phaser.GameObjects.Text | null = null;
  #unsubscribe: (() => void) | null = null;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.replay);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
    this.#banner = new RuntimeBanner({ scene: this, width: 560 });

    const backplate = this.add
      .rectangle(0, 0, 720, 94, 0x081018, 0.8)
      .setStrokeStyle(1, 0x73a8c9, 0.16);
    const previousButton = this.#createReplayButton(-290, 0, "Prev", () => {
      this.#director.stepReplay(-1);
    });
    const nextButton = this.#createReplayButton(290, 0, "Next", () => {
      this.#director.stepReplay(1);
    });
    const frameLabel = this.add.text(-230, -18, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "20px",
      fontStyle: "bold",
      wordWrap: { width: 360 },
    });
    const highlightLabel = this.add.text(-230, 14, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      wordWrap: { width: 360 },
    });

    this.#frameLabel = frameLabel;
    this.#highlightLabel = highlightLabel;
    this.#controlPlate = this.add.container(0, 0, [
      backplate,
      previousButton,
      nextButton,
      frameLabel,
      highlightLabel,
    ]);
    this.#controlPlate.setDepth(96);
    this.#controlPlate.setScrollFactor(0);
    this.#resizePanels();

    this.input.keyboard?.on("keydown-LEFT", () => {
      this.#director.stepReplay(-1);
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      this.#director.stepReplay(1);
    });
    this.input.keyboard?.on("keydown-HOME", () => {
      this.#director.jumpReplay(0);
    });

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (state.activeScene !== "replay" || !state.replay?.snapshot) {
        return;
      }

      const phaseId = state.replay.snapshot.phaseId;
      const highlightText =
        state.replay.highlightMarkers[0]?.description ??
        "Step frame by frame through the deterministic replay.";

      this.#banner?.setContent(state.banner);
      this.#frameLabel?.setText(
        `Frame ${state.replay.frameIndex + 1} / ${state.replay.totalFrames} - Tick ${state.replay.snapshot.tick} - ${phaseId.toUpperCase()}`,
      );
      this.#highlightLabel?.setText(highlightText);
      this.#stage?.render({
        snapshot: state.replay.snapshot,
        focusRoomId: state.camera.roomId,
        immediateFocus: state.camera.immediate,
        seatResolver: resolveSeatResolver(phaseId),
        showTaskChips: phaseId === "roam",
      });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.input.keyboard?.removeAllListeners();
      this.scale.off("resize", this.#handleResize, this);
      this.#banner?.destroy();
      this.#banner = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#controlPlate?.destroy(true);
      this.#controlPlate = null;
      this.#frameLabel = null;
      this.#highlightLabel = null;
    });
  }

  update(_time: number, delta: number) {
    this.#stage?.update(delta);
  }

  #createReplayButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ) {
    const plate = this.add
      .rectangle(x, y, 96, 40, 0x12202a, 0.88)
      .setStrokeStyle(1, 0x73a8c9, 0.24)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      color: "#f5f0e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    plate.on("pointerdown", () => {
      onClick();
    });

    return this.add.container(0, 0, [plate, text]);
  }

  #resizePanels() {
    this.#banner?.resize(this.scale.width);
    this.#controlPlate?.setPosition(
      this.scale.width / 2,
      this.scale.height - 72,
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
