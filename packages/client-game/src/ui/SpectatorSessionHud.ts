import type * as Phaser from "phaser";
import { setManorSoundEnabled } from "../audio/soundPreference";
import type { ClientGameRuntime } from "../bootstrap/runtime";
import type { GameDirector } from "../directors/GameDirector";
import { buildSubtitle } from "../directors/SurveillanceDirector";
import type { DemoPlaybackSpeed } from "../session/DemoPlaybackClock";
import {
  deriveSessionPresentation,
  PHASE_LABELS,
} from "../session/sessionPresentation";
import { ObservationHud } from "./ObservationHud";

/** One runtime-owned HUD survives world, meeting, finale and replay scenes. */
export class SpectatorSessionHud {
  readonly #hud: ObservationHud;
  readonly #runtime: ClientGameRuntime;
  readonly #director: GameDirector;
  readonly #unsubscribe: () => void;
  readonly #timer: ReturnType<typeof setInterval>;
  #replayPlaying = false;
  #replaySpeed = 1;
  #lastReplayAdvance = Date.now();

  constructor(
    scene: Phaser.Scene,
    runtime: ClientGameRuntime,
    director: GameDirector,
  ) {
    this.#runtime = runtime;
    this.#director = director;
    this.#hud = new ObservationHud({
      scene,
      persistent: true,
      onSelectRoom: (roomId) => director.selectObservationRoom(roomId),
      onOverview: () => director.exitObservationFocus(),
      onSurveillance: () => director.toggleObservationMode(),
      onFollowPlayer: (playerId) => director.followPlayer(playerId),
      onSoundChange: setManorSoundEnabled,
      onPlay: () => this.#togglePlayback(),
      onStep: (delta) => {
        if (runtime.mode === "replay") {
          this.#replayPlaying = false;
          director.stepReplay(delta);
        } else runtime.localPlayback?.step();
        this.#renderClock();
      },
      onSpeed: (speed) => {
        this.#replaySpeed = speed;
        this.#lastReplayAdvance = Date.now();
        runtime.localPlayback?.setSpeed(speed as DemoPlaybackSpeed);
        this.#renderClock();
      },
      onSeek: (index) => {
        this.#replayPlaying = false;
        director.jumpReplay(index);
        this.#renderClock();
      },
    });
    this.#unsubscribe = director.subscribe((state) => {
      if (state.snapshot)
        this.#hud.setContent({
          snapshot: state.meeting?.stagedSnapshot ?? state.snapshot,
          camera: state.camera,
          inspection: state.inspection,
          surveillance: {
            ...state.surveillance,
            subtitle:
              state.surveillance.subtitle ??
              (state.activeScene === "meeting" &&
              state.snapshot.phaseId === "meeting"
                ? buildSubtitle(state.snapshot)
                : null),
          },
          phaseLabel: PHASE_LABELS[state.snapshot.phaseId],
          followedPlayerId: state.followedPlayerId,
          directed:
            Boolean(state.meeting) ||
            state.activeScene === "endgame" ||
            state.snapshot.phaseId === "resolution",
        });
      this.#renderClock();
    });
    this.#timer = setInterval(() => {
      const replay = director.getState().replay;
      if (this.#replayPlaying && replay) {
        if (!replay.canStepForward) this.#replayPlaying = false;
        else if (
          Date.now() - this.#lastReplayAdvance >=
          1200 / this.#replaySpeed
        ) {
          this.#lastReplayAdvance = Date.now();
          director.stepReplay(1);
        }
      }
      this.#renderClock();
    }, 100);
    scene.game.events.once("destroy", () => this.destroy());
  }

  #togglePlayback() {
    if (this.#runtime.mode === "replay") {
      const replay = this.#director.getState().replay;
      if (!replay) return;
      if (!replay.canStepForward) this.#director.jumpReplay(0);
      this.#replayPlaying = !this.#replayPlaying;
      this.#lastReplayAdvance = Date.now();
    } else {
      const clock = this.#runtime.localPlayback;
      if (clock?.getState().status === "playing") clock.pause();
      else clock?.play();
    }
    this.#renderClock();
  }

  #renderClock() {
    const state = this.#director.getState();
    const demo = this.#runtime.localPlayback?.getState();
    const replay = state.replay;
    this.#hud.setSession(
      deriveSessionPresentation({
        mode: this.#runtime.mode,
        snapshot: replay?.snapshot ?? state.snapshot,
        ...(demo ? { demo } : {}),
        ...(replay
          ? {
              replay: {
                playing: this.#replayPlaying,
                speed: this.#replaySpeed,
                frameIndex: replay.frameIndex,
                totalFrames: replay.totalFrames,
              },
            }
          : {}),
      }),
    );
  }

  destroy() {
    clearInterval(this.#timer);
    this.#unsubscribe();
    this.#hud.destroy();
  }
}
