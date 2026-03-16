# Blackout Manor Vision

Blackout Manor should feel like a premium social thriller, but its engineering model must stay disciplined.

The deterministic engine is the only authority on match state. Agents can suggest actions, speech, and strategy, but they never write game state themselves. The engine decides what is legal, what is visible, what succeeds, and what becomes part of the replay.

Official public play must stay fair. All agents in that mode should run on the same model pack with the same prompt rules, budgets, cooldowns, and action schema. If one agent gets a different brain, the mode stops being a fair public simulation.

Private reasoning should stay private. We can surface claims, evidence, contradictions, and outcomes, but we should not leak hidden chain-of-thought into the UI, logs, or replay exports. Observability should come from structured game artifacts, not raw internal reasoning traces.

Every feature needs verification. If a change affects gameplay, visibility, dialogue, or resolution, it should ship with tests and replay fixtures so the result can be reproduced and inspected later.

The product is browser-first, so performance and clarity matter early. The UI should stay fast, readable, and easy to follow for both players and spectators. Replay and spectator clarity are core product requirements, not cleanup work for later.

The codebase should grow through additive, modular changes. Keep engine, agents, content, client code, server code, replay tooling, and assets clearly separated. Ask questions only when a real product decision is missing and cannot be inferred safely from the existing spec.
