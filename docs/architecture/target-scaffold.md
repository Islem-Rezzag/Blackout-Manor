# Target Scaffold

This document describes the target ownership model for the repo. It does not mean every folder below already exists today. It defines where future work should land so the live game stays coherent.

## Core Ownership Rules
- `packages/client-game` owns the default live player experience.
- `apps/web` stays a thin shell that boots the runtime and exposes opt-in secondary surfaces.
- `packages/engine`, `packages/agents`, `apps/server`, `packages/shared`, `packages/content`, `packages/replay-viewer`, and `packages/db` keep their current authority and responsibilities.
- Replay, fairness, contributor, debug, and admin tools stay available, but they must not dictate the layout or interaction model of live mode.
- `/game/[roomId]` is the target primary live match route.
- `/game` is the target bootstrap or redirect entry for demo and local flows.
- `/play` is legacy, compatibility, or dev-only and should not anchor new product decisions.

## Target Repo Shape

```text
blackout-manor/
|-- apps/
|   |-- web/
|   |   |-- src/app/                  # Thin shell route entry points only
|   |   |-- src/features/bootstrap/   # Thin runtime mounting and host-only glue
|   |   |-- src/features/tools/       # Replay, fairness, contributor, debug wrappers
|   |   `-- public/                   # Static host assets and exported reports
|   `-- server/
|       |-- src/rooms/                # LobbyRoom and MatchRoom authority
|       |-- src/http/                 # Admin and replay APIs
|       `-- src/services/             # Orchestration, persistence wiring, model gateway
|-- packages/
|   |-- client-game/
|   |   |-- src/bootstrap/            # Game bootstrap and runtime lifecycle
|   |   |-- src/scenes/               # Phaser scene ownership
|   |   |-- src/entities/             # Avatar and world entities
|   |   |-- src/fx/                   # Lighting, weather, camera, atmosphere
|   |   |-- src/network/              # Client transport adapters
|   |   |-- src/state/                # Authoritative snapshot reflection only
|   |   |-- src/ui/live/              # In-match HUD and meeting presentation
|   |   |-- src/ui/post-match/        # Role reveal, highlights, stats
|   |   `-- src/ui/shared/            # Shared presentation primitives
|   |-- engine/                       # Deterministic rules and replay emission
|   |-- agents/                       # HEART cognition and action proposals
|   |-- shared/                       # Contracts, schemas, protocol, constants
|   |-- content/                      # Maps, roles, tasks, personas, balance values
|   |-- replay-viewer/                # Replay parsing, analytics, export, theater helpers
|   `-- db/                           # SQLite/Postgres persistence layer
|-- docs/
|   `-- architecture/                 # Ownership model and migration planning
`-- scripts/                          # Simulations, seed suites, media capture
```

## Ownership by Surface

### Live Match
- Runtime owner: `packages/client-game`
- Authority source: `apps/server` plus `packages/engine`
- Supporting contracts: `packages/shared`
- Primary route language: `/game/[roomId]`

### Replay and Spectator Depth
- Data owner: `packages/replay-viewer`
- Host surface: `apps/web`
- Constraint: richer analytics only after match end, in spectator mode, or in contributor workflows

### Fairness and Contributor Tooling
- Data owners: `packages/replay-viewer`, `packages/agents`, `packages/db`
- Host surface: `apps/web`
- Constraint: never leak hidden-role or deep-analysis views into the default live player path

### Administration and Operations
- Runtime owner: `apps/server`
- Host surface: `apps/web` only when a browser workflow is needed
- Constraint: admin affordances must not shape player-mode presentation

## What This Means in Practice
- If a change affects the feel of walking, watching, speaking, meeting, voting, or surviving, it probably belongs in `packages/client-game`.
- If a change mainly helps analysis, fairness, contributor workflows, debugging, or administration, it can stay in `apps/web` or a supporting package.
- If a change affects rules, role powers, legality, timers, replay determinism, or state transitions, it does not belong in the presentation layer at all.
- If a change assumes `/play` is the canonical player URL, it is probably carrying forward old shell-centric thinking and should be corrected.
