import { describe, expect, it } from "vitest";

import { getRoomRenderData, getRoomSeatPosition } from "../tiled/manorLayout";
import { buildEmbodiedMovementPlan, MOVEMENT_PACING } from "./manorNavigation";

const idleCue = {
  eventId: null,
  gesture: "move" as const,
  speechText: null,
  targetPlayerId: null,
  emphasis: 0,
  actionIcon: null,
};

describe("manor navigation", () => {
  it("keeps in-room repositioning on a direct hotspot plan", () => {
    const targetPosition = getRoomSeatPosition("grand-hall", 0, 4);
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "grand-hall",
      toRoomId: "grand-hall",
      currentPosition: {
        x: targetPosition.x - 40,
        y: targetPosition.y - 24,
      },
      targetPosition,
      phaseId: "roam",
      cue: idleCue,
    });

    expect(plan.usesEmbodiedTraversal).toBe(false);
    expect(plan.roomPath).toEqual(["grand-hall"]);
    expect(plan.waypoints).toHaveLength(1);
    expect(plan.waypoints[0]).toMatchObject({
      kind: "hotspot",
      roomId: "grand-hall",
      speedPxPerSecond: MOVEMENT_PACING.roomPxPerSecond,
      pauseMs: MOVEMENT_PACING.taskSettleDelayMs,
    });
  });

  it("routes grand hall to library through a doorway and corridor path", () => {
    const start = getRoomSeatPosition("grand-hall", 0, 4);
    const target = getRoomSeatPosition("library", 0, 3);
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "grand-hall",
      toRoomId: "library",
      currentPosition: start,
      targetPosition: target,
      phaseId: "roam",
      cue: idleCue,
    });

    expect(plan.usesEmbodiedTraversal).toBe(true);
    expect(plan.roomPath).toEqual(["grand-hall", "library"]);
    expect(
      plan.waypoints.some((waypoint) => waypoint.kind === "corridor"),
    ).toBe(true);
    expect(
      plan.waypoints.filter((waypoint) => waypoint.kind === "door-threshold"),
    ).toHaveLength(2);
    expect(plan.waypoints.at(-1)).toMatchObject({
      kind: "hotspot",
      roomId: "library",
    });
  });

  it("finds a multi-room route through surveillance hall into generator room", () => {
    const start = getRoomSeatPosition("library", 0, 2);
    const target = getRoomSeatPosition("generator-room", 0, 2);
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "library",
      toRoomId: "generator-room",
      currentPosition: start,
      targetPosition: target,
      phaseId: "roam",
      cue: idleCue,
    });

    expect(plan.roomPath).toEqual([
      "library",
      "surveillance-hall",
      "generator-room",
    ]);
    expect(
      plan.waypoints.filter((waypoint) => waypoint.kind === "corridor").length,
    ).toBeGreaterThan(1);
  });

  it("uses clue points as approach hotspots when public clue activity is active", () => {
    const target = getRoomSeatPosition("study", 0, 2);
    const room = getRoomRenderData("study");
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "study",
      toRoomId: "study",
      currentPosition: room.focusPoint,
      targetPosition: target,
      phaseId: "roam",
      cue: {
        ...idleCue,
        actionIcon: "clue",
        emphasis: 0.7,
      },
    });

    expect(plan.hotspotPosition).toEqual(room.cluePoint);
    expect(plan.waypoints[0]).toMatchObject({
      x: room.cluePoint.x,
      y: room.cluePoint.y,
    });
  });

  it("routes task work through an approach point before settling on the hotspot", () => {
    const target = getRoomSeatPosition("generator-room", 0, 2);
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "generator-room",
      toRoomId: "generator-room",
      currentPosition: {
        x: target.x - 68,
        y: target.y - 42,
      },
      targetPosition: target,
      phaseId: "roam",
      cue: {
        ...idleCue,
        taskId: "reset-breaker-lattice",
        badgeText: "REPAIR",
      },
    });

    expect(plan.waypoints.map((waypoint) => waypoint.kind)).toEqual([
      "task-approach",
      "hotspot",
    ]);
    expect(plan.hotspotPosition).not.toEqual(target);
  });
});
