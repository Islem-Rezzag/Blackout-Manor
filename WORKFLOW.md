---
name: blackout-manor-repo-workflow
tracker:
  kind: milestone-and-plan
  mode: file-first
policies:
  allow_auto_merge: false
  require_design_doc_alignment: true
  require_replay_compatibility_checks: true
  require_benchmark_safety_checks: true
  require_asset_license_notes: true
  require_human_approval_for:
    - merging_to_main
    - broad_asset_imports
    - gameplay_rule_changes
    - benchmark_boundary_changes
hooks:
  after_run: |
    update active plan, milestone state, and benchmark-safety docs if they changed
notes:
  - This file describes repository workflow expectations, not the exact runtime permissions of every Codex environment.
---

# Blackout Manor repository workflow contract

This file defines how work should proceed inside the repository.

## Intent

When an agent works on this repo, it should:

1. respect package boundaries
2. preserve engine authority and HEART boundaries
3. keep `/game` analytics-free
4. update the active plan while working
5. preserve replay compatibility for presentation work
6. preserve asset/licensing clarity
7. never smuggle debug/fairness tooling into the live route

## Acceptance defaults

Unless a plan says otherwise, a code task is only complete when:
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm test` passes
- touched docs are updated when behavior or direction changed
- the active BM plan is updated
- replay implications are covered for runtime/presentation changes
- benchmark-safety expectations are explicit for live-route changes
- asset source / license posture is explicit for imports

## Product boundaries

Primary product path:
- launcher
- live spectator runtime
- inspection mode
- surveillance mode
- replay
- fairness/EQ tooling

But boundary rules are strict:
- `/game` is the live route and must stay analytics-free
- `/dev/play` is replay / dev
- `/dev/fairness` is fairness / EQ
- engine rules stay deterministic
- HEART and hidden cognition never leak to public UI

## Notes

This workflow contract is here to keep Blackout Manor legible to both humans and Codex.
It should be read together with:
- `AGENTS.md`
- `docs/project/PROJECT_CHARTER.md`
- `docs/architecture/benchmark-safety.md`
- `docs/design/SPECTATOR_MODE_BIBLE.md`
