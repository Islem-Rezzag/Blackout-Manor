import { describe, expect, it } from "vitest";

import { getRoomRenderData, MANOR_WORLD_BOUNDS } from "../tiled/manorLayout";
import { resolveDirectedCameraPlan } from "./cameraDirection";

describe("camera direction", () => {
  it("anchors inspection shots to the inspected room even when roaming focus differs", () => {
    const study = getRoomRenderData("study");
    const plan = resolveDirectedCameraPlan({
      camera: {
        roomId: "ballroom",
        immediate: false,
        reason: "interaction",
        detail: "Visible interaction overrides passive roaming.",
      },
      inspection: {
        mode: "inspect",
        roomId: "study",
        immediate: false,
        label: "Inspecting Study",
        detail: "Room focus keeps the desk and evidence wall readable.",
      },
      variant: "manor",
    });

    expect(plan.activeRoomId).toBe("ballroom");
    expect(plan.focusRoomId).toBe("study");
    expect(plan.inspectionRoomId).toBe("study");
    expect(plan.targetX).toBeCloseTo(
      study.cameraAnchor.x + (study.focusPoint.x - study.cameraAnchor.x) * 0.18,
      4,
    );
    expect(plan.targetY).toBeCloseTo(
      study.cameraAnchor.y + (study.focusPoint.y - study.cameraAnchor.y) * 0.12,
      4,
    );
    expect(plan.zoomMultiplier).toBeGreaterThan(study.focusZoom);
  });

  it("keeps report moments in overview while biasing toward the reported room", () => {
    const plan = resolveDirectedCameraPlan({
      camera: {
        roomId: "cellar",
        immediate: false,
        reason: "report",
        detail: "Body reports take camera priority.",
      },
      inspection: {
        mode: "overview",
        roomId: null,
        immediate: false,
        label: "Whole manor overview",
        detail: "The full floorplan stays visible.",
      },
      variant: "manor",
    });

    expect(plan.focusRoomId).toBe("cellar");
    expect(plan.inspectionRoomId).toBeNull();
    expect(plan.overviewBias).toBeGreaterThan(0.15);
    expect(plan.targetX).not.toBeCloseTo(MANOR_WORLD_BOUNDS.width / 2, 1);
    expect(plan.targetY).not.toBeCloseTo(MANOR_WORLD_BOUNDS.height / 2, 1);
    expect(plan.zoomMultiplier).toBeGreaterThan(1.03);
    expect(plan.transitionMs).toBe(840);
  });

  it("extends timing and emphasis for meeting-direction shots", () => {
    const basePlan = resolveDirectedCameraPlan({
      camera: {
        roomId: "grand-hall",
        immediate: false,
        reason: "meeting",
        detail: "Meeting staging centers the tribunal.",
      },
      inspection: {
        mode: "inspect",
        roomId: "grand-hall",
        immediate: false,
        label: "Inspecting Grand Hall",
        detail: "The hall gathers the surviving cast.",
      },
      variant: "manor",
    });
    const meetingPlan = resolveDirectedCameraPlan({
      camera: {
        roomId: "grand-hall",
        immediate: false,
        reason: "meeting",
        detail: "Meeting staging centers the tribunal.",
      },
      inspection: {
        mode: "inspect",
        roomId: "grand-hall",
        immediate: false,
        label: "Inspecting Grand Hall",
        detail: "The hall gathers the surviving cast.",
      },
      variant: "meeting",
    });

    expect(meetingPlan.transitionMs).toBeGreaterThan(basePlan.transitionMs);
    expect(meetingPlan.zoomMultiplier).toBeGreaterThan(basePlan.zoomMultiplier);
    expect(meetingPlan.emphasis).toBeGreaterThan(basePlan.emphasis);
  });

  it("falls back to a centered manor overview when no room is active", () => {
    const plan = resolveDirectedCameraPlan({
      camera: {
        roomId: null,
        immediate: false,
        reason: "meeting",
        detail: "The camera resets to whole-house context.",
      },
      inspection: {
        mode: "overview",
        roomId: null,
        immediate: false,
        label: "Whole manor overview",
        detail: "The house stays visible.",
      },
      variant: "replay",
    });

    expect(plan.activeRoomId).toBeNull();
    expect(plan.focusRoomId).toBeNull();
    expect(plan.targetX).toBeCloseTo(MANOR_WORLD_BOUNDS.width / 2, 4);
    expect(plan.targetY).toBeCloseTo(MANOR_WORLD_BOUNDS.height / 2, 4);
    expect(plan.zoomMultiplier).toBeGreaterThan(1);
  });
});
