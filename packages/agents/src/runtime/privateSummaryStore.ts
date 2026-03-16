import type { PlayerId } from "@blackout-manor/shared";

const MAX_SUMMARY_LENGTH = 280;

export class AgentPrivateSummaryStore {
  readonly #summariesByPlayerId = new Map<PlayerId, string[]>();

  constructor(private readonly maxEntriesPerPlayer = 6) {}

  getRecent(playerId: PlayerId, maxEntries = this.maxEntriesPerPlayer) {
    return [...(this.#summariesByPlayerId.get(playerId) ?? [])].slice(
      -maxEntries,
    );
  }

  store(playerId: PlayerId, summary: string | undefined) {
    if (!summary) {
      return;
    }

    const compactSummary = summary.trim().slice(0, MAX_SUMMARY_LENGTH);

    if (!compactSummary) {
      return;
    }

    const existing = this.#summariesByPlayerId.get(playerId) ?? [];
    const next = [...existing, compactSummary].slice(-this.maxEntriesPerPlayer);
    this.#summariesByPlayerId.set(playerId, next);
  }
}
