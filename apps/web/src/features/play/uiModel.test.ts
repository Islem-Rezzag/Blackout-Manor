import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ClientGameState } from "@blackout-manor/client-game";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import { describe, expect, it } from "vitest";

import {
  buildContradictionMarkers,
  createPromiseLedger,
  deriveLiveUiModel,
  deriveReplayUiModel,
  readPlayShellConfig,
} from "./uiModel";

const createState = (
  overrides?: Partial<ClientGameState>,
): ClientGameState => ({
  mode: "mock",
  status: "connected",
  roomId: "mock-manor-room",
  actorId: "agent-a",
  hello: null,
  privateState: {
    playerId: "agent-a",
    role: "steward",
    team: "household",
    knownAllyPlayerIds: [],
    revealedAtTick: 0,
  },
  snapshot: {
    matchId: "match-1",
    phaseId: "meeting",
    tick: 8,
    config: {
      matchId: "match-1",
      seed: 7,
      speedProfileId: "showcase",
      playerCount: 10,
      officialPublicMode: true,
      modelPackId: "official-pack",
      allowPrivateWhispers: true,
      roomIds: [
        "grand-hall",
        "library",
        "study",
        "kitchen",
        "ballroom",
        "greenhouse",
        "generator-room",
        "surveillance-hall",
        "cellar",
        "servants-corridor",
      ],
      taskIds: ["wind-grandfather-clock"],
      roleDistribution: {
        shadow: 2,
        investigator: 1,
        steward: 1,
        household: 6,
      },
      timings: {
        castIntroSeconds: 5,
        roamRoundCount: { min: 4, max: 6 },
        roamRoundSeconds: 90,
        discussionSeconds: 70,
        voteSeconds: 15,
        hardCapSeconds: 1680,
      },
    },
    players: [
      {
        id: "agent-a",
        displayName: "Agent A",
        roomId: "grand-hall",
        status: "alive",
        connected: true,
        publicImage: { credibility: 0.7, suspiciousness: 0.2 },
        emotion: {
          pleasure: 0.2,
          arousal: 0.4,
          dominance: 0.1,
          label: "calm",
          intensity: 0.3,
          updatedAtTick: 8,
        },
        bodyLanguage: "calm",
        completedTaskCount: 1,
      },
      {
        id: "agent-b",
        displayName: "Agent B",
        roomId: "library",
        status: "alive",
        connected: true,
        publicImage: { credibility: 0.4, suspiciousness: 0.73 },
        emotion: {
          pleasure: -0.2,
          arousal: 0.8,
          dominance: -0.1,
          label: "shaken",
          intensity: 0.72,
          updatedAtTick: 8,
        },
        bodyLanguage: "agitated",
        completedTaskCount: 0,
      },
    ],
    rooms: [
      {
        roomId: "grand-hall",
        lightLevel: "lit",
        doorState: "open",
        occupantIds: ["agent-a"],
        taskIds: ["wind-grandfather-clock"],
      },
      {
        roomId: "library",
        lightLevel: "blackout",
        doorState: "jammed",
        occupantIds: ["agent-b"],
        taskIds: [],
      },
    ],
    tasks: [
      {
        taskId: "wind-grandfather-clock",
        roomId: "grand-hall",
        kind: "solo",
        status: "completed",
        assignedPlayerIds: ["agent-a"],
        progress: 1,
      },
    ],
    recentEvents: [
      {
        id: "phase-1",
        eventId: "phase-changed",
        tick: 6,
        phaseId: "meeting",
        fromPhaseId: "report",
        toPhaseId: "meeting",
      },
      {
        id: "discussion-1",
        eventId: "discussion-turn",
        tick: 7,
        phaseId: "meeting",
        playerId: "agent-b",
        text: "I want Agent A watched closely.",
        targetPlayerId: "agent-a",
      },
      {
        id: "discussion-2",
        eventId: "discussion-turn",
        tick: 8,
        phaseId: "meeting",
        playerId: "agent-b",
        text: "Actually compare Agent C first.",
        targetPlayerId: "agent-c",
      },
    ],
  },
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
  ...overrides,
});

describe("play ui model", () => {
  it("hides analytics in player mode", () => {
    const model = deriveLiveUiModel(createState(), "player");

    expect(model.analyticsUnlocked).toBe(false);
    expect(model.roleReveal).toBeNull();
  });

  it("flags contradiction markers from changing accusation targets", () => {
    const state = createState();
    const markers = buildContradictionMarkers(
      state.snapshot?.recentEvents ?? [],
      state.snapshot,
    );

    expect(markers).toHaveLength(1);
    expect(markers[0]?.playerId).toBe("agent-b");
  });

  it("resolves player, spectator, and replay shell modes from query params", () => {
    expect(
      readPlayShellConfig(
        {
          defaultMode: "mock",
          defaultServerUrl: "ws://127.0.0.1:2567",
          defaultRoomId: "room-1",
          defaultActorId: "agent-a",
        },
        "?view=replay",
      ).surfaceMode,
    ).toBe("replay");

    expect(
      readPlayShellConfig(
        {
          defaultMode: "mock",
          defaultServerUrl: "ws://127.0.0.1:2567",
          defaultRoomId: "room-1",
          defaultActorId: "agent-a",
        },
        "?view=spectator",
      ).surfaceMode,
    ).toBe("spectator");
  });

  it("builds replay analytics and a promise ledger from the saved replay", () => {
    const replay = parseSavedReplayEnvelope(
      JSON.parse(
        readFileSync(
          resolve(
            __dirname,
            "../../../../../packages/replay-viewer/src/fixtures/highlight-replay.json",
          ),
          "utf8",
        ),
      ),
    );
    const model = deriveReplayUiModel(replay, 0);
    const ledger = createPromiseLedger(replay);

    expect(model.highlightMarkers.length).toBeGreaterThan(0);
    expect(model.trustSeries.length).toBe(replay.replay.frames.length);
    expect(ledger.some((entry) => entry.status === "broken")).toBe(true);
  });
});
