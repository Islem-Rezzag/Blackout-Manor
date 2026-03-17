# Migration Plan

This plan changes presentation ownership and documentation. It does not change game rules, server authority, or replay guarantees.

## What Stays Untouched
- `packages/engine` gameplay rules, role behavior rules, round structure, legality flow, seeded determinism, and replay event semantics
- `packages/agents` HEART behavior, policy behavior, model gateway behavior, and fairness assumptions
- `packages/content` season data, authored balance values, and rule-data model
- `apps/server` authoritative state model, persistence wiring, admin API semantics, and Colyseus authority model
- replay serialization, replay guarantees, replay metadata flow, and persistence contracts
- current route implementation behavior during the documentation phase
- Existing asset set and rendering behavior during the documentation phase

## Milestone 1: Lock the Ownership Boundary

### Goal
Document and enforce that `packages/client-game` is the primary live surface and `apps/web` is the thin shell that boots the runtime.

### Submilestones
1. Update repo guidance and architecture docs.
2. Audit live-match UI ownership across `apps/web` and `packages/client-game`.
3. Identify which host-side panels are live-player critical versus tool-only.

### File and Folder Changes
- Update `AGENTS.md`
- Update `README.md`
- Update `docs/architecture/*.md`
- No runtime code moves yet

### Acceptance Criteria
- New contributors can tell which package owns live mode versus support tooling.
- Architecture docs no longer imply that the current host shell is the intended final product.
- `/game/[roomId]` is documented as the primary live route, `/game` as the bootstrap or redirect entry, and `/play` only as legacy or dev-oriented language.
- No runtime behavior changes land in this milestone.

## Milestone 2: Move Live Match Presentation into `packages/client-game`

### Goal
Make the live match feel owned by the game runtime instead of by host-page React composition.

### Submilestones
1. Define a minimal host-to-runtime boot contract.
2. Move live HUD, meeting, confessional, and post-match player surfaces behind runtime-owned interfaces.
3. Reduce host-page chrome around the live canvas.

### File and Folder Changes
- Expand `packages/client-game/src/ui/` into clear live-match ownership folders
- Reduce `apps/web/src/features/play/` to thin mounting, host options, and route glue
- Keep routes unchanged during this milestone

### Acceptance Criteria
- Live mode can be described as a full-screen game surface with minimal host scaffolding.
- `apps/web` no longer owns the structure of the in-match presentation.
- Replay and analytics remain available without leaking into player mode.
- The design target is clearly aligned to `/game/[roomId]`, even if compatibility routes still exist during migration.

## Milestone 3: Separate Secondary Tooling From the Default Match Path

### Goal
Keep spectator, replay, fairness, contributor, debug, and admin tools useful without letting them define the live product.

### Submilestones
1. Classify secondary surfaces by audience: player, spectator, contributor, operator.
2. Move deep-analysis panels behind explicit mode switches or post-match contexts.
3. Audit hidden-role analytics to ensure they never appear in default live player mode.

### File and Folder Changes
- Consolidate secondary surfaces under host-side tool folders in `apps/web`
- Keep replay analytics logic in `packages/replay-viewer`
- Leave server endpoints and replay data format untouched

### Acceptance Criteria
- Default `/game/[roomId]` behavior is focused on the match, not on analysis.
- `/game` can remain a bootstrap or redirect entry without becoming a tool-heavy landing page.
- Spectator and replay modes can still access richer analysis after the match.
- Tooling remains discoverable without shaping the first-run player experience.

## Milestone 4: Polish the Runtime Surface Without Breaking Authority

### Goal
Improve immersion, clarity, and commercial feel while preserving current simulation contracts.

### Submilestones
1. Tighten runtime-owned presentation architecture.
2. Establish clearer shared UI primitives between live and post-match views.
3. Add validation for player-mode information boundaries and runtime boot performance.

### File and Folder Changes
- Refine `packages/client-game/src/bootstrap`, `src/scenes`, `src/ui`, and `src/state`
- Keep `packages/engine`, `packages/agents`, `apps/server`, and route structure untouched unless a separate approved milestone requires otherwise

### Acceptance Criteria
- Player mode feels like a coherent game runtime first.
- Runtime changes do not alter replay determinism or legality.
- Host pages remain thin wrappers instead of re-accumulating product ownership.
- Legacy `/play` support, if still present, behaves as compatibility only and does not redefine the primary product route.

## Risks
- Duplicating UI state between React host code and Phaser runtime
- Accidentally leaking spectator or hidden-role analysis into live player mode
- Refactoring presentation in a way that quietly changes timing, sequencing, or replay semantics
- Letting admin or contributor requirements pull the live UI back toward dashboard density
- Mixing future asset migrations with ownership refactors, which makes regressions harder to isolate

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

For milestones that move presentation ownership, also manually verify:
- `/game/[roomId]` launches into a live-match-first view
- `/game` only bootstraps or redirects to a demo or local room
- spectator and replay paths still work
- hidden-role analytics remain absent from default live mode
- `/play`, if still present, behaves only as a compatibility or dev route
