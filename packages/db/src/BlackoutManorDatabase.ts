import { Pool } from "pg";

import type {
  DatabaseConfig,
  LeaderboardDelta,
  LeaderboardEntryRecord,
  MatchMetadataInput,
  MatchMetadataPatch,
  MatchMetadataRecord,
  MetricsSnapshot,
  ReplayMetadataInput,
  ReplayMetadataRecord,
  ReplayRecord,
  WinnerTeam,
} from "./types";

type Row = Record<string, unknown>;
type SqliteBindValue = string | number | bigint | Uint8Array | DataView | null;
type DatabaseSyncType = import("node:sqlite").DatabaseSync;
const SQLITE_MODULE_ID = "node:sqlite";

const CREATE_MATCH_METADATA_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS match_metadata (
    match_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    bot_only INTEGER NOT NULL,
    seed INTEGER NOT NULL,
    speed_profile_id TEXT NOT NULL,
    status TEXT NOT NULL,
    source_lobby_room_id TEXT,
    replay_id TEXT,
    winner_team TEXT,
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

const CREATE_REPLAY_METADATA_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS replay_metadata (
    replay_id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL UNIQUE,
    seed INTEGER NOT NULL,
    winner_team TEXT,
    highlight_count INTEGER NOT NULL,
    final_tick INTEGER NOT NULL,
    total_events INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`;

const CREATE_LEADERBOARD_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS leaderboard_entries (
    season_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    matches_played INTEGER NOT NULL,
    wins INTEGER NOT NULL,
    losses INTEGER NOT NULL,
    survival_count INTEGER NOT NULL,
    exile_count INTEGER NOT NULL,
    household_matches INTEGER NOT NULL,
    shadow_matches INTEGER NOT NULL,
    household_wins INTEGER NOT NULL,
    shadow_wins INTEGER NOT NULL,
    last_match_id TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (season_id, player_id)
  );
`;

const toBoolean = (value: unknown) => value === true || value === 1;

const toNullableWinner = (value: unknown): WinnerTeam =>
  value === "household" || value === "shadow" ? value : null;

const toNumber = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value : String(value ?? "");

const mapMatchMetadataRow = (row: Row): MatchMetadataRecord => ({
  matchId: toStringValue(row.matchId),
  roomId: toStringValue(row.roomId),
  roomName: toStringValue(row.roomName),
  botOnly: toBoolean(row.botOnly),
  seed: toNumber(row.seed),
  speedProfileId: toStringValue(row.speedProfileId),
  status: toStringValue(row.status) as MatchMetadataRecord["status"],
  sourceLobbyRoomId:
    typeof row.sourceLobbyRoomId === "string" ? row.sourceLobbyRoomId : null,
  replayId: typeof row.replayId === "string" ? row.replayId : null,
  winnerTeam: toNullableWinner(row.winnerTeam),
  startedAt: typeof row.startedAt === "string" ? row.startedAt : null,
  endedAt: typeof row.endedAt === "string" ? row.endedAt : null,
  createdAt: toStringValue(row.createdAt),
  updatedAt: toStringValue(row.updatedAt),
});

const mapReplayRow = (row: Row): ReplayRecord => ({
  replayId: toStringValue(row.replayId),
  matchId: toStringValue(row.matchId),
  seed: toNumber(row.seed),
  winnerTeam: toNullableWinner(row.winnerTeam),
  highlightCount: toNumber(row.highlightCount),
  finalTick: toNumber(row.finalTick),
  totalEvents: toNumber(row.totalEvents),
  payloadJson: toStringValue(row.payloadJson),
  createdAt: toStringValue(row.createdAt),
});

const mapReplayMetadataRow = (row: Row): ReplayMetadataRecord => {
  const replay = mapReplayRow(row);

  return {
    replayId: replay.replayId,
    matchId: replay.matchId,
    seed: replay.seed,
    winnerTeam: replay.winnerTeam,
    highlightCount: replay.highlightCount,
    finalTick: replay.finalTick,
    totalEvents: replay.totalEvents,
    createdAt: replay.createdAt,
  };
};

const mapLeaderboardRow = (row: Row): LeaderboardEntryRecord => ({
  seasonId: toStringValue(row.seasonId),
  playerId: toStringValue(row.playerId),
  displayName: toStringValue(row.displayName),
  matchesPlayed: toNumber(row.matchesPlayed),
  wins: toNumber(row.wins),
  losses: toNumber(row.losses),
  survivalCount: toNumber(row.survivalCount),
  exileCount: toNumber(row.exileCount),
  householdMatches: toNumber(row.householdMatches),
  shadowMatches: toNumber(row.shadowMatches),
  householdWins: toNumber(row.householdWins),
  shadowWins: toNumber(row.shadowWins),
  lastMatchId: typeof row.lastMatchId === "string" ? row.lastMatchId : null,
  updatedAt: toStringValue(row.updatedAt),
});

export class BlackoutManorDatabase {
  readonly #config: DatabaseConfig;
  #sqlite: DatabaseSyncType | null = null;
  #postgres: Pool | null = null;

  constructor(config: DatabaseConfig) {
    this.#config = config;
  }

  get config() {
    return this.#config;
  }

  async initialize() {
    if (this.#config.provider === "sqlite") {
      const { DatabaseSync } = await import(SQLITE_MODULE_ID);
      const sqlite = new DatabaseSync(this.#config.connectionString);

      this.#sqlite = sqlite;
      sqlite.exec(CREATE_MATCH_METADATA_TABLE_SQL);
      sqlite.exec(CREATE_REPLAY_METADATA_TABLE_SQL);
      sqlite.exec(CREATE_LEADERBOARD_TABLE_SQL);
      return this;
    }

    this.#postgres = new Pool({
      connectionString: this.#config.connectionString,
    });
    await this.#postgres.query(CREATE_MATCH_METADATA_TABLE_SQL);
    await this.#postgres.query(CREATE_REPLAY_METADATA_TABLE_SQL);
    await this.#postgres.query(CREATE_LEADERBOARD_TABLE_SQL);
    return this;
  }

  async close() {
    this.#sqlite?.close();
    this.#sqlite = null;

    if (this.#postgres) {
      await this.#postgres.end();
      this.#postgres = null;
    }
  }

  async upsertMatchMetadata(
    input: MatchMetadataInput,
  ): Promise<MatchMetadataRecord> {
    const existing = await this.getMatchMetadata(input.matchId);
    const now = new Date().toISOString();
    const record: MatchMetadataRecord = {
      ...input,
      sourceLobbyRoomId: input.sourceLobbyRoomId ?? null,
      replayId: input.replayId ?? existing?.replayId ?? null,
      winnerTeam: input.winnerTeam ?? existing?.winnerTeam ?? null,
      startedAt: input.startedAt ?? existing?.startedAt ?? now,
      endedAt: input.endedAt ?? existing?.endedAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.#execute(
      `
        INSERT INTO match_metadata (
          match_id,
          room_id,
          room_name,
          bot_only,
          seed,
          speed_profile_id,
          status,
          source_lobby_room_id,
          replay_id,
          winner_team,
          started_at,
          ended_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(match_id) DO UPDATE SET
          room_id = excluded.room_id,
          room_name = excluded.room_name,
          bot_only = excluded.bot_only,
          seed = excluded.seed,
          speed_profile_id = excluded.speed_profile_id,
          status = excluded.status,
          source_lobby_room_id = excluded.source_lobby_room_id,
          replay_id = excluded.replay_id,
          winner_team = excluded.winner_team,
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `,
      [
        record.matchId,
        record.roomId,
        record.roomName,
        record.botOnly ? 1 : 0,
        record.seed,
        record.speedProfileId,
        record.status,
        record.sourceLobbyRoomId,
        record.replayId,
        record.winnerTeam,
        record.startedAt,
        record.endedAt,
        record.createdAt,
        record.updatedAt,
      ],
    );

    return record;
  }

  async getMatchMetadata(matchId: string): Promise<MatchMetadataRecord | null> {
    const row = await this.#queryFirst(
      `
        SELECT
          match_id AS "matchId",
          room_id AS "roomId",
          room_name AS "roomName",
          bot_only AS "botOnly",
          seed AS "seed",
          speed_profile_id AS "speedProfileId",
          status AS "status",
          source_lobby_room_id AS "sourceLobbyRoomId",
          replay_id AS "replayId",
          winner_team AS "winnerTeam",
          started_at AS "startedAt",
          ended_at AS "endedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM match_metadata
        WHERE match_id = ?
      `,
      [matchId],
    );

    return row ? mapMatchMetadataRow(row) : null;
  }

  async listMatchMetadata(): Promise<MatchMetadataRecord[]> {
    const rows = await this.#queryAll(
      `
        SELECT
          match_id AS "matchId",
          room_id AS "roomId",
          room_name AS "roomName",
          bot_only AS "botOnly",
          seed AS "seed",
          speed_profile_id AS "speedProfileId",
          status AS "status",
          source_lobby_room_id AS "sourceLobbyRoomId",
          replay_id AS "replayId",
          winner_team AS "winnerTeam",
          started_at AS "startedAt",
          ended_at AS "endedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM match_metadata
        ORDER BY created_at DESC
      `,
      [],
    );

    return rows.map(mapMatchMetadataRow);
  }

  async updateMatchMetadata(
    matchId: string,
    patch: MatchMetadataPatch,
  ): Promise<MatchMetadataRecord | null> {
    const existing = await this.getMatchMetadata(matchId);

    if (!existing) {
      return null;
    }

    const nextInput: MatchMetadataInput = {
      matchId: existing.matchId,
      roomId: existing.roomId,
      roomName: existing.roomName,
      botOnly: existing.botOnly,
      seed: existing.seed,
      speedProfileId: existing.speedProfileId,
      status: patch.status ?? existing.status,
      winnerTeam:
        patch.winnerTeam === undefined ? existing.winnerTeam : patch.winnerTeam,
      ...(patch.sourceLobbyRoomId !== undefined
        ? { sourceLobbyRoomId: patch.sourceLobbyRoomId ?? undefined }
        : existing.sourceLobbyRoomId
          ? { sourceLobbyRoomId: existing.sourceLobbyRoomId }
          : {}),
      ...(patch.replayId !== undefined
        ? { replayId: patch.replayId ?? undefined }
        : existing.replayId
          ? { replayId: existing.replayId }
          : {}),
      ...(patch.startedAt !== undefined
        ? { startedAt: patch.startedAt ?? undefined }
        : existing.startedAt
          ? { startedAt: existing.startedAt }
          : {}),
      ...(patch.endedAt !== undefined
        ? { endedAt: patch.endedAt ?? undefined }
        : existing.endedAt
          ? { endedAt: existing.endedAt }
          : {}),
    };

    return this.upsertMatchMetadata(nextInput);
  }

  async saveReplayRecord(input: ReplayMetadataInput): Promise<ReplayRecord> {
    const existing = await this.getReplayRecordById(input.replayId);
    const record: ReplayRecord = {
      ...input,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    await this.#execute(
      `
        INSERT INTO replay_metadata (
          replay_id,
          match_id,
          seed,
          winner_team,
          highlight_count,
          final_tick,
          total_events,
          payload_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(replay_id) DO UPDATE SET
          match_id = excluded.match_id,
          seed = excluded.seed,
          winner_team = excluded.winner_team,
          highlight_count = excluded.highlight_count,
          final_tick = excluded.final_tick,
          total_events = excluded.total_events,
          payload_json = excluded.payload_json,
          created_at = excluded.created_at
      `,
      [
        record.replayId,
        record.matchId,
        record.seed,
        record.winnerTeam,
        record.highlightCount,
        record.finalTick,
        record.totalEvents,
        record.payloadJson,
        record.createdAt,
      ],
    );

    return record;
  }

  async getReplayRecordById(replayId: string): Promise<ReplayRecord | null> {
    const row = await this.#queryFirst(
      `
        SELECT
          replay_id AS "replayId",
          match_id AS "matchId",
          seed AS "seed",
          winner_team AS "winnerTeam",
          highlight_count AS "highlightCount",
          final_tick AS "finalTick",
          total_events AS "totalEvents",
          payload_json AS "payloadJson",
          created_at AS "createdAt"
        FROM replay_metadata
        WHERE replay_id = ?
      `,
      [replayId],
    );

    return row ? mapReplayRow(row) : null;
  }

  async getReplayRecordByMatchId(
    matchId: string,
  ): Promise<ReplayRecord | null> {
    const row = await this.#queryFirst(
      `
        SELECT
          replay_id AS "replayId",
          match_id AS "matchId",
          seed AS "seed",
          winner_team AS "winnerTeam",
          highlight_count AS "highlightCount",
          final_tick AS "finalTick",
          total_events AS "totalEvents",
          payload_json AS "payloadJson",
          created_at AS "createdAt"
        FROM replay_metadata
        WHERE match_id = ?
      `,
      [matchId],
    );

    return row ? mapReplayRow(row) : null;
  }

  async listReplayMetadata(): Promise<ReplayMetadataRecord[]> {
    const rows = await this.#queryAll(
      `
        SELECT
          replay_id AS "replayId",
          match_id AS "matchId",
          seed AS "seed",
          winner_team AS "winnerTeam",
          highlight_count AS "highlightCount",
          final_tick AS "finalTick",
          total_events AS "totalEvents",
          payload_json AS "payloadJson",
          created_at AS "createdAt"
        FROM replay_metadata
        ORDER BY created_at DESC
      `,
      [],
    );

    return rows.map(mapReplayMetadataRow);
  }

  async applyLeaderboardDeltas(
    deltas: readonly LeaderboardDelta[],
  ): Promise<void> {
    for (const delta of deltas) {
      const now = new Date().toISOString();

      await this.#execute(
        `
          INSERT INTO leaderboard_entries (
            season_id,
            player_id,
            display_name,
            matches_played,
            wins,
            losses,
            survival_count,
            exile_count,
            household_matches,
            shadow_matches,
            household_wins,
            shadow_wins,
            last_match_id,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(season_id, player_id) DO UPDATE SET
            display_name = excluded.display_name,
            matches_played = leaderboard_entries.matches_played + excluded.matches_played,
            wins = leaderboard_entries.wins + excluded.wins,
            losses = leaderboard_entries.losses + excluded.losses,
            survival_count = leaderboard_entries.survival_count + excluded.survival_count,
            exile_count = leaderboard_entries.exile_count + excluded.exile_count,
            household_matches = leaderboard_entries.household_matches + excluded.household_matches,
            shadow_matches = leaderboard_entries.shadow_matches + excluded.shadow_matches,
            household_wins = leaderboard_entries.household_wins + excluded.household_wins,
            shadow_wins = leaderboard_entries.shadow_wins + excluded.shadow_wins,
            last_match_id = excluded.last_match_id,
            updated_at = excluded.updated_at
        `,
        [
          delta.seasonId,
          delta.playerId,
          delta.displayName,
          1,
          delta.didWin ? 1 : 0,
          delta.didWin ? 0 : 1,
          delta.survived ? 1 : 0,
          delta.wasExiled ? 1 : 0,
          delta.side === "household" ? 1 : 0,
          delta.side === "shadow" ? 1 : 0,
          delta.side === "household" && delta.didWin ? 1 : 0,
          delta.side === "shadow" && delta.didWin ? 1 : 0,
          delta.matchId,
          now,
        ],
      );
    }
  }

  async listLeaderboard(seasonId: string): Promise<LeaderboardEntryRecord[]> {
    const rows = await this.#queryAll(
      `
        SELECT
          season_id AS "seasonId",
          player_id AS "playerId",
          display_name AS "displayName",
          matches_played AS "matchesPlayed",
          wins AS "wins",
          losses AS "losses",
          survival_count AS "survivalCount",
          exile_count AS "exileCount",
          household_matches AS "householdMatches",
          shadow_matches AS "shadowMatches",
          household_wins AS "householdWins",
          shadow_wins AS "shadowWins",
          last_match_id AS "lastMatchId",
          updated_at AS "updatedAt"
        FROM leaderboard_entries
        WHERE season_id = ?
        ORDER BY wins DESC, matches_played DESC, display_name ASC
      `,
      [seasonId],
    );

    return rows.map(mapLeaderboardRow);
  }

  async getMetricsSnapshot(): Promise<MetricsSnapshot> {
    const totalMatches = await this.#countRows("match_metadata");
    const replayCount = await this.#countRows("replay_metadata");
    const leaderboardEntries = await this.#countRows("leaderboard_entries");
    const activeMatches = await this.#countRows(
      "match_metadata",
      `status IN ('staging', 'running', 'paused')`,
    );
    const completedMatches = await this.#countRows(
      "match_metadata",
      `status = 'completed'`,
    );
    const terminatedMatches = await this.#countRows(
      "match_metadata",
      `status = 'terminated'`,
    );

    return {
      totalMatches,
      activeMatches,
      completedMatches,
      terminatedMatches,
      replayCount,
      leaderboardEntries,
    };
  }

  async #countRows(tableName: string, whereClause?: string) {
    const row = await this.#queryFirst(
      `
        SELECT COUNT(*) AS "count"
        FROM ${tableName}
        ${whereClause ? `WHERE ${whereClause}` : ""}
      `,
      [],
    );

    return toNumber(row?.count ?? 0);
  }

  async #execute(sqliteSql: string, values: readonly unknown[]) {
    if (this.#sqlite) {
      const sqliteValues = [...values] as SqliteBindValue[];
      this.#sqlite.prepare(sqliteSql).run(...sqliteValues);
      return;
    }

    const postgres = this.#requirePostgres();
    const { text, params } = this.#toPostgresQuery(sqliteSql, values);
    await postgres.query(text, params);
  }

  async #queryFirst(sqliteSql: string, values: readonly unknown[]) {
    if (this.#sqlite) {
      const sqliteValues = [...values] as SqliteBindValue[];
      const row = this.#sqlite.prepare(sqliteSql).get(...sqliteValues);
      return (row ?? null) as Row | null;
    }

    const postgres = this.#requirePostgres();
    const { text, params } = this.#toPostgresQuery(sqliteSql, values);
    const result = await postgres.query<Row>(text, params);
    return result.rows[0] ?? null;
  }

  async #queryAll(sqliteSql: string, values: readonly unknown[]) {
    if (this.#sqlite) {
      const sqliteValues = [...values] as SqliteBindValue[];
      return this.#sqlite.prepare(sqliteSql).all(...sqliteValues) as Row[];
    }

    const postgres = this.#requirePostgres();
    const { text, params } = this.#toPostgresQuery(sqliteSql, values);
    const result = await postgres.query<Row>(text, params);
    return result.rows;
  }

  #requirePostgres() {
    if (!this.#postgres) {
      throw new Error("PostgreSQL client is not initialized.");
    }

    return this.#postgres;
  }

  #toPostgresQuery(sqliteSql: string, values: readonly unknown[]) {
    let index = 0;
    const text = sqliteSql.replaceAll(/\?/g, () => {
      index += 1;
      return `$${index}`;
    });

    return {
      text,
      params: [...values],
    };
  }
}
