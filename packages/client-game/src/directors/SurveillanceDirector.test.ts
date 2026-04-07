import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import type { ClientGameState } from "../types";
import { SurveillanceDirector } from "./SurveillanceDirector";

vi.mock("phaser", () => {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  return {
    default: {
      Math: { Clamp: clamp },
    },
    Math: { Clamp: clamp },
  };
});

const baseSnapshot: MatchSnapshot = {
  matchId: "match-8e",
  phaseId: "report",
  tick: 24,
  config: {
    matchId: "match-8e",
    seed: 8,
    speedProfileId: "showcase",
    playerCount: 2,
    officialPublicMode: true,
    modelPackId: "official-public",
    allowPrivateWhispers: false,
    roomIds: ["library", "study"],
    taskIds: [],
    roleDistribution: {
      shadow: 0,
      investigator: 0,
      steward: 0,
      household: 2,
    },
    timings: {
      castIntroSeconds: 5,
      roamRoundCount: { min: 4, max: 6 },
      roamRoundSeconds: 90,
      discussionSeconds: 70,
      voteSeconds: 15,
      hardCapSeconds: 900,
    },
  },
  players: [
    {
      id: "player-01",
      displayName: "Velvet Host",
      roomId: "library",
      status: "alive",
      connected: true,
      publicImage: {
        credibility: 0.62,
        suspiciousness: 0.18,
      },
      emotion: {
        pleasure: 0.12,
        arousal: 0.28,
        dominance: 0.18,
        label: "calm",
        intensity: 0.32,
        updatedAtTick: 24,
      },
      bodyLanguage: "calm",
      completedTaskCount: 1,
    },
    {
      id: "player-02",
      displayName: "Iron Witness",
      roomId: "study",
      status: "alive",
      connected: true,
      publicImage: {
        credibility: 0.51,
        suspiciousness: 0.3,
      },
      emotion: {
        pleasure: -0.08,
        arousal: 0.34,
        dominance: 0.14,
        label: "shaken",
        intensity: 0.48,
        updatedAtTick: 24,
      },
      bodyLanguage: "shaken",
      completedTaskCount: 0,
    },
  ],
  rooms: [
    {
      roomId: "library",
      lightLevel: "lit",
      doorState: "open",
      occupantIds: ["player-01"],
      taskIds: [],
    },
    {
      roomId: "study",
      lightLevel: "dim",
      doorState: "jammed",
      occupantIds: ["player-02"],
      taskIds: [],
    },
  ],
  tasks: [],
  recentEvents: [
    {
      id: "body-report-1",
      eventId: "body-reported",
      tick: 24,
      phaseId: "report",
      playerId: "player-01",
      targetPlayerId: "player-02",
      roomId: "library",
    },
  ],
};

const runtimeState: ClientGameState = {
  mode: "live",
  status: "connected",
  roomId: "demo",
  actorId: "player-01",
  hello: null,
  privateState: null,
  snapshot: baseSnapshot,
  recentEvents: baseSnapshot.recentEvents,
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
};

describe("SurveillanceDirector", () => {
  it("uses public cast names instead of internal ids in subtitles", () => {
    const director = new SurveillanceDirector();
    const presentation = director.derive({
      scene: "manor-world",
      snapshot: baseSnapshot,
      runtimeState,
      camera: {
        roomId: "library",
        immediate: false,
        reason: "report",
        detail: "Body reports take camera priority.",
      },
    });

    expect(presentation.subtitle?.speakerLabel).toBe("Velvet Host");
    expect(presentation.subtitle?.text).toContain("Velvet Host");
    expect(presentation.subtitle?.text).toContain("Iron Witness");
    expect(presentation.indicatorLabel).toBe(
      "Roaming observation - auto-follow",
    );
  });
});
