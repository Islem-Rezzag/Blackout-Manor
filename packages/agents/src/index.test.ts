import { setTimeout as delay } from "node:timers/promises";

import {
  advanceServerTick,
  bootstrapMatch,
  dispatchAction,
  getDefaultMatchConfig,
  validateAction,
} from "@blackout-manor/engine";
import type { RelationshipState } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";
import { agentsPackageManifest } from "./index";
import { MockModelAdapter } from "./model/adapters/MockModelAdapter";
import { ScriptedFallbackAdapter } from "./model/adapters/ScriptedFallbackAdapter";
import { AgentDecisionGateway } from "./runtime/AgentDecisionGateway";

const createRoamRequest = () => {
  const config = {
    ...getDefaultMatchConfig("agents-test-match", 17),
    speedProfileId: "headless-regression" as const,
  };
  const players = Array.from({ length: 10 }, (_, index) => ({
    id: `agent-${String(index + 1).padStart(2, "0")}`,
    displayName: `Agent ${index + 1}`,
    isBot: true,
  }));
  const bootstrapped = bootstrapMatch(config, players);
  const transitioned = advanceServerTick(
    bootstrapped.state,
    config.timings.castIntroSeconds + 1,
  );
  const actor = transitioned.state.players.find(
    (player) => player.status === "alive",
  );

  if (!actor) {
    throw new Error("Expected at least one living actor.");
  }

  return {
    request: {
      decisionKey: `decision:${actor.id}:${transitioned.state.tick}`,
      matchId: transitioned.state.config.matchId,
      speedProfileId: transitioned.state.config.speedProfileId,
      actorId: actor.id,
      phaseId: transitioned.state.phaseId,
      state: transitioned.state,
    },
    actorId: actor.id,
  };
};

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

describe("agents package", () => {
  it("exposes a ready manifest", () => {
    expect(agentsPackageManifest.status).toBe("ready");
  });

  it("validates model output before returning a proposal", async () => {
    const { request } = createRoamRequest();
    let attempts = 0;
    const adapter = new MockModelAdapter(async () => {
      attempts += 1;

      if (attempts === 1) {
        return {
          candidateIndex: 999,
          confidence: 0.8,
          emotionalIntent: "confident",
        };
      }

      return {
        candidateIndex: 0,
        confidence: 0.74,
        emotionalIntent: "confident",
        privateSummary: "Press the safest legal option.",
      };
    });
    const gateway = new AgentDecisionGateway({
      adapter,
      fallbackAdapter: new ScriptedFallbackAdapter(),
    });

    const result = await gateway.decide(request);

    expect(result).not.toBeNull();
    expect(adapter.calls).toHaveLength(2);

    if (!result) {
      throw new Error("Expected a validated decision.");
    }

    expect(validateAction(request.state, result.proposal).isLegal).toBe(true);
    expect(result.proposal.privateSummary).toBe(
      "Press the safest legal option.",
    );
  });

  it("deduplicates repeated decision keys so retries do not fan out", async () => {
    const { request } = createRoamRequest();
    const adapter = new MockModelAdapter(async () => {
      await delay(25);

      return {
        candidateIndex: 0,
        confidence: 0.61,
        emotionalIntent: "calm",
      };
    });
    const gateway = new AgentDecisionGateway({
      adapter,
      fallbackAdapter: new ScriptedFallbackAdapter(),
    });

    const [left, right] = await Promise.all([
      gateway.decide(request),
      gateway.decide(request),
    ]);

    expect(adapter.calls).toHaveLength(1);
    expect(left?.proposal).toEqual(right?.proposal);
  });

  it("injects private whisper speech from policy defaults when confiding", async () => {
    const { request, actorId } = createRoamRequest();
    const meetingState = dispatchAction(request.state, {
      actorId,
      phaseId: "roam",
      actionId: "call-meeting",
      reason: "We need one clean read before the vote snowballs.",
      confidence: 0.71,
      emotionalIntent: "confident",
    }).state;
    const preparedState = structuredClone(meetingState);
    const actor = preparedState.players.find((player) => player.id === actorId);
    const ally = preparedState.players.find(
      (player) => player.id !== actorId && player.status === "alive",
    );

    if (!actor || !ally) {
      throw new Error("Expected actor and ally.");
    }

    actor.relationships[ally.id] = {
      ...withRelationship(actor.relationships[ally.id], {}),
      trust: 0.96,
      warmth: 0.91,
      respect: 0.87,
      suspectScore: 0.14,
    };

    const gateway = new AgentDecisionGateway({
      adapter: new MockModelAdapter(async (invocation) => {
        const confideCandidate = invocation.candidates.find(
          (candidate) => candidate.actionId === "confide",
        );

        if (!confideCandidate) {
          throw new Error("Expected a confide candidate.");
        }

        return {
          candidateIndex: confideCandidate.index,
          confidence: 0.77,
          emotionalIntent: "warm",
        };
      }),
      fallbackAdapter: new ScriptedFallbackAdapter(),
    });

    const result = await gateway.decide({
      ...request,
      decisionKey: `${request.decisionKey}:meeting`,
      phaseId: preparedState.phaseId,
      state: preparedState,
    });

    expect(result?.proposal.actionId).toBe("confide");
    expect(result?.proposal.speech?.channel).toBe("private");
    expect(result?.proposal.speech?.text.length ?? 0).toBeLessThanOrEqual(180);
  });
});
