# Blackout Manor

Blackout Manor is currently a spectator-first AI social-deduction alpha. Ten AI agents move through a storm-locked manor, perform evidence-generating tasks, lie, accuse, panic, vote, and leave behind deterministic replay data for review. The main experience on this branch is a real full-screen Phaser runtime, not a dashboard.

This branch matters: the game-first work lives on `feat/world-first-runtime`, not on `main`.

## What Blackout Manor Is Right Now
- A game-first launcher at `/`
- A live spectator runtime at `/game/[roomId]`
- A bootstrap route at `/game`
- A direct demo-room path at `/game/demo`
- A replay-oriented dev route at `/dev/play?view=replay`
- A fairness and replay-backed EQ route at `/dev/fairness`

The primary live product surface is `packages/client-game`. `apps/web` is the thin shell that boots the runtime and exposes secondary dev surfaces.

## What You Will See When You Run It

### Launcher / Attract Mode
Open `/` and you will see a branded launcher page with game-first entry points, not a workspace shell. From there you can enter the default room through `/game` or jump straight to the demo room.

### Live Spectator Runtime
Open `/game/demo` and you will see the manor rendered in the Phaser runtime: rooms, lighting, storm ambience, avatar movement/presence, camera-driven report and meeting focus, and the minimal live HUD.

### Surveillance Observation
Inside the runtime you can switch between roaming observation and surveillance observation. Surveillance mode shows multiple room feeds in-world instead of sending you to a separate dashboard.

### Replay And Dev Routes
Open `/dev/play?view=replay` to inspect a staged replay through the same runtime pipeline. Open `/dev/fairness` to inspect the fairness report plus replay-backed EQ metrics.

### What Is Working Now
- Game-first routing and launcher flow
- World-first runtime scenes and directors
- Surveillance mode and observation controls
- Manor render pipeline upgrade
- Character readability and live HUD polish
- Public launcher flow
- Replay-backed EQ analytics in dev fairness tooling

### What Is Still Alpha
- Some art remains placeholder or procedural rather than final bespoke production art
- This is not the final public release build
- Documentation is being tightened for external review, but still evolving

## Recommended First-Time Reviewer Path
1. Install dependencies.

```bash
corepack prepare pnpm@10.32.1 --activate
pnpm install
```

2. Copy the environment template.

```bash
# Bash
cp .env.example .env

# PowerShell
Copy-Item .env.example .env
```

3. Start the app and server.

```bash
pnpm dev
```

4. Open the launcher at [http://127.0.0.1:3000/](http://127.0.0.1:3000/).
5. Click `Watch demo room`, or go directly to [http://127.0.0.1:3000/game/demo](http://127.0.0.1:3000/game/demo).
6. Try the observation controls:
   - `V`: toggle roaming and surveillance observation
   - `Q` / `E` or `Tab`: cycle surveillance feeds
   - `1` to `4`: lock a surveillance feed
   - `Esc`: return to roaming observation
7. Generate and open a replay:

```bash
pnpm sim --seed 42 --mode fast
pnpm replay:open artifacts/replays/fast-42.replay.json
```

Then open [http://127.0.0.1:3000/dev/play?view=replay&source=open](http://127.0.0.1:3000/dev/play?view=replay&source=open).

8. Generate the fairness and EQ report:

```bash
pnpm fairness:report
```

Then open [http://127.0.0.1:3000/dev/fairness](http://127.0.0.1:3000/dev/fairness).

## Route Map
- `/`: public launcher / attract-mode entry
- `/game`: bootstrap route for the default or demo room
- `/game/[roomId]`: primary live runtime
- `/game/demo`: easiest direct route for first-time review
- `/play`: compatibility route only
- `/dev/play?view=replay`: replay-oriented dev route
- `/dev/fairness`: fairness and replay-backed EQ route

## Current Product Status

### Complete On This Branch
- Game-first routing
- World-first runtime
- Surveillance mode
- Render pipeline upgrade
- Character and HUD polish
- Public launcher
- Replay-backed EQ analytics in dev fairness tooling

### Still Placeholder Or Alpha-Quality
- Placeholder or procedural assets still exist in parts of the presentation stack
- Tooling and docs are strong enough for alpha review, but not yet final-release polished
- The branch is ready for spectator-first alpha review, not for a finished public launch

## Fairness And EQ Reports
- `pnpm fairness:report` exports both balance metrics and replay-backed EQ metrics for `/dev/fairness`.
- The EQ section covers contradiction handling, false-accusation recovery, witness stabilization, promise integrity, alliance shifts, evidence-grounded accusation quality, and meeting influence quality.
- These metrics are derived from replay events, replay frames, public speech, and revealed post-match roles only.
- They do not use private summaries, hidden chain-of-thought, or model-internal reasoning.

Required replay inputs for the EQ layer:
- `roles-assigned`
- `action-recorded`
- `vote-resolved`
- replay frame player snapshots for public display names and status

## Core Commands
```bash
pnpm dev
pnpm server:start
pnpm server:bot-match -- --seed 42
pnpm sim --seed 42 --mode showcase
pnpm sim --seed 42 --mode fast
pnpm sim:batch --count 100
pnpm replay:open artifacts/replays/fast-42.replay.json
pnpm media:capture --source open
pnpm fairness:report
```

## Known Limitations
- The presentation quality is stronger than earlier milestones, but some visuals are still prototype-grade and meant to be swapped for bespoke art later.
- The current experience is spectator-first. It is optimized for review, observation, replay, and analysis rather than a final player-facing shipping loop.
- Dev and fairness tooling are intentionally separate from live routes; reviewers should use `/game` or `/game/demo` first.
- `main` does not reflect the full current alpha. Review the `feat/world-first-runtime` branch.

## Quality Gates
```bash
pnpm ci:quality
pnpm test:e2e
pnpm fairness:check
```

## Documentation
- [Local Quickstart](./docs/local-quickstart.md)
- [Alpha Review Guide](./docs/release/alpha-review.md)
- [Contribution Guide](./CONTRIBUTING.md)
- [Architecture Index](./docs/architecture/README.md)
- [Benchmark Safety](./docs/architecture/benchmark-safety.md)
- [Presentation Direction](./docs/architecture/presentation.md)
- [System Overview](./docs/architecture/system-overview.md)
- [Target Scaffold](./docs/architecture/target-scaffold.md)
- [Migration Plan](./docs/architecture/migration-plan.md)
- [Production Deployment](./docs/deployment/production.md)
- [Asset Licensing Notes](./docs/assets-licensing.md)

## License
Code in this repository is licensed under the MIT license. Prototype placeholder art should be treated separately from code; see the asset notes for current licensing and replacement expectations before shipping public builds.
