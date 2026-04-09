---
name: manor-plan-orchestrator
description: Use when work is complex, spans multiple files/packages, or needs a milestone/submilestone execution document. Create or update a Blackout Manor plan in plans/BM-*.md using PLANS.md and ROADMAP.md.
---

# Manor Plan Orchestrator

Use this skill when:
- work spans multiple files
- work touches more than one package
- work changes milestone state
- work is likely to take more than 45 minutes
- the user asks for a roadmap, milestone plan, or execution breakdown

Do not use for:
- typo fixes
- tiny styling tweaks
- isolated test updates
- one-function bug fixes with no boundary changes

## Required steps

1. Read `docs/ACTIVE_DOCS.md`, `AGENTS.md`, `docs/project/PROJECT_CHARTER.md`, `PLANS.md`, `WORKFLOW.md`, and `plans/ROADMAP.md`.
2. Create or update a `plans/BM-*.md` file.
3. Use `plans/templates/execplan-template.md`.
4. Make the plan self-contained.
5. Name:
   - milestone and submilestone
   - files/modules to edit
   - validation commands
   - replay implications
   - benchmark-safety implications
   - asset/license implications if relevant
6. Start implementation only after the plan is concrete enough that another contributor could continue from it.
7. Update `Progress`, `Decision Log`, and `Surprises & Discoveries` as work proceeds.

Do not output a vague checklist.
Write a real execution document.
