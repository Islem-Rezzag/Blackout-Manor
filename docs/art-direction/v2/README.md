# Blackout Manor Art Direction V2

This packet is the production art and UI direction handoff for the next major presentation upgrade. It is docs-only: it does not change Phaser rendering, rules, agent behavior, routes, assets, or runtime manifests.

Use the packet to keep future Codex, Figma, and artist threads aligned around one premium 2.5D gothic manor vision:

- [ART_BIBLE.md](./ART_BIBLE.md) - product vision, visual pillars, camera, lighting, readability, evidence/claim surfaces, and live-versus-replay boundaries.
- [ROOM_PLATE_PROMPTS.md](./ROOM_PLATE_PROMPTS.md) - room-by-room reference prompts and production specs for environment plates.
- [HUD_STYLEFRAMES.md](./HUD_STYLEFRAMES.md) - live HUD, meeting, replay, surveillance, claim/evidence, and inspection styleframe specs.
- [CHARACTER_TURNAROUNDS.md](./CHARACTER_TURNAROUNDS.md) - ten suspect archetypes, silhouette rules, expressions, HEART emotion mapping, and rig guidance.
- [ASSET_NAMING_AND_DIMENSIONS.md](./ASSET_NAMING_AND_DIMENSIONS.md) - folder, naming, dimension, layer, atlas, metadata, and manifest-v2 guidance.
- [OPEN_SOURCE_ASSET_WORKFLOW.md](./OPEN_SOURCE_ASSET_WORKFLOW.md) - license-safe source workflow, generated-reference boundaries, attribution, and open-source hygiene.
- [CODEX_FIGMA_WORKFLOW.md](./CODEX_FIGMA_WORKFLOW.md) - how future implementation threads should consume this packet with Codex, Figma, screenshots, and visual QA.

The north-star image remains [`docs/design/reference/blackout-manor-concept-v1.png`](../../design/reference/blackout-manor-concept-v1.png). Treat it as a tone, hierarchy, and composition target, not a literal map or final asset source.

Future implementation work should keep live mode game-first, keep `/game/[roomId]` owned by `packages/client-game`, and route art through manifests and source metadata rather than ad hoc runtime edits.
