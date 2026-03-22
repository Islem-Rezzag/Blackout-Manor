# Embodied Spectator Overhaul Roadmap

Milestone 6 is now the Embodied Spectator Overhaul.

## 6A Donor Audit And Art-Direction Lock

### Goal
Lock donor boundaries, visual language, house program, asset plan, and implementation order before runtime changes begin.

### Files Likely Affected
- `docs/design/`
- `docs/architecture/migration-plan.md`
- `AGENTS.md`

### Risks
- Overcommitting to donors without clear license boundaries
- Allowing future runtime changes to drift from the design lock

### Acceptance Criteria
- donor strategy is documented
- visual language is locked
- house program is locked
- asset plan is separated into importable and reference-only

## 6B Floorplan Rebuild

### Goal
Rebuild the manor as one readable connected floorplan with clear corridors, thresholds, and room anchors.

### Files Likely Affected
- `packages/content/src/maps/`
- `packages/client-game/src/tiled/`
- `packages/client-game/src/stage/ManorWorldStage.ts`

### Risks
- Breaking existing room readability
- Overfitting the art layout to current placeholder assets

### Acceptance Criteria
- one connected house reads clearly at overview scale
- room adjacency matches the locked house program
- the cutaway still supports overview and surveillance

## 6C Movement And Navigation Rewrite

### Goal
Replace room-hop feeling with embodied travel through corridors, doors, and hotspots.

### Files Likely Affected
- `packages/client-game/src/directors/`
- `packages/client-game/src/stage/`
- `packages/client-game/src/entities/avatar/`

### Risks
- Introducing client-side authority drift
- Making movement too slow or too noisy for spectator reading

### Acceptance Criteria
- travel is visible and spatial
- room entry and exit are legible
- authoritative state remains unchanged

## 6D Meeting Blocking And Seating

### Goal
Stage meetings as physical gathering, table seating, and in-world discussion presence.

### Files Likely Affected
- `packages/client-game/src/scenes/MeetingScene.ts`
- `packages/client-game/src/directors/MeetingDirector.ts`
- `packages/client-game/src/entities/avatar/MeetingPortraitStrip.ts`

### Risks
- Meeting staging becoming too slow
- Portrait UI fighting the physical staging

### Acceptance Criteria
- all living agents visibly gather into the dining room
- seating is stable and readable for 10 agents
- vote and exile outcomes are staged in-world

## 6E Task Readability

### Goal
Make tasks and sabotage responses legible as embodied actions at room hotspots.

### Files Likely Affected
- `packages/client-game/src/stage/`
- `packages/client-game/src/scenes/ManorWorldScene.ts`
- `packages/client-game/src/ui/ObservationHud.ts`

### Risks
- Adding too much UI instead of animation
- Turning tasks into noisy marker spam

### Acceptance Criteria
- spectators can identify what kind of public action is occurring
- sabotage responses stand out without breaking the minimal HUD

## 6F Character Identity Pass

### Goal
Upgrade cast distinctiveness through silhouettes, outfit kits, masks, posture bias, and portrait consistency.

### Files Likely Affected
- `packages/client-game/src/entities/avatar/`
- `packages/client-game/src/ui/`
- future asset manifests

### Risks
- Characters becoming readable only by color
- Asset kits drifting away from the locked visual language

### Acceptance Criteria
- all ten agents are distinguishable at a glance
- portrait and in-world identity remain aligned

## 6G Audio And Event Feedback

### Goal
Introduce room-aware audio, storm pressure, door and footstep Foley, and event stingers that support spectator reading.

### Files Likely Affected
- `packages/client-game/src/audio/`
- `packages/client-game/src/fx/`
- asset manifests and future credits docs

### Risks
- Audio clutter
- importing assets before license review is complete

### Acceptance Criteria
- major events are audible
- meeting, report, sabotage, and clue moments get distinct feedback
- sound remains supportive, not overwhelming

## 6H Room Zoom / Inspection Mode

### Goal
Add a more deliberate room inspection mode on top of the whole-manor and surveillance modes.

### Files Likely Affected
- `packages/client-game/src/directors/CameraDirector.ts`
- `packages/client-game/src/directors/SurveillanceDirector.ts`
- `packages/client-game/src/scenes/ManorWorldScene.ts`

### Risks
- Losing whole-manor context
- creating a separate mini-app feel

### Acceptance Criteria
- room zoom feels cinematic and reversible
- `Esc` or equivalent returns cleanly to overview
- surveillance and room focus remain coherent

## 6I Asset And License Integration

### Goal
Integrate approved donor assets and placeholder packs through manifests, credits, and clean replacement targets.

### Files Likely Affected
- `packages/client-game/src/bootstrap/assetManifest.ts`
- `docs/design/ASSET_PLAN.md`
- future credits/license docs

### Risks
- mixed-license contamination
- hard-coding temporary assets into runtime logic

### Acceptance Criteria
- all imported assets are documented
- all imports flow through manifests
- replacement targets remain explicit

## 6J Benchmark Safety Pass

### Goal
Verify the overhaul preserves replay safety, authority boundaries, live-route discipline, and benchmark/privacy constraints.

### Files Likely Affected
- `packages/client-game/`
- `tests/e2e/`
- `docs/architecture/`

### Risks
- leaking analytics into live mode
- quietly changing replay-visible semantics through presentation shortcuts

### Acceptance Criteria
- live route stays game-first and analytics-free
- replay compatibility remains intact
- benchmark tooling stays behind `/dev`
