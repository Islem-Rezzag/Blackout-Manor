import * as Phaser from "phaser";

import type { ClientGameRuntime } from "../bootstrap/runtime";
import type { GameDirector } from "../directors/GameDirector";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import { worldSeatResolver } from "../stage/seatResolvers";
import { ObservationHud } from "../ui/ObservationHud";
import { SurveillanceConsole } from "../ui/SurveillanceConsole";
import { attachObservationControls } from "./attachObservationControls";
import { SCENE_KEYS } from "./keys";

const timerLine = (tick: number) => `Tick ${tick}`;

export class ManorWorldScene extends Phaser.Scene {
  readonly #runtime: ClientGameRuntime;
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #hud: ObservationHud | null = null;
  #console: SurveillanceConsole | null = null;
  #unsubscribe: (() => void) | null = null;
  #detachControls: (() => void) | null = null;

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
    this.#hud = new ObservationHud({ scene: this });
    this.#console = new SurveillanceConsole({
      scene: this,
      onSelectRoom: (roomId) => {
        this.#director.focusSurveillanceRoom(roomId);
      },
    });
    this.#detachControls = attachObservationControls(
      this,
      this.#director,
      "manor-world",
    );

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (state.activeScene !== "manor-world" || !state.snapshot) {
        return;
      }

      this.#hud?.setContent({
        surveillance: state.surveillance,
        phaseLabel: state.snapshot.phaseId.toUpperCase(),
        timerText: timerLine(state.snapshot.tick),
        contextText:
          state.surveillance.mode === "surveillance"
            ? "Console mode stays locked to public room feeds."
            : "Roaming mode follows public manor movement and speech.",
      });
      this.#console?.setPresentation(state.surveillance);
      this.#stage?.render({
        snapshot: state.snapshot,
        focusRoomId: state.camera.roomId,
        immediateFocus: state.camera.immediate,
        seatResolver: worldSeatResolver,
        showTaskChips:
          state.snapshot.phaseId === "roam" &&
          state.surveillance.mode === "roaming",
      });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.#detachControls?.();
      this.#detachControls = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#hud?.destroy();
      this.#hud = null;
      this.#console?.destroy();
      this.#console = null;
      this.#stage?.destroy();
      this.#stage = null;
    });
  }

  update(_time: number, delta: number) {
    this.#stage?.update(delta);
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#hud?.resize(this.scale.width, this.scale.height);
    this.#console?.resize(this.scale.width, this.scale.height);
  }
}
