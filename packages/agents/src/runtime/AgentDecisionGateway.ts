import { createHash } from "node:crypto";

import { validateAction } from "@blackout-manor/engine";
import {
  AgentActionProposalSchema,
  EmotionalIntentIdSchema,
  SpeechPayloadSchema,
} from "@blackout-manor/shared";
import { z } from "zod";

import {
  getActionBudgetForPhase,
  type PhaseActionBudget,
} from "../config/actionBudgets";
import { createLiveDecisionPolicy } from "../heart/policy";
import type {
  AgentDecisionRequest,
  AgentDecisionResult,
  AgentGatewayOptions,
  AgentPreparedDecision,
  AgentSelection,
} from "../model/types";
import { createDecisionCandidates } from "./candidates";
import { createPrivateObservation } from "./observation";
import { AgentPrivateSummaryStore } from "./privateSummaryStore";
import { AgentSocialStateStore } from "./socialStateStore";

const AgentSelectionSchema = z
  .object({
    candidateIndex: z.number().int().nonnegative(),
    confidence: z.number().min(0).max(1),
    emotionalIntent: EmotionalIntentIdSchema,
    speech: SpeechPayloadSchema.optional(),
    privateSummary: z.string().min(1).max(280).optional(),
  })
  .strict();

const createSelectionJsonSchema = () => {
  const schema = z.toJSONSchema(AgentSelectionSchema) as Record<
    string,
    unknown
  >;
  delete schema.$schema;
  return schema;
};

export const AGENT_SELECTION_JSON_SCHEMA = createSelectionJsonSchema();

const defaultLogger = {
  debug: () => {},
  warn: () => {},
  error: () => {},
};

const summarizeRelationships = (
  relationships: AgentPreparedDecision["observation"]["relationships"],
) =>
  Object.entries(relationships)
    .map(([playerId, relationship]) => ({
      playerId,
      trust: relationship.trust,
      warmth: relationship.warmth,
      fear: relationship.fear,
      suspectScore: relationship.suspectScore,
      predictedSuspicionOfMe: relationship.predictedSuspicionOfMe,
    }))
    .sort((left, right) => right.suspectScore - left.suspectScore)
    .slice(0, 5);

const promptHash = (prompt: string) =>
  createHash("sha1").update(prompt).digest("hex").slice(0, 12);

const serializePrompt = (
  prepared: AgentPreparedDecision,
  budget: PhaseActionBudget,
) =>
  JSON.stringify(
    {
      decisionKey: prepared.decisionKey,
      matchId: prepared.matchId,
      actorId: prepared.actorId,
      phaseId: prepared.phaseId,
      tick: prepared.tick,
      budget: {
        maxOutputTokens: budget.maxOutputTokens,
        timeoutMs: budget.timeoutMs,
        candidateCount: prepared.candidates.length,
      },
      observation: {
        phaseId: prepared.observation.phaseId,
        self: prepared.observation.self,
        visiblePlayers: prepared.observation.visiblePlayers,
        visibleEvents: prepared.observation.visibleEvents.slice(
          0,
          budget.maxVisibleEvents,
        ),
        recentClaims: prepared.observation.recentClaims.slice(
          0,
          budget.maxRecentClaims,
        ),
        topMemories: prepared.observation.topMemories.slice(
          0,
          budget.maxMemories,
        ),
        relationshipFocus: summarizeRelationships(
          prepared.observation.relationships,
        ),
        legalActions: prepared.observation.legalActions,
      },
      socialContext: {
        reflection: prepared.socialContext.reflection,
        relationshipFocus: prepared.socialContext.relationshipFocus,
        contradictionFocus: prepared.socialContext.contradictions,
        openPromises: prepared.socialContext.openPromises,
        recentBetrayals: prepared.socialContext.recentBetrayals,
        tomFocus: prepared.socialContext.tomFocus,
      },
      policy: {
        activePolicies: prepared.policy.activePolicies,
        actorRole: prepared.policy.actorRole,
        persona: prepared.policy.persona,
        roleDirective: prepared.policy.roleDirective,
        phaseObjective: prepared.policy.phaseObjective,
        evidenceFocus: prepared.policy.evidenceFocus,
        publicSpeechRules: prepared.policy.publicSpeechRules,
        whisperGuidance: prepared.policy.whisperGuidance,
        reflection: prepared.policy.reflection,
      },
      recentPrivateSummaries: prepared.privateSummaries.slice(
        -budget.maxPrivateSummaries,
      ),
      candidates: prepared.candidates.map((candidate) => ({
        index: candidate.index,
        label: candidate.label,
        actionId: candidate.template.actionId,
        policyPlan: prepared.policy.candidatePlans.find(
          (plan) => plan.candidateIndex === candidate.index,
        ),
        args: Object.fromEntries(
          Object.entries(candidate.template).filter(
            ([key]) =>
              ![
                "actorId",
                "phaseId",
                "confidence",
                "emotionalIntent",
                "speech",
                "privateSummary",
              ].includes(key),
          ),
        ),
        allowSpeech: candidate.allowSpeech,
      })),
    },
    null,
    2,
  );

const buildPrompt = (prepared: AgentPreparedDecision) => {
  const systemPrompt = [
    "You are an agent inside Blackout Manor.",
    "The deterministic game engine is the only authority on state.",
    "Select exactly one candidate index from the provided list.",
    "Do not reveal chain-of-thought.",
    "If you include speech, use at most 2 short sentences.",
    "Public speech must be grounded in visible evidence or strategic deception.",
    "If you include a privateSummary, keep it compact and tactical.",
  ].join(" ");

  return `${systemPrompt}\n\n${serializePrompt(prepared, prepared.budget)}`;
};

const createPreparedDecision = (
  request: AgentDecisionRequest,
  privateSummaryStore: AgentPrivateSummaryStore,
  socialStateStore: AgentSocialStateStore,
): AgentPreparedDecision => {
  const budget = getActionBudgetForPhase(request.phaseId);
  const candidates = createDecisionCandidates(
    request.state,
    request.actorId,
    budget,
  );
  const observation = createPrivateObservation(
    request.state,
    request.actorId,
    candidates,
    budget,
  );
  const privateSummaries = privateSummaryStore.getRecent(
    request.actorId,
    budget.maxPrivateSummaries,
  );
  const socialInspection = socialStateStore.inspect(
    request.state,
    request.actorId,
  );
  const socialContext = socialInspection.snapshot;
  const policy = createLiveDecisionPolicy({
    state: request.state,
    actorId: request.actorId,
    phaseId: request.phaseId,
    observation,
    socialContext,
    candidates,
    privateSummaries,
  });
  const candidatePlanByIndex = new Map(
    policy.candidatePlans.map((plan) => [plan.candidateIndex, plan]),
  );
  const rankedCandidates = [...candidates].sort((left, right) => {
    const leftScore = candidatePlanByIndex.get(left.index)?.score ?? 0;
    const rightScore = candidatePlanByIndex.get(right.index)?.score ?? 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.index - right.index;
  });

  return {
    decisionKey: request.decisionKey,
    matchId: request.matchId,
    actorId: request.actorId,
    phaseId: request.phaseId,
    tick: request.state.tick,
    speedProfileId: request.speedProfileId,
    observation,
    socialContext,
    socialState: socialInspection.state,
    policy,
    budget,
    prompt: "",
    candidates: rankedCandidates,
    privateSummaries,
  };
};

const materializeProposal = (
  prepared: AgentPreparedDecision,
  selection: AgentSelection,
) => {
  const candidate = prepared.candidates.find(
    (entry) => entry.index === selection.candidateIndex,
  );

  if (!candidate) {
    throw new Error(`Unknown candidate index ${selection.candidateIndex}.`);
  }

  if (selection.speech && !candidate.allowSpeech) {
    throw new Error("Speech is not allowed for that candidate.");
  }

  const policyPlan = prepared.policy.candidatePlans.find(
    (plan) => plan.candidateIndex === selection.candidateIndex,
  );
  const speech = selection.speech ?? policyPlan?.suggestedSpeech;
  const privateSummary =
    selection.privateSummary ?? policyPlan?.suggestedPrivateSummary;

  if (
    prepared.phaseId === "meeting" &&
    speech &&
    candidate.template.actionId !== "confide" &&
    speech.channel !== "meeting"
  ) {
    throw new Error("Meeting speech must use the meeting channel.");
  }

  if (
    prepared.phaseId === "meeting" &&
    speech &&
    candidate.template.actionId === "confide" &&
    !["meeting", "private"].includes(speech.channel)
  ) {
    throw new Error("Confide may only use meeting or private speech.");
  }

  return AgentActionProposalSchema.parse({
    ...candidate.template,
    confidence: selection.confidence,
    emotionalIntent: selection.emotionalIntent,
    ...(speech ? { speech } : {}),
    ...(privateSummary ? { privateSummary } : {}),
  });
};

export class AgentDecisionGateway {
  readonly #logger;
  readonly #summaryStore = new AgentPrivateSummaryStore();
  readonly #socialStateStore = new AgentSocialStateStore();
  readonly #decisionCache = new Map<
    string,
    Promise<AgentDecisionResult | null>
  >();

  constructor(private readonly options: AgentGatewayOptions) {
    this.#logger = options.logger ?? defaultLogger;
  }

  get adapterId() {
    return this.options.adapter.id;
  }

  async decide(
    request: AgentDecisionRequest,
  ): Promise<AgentDecisionResult | null> {
    const cached = this.#decisionCache.get(request.decisionKey);

    if (cached) {
      return cached;
    }

    const run = this.#decideInternal(request).finally(() => {
      if (this.#decisionCache.size > (this.options.maxCachedDecisions ?? 256)) {
        const oldestKey = this.#decisionCache.keys().next().value;

        if (typeof oldestKey === "string") {
          this.#decisionCache.delete(oldestKey);
        }
      }
    });

    this.#decisionCache.set(request.decisionKey, run);
    return run;
  }

  async #decideInternal(
    request: AgentDecisionRequest,
  ): Promise<AgentDecisionResult | null> {
    const prepared = createPreparedDecision(
      request,
      this.#summaryStore,
      this.#socialStateStore,
    );

    if (prepared.candidates.length === 0) {
      return null;
    }

    this.options.instrumentation?.onPrepared?.({
      decisionKey: prepared.decisionKey,
      matchId: prepared.matchId,
      actorId: prepared.actorId,
      phaseId: prepared.phaseId,
      tick: prepared.tick,
      speedProfileId: prepared.speedProfileId,
      observation: structuredClone(prepared.observation),
      socialContext: structuredClone(prepared.socialContext),
      socialState: structuredClone(prepared.socialState),
      policy: structuredClone(prepared.policy),
      candidates: structuredClone(prepared.candidates),
      privateSummaries: structuredClone(prepared.privateSummaries),
    });

    prepared.prompt = buildPrompt(prepared);

    const primary = await this.#executeAdapter(
      request,
      prepared,
      this.options.adapter,
    );

    if (primary) {
      return primary;
    }

    if (!this.options.fallbackAdapter) {
      return null;
    }

    return this.#executeAdapter(
      request,
      prepared,
      this.options.fallbackAdapter,
    );
  }

  async #executeAdapter(
    request: AgentDecisionRequest,
    prepared: AgentPreparedDecision,
    adapter: NonNullable<AgentGatewayOptions["adapter"]>,
  ) {
    const attempts = prepared.budget.retryCount + 1;
    const promptDigest = promptHash(prepared.prompt);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        this.#logger.debug("agent.decision.request", {
          adapterId: adapter.id,
          decisionKey: request.decisionKey,
          phaseId: request.phaseId,
          actorId: request.actorId,
          attempt,
          promptHash: promptDigest,
          candidateCount: prepared.candidates.length,
        });

        const adapterResult = await adapter.selectAction({
          decisionKey: request.decisionKey,
          speedProfileId: request.speedProfileId,
          prompt: prepared.prompt,
          budget: prepared.budget,
          policy: prepared.policy,
          candidates: prepared.candidates.map((candidate) => ({
            index: candidate.index,
            label: candidate.label,
            actionId: candidate.template.actionId,
          })),
        });
        const selection = AgentSelectionSchema.parse(adapterResult.selection);
        const proposal = materializeProposal(prepared, selection);
        const legality = validateAction(request.state, proposal);

        if (!legality.isLegal) {
          throw new Error(legality.reason);
        }

        this.#summaryStore.store(request.actorId, proposal.privateSummary);

        this.options.instrumentation?.onResolved?.({
          decisionKey: prepared.decisionKey,
          matchId: prepared.matchId,
          actorId: prepared.actorId,
          phaseId: prepared.phaseId,
          tick: prepared.tick,
          speedProfileId: prepared.speedProfileId,
          observation: structuredClone(prepared.observation),
          socialContext: structuredClone(prepared.socialContext),
          socialState: structuredClone(prepared.socialState),
          policy: structuredClone(prepared.policy),
          candidates: structuredClone(prepared.candidates),
          privateSummaries: structuredClone(prepared.privateSummaries),
          proposal: structuredClone(proposal),
          selection: structuredClone(selection),
          adapterId: adapter.id,
          attemptCount: attempt,
        });

        return {
          proposal,
          selection,
          adapterId: adapter.id,
          attemptCount: attempt,
        } satisfies AgentDecisionResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown model gateway error.";

        this.#logger.warn("agent.decision.retry", {
          adapterId: adapter.id,
          decisionKey: request.decisionKey,
          phaseId: request.phaseId,
          actorId: request.actorId,
          attempt,
          promptHash: promptDigest,
          error: errorMessage,
        });

        if (attempt >= attempts) {
          this.#logger.error("agent.decision.failed", {
            adapterId: adapter.id,
            decisionKey: request.decisionKey,
            phaseId: request.phaseId,
            actorId: request.actorId,
            promptHash: promptDigest,
            error: errorMessage,
          });
        }
      }
    }

    return null;
  }
}
