import type { MatchSnapshot, PhaseId } from "@blackout-manor/shared";
import type { ClientGameConnectionMode } from "../types";
import type { DemoPlaybackState } from "./DemoPlaybackClock";
import { getDemoPhase } from "./demoTimeline";

export const PHASE_LABELS: Record<PhaseId, string> = {
  intro: "Arrivals",
  roam: "Explore",
  report: "Report",
  meeting: "Discussion",
  vote: "Vote",
  reveal: "Reveal",
  reflection: "Reflection",
  resolution: "Resolution",
};

export const formatSessionTime = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

export type SessionPresentation = {
  mode: ClientGameConnectionMode;
  status: "ready" | "playing" | "paused" | "live" | "closed";
  clock: string;
  clockLabel: string;
  detail: string;
  phase: PhaseId;
  phaseProgress: number | null;
  speed: number;
  canControl: boolean;
  frameIndex: number;
  totalFrames: number;
};

export const deriveSessionPresentation = (options: {
  mode: ClientGameConnectionMode;
  snapshot: MatchSnapshot | null;
  demo?: DemoPlaybackState;
  replay?: {
    playing: boolean;
    speed: number;
    frameIndex: number;
    totalFrames: number;
  };
}): SessionPresentation => {
  const { mode, snapshot, demo, replay } = options;
  const base: SessionPresentation = {
    mode,
    status: "live",
    clock: String(snapshot?.tick ?? 0).padStart(3, "0"),
    clockLabel: "Server tick",
    detail: snapshot ? "Server-controlled match" : "Connecting to the manor",
    phase: snapshot?.phaseId ?? "intro",
    phaseProgress: null,
    speed: 1,
    canControl: false,
    frameIndex: 0,
    totalFrames: 0,
  };
  if (mode === "mock" && demo) {
    const tick = snapshot?.tick ?? 0;
    const phase = getDemoPhase(tick);
    const phaseTicks = phase.cycleTick - phase.start + demo.tickFraction;
    return {
      ...base,
      status: demo.status,
      clock: formatSessionTime((tick + demo.tickFraction) * demo.tickMs),
      clockLabel: "Demo time",
      detail:
        demo.status === "ready"
          ? "Local demo / Ready to begin"
          : demo.status === "paused"
            ? "Local demo / Paused"
            : `Next phase in ${formatSessionTime(Math.ceil(((phase.end - phase.start - phaseTicks) * demo.tickMs) / demo.speed / 1000) * 1000)}`,
      phaseProgress: Math.min(
        1,
        Math.max(0, phaseTicks / (phase.end - phase.start)),
      ),
      speed: demo.speed,
      canControl: Boolean(snapshot) && demo.status !== "closed",
    };
  }
  if (mode === "replay" && replay) {
    return {
      ...base,
      status: replay.playing ? "playing" : "paused",
      clock: `${replay.frameIndex + 1} / ${replay.totalFrames}`,
      clockLabel: "Archive frame",
      detail: `Recorded tick ${snapshot?.tick ?? 0}`,
      speed: replay.speed,
      canControl: replay.totalFrames > 0,
      frameIndex: replay.frameIndex,
      totalFrames: replay.totalFrames,
    };
  }
  return base;
};
