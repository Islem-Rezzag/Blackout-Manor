import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  AgentActionProposalSchema,
  ClientMessageSchema,
  DEFAULT_TIMINGS,
  deserializeReplayEnvelope,
  HealthcheckResponseSchema,
  LobbySnapshotSchema,
  MatchConfigSchema,
  MatchEventSchema,
  MatchPrivateStateSchema,
  MatchSnapshotSchema,
  MemoryEventSchema,
  ModelDecisionOutputSchema,
  OFFICIAL_V1_CAST,
  PlayerStateSchema,
  PrivateObservationSchema,
  PublicPlayerStateSchema,
  parseEnv,
  RelationshipStateSchema,
  ReplayEnvelopeSchema,
  ReplayFrameSchema,
  RoomStateSchema,
  ServerMessageSchema,
  serializeReplayEnvelope,
  TaskDefinitionSchema,
  TaskStateSchema,
} from "./index";

const emotionState = {
  pleasure: 0.15,
  arousal: 0.35,
  dominance: -0.1,
  label: "suspicious",
  intensity: 0.65,
  updatedAtTick: 12,
} as const;

const relationshipState = {
  trust: 0.58,
  warmth: 0.44,
  fear: 0.12,
  respect: 0.63,
  debt: 0.21,
  grievance: 0.18,
  suspectScore: 0.49,
  predictedSuspicionOfMe: 0.33,
} as const;

const memoryEvent = {
  id: "memory-1",
  tick: 11,
  category: "witness",
  summary: "Saw agent-b leaving the cellar during the blackout.",
  roomId: "cellar",
  playersInvolved: ["agent-a", "agent-b"],
  emotionTag: "shaken",
  salience: 0.92,
  evidenceStrength: 0.72,
} as const;

const taskDefinition = {
  id: "reset-breaker-lattice",
  label: "Reset breaker lattice",
  roomId: "generator-room",
  kind: "solo",
  evidenceTags: ["repair", "power", "generator"],
} as const;

const taskState = {
  taskId: "reset-breaker-lattice",
  roomId: "generator-room",
  kind: "solo",
  status: "in-progress",
  assignedPlayerIds: ["agent-a"],
  progress: 0.6,
} as const;

const roomState = {
  roomId: "generator-room",
  lightLevel: "dim",
  doorState: "open",
  occupantIds: ["agent-a", "agent-b"],
  taskIds: ["reset-breaker-lattice"],
} as const;

const publicPlayerState = {
  id: "agent-a",
  displayName: "Agent A",
  roomId: "generator-room",
  status: "alive",
  connected: true,
  publicImage: {
    credibility: 0.67,
    suspiciousness: 0.28,
  },
  emotion: emotionState,
  bodyLanguage: "agitated",
  completedTaskCount: 2,
} as const;

const playerState = {
  id: "agent-a",
  displayName: "Agent A",
  roomId: "generator-room",
  status: "alive",
  connected: true,
  publicImage: {
    credibility: 0.67,
    suspiciousness: 0.28,
  },
  emotion: emotionState,
  role: "household",
  team: "household",
  isBot: true,
  completedTaskIds: ["wind-grandfather-clock", "tune-police-band-radio"],
  activeTaskId: "reset-breaker-lattice",
  relationships: {
    "agent-b": relationshipState,
  },
  memories: [memoryEvent],
  lastActionId: "continue-task",
} as const;

const matchConfig = {
  matchId: "match-1",
  seed: 42,
  speedProfileId: "showcase",
  playerCount: 10,
  officialPublicMode: true,
  modelPackId: "official-season-1",
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
  taskIds: [
    "reset-breaker-lattice",
    "file-guest-ledger",
    "rewind-corridor-film",
    "rebalance-greenhouse-valves",
  ],
  roleDistribution: OFFICIAL_V1_CAST,
  timings: DEFAULT_TIMINGS.showcase,
} as const;

const phaseChangedEvent = {
  id: "event-1",
  eventId: "phase-changed",
  tick: 12,
  phaseId: "meeting",
  fromPhaseId: "roam",
  toPhaseId: "meeting",
} as const;

const replayFrame = {
  tick: 12,
  phaseId: "meeting",
  events: [phaseChangedEvent],
  players: [publicPlayerState],
  rooms: [roomState],
  tasks: [taskState],
} as const;

const matchSnapshot = {
  matchId: "match-1",
  phaseId: "meeting",
  tick: 12,
  config: matchConfig,
  players: [publicPlayerState],
  rooms: [roomState],
  tasks: [taskState],
  recentEvents: [phaseChangedEvent],
} as const;

const matchPrivateState = {
  playerId: "agent-a",
  role: "steward",
  team: "household",
  knownAllyPlayerIds: [],
  revealedAtTick: 0,
} as const;

const replayEnvelope = {
  protocolVersion: "1.0.0",
  replayId: "replay-1",
  matchId: "match-1",
  seed: 42,
  createdAt: "2026-03-14T12:00:00.000Z",
  config: matchConfig,
  frames: [replayFrame],
} as const;

const privateObservation = {
  phaseId: "roam",
  self: {
    id: "agent-a",
    role: "household",
    roomId: "generator-room",
    emotion: emotionState,
    publicImage: {
      credibility: 0.67,
      suspiciousness: 0.28,
    },
  },
  visiblePlayers: [
    {
      id: "agent-b",
      roomId: "generator-room",
      state: "agitated",
    },
  ],
  visibleEvents: ["The breaker lattice sparked twice."],
  recentClaims: ["Agent B said they were alone in the cellar."],
  topMemories: [memoryEvent],
  relationships: {
    "agent-b": relationshipState,
  },
  legalActions: ["move", "continue-task", "comfort"],
} as const;

const actionSamples = [
  {
    actorId: "agent-a",
    phaseId: "roam",
    confidence: 0.75,
    emotionalIntent: "confident",
    actionId: "move",
    targetRoomId: "library",
  },
  {
    actorId: "agent-a",
    phaseId: "roam",
    confidence: 0.8,
    emotionalIntent: "calm",
    actionId: "start-task",
    taskId: "reset-breaker-lattice",
  },
  {
    actorId: "agent-a",
    phaseId: "roam",
    confidence: 0.82,
    emotionalIntent: "calm",
    actionId: "continue-task",
    taskId: "reset-breaker-lattice",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.61,
    emotionalIntent: "warm",
    actionId: "comfort",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.6,
    emotionalIntent: "warm",
    actionId: "reassure",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.72,
    emotionalIntent: "aggressive",
    actionId: "press",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.66,
    emotionalIntent: "warm",
    actionId: "promise",
    targetPlayerId: "agent-b",
    promiseText: "I will back your timeline in the vote.",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.59,
    emotionalIntent: "defensive",
    actionId: "apologize",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.55,
    emotionalIntent: "evasive",
    actionId: "confide",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "roam",
    confidence: 0.99,
    emotionalIntent: "defensive",
    actionId: "report-body",
    discoveredPlayerId: "agent-c",
  },
  {
    actorId: "agent-a",
    phaseId: "meeting",
    confidence: 0.78,
    emotionalIntent: "confident",
    actionId: "call-meeting",
    reason: "We need to compare the blackout timeline.",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.88,
    emotionalIntent: "evasive",
    actionId: "eliminate",
    targetPlayerId: "agent-c",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.74,
    emotionalIntent: "confident",
    actionId: "trigger-blackout",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.69,
    emotionalIntent: "evasive",
    actionId: "jam-door",
    targetRoomId: "cellar",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.63,
    emotionalIntent: "evasive",
    actionId: "loop-cameras",
    targetRoomId: "surveillance-hall",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.64,
    emotionalIntent: "evasive",
    actionId: "forge-ledger-entry",
    taskId: "file-guest-ledger",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.67,
    emotionalIntent: "evasive",
    actionId: "plant-false-clue",
    targetRoomId: "study",
    clueId: "clue-1",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.57,
    emotionalIntent: "evasive",
    actionId: "mimic-task-audio",
    taskId: "reset-breaker-lattice",
  },
  {
    actorId: "agent-shadow",
    phaseId: "roam",
    confidence: 0.58,
    emotionalIntent: "evasive",
    actionId: "delay-two-person-task",
    taskId: "carry-coal-to-the-boiler",
  },
  {
    actorId: "agent-investigator",
    phaseId: "roam",
    confidence: 0.84,
    emotionalIntent: "calm",
    actionId: "dust-room",
    targetRoomId: "cellar",
  },
  {
    actorId: "agent-investigator",
    phaseId: "roam",
    confidence: 0.77,
    emotionalIntent: "calm",
    actionId: "recover-clue",
    targetRoomId: "cellar",
  },
  {
    actorId: "agent-investigator",
    phaseId: "meeting",
    confidence: 0.8,
    emotionalIntent: "confident",
    actionId: "compare-clue-fragments",
    firstClueId: "clue-1",
    secondClueId: "clue-2",
  },
  {
    actorId: "agent-investigator",
    phaseId: "meeting",
    confidence: 0.79,
    emotionalIntent: "calm",
    actionId: "ask-forensic-question",
    question: "Which corridor was the killer most likely using?",
  },
  {
    actorId: "agent-steward",
    phaseId: "roam",
    confidence: 0.71,
    emotionalIntent: "warm",
    actionId: "escort-player",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-steward",
    phaseId: "roam",
    confidence: 0.7,
    emotionalIntent: "confident",
    actionId: "seal-room",
    targetRoomId: "study",
  },
  {
    actorId: "agent-steward",
    phaseId: "roam",
    confidence: 0.68,
    emotionalIntent: "confident",
    actionId: "unlock-service-passage",
  },
  {
    actorId: "agent-a",
    phaseId: "vote",
    confidence: 0.83,
    emotionalIntent: "confident",
    actionId: "vote-player",
    targetPlayerId: "agent-b",
  },
  {
    actorId: "agent-a",
    phaseId: "vote",
    confidence: 0.51,
    emotionalIntent: "calm",
    actionId: "skip-vote",
  },
] as const;

const eventSamples = [
  phaseChangedEvent,
  {
    id: "event-2",
    eventId: "task-progressed",
    tick: 9,
    phaseId: "roam",
    playerId: "agent-a",
    taskId: "reset-breaker-lattice",
    roomId: "generator-room",
    progress: 0.5,
  },
  {
    id: "event-3",
    eventId: "task-completed",
    tick: 10,
    phaseId: "roam",
    playerId: "agent-a",
    taskId: "reset-breaker-lattice",
    roomId: "generator-room",
  },
  {
    id: "event-4",
    eventId: "sabotage-triggered",
    tick: 10,
    phaseId: "roam",
    playerId: "agent-shadow",
    actionId: "trigger-blackout",
    roomId: "generator-room",
  },
  {
    id: "event-5",
    eventId: "player-eliminated",
    tick: 11,
    phaseId: "roam",
    playerId: "agent-shadow",
    targetPlayerId: "agent-c",
    roomId: "cellar",
  },
  {
    id: "event-6",
    eventId: "body-reported",
    tick: 12,
    phaseId: "meeting",
    playerId: "agent-a",
    targetPlayerId: "agent-c",
    roomId: "cellar",
  },
  {
    id: "event-7",
    eventId: "meeting-called",
    tick: 12,
    phaseId: "meeting",
    playerId: "agent-a",
    reason: "Compare blackout alibis.",
  },
  {
    id: "event-8",
    eventId: "discussion-turn",
    tick: 13,
    phaseId: "meeting",
    playerId: "agent-a",
    text: "I saw agent-b leave the cellar before lights returned.",
    targetPlayerId: "agent-b",
  },
  {
    id: "event-9",
    eventId: "vote-cast",
    tick: 14,
    phaseId: "vote",
    playerId: "agent-a",
    targetPlayerId: "agent-b",
  },
  {
    id: "event-10",
    eventId: "player-exiled",
    tick: 15,
    phaseId: "resolution",
    playerId: "agent-b",
  },
  {
    id: "event-11",
    eventId: "clue-discovered",
    tick: 12,
    phaseId: "meeting",
    playerId: "agent-investigator",
    clueId: "clue-1",
    roomId: "cellar",
  },
  {
    id: "event-12",
    eventId: "relationship-updated",
    tick: 13,
    phaseId: "meeting",
    sourcePlayerId: "agent-a",
    targetPlayerId: "agent-b",
    relationship: relationshipState,
  },
  {
    id: "event-13",
    eventId: "emotion-shifted",
    tick: 13,
    phaseId: "meeting",
    playerId: "agent-a",
    emotion: emotionState,
  },
] as const;

describe("shared package", () => {
  it("keeps the official cast at ten players", () => {
    const totalPlayers = Object.values(OFFICIAL_V1_CAST).reduce(
      (sum, count) => sum + count,
      0,
    );

    expect(totalPlayers).toBe(10);
  });

  it("parses env inputs through zod", () => {
    const env = parseEnv(z.object({ APP_NAME: z.string() }), {
      APP_NAME: "Blackout Manor",
    });

    expect(env.APP_NAME).toBe("Blackout Manor");
  });

  it("round-trips core entity schemas", () => {
    const entitySamples = [
      [TaskDefinitionSchema, taskDefinition],
      [TaskStateSchema, taskState],
      [RoomStateSchema, roomState],
      [RelationshipStateSchema, relationshipState],
      [MemoryEventSchema, memoryEvent],
      [PublicPlayerStateSchema, publicPlayerState],
      [PlayerStateSchema, playerState],
      [MatchConfigSchema, matchConfig],
      [
        LobbySnapshotSchema,
        {
          roomChannelId: "lobby",
          playerCount: 4,
          capacity: 10,
          readyPlayerIds: ["agent-a", "agent-b"],
        },
      ],
      [PrivateObservationSchema, privateObservation],
      [MatchPrivateStateSchema, matchPrivateState],
      [MatchSnapshotSchema, matchSnapshot],
      [ReplayFrameSchema, replayFrame],
      [ReplayEnvelopeSchema, replayEnvelope],
      [
        HealthcheckResponseSchema,
        {
          name: "blackout-manor-server",
          status: "ok",
          protocolVersion: "1.0.0",
        },
      ],
    ] as const;

    for (const [schema, sample] of entitySamples) {
      const roundTripped = schema.parse(JSON.parse(JSON.stringify(sample)));

      expect(roundTripped).toEqual(sample);
    }
  });

  it("round-trips all action proposal variants", () => {
    for (const sample of actionSamples) {
      const parsed = AgentActionProposalSchema.parse(
        JSON.parse(JSON.stringify(sample)),
      );
      const modelOutput = ModelDecisionOutputSchema.parse(parsed);

      expect(modelOutput).toEqual(sample);
    }
  });

  it("round-trips all match event variants", () => {
    for (const sample of eventSamples) {
      const parsed = MatchEventSchema.parse(JSON.parse(JSON.stringify(sample)));

      expect(parsed).toEqual(sample);
    }
  });

  it("round-trips protocol messages and replay serialization", () => {
    const clientMessages = [
      {
        type: "client.ping",
        timestamp: "2026-03-14T12:00:00.000Z",
      },
      {
        type: "client.lobby.set-ready",
        playerId: "agent-a",
        ready: true,
      },
      {
        type: "client.match.propose-action",
        matchId: "match-1",
        proposal: actionSamples[0],
      },
      {
        type: "client.replay.request",
        replayId: "replay-1",
      },
      {
        type: "client.replay.seek",
        replayId: "replay-1",
        tick: 12,
      },
    ] as const;

    const serverMessages = [
      {
        type: "server.hello",
        protocolVersion: "1.0.0",
        serverTime: "2026-03-14T12:00:00.000Z",
        roomChannelId: "match",
      },
      {
        type: "server.pong",
        timestamp: "2026-03-14T12:00:01.000Z",
      },
      {
        type: "server.lobby.snapshot",
        lobby: {
          roomChannelId: "lobby",
          playerCount: 4,
          capacity: 10,
          readyPlayerIds: ["agent-a", "agent-b"],
        },
      },
      {
        type: "server.match.snapshot",
        match: matchSnapshot,
      },
      {
        type: "server.match.private-state",
        matchId: "match-1",
        privateState: matchPrivateState,
      },
      {
        type: "server.match.event",
        matchId: "match-1",
        event: eventSamples[0],
      },
      {
        type: "server.replay.chunk",
        replayId: "replay-1",
        matchId: "match-1",
        startIndex: 0,
        totalFrames: 1,
        isFinalChunk: true,
        frames: [replayFrame],
      },
      {
        type: "server.validation-error",
        code: "INVALID_ACTION",
        message: "Action proposal failed validation.",
        issues: ["targetRoomId must be one of the known room IDs."],
      },
      {
        type: "server.healthcheck",
        payload: {
          name: "blackout-manor-server",
          status: "ok",
          protocolVersion: "1.0.0",
        },
      },
    ] as const;

    for (const message of clientMessages) {
      expect(
        ClientMessageSchema.parse(JSON.parse(JSON.stringify(message))),
      ).toEqual(message);
    }

    for (const message of serverMessages) {
      expect(
        ServerMessageSchema.parse(JSON.parse(JSON.stringify(message))),
      ).toEqual(message);
    }

    const serializedReplay = serializeReplayEnvelope(replayEnvelope);
    const deserializedReplay = deserializeReplayEnvelope(serializedReplay);

    expect(deserializedReplay).toEqual(replayEnvelope);
  });

  it("rejects illegal actions and malformed network payloads", () => {
    const invalidMove = {
      actorId: "agent-a",
      phaseId: "roam",
      confidence: 0.9,
      emotionalIntent: "confident",
      actionId: "move",
      targetRoomId: "attic",
    };

    const invalidVote = {
      actorId: "agent-a",
      phaseId: "vote",
      confidence: 0.7,
      emotionalIntent: "confident",
      actionId: "vote-player",
    };

    const malformedActionMessage = {
      type: "client.match.propose-action",
      matchId: "match-1",
      proposal: invalidVote,
    };

    expect(AgentActionProposalSchema.safeParse(invalidMove).success).toBe(
      false,
    );
    expect(AgentActionProposalSchema.safeParse(invalidVote).success).toBe(
      false,
    );
    expect(ClientMessageSchema.safeParse(malformedActionMessage).success).toBe(
      false,
    );
  });
});
