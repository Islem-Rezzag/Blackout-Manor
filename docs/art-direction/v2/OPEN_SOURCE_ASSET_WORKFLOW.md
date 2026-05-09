# Open Source Asset Workflow V2

## Purpose

Blackout Manor must stay legally clean and open-source friendly while improving production art. This workflow defines what can be generated, referenced, imported, committed, credited, and shipped.

The short version: references can guide direction, but runtime assets must be owned by the project or licensed clearly enough for repository use.

## License-Safe Asset Workflow

1. Define the need in a spec.
   - room, character, HUD, audio, or icon
   - runtime purpose
   - dimensions and layer expectations
   - whether it is placeholder or final

2. Gather references without importing them.
   - use the concept image and internal docs first
   - collect mood references only in notes or links
   - do not copy reference art into runtime folders

3. Classify source path.
   - project-owned original
   - generated reference only
   - open-source import candidate
   - placeholder
   - rejected/unsafe

4. Verify license before commit.
   - confirm license text
   - confirm author/source
   - confirm attribution requirements
   - confirm derivative/share-alike obligations
   - confirm compatibility with repository use

5. Export through approved folders and manifest.
   - public runtime assets go under `apps/web/public/game-assets/client-game/...`
   - source ledger and license metadata must update in the same PR
   - manifest/source entries must be explicit

6. Run visual and legal QA.
   - inspect runtime screenshot
   - verify dimensions/layers
   - verify attribution file
   - verify no unsafe reference files were committed

## Generated Reference Versus Final Runtime Asset

### Generated Reference

Generated reference images can be used to explore composition, mood, or briefing direction. They should be treated as reference-only unless a later source policy explicitly approves them as final runtime art.

Generated reference files:

- may be stored in a design-only folder if needed and clearly labeled
- must not be represented as hand-owned final art without review
- must not include recognizable copyrighted characters, logos, or UI from other games
- must not imitate a living artist or copyrighted franchise style
- must not be committed as runtime assets unless cleared as final project-owned output

### Final Runtime Asset

Final runtime assets are files the game loads or ships.

Final runtime assets must have:

- sourceId
- license classification
- author/owner
- dimensions
- placeholder flag
- source URL or source file reference when applicable
- attribution requirements where applicable
- manifest entry
- visual QA screenshot or note in the PR

## Source Ledger Rules

Every committed runtime art/audio/font asset needs a ledger row.

Recommended fields:

```text
sourceId
assetKey
relativePath
category
author
sourceUrl
license
attributionRequired
modifications
placeholder
generatedReferenceOnly
reviewedBy
reviewDate
notes
```

Rules:

- One sourceId can cover a project-owned internally produced set if authorship and license are the same.
- Do not use vague source IDs like `internet`, `google`, or `ai`.
- If an asset is a modification, note the original source and modification type.
- If an asset is reference-only, mark it `generatedReferenceOnly: true` and keep it out of runtime manifests.
- If license is unknown, do not commit the asset.

## What Can Be Committed

Allowed with correct metadata:

- project-owned original art created for Blackout Manor
- CC0 assets with source and license recorded
- MIT-compatible code assets when they are actually code or tool scripts, not ambiguous art packs
- open fonts with clear licenses compatible with the project
- placeholder art that is clearly marked and source-tracked
- small reference exports created by the project team if labeled non-runtime
- Figma screenshots used for visual QA if they do not contain unsafe third-party art

Allowed only after explicit review:

- CC-BY art
- share-alike assets
- generated images intended as final runtime assets
- modified third-party asset packs
- fonts with non-standard licenses
- audio libraries

Not allowed:

- ripped game art
- screenshots from commercial games as committed assets
- copyrighted UI frames copied from another product
- franchise-style imitations
- third-party logos
- unclear-license Pinterest/ArtStation/Google image assets
- GPL or share-alike art imported into runtime without a specific compatibility decision
- reference-only art placed in public runtime folders

## Attribution Rules

- Store attribution text close to the asset source ledger, not scattered in code comments.
- Include author, title, source URL, license, and modification note when required.
- For CC0, still record source and author when available.
- For project-owned art, record author or team owner and license classification.
- Attribution should survive asset renames.
- Public credits should be generated or audited from source metadata where practical.

## Contributor Instructions

Before contributing art:

1. Read this workflow, the art bible, and the relevant room/character/HUD spec.
2. Do not add runtime art directly to code.
3. Do not import third-party art unless the license has been reviewed.
4. Provide source files or export notes for all final assets.
5. Provide a source ledger row.
6. Provide dimensions and intended runtime scale.
7. Mark placeholders clearly.
8. Include visual QA screenshots for in-runtime or styleframe review.

Pull requests should state:

- whether assets are final, placeholder, or reference-only
- what license/source path applies
- what manifest entries changed
- which screenshots were inspected
- whether any generated references were used

## Avoiding Copyrighted Game Or Style Imitation Problems

Blackout Manor is a gothic social-deduction game, but it must own its visual language.

Avoid:

- bean/capsule crewmate silhouettes
- spaceship task terminals
- emergency meeting tables copied from other games
- copied map layouts from commercial or open-source games
- UI iconography that imitates another social deduction title
- prompt phrases like "in the style of [living artist/franchise/game]"
- generated images with recognizable copyrighted characters or logos
- exact costume/face copies from reference art

Use instead:

- connected manor cutaway composition
- human masquerade silhouettes
- Victorian/gothic material references
- public evidence/claim broadcast language
- physical dining-room tribunal staging
- analog surveillance and storm-era technology

## Open-Source Cleanliness Checklist

Before merging any art PR:

- Runtime files are under the expected public asset tree.
- Source files are separated from runtime exports.
- Every runtime asset has sourceId and license metadata.
- Generated references are not accidentally used as final assets.
- Reference-only files are not in runtime folders.
- No third-party art was copied without license review.
- Attribution requirements are captured.
- Placeholder flags are correct.
- Manifest entries point to the correct files.
- Visual QA confirms readability of doors, bodies, tasks, and agents.
- Live mode still does not show private chain-of-thought or analytics.

## Branch Discipline

Planning branches may create docs and reference specs only. Runtime art branches may add assets and manifest entries. Renderer branches may change Phaser presentation code only when the implementation prompt explicitly authorizes it.

Do not combine:

- art direction docs
- final art imports
- manifest migration
- Phaser rendering refactors
- gameplay rule changes

Keeping these separate makes review easier and keeps the project legally and architecturally clean.
