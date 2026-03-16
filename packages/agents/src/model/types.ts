import type { EngineState } from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  EmotionalIntentId,
  PhaseId,
  PlayerId,
  PrivateObservation,
  SpeechPayload,
  SpeedProfileId,
} from "@blackout-manor/shared";

import type { PhaseActionBudget } from "../config/actionBudgets";
import type { LiveDecisionPolicy } from "../heart/policy";
import type {
  SocialReasoningSnapshot,
  SocialReasoningState,
} from "../heart/social";

export type AgentDecisionCandidate = {
  index: number;
  label: string;
  allowSpeech: boolean;
  template: AgentActionProposal;
};

export type AgentSelection = {
  candidateIndex: number;
  confidence: number;
  emotionalIntent: EmotionalIntentId;
  speech?: SpeechPayload | undefined;
  privateSummary?: string | undefined;
};

export type AgentDecisionRequest = {
  decisionKey: string;
  matchId: string;
  speedProfileId: SpeedProfileId;
  actorId: PlayerId;
  phaseId: PhaseId;
  state: EngineState;
};

export type AgentPreparedDecision = {
  decisionKey: string;
  matchId: string;
  actorId: PlayerId;
  phaseId: PhaseId;
  tick: number;
  speedProfileId: SpeedProfileId;
  observation: PrivateObservation;
  socialContext: SocialReasoningSnapshot;
  socialState: SocialReasoningState;
  policy: LiveDecisionPolicy;
  budget: PhaseActionBudget;
  prompt: string;
  candidates: AgentDecisionCandidate[];
  privateSummaries: string[];
};

export type AgentDecisionResult = {
  proposal: AgentActionProposal;
  selection: AgentSelection;
  adapterId: string;
  attemptCount: number;
};

export type AgentDecisionPreparedTrace = {
  decisionKey: string;
  matchId: string;
  actorId: PlayerId;
  phaseId: PhaseId;
  tick: number;
  speedProfileId: SpeedProfileId;
  observation: PrivateObservation;
  socialContext: SocialReasoningSnapshot;
  socialState: SocialReasoningState;
  policy: LiveDecisionPolicy;
  candidates: AgentDecisionCandidate[];
  privateSummaries: string[];
};

export type AgentDecisionResolvedTrace = AgentDecisionPreparedTrace & {
  proposal: AgentActionProposal;
  selection: AgentSelection;
  adapterId: string;
  attemptCount: number;
};

export type AgentModelInvocation = {
  decisionKey: string;
  speedProfileId: SpeedProfileId;
  prompt: string;
  budget: PhaseActionBudget;
  policy: LiveDecisionPolicy;
  candidates: Array<
    Pick<AgentDecisionCandidate, "index" | "label"> & {
      actionId: AgentDecisionCandidate["template"]["actionId"];
    }
  >;
};

export type AgentModelAdapterResult = {
  selection: AgentSelection;
  providerResponseId?: string | undefined;
};

export interface AgentModelAdapter {
  readonly id: string;
  selectAction(
    invocation: AgentModelInvocation,
  ): Promise<AgentModelAdapterResult>;
}

export interface AgentGatewayLogger {
  debug(message: string, payload?: Record<string, unknown>): void;
  warn(message: string, payload?: Record<string, unknown>): void;
  error(message: string, payload?: Record<string, unknown>): void;
}

export interface AgentGatewayInstrumentation {
  onPrepared?(trace: AgentDecisionPreparedTrace): void;
  onResolved?(trace: AgentDecisionResolvedTrace): void;
}

export type AgentGatewayOptions = {
  adapter: AgentModelAdapter;
  fallbackAdapter?: AgentModelAdapter;
  logger?: AgentGatewayLogger;
  instrumentation?: AgentGatewayInstrumentation;
  maxCachedDecisions?: number;
};
