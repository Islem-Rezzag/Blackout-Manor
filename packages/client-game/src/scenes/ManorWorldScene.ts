import type { MatchEvent } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type { ClientGameRuntime } from "../bootstrap/runtime";
import type { GameDirector } from "../directors/GameDirector";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import { worldSeatResolver } from "../stage/seatResolvers";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

const latestReportLine = (events: readonly MatchEvent[]) => {
  const report = [...events]
    .reverse()
    .find((event) => event.eventId === "body-reported");

  if (!report) {
    return "Move through the manor, generate evidence, and let the camera follow the most recent public event.";
  }

  return `${report.playerId} calls the body in ${report.roomId}. The camera holds the report site before the meeting scene takes over.`;
};

export class ManorWorldScene extends Phaser.Scene {
  readonly #runtime: ClientGameRuntime;
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #banner: RuntimeBanner | null = null;
  #reportPanel: Phaser.GameObjects.Container | null = null;
  #reportText: Phaser.GameObjects.Text | null = null;
  #unsubscribe: (() => void) | null = null;

  constructor(runtime: ClientGameRuntime, director: GameDirector) {
    super(SCENE_KEYS.manorWorld);
    this.#runtime = runtime;
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({
      scene: this,
      onMoveToRoom: (roomId) => {
        void this.#runtime.proposeMove(roomId);
      },
      onStartTask: (taskId) => {
        void this.#runtime.proposeStartTask(taskId);
      },
    });
    this.#banner = new RuntimeBanner({ scene: this, width: 540 });

    const reportPlate = this.add
      .rectangle(0, 0, 660, 72, 0x081018, 0.72)
      .setStrokeStyle(1, 0x73a8c9, 0.16);
    const reportText = this.add.text(-304, -8, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: 608 },
    });
    this.#reportText = reportText;
    this.#reportPanel = this.add.container(0, 0, [reportPlate, reportText]);
    this.#reportPanel.setDepth(96);
    this.#reportPanel.setScrollFactor(0);
    this.#resizePanels();

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (state.activeScene !== "manor-world") {
        return;
      }

      this.#banner?.setContent(state.banner);
      this.#reportPanel?.setVisible(Boolean(state.snapshot));
      this.#reportText?.setText(
        state.snapshot ? latestReportLine(state.snapshot.recentEvents) : "",
      );

      if (state.snapshot) {
        this.#stage?.render({
          snapshot: state.snapshot,
          focusRoomId: state.camera.roomId,
          immediateFocus: state.camera.immediate,
          seatResolver: worldSeatResolver,
          showTaskChips: true,
        });
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#banner?.destroy();
      this.#banner = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#reportPanel?.destroy(true);
      this.#reportPanel = null;
      this.#reportText = null;
    });
  }

  update(_time: number, delta: number) {
    this.#stage?.update(delta);
  }

  #resizePanels() {
    this.#banner?.resize(this.scale.width);
    this.#reportPanel?.setPosition(
      this.scale.width / 2,
      this.scale.height - 62,
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
