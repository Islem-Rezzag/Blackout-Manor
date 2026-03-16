import { describe, expect, it } from "vitest";

import {
  applyFastEmotionUpdate,
  applySlowEmotionUpdate,
  createHeartEmotionState,
  decayHeartEmotionState,
} from "./index";
import type { EmotionAppraisalInput } from "./types";

const baseInput = (
  overrides: Partial<EmotionAppraisalInput>,
): EmotionAppraisalInput => ({
  eventId: "emotion-test-event",
  tick: 1,
  goalRelevance: 0.5,
  goalCongruence: 0,
  certainty: 0.5,
  controllability: 0.5,
  responsibility: {
    self: 0.33,
    other: 0.33,
    environment: 0.34,
  },
  relationshipCloseness: 0.25,
  normViolation: 0,
  publicEmbarrassmentRisk: 0,
  ...overrides,
});

describe("HEART emotion system", () => {
  it("is deterministic for the same state and event input", () => {
    const initial = createHeartEmotionState({ tick: 0 });
    const input = baseInput({
      eventId: "deterministic-case",
      tick: 4,
      goalRelevance: 0.92,
      goalCongruence: -0.88,
      certainty: 0.84,
      controllability: 0.12,
      responsibility: {
        self: 0.04,
        other: 0.88,
        environment: 0.08,
      },
      relationshipCloseness: 0.66,
      normViolation: 0.74,
      publicEmbarrassmentRisk: 0.21,
    });

    const left = applyFastEmotionUpdate(initial, input);
    const right = applyFastEmotionUpdate(initial, input);

    expect(left).toEqual(right);
  });

  it("produces panic under acute, uncontrollable threat", () => {
    const result = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "panic-case",
        tick: 2,
        goalRelevance: 0.98,
        goalCongruence: -1,
        certainty: 0.92,
        controllability: 0.05,
        responsibility: {
          self: 0.02,
          other: 0.9,
          environment: 0.08,
        },
        relationshipCloseness: 0.41,
        normViolation: 0.62,
        publicEmbarrassmentRisk: 0.18,
      }),
    );

    expect(result.state.semanticLabel).toBe("panic");
    expect(result.state.currentPad.pleasure).toBeLessThan(-0.58);
    expect(result.state.currentPad.arousal).toBeGreaterThan(0.6);
    expect(result.state.currentPad.dominance).toBeLessThan(-0.2);
    expect(result.appraisal.salience).toBeGreaterThan(0.75);
  });

  it("produces relief after a high-stress state resolves safely", () => {
    const panic = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "threat-before-relief",
        tick: 1,
        goalRelevance: 0.95,
        goalCongruence: -0.94,
        certainty: 0.9,
        controllability: 0.1,
        responsibility: {
          self: 0.05,
          other: 0.82,
          environment: 0.13,
        },
        relationshipCloseness: 0.3,
        normViolation: 0.54,
        publicEmbarrassmentRisk: 0.08,
      }),
    );
    const relief = applyFastEmotionUpdate(
      panic.state,
      baseInput({
        eventId: "relief-case",
        tick: 2,
        goalRelevance: 0.9,
        goalCongruence: 0.88,
        certainty: 0.93,
        controllability: 0.72,
        responsibility: {
          self: 0.12,
          other: 0.68,
          environment: 0.2,
        },
        relationshipCloseness: 0.74,
        normViolation: 0.02,
        publicEmbarrassmentRisk: 0,
      }),
    );

    expect(relief.state.semanticLabel).toBe("relief");
    expect(relief.state.currentPad.pleasure).toBeGreaterThan(0.3);
    expect(relief.state.currentPad.arousal).toBeLessThan(0.12);
    expect(relief.state.currentPad.dominance).toBeGreaterThan(0.05);
  });

  it("builds resentment through slow-burn betrayal", () => {
    const initial = createHeartEmotionState({ tick: 0 });
    const first = applySlowEmotionUpdate(
      initial,
      baseInput({
        eventId: "betrayal-one",
        tick: 3,
        goalRelevance: 0.8,
        goalCongruence: -0.66,
        certainty: 0.82,
        controllability: 0.44,
        responsibility: {
          self: 0.04,
          other: 0.9,
          environment: 0.06,
        },
        relationshipCloseness: 0.71,
        normViolation: 0.84,
        publicEmbarrassmentRisk: 0.12,
      }),
    );
    const second = applySlowEmotionUpdate(
      first.state,
      baseInput({
        eventId: "betrayal-two",
        tick: 7,
        goalRelevance: 0.78,
        goalCongruence: -0.62,
        certainty: 0.88,
        controllability: 0.46,
        responsibility: {
          self: 0.03,
          other: 0.91,
          environment: 0.06,
        },
        relationshipCloseness: 0.76,
        normViolation: 0.82,
        publicEmbarrassmentRisk: 0.18,
      }),
    );

    expect(second.state.semanticLabel).toBe("resentment");
    expect(second.state.currentPad.pleasure).toBeLessThan(-0.36);
    expect(second.state.currentPad.dominance).toBeGreaterThan(0.06);
    expect(second.state.slowPad.pleasure).toBeLessThan(0);
  });

  it("produces gratitude when a close ally helps", () => {
    const result = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "gratitude-case",
        tick: 5,
        goalRelevance: 0.84,
        goalCongruence: 0.78,
        certainty: 0.86,
        controllability: 0.52,
        responsibility: {
          self: 0.06,
          other: 0.87,
          environment: 0.07,
        },
        relationshipCloseness: 0.92,
        normViolation: 0,
        publicEmbarrassmentRisk: 0,
      }),
    );

    expect(result.state.semanticLabel).toBe("gratitude");
    expect(result.state.currentPad.pleasure).toBeGreaterThan(0.42);
    expect(result.state.currentPad.dominance).toBeLessThanOrEqual(0.28);
  });

  it("produces shame when the self causes a public norm breach", () => {
    const result = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "shame-case",
        tick: 6,
        goalRelevance: 0.88,
        goalCongruence: -0.72,
        certainty: 0.9,
        controllability: 0.34,
        responsibility: {
          self: 0.93,
          other: 0.03,
          environment: 0.04,
        },
        relationshipCloseness: 0.38,
        normViolation: 0.9,
        publicEmbarrassmentRisk: 0.94,
      }),
    );

    expect(result.state.semanticLabel).toBe("shame");
    expect(result.state.currentPad.pleasure).toBeLessThan(-0.42);
    expect(result.state.currentPad.dominance).toBeLessThan(-0.22);
    expect(result.sharedEmotion.label).toBe("guilty");
  });

  it("produces confidence when success is self-driven and controlled", () => {
    const result = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "confidence-case",
        tick: 3,
        goalRelevance: 0.77,
        goalCongruence: 0.86,
        certainty: 0.88,
        controllability: 0.9,
        responsibility: {
          self: 0.88,
          other: 0.08,
          environment: 0.04,
        },
        relationshipCloseness: 0.2,
        normViolation: 0,
        publicEmbarrassmentRisk: 0,
      }),
    );

    expect(result.state.semanticLabel).toBe("confidence");
    expect(result.state.currentPad.pleasure).toBeGreaterThan(0.34);
    expect(result.state.currentPad.dominance).toBeGreaterThan(0.36);
    expect(result.sharedEmotion.label).toBe("confident");
  });

  it("decays fast emotion spikes over time while preserving slower shifts", () => {
    const fast = applyFastEmotionUpdate(
      createHeartEmotionState({ tick: 0 }),
      baseInput({
        eventId: "fast-spike",
        tick: 1,
        goalRelevance: 0.82,
        goalCongruence: -0.84,
        certainty: 0.83,
        controllability: 0.18,
        responsibility: {
          self: 0.08,
          other: 0.84,
          environment: 0.08,
        },
        relationshipCloseness: 0.44,
        normViolation: 0.61,
        publicEmbarrassmentRisk: 0.11,
      }),
    );
    const slow = applySlowEmotionUpdate(
      fast.state,
      baseInput({
        eventId: "slow-burn",
        tick: 2,
        goalRelevance: 0.67,
        goalCongruence: -0.48,
        certainty: 0.81,
        controllability: 0.42,
        responsibility: {
          self: 0.1,
          other: 0.77,
          environment: 0.13,
        },
        relationshipCloseness: 0.71,
        normViolation: 0.74,
        publicEmbarrassmentRisk: 0.14,
      }),
    );
    const decayed = decayHeartEmotionState(slow.state, 12);

    expect(Math.abs(decayed.fastPad.arousal)).toBeLessThan(
      Math.abs(slow.state.fastPad.arousal),
    );
    expect(Math.abs(decayed.slowPad.arousal)).toBeGreaterThan(0);
    expect(Math.abs(decayed.slowPad.arousal)).toBeGreaterThan(
      Math.abs(decayed.fastPad.arousal),
    );
  });
});
