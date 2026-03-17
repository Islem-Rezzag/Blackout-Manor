import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { MockMatchConnection } from "../network/mockMatchConnection";
import type { ClientGameState } from "../types";
import { CameraDirector } from "./CameraDirector";
import { SurveillanceDirector } from "./SurveillanceDirector";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value)),
    },
  },
}));

const createRuntimeState = (snapshot: MatchSnapshot): ClientGameState => ({
  mode: "mock",
  status: "connected",
  roomId: snapshot.matchId,
  actorId: snapshot.players[0]?.id ?? null,
  hello: null,
  privateState: null,
  snapshot,
  recentEvents: snapshot.recentEvents,
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
});

const loadMockSnapshot = async (): Promise<MatchSnapshot> => {
  vi.useFakeTimers();
  const connection = new MockMatchConnection({ tickMs: 200 });
  let snapshot: MatchSnapshot | null = null;

  connection.subscribe((message) => {
    if (message.type === "server.match.snapshot") {
      snapshot = message.match;
    }
  });

  await connection.connect();
  vi.useRealTimers();
  await connection.disconnect();

  if (!snapshot) {
    throw new Error("Expected mock connection to produce a snapshot.");
  }

  return snapshot;
};

describe("SurveillanceDirector", () => {
  it("builds a compact four-feed surveillance view from authoritative state", async () => {
    const snapshot = await loadMockSnapshot();
    const reportedSnapshot = {
      ...snapshot,
      phaseId: "report",
      recentEvents: [
        {
          id: "event-report",
          eventId: "body-reported",
          tick: snapshot.tick + 1,
          phaseId: "report",
          playerId: snapshot.players[0]?.id ?? "player-01",
          targetPlayerId: snapshot.players[1]?.id ?? "player-02",
          roomId: "cellar",
        },
      ],
    } satisfies MatchSnapshot;
    const runtimeState = createRuntimeState(reportedSnapshot);
    const director = new SurveillanceDirector();

    director.setMode("surveillance");

    const presentation = director.derive({
      scene: "manor-world",
      snapshot: reportedSnapshot,
      runtimeState,
      camera: {
        roomId: "cellar",
        immediate: false,
        reason: "report",
        detail: "Body reports take camera priority",
      },
    });

    expect(presentation.available).toBe(true);
    expect(presentation.mode).toBe("surveillance");
    expect(presentation.selectedRoomId).toBe("cellar");
    expect(presentation.feedRooms).toHaveLength(4);
    expect(presentation.feedRooms[0]?.roomId).toBe("cellar");
    expect(presentation.subtitle?.tone).toBe("alert");
  });

  it("lets surveillance mode override passive roaming camera focus", async () => {
    const snapshot = await loadMockSnapshot();
    const cameraPlan = new CameraDirector().resolvePlan({
      scene: "manor-world",
      runtimeState: createRuntimeState(snapshot),
      snapshot,
      meetingRoomId: null,
      observationMode: "surveillance",
      surveillanceRoomId: "library",
    });

    expect(cameraPlan.roomId).toBe("library");
    expect(cameraPlan.reason).toBe("surveillance");
  });
});
