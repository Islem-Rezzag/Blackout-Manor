import type { EmotionLabelId, EmotionState } from "@blackout-manor/shared";

import type {
  EmotionAppraisal,
  EmotionAppraisalInput,
  EmotionTransition,
  HeartEmotionConfig,
  HeartEmotionState,
  HeartSemanticEmotionLabel,
  PadVector,
} from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clampPadAxis = (value: number) => Math.min(1, Math.max(-1, value));

const clampPad = (vector: PadVector): PadVector => ({
  pleasure: clampPadAxis(vector.pleasure),
  arousal: clampPadAxis(vector.arousal),
  dominance: clampPadAxis(vector.dominance),
});

const scalePad = (vector: PadVector, scale: number): PadVector => ({
  pleasure: clampPadAxis(vector.pleasure * scale),
  arousal: clampPadAxis(vector.arousal * scale),
  dominance: clampPadAxis(vector.dominance * scale),
});

const addPad = (left: PadVector, right: PadVector): PadVector =>
  clampPad({
    pleasure: left.pleasure + right.pleasure,
    arousal: left.arousal + right.arousal,
    dominance: left.dominance + right.dominance,
  });

const decayPad = (vector: PadVector, retention: number, ticks: number) => {
  if (ticks <= 0) {
    return vector;
  }

  const factor = retention ** ticks;
  return {
    pleasure: clampPadAxis(vector.pleasure * factor),
    arousal: clampPadAxis(vector.arousal * factor),
    dominance: clampPadAxis(vector.dominance * factor),
  };
};

const positive = (value: number) => Math.max(0, value);
const negative = (value: number) => Math.max(0, -value);

const createZeroPad = (): PadVector => ({
  pleasure: 0,
  arousal: 0,
  dominance: 0,
});

const defaultConfig: HeartEmotionConfig = {
  fastScale: 0.82,
  slowScale: 0.42,
  decay: {
    fastRetentionPerTick: 0.76,
    slowRetentionPerTick: 0.97,
  },
};

const calculateIntensity = (pad: PadVector) =>
  clamp01(
    Math.max(
      Math.abs(pad.pleasure),
      Math.abs(pad.arousal),
      Math.abs(pad.dominance),
    ) *
      0.72 +
      ((Math.abs(pad.pleasure) +
        Math.abs(pad.arousal) +
        Math.abs(pad.dominance)) /
        3) *
        0.28,
  );

const mapSurfaceLabel = (
  semanticLabel: HeartSemanticEmotionLabel,
): EmotionLabelId => {
  switch (semanticLabel) {
    case "panic":
    case "fear":
      return "afraid";
    case "anger":
      return "angry";
    case "relief":
      return "relieved";
    case "resentment":
      return "resentful";
    case "gratitude":
    case "hope":
      return "hopeful";
    case "shame":
      return "guilty";
    case "confidence":
      return "confident";
    case "determination":
      return "determined";
    case "suspicion":
      return "suspicious";
    case "calm":
      return "calm";
  }
};

export const labelEmotionFromPad = (
  pad: PadVector,
): {
  semanticLabel: HeartSemanticEmotionLabel;
  surfaceLabel: EmotionLabelId;
  intensity: number;
} => {
  const intensity = calculateIntensity(pad);

  let semanticLabel: HeartSemanticEmotionLabel = "calm";

  if (
    pad.pleasure <= -0.42 &&
    pad.arousal >= 0.18 &&
    pad.arousal <= 0.78 &&
    pad.dominance <= -0.5
  ) {
    semanticLabel = "shame";
  } else if (
    pad.pleasure <= -0.58 &&
    pad.arousal >= 0.6 &&
    pad.dominance <= -0.15
  ) {
    semanticLabel = "panic";
  } else if (
    pad.pleasure >= 0.34 &&
    pad.arousal >= -0.1 &&
    pad.arousal <= 0.42 &&
    pad.dominance >= 0.36
  ) {
    semanticLabel = "confidence";
  } else if (
    pad.pleasure >= 0.42 &&
    pad.arousal >= 0.05 &&
    pad.arousal <= 0.52 &&
    pad.dominance <= 0.28
  ) {
    semanticLabel = "gratitude";
  } else if (
    pad.pleasure >= 0.32 &&
    pad.arousal <= 0.12 &&
    pad.dominance >= 0.05
  ) {
    semanticLabel = "relief";
  } else if (
    pad.pleasure <= -0.34 &&
    pad.arousal >= 0.18 &&
    pad.dominance >= 0.05
  ) {
    semanticLabel = "resentment";
  } else if (pad.pleasure <= -0.32 && pad.arousal >= 0.26) {
    semanticLabel = "fear";
  } else if (pad.pleasure <= -0.28 && pad.dominance >= 0.22) {
    semanticLabel = "anger";
  } else if (pad.pleasure >= 0.18 && pad.dominance >= 0.18) {
    semanticLabel = "determination";
  } else if (pad.arousal >= 0.28 && Math.abs(pad.pleasure) <= 0.18) {
    semanticLabel = "suspicion";
  } else if (pad.pleasure >= 0.2) {
    semanticLabel = "hope";
  }

  return {
    semanticLabel,
    surfaceLabel: mapSurfaceLabel(semanticLabel),
    intensity,
  };
};

const combinePad = (
  baselinePad: PadVector,
  fastPad: PadVector,
  slowPad: PadVector,
) => addPad(addPad(baselinePad, fastPad), slowPad);

const createEmotionState = (
  baselinePad: PadVector,
  fastPad: PadVector,
  slowPad: PadVector,
  updatedAtTick: number,
): HeartEmotionState => {
  const currentPad = combinePad(baselinePad, fastPad, slowPad);
  const labeled = labelEmotionFromPad(currentPad);

  return {
    baselinePad,
    fastPad,
    slowPad,
    currentPad,
    semanticLabel: labeled.semanticLabel,
    surfaceLabel: labeled.surfaceLabel,
    intensity: labeled.intensity,
    updatedAtTick,
  };
};

const buildBaseDelta = (
  state: HeartEmotionState,
  input: EmotionAppraisalInput,
): PadVector => {
  const positiveOutcome = positive(input.goalCongruence);
  const negativeOutcome = negative(input.goalCongruence);
  const lowControl = 1 - input.controllability;
  const selfResponsibility = input.responsibility.self;
  const otherResponsibility = input.responsibility.other;
  const closeness = input.relationshipCloseness;
  const stressLevel = clamp01(
    negative(state.currentPad.pleasure) * 0.45 +
      positive(state.currentPad.arousal) * 0.35 +
      negative(state.currentPad.dominance) * 0.2,
  );

  let pleasure =
    positiveOutcome * input.goalRelevance * 0.84 -
    negativeOutcome * input.goalRelevance * 0.9 -
    input.normViolation * selfResponsibility * 0.24 -
    input.publicEmbarrassmentRisk * selfResponsibility * 0.38;

  pleasure +=
    positiveOutcome *
    otherResponsibility *
    closeness *
    input.goalRelevance *
    0.42;
  pleasure -=
    negativeOutcome *
    otherResponsibility *
    input.normViolation *
    input.goalRelevance *
    0.48;

  let arousal =
    input.goalRelevance * 0.18 +
    negativeOutcome * input.certainty * (0.46 + lowControl * 0.5) +
    input.normViolation * 0.12 +
    input.publicEmbarrassmentRisk * selfResponsibility * 0.26;

  arousal += positiveOutcome * input.goalRelevance * input.certainty * 0.18;
  arousal -= positiveOutcome * input.controllability * 0.18;

  let dominance =
    positiveOutcome * (0.16 + input.controllability * 0.62) -
    negativeOutcome * (0.18 + lowControl * 0.66);

  dominance +=
    positiveOutcome *
    selfResponsibility *
    input.controllability *
    input.certainty *
    0.3;
  dominance -=
    input.publicEmbarrassmentRisk * selfResponsibility * negativeOutcome * 0.42;
  dominance +=
    negativeOutcome * otherResponsibility * input.normViolation * 0.24;
  dominance -= positiveOutcome * otherResponsibility * closeness * 0.1;

  if (positiveOutcome > negativeOutcome && stressLevel > 0.25) {
    pleasure += positiveOutcome * stressLevel * 1.28;
    arousal -= positiveOutcome * stressLevel * 1.72;
    dominance += positiveOutcome * stressLevel * 0.18;
  }

  if (
    negativeOutcome > 0 &&
    otherResponsibility >= selfResponsibility &&
    input.normViolation >= 0.35 &&
    input.controllability >= 0.25
  ) {
    pleasure -= negativeOutcome * otherResponsibility * 0.22;
    dominance +=
      negativeOutcome *
      otherResponsibility *
      (0.39 + input.relationshipCloseness * 0.3);
  }

  if (
    positiveOutcome > 0 &&
    otherResponsibility > selfResponsibility &&
    closeness >= 0.35
  ) {
    arousal -= positiveOutcome * closeness * 0.12;
    dominance -= positiveOutcome * closeness * 0.08;
  }

  if (
    positiveOutcome > 0 &&
    selfResponsibility >= otherResponsibility &&
    input.controllability >= 0.55
  ) {
    dominance += positiveOutcome * selfResponsibility * 0.22;
  }

  if (
    negativeOutcome > 0 &&
    selfResponsibility >= 0.7 &&
    input.publicEmbarrassmentRisk >= 0.6 &&
    input.normViolation >= 0.5
  ) {
    arousal -=
      negativeOutcome *
      selfResponsibility *
      input.publicEmbarrassmentRisk *
      0.26;
    dominance -=
      negativeOutcome * selfResponsibility * input.normViolation * 0.18;
  }

  return clampPad({ pleasure, arousal, dominance });
};

export const scoreEmotionalSalience = (
  input: EmotionAppraisalInput,
  delta: PadVector,
) =>
  clamp01(
    input.goalRelevance * 0.27 +
      Math.abs(input.goalCongruence) * 0.18 +
      input.certainty * 0.08 +
      input.normViolation * 0.15 +
      input.publicEmbarrassmentRisk * 0.12 +
      input.relationshipCloseness * 0.08 +
      ((Math.abs(delta.pleasure) +
        Math.abs(delta.arousal) +
        Math.abs(delta.dominance)) /
        3) *
        0.22,
  );

export const createHeartEmotionState = (
  input?: Partial<
    Pick<HeartEmotionState, "baselinePad" | "fastPad" | "slowPad">
  > & {
    tick?: number;
  },
) =>
  createEmotionState(
    clampPad(input?.baselinePad ?? createZeroPad()),
    clampPad(input?.fastPad ?? createZeroPad()),
    clampPad(input?.slowPad ?? createZeroPad()),
    input?.tick ?? 0,
  );

export const decayHeartEmotionState = (
  state: HeartEmotionState,
  tick: number,
  config: HeartEmotionConfig = defaultConfig,
) => {
  const elapsedTicks = Math.max(0, tick - state.updatedAtTick);

  if (elapsedTicks === 0) {
    return state;
  }

  return createEmotionState(
    state.baselinePad,
    decayPad(state.fastPad, config.decay.fastRetentionPerTick, elapsedTicks),
    decayPad(state.slowPad, config.decay.slowRetentionPerTick, elapsedTicks),
    tick,
  );
};

export const appraiseEmotionEvent = (
  state: HeartEmotionState,
  input: EmotionAppraisalInput,
  config: HeartEmotionConfig = defaultConfig,
): EmotionAppraisal => {
  const decayedState = decayHeartEmotionState(state, input.tick, config);
  const baseDelta = buildBaseDelta(decayedState, input);
  const fastDelta = scalePad(baseDelta, config.fastScale);
  const slowDelta = scalePad(
    baseDelta,
    config.slowScale * scoreEmotionalSalience(input, baseDelta),
  );
  const projectedPad = combinePad(
    decayedState.baselinePad,
    addPad(decayedState.fastPad, fastDelta),
    addPad(decayedState.slowPad, slowDelta),
  );
  const labeled = labelEmotionFromPad(projectedPad);

  return {
    input,
    fastDelta,
    slowDelta,
    semanticLabel: labeled.semanticLabel,
    surfaceLabel: labeled.surfaceLabel,
    intensity: labeled.intensity,
    salience: scoreEmotionalSalience(input, baseDelta),
  };
};

const shouldReleaseStress = (
  state: HeartEmotionState,
  input: EmotionAppraisalInput,
) =>
  positive(input.goalCongruence) > negative(input.goalCongruence) &&
  state.currentPad.pleasure <= -0.25 &&
  state.currentPad.arousal >= 0.25;

const releaseFastStress = (state: HeartEmotionState) =>
  createEmotionState(
    state.baselinePad,
    {
      pleasure: clampPadAxis(state.fastPad.pleasure * 0.35),
      arousal: clampPadAxis(state.fastPad.arousal * 0.22),
      dominance: clampPadAxis(state.fastPad.dominance * 0.32),
    },
    state.slowPad,
    state.updatedAtTick,
  );

const applyDelta = (
  state: HeartEmotionState,
  delta: PadVector,
  channel: "fast" | "slow",
  tick: number,
) =>
  createEmotionState(
    state.baselinePad,
    channel === "fast" ? addPad(state.fastPad, delta) : state.fastPad,
    channel === "slow" ? addPad(state.slowPad, delta) : state.slowPad,
    tick,
  );

export const applyFastEmotionUpdate = (
  state: HeartEmotionState,
  input: EmotionAppraisalInput,
  config: HeartEmotionConfig = defaultConfig,
): EmotionTransition => {
  const decayedState = decayHeartEmotionState(state, input.tick, config);
  const settledState = shouldReleaseStress(decayedState, input)
    ? releaseFastStress(decayedState)
    : decayedState;
  const appraisal = appraiseEmotionEvent(decayedState, input, config);
  const nextState = applyDelta(
    settledState,
    appraisal.fastDelta,
    "fast",
    input.tick,
  );

  return {
    state: nextState,
    appraisal: {
      ...appraisal,
      semanticLabel: nextState.semanticLabel,
      surfaceLabel: nextState.surfaceLabel,
      intensity: nextState.intensity,
    },
    sharedEmotion: toSharedEmotionState(nextState),
  };
};

export const applySlowEmotionUpdate = (
  state: HeartEmotionState,
  input: EmotionAppraisalInput,
  config: HeartEmotionConfig = defaultConfig,
): EmotionTransition => {
  const decayedState = decayHeartEmotionState(state, input.tick, config);
  const appraisal = appraiseEmotionEvent(decayedState, input, config);
  const nextState = applyDelta(
    decayedState,
    appraisal.slowDelta,
    "slow",
    input.tick,
  );

  return {
    state: nextState,
    appraisal: {
      ...appraisal,
      semanticLabel: nextState.semanticLabel,
      surfaceLabel: nextState.surfaceLabel,
      intensity: nextState.intensity,
    },
    sharedEmotion: toSharedEmotionState(nextState),
  };
};

export const toSharedEmotionState = (
  state: HeartEmotionState,
): EmotionState => ({
  pleasure: state.currentPad.pleasure,
  arousal: state.currentPad.arousal,
  dominance: state.currentPad.dominance,
  label: state.surfaceLabel,
  intensity: state.intensity,
  updatedAtTick: state.updatedAtTick,
});

export const HEART_EMOTION_DEFAULTS = defaultConfig;

export type * from "./types";
