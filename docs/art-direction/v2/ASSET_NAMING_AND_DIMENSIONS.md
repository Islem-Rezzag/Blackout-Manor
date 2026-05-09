# Asset Naming And Dimensions V2

## Purpose

This document defines the future production-art file structure and naming discipline for Blackout Manor. It is a planning spec only. It does not add runtime assets and does not change the current manifest.

Future art implementation should connect this structure to an asset manifest v2 instead of dropping files directly into runtime code.

## Proposed Folder Structure

Recommended source tree:

```text
art-source/
  blackout-manor/
    v2/
      environment/
        rooms/
          grand-hall/
          dining-meeting/
          kitchen/
          library/
          study/
          ballroom/
          greenhouse/
          surveillance-room/
          generator-room/
          cellar/
        corridors/
        exterior/
      characters/
        iris/
        victor/
        seraphina/
        dante/
        elise/
        jasper/
        lyra/
        felix/
        nora/
        silas/
      hud/
      figma-exports/
      licenses/
```

Recommended runtime/public tree for future cleared assets:

```text
apps/web/public/game-assets/client-game/v2/
  environment/
    rooms/
    corridors/
    exterior/
  characters/
    sprites/
    portraits/
  hud/
    panels/
    icons/
    typography/
  manifests/
```

Source files and runtime exports should stay separate. Do not commit huge working files unless the repository explicitly adopts that storage strategy.

## Naming Convention

Use lowercase kebab-case:

```text
{category}-{subject}-{variant}-{state}-{resolution}.{ext}
```

Examples:

```text
room-grand-hall-plate-clean-2400x1500.png
floor-grand-hall-v2-runtime-1024x768.png
wall-library-v2-runtime-1152x384.png
prop-generator-core-lit-1024.png
threshold-social-open-256x384.png
portrait-iris-neutral-512x768.png
sprite-felix-world-atlas-1024.png
hud-claim-docket-supported-960x540.png
```

Rules:

- Put room or suspect name immediately after the category.
- Put state after variant: `lit`, `blackout`, `alert`, `open`, `sealed`, `contested`, `supported`.
- Include dimensions in exported filename when the file is a raster runtime target.
- Use `v2` in asset keys and metadata, not necessarily every source filename if folder already scopes version.
- Avoid spaces, uppercase, punctuation beyond hyphen, and ambiguous abbreviations.

## Required Asset Categories

### Environment

- room floor plates
- room back walls and cutaway walls
- room trim and foreground occluders
- hero props
- secondary prop clusters
- task hotspot props
- body readability masks
- path and clearance masks
- door/threshold families
- corridor floor strips
- exterior storm/backdrop layers
- warm light masks
- cold window/storm light masks
- blackout and emergency-state masks

### Characters

- world sprite or cutout rig source
- locomotion sheets/atlases
- posture state sheets
- task interaction poses
- meeting seated poses
- vote/accuse/react poses
- body silhouettes
- portraits
- expression layers
- identity accessory layers

### HUD

- panel plates
- brass borders/hairlines
- parchment evidence chips
- support-level seals
- contradiction alert stamp
- vote tokens
- cast portrait frames
- surveillance feed frames
- room inspection plates
- phase banners
- icons for public event types

### Metadata

- source ledger
- license ledger
- manifest v2 file
- atlas map data
- sourceId mapping
- Figma component export notes

## Recommended Dimensions

### Room Plates

| Asset Type | Source Size | Runtime Target |
| --- | ---: | ---: |
| Large room reference plate | 2400x1400 to 2600x1500 | not runtime by default |
| Grand Hall floor | 2048x1536 | 1024x768 |
| Dining/Meeting floor | 2560x1440 | 1280x720 |
| Standard room floor | 2048x1344 | 1024x672 or 1152x768 |
| Room back wall | 2048x768 | 1024x384 |
| Glass/exterior wall | 2048x896 | 1024x448 |
| Corridor strip | 2048x512 | 1024x256 or 1024x384 |
| Door threshold | 512x768 | 256x384 |
| Hero prop source | 1024x1024 or 1536x1536 | 512 or 1024 max edge |
| Lighting mask | match parent plate | match runtime plate |

### Character Assets

| Asset Type | Source Size | Runtime Target |
| --- | ---: | ---: |
| Character turnaround sheet | 2048x2048 | source only |
| World sprite atlas | 2048x2048 | 1024x1024 or 2048x2048 |
| Single world frame | 256x384 | 128x192 or runtime scaled |
| Portrait source | 1536x2048 | source only |
| Portrait runtime | 1024x1536 | 512x768 |
| Portrait fallback | 512x768 | 256x384 |
| Expression layer | match portrait | match portrait |

### HUD Assets

| Asset Type | Source Size | Runtime Target |
| --- | ---: | ---: |
| Main HUD rail | 1920x160 | scalable 9-slice |
| Subtitle strip | 1600x220 | scalable 9-slice |
| Event board | 960x720 | scalable 9-slice |
| Claim/evidence panel | 1280x1600 | scalable 9-slice |
| Contradiction alert | 1400x420 | scalable 9-slice |
| Vote token | 256x256 | 128x128 |
| Evidence chip | 512x192 | 256x96 |
| Support seal | 256x256 | 128x128 |
| Phase banner | 1920x320 | scalable 9-slice |

## Layer Naming

Use stable layer names so future scripts and artists can export predictable assets:

```text
floor_base
floor_detail
wall_back
wall_trim
door_thresholds
hero_props
secondary_props
task_hotspots
foreground_occluders
character_path_mask
body_clearance_mask
warm_light
cold_light
blackout_mask
alert_light
contact_shadow
source_notes
```

For characters:

```text
head
hair
mask
eyes
torso
left_upper_arm
left_forearm
left_hand
right_upper_arm
right_forearm
right_hand
hips
left_leg
right_leg
feet
garment_front
garment_back
accessory
expression_neutral
expression_speaking
expression_suspicious
expression_fearful
```

For HUD:

```text
panel_base
panel_shadow
border_brass
glass_sheen
parchment_insert
icon
label
state_supported
state_contested
state_contradicted
state_unverified
safe_text_area
```

## Atlas And Sprite-Sheet Guidance

- Pack world character frames per suspect or per motion family, not one enormous all-cast sheet unless profiling supports it.
- Keep transparent padding around garments and accessories so motion does not clip.
- Use power-of-two atlas targets when practical: 1024, 2048, or 4096.
- Keep atlas JSON beside exported PNG.
- Do not bake UI text into runtime images unless the text is decorative and never localized or data-bound.
- Use 9-slice panel assets for scalable HUD plates.
- Use separate masks for light, blackout, and alert states instead of destructive paint edits.
- Preserve source turnarounds even if runtime exports are flattened.

## Fallback Placeholder Policy

Placeholders are allowed only when they are clearly marked and legally clean.

Rules:

- Filename or metadata must include `placeholder: true`.
- Placeholder assets must use a sourceId that identifies the placeholder source.
- Placeholder art should be visually subdued enough that future reviewers can identify it as temporary.
- Do not mix final and placeholder layers in the same exported runtime file unless the manifest records it.
- Do not use generated references as placeholders unless the workflow documents them as non-final and license-safe for the repository.
- A final production asset must replace placeholder metadata, sourceId, license fields, and visual QA notes in the same change set.

## SourceId And License Metadata Policy

Every runtime asset entry should have metadata:

```ts
type ClientGameAssetV2 = {
  key: string;
  kind: "image" | "atlas" | "audio" | "font";
  relativePath: string;
  sourceId: string;
  license: "CC0" | "MIT" | "Custom-Owned" | "Generated-Reference-Only" | "Placeholder";
  author?: string;
  sourceUrl?: string;
  sourceFile?: string;
  placeholder: boolean;
  generatedReferenceOnly?: boolean;
  dimensions?: { width: number; height: number };
  swapGroup: string;
};
```

Policy:

- `sourceId` must be stable and unique.
- Keep source ledgers separate from code comments.
- Record author, source URL, license, modification notes, and attribution text where required.
- Generated reference images that are not final runtime assets should not receive runtime manifest keys.
- Final internally created assets should use a project-owned sourceId such as `blackout-manor-v2-owned`.
- Open-source imports need explicit license compatibility review before commit.

## Future Asset Manifest V2 Connection

The current `assetManifest.ts` already separates keys, source IDs, placeholders, and manifest loading. Manifest v2 should extend that discipline rather than replace it.

Recommended manifest v2 properties:

- room asset bundles by `RoomId`
- layer-specific keys for floor, wall, props, light masks, blackout masks, and path/body masks
- character bundles by player archetype or cast key
- HUD bundle by surface type
- license/source metadata connected to each runtime file
- `placeholder` and `generatedReferenceOnly` flags
- source dimensions and intended runtime display bounds
- explicit swap groups such as `environment-room-v2`, `character-portrait-v2`, `hud-claim-v2`

Example key family:

```ts
{
  roomId: "library",
  floorKey: "floor-library-v2",
  wallKey: "wall-library-v2",
  heroPropKeys: ["prop-library-fireplace-v2", "prop-library-radio-desk-v2"],
  lightMaskKey: "light-library-v2",
  pathMaskKey: "mask-library-paths-v2",
  bodyMaskKey: "mask-library-body-v2"
}
```

Manifest v2 should make it possible to replace production art without changing engine rules, agent logic, or route ownership.
