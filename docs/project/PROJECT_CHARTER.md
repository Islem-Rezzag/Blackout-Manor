# Blackout Manor Project Charter

## Executive Summary

Blackout Manor is an open-source, spectator-first AI social-deduction game and multi-agent EQ benchmark.
It combines a real-time game runtime, replay tooling, fairness/EQ analysis, and design-led spectator presentation.
The project exists to prove that multi-agent systems can be judged not only by raw task completion, but also by social reasoning, readability, trust behavior, conflict handling, pacing, and emotional intelligence under public observation.

## Purpose and Problem Statement

Most multi-agent demos fail in one of two ways:
1. they are technically interesting but visually weak and hard to watch
2. they are visually interesting but not rigorous enough to serve as a benchmark

Blackout Manor exists to solve both.
It aims to be:
- a real spectator-facing game
- a serious open-source example of multi-agent EQ evaluation
- a safe and legible showcase of live versus replay versus fairness boundaries

## Vision

Build one of the strongest open-source examples of an AI-agent social-deduction game where:
- ten agents feel like distinct characters
- movement, meetings, and room interactions are physically staged
- the manor feels like a real place
- replays and EQ analysis are reproducible
- live routes stay clean and game-first
- benchmark tooling stays separated and auditable

## Goals

- deliver a game-first live runtime at `/game/[roomId]`
- preserve deterministic engine authority and replay behavior
- make the manor readable, cinematic, and spectator-friendly
- make agents visually and behaviorally distinct
- keep fairness and replay-backed EQ analysis behind dev routes
- maintain a legally clean asset and licensing posture
- make the repo understandable to both humans and Codex

## Non-Goals

- hidden-role analytics on the live route
- private reasoning or chain-of-thought exposure
- a pure dashboard or operations shell as the main product experience
- unsafe or ambiguous asset imports
- casual gameplay-rule changes during presentation work
- overclaiming final-release polish before art and audio are truly final

## Game Concept and Core Loop

The player-facing experience is spectator-first:
1. launch from `/`
2. watch or enter `/game/demo`
3. observe the whole-manor runtime
4. switch to surveillance or room inspection
5. watch meetings, task work, movement, and public events
6. inspect replay via `/dev/play`
7. inspect EQ and fairness via `/dev/fairness`

## Agent System Summary

Each agent differs along two axes:

### Public identity and presentation
- display name
- silhouette
- costume grammar
- mask or headwear
- accent palette
- portrait identity
- posture bias

### Gameplay and cognition
- persona
- role
- private memory and summaries
- public and private trust and suspicion behavior
- HEART-driven reasoning

Important:
Public-facing presentation may reflect persona and public posture.
It must not leak hidden role or private reasoning.

## Architecture Overview

### `packages/engine`
Deterministic rules, state transitions, legality, and seeded match behavior.

### `packages/agents`
Agent proposal layer, HEART cognition, model interaction, and persona behavior.

### `packages/shared`
Contracts, schemas, protocol types, and shared constants.

### `packages/client-game`
Primary live product surface.
Owns the Phaser runtime, manor rendering, camera, meetings, inspection, surveillance, task readability, and spectator-facing presentation.

### `packages/content`
Authored room, task, season, and game data.

### `packages/replay-viewer`
Replay and replay-backed EQ analysis.

### `apps/web`
Thin shell that launches the runtime and exposes secondary routes.

### `apps/server`
Authoritative runtime host and multiplayer server.

## Route Ownership and Benchmark Safety

- `/` = launcher
- `/game` = bootstrap route
- `/game/[roomId]` = live spectator runtime
- `/dev/play?view=replay` = replay
- `/dev/fairness` = fairness and replay-backed EQ
- `/game` must remain analytics-free

See `docs/architecture/benchmark-safety.md`.

## Asset and Licensing Policy

- code remains MIT
- imported assets must be clearly documented
- live baseline assets may be used for alpha if legally clean
- bespoke production replacements are preferred for final showcase
- no ripped or ambiguous-license assets

See `docs/assets-licensing.md`.

## Milestone History

### Foundation milestones
- M1 route and product-surface inversion
- M2 world-first runtime
- M3 surveillance mode

### Presentation and benchmark milestones
- M4A manor rendering
- M4B character and HUD polish
- M4C launcher polish
- M5A replay-backed EQ analytics
- M5B dev fairness integration

### Embodied spectator overhaul
- M6A design lock
- M6A.5 concept decomposition
- M6B connected floorplan
- M6C embodied corridor navigation
- M6D physical meeting travel and seating
- M6E readable task interactions
- M6F stronger identity kits
- M6G public audio feedback
- M6H room inspection
- M6I approved baseline asset integration
- M6J benchmark safety hardening

### Release-hardening milestone
- M7 alpha hardening and review packaging

### Production-art phase
- M8A production-art audit
- M8B bespoke environment replacement
- M8C authored character replacement
- M8D camera and pacing direction
- M8E alpha visual QA and showcase readiness

## Current Status

Blackout Manor is a spectator-first alpha with a real game runtime and benchmark tooling.
The current merge-review branch is complete through Milestone `8E`.
The live runtime, replay path, benchmark-safety boundary, and production-art alpha pass are complete enough for review into `main`.
The remaining work after merge is mostly:
- final bespoke art and audio replacement beyond the alpha baseline
- performance and platform hardening
- playtest-driven pacing polish
- release packaging and public showcase prep

## Known Limitations

- some visuals, props, and audio are still placeholder or baseline-imported
- final polished art and audio are not complete yet
- benchmark and spectator systems are strong, but final production identity may still evolve

## Reviewer Path

1. open `/`
2. open `/game/demo`
3. try room inspection mode
4. try surveillance mode
5. open replay
6. open fairness and EQ
7. compare live-route cleanliness versus dev tooling

## Commands and Runbook

```bash
corepack prepare pnpm@10.32.1 --activate
pnpm install
cp .env.example .env   # or Copy-Item on PowerShell
pnpm dev
```

Then visit:
- `/`
- `/game/demo`
- `/dev/play?view=replay`
- `/dev/fairness`

## Success Criteria / Definition of Done

The project is "done enough" for merge review when:
- the live runtime is stable
- replay is deterministic
- `/game` stays analytics-free
- fairness and EQ stay on dev routes
- milestone docs are current
- smoke checks pass
- known alpha limits are documented honestly

## Post-Charter Next Phase

After the current merge-review phase, future work should be framed as:
- post-alpha finishing art and audio replacement
- performance optimization
- playtest-driven pacing polish
- showcase packaging
- eventual merge and public release follow-through
