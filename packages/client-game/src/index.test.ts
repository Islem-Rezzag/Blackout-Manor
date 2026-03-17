import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { MeetingDirector } from "./directors/MeetingDirector";
import { PhaseDirector } from "./directors/PhaseDirector";
import { MockMatchConnection } from "./network/mockMatchConnection";
import { ReplayMatchConnection } from "./network/replayMatchConnection";
import {
  getRoomSeatPosition,
  MANOR_RENDER_MAP,
  MANOR_ROOM_LAYOUTS,
} from "./tiled/manorLayout";

const requireSnapshot = (value: MatchSnapshot | null) => {
  if (!value) {
    throw new Error("Expected a snapshot from mock mode.");
  }

  return value;
};

describe("client-game package", () => {
  it("generates stable manor room seats inside room bounds", () => {
    const seat = getRoomSeatPosition("grand-hall", 0, 4);
    const room = MANOR_ROOM_LAYOUTS["grand-hall"];

    expect(seat.x).toBeGreaterThan(room.x - room.width / 2);
    expect(seat.x).toBeLessThan(room.x + room.width / 2);
    expect(seat.y).toBeGreaterThan(room.y - room.height / 2);
    expect(seat.y).toBeLessThan(room.y + room.height / 2);
  });

  it("parses the external tiled manor map into render data", () => {
    expect(MANOR_RENDER_MAP.roomOrder).toHaveLength(10);
    expect(MANOR_RENDER_MAP.rooms["grand-hall"].lights.length).toBeGreaterThan(
      0,
    );
    expect(MANOR_RENDER_MAP.rooms.greenhouse.windows.length).toBeGreaterThan(0);
  });

  it("emits hello, private role, and snapshot in mock mode", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    const received: string[] = [];

    connection.subscribe((message) => {
      received.push(message.type);
    });

    await connection.connect();

    expect(received[0]).toBe("server.hello");
    expect(received[1]).toBe("server.match.private-state");
    expect(received[2]).toBe("server.match.snapshot");

    vi.useRealTimers();
    await connection.disconnect();
  });

  it("routes meeting and resolution phases away from the roam scene", () => {
    const director = new PhaseDirector();
    const baseState = {
      mode: "live",
      status: "connected",
      roomId: "fixture-room",
      actorId: "player-01",
      hello: null,
      privateState: null,
      snapshot: null,
      recentEvents: [],
      replay: {
        status: "idle",
        replayId: null,
        matchId: null,
        frames: [],
        totalFrames: 0,
        isComplete: false,
      },
      lastValidationError: null,
      lastErrorMessage: null,
      fpsEstimate: 60,
    } as const;

    expect(
      director.resolveScene(
        {
          ...baseState,
          snapshot: { phaseId: "meeting" },
        } as typeof baseState & { snapshot: { phaseId: "meeting" } },
        null,
      ),
    ).toBe("meeting");
    expect(
      director.resolveScene(
        {
          ...baseState,
          snapshot: { phaseId: "resolution" },
        } as typeof baseState & { snapshot: { phaseId: "resolution" } },
        null,
      ),
    ).toBe("endgame");
  });

  it("stages surviving players into the grand hall during meetings", async () => {
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

    const meetingSnapshot = {
      ...currentSnapshot,
      phaseId: "meeting",
      recentEvents: [
        {
          id: "discussion-1",
          eventId: "discussion-turn",
          tick: currentSnapshot.tick,
          phaseId: "meeting",
          playerId: currentSnapshot.players[0]?.id ?? "player-01",
          targetPlayerId: currentSnapshot.players[1]?.id ?? "player-02",
          text: "Compare the corridor timeline before you vote.",
        },
      ],
    } satisfies MatchSnapshot;

    const presentation = new MeetingDirector().derive(meetingSnapshot);

    expect(presentation.meetingRoomId).toBe("grand-hall");
    expect(
      presentation.stagedSnapshot.players
        .filter((player) => player.status === "alive")
        .every((player) => player.roomId === "grand-hall"),
    ).toBe(true);

    vi.useRealTimers();
    await connection.disconnect();
  });

  it("loads replay mode through the same client connection contract", async () => {
    const replay = parseSavedReplayEnvelope(
      JSON.parse(
        readFileSync(
          resolve(
            __dirname,
            "../../replay-viewer/src/fixtures/highlight-replay.json",
          ),
          "utf8",
        ),
      ),
    );
    const connection = new ReplayMatchConnection({
      mode: "replay",
      replay,
    });
    const received: string[] = [];

    connection.subscribe((message) => {
      received.push(message.type);
    });

    await connection.connect();
    await connection.send({
      type: "client.replay.seek",
      replayId: replay.replay.replayId,
      tick: 2,
    });

    expect(received).toContain("server.hello");
    expect(received).toContain("server.replay.chunk");
    expect(received).toContain("server.match.snapshot");

    await connection.disconnect();
  });
});
