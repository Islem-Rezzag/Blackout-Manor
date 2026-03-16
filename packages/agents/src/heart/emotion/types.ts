import type { EmotionLabelId, EmotionState } from "@blackout-manor/shared";

export type PadVector = {
  pleasure: number;
  arousal: number;
  dominance: number;
};

export type ResponsibilityVector = {
  self: number;
  other: number;
  environment: number;
};

export type HeartSemanticEmotionLabel =
  | "calm"
  | "panic"
  | "fear"
  | "anger"
  | "relief"
  | "resentment"
  | "gratitude"
  | "shame"
  | "confidence"
  | "determination"
  | "suspicion"
  | "hope";

export type EmotionAppraisalInput = {
  eventId: string;
  tick: number;
  goalRelevance: number;
  goalCongruence: number;
  certainty: number;
  controllability: number;
  responsibility: ResponsibilityVector;
  relationshipCloseness: number;
  normViolation: number;
  publicEmbarrassmentRisk: number;
};

export type EmotionDecayConfig = {
  fastRetentionPerTick: number;
  slowRetentionPerTick: number;
};

export type HeartEmotionConfig = {
  fastScale: number;
  slowScale: number;
  decay: EmotionDecayConfig;
};

export type HeartEmotionState = {
  baselinePad: PadVector;
  fastPad: PadVector;
  slowPad: PadVector;
  currentPad: PadVector;
  semanticLabel: HeartSemanticEmotionLabel;
  surfaceLabel: EmotionLabelId;
  intensity: number;
  updatedAtTick: number;
};

export type EmotionAppraisal = {
  input: EmotionAppraisalInput;
  fastDelta: PadVector;
  slowDelta: PadVector;
  semanticLabel: HeartSemanticEmotionLabel;
  surfaceLabel: EmotionLabelId;
  intensity: number;
  salience: number;
};

export type EmotionTransition = {
  state: HeartEmotionState;
  appraisal: EmotionAppraisal;
  sharedEmotion: EmotionState;
};
