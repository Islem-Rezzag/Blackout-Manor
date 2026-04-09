# Blackout Manor Agent Guide

## Read First
- Start with `START_HERE.md` for the current repo reading order.
- Use `docs/ACTIVE_DOCS.md` to determine which docs are active guidance versus supporting reference.
- Read `docs/project/PROJECT_CHARTER.md` before making milestone or planning decisions.
- Before changing `packages/client-game` presentation, read `docs/design/SPECTATOR_MODE_BIBLE.md`.
- Before changing live versus dev route boundaries, replay surfaces, fairness, or analytics placement, read `docs/architecture/benchmark-safety.md`.

## Product Surface
- `packages/client-game` is the primary product surface.
- `apps/web` is only a thin shell that boots the runtime, provides route entry points, and mounts non-default secondary tools.
- `/game/[roomId]` is the primary live match route.
- `/game` may bootstrap or redirect to a demo or local room.
- `/play` is legacy, compatibility, or dev-only, and must not be treated as the main player experience.
- The default live match experience should be owned by the game runtime, not by contributor panels, analytics views, or host-page chrome.

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
- Live mode must feel like a real full-screen game, not a dashboard.
- Keep spectator readability and replay clarity as first-class constraints, but do not let replay, fairness, contributor, debug, or admin tooling shape the default live match UX.

## Change Strategy
- Prefer additive, modular changes over broad rewrites.
- Keep interfaces explicit between engine, agents, server, client, content, and replay systems.
- Stop and ask only when blocked by a true product decision that cannot be inferred safely from the repo or spec.
- Preserve the existing deterministic engine, authoritative server model, official roles, round structure, replay guarantees, persistence model, and fairness assumptions unless the product spec explicitly changes.

## Repo Boundaries
- Keep code and assets clearly separated.
- Runtime code belongs in the relevant app or package. Data content belongs in `packages/content`. Art, audio, and map assets should not be mixed into logic packages.
- Preserve package boundaries:
  - `packages/engine` for deterministic rules and state transitions
  - `packages/agents` for action proposal and HEART cognition
  - `packages/shared` for contracts and protocol
  - `packages/client-game` for the primary browser game runtime and match presentation
  - `apps/web` for the thin shell, runtime bootstrapping, and opt-in non-live secondary surfaces
  - `packages/content` for authored game data
  - `packages/replay-viewer` for replay tooling

## Working Style
- Make the smallest coherent change that moves the project forward.
- Keep implementation paths inspectable and replay-friendly.
- If a feature makes authority, fairness, privacy, testing, or browser performance worse, redesign it before shipping.
