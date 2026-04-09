# Architecture

Blackout Manor is split into deterministic simulation, agent reasoning, authoritative networking, and browser-first presentation layers.

## Read This First
- [Start Here](../../START_HERE.md)
- [Active Docs Boundary](../ACTIVE_DOCS.md)
- [Project Charter](../project/PROJECT_CHARTER.md)

Use those docs to understand the active product boundary first.
Treat the architecture docs in this folder as supporting implementation references that sit underneath the active-doc stack.

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
- The current merge-review branch is complete through Milestone `8E`.
- `benchmark-safety.md` documents the live-vs-dev boundary after the embodied spectator overhaul.
- `migration-plan.md` tracks the milestone map through Milestone `8E`, including the full production-art phase.
