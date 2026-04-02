import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { GamePresentationState } from "../directors/types";
import { MeetingPortraitStrip } from "../entities/avatar/MeetingPortraitStrip";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import {
  createMeetingBlocking,
  deriveMeetingTravelStatuses,
  MEETING_ALARM_FOCUS_MS,
  MEETING_PANEL_DELAY_MS,
  MEETING_PORTRAIT_DELAY_MS,
} from "../stage/meetingBlocking";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

type MeetingSequenceState = ReturnType<typeof createMeetingBlocking> & {
  id: string;
  startedAt: number;
};

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
    const focusRoomId =
      elapsedMs < MEETING_ALARM_FOCUS_MS && state.meeting.alarmRoomId
        ? state.meeting.alarmRoomId
        : state.camera.roomId;
    const panelVisible = elapsedMs >= MEETING_PANEL_DELAY_MS;
    const portraitsVisible = elapsedMs >= MEETING_PORTRAIT_DELAY_MS;

    this.#meetingPlate?.setVisible(panelVisible);
    this.#meetingGlow?.setAlpha(
      elapsedMs < MEETING_ALARM_FOCUS_MS ? 0.22 : 0.14,
    );
    this.#portraitStrip?.setVisible(portraitsVisible);

    this.#stage?.render({
      snapshot: state.meeting.stagedSnapshot,
      focusRoomId,
      inspection: {
        ...state.inspection,
        mode: "inspect",
        roomId: focusRoomId,
        immediate:
          elapsedMs < MEETING_ALARM_FOCUS_MS && state.meeting.alarmRoomId
            ? false
            : state.inspection.immediate,
      },
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
      portraitsVisible ? state.meeting.stagedSnapshot.players : [],
      state.meeting.stagedSnapshot.phaseId,
      state.meeting.stagedSnapshot.recentEvents,
      portraitsVisible ? travelStatuses : new Map(),
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
