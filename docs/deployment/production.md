# Production Deployment

## Target Shape
- `apps/web` runs as the public Next.js frontend.
- `apps/server` runs as the authoritative Colyseus and admin API process.
- PostgreSQL stores match, replay, and leaderboard metadata.
- Redis is optional for local parity and future coordination work, but PostgreSQL is the production requirement today.

## Required Environment
```bash
NODE_ENV=production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:password@host:5432/blackout_manor
ADMIN_API_TOKEN=replace-with-a-strong-secret
OPENAI_API_KEY=replace-with-a-project-key
MATCH_SERVER_PORT=2567
NEXT_PUBLIC_MATCH_SERVER_URL=https://your-server-host
```

## Build
```bash
pnpm install --frozen-lockfile
pnpm ci:quality
pnpm build
```

## Run
```bash
pnpm --filter @blackout-manor/server start
pnpm --filter @blackout-manor/web start
```

## Operational Notes
- Keep admin routes behind `ADMIN_API_TOKEN`.
- Do not use SQLite in production.
- Record the official model pack ID for every public season so fairness reports remain reproducible.
- Keep replay JSON storage and asset hosting separate from code deployment when traffic grows.

## Recommended Rollout
1. Provision PostgreSQL.
2. Set production environment variables for both apps.
3. Build and deploy the server.
4. Build and deploy the web app with `NEXT_PUBLIC_MATCH_SERVER_URL` pointed at the server.
5. Run a bot-only room and verify replay download plus leaderboard writes before opening public traffic.
