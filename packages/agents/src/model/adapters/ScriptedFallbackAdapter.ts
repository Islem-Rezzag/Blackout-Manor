import type {
  AgentDecisionCandidate,
  AgentModelAdapter,
  AgentModelAdapterResult,
  AgentModelInvocation,
} from "../types";

const ACTION_PRIORITY: Record<string, number> = {
  "report-body": 100,
  eliminate: 95,
  "continue-task": 90,
  "start-task": 85,
  "recover-clue": 80,
  "dust-room": 79,
  "vote-player": 78,
  "skip-vote": 70,
  reassure: 68,
  comfort: 67,
  press: 66,
  promise: 65,
  confide: 64,
  "trigger-blackout": 60,
  "jam-door": 59,
  move: 50,
};

const hashDecisionKey = (value: string) =>
  [...value].reduce(
    (total, character) => total * 31 + character.charCodeAt(0),
    7,
  );

const pickCandidate = (
  invocation: AgentModelInvocation,
): Pick<AgentDecisionCandidate, "index"> => {
  const policyPlanByIndex = new Map(
    invocation.policy.candidatePlans.map((plan) => [plan.candidateIndex, plan]),
  );
  const keyedCandidates = invocation.candidates.map((candidate) => ({
    ...candidate,
    priority:
      (policyPlanByIndex.get(candidate.index)?.score ?? 0) * 100 +
      (ACTION_PRIORITY[candidate.actionId] ?? 0),
  }));
  const sorted = [...keyedCandidates].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    return left.index - right.index;
  });
  const preferred = sorted[0];

  if (preferred && preferred.priority > 0) {
    return preferred;
  }

  const fallbackIndex =
    Math.abs(hashDecisionKey(invocation.decisionKey)) %
    invocation.candidates.length;
  const fallbackCandidate = invocation.candidates[fallbackIndex];

  if (!fallbackCandidate) {
    throw new Error("Scripted fallback could not resolve a candidate.");
  }

  return fallbackCandidate;
};

export class ScriptedFallbackAdapter implements AgentModelAdapter {
  readonly id = "scripted-fallback";

  async selectAction(
    invocation: AgentModelInvocation,
  ): Promise<AgentModelAdapterResult> {
    const candidate = pickCandidate(invocation);

    return {
      selection: {
        candidateIndex: candidate.index,
        confidence: 0.58,
        emotionalIntent:
          invocation.policy.candidatePlans.find(
            (plan) => plan.candidateIndex === candidate.index,
          )?.recommendedIntent ??
          (invocation.candidates.length > 6 ? "confident" : "calm"),
        ...(() => {
          const plan = invocation.policy.candidatePlans.find(
            (entry) => entry.candidateIndex === candidate.index,
          );

          return plan?.suggestedSpeech ? { speech: plan.suggestedSpeech } : {};
        })(),
        privateSummary:
          invocation.policy.candidatePlans.find(
            (plan) => plan.candidateIndex === candidate.index,
          )?.suggestedPrivateSummary ??
          `Prefer ${candidate.index} at ${invocation.decisionKey}.`,
      },
      providerResponseId: `scripted:${invocation.decisionKey}`,
    };
  }
}
