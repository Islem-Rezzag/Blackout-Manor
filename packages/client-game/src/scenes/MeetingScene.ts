import * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import { MeetingPortraitStrip } from "../entities/avatar/MeetingPortraitStrip";
import { ManorWorldStage } from "../stage/ManorWorldStage";
import { createMeetingSeatResolver } from "../stage/seatResolvers";
import { RuntimeBanner } from "../ui/RuntimeBanner";
import { SCENE_KEYS } from "./keys";

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

  constructor(director: GameDirector) {
    super(SCENE_KEYS.meeting);
    this.#director = director;
  }

  create() {
    this.#stage = new ManorWorldStage({ scene: this });
    this.#banner = new RuntimeBanner({ scene: this, width: 580 });
    this.#meetingGlow = this.add
      .image(this.scale.width / 2, this.scale.height - 176, "focus-beam")
      .setScrollFactor(0)
      .setDepth(321)
      .setDisplaySize(760, 220)
      .setTint(0xe1be86)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.16);
    this.#portraitStrip = new MeetingPortraitStrip(this);

    const plate = this.add
      .rectangle(0, 0, 724, 106, 0x081018, 0.8)
      .setStrokeStyle(1, 0x73a8c9, 0.16);
    const header = this.add.text(-326, -24, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "21px",
      fontStyle: "bold",
      wordWrap: { width: 648 },
    });
    const detail = this.add.text(-326, 12, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: 648 },
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

      this.#banner?.setContent(state.banner);
      this.#meetingHeader?.setText(state.meeting.header);
      this.#meetingDetail?.setText(state.meeting.detail);
      this.#portraitStrip?.render(
        state.meeting.stagedSnapshot.players,
        state.meeting.stagedSnapshot.phaseId,
        state.meeting.stagedSnapshot.recentEvents,
      );
      this.#stage?.render({
        snapshot: state.meeting.stagedSnapshot,
        focusRoomId: state.camera.roomId,
        immediateFocus: state.camera.immediate,
        seatResolver: createMeetingSeatResolver(
          state.meeting.meetingRoomId,
          state.meeting.stagedSnapshot.phaseId,
        ),
        showTaskChips: false,
      });
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
    });
  }

  update(_time: number, delta: number) {
    this.#stage?.update(delta);
    this.#portraitStrip?.update(delta);
  }

  #resizePanels() {
    this.#banner?.resize(this.scale.width);
    this.#portraitStrip?.resize(this.scale.width, this.scale.height);
    this.#meetingGlow?.setPosition(
      this.scale.width / 2,
      this.scale.height - 176,
    );
    this.#meetingPlate?.setPosition(
      this.scale.width / 2,
      this.scale.height - 86,
    );
  }

  #handleResize(gameSize?: Phaser.Structs.Size) {
    this.#stage?.resize(gameSize);
    this.#resizePanels();
  }
}
