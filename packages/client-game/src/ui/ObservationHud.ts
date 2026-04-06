import type * as Phaser from "phaser";

import type {
  CameraPlan,
  InspectionPresentation,
  SurveillancePresentation,
} from "../directors/types";

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
  camera: CameraPlan;
  inspection: InspectionPresentation;
  surveillance: SurveillancePresentation;
  phaseLabel: string;
  timerText?: string | null;
  contextText?: string | null;
};

const toneColors = {
  speech: {
    fill: 0x131c25,
    stroke: 0xb7d6ec,
    text: "#f5f0e4",
  },
  alert: {
    fill: 0x281519,
    stroke: 0xefad94,
    text: "#fff1eb",
  },
  status: {
    fill: 0x162219,
    stroke: 0x9fd6ad,
    text: "#eef8f1",
  },
} as const;

const cameraPlateTone = {
  default: {
    fill: 0x051019,
    stroke: 0xa1c4d9,
    eyebrow: "#a5cadf",
    hint: "#a8bfce",
  },
  actor: {
    fill: 0x0a1318,
    stroke: 0x8eb8da,
    eyebrow: "#b7d6ec",
    hint: "#a8bfce",
  },
  interaction: {
    fill: 0x10141a,
    stroke: 0xcbb78e,
    eyebrow: "#dfcc9b",
    hint: "#bdb59f",
  },
  sabotage: {
    fill: 0x201418,
    stroke: 0xf0ad8a,
    eyebrow: "#ffd0be",
    hint: "#dab5a8",
  },
  report: {
    fill: 0x241418,
    stroke: 0xf2a48a,
    eyebrow: "#ffd3c5",
    hint: "#ddb7aa",
  },
  surveillance: {
    fill: 0x08141c,
    stroke: 0x7cb9d9,
    eyebrow: "#9fd7f0",
    hint: "#9ebfd2",
  },
  meeting: {
    fill: 0x120f18,
    stroke: 0xd6b17e,
    eyebrow: "#e4c790",
    hint: "#c7b38d",
  },
  endgame: {
    fill: 0x171018,
    stroke: 0xd6bf89,
    eyebrow: "#e2cca0",
    hint: "#cbb994",
  },
} as const satisfies Record<
  CameraPlan["reason"],
  { fill: number; stroke: number; eyebrow: string; hint: string }
>;

const hintLine = (
  mode: SurveillancePresentation["mode"],
  inspection: InspectionPresentation,
) => {
  if (mode === "surveillance") {
    return "Esc whole manor | V roam | Q/E or Tab cycle | 1-4 lock feed";
  }

  if (inspection.mode === "inspect") {
    return "Esc whole manor | click another room | V surveillance";
  }

  return "Click room inspect | Esc whole manor | V surveillance";
};

const cameraTitle = (
  camera: CameraPlan,
  inspection: InspectionPresentation,
  surveillance: SurveillancePresentation,
) => {
  if (surveillance.mode === "surveillance" || inspection.mode === "inspect") {
    return inspection.label;
  }

  switch (camera.reason) {
    case "report":
      return "Public event focus";
    case "sabotage":
      return "Sabotage focus";
    case "meeting":
      return "Hall convergence";
    case "endgame":
      return "Finale focus";
    case "interaction":
      return "Public interaction";
    case "actor":
      return "Cast movement";
    default:
      return inspection.label;
  }
};

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
      .rectangle(0, 0, 580, 124, 0x051019, 0.82)
      .setStrokeStyle(1, 0xa1c4d9, 0.22);
    this.#stateEyebrow = options.scene.add.text(-264, -40, "", {
      color: "#a5cadf",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      letterSpacing: 2.1,
    });
    this.#stateTitle = options.scene.add.text(-264, -10, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "28px",
      fontStyle: "bold",
      wordWrap: { width: 520 },
    });
    this.#stateDetail = options.scene.add.text(-264, 28, "", {
      color: "#dfe6ee",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      wordWrap: { width: 520 },
    });
    this.#stateHint = options.scene.add.text(-264, 54, "", {
      color: "#a8bfce",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      wordWrap: { width: 520 },
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
      .rectangle(0, 0, 960, 68, 0x061018, 0.84)
      .setStrokeStyle(1, 0xa1c4d9, 0.18);
    this.#subtitleSpeaker = options.scene.add.text(-446, -14, "", {
      color: "#a5cadf",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "12px",
      letterSpacing: 1.8,
    });
    this.#subtitleText = options.scene.add.text(-446, 12, "", {
      color: "#f5f0e4",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "15px",
      wordWrap: { width: 878 },
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
        .rectangle(0, 0, 232, 60, 0x061018, 0.76)
        .setStrokeStyle(1, 0xa1c4d9, 0.18);
      const label = options.scene.add.text(-98, -11, "", {
        color: "#f5f0e4",
        fontFamily: "Palatino Linotype, Georgia, serif",
        fontSize: "17px",
        fontStyle: "bold",
        wordWrap: { width: 144 },
      });
      const detail = options.scene.add.text(-98, 14, "", {
        color: "#dfe6ee",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "12px",
        wordWrap: { width: 188 },
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
    const {
      camera,
      contextText,
      inspection,
      phaseLabel,
      surveillance,
      timerText,
    } = content;
    const inspecting = inspection.mode === "inspect";
    const strongFocus =
      inspecting ||
      ["report", "sabotage", "meeting", "endgame"].includes(camera.reason);
    const plateTone = cameraPlateTone[camera.reason];
    const viewModeLabel =
      surveillance.mode === "surveillance"
        ? "SURVEILLANCE"
        : inspection.mode === "inspect"
          ? "ROOM FOCUS"
          : "OVERVIEW";
    const stateDetailText = [timerText, surveillance.indicatorLabel]
      .filter((value): value is string => Boolean(value))
      .join(" | ");
    const narrativeText = contextText ?? inspection.detail;
    const stateHintText = strongFocus
      ? `${camera.detail} | ${hintLine(surveillance.mode, inspection)}`
      : `${narrativeText} | ${hintLine(surveillance.mode, inspection)}`;

    this.#stateEyebrow.setText(`${phaseLabel} | ${viewModeLabel}`);
    this.#stateTitle.setText(cameraTitle(camera, inspection, surveillance));
    this.#stateDetail.setText(stateDetailText);
    this.#stateHint.setText(stateHintText);
    this.#stateBackplate.setDisplaySize(strongFocus ? 556 : 580, 124);
    this.#stateBackplate.setFillStyle(
      plateTone.fill,
      strongFocus ? 0.86 : 0.82,
    );
    this.#stateBackplate.setStrokeStyle(
      1,
      plateTone.stroke,
      strongFocus ? 0.28 : 0.22,
    );
    this.#stateEyebrow.setColor(plateTone.eyebrow);
    this.#stateDetail.setColor("#dfe6ee");
    this.#stateHint.setColor(plateTone.hint);

    const subtitle = surveillance.subtitle;
    const expandedSubtitle = inspecting || strongFocus;
    if (subtitle) {
      const tone = toneColors[subtitle.tone];
      this.#subtitleContainer.setVisible(true);
      this.#subtitlePlate.setDisplaySize(
        expandedSubtitle ? 1000 : 960,
        expandedSubtitle ? 82 : 68,
      );
      this.#subtitlePlate.setFillStyle(tone.fill, 0.84);
      this.#subtitlePlate.setStrokeStyle(1, tone.stroke, 0.28);
      this.#subtitleSpeaker.setColor(tone.text);
      this.#subtitleText.setColor(tone.text);
      this.#subtitleSpeaker.setFontSize(expandedSubtitle ? "13px" : "12px");
      this.#subtitleText.setFontSize(expandedSubtitle ? "16px" : "15px");
      this.#subtitleText.setWordWrapWidth(expandedSubtitle ? 920 : 878);
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
      this.#subtitlePlate.setDisplaySize(
        expandedSubtitle ? 1000 : 960,
        expandedSubtitle ? 82 : 68,
      );
      this.#subtitlePlate.setFillStyle(0x061018, 0.8);
      this.#subtitlePlate.setStrokeStyle(1, 0xa1c4d9, 0.16);
      this.#subtitleSpeaker.setColor("#a5cadf");
      this.#subtitleText.setColor("#dfe6ee");
      this.#subtitleSpeaker.setFontSize(expandedSubtitle ? "13px" : "12px");
      this.#subtitleText.setFontSize(expandedSubtitle ? "16px" : "15px");
      this.#subtitleText.setWordWrapWidth(expandedSubtitle ? 920 : 878);
      this.#subtitleSpeaker.setText("OBSERVATION");
      this.#subtitleText.setText(
        surveillance.mode === "surveillance"
          ? "The console keeps several rooms live while the main camera stays locked to the selected feed."
          : inspection.mode === "inspect"
            ? "Room focus enlarges public speech, cast silhouettes, and task readability without exposing any hidden-role data."
            : "The whole manor stays visible while public room activity remains framed across the house.",
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
    this.#statePlate.setPosition(316, 104);
    this.#subtitleContainer.setPosition(width / 2, height - 68);

    for (const [index, chip] of this.#statusChips.entries()) {
      chip.container.setPosition(width - 146, 106 + index * 72);
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
