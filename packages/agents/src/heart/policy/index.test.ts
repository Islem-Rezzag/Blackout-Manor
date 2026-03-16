import {
  advanceServerTick,
  bootstrapMatch,
  dispatchAction,
  getDefaultMatchConfig,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PlayerId,
  RelationshipState,
} from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import { getActionBudgetForPhase } from "../../config/actionBudgets";
import { assignPersonaCards } from "../../personas";
import { createDecisionCandidates } from "../../runtime/candidates";
import { createPrivateObservation } from "../../runtime/observation";
import { AgentSocialStateStore } from "../../runtime/socialStateStore";
import { createLiveDecisionPolicy } from "./index";

const createPlayers = () =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `agent-${String(index + 1).padStart(2, "0")}`,
    displayName: `Agent ${index + 1}`,
    isBot: true,
  }));

const bootstrapToRoam = (seed = 17) => {
  const config = {
    ...getDefaultMatchConfig(`policy-test-${seed}`, seed),
    speedProfileId: "headless-regression" as const,
  };
  const bootstrapped = bootstrapMatch(config, createPlayers());

  return advanceServerTick(
    bootstrapped.state,
    config.timings.castIntroSeconds + 1,
  ).state;
};

const createBaseProposal = (
  actorId: PlayerId,
  phaseId: AgentActionProposal["phaseId"],
) => ({
  actorId,
  phaseId,
  confidence: 0.74,
  emotionalIntent: "confident" as const,
});

const buildPolicy = (
  state: ReturnType<typeof bootstrapToRoam>,
  actorId: PlayerId,
  privateSummaries: string[] = ["Hold one clean line."],
) => {
  const budget = getActionBudgetForPhase(state.phaseId);
  const candidates = createDecisionCandidates(state, actorId, budget);
  const observation = createPrivateObservation(
    state,
    actorId,
    candidates,
    budget,
  );
  const socialContext = new AgentSocialStateStore().getSnapshot(state, actorId);
  const policy = createLiveDecisionPolicy({
    state,
    actorId,
    phaseId: state.phaseId,
    observation,
    socialContext,
    candidates,
    privateSummaries,
  });

  return { budget, candidates, observation, socialContext, policy };
};

const sentenceCount = (value: string) =>
  value
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;

const withRelationship = (
  relationship: RelationshipState | undefined,
  overrides: Partial<RelationshipState>,
): RelationshipState => ({
  trust: 0.5,
  warmth: 0.5,
  fear: 0,
  respect: 0.5,
  debt: 0,
  grievance: 0,
  suspectScore: 0.5,
  predictedSuspicionOfMe: 0.5,
  ...relationship,
  ...overrides,
});

const syncOccupants = (state: ReturnType<typeof bootstrapToRoam>) => {
  for (const room of state.rooms) {
    room.occupantIds = state.players
      .filter(
        (player) => player.status === "alive" && player.roomId === room.roomId,
      )
      .map((player) => player.id);
  }
};

describe("live decision policy", () => {
  it("builds short evidence-grounded press speech when a story changes", () => {
    const roamState = bootstrapToRoam(21);
    const meetingCaller = roamState.players.find(
      (player) => player.status === "alive",
    );

    if (!meetingCaller) {
      throw new Error("Expected a meeting caller.");
    }

    const meetingState = dispatchAction(roamState, {
      ...createBaseProposal(meetingCaller.id, "roam"),
      actionId: "call-meeting",
      reason: "Need the room to stop and compare stories.",
    }).state;
    const actor = meetingState.players.find(
      (player) => player.id !== meetingCaller.id && player.status === "alive",
    );
    const suspect = meetingState.players.find(
      (player) =>
        player.id !== actor?.id &&
        player.id !== meetingCaller.id &&
        player.status === "alive",
    );
    const target = meetingState.players.find(
      (player) => player.id !== suspect?.id && player.status === "alive",
    );

    if (!actor || !suspect || !target) {
      throw new Error("Expected actor, suspect, and target.");
    }

    const firstStatementState = dispatchAction(meetingState, {
      ...createBaseProposal(suspect.id, "meeting"),
      actionId: "reassure",
      targetPlayerId: target.id,
      speech: {
        channel: "meeting",
        text: "I was in the library.",
        tone: "confident",
      },
    }).state;
    const contradictoryState = dispatchAction(firstStatementState, {
      ...createBaseProposal(suspect.id, "meeting"),
      actionId: "reassure",
      targetPlayerId: target.id,
      speech: {
        channel: "meeting",
        text: "I was in the kitchen.",
        tone: "confident",
      },
    }).state;
    const preparedState = structuredClone(contradictoryState);
    const preparedActor = preparedState.players.find(
      (player) => player.id === actor.id,
    );

    if (!preparedActor) {
      throw new Error("Expected prepared actor.");
    }

    preparedActor.relationships[suspect.id] = withRelationship(
      preparedActor.relationships[suspect.id],
      {
        suspectScore: 0.94,
      },
    );
    preparedActor.memories = [
      {
        id: `memory-${actor.id}`,
        tick: preparedState.tick,
        category: "meeting",
        summary: `${suspect.id} shifted from library to kitchen.`,
        playersInvolved: [suspect.id],
        emotionTag: "suspicious",
        salience: 0.93,
        evidenceStrength: 0.88,
      },
    ];

    const { policy } = buildPolicy(preparedState, actor.id);
    const pressPlan = policy.candidatePlans.find((plan) =>
      plan.tags.includes("press"),
    );

    expect(pressPlan?.suggestedSpeech?.text).toMatch(/library|kitchen/i);
    expect(pressPlan?.suggestedSpeech?.text.length ?? 0).toBeLessThanOrEqual(
      180,
    );
    expect(
      sentenceCount(pressPlan?.suggestedSpeech?.text ?? ""),
    ).toBeLessThanOrEqual(2);
  });

  it("varies meeting speech by persona profile", () => {
    const meetingState = dispatchAction(bootstrapToRoam(33), {
      ...createBaseProposal("agent-01", "roam"),
      actionId: "call-meeting",
      reason: "We need the room now.",
    }).state;
    const assignments = assignPersonaCards(
      meetingState.config.seed,
      meetingState.players.map((player) => player.id),
    );
    const orderedAssignments = Object.values(assignments).sort(
      (left, right) =>
        left.persona.socialStyle.talkativeness -
        right.persona.socialStyle.talkativeness,
    );
    const quietActorId = orderedAssignments[0]?.playerId;
    const talkativeActorId = orderedAssignments.at(-1)?.playerId;
    const suspect = meetingState.players.find(
      (player) =>
        player.id !== quietActorId &&
        player.id !== talkativeActorId &&
        player.status === "alive",
    );

    if (!quietActorId || !talkativeActorId || !suspect) {
      throw new Error("Expected quiet actor, talkative actor, and suspect.");
    }

    const preparedState = structuredClone(meetingState);

    for (const actorId of [quietActorId, talkativeActorId]) {
      const actor = preparedState.players.find(
        (player) => player.id === actorId,
      );

      if (!actor) {
        throw new Error(`Missing actor ${actorId}.`);
      }

      actor.relationships[suspect.id] = withRelationship(
        actor.relationships[suspect.id],
        {
          suspectScore: 0.9,
        },
      );
      actor.memories = [
        {
          id: `memory-${actorId}`,
          tick: preparedState.tick,
          category: "meeting",
          summary: `${suspect.id} owns the weakest timeline in this room.`,
          playersInvolved: [suspect.id],
          emotionTag: "suspicious",
          salience: 0.91,
          evidenceStrength: 0.77,
        },
      ];
    }

    const quietPolicy = buildPolicy(preparedState, quietActorId).policy;
    const talkativePolicy = buildPolicy(preparedState, talkativeActorId).policy;
    const quietPress = quietPolicy.candidatePlans.find((plan) =>
      plan.tags.includes("press"),
    );
    const talkativePress = talkativePolicy.candidatePlans.find((plan) =>
      plan.tags.includes("press"),
    );

    expect(quietPolicy.persona.id).not.toBe(talkativePolicy.persona.id);
    expect(quietPress?.suggestedSpeech?.text).not.toBe(
      talkativePress?.suggestedSpeech?.text,
    );
  });

  it("produces role-distinct priorities across roam and report phases", () => {
    const roamState = bootstrapToRoam(51);
    const shadowActor = roamState.players.find(
      (player) => player.role === "shadow",
    );
    const householdActor = roamState.players.find(
      (player) => player.role === "household",
    );

    if (!shadowActor || !householdActor) {
      throw new Error("Expected shadow and household actors.");
    }

    const preparedRoamState = structuredClone(roamState);
    const victim = preparedRoamState.players.find(
      (player) =>
        player.status === "alive" &&
        player.team === "household" &&
        player.id !== shadowActor.id &&
        player.id !== householdActor.id,
    );

    if (!victim) {
      throw new Error("Expected a private victim.");
    }

    const preparedShadow = preparedRoamState.players.find(
      (player) => player.id === shadowActor.id,
    );
    const preparedHousehold = preparedRoamState.players.find(
      (player) => player.id === householdActor.id,
    );

    if (!preparedShadow || !preparedHousehold) {
      throw new Error("Expected prepared actors.");
    }

    preparedShadow.roomId = "cellar";
    victim.roomId = "cellar";
    preparedHousehold.roomId = "grand-hall";
    syncOccupants(preparedRoamState);

    const shadowPolicy = buildPolicy(preparedRoamState, shadowActor.id).policy;
    const householdPolicy = buildPolicy(
      preparedRoamState,
      householdActor.id,
    ).policy;
    const shadowTopAction = shadowPolicy.candidatePlans[0];
    const householdTopAction = householdPolicy.candidatePlans[0];

    expect(shadowTopAction?.tags[0]).toMatch(
      /eliminate|trigger-blackout|jam-door|plant-false-clue|delay-two-person-task/,
    );
    expect(householdTopAction?.tags[0]).toMatch(
      /start-task|continue-task|move|report-body/,
    );

    const killer = preparedRoamState.players.find(
      (player) => player.id === shadowActor.id,
    );
    const reportVictim = preparedRoamState.players.find(
      (player) => player.id === victim.id,
    );
    const investigator = preparedRoamState.players.find(
      (player) => player.role === "investigator" && player.id !== victim?.id,
    );

    if (!killer || !reportVictim || !investigator) {
      throw new Error("Expected victim and investigator.");
    }

    const killedState = dispatchAction(preparedRoamState, {
      ...createBaseProposal(killer.id, "roam"),
      actionId: "eliminate",
      targetPlayerId: reportVictim.id,
    }).state;
    const reportReadyState = structuredClone(killedState);
    const reportInvestigator = reportReadyState.players.find(
      (player) => player.id === investigator.id,
    );

    if (!reportInvestigator) {
      throw new Error("Expected report investigator.");
    }

    reportInvestigator.roomId = "cellar";
    syncOccupants(reportReadyState);

    const reportState = dispatchAction(reportReadyState, {
      ...createBaseProposal(investigator.id, "roam"),
      actionId: "report-body",
      discoveredPlayerId: reportVictim.id,
    }).state;
    const investigatorPolicy = buildPolicy(reportState, investigator.id).policy;

    expect(investigatorPolicy.candidatePlans[0]?.tags[0]).toMatch(
      /recover-clue|dust-room|ask-forensic-question/,
    );
  });

  it("prefers converting an active blackout into an elimination", () => {
    const roamState = bootstrapToRoam(57);
    const shadowActor = roamState.players.find(
      (player) => player.role === "shadow",
    );
    const victim = roamState.players.find(
      (player) =>
        player.status === "alive" &&
        player.team === "household" &&
        player.id !== shadowActor?.id,
    );

    if (!shadowActor || !victim) {
      throw new Error("Expected shadow actor and victim.");
    }

    const preparedState = structuredClone(roamState);
    const preparedShadow = preparedState.players.find(
      (player) => player.id === shadowActor.id,
    );
    const preparedVictim = preparedState.players.find(
      (player) => player.id === victim.id,
    );
    const cellar = preparedState.rooms.find((room) => room.roomId === "cellar");

    if (!preparedShadow || !preparedVictim || !cellar) {
      throw new Error("Expected prepared shadow, victim, and cellar.");
    }

    preparedState.tick = 9;
    preparedState.blackoutUntilTick = 20;
    preparedShadow.roomId = "cellar";
    preparedVictim.roomId = "cellar";
    cellar.lightLevel = "blackout";
    syncOccupants(preparedState);

    const shadowPolicy = buildPolicy(preparedState, shadowActor.id).policy;
    const topPlan = shadowPolicy.candidatePlans[0];

    expect(topPlan?.tags[0]).toBe("eliminate");
  });

  it("creates private whisper plans for confide actions", () => {
    const meetingState = dispatchAction(bootstrapToRoam(63), {
      ...createBaseProposal("agent-01", "roam"),
      actionId: "call-meeting",
      reason: "We need a cleaner room read.",
    }).state;
    const actor = meetingState.players.find(
      (player) => player.status === "alive",
    );
    const ally = meetingState.players.find(
      (player) => player.id !== actor?.id && player.status === "alive",
    );

    if (!actor || !ally) {
      throw new Error("Expected actor and ally.");
    }

    const preparedState = structuredClone(meetingState);
    const preparedActor = preparedState.players.find(
      (player) => player.id === actor.id,
    );

    if (!preparedActor) {
      throw new Error("Expected prepared actor.");
    }

    preparedActor.relationships[ally.id] = {
      ...withRelationship(preparedActor.relationships[ally.id], {}),
      trust: 0.93,
      warmth: 0.88,
      respect: 0.84,
      suspectScore: 0.19,
    };

    const { policy } = buildPolicy(preparedState, actor.id);
    const confidePlan = policy.candidatePlans.find((plan) =>
      plan.tags.includes("confide"),
    );

    expect(policy.activePolicies).toContain("private-whispers");
    expect(confidePlan?.suggestedSpeech?.channel).toBe("private");
    expect(confidePlan?.suggestedSpeech?.text.length ?? 0).toBeLessThanOrEqual(
      180,
    );
  });
});
