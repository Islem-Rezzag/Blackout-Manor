import type { EngineEvent } from "@blackout-manor/engine";
import type { AgentActionProposal, PlayerId } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import {
  applySocialReasoningEvents,
  createSocialReasoningSnapshot,
  createSocialReasoningState,
} from "./index";

const playerIds = [
  "agent-01",
  "agent-02",
  "agent-03",
  "agent-04",
] as const satisfies readonly PlayerId[];

const createSeed = () =>
  createSocialReasoningState({
    selfId: "agent-01",
    players: playerIds.map((playerId, index) => ({
      id: playerId,
      displayName: `Agent ${index + 1}`,
    })),
  });

const actionRecorded = (
  sequence: number,
  tick: number,
  proposal: AgentActionProposal,
): EngineEvent => ({
  sequence,
  type: "action-recorded",
  tick,
  proposal,
});

const pressMeeting = (
  actorId: PlayerId,
  targetPlayerId: PlayerId,
  text: string,
): AgentActionProposal => ({
  actorId,
  phaseId: "meeting",
  actionId: "press",
  targetPlayerId,
  confidence: 0.72,
  emotionalIntent: "confident",
  speech: {
    channel: "meeting",
    tone: "aggressive",
    text,
  },
});

const reassureMeeting = (
  actorId: PlayerId,
  targetPlayerId: PlayerId,
  text: string,
): AgentActionProposal => ({
  actorId,
  phaseId: "meeting",
  actionId: "reassure",
  targetPlayerId,
  confidence: 0.72,
  emotionalIntent: "warm",
  speech: {
    channel: "meeting",
    tone: "warm",
    text,
  },
});

const promiseMeeting = (
  actorId: PlayerId,
  targetPlayerId: PlayerId,
  promiseText: string,
  text: string,
): AgentActionProposal => ({
  actorId,
  phaseId: "meeting",
  actionId: "promise",
  targetPlayerId,
  promiseText,
  confidence: 0.72,
  emotionalIntent: "warm",
  speech: {
    channel: "meeting",
    tone: "warm",
    text,
  },
});

const voteProposal = (
  actorId: PlayerId,
  targetPlayerId: PlayerId,
): AgentActionProposal => ({
  actorId,
  phaseId: "vote",
  actionId: "vote-player",
  targetPlayerId,
  confidence: 0.74,
  emotionalIntent: "confident",
});

describe("social reasoning", () => {
  it("detects contradictions when a player changes their story", () => {
    const state = applySocialReasoningEvents(createSeed(), [
      actionRecorded(
        1,
        10,
        pressMeeting(
          "agent-02",
          "agent-03",
          "I was in the library with agent-03.",
        ),
      ),
      actionRecorded(
        2,
        14,
        pressMeeting(
          "agent-02",
          "agent-03",
          "I was in the kitchen with agent-03.",
        ),
      ),
    ]);

    expect(state.contradictions).toHaveLength(1);
    expect(state.contradictions[0]?.playerId).toBe("agent-02");
    expect(state.contradictions[0]?.summary).toContain("library");
    expect(state.contradictions[0]?.summary).toContain("kitchen");
    expect(state.relationships["agent-02"]?.trust).toBeLessThan(0.5);
    expect(state.relationships["agent-02"]?.suspectScore).toBeGreaterThan(0.5);
  });

  it("updates beliefs, promise memory, and compact reflections after meetings and key events", () => {
    const afterMeeting = applySocialReasoningEvents(createSeed(), [
      actionRecorded(
        1,
        20,
        pressMeeting(
          "agent-02",
          "agent-03",
          "I do not trust agent-03. I saw agent-03 in the cellar.",
        ),
      ),
      actionRecorded(
        2,
        21,
        reassureMeeting(
          "agent-04",
          "agent-01",
          "I was with agent-01 in the library. I trust agent-01.",
        ),
      ),
      actionRecorded(
        3,
        22,
        promiseMeeting(
          "agent-04",
          "agent-01",
          "I will back your timeline.",
          "I promise I will back agent-01.",
        ),
      ),
      actionRecorded(4, 23, voteProposal("agent-02", "agent-03")),
    ]);

    expect(afterMeeting.tom["agent-02"]?.likelyBeliefs[0]?.playerId).toBe(
      "agent-03",
    );
    expect(afterMeeting.tom["agent-02"]?.likelyNextAccusationTarget).toBe(
      "agent-03",
    );
    expect(afterMeeting.relationships["agent-04"]?.trust).toBeGreaterThan(0.5);
    expect(afterMeeting.promiseLedger).toHaveLength(1);
    expect(afterMeeting.promiseLedger[0]?.status).toBe("open");

    const afterBetrayal = applySocialReasoningEvents(afterMeeting, [
      actionRecorded(5, 28, voteProposal("agent-04", "agent-01")),
    ]);
    const snapshot = createSocialReasoningSnapshot(afterBetrayal);

    expect(afterBetrayal.promiseLedger[0]?.status).toBe("broken");
    expect(afterBetrayal.betrayals).toHaveLength(1);
    expect(afterBetrayal.relationships["agent-04"]?.trust).toBeLessThan(
      afterMeeting.relationships["agent-04"]?.trust ?? 1,
    );
    expect(snapshot.tomFocus[0]?.playerId).toBe("agent-04");

    for (const summary of Object.values(afterBetrayal.reflection)) {
      expect(summary.length).toBeLessThanOrEqual(160);
    }
  });
});
