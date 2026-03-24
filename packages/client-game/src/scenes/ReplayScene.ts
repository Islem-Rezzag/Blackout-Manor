import type { PhaseId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { GamePresentationState } from "../directors/types";
import type { SeatResolver } from "../stage/ManorWorldStage";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import {
  createMeetingBlocking,
  MEETING_ALARM_FOCUS_MS,
} from "../stage/meetingBlocking";
import {
  createFinaleSeatResolver,
  createMeetingSeatResolver,
  worldSeatResolver,
} from "../stage/seatResolvers";
import { ObservationHud } from "../ui/ObservationHud";
import { SurveillanceConsole } from "../ui/SurveillanceConsole";
import { attachObservationControls } from "./attachObservationControls";
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

const replayTimerLine = (
  frameIndex: number,
  totalFrames: number,
  tick: number,
) => `Frame ${frameIndex + 1}/${totalFrames} | Tick ${tick}`;

type MeetingSequenceState = ReturnType<typeof createMeetingBlocking> & {
  id: string;
  startedAt: number;
};

export class ReplayScene extends Phaser.Scene {
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #hud: ObservationHud | null = null;
  #console: SurveillanceConsole | null = null;
  #unsubscribe: (() => void) | null = null;
  #detachControls: (() => void) | null = null;
  #detachReplayControls: (() => void) | null = null;
  #presentationState: GamePresentationState | null = null;
  #meetingSequence: MeetingSequenceState | null = null;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.replay);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
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
      "replay",
    );
    this.#detachReplayControls = this.#attachReplayControls();

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (state.activeScene !== "replay" || !state.replay?.snapshot) {
        return;
      }

      this.#presentationState = state;
      if (
        state.meeting &&
        this.#meetingSequence?.id !== state.meeting.sequenceId
      ) {
        this.#meetingSequence = {
          id: state.meeting.sequenceId,
          startedAt: this.time.now,
          ...createMeetingBlocking(state.meeting),
        };
      }
      this.#renderReplayState();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.#detachControls?.();
      this.#detachControls = null;
      this.#detachReplayControls?.();
      this.#detachReplayControls = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#hud?.destroy();
      this.#hud = null;
      this.#console?.destroy();
      this.#console = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#presentationState = null;
      this.#meetingSequence = null;
    });
  }

  update(_time: number, delta: number) {
    this.#renderReplayState();
    this.#stage?.update(delta);
  }

  #renderReplayState() {
    const state = this.#presentationState;

    if (!state?.replay?.snapshot) {
      return;
    }

    const phaseId = state.replay.snapshot.phaseId;
    const highlightText =
      state.replay.highlightMarkers[0]?.description ??
      "Left and right step the deterministic frame log.";
    const meetingPresentation =
      phaseId === "meeting" || phaseId === "vote" || phaseId === "reveal"
        ? state.meeting
        : null;
    const elapsedMs = this.#meetingSequence
      ? Math.max(0, this.time.now - this.#meetingSequence.startedAt)
      : 0;
    const focusRoomId =
      meetingPresentation &&
      elapsedMs < MEETING_ALARM_FOCUS_MS &&
      meetingPresentation.alarmRoomId
        ? meetingPresentation.alarmRoomId
        : state.camera.roomId;
    const snapshot =
      meetingPresentation?.stagedSnapshot ?? state.replay.snapshot;

    this.#hud?.setContent({
      surveillance: state.surveillance,
      phaseLabel: phaseId.toUpperCase(),
      timerText: replayTimerLine(
        state.replay.frameIndex,
        state.replay.totalFrames,
        state.replay.snapshot.tick,
      ),
      contextText: highlightText,
    });
    this.#console?.setPresentation(state.surveillance);
    this.#stage?.render({
      snapshot,
      focusRoomId,
      immediateFocus:
        meetingPresentation &&
        elapsedMs < MEETING_ALARM_FOCUS_MS &&
        meetingPresentation.alarmRoomId
          ? false
          : state.camera.immediate,
      seatResolver: resolveSeatResolver(phaseId),
      ...(meetingPresentation && this.#meetingSequence
        ? {
            positionOverrides: this.#meetingSequence.seatPositions,
          }
        : {}),
      showTaskChips:
        phaseId === "roam" && state.surveillance.mode === "roaming",
    });
  }

  #attachReplayControls() {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return () => {};
    }

    const bind = (
      eventName: string,
      handler: (event: KeyboardEvent) => void,
    ) => {
      const guardedHandler = (event: KeyboardEvent) => {
        if (this.#director.getState().activeScene !== "replay") {
          return;
        }

        handler(event);
      };

      keyboard.on(eventName, guardedHandler);

      return () => {
        keyboard.off(eventName, guardedHandler);
      };
    };

    const disposers = [
      bind("keydown-LEFT", () => {
        this.#director.stepReplay(-1);
      }),
      bind("keydown-RIGHT", () => {
        this.#director.stepReplay(1);
      }),
      bind("keydown-HOME", () => {
        this.#director.jumpReplay(0);
      }),
    ];

    return () => {
      for (const dispose of disposers) {
        dispose();
      }
    };
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#hud?.resize(this.scale.width, this.scale.height);
    this.#console?.resize(this.scale.width, this.scale.height);
  }
}
