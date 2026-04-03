# Merge Readiness Checklist

This checklist is for preparing `feat/world-first-runtime` for merge review into `main`.

## Current Branch State
- Completed through Milestone `6J`
- Milestone `7` is the current release-hardening and reviewer-packaging pass
- live runtime remains game-first and analytics-free
- replay and fairness remain behind dev routes

## Reviewer Path
1. Open `/`
2. Enter `/game/demo`
3. Try surveillance and room inspection
4. Open `/dev/play?view=replay`
5. Open `/dev/fairness`

## Smoke Checks
```bash
git diff --check
pnpm ci:quality
pnpm test:e2e tests/e2e/play.spec.ts
pnpm fairness:report
```

## Merge Gates
- docs match the pushed branch state through `6J`
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
- a dedicated production-art pass is recommended before public showcase expectations are raised
