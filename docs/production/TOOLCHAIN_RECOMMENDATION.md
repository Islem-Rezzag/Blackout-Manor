# Toolchain Recommendation

## Goal
Blackout Manor now needs a production-art pipeline, not more placeholder cleverness. The current runtime architecture is already strong enough to receive bespoke art. The recommended toolchain below is optimized for safe replacement of the temporary baseline while preserving current route, runtime, and benchmark boundaries.

## Recommended Production Pipeline

### 1. Tiled for authored layout and metadata
Use `Tiled` as the authoritative authoring layer for:
- room extents
- corridor widths
- door thresholds
- camera anchors
- seating anchors
- prop anchors
- hotspot approach zones
- lighting and window metadata

Why it stays:
- the current manor runtime already depends on explicit spatial metadata
- authored art should conform to layout metadata, not replace it
- this keeps art swaps separate from gameplay/state logic

What Tiled should not do:
- it should not become a paint tool for final rendering polish
- it should not carry game-rule logic that belongs elsewhere

## 2. Blender + Grease Pencil for 2.5D manor environment generation
Use `Blender` with `Grease Pencil` or a comparable NPR workflow for:
- room shell concept-to-production translation
- floor/wall/trim paintovers
- hero prop set pieces
- meeting-room centerpiece art
- exterior window mood, shadows, and architectural massing

Recommended output style:
- painterly 2.5D cutaway environment plates
- clean export slices for floors, walls, thresholds, large props, and lighting masks
- consistent room-height and camera-angle assumptions matching the current runtime

Why this is the right jump:
- the current baseline needs authored materials, depth, and silhouette richness
- the manor wants premium theatrical atmosphere, not pixel-only nostalgia
- Blender + Grease Pencil can generate cohesive room sets faster than trying to hand-draw every room from scratch in disconnected tools

## 3. LibreSprite or equivalent for sprite cleanup
Use `LibreSprite` or an equivalent raster cleanup tool for:
- trimming exported plates and prop slices
- palette correction
- silhouette cleanup
- edge cleanup for alpha channels
- 2D compositing fixes after Blender export

This is the right place to:
- tighten exported prop silhouettes
- polish masks, costume details, and portrait accents
- normalize sprite readability at runtime scale

## 4. DragonBones or equivalent for cutout human animation
Use `DragonBones`, `Spine`, `Creature`, or an equivalent cutout-animation tool for:
- locomotion cycles
- idle breathing and settle
- meeting posture holds
- accusation / recoil / reassure gesture variants
- portrait/in-world pose consistency

Why a dedicated cutout tool is recommended:
- the current procedural rig solved the alpha problem, not the final animation problem
- production-ready masquerade humans need authored motion arcs, garment drag, overlap, and better settle timing
- animation data should be exportable and maintainable rather than encoded as increasingly complex vector draw logic

## Safe Replacement Of The Current Approved Asset Baseline

### Current baseline
The current environment baseline is legally clean and should remain the temporary blocker baseline until bespoke art is ready:
- OGA `Modern Houses Tileset TopDown` via the existing manifest/source system

### Safe replacement method
Replace the baseline through manifests and source tracking, not ad hoc file drops:

1. keep `assetManifest.ts` as the loading surface
2. keep `assetSources.ts` as the legal/source ledger
3. route environment swaps through `importedArt.ts` and any derived-asset planning surfaces
4. keep public assets in the approved `apps/web/public/game-assets/client-game/...` tree
5. document every new source and replacement intent in `docs/assets-licensing.md`

### What to avoid
- direct art imports without manifest/source entries
- mixing final bespoke art and temporary donor assets in undocumented ways
- replacing layout metadata with baked art guesses
- copying reference-only or unclear-license sources into the runtime

## What Frontend Skill Is Useful For
`frontend-skill` is useful for:
- visual hierarchy audits
- composition critique
- overlay/HUD typography direction
- spacing and grouping decisions
- launcher and shell presentation direction
- defining the "big idea" for a premium spectator-first experience
- evaluating whether the runtime reads as a game or as a tool

## What Frontend Skill Cannot Solve
`frontend-skill` cannot create the final art pipeline by itself. It does not replace:
- bespoke environment illustration
- finished character concept art
- cutout-animation rigging
- portrait painting
- prop modeling/painting
- high-quality Foley and ambience recording / design

It is useful for direction, not for manufacturing final production assets.

## Recommended Team Workflow

### Environment workflow
1. lock room-by-room replacement targets in `Tiled`
2. block and light rooms in `Blender`
3. paint/finish with `Grease Pencil`
4. clean exports in `LibreSprite`
5. wire exports through manifests
6. verify whole-manor readability in runtime

### Character workflow
1. lock cast silhouettes and costume kits
2. create portrait and in-world turnaround sheets
3. build cutout rigs in `DragonBones` or equivalent
4. export motion states for locomotion, idle, and public gestures
5. verify portrait/world continuity at runtime scale

### Audio workflow
1. replace oscillator cues with clean authored placeholder-safe recordings
2. build room-material footstep sets
3. create layered storm / meeting / sabotage ambience
4. keep the current cue taxonomy while replacing the sound content

## Bottom Line
The current runtime does not need a new frontend architecture. It needs a real production-art toolchain.

Recommended stack:
- `Tiled` for authored layout + metadata
- `Blender + Grease Pencil` for 2.5D manor environment generation
- `LibreSprite` or equivalent for sprite cleanup
- `DragonBones` or equivalent for cutout human animation

That stack best matches the current spectator-first runtime, preserves swap discipline, and gives Blackout Manor a realistic path from polished alpha to final-art credibility.
