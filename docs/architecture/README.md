# Architecture

Blackout Manor is split into deterministic simulation, agent reasoning, authoritative networking, and browser-first presentation layers.

## Architecture Docs
- [Benchmark Safety](./benchmark-safety.md)
- [Vision](./vision.md)
- [Presentation Direction](./presentation.md)
- [System Overview](./system-overview.md)
- [Target Scaffold](./target-scaffold.md)
- [Migration Plan](./migration-plan.md)
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
