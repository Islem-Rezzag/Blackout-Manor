---
name: spectator-runtime-guard
description: Use when changing the live spectator runtime. Preserves game-first presentation, runtime ownership, and separation from dev/fairness tooling.
---

# Spectator Runtime Guard

Use this skill when:
- editing `packages/client-game`
- changing `/game` presentation
- changing camera, HUD, surveillance, meetings, tasks, or room inspection
- changing the launcher or live runtime shell

Rules:
1. `/game` stays analytics-free.
2. `/game` stays runtime-owned, not dashboard-owned.
3. Replay/fairness tools stay behind dev routes.
4. Presentation work must not change engine authority or HEART behavior.
5. Runtime changes should preserve replay compatibility.
6. Spectator readability is first-class.

Before finishing, verify:
- live route is still clean
- replay still works
- surveillance still works
- inspection still works
- no fairness/debug surfaces leaked into live mode
