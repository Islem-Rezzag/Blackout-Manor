import type * as Phaser from "phaser";

import type { SurveillancePresentation } from "../directors/types";

type ObservationHudOptions = {
  scene: Phaser.Scene;
};

type StatusChip = {
  container: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  detail: Phaser.GameObjects.Text;
};

type ObservationHudContent = {
  surveillance: SurveillancePresentation;
  phaseLabel: string;
  timerText?: string | null;
  contextText?: string | null;
};

const toneColors = {
  speech: {
    fill: 0x19212a,
    stroke: 0x8eb8da,
    text: "#f5f0e4",
  },
  alert: {
    fill: 0x26161a,
    stroke: 0xe49781,
    text: "#fff1eb",
  },
  status: {
    fill: 0x18231d,
    stroke: 0x8ec9a6,
    text: "#eef8f1",
  },
} as const;

const hintLine = (mode: SurveillancePresentation["mode"]) =>
  mode === "surveillance"
    ? "V roam | Q/E or Tab cycle | 1-4 lock feed"
    : "V surveillance | auto-follow public activity";

const lightLabel = (
  lightLevel: SurveillancePresentation["statusIndicators"][number]["lightLevel"],
) => {
  switch (lightLevel) {
    case "blackout":
      return "blackout";
    case "dim":
      return "dim";
    default:
      return "lit";
  }
};

const doorLabel = (
  doorState: SurveillancePresentation["statusIndicators"][number]["doorState"],
) => {
  switch (doorState) {
    case "jammed":
      return "jammed";
    case "sealed":
      return "sealed";
    default:
      return "open";
  }
};

export class ObservationHud {
  readonly #statePlate: Phaser.GameObjects.Container;
  readonly #stateBackplate: Phaser.GameObjects.Rectangle;
  readonly #stateEyebrow: Phaser.GameObjects.Text;
  readonly #stateTitle: Phaser.GameObjects.Text;
  readonly #stateDetail: Phaser.GameObjects.Text;
  readonly #stateHint: Phaser.GameObjects.Text;
  readonly #subtitlePlate: Phaser.GameObjects.Rectangle;
  readonly #subtitleContainer: Phaser.GameObjects.Container;
  readonly #subtitleSpeaker: Phaser.GameObjects.Text;
  readonly #subtitleText: Phaser.GameObjects.Text;
  readonly #statusChips: StatusChip[];

  constructor(options: ObservationHudOptions) {
    this.#stateBackplate = options.scene.add
      .rectangle(0, 0, 500, 102, 0x061018, 0.78)
      .setStrokeStyle(1, 0x73a8c9, 0.2);
    this.#stateEyebrow = options.scene.add.text(-226, -30, "", {
      color: "#8ec9e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      letterSpacing: 1.8,
    });
    this.#stateTitle = options.scene.add.text(-226, -6, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "22px",
      fontStyle: "bold",
      wordWrap: { width: 440 },
    });
    this.#stateDetail = options.scene.add.text(-226, 22, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      wordWrap: { width: 440 },
    });
    this.#stateHint = options.scene.add.text(-226, 46, "", {
      color: "#9eb9ca",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      wordWrap: { width: 440 },
    });
    this.#statePlate = options.scene.add.container(0, 0, [
      this.#stateBackplate,
      this.#stateEyebrow,
      this.#stateTitle,
      this.#stateDetail,
      this.#stateHint,
    ]);
    this.#statePlate.setScrollFactor(0);
    this.#statePlate.setDepth(320);

    this.#subtitlePlate = options.scene.add
      .rectangle(0, 0, 860, 60, 0x071018, 0.8)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    this.#subtitleSpeaker = options.scene.add.text(-402, -10, "", {
      color: "#8ec9e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      letterSpacing: 1.6,
    });
    this.#subtitleText = options.scene.add.text(-402, 10, "", {
      color: "#f5f0e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "13px",
      wordWrap: { width: 782 },
    });
    this.#subtitleContainer = options.scene.add.container(0, 0, [
      this.#subtitlePlate,
      this.#subtitleSpeaker,
      this.#subtitleText,
    ]);
    this.#subtitleContainer.setScrollFactor(0);
    this.#subtitleContainer.setDepth(320);

    this.#statusChips = Array.from({ length: 3 }, () => {
      const plate = options.scene.add
        .rectangle(0, 0, 204, 50, 0x071018, 0.74)
        .setStrokeStyle(1, 0x73a8c9, 0.16);
      const label = options.scene.add.text(-86, -8, "", {
        color: "#f5f0e4",
        fontFamily: "Palatino Linotype, Georgia, serif",
        fontSize: "15px",
        fontStyle: "bold",
        wordWrap: { width: 122 },
      });
      const detail = options.scene.add.text(-86, 12, "", {
        color: "#d7dee9",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "11px",
        wordWrap: { width: 164 },
      });

      const container = options.scene.add.container(0, 0, [
        plate,
        label,
        detail,
      ]);
      container.setScrollFactor(0);
      container.setDepth(320);

      return {
        container,
        plate,
        label,
        detail,
      };
    });

    this.resize(options.scene.scale.width, options.scene.scale.height);
  }

  setContent(content: ObservationHudContent) {
    const { contextText, phaseLabel, surveillance, timerText } = content;

    this.#stateEyebrow.setText(
      `${phaseLabel} | ${surveillance.mode === "surveillance" ? "SURVEILLANCE" : "OBSERVATION"}`,
    );
    this.#stateTitle.setText(surveillance.cameraLabel);
    this.#stateDetail.setText(
      timerText
        ? `${timerText} | ${surveillance.indicatorLabel}`
        : surveillance.indicatorLabel,
    );
    this.#stateHint.setText(
      contextText
        ? `${contextText} | ${hintLine(surveillance.mode)}`
        : hintLine(surveillance.mode),
    );

    const subtitle = surveillance.subtitle;
    if (subtitle) {
      const tone = toneColors[subtitle.tone];
      this.#subtitleContainer.setVisible(true);
      this.#subtitlePlate.setFillStyle(tone.fill, 0.84);
      this.#subtitlePlate.setStrokeStyle(1, tone.stroke, 0.28);
      this.#subtitleSpeaker.setColor(tone.text);
      this.#subtitleText.setColor(tone.text);
      this.#subtitleSpeaker.setText(
        subtitle.speakerId
          ? `${subtitle.speakerId.toUpperCase()}`
          : subtitle.tone === "alert"
            ? "MANOR ALERT"
            : "PUBLIC SIGNAL",
      );
      this.#subtitleText.setText(subtitle.text);
    } else {
      this.#subtitleContainer.setVisible(true);
      this.#subtitlePlate.setFillStyle(0x071018, 0.76);
      this.#subtitlePlate.setStrokeStyle(1, 0x73a8c9, 0.18);
      this.#subtitleSpeaker.setColor("#8ec9e4");
      this.#subtitleText.setColor("#d7dee9");
      this.#subtitleSpeaker.setText("OBSERVATION");
      this.#subtitleText.setText(
        surveillance.mode === "surveillance"
          ? "The console keeps several rooms live while the main camera stays locked to the selected feed."
          : "The camera follows public manor events while room telemetry stays visible at the edge of frame.",
      );
    }

    for (const [index, chip] of this.#statusChips.entries()) {
      const indicator = surveillance.statusIndicators[index];

      if (!indicator) {
        chip.container.setVisible(false);
        continue;
      }

      chip.container.setVisible(true);
      chip.label.setText(indicator.label);
      chip.detail.setText(
        `${indicator.occupantCount} present | ${lightLabel(indicator.lightLevel)} | ${doorLabel(indicator.doorState)}`,
      );
      chip.plate.setFillStyle(
        indicator.flagged ? 0x1d1415 : 0x071018,
        indicator.flagged ? 0.84 : 0.72,
      );
      chip.plate.setStrokeStyle(
        1,
        indicator.flagged ? 0xe49781 : 0x73a8c9,
        indicator.flagged ? 0.3 : 0.16,
      );
    }
  }

  resize(width: number, height: number) {
    this.#statePlate.setPosition(274, 90);
    this.#subtitleContainer.setPosition(width / 2, height - 56);

    for (const [index, chip] of this.#statusChips.entries()) {
      chip.container.setPosition(width - 130, 90 + index * 60);
    }
  }

  destroy() {
    this.#statePlate.destroy(true);
    this.#subtitleContainer.destroy(true);

    for (const chip of this.#statusChips) {
      chip.container.destroy(true);
    }
  }
}
