---
name: production-art-guard
description: Keep Blackout Manor production-art, room plate, HUD, portrait, sprite, VFX, audio, camera, and presentation work aligned with the game-first runtime, Asset Pipeline V2, source/license guardrails, and spectator readability.
---

# Production Art Guard

Use this skill when planning or implementing manor environment art, HUD art, portraits, character sprites, VFX, audio, camera polish, or presentation swaps.

Required workflow:
1. Read `AGENTS.md`, `docs/design/SPECTATOR_MODE_BIBLE.md`, and the relevant `docs/art-direction/v2` packet before changing `packages/client-game` presentation.
2. Route asset changes through `packages/client-game/src/bootstrap/assetCatalogV2.ts` and `packages/client-game/src/bootstrap/assetSourceLedgerV2.ts`; do not patch final art directly into renderer code.
3. Preserve engine authority, agent behavior, win conditions, model behavior, replay semantics, and live-route benchmark safety.
4. Keep `/game/[roomId]` game-first and runtime-owned; do not let dashboards, fairness tools, or contributor chrome shape the default live match experience.
5. Treat current inline, imported, and procedural art as placeholders or fallback baselines unless a source review says otherwise.
6. Keep generated references separate from runtime-ready assets.

Before finishing, verify:
- readability of rooms, doors, tasks, bodies, agents, surveillance, and meeting staging still holds
- no private reasoning, hidden-role analytics, or fairness/debug surfaces entered live mode
- asset swaps are cataloged with fallback and source metadata
- tests cover any catalog, manifest, visibility, or presentation behavior touched
