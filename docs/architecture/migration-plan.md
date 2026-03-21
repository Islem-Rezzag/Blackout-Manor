# Migration Plan

This plan tracks presentation ownership, product-surface work, and benchmark-surface integration only. It does not change game rules, server authority, replay guarantees, or fairness assumptions.

## What Stays Untouched
- `packages/engine` gameplay rules, role behavior rules, round structure, legality flow, seeded determinism, and replay event semantics
- `packages/agents` HEART behavior, policy behavior, model gateway behavior, and fairness assumptions
- `packages/content` season data, authored balance values, and rule-data model
- `apps/server` authoritative state model, persistence wiring, admin API semantics, and Colyseus authority model
- replay serialization, replay guarantees, replay metadata flow, and persistence contracts

## Current Milestone Map

### Completed: Milestone 1 - Route and Product-Surface Inversion

#### Outcome
- `/game/[roomId]` is the primary live route.
- `/game` is the bootstrap route.
- `/play` is compatibility only.
- fairness and replay-heavy tooling live behind developer-oriented routes instead of defining the default player path.

#### Acceptance Criteria
- Live players enter through a game-first route instead of a dashboard-first route.
- `packages/client-game` is documented as the primary product surface.
- `apps/web` is documented as a thin shell that boots the runtime.

### Completed: Milestone 2 - World-First Runtime Refactor

#### Outcome
- `packages/client-game` now uses scene and director ownership instead of a single monolithic live scene.
- runtime flow is staged through `GameDirector`, `PhaseDirector`, `CameraDirector`, `MeetingDirector`, and `ReplayDirector`.
- live play, meetings, endgame, and replay now share a world-first rendering pipeline.

#### Acceptance Criteria
- reports, meetings, voting, and endgame are staged through the runtime instead of host-side panels.
- replay uses the same rendering pipeline as live observation.
- host-page React chrome stays minimal on the player route.

### Completed: Milestone 3 - Surveillance and Observation Mode

#### Outcome
- roaming observation and surveillance observation now exist inside the same full-screen runtime.
- a surveillance console can render several room feeds at once.
- camera focus is event-driven for sabotage, reports, meetings, and visible public interactions.
- live mode keeps a minimal observation HUD without surfacing fairness or debug analytics.

#### Acceptance Criteria
- live and replay observation stay visually coherent.
- surveillance mode remains in-world instead of becoming a separate website surface.
- hidden-role analytics remain sealed in live mode.

### Completed: Milestone 4A - Premium Manor Rendering Pipeline

#### Outcome
- the manor now renders through clearer layered stage ownership for backdrop, floor, walls, props, lighting, weather, and focus framing.
- Tiled-driven room structure and shared render theme hooks support future art swaps without rewriting the stage architecture.
- blackout, storm, sabotage emphasis, and surveillance feeds all use the upgraded rendering path.

#### Acceptance Criteria
- blackout, storm, and room mood read clearly at a glance.
- visual upgrades do not require engine, server, or replay contract changes.

### Completed: Milestone 4B - Character Readability and Live HUD Polish

#### Outcome
- avatar readability, public posture, speech/action presentation, meeting portraits, and the minimal live HUD were upgraded for spectator clarity.
- public-visible postures now read as calm, alert, suspicious, shaken, confident, or defiant without exposing private cognition.
- meeting scenes feel more like a game presentation and less like a debug overlay.

#### Acceptance Criteria
- players and spectators can follow public action without relying on secondary tooling.
- the HUD remains minimal and game-first.

### Completed: Milestone 4C - Public Launcher and Attract-Mode Polish

#### Outcome
- `/` now acts as a branded launcher and attract-mode entry.
- `/game` and `/game/demo` are the clear first-time review path into the live runtime.
- dev and fairness tooling remain available, but no longer define the public entry.

#### Acceptance Criteria
- the launcher feels like a game entry surface, not a dev shell.
- compatibility routes remain secondary and do not replace `/game`.

### Completed: Milestone 5A - Replay-Backed EQ Analytics Foundation

#### Outcome
- replay analyzers now derive contradiction handling, false-accusation recovery, witness stabilization, promise integrity, alliance shifts, evidence-grounded accusation quality, and meeting influence quality from replay/public data.
- the metrics are deterministic and fixture-backed.
- no private summaries or chain-of-thought are required.

#### Acceptance Criteria
- EQ claims are tied to replay data, not just UI impressions.
- metric families are typed, schema-backed, and validated by deterministic tests.

### Completed: Milestone 5B - Dev Fairness And EQ Surfacing

#### Outcome
- `/dev/fairness` now surfaces fairness metrics together with replay-backed EQ metrics.
- fairness report exports now carry the integrated EQ section.
- reviewer and contributor docs explain how to regenerate and inspect those reports locally.

#### Acceptance Criteria
- EQ metrics remain out of `/game`.
- contributors can regenerate the fairness + EQ report locally and inspect it through the dev route.

## Post-Alpha Milestones

### Upcoming: Milestone 6 - Original Production Asset Pass

#### Goal
Replace the remaining placeholder and procedural presentation assets with bespoke art, audio, and higher-fidelity authored content.

#### Acceptance Criteria
- the runtime no longer depends on prototype-grade presentation for reviewer-first routes.
- asset swaps preserve current scene/director and replay-safe architecture.

### Upcoming: Milestone 7 - Alpha Hardening And Review Packaging

#### Goal
Tighten release docs, smoke checks, reviewer onboarding, and benchmark confidence around the current spectator-first alpha.

#### Acceptance Criteria
- first-time reviewers can understand what the branch is, what they will see, and which routes matter.
- hardening does not leak hidden-role analytics into live mode.

## Risks
- Duplicating UI state between React host code and Phaser runtime
- Accidentally leaking spectator or hidden-role analysis into live player mode
- Refactoring presentation in a way that quietly changes timing, sequencing, or replay semantics
- Letting debug or fairness tooling pull the live UI back toward dashboard density
- Mixing major visual overhauls with authority or replay-sensitive code paths

## Risky Refactors to Avoid
- Moving rules, role powers, or meeting flow into presentation code
- Replacing server authority with client-derived state for convenience
- Combining replay analytics state and live player state in one default view model
- Performing route changes, asset swaps, and presentation ownership changes in one milestone

## Recommended Validation After Each Future Milestone
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm fairness:check`
- `pnpm sim --seed 42 --mode fast`
- `pnpm sim --seed 42 --mode showcase`

For presentation milestones, also manually verify:
- `/` reads as a launcher, not a workspace shell
- `/game/[roomId]` launches into a live-match-first view
- `/game` bootstraps or redirects to a demo or local room
- `/dev/play?view=replay` still works as the replay-oriented dev path
- `/dev/fairness` still contains fairness and EQ tooling only
- hidden-role analytics remain absent from default live mode
