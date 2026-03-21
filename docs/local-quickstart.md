# Local Quickstart

## Prerequisites
- Node.js 22+
- `pnpm` 10.32.1 via Corepack

## Install
```bash
corepack prepare pnpm@10.32.1 --activate
pnpm install
```

Copy `.env.example` to `.env` with your shell of choice.

## Start the Apps
```bash
pnpm dev
```

The web app runs on `http://127.0.0.1:3000`. The Colyseus server runs on port `2567` unless overridden.

## Route Map
- `http://127.0.0.1:3000/game/[roomId]`: primary live route
- `http://127.0.0.1:3000/game`: bootstrap route for a demo or local room
- `http://127.0.0.1:3000/play`: compatibility route only
- `http://127.0.0.1:3000/dev/play?view=replay`: replay-oriented dev route

## Run a Local 10-Agent Replay
```bash
pnpm sim --seed 42 --mode fast
pnpm replay:open artifacts/replays/fast-42.replay.json
```

Open `http://127.0.0.1:3000/dev/play?view=replay&source=open` to inspect the staged replay in the runtime.

## Run a Local Bot Room
```bash
pnpm server:bot-match -- --seed 42
```

## Validate Your Checkout
```bash
pnpm ci:quality
pnpm test:e2e
pnpm fairness:check
```

## Generate Fairness And EQ Reports
```bash
pnpm fairness:report
```

This refreshes the dev fairness dashboard data at:
- `artifacts/fairness/latest/fairness-report.json`
- `apps/web/public/data/fairness-report.latest.json`

Open `http://127.0.0.1:3000/dev/fairness` to inspect the exported balance and replay-backed EQ metrics.

The EQ section uses replay/public data only:
- replay events such as `roles-assigned`, `action-recorded`, and `vote-resolved`
- replay frame player snapshots and public meeting speech
- no private summaries or chain-of-thought
