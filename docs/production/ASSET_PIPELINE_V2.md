# Asset Pipeline V2

## Purpose

Asset Pipeline V2 gives Blackout Manor a typed path for future premium manor art, HUD art, portraits, sprites, generated references, placeholders, final assets, source metadata, licensing, and safe swaps.

This branch does not import third-party art, generate final runtime art, change game rules, change agent behavior, change win conditions, change model behavior, or overhaul the renderer/HUD.

## Current Asset System Audit

Current runtime assets are split across these surfaces:

- `packages/client-game/src/bootstrap/assetManifest.ts` loads Phaser image keys from inline data URIs and the approved `oga-modern-houses/tiletest.png` baseline.
- `packages/client-game/src/bootstrap/assetSources.ts` records the existing `blackout-inline` and `oga-modern-houses-cc0` source IDs.
- `packages/client-game/src/bootstrap/inlineAssets.ts` and `inlineEnvironmentArt.ts` hold project-authored SVG/data-URI placeholder textures.
- `packages/client-game/src/bootstrap/derivedClientAssets.ts` derives Phaser canvas textures from the CC0 OGA sheet.
- `packages/client-game/src/stage/importedArt.ts` maps room floor, wall, threshold, corridor, and prop keys into the manor renderer.
- `packages/client-game/src/tiled/manorLayout.ts` and `packages/content/src/maps/manor_v1.tiled.json` provide layout, room, corridor, door, weather, light, and hotspot geometry, not final art.
- Avatar, portrait, HUD, surveillance, VFX, audio, and font surfaces are mostly Phaser/WebAudio/system-font procedural placeholders.

The current system already has useful swap points, so V2 extends the existing bootstrap asset boundary instead of creating a disconnected asset folder.

## New Locations

Catalog:

```text
packages/client-game/src/bootstrap/assetCatalogV2.ts
```

Source ledger:

```text
packages/client-game/src/bootstrap/assetSourceLedgerV2.ts
```

The location is intentional: current asset loading, inline sources, source IDs, and derived texture registration already live under `packages/client-game/src/bootstrap`.

## Asset Type Model

`ClientGameAssetV2` records:

- `key`
- `category`
- `kind`
- `relativePath` or `inlineSourceKey`
- `sourceId`
- `licenseStatus`
- `placeholder`
- `generatedReferenceOnly`
- `dimensions`
- `fallbackKey`
- `swapGroup`
- `runtimeReady`
- `notes`

Supported categories include environment plates, room floors, room walls, thresholds, corridors, exterior storm layers, hero props, clue props, task props, light masks, blackout masks, character world sprites, character portraits, posture/emotion states, HUD panels, HUD icons, evidence chips, support seals, vote tokens, surveillance frames, VFX, audio, and fonts.

Supported license statuses are `ProjectOwned`, `Placeholder`, `GeneratedReferenceOnly`, `CC0`, `CC-BY`, `CustomOwned`, and `UnknownBlocked`.

## Source Ledger Model

`assetSourceLedgerV2.ts` records:

- `sourceId`
- `ownerOrAuthor`
- `licenseStatus`
- `attributionRequired`
- `sourceUrl`
- `sourceFile`
- `reviewed`
- `notes`

Current reviewed runtime sources are:

- `blackout-inline`
- `blackout-runtime-procedural`
- `blackout-system-font-stack`
- `oga-modern-houses-cc0`

Guardrail sources are also present for generated references and unknown-license blocked material. They are not runtime-ready sources.

## Resolver Helpers

`assetCatalogV2.ts` adds:

- `getAssetByKey`
- `requireAssetByKey`
- `getFallbackChain`
- `getAssetsByCategory`
- `getAssetsBySwapGroup`
- `assertAssetCatalogIntegrity`
- `isRuntimeReadyAsset`

`getFallbackChain` returns the requested asset followed by its fallback chain. `assertAssetCatalogIntegrity` throws if keys duplicate, source IDs are missing, fallbacks are missing, generated references are runtime-ready, unknown-license assets are runtime-ready, or placeholders are not clearly marked.

## Fallback Policy

Current inline, imported, derived, and procedural assets are cataloged as placeholders or baselines. They are allowed to keep the current runtime rendering while future art replaces them.

Fallback rules:

- Future final assets should use the same swap group as the placeholder they replace.
- Room-specific floors and walls fall back to generic floor/wall baselines.
- Derived CC0 greenhouse floor/wall keys retain explicit inline fallback entries because those keys currently override loaded inline placeholders at runtime.
- Procedural avatar, portrait, HUD, surveillance, VFX, audio, and font surfaces are cataloged as approved placeholders until authored assets exist.
- Fallbacks must never require renderer rule changes, agent changes, or engine changes.

## Placeholder Policy

Placeholders must be marked with:

- `placeholder: true`
- a source ledger row
- clear notes that say placeholder, baseline, or fallback
- `runtimeReady: true` only when the source is reviewed and legally safe

Placeholder art is not final production art. A PR that replaces a placeholder with final art must update the catalog entry, source ledger, dimensions, source/license status, and notes in the same change set.

## Generated Reference Versus Runtime-Ready

Generated references are design inputs, not runtime assets.

Generated reference entries must use:

- `generatedReferenceOnly: true`
- `runtimeReady: false`
- `licenseStatus: "GeneratedReferenceOnly"`
- a sourceId that records the generated-reference workflow

Generated references must not be placed in runtime public asset folders or treated as project-owned final art unless a later explicit ownership review reclassifies them.

`UnknownBlocked` assets are also never runtime-ready.

## Codex Skill And Plugin Decision

The old planning branch contained several `.agents/skills` candidates. Asset Pipeline V2 adds only scoped repo skills:

- `.agents/skills/asset-license-guard/SKILL.md`
- `.agents/skills/production-art-guard/SKILL.md`

The skills were rewritten for the current pipeline. The branch does not add old `agents/openai.yaml` files, unrelated planning skills, or a full Codex plugin.

## Prompt 6: Manor Environment Plates

Prompt 6 should add environment plates through the V2 catalog, not through ad hoc `ManorWorldStage.ts` edits.

Expected path:

1. Add reviewed source ledger rows for project-owned, CC0, CC-BY, or custom-owned source material.
2. Add catalog entries for room plates, floors, walls, thresholds, corridors, exterior storm layers, light masks, blackout masks, hero props, clue props, and task props.
3. Use `swapGroup` values that match the current placeholder surface being replaced.
4. Keep fallback keys pointing at the current inline, derived, or procedural placeholders until the full room set is complete.
5. Update renderer code only where needed to consume already-cataloged keys.

Do not import final manor art without source review. Do not use generated references as runtime plates.

## Prompt 7: HUD Panels

Prompt 7 should use categories such as `hud-panels`, `hud-icons`, `evidence-chips`, `support-seals`, `vote-tokens`, and `surveillance-frames`.

HUD assets must preserve live-mode boundaries:

- show public actions, evidence, claims, contradictions, support levels, votes, and outcomes
- never show private reasoning, hidden-role analytics, benchmark panels, or fairness charts in `/game/[roomId]`
- keep replay and fairness tools behind dev surfaces

Panel art should be cataloged before renderer integration.

## Prompt 8: Portraits And Character Sprites

Prompt 8 should use categories such as `character-world-sprites`, `character-portraits`, and `posture-emotion-states`.

Character assets must:

- preserve public-state-only posture and emotion mapping
- keep portraits and world sprites visually aligned
- keep all ten agents readable by silhouette before color
- avoid per-agent model or behavior differences
- keep generated references separate from runtime-ready art

The current procedural avatar and portrait entries are placeholders and should remain valid fallbacks during replacement.

## Contributor Workflow

Open-source contributors adding assets should:

1. Read the art-direction V2 docs and this pipeline doc.
2. Add final runtime files only under the approved public asset tree when the prompt explicitly scopes asset import.
3. Keep source files and runtime exports separate.
4. Add source ledger metadata before or with catalog entries.
5. Add dimensions and intended runtime purpose.
6. Mark placeholders and generated references explicitly.
7. Run the client-game asset tests and quality gates.

## License Review

License review must confirm:

- author or owner
- source URL or source file
- license status
- attribution requirement
- derivative/share-alike obligations
- whether the asset is placeholder, generated reference, or final runtime art
- whether runtime use is approved

CC0 is preferred for third-party placeholders. CC-BY and custom-owned assets need explicit attribution/review notes. Unknown or ambiguous licenses are blocked.

## What Not To Do

- Do not merge old stacked production-art branches.
- Do not apply stash state from old work.
- Do not import third-party art without source and license review.
- Do not commit generated references as final runtime assets.
- Do not make renderer edits just to sneak in art.
- Do not change gameplay, engine authority, agent behavior, win conditions, model behavior, replay semantics, or benchmark boundaries.
- Do not let `/game/[roomId]` become a dashboard or analytics surface.
- Do not edit `apps/web/next-env.d.ts` or `apps/web/public/data/fairness-report.latest.json` for asset-pipeline work.

## Tests

Asset Pipeline V2 tests live in:

```text
packages/client-game/src/bootstrap/assetCatalogV2.test.ts
```

They validate catalog integrity, current manifest/inline/derived/source coverage, resolver helpers, generated-reference blocking, unknown-license blocking, placeholder marking, and manor layout art-key resolution.
