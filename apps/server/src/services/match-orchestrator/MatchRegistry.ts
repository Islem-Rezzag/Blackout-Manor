import type { MatchId } from "@blackout-manor/shared";

import type { MatchLifecycleStatus, RegisteredMatch } from "./types";

export class MatchRegistry {
  readonly #matchesById = new Map<MatchId, RegisteredMatch>();
  readonly #roomIdByMatchId = new Map<MatchId, string>();

  register(match: Omit<RegisteredMatch, "createdAt" | "updatedAt">) {
    const timestamp = new Date().toISOString();
    const registered: RegisteredMatch = {
      ...match,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.#matchesById.set(registered.matchId, registered);
    this.#roomIdByMatchId.set(registered.matchId, registered.roomId);

    return registered;
  }

  getByMatchId(matchId: MatchId) {
    return this.#matchesById.get(matchId) ?? null;
  }

  getRoomId(matchId: MatchId) {
    return this.#roomIdByMatchId.get(matchId) ?? null;
  }

  updateStatus(
    matchId: MatchId,
    status: MatchLifecycleStatus,
    extra?: Partial<Pick<RegisteredMatch, "replayId">>,
  ) {
    const existing = this.#matchesById.get(matchId);

    if (!existing) {
      return null;
    }

    const updated: RegisteredMatch = {
      ...existing,
      ...extra,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.#matchesById.set(matchId, updated);
    return updated;
  }

  unregister(matchId: MatchId) {
    const existing = this.#matchesById.get(matchId);

    if (!existing) {
      return null;
    }

    this.#matchesById.delete(matchId);
    this.#roomIdByMatchId.delete(matchId);
    return existing;
  }

  list() {
    return [...this.#matchesById.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }
}
