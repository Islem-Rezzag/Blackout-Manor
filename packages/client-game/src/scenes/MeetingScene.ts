import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { GamePresentationState } from "../directors/types";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import {
  createMeetingBlocking,
  resolveMeetingDirection,
} from "../stage/meetingBlocking";
import { createMeetingSeatMap } from "../stage/seatResolvers";
import { createScreenSpaceCamera } from "../ui/ScreenSpaceCamera";
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
  #meetingPlate: Phaser.GameObjects.Container | null = null;
  #meetingBackdrop: Phaser.GameObjects.Rectangle | null = null;
  #meetingGlow: Phaser.GameObjects.Image | null = null;
  #meetingHeader: Phaser.GameObjects.Text | null = null;
  #meetingDetail: Phaser.GameObjects.Text | null = null;
  #unsubscribe: (() => void) | null = null;
  #presentationState: GamePresentationState | null = null;
  #meetingSequence: MeetingSequenceState | null = null;
  #uiCamera: Phaser.Cameras.Scene2D.Camera | null = null;

  constructor(director: GameDirector) {
    super(SCENE_KEYS.meeting);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
    this.#meetingGlow = this.add
      .image(this.scale.width / 2, this.scale.height - 192, "focus-beam")
      .setScrollFactor(0)
      .setDepth(321)
      .setDisplaySize(860, 260)
      .setTint(0xe1be86)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.18);

    const plate = this.add
      .rectangle(0, 0, 796, 96, 0x14251e, 0.94)
      .setStrokeStyle(1, 0xc6ad74, 0.25);
    const header = this.add.text(-356, -26, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "24px",
      fontStyle: "bold",
      wordWrap: { width: 708 },
    });
    const detail = this.add.text(-356, 16, "", {
      color: "#bcc6ae",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 708 },
    });

    this.#meetingHeader = header;
    this.#meetingBackdrop = plate;
    this.#meetingDetail = detail;
    this.#meetingPlate = this.add.container(0, 0, [plate, header, detail]);
    this.#meetingPlate.setDepth(322);
    this.#meetingPlate.setScrollFactor(0);
    this.#uiCamera = createScreenSpaceCamera(this, [
      this.#meetingPlate,
      this.#meetingGlow,
    ]);
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
      this.#meetingHeader?.setText(state.meeting.header);
      this.#meetingDetail?.setText(state.meeting.detail);

      if (this.#meetingSequence?.id !== state.meeting.sequenceId) {
        this.#meetingSequence = {
          id: state.meeting.sequenceId,
          startedAt: this.time.now,
          ...createMeetingBlocking(state.meeting),
        };
      }
      this.#meetingSequence.seatPositions = createMeetingSeatMap(
        state.meeting.stagedSnapshot.players,
        state.meeting.meetingRoomId,
        state.meeting.stagedSnapshot.phaseId,
        state.meeting.targetPlayerId,
      );

      this.#renderMeetingState();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#unsubscribe?.();
      this.#unsubscribe = null;
      this.scale.off("resize", this.#handleResize, this);
      this.#meetingGlow?.destroy();
      this.#meetingGlow = null;
      this.#stage?.destroy();
      this.#stage = null;
      this.#meetingPlate?.destroy(true);
      this.#meetingPlate = null;
      this.#meetingHeader = null;
      this.#meetingBackdrop = null;
      this.#meetingDetail = null;
      this.#presentationState = null;
      this.#meetingSequence = null;
    });
  }

  update(_time: number, delta: number) {
    this.#renderMeetingState();
    this.#stage?.update(delta);
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
    this.#meetingPlate?.setVisible(panelReveal > 0.01);
    this.#meetingPlate?.setAlpha(panelReveal);
    this.#meetingPlate?.setPosition(
      this.scale.width / 2,
      (this.scale.width < 800 ? 402 : 260) + (1 - panelReveal) * 22,
    );
    this.#meetingGlow?.setAlpha(
      direction.phase === "alarm"
        ? 0.24
        : direction.phase === "overview"
          ? 0.12
          : 0.12 + hallReveal * 0.12,
    );

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
  }

  #resizePanels() {
    this.#meetingGlow?.setPosition(
      this.scale.width / 2,
      this.scale.height - 192,
    );
    this.#meetingPlate?.setPosition(
      this.scale.width / 2,
      this.scale.width < 800 ? 402 : 260,
    );
    this.#uiCamera?.setSize(this.scale.width, this.scale.height);
    const width = Math.min(796, this.scale.width - 32);
    this.#meetingBackdrop?.setSize(width, 96);
    this.#meetingHeader?.setPosition(-width / 2 + 20, -32);
    this.#meetingHeader?.setFontSize(this.scale.width < 800 ? 16 : 24);
    this.#meetingHeader?.setWordWrapWidth(width - 40);
    this.#meetingDetail?.setPosition(
      -width / 2 + 20,
      this.scale.width < 800 ? 10 : 16,
    );
    this.#meetingDetail?.setFontSize(this.scale.width < 800 ? 12 : 14);
    this.#meetingDetail?.setWordWrapWidth(width - 40);
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
