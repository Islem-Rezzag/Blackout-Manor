import type { RoomId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type {
  EnvironmentDoorNodeVisual,
  EnvironmentStageLayers,
  EnvironmentThresholdRenderPlan,
} from "./EnvironmentRenderTypes";

export const drawThresholds = (options: {
  scene: Phaser.Scene;
  layers: EnvironmentStageLayers;
  thresholds: readonly EnvironmentThresholdRenderPlan[];
}) => {
  const { layers, scene, thresholds } = options;
  const visuals: EnvironmentDoorNodeVisual[] = [];

  for (const thresholdPlan of thresholds) {
    const { art, node } = thresholdPlan;
    const threshold = scene.add
      .rectangle(node.x, node.y, node.width, node.height, node.fill, node.alpha)
      .setOrigin(0.5);
    const thresholdArt = scene.add
      .image(node.x, node.y, art.key)
      .setDisplaySize(
        Math.max(32, node.width + 18),
        Math.max(52, node.height + 34),
      )
      .setAngle(art.angle)
      .setTint(art.tint)
      .setAlpha(node.alpha * 0.54);
    const frame = scene.add
      .rectangle(node.x, node.y, node.width + 10, node.height + 10, 0xffffff, 0)
      .setStrokeStyle(2, node.stroke ?? 0xe4c391, 0.28)
      .setOrigin(0.5);
    const glow = scene.add
      .image(node.x, node.y, "focus-beam")
      .setDisplaySize(
        Math.max(42, node.width * 2.1),
        Math.max(42, node.height * 2.1),
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setTint(node.kind === "stair" ? 0xf1e3b6 : 0xdab37c)
      .setAlpha(0.05);
    const marker = scene.add
      .rectangle(
        node.x,
        node.y,
        Math.max(8, Math.min(node.width, 14)),
        Math.max(8, Math.min(node.height, 14)),
        node.stroke ?? 0xe4c391,
        0.72,
      )
      .setOrigin(0.5);

    layers.floor.add([threshold, thresholdArt]);
    layers.lights.add(glow);
    layers.walls.add(frame);
    layers.interaction.add(marker);

    visuals.push({
      node,
      threshold,
      thresholdArt,
      frame,
      glow,
      marker,
    });
  }

  return visuals;
};

export const getThresholdFocusState = (options: {
  nodeRoomId: RoomId;
  targetRoomIds: readonly RoomId[];
  focusRoomId: RoomId | null;
  hoveredRoomId: RoomId | null;
  inspectedRoomId: RoomId | null;
}) => {
  const {
    focusRoomId,
    hoveredRoomId,
    inspectedRoomId,
    nodeRoomId,
    targetRoomIds,
  } = options;
  const emphasized =
    nodeRoomId === focusRoomId ||
    nodeRoomId === hoveredRoomId ||
    targetRoomIds.includes(focusRoomId ?? nodeRoomId) ||
    targetRoomIds.includes(hoveredRoomId ?? nodeRoomId);
  const inspected =
    nodeRoomId === inspectedRoomId ||
    targetRoomIds.includes(inspectedRoomId ?? nodeRoomId);

  return {
    emphasized,
    inspected,
  };
};

export const refreshThresholdFocus = (options: {
  visuals: readonly EnvironmentDoorNodeVisual[];
  focusRoomId: RoomId | null;
  hoveredRoomId: RoomId | null;
  inspectedRoomId: RoomId | null;
  doorwayEmphasis: number;
}) => {
  const {
    doorwayEmphasis,
    focusRoomId,
    hoveredRoomId,
    inspectedRoomId,
    visuals,
  } = options;

  for (const visual of visuals) {
    const { emphasized, inspected } = getThresholdFocusState({
      nodeRoomId: visual.node.roomId,
      targetRoomIds: visual.node.targetRoomIds,
      focusRoomId,
      hoveredRoomId,
      inspectedRoomId,
    });

    visual.threshold.setAlpha(
      inspected
        ? visual.node.alpha
        : emphasized
          ? visual.node.alpha * (0.82 + doorwayEmphasis * 0.2)
          : visual.node.alpha * (0.56 + doorwayEmphasis * 0.08),
    );
    visual.thresholdArt.setAlpha(
      inspected
        ? visual.node.alpha * (0.82 + doorwayEmphasis * 0.12)
        : emphasized
          ? visual.node.alpha * (0.58 + doorwayEmphasis * 0.18)
          : visual.node.alpha * (0.18 + doorwayEmphasis * 0.08),
    );
    visual.frame.setStrokeStyle(
      2,
      visual.node.stroke ?? 0xe4c391,
      inspected
        ? 0.7 + doorwayEmphasis * 0.14
        : emphasized
          ? 0.5 + doorwayEmphasis * 0.18
          : 0.18 + doorwayEmphasis * 0.06,
    );
    visual.glow.setAlpha(
      inspected
        ? 0.16 + doorwayEmphasis * 0.16
        : emphasized
          ? 0.08 + doorwayEmphasis * 0.2
          : 0.02 + doorwayEmphasis * 0.06,
    );
    visual.marker.setAlpha(
      inspected
        ? 1
        : emphasized
          ? 0.78 + doorwayEmphasis * 0.16
          : 0.32 + doorwayEmphasis * 0.08,
    );
  }
};
