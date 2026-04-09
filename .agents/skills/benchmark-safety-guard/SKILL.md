---
name: benchmark-safety-guard
description: Use when changing live routes, replay, fairness, analytics, or any public-facing benchmark behavior. Protects live/dev separation and privacy boundaries.
---

# Benchmark Safety Guard

Use this skill when:
- touching `/game`, `/dev/play`, or `/dev/fairness`
- changing replay logic
- changing fairness or EQ analytics
- changing visible runtime overlays
- changing docs that define benchmark boundaries

Non-negotiables:
1. `/game` must remain analytics-free.
2. No hidden-role analytics on the live route.
3. No private reasoning or chain-of-thought exposure.
4. Replay must remain deterministic and presentation-safe.
5. Fairness/EQ stay on dev routes.
6. If a change threatens the boundary, redesign it.

Before finishing, verify:
- live route remains clean
- dev/fairness surfaces still work
- replay still works
- tests cover the route boundary if relevant
