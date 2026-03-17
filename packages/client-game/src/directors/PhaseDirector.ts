import type { ClientGameState } from "../types";
import type { ReplayPresentation, RuntimeSceneId } from "./types";

const MEETING_PHASES = new Set(["meeting", "vote", "reveal"]);

export class PhaseDirector {
  resolveScene(
    state: ClientGameState,
    replayPresentation: ReplayPresentation | null,
  ): RuntimeSceneId {
    if (state.mode === "replay" || replayPresentation !== null) {
      return "replay";
    }

    const phaseId = state.snapshot?.phaseId;

    if (phaseId === "resolution") {
      return "endgame";
    }

    if (phaseId && MEETING_PHASES.has(phaseId)) {
      return "meeting";
    }

    return "manor-world";
  }
}
