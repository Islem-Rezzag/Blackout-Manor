import type { PhaseId, RoomId, TaskId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import {
  TASK_INTERACTION_GEOMETRIES,
  type TaskReadabilityNode,
  type TaskReadabilityPresentation,
  type TaskReadabilityTone,
} from "../tasking/taskReadability";

type TaskReadabilityLayerOptions = {
  scene: Phaser.Scene;
};

type TaskNodeVisual = {
  taskId: TaskId;
  propGlow: Phaser.GameObjects.Image;
  propMarker: Phaser.GameObjects.Rectangle;
  hotspotPulse: Phaser.GameObjects.Image;
  hotspotRing: Phaser.GameObjects.Ellipse;
  hotspotPlate: Phaser.GameObjects.Ellipse;
  approachMarker: Phaser.GameObjects.Ellipse;
  cuePlate: Phaser.GameObjects.Rectangle;
  cueTitle: Phaser.GameObjects.Text;
  cueDetail: Phaser.GameObjects.Text;
  progressTrack: Phaser.GameObjects.Rectangle;
  progressFill: Phaser.GameObjects.Rectangle;
  all: Array<
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Ellipse
    | Phaser.GameObjects.Text
  >;
};

const TASK_LAYER_DEPTH = {
  props: 76,
  interaction: 178,
} as const;

const phaseSupportsTaskReadability = (phaseId: PhaseId) =>
  phaseId === "roam" || phaseId === "report";

const toneStyle = (tone: TaskReadabilityTone, cueColor: number) => {
  switch (tone) {
    case "busy":
      return {
        propAlpha: 0.18,
        hotspotAlpha: 0.72,
        pulseAlpha: 0.24,
        plateFill: 0x151d25,
        plateStroke: cueColor,
        detailColor: "#f3e8c7",
      };
    case "blocked":
      return {
        propAlpha: 0.2,
        hotspotAlpha: 0.78,
        pulseAlpha: 0.28,
        plateFill: 0x251617,
        plateStroke: 0xff9b84,
        detailColor: "#ffe4da",
      };
    case "completed":
      return {
        propAlpha: 0.16,
        hotspotAlpha: 0.6,
        pulseAlpha: 0.18,
        plateFill: 0x152118,
        plateStroke: 0x9dd9a4,
        detailColor: "#e9f9ec",
      };
    case "attention":
      return {
        propAlpha: 0.22,
        hotspotAlpha: 0.8,
        pulseAlpha: 0.3,
        plateFill: 0x28191a,
        plateStroke: 0xf2b188,
        detailColor: "#fff0e2",
      };
    default:
      return {
        propAlpha: 0.08,
        hotspotAlpha: 0.24,
        pulseAlpha: 0.06,
        plateFill: 0x0c141b,
        plateStroke: cueColor,
        detailColor: "#d5e0ea",
      };
  }
};

export class TaskReadabilityLayer {
  readonly #scene: Phaser.Scene;
  readonly #taskVisuals = new Map<TaskId, TaskNodeVisual>();

  constructor(options: TaskReadabilityLayerOptions) {
    this.#scene = options.scene;

    for (const geometry of TASK_INTERACTION_GEOMETRIES) {
      const propGlow = this.#scene.add
        .image(geometry.propPoint.x, geometry.propPoint.y, "room-glow")
        .setDepth(TASK_LAYER_DEPTH.props)
        .setDisplaySize(92, 54)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0);
      const propMarker = this.#scene.add
        .rectangle(
          geometry.propPoint.x,
          geometry.propPoint.y,
          14,
          14,
          0xffffff,
          0,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setAngle(45);
      const hotspotPulse = this.#scene.add
        .image(geometry.hotspotPoint.x, geometry.hotspotPoint.y, "signal-pulse")
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setDisplaySize(66, 66)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      const hotspotRing = this.#scene.add
        .ellipse(
          geometry.hotspotPoint.x,
          geometry.hotspotPoint.y,
          56,
          24,
          0xffffff,
          0.02,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setStrokeStyle(2, 0xffffff, 0);
      const hotspotPlate = this.#scene.add
        .ellipse(
          geometry.hotspotPoint.x,
          geometry.hotspotPoint.y + 2,
          28,
          10,
          0xffffff,
          0.18,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction);
      const approachMarker = this.#scene.add
        .ellipse(
          geometry.approachPoint.x,
          geometry.approachPoint.y,
          18,
          8,
          0xffffff,
          0.04,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setStrokeStyle(1, 0xffffff, 0);
      const cuePlate = this.#scene.add
        .rectangle(
          geometry.hotspotPoint.x,
          geometry.hotspotPoint.y - 28,
          110,
          24,
          0x0c141b,
          0.84,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setStrokeStyle(1, geometry.cueColor, 0.32);
      const cueTitle = this.#scene.add.text(
        geometry.hotspotPoint.x,
        geometry.hotspotPoint.y - 34,
        geometry.shortLabel,
        {
          color: "#f5f0e4",
          fontFamily: "Segoe UI, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          letterSpacing: 0.8,
        },
      );
      cueTitle.setDepth(TASK_LAYER_DEPTH.interaction);
      cueTitle.setOrigin(0.5);
      const cueDetail = this.#scene.add.text(
        geometry.hotspotPoint.x,
        geometry.hotspotPoint.y - 12,
        "",
        {
          color: "#d5e0ea",
          fontFamily: "Segoe UI, sans-serif",
          fontSize: "10px",
        },
      );
      cueDetail.setDepth(TASK_LAYER_DEPTH.interaction);
      cueDetail.setOrigin(0.5);
      const progressTrack = this.#scene.add
        .rectangle(
          geometry.hotspotPoint.x,
          geometry.hotspotPoint.y + 18,
          76,
          6,
          0x071018,
          0.74,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setStrokeStyle(1, geometry.cueColor, 0.18);
      const progressFill = this.#scene.add
        .rectangle(
          geometry.hotspotPoint.x - 37,
          geometry.hotspotPoint.y + 18,
          8,
          4,
          geometry.cueColor,
          0.92,
        )
        .setDepth(TASK_LAYER_DEPTH.interaction)
        .setOrigin(0, 0.5);

      this.#scene.tweens.add({
        targets: hotspotPulse,
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
        repeat: -1,
        duration: 880,
        ease: "Sine.easeInOut",
      });

      const visual: TaskNodeVisual = {
        taskId: geometry.taskId,
        propGlow,
        propMarker,
        hotspotPulse,
        hotspotRing,
        hotspotPlate,
        approachMarker,
        cuePlate,
        cueTitle,
        cueDetail,
        progressTrack,
        progressFill,
        all: [
          propGlow,
          propMarker,
          hotspotPulse,
          hotspotRing,
          hotspotPlate,
          approachMarker,
          cuePlate,
          cueTitle,
          cueDetail,
          progressTrack,
          progressFill,
        ],
      };

      for (const object of visual.all) {
        object.setVisible(false);
      }

      this.#taskVisuals.set(geometry.taskId, visual);
    }
  }

  render(options: {
    presentation: TaskReadabilityPresentation;
    phaseId: PhaseId;
    focusRoomId: RoomId | null;
    hoveredRoomId: RoomId | null;
    showTaskChips: boolean;
  }) {
    if (!phaseSupportsTaskReadability(options.phaseId)) {
      for (const visual of this.#taskVisuals.values()) {
        for (const object of visual.all) {
          object.setVisible(false);
        }
      }

      return;
    }

    for (const node of options.presentation.nodes.values()) {
      const visual = this.#taskVisuals.get(node.taskId);

      if (!visual) {
        continue;
      }

      this.#applyNodeState(visual, node, options);
    }
  }

  destroy() {
    for (const visual of this.#taskVisuals.values()) {
      for (const object of visual.all) {
        object.destroy();
      }
    }

    this.#taskVisuals.clear();
  }

  #applyNodeState(
    visual: TaskNodeVisual,
    node: TaskReadabilityNode,
    options: {
      focusRoomId: RoomId | null;
      hoveredRoomId: RoomId | null;
      showTaskChips: boolean;
    },
  ) {
    const focused =
      options.focusRoomId === node.roomId ||
      options.hoveredRoomId === node.roomId;
    const emphasized =
      node.tone !== "available" || node.active || node.recent || focused;
    const showLabel = focused || node.tone !== "available" || node.recent;
    const showProgress =
      showLabel &&
      (node.tone === "busy" ||
        node.tone === "blocked" ||
        node.tone === "completed" ||
        node.tone === "attention");
    const style = toneStyle(node.tone, node.cueColor);
    const scale = focused ? 1.03 : 1;
    const progress =
      node.tone === "completed"
        ? 1
        : node.tone === "blocked"
          ? Math.max(0.18, node.progress)
          : Math.max(0.08, node.progress);

    visual.propGlow.setVisible(true);
    visual.propGlow.setTint(node.cueColor);
    visual.propGlow.setAlpha(
      focused ? style.propAlpha + 0.06 : emphasized ? style.propAlpha : 0.03,
    );
    visual.propGlow.setScale(scale);

    visual.propMarker.setVisible(focused || emphasized);
    visual.propMarker.setFillStyle(node.cueColor, focused ? 0.34 : 0.18);
    visual.propMarker.setScale(scale);

    visual.hotspotPulse.setVisible(emphasized);
    visual.hotspotPulse.setTint(node.cueColor);
    visual.hotspotPulse.setAlpha(
      focused ? style.pulseAlpha + 0.06 : style.pulseAlpha,
    );
    visual.hotspotPulse.setScale(scale);

    visual.hotspotRing.setVisible(true);
    visual.hotspotRing.setFillStyle(node.cueColor, emphasized ? 0.12 : 0.04);
    visual.hotspotRing.setStrokeStyle(
      2,
      style.plateStroke,
      focused ? 0.78 : emphasized ? style.hotspotAlpha : 0.14,
    );
    visual.hotspotRing.setScale(scale, scale);

    visual.hotspotPlate.setVisible(true);
    visual.hotspotPlate.setFillStyle(
      node.cueColor,
      focused ? 0.34 : emphasized ? 0.22 : 0.08,
    );
    visual.hotspotPlate.setScale(scale, scale);

    visual.approachMarker.setVisible(focused || emphasized);
    visual.approachMarker.setFillStyle(node.cueColor, focused ? 0.22 : 0.1);
    visual.approachMarker.setStrokeStyle(
      1,
      node.cueColor,
      focused ? 0.42 : 0.18,
    );
    visual.approachMarker.setScale(scale, scale);

    visual.cuePlate.setVisible(showLabel);
    visual.cuePlate.setFillStyle(style.plateFill, focused ? 0.92 : 0.84);
    visual.cuePlate.setStrokeStyle(1, style.plateStroke, focused ? 0.56 : 0.34);
    visual.cuePlate.setScale(scale, scale);

    visual.cueTitle.setVisible(showLabel);
    visual.cueTitle.setText(node.shortLabel);
    visual.cueTitle.setAlpha(focused ? 1 : 0.92);
    visual.cueTitle.setScale(scale);

    visual.cueDetail.setVisible(showLabel);
    visual.cueDetail.setText(
      focused ? `${node.propLabel} | ${node.statusText}` : node.statusText,
    );
    visual.cueDetail.setColor(style.detailColor);
    visual.cueDetail.setAlpha(focused ? 1 : 0.84);
    visual.cueDetail.setScale(scale);

    visual.progressTrack.setVisible(showProgress);
    visual.progressTrack.setFillStyle(0x071018, focused ? 0.8 : 0.72);
    visual.progressTrack.setStrokeStyle(
      1,
      style.plateStroke,
      focused ? 0.28 : 0.16,
    );
    visual.progressTrack.setScale(scale, 1);

    visual.progressFill.setVisible(showProgress);
    visual.progressFill.setFillStyle(
      node.tone === "blocked" ? 0xff9b84 : style.plateStroke,
      0.94,
    );
    visual.progressFill.setScale(1, 1);
    visual.progressFill.setDisplaySize(Math.max(8, 74 * progress), 4);
  }
}
