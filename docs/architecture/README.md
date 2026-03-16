# Architecture

Blackout Manor is split into deterministic simulation, agent reasoning, authoritative networking, and browser-first presentation layers.

## Architecture Docs
- [Vision](/Users/moham/Downloads/Blackout%20Manor/docs/architecture/vision.md)
- [System Overview](/Users/moham/Downloads/Blackout%20Manor/docs/architecture/system-overview.md)
- [Persistence](/Users/moham/Downloads/Blackout%20Manor/docs/architecture/persistence.md)

## Non-Negotiable Rules
- The deterministic engine owns the canonical match state.
- Agents only propose actions through validated schemas.
- Server and replay logs never expose private chain-of-thought.
- Public fairness runs use one official model pack for every agent.
- Every behavior change needs tests and replay coverage.
