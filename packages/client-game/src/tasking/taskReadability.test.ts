import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { MockMatchConnection } from "../network/mockMatchConnection";
import { getRoomRenderData } from "../tiled/manorLayout";
import {
  buildTaskReadabilityPresentation,
  getTaskInteractionGeometry,
} from "./taskReadability";

const requireSnapshot = (value: MatchSnapshot | null) => {
  if (!value) {
    throw new Error("Expected mock connection to emit a snapshot.");
  }

  return value;
};

describe("task readability", () => {
  it("pins task interaction geometry inside its room bounds", () => {
    const geometry = getTaskInteractionGeometry("reset-breaker-lattice");
    const room = getRoomRenderData(geometry.roomId);

    expect(geometry.roomId).toBe("generator-room");
    expect(geometry.hotspotPoint.x).toBeGreaterThan(room.bounds.x);
    expect(geometry.hotspotPoint.x).toBeLessThan(
      room.bounds.x + room.bounds.width,
    );
    expect(geometry.hotspotPoint.y).toBeGreaterThan(room.bounds.y);
    expect(geometry.hotspotPoint.y).toBeLessThan(
      room.bounds.y + room.bounds.height,
    );
  });

  it("derives public player task cues from task state and recent events", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    let snapshot: MatchSnapshot | null = null;

    connection.subscribe((message) => {
      if (message.type === "server.match.snapshot") {
        snapshot = message.match;
      }
    });

    await connection.connect();

    const currentSnapshot = requireSnapshot(snapshot);
    const actorId = currentSnapshot.players[0]?.id ?? "player-01";
    const presentation = buildTaskReadabilityPresentation({
      ...currentSnapshot,
      tasks: currentSnapshot.tasks.map((task) =>
        task.taskId === "reset-breaker-lattice"
          ? {
              ...task,
              status: "in-progress",
              assignedPlayerIds: [actorId],
              progress: 0.58,
            }
          : task,
      ),
      recentEvents: [
        ...currentSnapshot.recentEvents,
        {
          id: "task-progress-1",
          eventId: "task-progressed",
          tick: currentSnapshot.tick,
          phaseId: "roam",
          playerId: actorId,
          taskId: "reset-breaker-lattice",
          roomId: "generator-room",
          progress: 0.58,
        },
      ],
    });

    const node = presentation.nodes.get("reset-breaker-lattice");
    const cue = presentation.playerCues.get(actorId);

    expect(node).toMatchObject({
      tone: "busy",
      status: "in-progress",
      progress: 0.58,
      recentEventType: "task-progressed",
    });
    expect(cue).toMatchObject({
      taskId: "reset-breaker-lattice",
      badgeText: "REPAIR",
      tone: "busy",
    });
    expect(cue?.lookAt).toEqual(node?.lookAtPoint);

    vi.useRealTimers();
    await connection.disconnect();
  });
});
