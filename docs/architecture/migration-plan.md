# Migration Plan

This plan tracks presentation ownership and product-surface work only. It does not change game rules, server authority, replay guarantees, or fairness assumptions.

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

#### File and Folder Changes
- `apps/web/src/app/game/`
- `apps/web/src/app/dev/`
- `apps/web/src/app/play/`
- docs clarifying `packages/client-game` ownership and `apps/web` shell responsibilities

#### Acceptance Criteria
- Live players enter through a game-first route instead of a dashboard-first route.
- `packages/client-game` is documented as the primary product surface.
- `apps/web` is documented as a thin shell that boots the runtime.

### Completed: Milestone 2 - World-First Runtime Refactor

#### Outcome
- `packages/client-game` now uses scene and director ownership instead of a single monolithic live scene.
- runtime flow is staged through `GameDirector`, `PhaseDirector`, `CameraDirector`, `MeetingDirector`, and `ReplayDirector`.
- live play, meetings, endgame, and replay now share a world-first rendering pipeline.

#### File and Folder Changes
- `packages/client-game/src/directors/`
- `packages/client-game/src/scenes/`
- `packages/client-game/src/stage/`
- minimal runtime boot adjustments in `apps/web/src/features/game/`

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

#### File and Folder Changes
- `packages/client-game/src/directors/SurveillanceDirector.ts`
- `packages/client-game/src/ui/ObservationHud.ts`
- `packages/client-game/src/ui/SurveillanceConsole.ts`
- scene integration in `packages/client-game/src/scenes/ManorWorldScene.ts` and `packages/client-game/src/scenes/ReplayScene.ts`

#### Acceptance Criteria
- live and replay observation stay visually coherent.
- surveillance mode remains in-world instead of becoming a separate website surface.
- hidden-role analytics remain sealed in live mode.

### Upcoming: Milestone 4 - Premium Rendering Pipeline

#### Goal
Raise the environmental rendering quality so the manor reads as a premium storm thriller rather than a strong prototype.

#### Planned Focus
- richer room materials, lighting, and storm atmosphere
- stronger cutaway treatment and spatial depth
- better in-world transition and focus polish

#### Acceptance Criteria
- blackout, storm, and room mood read clearly at a glance.
- visual upgrades do not require engine, server, or replay contract changes.

### Upcoming: Milestone 5 - Character Readability and Live HUD Polish

#### Goal
Make character presence, posture, speech, and key room state more readable during live observation.

#### Planned Focus
- improve at-a-glance avatar readability
- tighten speech and status presentation
- refine the live HUD without turning it into a benchmark dashboard

#### Acceptance Criteria
- players and spectators can follow public action without relying on secondary tooling.
- the HUD remains minimal and game-first.

### Upcoming: Milestone 6 - Public Launcher and Attract-Mode Polish

#### Goal
Polish the public entry flow so launching the game feels intentional and commercial before the match begins.

#### Planned Focus
- stronger `/game` bootstrap experience
- improved onboarding and demo-room presentation
- cleaner handoff into live runtime and replay entry paths

#### Acceptance Criteria
- the launcher feels like a game entry surface, not a dev shell.
- compatibility routes remain secondary and do not replace `/game`.

### Upcoming: Milestone 7 - EQ Benchmark Hardening

#### Goal
Harden replay, observation, and benchmark validation around the already-implemented live runtime.

#### Planned Focus
- stronger observation validation and replay assertions
- stricter checks around information boundaries and fairness assumptions
- better tooling confidence without moving those tools back into the player path

#### Acceptance Criteria
- benchmark tooling stays secondary to the live product surface.
- added hardening does not leak hidden-role analytics into live mode.

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
- `/game/[roomId]` launches into a live-match-first view
- `/game` only bootstraps or redirects to a demo or local room
- `/dev/play?view=replay` still works as the replay-oriented dev path
- hidden-role analytics remain absent from default live mode
- `/play` remains compatibility only
