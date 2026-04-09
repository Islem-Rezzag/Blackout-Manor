# Start here

This repository already has a working game/runtime, replay tooling, fairness/EQ tooling, design docs, and release notes.
This file exists to give humans and Codex one reliable starting sequence.

Before doing anything else, read these files in order:

1. `docs/ACTIVE_DOCS.md`
2. `README.md`
3. `AGENTS.md`
4. `docs/project/PROJECT_CHARTER.md`
5. `PLANS.md`
6. `WORKFLOW.md`
7. `plans/ROADMAP.md`
8. the current active `plans/BM-*.md`
9. `docs/architecture/benchmark-safety.md`
10. `docs/design/SPECTATOR_MODE_BIBLE.md`

Current branch reality:
- the pushed production-art branch is complete through Milestone `8E`
- `plans/BM-0001-blackout-manor-program.md` is the current program ledger
- if there is no newer active `plans/BM-*.md` file, use `BM-0001` to determine the next slice before starting work

## First run in Codex

Open the repository root in Codex, then start a fresh thread and give Codex this prompt:

```text
Read docs/ACTIVE_DOCS.md, README.md, AGENTS.md, docs/project/PROJECT_CHARTER.md, PLANS.md, WORKFLOW.md, plans/ROADMAP.md, the current active plans/BM-*.md file, and docs/architecture/benchmark-safety.md.
Summarize:
- what Blackout Manor is
- the live vs dev route boundary
- the current completed milestone set
- the next unfinished milestone or slice
Then implement only that slice.
Keep benchmark safety intact, preserve engine/HEART semantics, update the active plan as you work, and run the narrowest meaningful validation.
```

## Recommended operating pattern

Use:
- one Codex thread per milestone or submilestone
- one active plan file for the current major stream
- one docs/release update whenever product direction changes

Suggested thread naming:
- `M1-routing`
- `M2-runtime`
- `M3-surveillance`
- `M4-presentation`
- `M5-eq-benchmark`
- `M6-embodied-spectator`
- `M7-alpha-hardening`
- `M8-production-art`

## Review ritual

After each meaningful slice:
1. review the diff
2. confirm package/module boundaries still hold
3. confirm the active plan and milestone ledger were updated
4. confirm `/game` remains analytics-free
5. run the listed validation commands
6. only then move to the next slice

## Use the repo skills

When useful, explicitly invoke:
- `$manor-plan-orchestrator`
- `$spectator-runtime-guard`
- `$benchmark-safety-guard`
- `$asset-license-guard`
- `$production-art-guard`

Example:

```text
$benchmark-safety-guard Verify that this change does not expose replay/fairness tooling on /game and does not leak hidden-role analytics.
```

## What not to do first

Do not start with:
- broad rewrites of the engine or HEART
- mixing fairness/debug surfaces into the live route
- importing unclear-license assets
- changing room IDs or gameplay semantics during presentation-only work
- "quick fixes" that bypass the design docs

## The correct first success

The first success is not flashy art.

The first success is:
> Blackout Manor remains a trustworthy spectator-first game and EQ benchmark while every new visual or runtime improvement stays aligned with the design system and benchmark-safety boundaries.
