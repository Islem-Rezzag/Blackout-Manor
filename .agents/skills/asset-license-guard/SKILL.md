---
name: asset-license-guard
description: Use when importing or planning art, audio, or UI assets. Enforces clear provenance, safe licenses, and update of asset notes.
---

# Asset License Guard

Use this skill when:
- importing images, audio, fonts, sprites, tiles, or UI packs
- changing asset manifests or asset source metadata
- changing asset docs or licensing notes
- replacing placeholders with third-party assets

Rules:
1. No ripped or ambiguous-license assets.
2. Every imported asset source must be documented.
3. `docs/assets-licensing.md` must be updated for new imports.
4. Prefer CC0 or clearly compatible licenses.
5. If an asset is not safe, keep the placeholder and document the gap.

Before finishing, verify:
- source and license are explicit
- import paths are centralized
- asset manifest metadata is updated
- docs reflect replacement intent
