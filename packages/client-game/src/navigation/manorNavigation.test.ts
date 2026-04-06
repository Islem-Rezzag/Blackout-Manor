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

describe("manor navigation pacing", () => {
  it("adds a short settle beat after entering a room", () => {
    const library = getRoomRenderData("library");
    const plan = buildEmbodiedMovementPlan({
      fromRoomId: "library",
      toRoomId: "study",
      currentPosition: getRoomSeatPosition("library", 0, 1),
      targetPosition: getRoomSeatPosition("study", 0, 1),
      phaseId: "roam",
      cue: idleCue,
    });
    const roomEntry = plan.waypoints.find(
      (waypoint) => waypoint.kind === "room-entry",
    );

    expect(roomEntry).toBeDefined();
    expect(roomEntry?.roomId).toBe("study");
    expect(roomEntry?.pauseMs).toBe(MOVEMENT_PACING.roomEntryPauseMs);
    expect(plan.waypoints.at(-1)?.roomId).toBe("study");
    expect(library.roomId).toBe("library");
  });

  it("keeps corridor travel faster than in-room travel while holding thresholds longer", () => {
    expect(MOVEMENT_PACING.hallwayPxPerSecond).toBeGreaterThan(
      MOVEMENT_PACING.roomPxPerSecond,
    );
    expect(MOVEMENT_PACING.thresholdPauseMs).toBeGreaterThan(200);
    expect(MOVEMENT_PACING.taskSettleDelayMs).toBeGreaterThan(
      MOVEMENT_PACING.roomEntryPauseMs,
    );
  });
});
