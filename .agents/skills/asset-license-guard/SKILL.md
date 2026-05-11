---
name: asset-license-guard
description: Enforce Blackout Manor asset provenance, source-ledger, placeholder, generated-reference, and license safety rules when adding or changing art, audio, fonts, UI assets, asset catalogs, manifests, or production-art docs.
---

# Asset License Guard

Use this skill before importing or cataloging any image, sprite, portrait, room plate, HUD asset, audio file, font, generated reference, or third-party asset candidate.

Required workflow:
1. Read `docs/art-direction/v2/OPEN_SOURCE_ASSET_WORKFLOW.md` and `docs/production/ASSET_PIPELINE_V2.md` if present.
2. Keep final runtime files out of the repo unless the prompt explicitly scopes an asset import.
3. Add or update `packages/client-game/src/bootstrap/assetSourceLedgerV2.ts` for every new source.
4. Add or update `packages/client-game/src/bootstrap/assetCatalogV2.ts` for every runtime asset key, fallback, placeholder, or generated-reference entry.
5. Mark `generatedReferenceOnly: true` and `runtimeReady: false` for generated references unless a later review explicitly reclassifies them.
6. Mark `UnknownBlocked` or leave the asset out if author, owner, license, source URL, or attribution requirements are unclear.

Before finishing, verify:
- every catalog entry has a sourceId present in the source ledger
- placeholders are visibly marked in metadata
- CC-BY and custom-owned assets include attribution/review notes
- generated-reference and unknown-license entries cannot be runtime-ready
- no third-party art was imported without explicit source and license review
