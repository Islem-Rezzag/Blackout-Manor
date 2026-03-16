import { OFFICIAL_AGENT_MODEL_PACK } from "./model/officialPack";

export {
  ACTION_BUDGETS_BY_PHASE,
  getActionBudgetForPhase,
} from "./config/actionBudgets";
export * from "./heart";
export { MockModelAdapter } from "./model/adapters/MockModelAdapter";
export { OpenAIResponsesModelAdapter } from "./model/adapters/OpenAIResponsesModelAdapter";
export { ScriptedFallbackAdapter } from "./model/adapters/ScriptedFallbackAdapter";
export {
  OFFICIAL_AGENT_MODEL_PACK,
  resolveOfficialModelId,
} from "./model/officialPack";
export { redactSecrets } from "./model/redaction";
export type * from "./model/types";
export * from "./personas";
export * from "./reflection";
export {
  AGENT_SELECTION_JSON_SCHEMA,
  AgentDecisionGateway,
} from "./runtime/AgentDecisionGateway";
export { createDecisionCandidates } from "./runtime/candidates";
export { createPrivateObservation } from "./runtime/observation";
export { AgentSocialStateStore } from "./runtime/socialStateStore";

export const agentsPackageManifest = {
  name: "@blackout-manor/agents",
  status: "ready",
  adapterIds: ["openai-responses", "scripted-fallback", "mock"],
  defaultPackId: OFFICIAL_AGENT_MODEL_PACK.packId,
} as const;
