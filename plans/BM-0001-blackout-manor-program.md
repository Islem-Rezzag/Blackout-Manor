# Blackout Manor program plan and milestone ledger

## Purpose / Big Picture

This file is the living program-level tracker for Blackout Manor.
It exists to keep milestone status, branch reality, and the next recommended work in one place.

## Progress

- [x] 2026-04-09 Imported the planning-pack docs and local skills into the repository.
- [x] 2026-04-09 Reconciled the planning architecture with the current branch state through Milestone `8E`.
- [ ] Open a dedicated merge-review slice against `main` and keep release docs current until merge.

## Surprises & Discoveries

- The planning pack arrived after the production-art phase had already completed on this branch, so the imported milestone tracker needed reconciliation instead of a blind copy.
- The repo already had strong project-specific truth in `README.md`, `AGENTS.md`, and the release docs; the new planning architecture needs to sit around that truth, not replace it.

## Decision Log

- 2026-04-09: Adopted the planning-pack file structure and local skills, but kept Blackout Manor-specific milestone state and benchmark-safety guidance as the source of truth.
- 2026-04-09: Locked Milestone `8A` through `8E` as complete in this program ledger to match pushed branch reality.

## Context and Orientation

Blackout Manor is both:
- a spectator-first social-deduction game
- a multi-agent EQ benchmark

This plan is not for one small code slice.
It is the active ledger for the whole program and should be read together with:
- `START_HERE.md`
- `docs/ACTIVE_DOCS.md`
- `docs/project/PROJECT_CHARTER.md`
- `plans/ROADMAP.md`
- `docs/architecture/migration-plan.md`

## Plan of Work

Track milestone status honestly.
When a milestone starts, link the detailed execution plan below.
When a milestone ends, summarize its outcome and what remains.
If there is no active implementation milestone, use this file to orient merge review and define the next explicit stream.

## Concrete Steps

1. Keep the milestone table current.
2. Link detailed slice plans when needed.
3. Record completed milestone outcomes.
4. Record remaining blockers or follow-up streams.
5. Keep release-readiness state visible.

## Validation and Acceptance

A program update is acceptable when:
- milestone status reflects current branch reality
- no stale "upcoming" marker exists for already-shipped work
- known alpha limits are still documented honestly
- benchmark-safety boundaries remain explicit in the active docs

## Idempotence and Recovery

If this file drifts from branch reality:
- compare pushed commits
- compare `docs/architecture/migration-plan.md`
- compare release docs and roadmap status
- update the milestone table
- note the correction in `Decision Log`

## Artifacts and Notes

Related artifacts:
- `docs/project/PROJECT_CHARTER.md`
- `plans/ROADMAP.md`
- `docs/architecture/migration-plan.md`
- `docs/release/alpha-review.md`
- `docs/release/merge-readiness.md`

## Interfaces and Dependencies

This file is documentation only.
It should not drive code directly.
It should be used by humans and Codex to orient milestone work and merge review.

## Outcomes & Retrospective

- The repository now has a stable planning architecture at the root, docs, plans, and local skill layers.
- Milestone tracking now matches the pushed branch state through the full production-art phase.
- The next recommended stream is merge review into `main`, followed by any post-merge finishing work framed as a new milestone or plan.

## Milestone Status Ledger

| Milestone | Status | Notes |
|---|---|---|
| M1 route inversion | complete | live path separated from dev tooling |
| M2 world-first runtime | complete | runtime owns spectator view |
| M3 surveillance | complete | surveillance stays inside runtime |
| M4A manor rendering baseline | complete | stronger render layers |
| M4B character and HUD baseline | complete | spectator readability improved |
| M4C launcher polish | complete | game-first entry flow |
| M5A replay-backed EQ analytics | complete | replay metrics foundation |
| M5B dev fairness integration | complete | `/dev/fairness` reports EQ |
| M6A design lock | complete | design bible and donor strategy |
| M6A.5 concept decomposition | complete | concept image translated into design docs |
| M6B connected floorplan | complete | manor became one connected house |
| M6C embodied navigation | complete | corridor traversal and slower pacing |
| M6D physical meeting staging | complete | travel and seating |
| M6E task readability | complete | visible task interactions |
| M6F identity kits | complete | stronger cast differentiation |
| M6G public audio feedback | complete | public-safe sound and event layer |
| M6H room inspection | complete | room zoom and focus mode |
| M6I approved baseline asset integration | complete | first legally clean imported art baseline |
| M6J benchmark safety pass | complete | live versus dev boundary hardened |
| M7 alpha hardening | complete | docs, reviewer, and release prep |
| M8A production-art audit | complete | audit, priorities, and toolchain docs added |
| M8B environment replacement | complete | bespoke manor environment pass shipped |
| M8C character replacement | complete | authored identity pass shipped |
| M8D camera and pacing direction | complete | spectator camera pass shipped |
| M8E alpha visual QA | complete | showcase-readiness pass shipped |
