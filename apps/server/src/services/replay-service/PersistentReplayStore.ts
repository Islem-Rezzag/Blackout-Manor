import type {
  BlackoutManorDatabase,
  ReplayMetadataRecord,
  ReplayRecord,
} from "@blackout-manor/db";
import type { EngineReplayLog } from "@blackout-manor/engine";
import {
  createSavedReplayEnvelope,
  deserializeSavedReplayEnvelope,
  type SavedReplayEnvelope,
  serializeSavedReplayEnvelope,
} from "@blackout-manor/replay-viewer";
import type { MatchId, ReplayEnvelope, ReplayId } from "@blackout-manor/shared";

import { createReplayEnvelopeFromEngineReplay } from "../match-orchestrator/matchAdapters";

type CachedReplay = {
  protocolReplay: ReplayEnvelope;
  savedReplay: SavedReplayEnvelope;
  payloadJson: string;
};

type ReplayStoreSaveResult = {
  replay: ReplayEnvelope;
  savedReplay: SavedReplayEnvelope;
  payloadJson: string;
};

export class PersistentReplayStore {
  readonly #database: BlackoutManorDatabase;
  readonly #cacheByReplayId = new Map<ReplayId, CachedReplay>();
  readonly #replayIdByMatchId = new Map<MatchId, ReplayId>();

  constructor(database: BlackoutManorDatabase) {
    this.#database = database;
  }

  async save(
    engineReplay: EngineReplayLog,
    createdAt?: string,
  ): Promise<ReplayStoreSaveResult> {
    const savedReplay = createSavedReplayEnvelope(engineReplay, {
      ...(createdAt ? { exportedAt: createdAt } : {}),
    });
    const payloadJson = serializeSavedReplayEnvelope(savedReplay);

    await this.#database.saveReplayRecord({
      replayId: savedReplay.summary.replayId,
      matchId: savedReplay.summary.matchId,
      seed: savedReplay.summary.seed,
      winnerTeam: savedReplay.summary.winner?.team ?? null,
      highlightCount: savedReplay.highlights.length,
      finalTick: savedReplay.summary.finalTick,
      totalEvents: savedReplay.summary.totalEvents,
      payloadJson,
    });

    const cached = this.#cacheReplayPayload(payloadJson);

    return {
      replay: cached.protocolReplay,
      savedReplay: cached.savedReplay,
      payloadJson: cached.payloadJson,
    };
  }

  async getByReplayId(replayId: ReplayId): Promise<ReplayEnvelope | null> {
    const cached = this.#cacheByReplayId.get(replayId);

    if (cached) {
      return cached.protocolReplay;
    }

    const replayRecord = await this.#database.getReplayRecordById(replayId);
    return replayRecord
      ? this.#hydrateRecord(replayRecord).protocolReplay
      : null;
  }

  async getByMatchId(matchId: MatchId): Promise<ReplayEnvelope | null> {
    const replayId = this.#replayIdByMatchId.get(matchId);

    if (replayId) {
      const cached = this.#cacheByReplayId.get(replayId);

      if (cached) {
        return cached.protocolReplay;
      }
    }

    const replayRecord = await this.#database.getReplayRecordByMatchId(matchId);
    return replayRecord
      ? this.#hydrateRecord(replayRecord).protocolReplay
      : null;
  }

  async getPayloadByReplayId(replayId: ReplayId): Promise<string | null> {
    const cached = this.#cacheByReplayId.get(replayId);

    if (cached) {
      return cached.payloadJson;
    }

    const replayRecord = await this.#database.getReplayRecordById(replayId);
    return replayRecord ? this.#hydrateRecord(replayRecord).payloadJson : null;
  }

  async listMetadata(): Promise<ReplayMetadataRecord[]> {
    return this.#database.listReplayMetadata();
  }

  #hydrateRecord(replayRecord: ReplayRecord) {
    return this.#cacheReplayPayload(replayRecord.payloadJson);
  }

  #cacheReplayPayload(payloadJson: string): CachedReplay {
    const savedReplay = deserializeSavedReplayEnvelope(payloadJson);
    const protocolReplay = createReplayEnvelopeFromEngineReplay(
      savedReplay.replay,
      savedReplay.exportedAt,
    );
    const cached: CachedReplay = {
      protocolReplay,
      savedReplay,
      payloadJson,
    };

    this.#cacheByReplayId.set(protocolReplay.replayId, cached);
    this.#replayIdByMatchId.set(
      protocolReplay.matchId,
      protocolReplay.replayId,
    );

    return cached;
  }
}
