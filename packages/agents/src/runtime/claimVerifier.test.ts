import {
  advanceServerTick,
  bootstrapMatch,
  buildReplayLog,
  dispatchAction,
  type EngineBootstrapPlayer,
  type EngineState,
  getDefaultMatchConfig,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PlayerId,
  PrivateObservation,
  RelationshipState,
  RoomId,
} from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import type { AgentDecisionCandidate } from "../model/types";
import { projectVisibleEventSummariesForAgent } from "./AgentObservationProjector";
import { verifyPublicSpeechClaims } from "./claimVerifier";
import { createPrivateObservation } from "./observation";

const relationshipState: RelationshipState = {
  trust: 0.5,
  warmth: 0.5,
  fear: 0,
  respect: 0.5,
  debt: 0,
  grievance: 0,
  suspectScore: 0.5,
  predictedSuspicionOfMe: 0.5,
};

const players = Array.from({ length: 10 }, (_, index) => ({
  id: `agent-${index + 1}` as PlayerId,
  displayName: `Agent ${index + 1}`,
})) satisfies EngineBootstrapPlayer[];

const baseObservation = (
  patch: Partial<PrivateObservation> = {},
): PrivateObservation => ({
  phaseId: "meeting",
  self: {
    id: "agent-1",
    role: "household",
    roomId: "library",
    emotion: {
      pleasure: 0,
      arousal: 0,
      dominance: 0,
      label: "determined",
      intensity: 0.4,
      updatedAtTick: 0,
    },
    publicImage: {
      credibility: 0.5,
      suspiciousness: 0.5,
    },
  },
  visiblePlayers: [
    {
      id: "agent-2",
      roomId: "library",
      state: "calm",
    },
  ],
  visibleEvents: [],
  recentClaims: [],
  allowedFacts: [
    {
      id: "current-room:agent-1",
      kind: "visible-player",
      summary: "You are in library with agent-2.",
      tick: 4,
      playerIds: ["agent-1", "agent-2"],
      roomId: "library",
    },
  ],
  allowedClaims: [],
  topMemories: [],
  relationships: {
    "agent-2": relationshipState,
    "agent-3": relationshipState,
  },
  legalActions: ["press", "reassure"],
  ...patch,
});

const proposal = (
  text: string,
  patch: Partial<AgentActionProposal> = {},
): AgentActionProposal =>
  ({
    actorId: "agent-1",
    phaseId: "meeting",
    confidence: 0.8,
    emotionalIntent: "confident",
    actionId: "press",
    targetPlayerId: "agent-2",
    speech: {
      channel: "meeting",
      tone: "confident",
      text,
    },
    ...patch,
  }) as AgentActionProposal;

const requireValue = <T>(value: T | undefined | null, label: string): T => {
  if (value === undefined || value === null) {
    throw new Error(`Missing ${label}.`);
  }

  return value;
};

const actionBase = (state: EngineState, actorId: PlayerId) => ({
  actorId,
  phaseId: state.phaseId,
  confidence: 0.8,
  emotionalIntent: "confident" as const,
});

const advanceToPhase = (
  state: EngineState,
  targetPhase: EngineState["phaseId"],
) => {
  let nextState = state;

  for (let step = 0; step < 50; step += 1) {
    if (nextState.phaseId === targetPhase) {
      return nextState;
    }

    nextState = advanceServerTick(nextState).state;
  }

  throw new Error(`Failed to reach ${targetPhase}.`);
};

const createRoamState = (seed: number) =>
  advanceToPhase(
    bootstrapMatch(
      {
        ...getDefaultMatchConfig(`claims-${seed}`, seed),
        speedProfileId: "headless-regression",
      },
      players,
    ).state,
    "roam",
  );

const movePlayer = (
  state: EngineState,
  playerId: PlayerId,
  roomId: RoomId | null,
) => {
  const player = requireValue(
    state.players.find((candidate) => candidate.id === playerId),
    playerId,
  );

  player.roomId = roomId;
};

const syncOccupants = (state: EngineState) => {
  for (const room of state.rooms) {
    room.occupantIds = state.players
      .filter(
        (player) => player.status === "alive" && player.roomId === room.roomId,
      )
      .map((player) => player.id);
  }
};

const syncReplayBaseline = (state: EngineState) => {
  const latestFrame = state.replayFrames.at(-1);

  if (!latestFrame) {
    return;
  }

  latestFrame.players = structuredClone(state.players);
  latestFrame.rooms = structuredClone(state.rooms);
  latestFrame.tasks = structuredClone(state.tasks);
};

const observationCandidate = (
  state: EngineState,
  actorId: PlayerId,
): AgentDecisionCandidate => ({
  index: 0,
  label: "Call meeting",
  allowSpeech: false,
  template: {
    ...actionBase(state, actorId),
    actionId: "call-meeting",
    reason: "Claim verifier regression candidate.",
  },
});

describe("claim verifier", () => {
  it("marks a supported same-room alibi as observed", () => {
    const verified = verifyPublicSpeechClaims({
      proposal: proposal("I was with agent-2 in the library."),
      observation: baseObservation(),
    });

    expect(verified.speech?.text).toBe("I was with agent-2 in the library.");
    expect(verified.speech?.publicClaims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "alibi",
          supportLevel: "observed",
          evidenceRefs: expect.arrayContaining([
            expect.objectContaining({ id: "current-room:agent-1" }),
          ]),
        }),
      ]),
    );
  });

  it("softens and flags an unsupported accusation", () => {
    const verified = verifyPublicSpeechClaims({
      proposal: proposal("agent-2 is the shadow."),
      observation: baseObservation({
        allowedFacts: [],
      }),
    });

    expect(verified.speech?.text).toBe(
      "I cannot verify this yet: agent-2 is the shadow.",
    );
    expect(verified.speech?.publicClaims?.[0]).toEqual(
      expect.objectContaining({
        kind: "accusation",
        supportLevel: "unsupported",
        evidenceRefs: [],
      }),
    );
  });

  it("allows an intentional false claim by a shadow as deceptive", () => {
    const verified = verifyPublicSpeechClaims({
      proposal: proposal("agent-2 is the shadow.", {
        actorId: "agent-1",
        emotionalIntent: "evasive",
      }),
      observation: baseObservation({
        self: {
          ...baseObservation().self,
          role: "shadow",
        },
        allowedFacts: [],
      }),
    });

    expect(verified.speech?.text).toBe("agent-2 is the shadow.");
    expect(verified.speech?.publicClaims?.[0]).toEqual(
      expect.objectContaining({
        kind: "accusation",
        supportLevel: "deceptive",
        evidenceRefs: [],
      }),
    );
  });

  it("detects contradictions across two claims by the same speaker", () => {
    const verified = verifyPublicSpeechClaims({
      proposal: proposal("I was in the cellar."),
      observation: baseObservation({
        allowedFacts: [],
        allowedClaims: [
          {
            id: "claim:agent-1:old",
            speakerId: "agent-1",
            summary: "agent-1 said they were in library.",
            tick: 3,
            claimKey: "self-room",
            value: "library",
            supportLevel: "observed",
            evidenceIds: ["current-room:agent-1"],
          },
        ],
      }),
    });

    expect(verified.speech?.publicClaims?.[0]?.contradicts).toEqual([
      expect.objectContaining({
        id: "claim:agent-1:old",
        claimKey: "self-room",
        value: "library",
      }),
    ]);
  });

  it("persists claim metadata through engine replay serialization", () => {
    let state = createRoamState(303);
    const speakerId = requireValue(
      state.players.find((player) => player.team === "household")?.id,
      "speaker",
    );
    const targetId = requireValue(
      state.players.find(
        (player) => player.team === "household" && player.id !== speakerId,
      )?.id,
      "target",
    );

    state = dispatchAction(state, {
      ...actionBase(state, speakerId),
      actionId: "call-meeting",
      reason: "Compare alibis.",
    }).state;

    const observation = createPrivateObservation(
      state,
      speakerId,
      [observationCandidate(state, speakerId)],
      {
        maxVisibleEvents: 12,
        maxRecentClaims: 12,
        maxMemories: 12,
        maxPrivateSummaries: 4,
        maxCandidateActions: 1,
        maxOutputTokens: 400,
        timeoutMs: 1000,
        retryCount: 0,
      },
    );
    const verified = verifyPublicSpeechClaims({
      proposal: proposal("I was with agent-2 in the library.", {
        actorId: speakerId,
        targetPlayerId: targetId,
      }),
      observation,
    });

    state = dispatchAction(state, verified).state;

    const serialized = JSON.stringify(buildReplayLog(state));
    const parsed = JSON.parse(serialized) as ReturnType<typeof buildReplayLog>;
    const speechEvent = parsed.events.find(
      (event) =>
        event.type === "action-recorded" &&
        event.proposal.speech?.publicClaims?.length,
    );

    expect(speechEvent).toEqual(
      expect.objectContaining({
        type: "action-recorded",
        proposal: expect.objectContaining({
          speech: expect.objectContaining({
            publicClaims: expect.arrayContaining([
              expect.objectContaining({ speakerId }),
            ]),
          }),
        }),
      }),
    );
  });

  it("does not receive raw hidden event truth for unsupported speech", () => {
    let state = createRoamState(304);
    const shadowId = requireValue(
      state.players.find((player) => player.role === "shadow")?.id,
      "shadow",
    );
    const victimId = requireValue(
      state.players.find((player) => player.team === "household")?.id,
      "victim",
    );
    const observerId = requireValue(
      state.players.find(
        (player) =>
          player.team === "household" &&
          player.id !== victimId &&
          player.id !== shadowId,
      )?.id,
      "observer",
    );
    const staged = structuredClone(state);

    movePlayer(staged, shadowId, "cellar");
    movePlayer(staged, victimId, "cellar");
    movePlayer(staged, observerId, "library");
    syncOccupants(staged);
    syncReplayBaseline(staged);
    state = dispatchAction(staged, {
      ...actionBase(staged, shadowId),
      actionId: "eliminate",
      targetPlayerId: victimId,
    }).state;

    const observation = createPrivateObservation(
      state,
      observerId,
      [observationCandidate(state, observerId)],
      {
        maxVisibleEvents: 12,
        maxRecentClaims: 12,
        maxMemories: 12,
        maxPrivateSummaries: 4,
        maxCandidateActions: 1,
        maxOutputTokens: 400,
        timeoutMs: 1000,
        retryCount: 0,
      },
    );
    const verified = verifyPublicSpeechClaims({
      proposal: proposal(`${shadowId} eliminated ${victimId} in the cellar.`, {
        actorId: observerId,
        targetPlayerId: shadowId,
      }),
      observation,
    });

    expect(
      observation.allowedFacts.map((fact) => fact.summary).join(" "),
    ).not.toContain(victimId);
    expect(verified.speech?.publicClaims?.[0]?.supportLevel).toBe(
      "unsupported",
    );
    expect(verified.speech?.publicClaims?.[0]?.evidenceRefs).toEqual([]);
  });

  it("keeps meeting speech visible to all live meeting participants", () => {
    let state = createRoamState(305);
    const speakerId = requireValue(
      state.players.find((player) => player.team === "household")?.id,
      "speaker",
    );
    const observerId = requireValue(
      state.players.find(
        (player) => player.team === "household" && player.id !== speakerId,
      )?.id,
      "observer",
    );

    state = dispatchAction(state, {
      ...actionBase(state, speakerId),
      actionId: "call-meeting",
      reason: "I have a timeline.",
    }).state;
    state = dispatchAction(state, {
      ...actionBase(state, speakerId),
      actionId: "press",
      targetPlayerId: observerId,
      speech: {
        channel: "meeting",
        tone: "aggressive",
        text: "I saw a broken alibi near the cellar.",
      },
    }).state;

    expect(
      projectVisibleEventSummariesForAgent(state, observerId).join(" "),
    ).toContain(`${speakerId} said: I saw a broken alibi near the cellar.`);
  });
});
