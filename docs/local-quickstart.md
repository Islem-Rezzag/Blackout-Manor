# Local Quickstart

This guide is written for a first-time reviewer, not only a contributor. If you want the shortest path to seeing Blackout Manor as it exists on the feature branch today, follow the review path below.

## What You Are Launching
- `/`: public launcher / attract-mode entry
- `/game`: bootstrap route
- `/game/[roomId]`: primary live spectator runtime
- `/game/demo`: easiest direct review route
- `/dev/play?view=replay`: replay-oriented dev route
- `/dev/fairness`: fairness and replay-backed EQ tooling

The main experience is a real runtime rendered by `packages/client-game`, not a dashboard page.

## Prerequisites
- Node.js 22+
- `pnpm` 10.32.1 via Corepack

## Install
```bash
corepack prepare pnpm@10.32.1 --activate
pnpm install
```

Copy `.env.example` to `.env` with your shell of choice.

## Start The App
```bash
pnpm dev
```

The web app runs on [http://127.0.0.1:3000](http://127.0.0.1:3000). The Colyseus server runs on port `2567` unless overridden.

## Recommended Review Path
1. Open [http://127.0.0.1:3000/](http://127.0.0.1:3000/) and use the launcher.
2. Click `Watch demo room`, or go directly to [http://127.0.0.1:3000/game/demo](http://127.0.0.1:3000/game/demo).
3. Watch the live spectator runtime: manor rendering, camera focus, meetings, and the minimal HUD.
4. Try the observation controls:
   - `V`: toggle roaming and surveillance observation
   - `Q` / `E` or `Tab`: cycle surveillance feeds
   - `1` to `4`: lock a surveillance feed
   - `Esc`: return to roaming observation
5. Generate a replay:

```bash
pnpm sim --seed 42 --mode fast
pnpm replay:open artifacts/replays/fast-42.replay.json
```

6. Open [http://127.0.0.1:3000/dev/play?view=replay&source=open](http://127.0.0.1:3000/dev/play?view=replay&source=open).
7. Generate fairness and EQ data:

```bash
pnpm fairness:report
```

8. Open [http://127.0.0.1:3000/dev/fairness](http://127.0.0.1:3000/dev/fairness).

## What You Will See

### Live Runtime
- A launcher first, then a full-screen runtime at `/game/demo`
- Manor rooms, storm atmosphere, character presence, and camera-driven observation
- Meetings and replay staged through the runtime rather than through a website dashboard

### Replay Route
- The replay runs through the same runtime pipeline
- Use `/dev/play?view=replay` after staging a replay file with `pnpm replay:open`

### Fairness And EQ Route
- `/dev/fairness` shows balance metrics plus replay-backed EQ metrics
- EQ metrics use replay/public data only:
  - `roles-assigned`
  - `action-recorded`
  - `vote-resolved`
  - replay frame player snapshots and public speech
- No private summaries or chain-of-thought are used

## Current Alpha Status

### Already Working
- Game-first launcher and routes
- World-first runtime
- Surveillance mode
- Replay route
- Fairness and EQ dev tooling

### Still Alpha
- Some visuals remain placeholder or procedural
- This is a spectator-first alpha, not a final release build
- Documentation and polish are still being tightened for outside review

## Optional Validation
```bash
pnpm ci:quality
pnpm test:e2e
pnpm fairness:check
```
