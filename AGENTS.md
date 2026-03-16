# Blackout Manor Agent Guide

## Core Authority
- The deterministic engine is the only authority on game state.
- Agents may propose actions, speech, and intent, but they never mutate match state directly.
- Treat the model layer as structured decision support. Treat the engine as the source of truth for rules, timers, visibility, outcomes, and replay events.

## Fair Public Play
- Official public mode uses one model pack for all agents.
- Keep prompts, budgets, cooldowns, summarization, and action schema aligned across all agents in official public play.
- Do not introduce per-agent model differences in ranked or official public modes unless the product spec explicitly changes.

## Privacy and Reasoning Boundaries
- Do not expose private chain-of-thought in the UI, logs, analytics, or replay exports.
- Store only the minimum structured summaries needed for gameplay, debugging, and replay inspection.
- Public surfaces should show actions, evidence, claims, contradictions, and outcomes, not hidden reasoning traces.

## Testing and Replay Discipline
- Every new feature needs tests.
- Every new feature that affects match behavior, visibility, dialogue, or outcomes also needs replay fixtures.
- Prefer deterministic fixtures and seedable scenarios so behavior can be reproduced across runs.

## Performance and UX
- Preserve browser-first performance and clarity.
- Favor responsive UI, concise payloads, and incremental rendering over heavy client work.
- Keep spectator readability and replay clarity as first-class constraints, not polish added later.

## Change Strategy
- Prefer additive, modular changes over broad rewrites.
- Keep interfaces explicit between engine, agents, server, client, content, and replay systems.
- Stop and ask only when blocked by a true product decision that cannot be inferred safely from the repo or spec.

## Repo Boundaries
- Keep code and assets clearly separated.
- Runtime code belongs in the relevant app or package. Data content belongs in `packages/content`. Art, audio, and map assets should not be mixed into logic packages.
- Preserve package boundaries:
  - `packages/engine` for deterministic rules and state transitions
  - `packages/agents` for action proposal and HEART cognition
  - `packages/shared` for contracts and protocol
  - `packages/client-game` and `apps/web` for browser-facing presentation
  - `packages/content` for authored game data
  - `packages/replay-viewer` for replay tooling

## Working Style
- Make the smallest coherent change that moves the project forward.
- Keep implementation paths inspectable and replay-friendly.
- If a feature makes authority, fairness, privacy, testing, or browser performance worse, redesign it before shipping.
