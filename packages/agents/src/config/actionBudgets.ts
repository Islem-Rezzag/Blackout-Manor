import type { PhaseId } from "@blackout-manor/shared";

export type PhaseActionBudget = {
  maxVisibleEvents: number;
  maxRecentClaims: number;
  maxMemories: number;
  maxPrivateSummaries: number;
  maxCandidateActions: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retryCount: number;
};

const DEFAULT_BUDGET: PhaseActionBudget = {
  maxVisibleEvents: 6,
  maxRecentClaims: 4,
  maxMemories: 4,
  maxPrivateSummaries: 3,
  maxCandidateActions: 10,
  maxOutputTokens: 220,
  timeoutMs: 4_500,
  retryCount: 1,
};

export const ACTION_BUDGETS_BY_PHASE: Record<PhaseId, PhaseActionBudget> = {
  intro: {
    ...DEFAULT_BUDGET,
    maxCandidateActions: 1,
    maxOutputTokens: 120,
  },
  roam: {
    ...DEFAULT_BUDGET,
    maxVisibleEvents: 6,
    maxMemories: 5,
    maxCandidateActions: 14,
    maxOutputTokens: 220,
    timeoutMs: 5_000,
    retryCount: 2,
  },
  report: {
    ...DEFAULT_BUDGET,
    maxVisibleEvents: 8,
    maxRecentClaims: 6,
    maxMemories: 6,
    maxCandidateActions: 8,
    maxOutputTokens: 240,
    timeoutMs: 5_500,
    retryCount: 2,
  },
  meeting: {
    ...DEFAULT_BUDGET,
    maxVisibleEvents: 8,
    maxRecentClaims: 8,
    maxMemories: 6,
    maxPrivateSummaries: 4,
    maxCandidateActions: 16,
    maxOutputTokens: 260,
    timeoutMs: 6_000,
    retryCount: 2,
  },
  vote: {
    ...DEFAULT_BUDGET,
    maxVisibleEvents: 5,
    maxRecentClaims: 6,
    maxMemories: 5,
    maxCandidateActions: 10,
    maxOutputTokens: 180,
    timeoutMs: 4_500,
    retryCount: 1,
  },
  reveal: {
    ...DEFAULT_BUDGET,
    maxCandidateActions: 1,
    maxOutputTokens: 120,
  },
  reflection: {
    ...DEFAULT_BUDGET,
    maxCandidateActions: 1,
    maxOutputTokens: 120,
  },
  resolution: {
    ...DEFAULT_BUDGET,
    maxCandidateActions: 1,
    maxOutputTokens: 120,
  },
};

export const getActionBudgetForPhase = (phaseId: PhaseId) =>
  ACTION_BUDGETS_BY_PHASE[phaseId];
