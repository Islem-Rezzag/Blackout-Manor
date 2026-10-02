# Manor Environment Renderer V2

## What Changed

Manor Environment Renderer V2 moves the static manor environment out of `ManorWorldStage.ts` and into `packages/client-game/src/stage/environment/`.

The refactor keeps the existing runtime placeholder look, routes, camera behavior, room inspection, surveillance mode, meeting staging, task chips, avatars, audio, and replay semantics intact. It does not import final room plates, third-party art, generated references, or HUD replacement assets.

## Audit Findings

Before V2, `ManorWorldStage.ts` owned too many environment responsibilities directly:

- Backdrop and storm: Tiled backdrop rectangles, broad storm glows, and `StormLayer` window/band setup were interleaved with stage construction.
- Room shells: shell, shadow, vignette, floor, wall, labels, hit targets, focus frames, and state plates were created in one large room loop.
- Floor and wall surfaces: room-specific keys came from `importedArt.ts`, but the draw logic and fallback placeholders were embedded in the stage.
- Corridors: corridor shell, floor texture, trim, glow, and focus proximity logic were drawn and updated inline.
- Thresholds and doors: Tiled door nodes were converted to threshold art inline, including marker, glow, frame, and focus emphasis.
- Hero and task props: Tiled decor, imported hero props, and task chips were mixed with room shell construction.
- Bodies/body-safe zones: body visibility remains represented by public event markers and existing room/task geometry; no body-zone behavior changed in this branch.
- Lighting: room light nodes and dynamic light-level tinting were mixed between static construction and per-snapshot updates.
- Blackout and sabotage overlays: static placeholder objects were created inline while per-snapshot alpha/tint logic remained in runtime state application.
- Weather and VFX: rain/window overlays and storm-layer setup lived beside room and corridor drawing.
- Room inspection/focus affordances: room scaling, hover, inspection, corridor emphasis, and door emphasis were coupled to the stage instead of the environment layer.

V2 separates static environment construction and focus affordance updates from authoritative snapshot rendering. `ManorWorldStage.ts` still applies runtime state, but the environment shape now comes from a render plan.

## Module Responsibilities

- `EnvironmentRenderer.ts` builds the data-driven render plan, validates renderer-facing asset keys through Asset Pipeline V2, draws environment layers, and applies room/corridor/threshold focus affordances.
- `BackdropRenderer.ts` draws the storm grounds, manor footprint, cold rim, and broad backdrop glow from the Tiled backdrop layer plus approved placeholder textures.
- `CorridorRenderer.ts` draws corridor shells, floor strips, trim, glow, and focus proximity emphasis from Tiled corridor data.
- `RoomPlateRenderer.ts` draws room shells, floors, walls, placeholder labels, state plates, hit targets, clue/sabotage affordances, and room-level placeholder art.
- `ThresholdRenderer.ts` draws threshold plates, door art, focus glows, and door-node emphasis from Tiled door nodes.
- `PropRenderer.ts` draws Tiled decor shapes and imported placeholder hero/task props.
- `LightingWeatherRenderer.ts` wires room lights, weather windows, and storm-layer geometry.
- `EnvironmentRenderTypes.ts` owns the shared visual and plan types.

`ManorWorldStage.ts` still owns runtime state application: authoritative snapshots, room state labels, task state labels, camera application, avatars, audio cues, blackout veil intensity, and player interaction callbacks.

## Asset Pipeline V2 Use

Renderer-facing keys come from three approved sources:

- `packages/client-game/src/tiled/manorLayout.ts` for layout, backdrop, corridor, door, light, weather, and room metadata.
- `packages/client-game/src/stage/importedArt.ts` for room floor, wall, hero prop, corridor floor, and threshold key mapping.
- `packages/client-game/src/bootstrap/assetCatalogV2.ts` and `assetSourceLedgerV2.ts` for runtime-ready placeholder, baseline, procedural, fallback, and source/license metadata.

`EnvironmentRenderer.ts` collects the keys it uses and validates them with `requireAssetByKey`, `getFallbackChain`, and `isRuntimeReadyAsset`. Generated-reference-only and unknown-license assets are rejected for runtime environment use.

## Placeholder Policy

Current inline, procedural, and approved CC0 baseline textures remain the runtime fallback set. They are intentionally not final production art.

This branch does not add or commit:

- final room plates
- generated reference images
- third-party art imports
- new public asset files
- HUD art
- character portraits or animation replacements

## Adding Future Room Plates

Future room plate work should add reviewed asset entries before renderer-specific swaps:

1. Add source metadata to `assetSourceLedgerV2.ts`.
2. Add runtime asset entries to `assetCatalogV2.ts`.
3. Keep `placeholder`, `generatedReferenceOnly`, `runtimeReady`, dimensions, fallback key, and `swapGroup` accurate.
4. Replace or extend `importedArt.ts` mappings so room, corridor, threshold, and prop keys come from the cataloged set.
5. Keep Tiled layout as the source of geometry and interaction placement.
6. Run the client-game asset and environment renderer tests.

Production room plates should follow `docs/art-direction/v2/ROOM_PLATE_PROMPTS.md` and `ASSET_NAMING_AND_DIMENSIONS.md`. They should not be wired by hardcoding room-specific drawing branches into `ManorWorldStage.ts`.

## Prompt 7 HUD Boundary

Prompt 7 HUD work should consume public room, claim, evidence, vote, subtitle, and surveillance state from the existing directors and HUD components. It should not change environment internals, replace the environment render plan, or move `/game/[roomId]` toward React dashboard chrome.

HUD work may reference room IDs and public state, but it should treat `stage/environment/` as the world presentation layer and avoid adding HUD-only asset keys, analytics overlays, or hidden-role/private-reasoning surfaces to it.

## What Not To Do

- Do not import external art without source and license review.
- Do not commit generated references as runtime assets.
- Do not mark `GeneratedReferenceOnly` or `UnknownBlocked` assets as runtime-ready.
- Do not add final room plates in renderer code.
- Do not scatter room-specific drawing logic through `ManorWorldStage.ts`.
- Do not change engine rules, agents, model behavior, win conditions, replay semantics, fairness thresholds, or route boundaries.
- Do not start the premium HUD overhaul, character portrait replacement, or animation replacement here.
- Do not edit `apps/web/next-env.d.ts` or `apps/web/public/data/fairness-report.latest.json` for this renderer milestone.

## QA Notes

Renderer V2 preserves the current placeholder/baseline manor presentation. Visual QA should confirm `/game/demo` still shows one connected manor with visible rooms, corridors, thresholds, storm layering, task props, and room inspection focus. Full screenshot automation is still reserved for the later visual QA milestone if existing tooling is insufficient.
