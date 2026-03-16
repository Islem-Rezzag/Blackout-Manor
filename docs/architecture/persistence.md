# Persistence

## Local Path

Local development defaults to SQLite with the database file at `.local/blackout-manor-dev.sqlite`.

That means:
- `pnpm server:start` works without Docker, Postgres, or Redis.
- Match metadata, replay metadata, and leaderboard rows are persisted locally.
- Tests can switch to `:memory:` SQLite for isolated runs.

## Production Path

Production uses PostgreSQL.

Required environment variables:
- `DATABASE_PROVIDER=postgresql`
- `DATABASE_URL=postgresql://user:password@host:5432/blackout_manor`
- `ADMIN_API_TOKEN=<strong-secret>`

The server bootstraps the following tables on startup:
- `match_metadata`
- `replay_metadata`
- `leaderboard_entries`

## Stored Data

`match_metadata`
- room and match identifiers
- seed and speed profile
- lifecycle status
- replay linkage
- winner and timing metadata

`replay_metadata`
- replay and match identifiers
- seed
- winner
- highlight and event counts
- full saved replay JSON payload

`leaderboard_entries`
- per-season aggregate stats
- matches, wins, losses
- survival and exile counts
- side-specific totals for household and shadow

## Admin Surface

Admin APIs are token-guarded and read from persistence for:
- match listings
- replay listings
- replay JSON download
- metrics snapshots
- leaderboard lookup
