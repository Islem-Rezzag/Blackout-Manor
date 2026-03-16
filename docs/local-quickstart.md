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

## Run a Local 10-Agent Replay
```bash
pnpm sim --seed 42 --mode fast
pnpm replay:open artifacts/replays/fast-42.replay.json
```

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
