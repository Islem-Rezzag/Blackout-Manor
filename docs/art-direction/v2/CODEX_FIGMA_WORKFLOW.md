# Codex And Figma Workflow V2

## Purpose

This workflow explains how future Codex, Figma, and artist threads should consume the art-direction v2 packet. The goal is consistent implementation, not repeated reinvention of the visual language.

Future threads should treat these docs as the direction lock:

- `ART_BIBLE.md` defines taste, boundaries, and live/replay rules.
- `ROOM_PLATE_PROMPTS.md` defines environment art briefs.
- `HUD_STYLEFRAMES.md` defines overlay and component behavior.
- `CHARACTER_TURNAROUNDS.md` defines suspect identity.
- `ASSET_NAMING_AND_DIMENSIONS.md` defines file and manifest discipline.
- `OPEN_SOURCE_ASSET_WORKFLOW.md` defines legal/source hygiene.

## How To Use Codex With Figma Or MCP

When a Figma connector or MCP server is available:

1. Give Codex the relevant art-direction doc section first.
2. Give Codex the Figma frame/component link or selected screenshot.
3. Ask Codex to compare the design against the packet before implementation.
4. Ask for concrete pass/fail findings: room readability, HUD hierarchy, evidence privacy, asset naming, and live-mode boundaries.
5. Only then ask for implementation changes.

When a Figma connector is not available:

1. Export screenshots from Figma at desktop and constrained viewport sizes.
2. Provide the screenshots to Codex with the target doc section.
3. Ask Codex for visual QA against the packet.
4. Iterate in Figma before changing runtime code.

Codex should not infer a new art style from a single screenshot if that screenshot conflicts with the packet.

## When To Generate Images First

Generate reference images or artist briefs before implementation when:

- replacing room plates, props, portraits, or character sprites
- defining a new HUD surface styleframe
- changing lighting, material, or composition language
- deciding between multiple room silhouettes
- exploring a meeting/vote visual treatment
- preparing a Figma component family

Generated images should be labeled reference-only unless a future workflow explicitly clears them as final runtime assets.

## When To Give Codex Images Versus Text Specs

### Give Images When

- evaluating whether a design matches the north-star concept
- checking room silhouette, lighting, or material quality
- verifying character turnaround consistency
- comparing Figma frames to runtime screenshots
- diagnosing overlap, crowding, or unreadable UI
- critiquing body/task/door readability

### Give Text Specs When

- defining manifest keys
- planning file structure
- writing implementation tasks
- mapping Prompt 3 claim/evidence contracts to UI surfaces
- checking privacy or route boundaries
- updating docs or acceptance criteria
- writing PR descriptions

Best results usually come from both: image for visual truth, text for constraints and metadata.

## Screenshot-Based Visual QA

Every future implementation branch that changes presentation should capture screenshots for:

- whole-manor live view
- room focus view
- surveillance mode
- report/body moment
- meeting arrival
- vote panel
- claim/evidence or contradiction surface if touched
- replay overlay if touched

QA should check:

- manor still reads as one connected house
- doors and thresholds are visible
- agents are distinct by silhouette
- bodies are readable
- task hotspots are readable
- HUD does not cover critical world state
- live mode does not look like a dashboard
- no private chain-of-thought or hidden reasoning appears
- screenshots align with the concept image and art bible

Use desktop and smaller viewport captures when practical. Text must fit its container without overlap.

## How Future Prompts Should Consume This Packet

### Prompt 5 - Environment Art Replacement

Prompt 5 should start with:

- `ART_BIBLE.md`
- `ROOM_PLATE_PROMPTS.md`
- `ASSET_NAMING_AND_DIMENSIONS.md`
- `OPEN_SOURCE_ASSET_WORKFLOW.md`
- existing `ManorWorldStage.ts`, `assetManifest.ts`, `inlineEnvironmentArt.ts`, and `importedArt.ts`

Expected output:

- room plate source/export plan
- manifest-v2 or manifest-extension plan
- no gameplay changes
- screenshot QA for whole-manor, room focus, and door/body/task readability

Prompt 5 must not invent a new palette or room model. It should implement the room specs.

### Prompt 6 - Character And Portrait Replacement

Prompt 6 should start with:

- `ART_BIBLE.md`
- `CHARACTER_TURNAROUNDS.md`
- `ASSET_NAMING_AND_DIMENSIONS.md`
- `OPEN_SOURCE_ASSET_WORKFLOW.md`
- existing avatar and portrait runtime files

Expected output:

- ten suspect turnarounds or implementation-ready placeholders
- portrait/world consistency plan
- sprite-sheet or rig export plan
- public-state-only emotion mapping
- no hidden-role visual tells before reveal

Prompt 6 must not make the cast generic, capsule-shaped, sci-fi, or color-only.

### Prompt 7 - HUD And Prompt 3 Surfaces

Prompt 7 should start with:

- `ART_BIBLE.md`
- `HUD_STYLEFRAMES.md`
- `ASSET_NAMING_AND_DIMENSIONS.md`
- Prompt 3 contracts in `packages/shared/src/schemas/contracts.ts`
- `claimVerifier.ts`
- existing HUD/runtime UI files

Expected output:

- claim/evidence/alibi/contradiction UI using public contracts
- live-mode safe HUD hierarchy
- meeting vote and subtitle polish
- no private reasoning exposure
- screenshot QA for live, meeting, surveillance, and replay/dev surfaces

Prompt 7 must not add hidden analytics to `/game/[roomId]`.

### Prompt 8 - Visual QA And Polish

Prompt 8 should start with the full packet plus screenshots from Prompt 5-7 implementation branches.

Expected output:

- visual QA findings ordered by severity
- readability regression fixes
- source/license audit
- performance sanity check
- route boundary check
- final screenshot comparison against concept and packet

Prompt 8 should not broaden scope into new systems unless a concrete QA failure requires it.

## Codex Guardrails For Implementation Threads

Codex must:

- read the relevant packet files before editing presentation code
- keep `packages/client-game` as the primary live runtime surface
- keep `apps/web` as thin shell unless explicitly scoped otherwise
- use public contracts for claim/evidence/alibi/vote surfaces
- avoid private chain-of-thought everywhere
- preserve deterministic engine authority
- route assets through manifests and source metadata
- run screenshot QA after meaningful visual changes
- keep live mode game-first and analytics-free

Codex must not:

- invent a new visual language because a component is convenient
- turn `/game/[roomId]` into a React dashboard
- import third-party art without license review
- use generated references as final runtime assets without explicit clearance
- copy the exact concept image as a runtime plate
- add hidden-role tell colors before reveal
- obscure doors, bodies, tasks, or agents for mood
- change agent, engine, or game rules while implementing presentation

## Figma Component Naming

Recommended component set:

```text
Hud/LiveRail
Hud/SubtitleStrip
Hud/EventBoard
Hud/ClaimDocket
Hud/EvidenceChip
Hud/SupportSeal
Hud/AlibiTimeline
Hud/ContradictionAlert
Hud/MeetingVotePanel
Hud/SurveillanceConsole
Hud/ReplayOverlay
Hud/RoomInspectionPanel
Hud/CastStrip
Hud/PhaseBanner

Room/GrandHall
Room/DiningMeeting
Room/Kitchen
Room/Library
Room/Study
Room/Ballroom
Room/Greenhouse
Room/SurveillanceRoom
Room/GeneratorRoom
Room/Cellar
Room/CorridorThresholds
Room/ExteriorStorm

Character/Iris
Character/Victor
Character/Seraphina
Character/Dante
Character/Elise
Character/Jasper
Character/Lyra
Character/Felix
Character/Nora
Character/Silas
```

Figma variants should include state and size, for example:

```text
Hud/EvidenceChip state=supported size=compact
Hud/EvidenceChip state=contested size=expanded
Hud/PhaseBanner phase=meeting tone=urgent
Character/Iris emotion=suspicious pose=meeting
Room/GeneratorRoom light=blackout state=sabotage
```

## Acceptance Criteria For Future Visual Threads

A future implementation that consumes this packet should be accepted only if:

- it can name which packet sections it followed
- changed files match the requested scope
- screenshots show improved premium manor read
- live mode remains full-screen game-first
- evidence/claim/alibi surfaces show public facts only
- source/license metadata is accurate
- placeholders are clearly labeled
- no unrelated runtime or docs churn is included

If implementation pressure conflicts with this packet, update the docs deliberately in a separate planning step rather than silently drifting during code changes.
