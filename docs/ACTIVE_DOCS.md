# Active docs boundary

Use this file to know which docs are active guidance and which are supporting references.

## Read these first

Treat these as the active product and implementation guidance, in this order:

1. `START_HERE.md`
2. `README.md`
3. `AGENTS.md`
4. `docs/project/PROJECT_CHARTER.md`
5. `PLANS.md`
6. `WORKFLOW.md`
7. `plans/ROADMAP.md`
8. the current active `plans/BM-*.md` file, currently `plans/BM-0001-blackout-manor-program.md`
9. `docs/architecture/benchmark-safety.md`
10. `docs/design/SPECTATOR_MODE_BIBLE.md`
11. `docs/design/VISUAL_LANGUAGE.md`
12. `docs/assets-licensing.md`
13. `docs/release/alpha-review.md`
14. `docs/release/merge-readiness.md`

## Supporting references

These are supporting but not primary:
- `docs/architecture/**`
- `docs/design/**` other than the files listed above
- `docs/release/**` other than the files listed above
- package-level README files if added later

## Conflict rule

If active docs disagree with older or secondary docs:
- active docs win for product direction
- current code wins for implemented behavior
- the current BM plan decides how to close the gap

## Update rule

When product direction, milestone state, workflow, or benchmark-safety rules change, update the active doc in the same slice.
Do not leave conflicting guidance in place.
