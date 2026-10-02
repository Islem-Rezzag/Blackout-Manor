import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import type { MatchSnapshot } from "@blackout-manor/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientGameRuntime } from "../bootstrap/runtime";
import { GameDirector } from "../directors/GameDirector";
import { MockMatchConnection } from "../network/mockMatchConnection";
import { createMeetingSeatMap } from "../stage/seatResolvers";
import { getRoomRenderData } from "../tiled/manorLayout";
import { derivePublicActivity } from "../ui/publicActivity";
import { getDemoPhase } from "./demoTimeline";
import {
  deriveSessionPresentation,
  formatSessionTime,
} from "./sessionPresentation";

afterEach(() => vi.useRealTimers());

vi.mock("phaser", () => ({
  Math: {
    Clamp: (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value)),
  },
}));

const connectDemo = async () => {
  const runtime = new ClientGameRuntime({
    connection: { mode: "mock", seed: 17 },
  });
  await runtime.start();
  return runtime;
};

const snapshotOf = (runtime: ClientGameRuntime): MatchSnapshot => {
  const snapshot = runtime.getState().snapshot;
  if (!snapshot) throw new Error("Expected demo snapshot");
  return snapshot;
};

describe("spectator session", () => {
  it("boots at tick zero, lets the viewer start, pause and step, and cleans up", async () => {
    vi.useFakeTimers();
    const runtime = await connectDemo();
    vi.advanceTimersByTime(60_000);
    expect(snapshotOf(runtime).tick).toBe(0);
    runtime.localPlayback?.play();
    vi.advanceTimersByTime(2400);
    expect(snapshotOf(runtime).tick).toBe(1);
    runtime.localPlayback?.pause();
    vi.advanceTimersByTime(60_000);
    expect(snapshotOf(runtime).tick).toBe(1);
    runtime.localPlayback?.step();
    expect(snapshotOf(runtime).tick).toBe(2);
    await runtime.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("produces identical public snapshots at every tick under automatic and manual playback", async () => {
    vi.useFakeTimers();
    const automatic = new MockMatchConnection({ seed: 17, tickMs: 20 });
    const manual = new MockMatchConnection({
      seed: 17,
      tickMs: 20,
      autoPlay: false,
    });
    const collect = (connection: MockMatchConnection) => {
      const frames: MatchSnapshot[] = [];
      connection.subscribe((message) => {
        if (message.type === "server.match.snapshot")
          frames.push(message.match);
      });
      return frames;
    };
    const autoFrames = collect(automatic);
    const manualFrames = collect(manual);
    await automatic.connect();
    await manual.connect();
    manual.localPlayback.play();
    manual.localPlayback.pause();
    for (let tick = 1; tick <= 56; tick += 1) {
      vi.advanceTimersByTime(20);
      manual.localPlayback.step();
      expect(manualFrames[tick]).toEqual(autoFrames[tick]);
      expect(autoFrames[tick]?.phaseId).toBe(getDemoPhase(tick).phase);
    }
    await automatic.disconnect();
    await manual.disconnect();
  });

  it("follows a public guest across rooms, releases focus manually and yields to meetings", async () => {
    vi.useFakeTimers();
    const runtime = await connectDemo();
    const director = new GameDirector(runtime, null);
    director.followPlayer("player-01");
    expect(director.getState().inspection.label).toContain("Following");
    runtime.localPlayback?.play();
    runtime.localPlayback?.pause();
    for (let tick = 1; tick <= 8; tick += 1) {
      runtime.localPlayback?.step();
      expect(director.getState().inspection.roomId).toBe(
        snapshotOf(runtime).players[0]?.roomId,
      );
    }
    director.inspectRoom("library");
    expect(director.getState().followedPlayerId).toBeNull();
    expect(director.getState().inspection.roomId).toBe("library");
    director.followPlayer("player-01");
    for (let tick = 9; tick <= 16; tick += 1) runtime.localPlayback?.step();
    expect(director.getState().activeScene).toBe("meeting");
    expect(director.getState().camera.reason).toBe("meeting");
    expect(director.getState().inspection.label).not.toContain("Following");
    await runtime.destroy();
  });

  it("exposes demo timing without inventing authoritative live countdowns or control permissions", async () => {
    const runtime = await connectDemo();
    const snapshot = snapshotOf(runtime);
    const demo = deriveSessionPresentation({
      mode: "mock",
      snapshot,
      demo: { status: "playing", speed: 0.5, tickMs: 1200, tickFraction: 0.5 },
    });
    expect(demo.clock).toBe("00:00");
    expect(demo.detail).toBe("Next phase in 00:04");
    expect(demo.phaseProgress).toBe(0.25);
    const live = deriveSessionPresentation({
      mode: "live",
      snapshot,
      demo: { status: "playing", speed: 0.5, tickMs: 1200, tickFraction: 0.5 },
    });
    expect(live.canControl).toBe(false);
    expect(live.phaseProgress).toBeNull();
    expect(live.clockLabel).toBe("Server tick");
    expect(formatSessionTime(125_000)).toBe("02:05");
    await runtime.destroy();
  });

  it("keeps one meeting entrance across public turns, with distinct cast positions", async () => {
    vi.useFakeTimers();
    const runtime = await connectDemo();
    const director = new GameDirector(runtime, null);
    runtime.localPlayback?.play();
    runtime.localPlayback?.pause();
    for (let tick = 1; tick <= 16; tick += 1) runtime.localPlayback?.step();
    const meeting = director.getState().meeting;
    expect(meeting).not.toBeNull();
    if (!meeting) throw new Error("Expected meeting");
    const seats = [
      ...createMeetingSeatMap(
        meeting.stagedSnapshot.players,
        "grand-hall",
        "meeting",
        null,
      ).values(),
    ];
    expect(seats).toHaveLength(10);
    const hall = getRoomRenderData("grand-hall");
    for (const seat of seats) {
      expect(seat.y).toBeGreaterThan(hall.bounds.y + hall.height / 2);
      expect(seat.y).toBeLessThan(hall.bounds.y + hall.height * 0.9);
    }
    for (let index = 0; index < seats.length; index += 1) {
      for (const other of seats.slice(index + 1)) {
        const seat = seats[index];
        if (!seat) continue;
        expect(Math.hypot(seat.x - other.x, seat.y - other.y)).toBeGreaterThan(
          50,
        );
      }
    }
    for (let tick = 17; tick <= 25; tick += 1) {
      runtime.localPlayback?.step();
      expect(director.getState().meeting?.sequenceId).toBe(meeting.sequenceId);
      expect(director.getState().meeting?.originSnapshot).toEqual(
        meeting.originSnapshot,
      );
    }
    for (let tick = 26; tick <= 44; tick += 1) runtime.localPlayback?.step();
    expect(director.getState().meeting?.sequenceId).not.toBe(
      meeting.sequenceId,
    );
    await runtime.destroy();
  });

  it("keeps the replay cursor when stepping and ignores unrelated FPS updates", async () => {
    const replay = parseSavedReplayEnvelope(
      JSON.parse(
        readFileSync(
          resolve(
            __dirname,
            "../../../replay-viewer/src/fixtures/highlight-replay.json",
          ),
          "utf8",
        ),
      ),
    );
    const runtime = new ClientGameRuntime({
      connection: { mode: "replay", replay },
    });
    await runtime.start();
    const director = new GameDirector(runtime, replay);
    director.stepReplay(1);
    expect(director.getState().replay?.frameIndex).toBe(1);
    runtime.setFpsEstimate(55);
    expect(director.getState().replay?.frameIndex).toBe(1);
    await runtime.seekReplay(replay.replay.replayId, snapshotOf(runtime).tick);
    expect(director.getState().replay?.frameIndex).toBe(0);
    director.stepReplay(1);
    director.jumpReplay(0);
    expect(director.getState().replay?.frameIndex).toBe(0);
    await runtime.destroy();
  });

  it("only formats explicitly public events, never hidden roles or raw event payloads", async () => {
    const runtime = await connectDemo();
    const snapshot = snapshotOf(runtime);
    const events = [
      {
        id: "public",
        eventId: "phase-changed",
        tick: 2,
        phaseId: "roam",
        fromPhaseId: "intro",
        toPhaseId: "roam",
      },
      {
        id: "private",
        eventId: "roles-assigned",
        tick: 0,
        phaseId: "intro",
        roles: { "player-01": "shadow" },
      },
    ] as MatchSnapshot["recentEvents"];
    expect(derivePublicActivity({ ...snapshot, recentEvents: events })).toEqual(
      [{ id: "public", tick: 2, text: "Explore begins" }],
    );
    await runtime.destroy();
  });
});
