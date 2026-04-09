# Blackout Manor Plans Standard

This file defines the standard for executable plans in this repository.

Use a Blackout Manor Plan whenever work:
- spans multiple files
- crosses package boundaries
- changes design/runtime architecture
- changes milestone state
- is likely to take more than 45 minutes
- needs a reusable execution record for future contributors or Codex

## Naming

Active plans use:
- `plans/BM-*.md`

Use the next available identifier.
Keep one major active plan per stream when possible.

## Rules

1. Every plan must be self-contained.
2. Every plan must explain the user-visible purpose first.
3. Every plan must explicitly state the target milestone and submilestone.
4. Every plan must define exact files, commands, and acceptance checks.
5. Every plan must stay current while work proceeds.
6. Every plan must update `Progress`, `Decision Log`, `Surprises & Discoveries`, and `Outcomes & Retrospective`.
7. Every plan must preserve benchmark-safety boundaries.
8. Every plan must distinguish docs-only, presentation-only, or gameplay-affecting work.
9. Every plan must mention replay implications when relevant.
10. Every plan must say whether asset/licensing review is in scope.
11. Every plan must describe evidence of success, not only intended code changes.

## Required sections

Every Blackout Manor Plan must contain these sections in order:

1. `# <Short action-oriented title>`
2. `## Purpose / Big Picture`
3. `## Progress`
4. `## Surprises & Discoveries`
5. `## Decision Log`
6. `## Context and Orientation`
7. `## Plan of Work`
8. `## Concrete Steps`
9. `## Validation and Acceptance`
10. `## Idempotence and Recovery`
11. `## Artifacts and Notes`
12. `## Interfaces and Dependencies`
13. `## Outcomes & Retrospective`

## Repository-specific requirements

For Blackout Manor plans:
- name the milestone and submilestone explicitly
- preserve architecture boundaries from `AGENTS.md`
- mention replay implications for presentation changes
- mention benchmark-safety implications for any live-route work
- mention asset licensing implications for any new imports
- say whether the change is docs-only, runtime-only, route-only, art-only, or cross-cutting
- keep the live route analytics-free

## When implementing a plan

- proceed slice by slice
- do not ask for "next steps" after every tiny change
- update the plan after meaningful progress
- if scope changes, record the reason in `Decision Log`
- if a safer or simpler design emerges, prefer it and document the change

## Template

Use `plans/templates/execplan-template.md` as the starting point for new plans.
