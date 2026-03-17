# System Overview

## Runtime Surfaces
- `packages/engine` runs the seeded phase machine, legality validation, win checks, and replay event emission.
- `packages/agents` handles HEART state, model adapters, policy, fallback bots, and compact private summaries.
- `apps/server` runs Colyseus rooms, validates intents against the engine, persists metadata, and exposes admin APIs.
- `packages/client-game` is the primary product surface. It owns the Phaser runtime, player-facing match presentation, live HUD direction, camera feel, scene flow, and the moment-to-moment feel of a match.
- `apps/web` is a thin shell. It boots the runtime, provides route entry points, and mounts secondary non-default surfaces such as replay, fairness, contributor, debug, and admin tooling.

## Ownership Model
- Live player mode belongs to `packages/client-game`.
- Secondary surfaces can be hosted by `apps/web`, but they must not define the information density, layout, or interaction model of the default live match.
- Replay, fairness, contributor, debug, and admin tools are important product assets, but they are supporting surfaces, not the main in-match product.
- The host should stay small enough that the live experience can evolve without turning the game into a web dashboard.
- `/game/[roomId]` is the primary live route.
- `/game` is the bootstrap or redirect entry for demo and local-room flows.
- `/play` is a legacy compatibility route that forwards normal live entry to `/game/[roomId]`.
- Control-room, replay, fairness, and other secondary tool surfaces live behind developer-oriented paths such as `/dev/play` and `/dev/fairness` and do not define the main player experience.

## Match Authority
- The engine is deterministic and event-sourced.
- The server is the only process allowed to apply actions to engine state.
- Clients send intents, never state mutations.
- Agents are advisory and schema-validated before the engine sees a proposal.
- Preserve the current rules, roles, round structure, replay semantics, persistence flow, and fairness assumptions unless the product specification explicitly changes them.

## Replay and Analytics
- Every match emits a deterministic replay log.
- Replays are serialized into a portable JSON envelope with highlight markers.
- Fairness and balance analytics operate on saved replays and decision traces, not on UI state.
- Replay and analytics depth should unlock in spectator, contributor, or post-match contexts without leaking hidden-role analysis into live player mode.

## Content Boundaries
- Season content lives in `packages/content`.
- Gameplay rules live in `packages/engine`.
- Presentation-only assets and atmosphere logic live primarily in `packages/client-game`, with `apps/web` limited to thin-host concerns.
- Engine logic must not hard-code seasonal data values.

## Open-Source Release Expectations
- Local development must work with SQLite and no production infra.
- Production deployments use PostgreSQL and documented environment variables.
- CI must cover lint, typecheck, unit tests, Playwright smoke tests, and the fairness gate.
- Live mode should read as a full-screen game first, with tooling clearly separated from the core match experience.
