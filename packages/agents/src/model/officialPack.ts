import type { SpeedProfileId } from "@blackout-manor/shared";

export type OfficialAgentModelPack = {
  packId: string;
  provider: "openai-responses";
  baseUrl: string;
  modelsBySpeedProfile: Record<SpeedProfileId, string>;
  schemaName: string;
  maxLogPromptChars: number;
};

export const OFFICIAL_AGENT_MODEL_PACK: OfficialAgentModelPack = {
  packId: "official-season-01",
  provider: "openai-responses",
  baseUrl: "https://api.openai.com/v1",
  modelsBySpeedProfile: {
    showcase: "gpt-5.4",
    "fast-sim": "gpt-5-mini",
    "headless-regression": "gpt-5-mini",
  },
  schemaName: "blackout_manor_action_selection",
  maxLogPromptChars: 0,
};

export const resolveOfficialModelId = (speedProfileId: SpeedProfileId) =>
  OFFICIAL_AGENT_MODEL_PACK.modelsBySpeedProfile[speedProfileId];
