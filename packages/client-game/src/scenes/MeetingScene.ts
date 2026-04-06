import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { GamePresentationState } from "../directors/types";
import { MeetingPortraitStrip } from "../entities/avatar/MeetingPortraitStrip";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import {
  createMeetingBlocking,
  deriveMeetingTravelStatuses,
  resolveMeetingDirection,
} from "../stage/meetingBlocking";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

type MeetingSequenceState = ReturnType<typeof createMeetingBlocking> & {
  id: string;
  startedAt: number;
};

const revealProgress = (
  elapsedMs: number,
  startMs: number,
  durationMs: number,
) => Phaser.Math.Clamp((elapsedMs - startMs) / Math.max(1, durationMs), 0, 1);

export class MeetingScene extends Phaser.Scene {
  readonly #director: GameDirector;
  #stage: ManorWorldStage | null = null;
  #banner: RuntimeBanner | null = null;
  #meetingPlate: Phaser.GameObjects.Container | null = null;
  #meetingGlow: Phaser.GameObjects.Image | null = null;
  #meetingHeader: Phaser.GameObjects.Text | null = null;
  #meetingDetail: Phaser.GameObjects.Text | null = null;
  #portraitStrip: MeetingPortraitStrip | null = null;
  #unsubscribe: (() => void) | null = null;
  #presentationState: GamePresentationState | null = null;
  #meetingSequence: MeetingSequenceState | null = null;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.meeting);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
    this.#banner = new RuntimeBanner({ scene: this, width: 580 });
    this.#meetingGlow = this.add
      .image(this.scale.width / 2, this.scale.height - 192, "focus-beam")
      .setScrollFactor(0)
      .setDepth(321)
      .setDisplaySize(860, 260)
      .setTint(0xe1be86)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.18);
    this.#portraitStrip = new MeetingPortraitStrip(this);

    const plate = this.add
      .rectangle(0, 0, 796, 118, 0x081018, 0.84)
      .setStrokeStyle(1, 0xa1c4d9, 0.18);
    const header = this.add.text(-356, -26, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "24px",
      fontStyle: "bold",
      wordWrap: { width: 708 },
    });
    const detail = this.add.text(-356, 16, "", {
      color: "#dfe6ee",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 708 },
    });

    this.#meetingHeader = header;
    this.#meetingDetail = detail;
    this.#meetingPlate = this.add.container(0, 0, [plate, header, detail]);
    this.#meetingPlate.setDepth(322);
    this.#meetingPlate.setScrollFactor(0);
    this.#resizePanels();

    this.scale.on("resize", this.#handleResize, this);
    this.#unsubscribe = this.#director.subscribe((state) => {
      if (
        state.activeScene !== "meeting" ||
        !state.snapshot ||
        !state.meeting
      ) {
        return;
      }

      this.#presentationState = state;
      this.#banner?.setContent(state.banner);
      this.#meetingHeader?.setText(state.meeting.header);
      this.#meetingDetail?.setText(state.meeting.detail);

      if (this.#meetingSequence?.id !== state.meeting.sequenceId) {
        this.#meetingSequence = {
          id: state.meeting.sequenceId,
          startedAt: this.time.now,
          ...createMeetingBlocking(state.meeting),
        };
      }

      this.#renderMeetingState();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#banner?.destroy();
      this.#banner = null;
      this.#meetingGlow?.destroy();
      this.#meetingGlow = null;
      this.#portraitStrip?.destroy();
      this.#portraitStrip = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#meetingPlate?.destroy(true);
      this.#meetingPlate = null;
      this.#meetingHeader = null;
      this.#meetingDetail = null;
      this.#presentationState = null;
      this.#meetingSequence = null;
    });
  }

  update(_time: number, delta: number) {
    this.#renderMeetingState();
    this.#stage?.update(delta);
    this.#portraitStrip?.update(delta);
  }

  #renderMeetingState() {
    const state = this.#presentationState;
    const sequence = this.#meetingSequence;

    if (!state?.snapshot || !state.meeting || !sequence) {
      return;
    }

    const elapsedMs = Math.max(0, this.time.now - sequence.startedAt);
    const direction = resolveMeetingDirection({
      meeting: state.meeting,
      elapsedMs,
      directionTimings: sequence.directionTimings,
    });
    const hallReveal = revealProgress(
      elapsedMs,
      sequence.directionTimings.hallFocusMs,
      420,
    );
    const panelReveal = revealProgress(
      elapsedMs,
      sequence.directionTimings.panelRevealMs,
      280,
    );
    const portraitReveal = revealProgress(
      elapsedMs,
      sequence.directionTimings.portraitRevealMs,
      320,
    );

    this.#banner?.setPresentation({
      alpha: direction.phase === "overview" ? 0.9 : 1,
      offsetY: direction.phase === "overview" ? -8 : 0,
      scale: direction.phase === "gather" ? 1 : 0.985,
    });
    this.#meetingPlate?.setVisible(panelReveal > 0.01);
    this.#meetingPlate?.setAlpha(panelReveal);
    this.#meetingPlate?.setPosition(
      this.scale.width / 2,
      this.scale.height - 96 + (1 - panelReveal) * 22,
    );
    this.#meetingGlow?.setAlpha(
      direction.phase === "alarm"
        ? 0.24
        : direction.phase === "overview"
          ? 0.12
          : 0.12 + hallReveal * 0.12,
    );
    this.#portraitStrip?.setVisible(portraitReveal > 0.01);
    this.#portraitStrip?.setPresentation({
      alpha: portraitReveal,
      offsetY: (1 - portraitReveal) * 28,
      scale: 0.98 + portraitReveal * 0.02,
    });

    this.#stage?.render({
      snapshot: state.meeting.stagedSnapshot,
      camera: direction.camera,
      inspection: direction.inspection,
      directionVariant: "meeting",
      seatResolver: () => ({ x: 0, y: 0 }),
      positionOverrides: sequence.seatPositions,
      movementOrigins: sequence.movementOrigins,
      showTaskChips: false,
    });

    const travelStatuses = deriveMeetingTravelStatuses({
      meeting: state.meeting,
      navigationStates: this.#stage?.getAvatarNavigationStates() ?? new Map(),
      travelDurationsMs: sequence.travelDurationsMs,
      elapsedMs,
    });

    this.#portraitStrip?.render(
      portraitReveal > 0.01 ? state.meeting.stagedSnapshot.players : [],
      state.meeting.stagedSnapshot.phaseId,
      state.meeting.stagedSnapshot.recentEvents,
      portraitReveal > 0.01 ? travelStatuses : new Map(),
    );
  }

  #resizePanels() {
    this.#banner?.resize(this.scale.width);
    this.#portraitStrip?.resize(this.scale.width, this.scale.height);
    this.#meetingGlow?.setPosition(
      this.scale.width / 2,
      this.scale.height - 192,
    );
    this.#meetingPlate?.setPosition(
      this.scale.width / 2,
      this.scale.height - 96,
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
