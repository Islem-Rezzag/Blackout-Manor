# Blackout Manor

Blackout Manor is an open-source AI social-deduction game set inside a storm-locked manor. Ten agents move through a premium 2.5D map, perform evidence-generating tasks, build trust, lie, panic, accuse, vote, and leave behind deterministic replay data for fairness and replay analysis.

## Gameplay Loop
- Ten masked characters enter the manor with hidden roles.
- Roam rounds create alibis through movement, cooperation, sabotage, and task evidence.
- Reports and meetings turn the match into a social reasoning game.
- Votes shift trust, expose contradictions, or hand momentum to the Shadows.
- Replays preserve the full night for spectator analysis, fairness runs, and highlight export.

## Workspace Layout
- `apps/web`: Next.js shell, Phaser host, replay theater, fairness dashboard.
- `apps/server`: Colyseus rooms, authoritative simulation orchestration, admin APIs.
- `packages/shared`: shared contracts, schemas, protocol messages, constants.
- `packages/engine`: deterministic seeded rules engine and replay log output.
- `packages/agents`: HEART runtime, model gateway, policy, scripted fallback bots.
- `packages/client-game`: Phaser renderer, networking client, manor presentation.
- `packages/content`: season data, map metadata, personas, tasks, sabotage definitions.
- `packages/replay-viewer`: replay serialization, highlight extraction, fairness analytics.
- `packages/db`: SQLite local fallback and PostgreSQL production persistence.

## Quickstart
1. Install the toolchain.

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

3. Start the local web and server apps.

```bash
pnpm dev
```

4. Run a 10-agent local simulation in a second terminal.

```bash
pnpm sim --seed 42 --mode fast
```

5. Stage that replay for the theater and open it in the browser.

```bash
pnpm replay:open artifacts/replays/fast-42.replay.json
```

6. Visit `http://127.0.0.1:3000/play?view=replay&source=open` if the browser did not open automatically.

Local development works without production infra. By default the server uses SQLite at `.local/blackout-manor-dev.sqlite`.

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

## Quality Gates
```bash
pnpm ci:quality
pnpm test:e2e
pnpm fairness:check
```

`pnpm ci:quality` runs lint, typecheck, unit tests, and workspace builds. `pnpm test:e2e` runs the Playwright smoke suite. `pnpm fairness:check` runs the 100-seed balance gate and exits non-zero when official thresholds fail.

## Local Infra
Use the bundled Compose file only when you want local parity with the production persistence stack.

```bash
pnpm db:up
pnpm db:logs
pnpm db:down
```

## Replay and Simulation Notes
- `pnpm sim` writes replay files into `artifacts/replays/`.
- `pnpm sim:batch` writes a summary into `artifacts/batch/`. Add `--write-replays` if you want one replay file per run.
- `pnpm seed-suite` writes regression packs into `artifacts/seed-packs/`.
- `pnpm replay:open <file>` validates and stages a replay at `.local/replay-open/current.replay.json`.
- `pnpm media:capture` saves screenshots and, when `ffmpeg` is available, a GIF into `artifacts/media/latest/`.

## Documentation
- [Local Quickstart](/Users/moham/Downloads/Blackout%20Manor/docs/local-quickstart.md)
- [Contribution Guide](/Users/moham/Downloads/Blackout%20Manor/CONTRIBUTING.md)
- [Architecture Index](/Users/moham/Downloads/Blackout%20Manor/docs/architecture/README.md)
- [System Overview](/Users/moham/Downloads/Blackout%20Manor/docs/architecture/system-overview.md)
- [Production Deployment](/Users/moham/Downloads/Blackout%20Manor/docs/deployment/production.md)
- [Asset Licensing Notes](/Users/moham/Downloads/Blackout%20Manor/docs/assets-licensing.md)

## License
Code in this repository is licensed under the MIT license. Prototype placeholder art should be treated separately from code; see the asset notes for current licensing and replacement expectations before shipping public builds.
