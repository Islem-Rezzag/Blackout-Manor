import type { PhaseId } from "@blackout-manor/shared";

// The existing mock's 28-tick cycle, not the deterministic engine's phase budget.
export const DEMO_PHASES: readonly {
  phase: PhaseId;
  start: number;
  end: number;
}[] = [
  { phase: "intro", start: 0, end: 2 },
  { phase: "roam", start: 2, end: 14 },
  { phase: "report", start: 14, end: 16 },
  { phase: "meeting", start: 16, end: 21 },
  { phase: "vote", start: 21, end: 24 },
  { phase: "reveal", start: 24, end: 26 },
  { phase: "roam", start: 26, end: 28 },
];

export const getDemoPhase = (tick: number) => {
  const cycleTick = Math.max(0, tick) % 28;
  const segment = DEMO_PHASES.find(
    (phase) => cycleTick >= phase.start && cycleTick < phase.end,
  );
  if (!segment) throw new Error("Invalid demo tick.");
  return { ...segment, cycleTick };
};
