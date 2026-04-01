# Architecture

Blackout Manor is split into deterministic simulation, agent reasoning, authoritative networking, and browser-first presentation layers.

## Architecture Docs
- [Benchmark Safety](./benchmark-safety.md)
- [Migration Plan](./migration-plan.md)
- [Vision](./vision.md)
- [Presentation Direction](./presentation.md)
- [System Overview](./system-overview.md)
- [Target Scaffold](./target-scaffold.md)
- [Persistence](./persistence.md)

## Non-Negotiable Rules
- The deterministic engine owns the canonical match state.
- Agents only propose actions through validated schemas.
- Server and replay logs never expose private chain-of-thought.
- Public fairness runs use one official model pack for every agent.
- Every behavior change needs tests and replay coverage.
- `packages/client-game` owns the default live match experience.
- `apps/web` remains a thin shell that boots the runtime and must not let secondary tooling define the live player UX.
- `/game/[roomId]` is the documented primary live match route. `/play` is legacy or dev-only.

## Current Review State
- The feature branch is complete through Milestone `6J`.
- `benchmark-safety.md` documents the live-vs-dev boundary after the embodied spectator overhaul.
- `migration-plan.md` tracks the milestone map and the current Milestone `7` release-hardening pass.
