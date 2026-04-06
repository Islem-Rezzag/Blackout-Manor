import type { RoomId } from "@blackout-manor/shared";

import type { CameraPlan, InspectionPresentation } from "../directors/types";
import {
  getRoomRenderData,
  MANOR_WORLD_BOUNDS,
  type ManorRenderRoom,
} from "../tiled/manorLayout";

export type StageDirectionVariant = "manor" | "meeting" | "replay" | "endgame";

export type DirectedCameraPlan = {
  activeRoomId: RoomId | null;
  focusRoomId: RoomId | null;
  inspectionRoomId: RoomId | null;
  targetX: number;
  targetY: number;
  zoomMultiplier: number;
  transitionMs: number;
  emphasis: number;
  overviewBias: number;
  roomScaleBoost: number;
  dimStrength: number;
  doorwayEmphasis: number;
  corridorEmphasis: number;
};

const REASON_TUNING = {
  default: {
    overviewBias: 0.03,
    overviewZoom: 1,
    inspectZoom: 1.04,
    transitionMs: 560,
    emphasis: 0.08,
  },
  actor: {
    overviewBias: 0.06,
    overviewZoom: 1.01,
    inspectZoom: 1.05,
    transitionMs: 620,
    emphasis: 0.12,
  },
  interaction: {
    overviewBias: 0.11,
    overviewZoom: 1.02,
    inspectZoom: 1.08,
    transitionMs: 700,
    emphasis: 0.2,
  },
  sabotage: {
    overviewBias: 0.15,
    overviewZoom: 1.03,
    inspectZoom: 1.1,
    transitionMs: 760,
    emphasis: 0.28,
  },
  report: {
    overviewBias: 0.18,
    overviewZoom: 1.04,
    inspectZoom: 1.12,
    transitionMs: 840,
    emphasis: 0.34,
  },
  surveillance: {
    overviewBias: 0.12,
    overviewZoom: 1.02,
    inspectZoom: 1.09,
    transitionMs: 660,
    emphasis: 0.24,
  },
  meeting: {
    overviewBias: 0.14,
    overviewZoom: 1.03,
    inspectZoom: 1.12,
    transitionMs: 920,
    emphasis: 0.27,
  },
  endgame: {
    overviewBias: 0.1,
    overviewZoom: 1.025,
    inspectZoom: 1.1,
    transitionMs: 980,
    emphasis: 0.24,
  },
} as const satisfies Record<
  CameraPlan["reason"],
  {
    overviewBias: number;
    overviewZoom: number;
    inspectZoom: number;
    transitionMs: number;
    emphasis: number;
  }
>;

const VARIANT_TUNING = {
  manor: {
    overviewZoom: 1,
    inspectZoom: 1,
    durationMultiplier: 1,
    emphasisBoost: 0,
  },
  meeting: {
    overviewZoom: 1.018,
    inspectZoom: 1.04,
    durationMultiplier: 1.08,
    emphasisBoost: 0.08,
  },
  replay: {
    overviewZoom: 1.012,
    inspectZoom: 1.02,
    durationMultiplier: 1.05,
    emphasisBoost: 0.04,
  },
  endgame: {
    overviewZoom: 1.02,
    inspectZoom: 1.04,
    durationMultiplier: 1.12,
    emphasisBoost: 0.06,
  },
} as const satisfies Record<
  StageDirectionVariant,
  {
    overviewZoom: number;
    inspectZoom: number;
    durationMultiplier: number;
    emphasisBoost: number;
  }
>;

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const manorCenter = {
  x: MANOR_WORLD_BOUNDS.width / 2,
  y: MANOR_WORLD_BOUNDS.height / 2,
};

const resolveRoomAnchor = (
  room: ManorRenderRoom,
  camera: CameraPlan,
  inspectionRoomId: RoomId | null,
) => {
  switch (camera.reason) {
    case "report":
      return {
        x: lerp(room.cameraAnchor.x, room.cluePoint.x, 0.4),
        y: lerp(room.cameraAnchor.y, room.cluePoint.y, 0.34),
      };
    case "sabotage":
      return {
        x: lerp(room.cameraAnchor.x, room.focusPoint.x, 0.24),
        y: lerp(room.cameraAnchor.y, room.bounds.y + room.height * 0.68, 0.38),
      };
    case "surveillance":
      return {
        x: lerp(room.cameraAnchor.x, room.focusPoint.x, 0.16),
        y: room.cameraAnchor.y - room.height * 0.04,
      };
    case "meeting":
      return {
        x: lerp(room.cameraAnchor.x, room.focusPoint.x, 0.14),
        y: room.cameraAnchor.y - room.height * (inspectionRoomId ? 0.06 : 0.03),
      };
    case "endgame":
      return {
        x: room.cameraAnchor.x,
        y: room.cameraAnchor.y - room.height * 0.05,
      };
    case "interaction":
      return {
        x: lerp(room.cameraAnchor.x, room.focusPoint.x, 0.18),
        y: lerp(room.cameraAnchor.y, room.focusPoint.y, 0.12),
      };
    default:
      return room.cameraAnchor;
  }
};

export const resolveDirectedCameraPlan = (options: {
  camera: CameraPlan;
  inspection: InspectionPresentation;
  variant: StageDirectionVariant;
}): DirectedCameraPlan => {
  const { camera, inspection, variant } = options;
  const reasonTuning = REASON_TUNING[camera.reason];
  const variantTuning = VARIANT_TUNING[variant];
  const activeRoomId = camera.roomId;
  const inspectionRoomId =
    inspection.mode === "inspect" ? (inspection.roomId ?? activeRoomId) : null;
  const focusRoomId = inspectionRoomId ?? activeRoomId;
  const emphasis = clamp(
    reasonTuning.emphasis + variantTuning.emphasisBoost,
    0,
    0.56,
  );

  if (!focusRoomId) {
    return {
      activeRoomId,
      focusRoomId: null,
      inspectionRoomId,
      targetX: manorCenter.x,
      targetY: manorCenter.y,
      zoomMultiplier: variantTuning.overviewZoom,
      transitionMs:
        camera.immediate || inspection.immediate
          ? 0
          : Math.round(
              reasonTuning.transitionMs * variantTuning.durationMultiplier,
            ),
      emphasis,
      overviewBias: 0,
      roomScaleBoost: 0.012,
      dimStrength: inspectionRoomId ? 0.58 : 0.12,
      doorwayEmphasis: 0.16 + emphasis * 0.42,
      corridorEmphasis: 0.08 + emphasis * 0.3,
    };
  }

  const room = getRoomRenderData(focusRoomId);
  const anchor = resolveRoomAnchor(room, camera, inspectionRoomId);
  const transitionMs =
    camera.immediate || inspection.immediate
      ? 0
      : Math.round(
          reasonTuning.transitionMs * variantTuning.durationMultiplier,
        );

  if (inspectionRoomId) {
    return {
      activeRoomId,
      focusRoomId,
      inspectionRoomId,
      targetX: anchor.x,
      targetY: anchor.y,
      zoomMultiplier:
        room.focusZoom * reasonTuning.inspectZoom * variantTuning.inspectZoom,
      transitionMs,
      emphasis,
      overviewBias: 0,
      roomScaleBoost: 0.026 + emphasis * 0.032,
      dimStrength: 0.54 + emphasis * 0.16,
      doorwayEmphasis: 0.24 + emphasis * 0.48,
      corridorEmphasis: 0.12 + emphasis * 0.4,
    };
  }

  const overviewBias = clamp(reasonTuning.overviewBias, 0, 0.22);

  return {
    activeRoomId,
    focusRoomId,
    inspectionRoomId: null,
    targetX: lerp(manorCenter.x, anchor.x, overviewBias),
    targetY: lerp(manorCenter.y, anchor.y, overviewBias),
    zoomMultiplier: reasonTuning.overviewZoom * variantTuning.overviewZoom,
    transitionMs,
    emphasis,
    overviewBias,
    roomScaleBoost: 0.014 + emphasis * 0.018,
    dimStrength: 0.12 + emphasis * 0.08,
    doorwayEmphasis: 0.18 + emphasis * 0.44,
    corridorEmphasis: 0.08 + emphasis * 0.36,
  };
};
