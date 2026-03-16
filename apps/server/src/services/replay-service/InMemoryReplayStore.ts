import type { EngineReplayLog } from "@blackout-manor/engine";
import type { MatchId, ReplayEnvelope, ReplayId } from "@blackout-manor/shared";

import { createReplayEnvelopeFromEngineReplay } from "../match-orchestrator/matchAdapters";

export class InMemoryReplayStore {
  readonly #byReplayId = new Map<ReplayId, ReplayEnvelope>();
  readonly #replayIdByMatchId = new Map<MatchId, ReplayId>();

  save(engineReplay: EngineReplayLog, createdAt?: string) {
    const replay = createReplayEnvelopeFromEngineReplay(
      engineReplay,
      createdAt,
    );

    this.#byReplayId.set(replay.replayId, replay);
    this.#replayIdByMatchId.set(replay.matchId, replay.replayId);

    return replay;
  }

  getByReplayId(replayId: ReplayId) {
    return this.#byReplayId.get(replayId) ?? null;
  }

  getByMatchId(matchId: MatchId) {
    const replayId = this.#replayIdByMatchId.get(matchId);

    if (!replayId) {
      return null;
    }

    return this.#byReplayId.get(replayId) ?? null;
  }
}
