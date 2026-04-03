# Production Art Plan

## Purpose
This document defines the Milestone `8` production-art phase that should follow the current alpha-ready spectator runtime. It is scoped to presentation quality only.

Milestone `8A` is the audit and execution-planning pass completed by this docs-only branch. Milestones `8B` through `8E` are future implementation milestones and should not change gameplay rules, HEART behavior, route ownership, or benchmark surfaces.

## Milestone 8A - Production Art Gap Audit

### Goal
Document the exact reasons the current alpha still looks unfinished, define what must be replaced first, and lock the production-art execution order.

### Likely Files
- `docs/production/ART_GAP_AUDIT.md`
- `docs/production/PRODUCTION_ART_PLAN.md`
- `docs/production/TOOLCHAIN_RECOMMENDATION.md`
- `docs/production/ART_REPLACEMENT_PRIORITY.md`
- `docs/release/merge-readiness.md`

### Risks
- treating a planning milestone as permission to start art implementation early
- writing vague taste notes instead of execution-ready replacement targets
- understating how much of the current look is still baseline or procedural

### Acceptance Criteria
- audit is explicit about prototype-grade gaps
- replacement priorities are ranked
- production toolchain is documented
- Milestones `8B` through `8E` have clear goals, risks, files, and acceptance criteria

## Milestone 8B - Environment Replacement Pass

### Goal
Replace the current room-shell, floor, wall, threshold, and hero-prop baseline with bespoke Blackout Manor environment art while preserving the existing runtime architecture and metadata flow.

### Likely Files
- `packages/client-game/src/stage/ManorWorldStage.ts`
- `packages/client-game/src/stage/importedArt.ts`
- `packages/client-game/src/stage/renderTheme.ts`
- `packages/client-game/src/bootstrap/assetManifest.ts`
- `packages/client-game/src/bootstrap/assetSources.ts`
- `packages/client-game/src/bootstrap/derivedClientAssets.ts`
- `packages/content/src/maps/manor_v1.tiled.json`
- `apps/web/public/game-assets/client-game/...`
- licensing and source docs under `docs/`

### Risks
- replacing baseline assets without preserving swap discipline
- over-detailing rooms until cutaway readability collapses
- adding art that obscures thresholds, pathing lanes, or task hotspots
- mixing final-art replacement with risky runtime refactors

### Acceptance Criteria
- every major room has bespoke shell, wall, floor, and hero-prop treatment
- the manor reads as one authored upscale estate at whole-house scale
- thresholds, corridors, and hotspot approach lanes remain readable
- no unsafe asset imports enter the repo
- manifest/source documentation remains accurate

## Milestone 8C - Character Replacement Pass

### Goal
Replace the current procedural avatar/portrait look with authored character sprites, portrait art, and cutout-animation data that make all ten agents instantly distinct and premium.

### Likely Files
- `packages/client-game/src/entities/avatar/AvatarRig.ts`
- `packages/client-game/src/entities/avatar/PlayerAvatarLayer.ts`
- `packages/client-game/src/entities/avatar/MeetingPortraitStrip.ts`
- `packages/client-game/src/entities/avatar/presentation.ts`
- `packages/client-game/src/bootstrap/assetManifest.ts`
- `apps/web/public/game-assets/client-game/...`
- supporting docs under `docs/design/` and `docs/assets-licensing.md`

### Risks
- losing posture readability while increasing visual richness
- introducing character art that breaks whole-manor readability at runtime scale
- drifting portraits away from in-world silhouettes
- creating per-character complexity that harms performance or consistency

### Acceptance Criteria
- all ten agents are distinguishable by silhouette before color
- portraits and in-world sprites feel like the same person
- posture states remain readable through public-state-only presentation
- motion has clear anticipation, settle, and garment/prop follow-through
- meeting portraits feel premium, not like upgraded debug tiles

## Milestone 8D - Camera And Pacing Pass

### Goal
Upgrade the runtime from "well-tuned state camera" to "editorially directed spectator camera" without changing authority, timings, or replay semantics.

### Likely Files
- `packages/client-game/src/scenes/ManorWorldScene.ts`
- `packages/client-game/src/scenes/MeetingScene.ts`
- `packages/client-game/src/scenes/ReplayScene.ts`
- `packages/client-game/src/stage/ManorWorldStage.ts`
- `packages/client-game/src/stage/meetingBlocking.ts`
- `packages/client-game/src/navigation/manorNavigation.ts`
- `packages/client-game/src/ui/ObservationHud.ts`
- `packages/client-game/src/ui/RuntimeBanner.ts`

### Risks
- making cameras too cinematic and harming spectator comprehension
- accidentally changing perceived pacing of gameplay-critical events
- introducing scene timing differences that threaten replay consistency
- hiding important public information behind dramatic framing

### Acceptance Criteria
- whole-manor view reads like a poster composition
- inspection mode feels cinematic but still informative
- meeting staging lands with stronger arrival, settle, and reveal beats
- event focus improves clarity without becoming noisy or overactive
- replay remains deterministic and benchmark-safe

## Milestone 8E - Alpha Visual QA

### Goal
Validate that the production-art replacements improve perceived quality without breaking readability, legality, performance, or product boundaries.

### Likely Files
- `docs/release/alpha-review.md`
- `docs/release/merge-readiness.md`
- `docs/assets-licensing.md`
- presentation tests and fixtures under `packages/client-game/src/...`
- `tests/e2e/play.spec.ts`
- any added source/credits manifests

### Risks
- visually stronger assets masking readability regressions
- legal/source documentation lagging behind imported content
- shipping a "beautiful but harder to read" runtime
- letting public showcase expectations outpace actual QA confidence

### Acceptance Criteria
- live `/game` remains analytics-free and visually coherent
- replay and fairness routes remain segregated
- production-art replacements are fully documented and legally clean
- first-time review path still succeeds without extra explanation
- the runtime reads as a premium spectator game rather than an alpha prototype
