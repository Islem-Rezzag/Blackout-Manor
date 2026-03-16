import type { PersonaCardDefinition } from "@blackout-manor/content";
import type { EngineState } from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  EmotionalIntentId,
  PhaseId,
  PlayerId,
  PrivateObservation,
  RoleId,
  SpeechPayload,
} from "@blackout-manor/shared";

import type { SocialReasoningSnapshot } from "../social";

export type LivePolicyId =
  | "roam-planning"
  | "body-report-reaction"
  | "meeting-discussion"
  | "vote-selection"
  | "post-meeting-reflection"
  | "private-whispers";

export type PolicyEvidenceKind =
  | "memory"
  | "contradiction"
  | "betrayal"
  | "claim"
  | "event";

export type PolicyEvidence = {
  kind: PolicyEvidenceKind;
  summary: string;
  salience: number;
  playerIds: PlayerId[];
};

export type PolicyCandidateInput = {
  index: number;
  label: string;
  allowSpeech: boolean;
  template: AgentActionProposal;
};

export type PolicyCandidatePlan = {
  candidateIndex: number;
  score: number;
  tags: string[];
  rationale: string;
  recommendedIntent: EmotionalIntentId;
  suggestedSpeech?: SpeechPayload;
  suggestedPrivateSummary?: string;
};

export type PolicyReflection = {
  trust: string;
  fear: string;
  selfImage: string;
  nextMeetingNarrative: string;
  postMeetingAdjustment: string;
};

export type PersonaPolicyProfile = {
  id: string;
  label: string;
  archetype: string;
  summary: string;
  pressureBehavior: string;
  allianceBehavior: string;
  suspicionBehavior: string;
  preferredTones: readonly string[];
  emotionalDefaults: readonly string[];
  socialStyle: PersonaCardDefinition["socialStyle"];
};

export type LiveDecisionPolicy = {
  activePolicies: LivePolicyId[];
  actorRole: RoleId;
  persona: PersonaPolicyProfile;
  roleDirective: string;
  phaseObjective: string;
  evidenceFocus: string[];
  publicSpeechRules: string[];
  whisperGuidance?: string;
  reflection: PolicyReflection;
  candidatePlans: PolicyCandidatePlan[];
};

export type CreateLiveDecisionPolicyInput = {
  state: EngineState;
  actorId: PlayerId;
  phaseId: PhaseId;
  observation: PrivateObservation;
  socialContext: SocialReasoningSnapshot;
  candidates: readonly PolicyCandidateInput[];
  privateSummaries: readonly string[];
};
