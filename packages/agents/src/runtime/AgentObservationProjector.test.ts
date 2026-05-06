import {
  advanceServerTick,
  bootstrapMatch,
  dispatchAction,
  type EngineBootstrapPlayer,
  type EngineState,
  getDefaultMatchConfig,
} from "@blackout-manor/engine";
import type { MatchConfig, PlayerId, RoomId } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import type { AgentDecisionCandidate } from "../model/types";
import {
  projectSocialEventsForAgent,
  projectVisibleEventSummariesForAgent,
} from "./AgentObservationProjector";
import { createPrivateObservation } from "./observation";
import { AgentSocialStateStore } from "./socialStateStore";

const players = Array.from({ length: 10 }, (_, index) => ({
  id: `agent-${index + 1}` as PlayerId,
  displayName: `Agent ${index + 1}`,
})) satisfies EngineBootstrapPlayer[];

const createConfig = (seed: number): MatchConfig => ({
  ...getDefaultMatchConfig(`visibility-${seed}`, seed),
  speedProfileId: "headless-regression",
  timings: {
    castIntroSeconds: 1,
    roamRoundCount: { min: 1, max: 1 },
    roamRoundSeconds: 30,
    discussionSeconds: 1,
    voteSeconds: 3,
    hardCapSeconds: 120,
  },
});

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
};

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

const createRoamState = (seed: number) =>
  advanceToPhase(bootstrapMatch(createConfig(seed), players).state, "roam");

const getShadowIds = (state: EngineState) =>
  state.players
    .filter((player) => player.role === "shadow")
    .map((player) => player.id);

const getHouseholdIds = (state: EngineState) =>
  state.players
    .filter((player) => player.team === "household")
    .map((player) => player.id);

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
    reason: "Visibility regression candidate.",
  },
});

describe("AgentObservationProjector", () => {
  it("does not leak hidden eliminations to unrelated agents or social state", () => {
    let state = createRoamState(101);
    const shadowId = requireValue(getShadowIds(state)[0], "shadow");
    const householdIds = getHouseholdIds(state);
    const victimId = requireValue(householdIds[0], "victim");
    const observerId = requireValue(
      householdIds.find((playerId) => playerId !== victimId),
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
    const promptEvents = observation.visibleEvents.join(" ");
    const socialState = new AgentSocialStateStore().inspect(
      state,
      observerId,
    ).state;

    expect(promptEvents).not.toContain("eliminate");
    expect(promptEvents).not.toContain("chose");
    expect(promptEvents).not.toContain(shadowId);
    expect(promptEvents).not.toContain(victimId);
    expect(socialState.relationships[shadowId]?.suspectScore).toBe(0.5);
  });

  it("shows a same-room blackout witness the visible elimination fact without the actor", () => {
    let state = createRoamState(103);
    const shadowId = requireValue(getShadowIds(state)[0], "shadow");
    const householdIds = getHouseholdIds(state);
    const victimId = requireValue(householdIds[0], "victim");
    const witnessId = requireValue(
      householdIds.find((playerId) => playerId !== victimId),
      "witness",
    );

    state = dispatchAction(state, {
      ...actionBase(state, shadowId),
      actionId: "trigger-blackout",
    }).state;

    const staged = structuredClone(state);
    movePlayer(staged, shadowId, "cellar");
    movePlayer(staged, victimId, "cellar");
    movePlayer(staged, witnessId, "cellar");
    syncOccupants(staged);
    syncReplayBaseline(staged);
    state = dispatchAction(staged, {
      ...actionBase(staged, shadowId),
      actionId: "eliminate",
      targetPlayerId: victimId,
    }).state;

    const witnessEvents = projectVisibleEventSummariesForAgent(
      state,
      witnessId,
    );
    const witnessText = witnessEvents.join(" ");

    expect(witnessText).toContain(`${victimId} was eliminated in cellar`);
    expect(witnessText).not.toContain(`You eliminated ${victimId}`);
    expect(witnessText).not.toContain(`${shadowId} eliminated`);
  });

  it("makes meeting speech visible to every live agent in the meeting", () => {
    let state = createRoamState(107);
    const speakerId = requireValue(getHouseholdIds(state)[0], "speaker");
    const observerId = requireValue(
      getHouseholdIds(state).find((playerId) => playerId !== speakerId),
      "observer",
    );
    const targetId = requireValue(
      state.players.find(
        (player) =>
          player.status === "alive" &&
          player.id !== speakerId &&
          player.id !== observerId,
      )?.id,
      "target",
    );

    state = dispatchAction(state, {
      ...actionBase(state, speakerId),
      actionId: "call-meeting",
      reason: "I have a timeline.",
    }).state;
    state = dispatchAction(state, {
      ...actionBase(state, speakerId),
      actionId: "press",
      targetPlayerId: targetId,
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

  it("keeps individual votes private until the public vote resolution", () => {
    let state = createRoamState(109);
    const voterId = requireValue(getHouseholdIds(state)[0], "voter");
    const observerId = requireValue(
      getHouseholdIds(state).find((playerId) => playerId !== voterId),
      "observer",
    );
    const targetId = requireValue(getShadowIds(state)[0], "target");

    state = dispatchAction(state, {
      ...actionBase(state, voterId),
      actionId: "call-meeting",
      reason: "Vote check.",
    }).state;
    state = advanceToPhase(state, "vote");
    state = dispatchAction(state, {
      ...actionBase(state, voterId),
      actionId: "vote-player",
      targetPlayerId: targetId,
    }).state;

    expect(
      projectVisibleEventSummariesForAgent(state, voterId).join(" "),
    ).toContain(`You voted for ${targetId}.`);
    expect(
      projectVisibleEventSummariesForAgent(state, observerId).join(" "),
    ).not.toContain(`${voterId} voted for ${targetId}`);

    for (const playerId of state.players
      .filter(
        (player) =>
          player.status === "alive" &&
          player.id !== voterId &&
          player.id !== observerId,
      )
      .map((player) => player.id)) {
      state = dispatchAction(state, {
        ...actionBase(state, playerId),
        actionId: "skip-vote",
      }).state;
    }

    state = dispatchAction(state, {
      ...actionBase(state, observerId),
      actionId: "skip-vote",
    }).state;

    const resolvedText = projectVisibleEventSummariesForAgent(
      state,
      observerId,
    ).join(" ");

    expect(resolvedText).toContain("Vote resolved:");
    expect(resolvedText).toContain(`${targetId}: 1`);
    expect(resolvedText).not.toContain(`${voterId} voted for ${targetId}`);
  });

  it("does not expose sabotage actor identity unless the actor sees their own action", () => {
    let state = createRoamState(113);
    const shadowId = requireValue(getShadowIds(state)[0], "shadow");
    const observerId = requireValue(getHouseholdIds(state)[0], "observer");

    state = dispatchAction(state, {
      ...actionBase(state, shadowId),
      actionId: "trigger-blackout",
    }).state;

    const observerText = projectVisibleEventSummariesForAgent(
      state,
      observerId,
    ).join(" ");
    const actorText = projectVisibleEventSummariesForAgent(
      state,
      shadowId,
    ).join(" ");

    expect(observerText).toContain("A blackout started.");
    expect(observerText).not.toContain(shadowId);
    expect(projectSocialEventsForAgent(state, observerId)).not.toContainEqual(
      expect.objectContaining({
        type: "action-recorded",
        proposal: expect.objectContaining({ actorId: shadowId }),
      }),
    );
    expect(actorText).toContain("You triggered a blackout.");
  });
});
