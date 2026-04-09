# Merge Readiness Checklist

This checklist is for preparing `feat/production-art-gap-audit` for merge review into `main`.

## Planning And Review Docs
- start with `START_HERE.md`
- use `docs/ACTIVE_DOCS.md` to confirm the active-doc boundary
- use `docs/project/PROJECT_CHARTER.md` for product goals and route ownership
- use `plans/ROADMAP.md` and `plans/BM-0001-blackout-manor-program.md` for milestone state and next-stream context

## Current Branch State
- Completed and pushed through Milestone `8E`
- Milestone `7` closed release hardening and reviewer packaging
- Milestone `8A` through `8E` closed the production-art audit, environment, character, camera/pacing, and alpha-showcase QA passes
- live runtime remains game-first and analytics-free
- replay and fairness remain behind dev routes

## Production-Art Branch Status

### What 8A Through 8E Accomplished
- `8A` documented the honest production-art gap audit, replacement priorities, and safe toolchain recommendation
- `8B` replaced the weakest generic manor baseline with a stronger bespoke environment pass
- `8C` replaced the weakest placeholder cast presentation with a stronger authored identity pass
- `8D` directed spectator camera framing, pacing, and event emphasis
- `8E` closed alpha-showcase QA on whole-manor readability, surveillance usefulness, HUD clarity, and public presentation consistency

### What Is Still Intentionally Alpha-Quality
- some environment, portrait, surveillance, and audio presentation still relies on approved baseline or procedural treatment rather than final bespoke production assets
- merge readiness here means "strong enough for alpha showcase review," not "final art complete"

### What Is Deferred After Merge
- final painted manor shells, portraits, and bespoke sprite animation
- final surveillance console/monitor-wall art direction
- final authored Foley, music, and post-alpha visual mastering

## Reviewer Path
1. Open `/`
2. Enter `/game/demo`
3. Check whole-manor readability, public events, and meetings
4. Click into room inspection mode, then return to whole-manor view
5. Toggle surveillance and cycle feeds
6. Open `/dev/play?view=replay`
7. Open `/dev/fairness`

## Smoke Checks
```bash
git diff --check
pnpm ci:quality
pnpm test:e2e tests/e2e/play.spec.ts
pnpm fairness:report
```

## Compare-Against-Main Checklist
- `git fetch origin`
- `git log --oneline origin/main..origin/feat/production-art-gap-audit`
- `git diff --stat origin/main...origin/feat/production-art-gap-audit`
- `git diff --check origin/main...origin/feat/production-art-gap-audit`
- confirm the reviewer path still covers `/`, `/game/demo`, room inspection, surveillance, replay, and `/dev/fairness`
- confirm `/game` remains analytics-free and `/dev` route ownership remains unchanged
- confirm docs describe the branch as complete through `8E` and still intentionally alpha-quality where appropriate
- confirm the planning stack (`START_HERE.md`, `docs/ACTIVE_DOCS.md`, `docs/project/PROJECT_CHARTER.md`, `plans/ROADMAP.md`, and `plans/BM-0001-blackout-manor-program.md`) matches the pushed branch state

## Merge Gates
- docs match the pushed branch state through `8E`
- benchmark-safety guarantees are documented and enforced by tests
- no fairness or EQ analytics appear on `/game`
- replay remains deterministic and presentation-safe
- placeholder/baseline asset usage is disclosed

## Known Alpha Limits
- some assets are still placeholder, procedural, or temporary baseline imports
- this is a spectator-first alpha, not a final public release
- merge readiness does not imply final art/audio completion

## Production Art Caveat
- the branch may be technically merge-ready as an alpha
- it is not yet final-art complete
- a post-alpha finishing pass is still recommended before final public-art expectations are raised
