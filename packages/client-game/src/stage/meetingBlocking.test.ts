import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { MeetingDirector } from "../directors/MeetingDirector";
import { MockMatchConnection } from "../network/mockMatchConnection";
import { createMeetingBlocking } from "./meetingBlocking";

const requireSnapshot = (value: MatchSnapshot | null) => {
  if (!value) {
    throw new Error("Expected snapshot from mock mode.");
  }

  return value;
};

describe("meeting blocking", () => {
  it("preserves the last non-meeting snapshot as the travel origin", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    let snapshot: MatchSnapshot | null = null;

    connection.subscribe((message) => {
      if (message.type === "server.match.snapshot") {
        snapshot = message.match;
      }
    });

    await connection.connect();
    const originSnapshot = requireSnapshot(snapshot);
    const alivePlayers = originSnapshot.players.filter(
      (player) => player.status === "alive",
    );
    const meetingSnapshot = {
      ...originSnapshot,
      phaseId: "meeting",
      recentEvents: [
        {
          id: "body-report-1",
          eventId: "body-reported",
          tick: originSnapshot.tick + 1,
          phaseId: "meeting",
          playerId: alivePlayers[0]?.id ?? "player-01",
          targetPlayerId: alivePlayers[1]?.id ?? "player-02",
          roomId:
            originSnapshot.players.find((player) => player.roomId)?.roomId ??
            "study",
        },
      ],
    } satisfies MatchSnapshot;

    const meetingDirector = new MeetingDirector();
    meetingDirector.track(originSnapshot);
    const meeting = meetingDirector.derive(meetingSnapshot);
    const blocking = createMeetingBlocking(meeting);

    expect(meeting.originSnapshot.tick).toBe(originSnapshot.tick);
    expect(meeting.alarmRoomId).toBe(meetingSnapshot.recentEvents[0]?.roomId);
    expect(blocking.seatPositions.size).toBeGreaterThanOrEqual(
      alivePlayers.length,
    );
    expect(blocking.movementOrigins.size).toBeGreaterThan(0);
    expect(
      [...blocking.travelDurationsMs.values()].every((value) => value >= 0),
    ).toBe(true);

    vi.useRealTimers();
    await connection.disconnect();
  });
});
