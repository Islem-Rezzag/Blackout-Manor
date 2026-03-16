# System Overview

## Runtime Surfaces
- `packages/engine` runs the seeded phase machine, legality validation, win checks, and replay event emission.
- `packages/agents` handles HEART state, model adapters, policy, fallback bots, and compact private summaries.
- `apps/server` runs Colyseus rooms, validates intents against the engine, persists metadata, and exposes admin APIs.
- `packages/client-game` renders the manor in Phaser and only reflects authoritative server snapshots.
- `apps/web` wraps the canvas, replay theater, fairness dashboard, and contributor-facing tools.

## Match Authority
- The engine is deterministic and event-sourced.
- The server is the only process allowed to apply actions to engine state.
- Clients send intents, never state mutations.
- Agents are advisory and schema-validated before the engine sees a proposal.

## Replay and Analytics
- Every match emits a deterministic replay log.
- Replays are serialized into a portable JSON envelope with highlight markers.
- Fairness and balance analytics operate on saved replays and decision traces, not on UI state.

## Content Boundaries
- Season content lives in `packages/content`.
- Gameplay rules live in `packages/engine`.
- Presentation-only assets and atmosphere logic live in `packages/client-game` and `apps/web`.
- Engine logic must not hard-code seasonal data values.

## Open-Source Release Expectations
- Local development must work with SQLite and no production infra.
- Production deployments use PostgreSQL and documented environment variables.
- CI must cover lint, typecheck, unit tests, Playwright smoke tests, and the fairness gate.
