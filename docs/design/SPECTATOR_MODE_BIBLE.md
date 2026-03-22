# Blackout Manor Spectator Mode Bible

## Purpose
This document defines the locked spectator-facing visual and staging language for Blackout Manor on the `feat/world-first-runtime` branch. It is the source of truth for future presentation work in `packages/client-game`.

## Product Reality
- Blackout Manor is currently a spectator-first alpha.
- The public entry is the launcher at `/`.
- The primary runtime is `/game/[roomId]`, with `/game/demo` as the easiest review route.
- Replay and fairness tools live behind `/dev`.
- This document governs the next presentation overhaul without changing engine rules, agent cognition, server authority, or replay semantics.

## Non-Negotiables
- The live product is a game-first runtime, not a dashboard.
- Rooms must exist inside one connected manor, not as isolated cards.
- Characters must be readable as stylized masquerade-era humans, not abstract widgets.
- Movement must be embodied through doors, corridors, thresholds, and hotspots.
- Meetings must happen around a physical table with walking, seating, and staging.
- Live play must stay free of benchmark and debug overlays.
- Replay and fairness tools remain separate from the player-facing route.
- No copyrighted Among Us assets, OpenSuspect code, or ripped art may be imported.

## Locked Donor Strategy

### Primary Code Donor
- `danielart/phaser-rpg-template` (MIT)
- Use for: room traversal grammar, layered map handling, door and corridor logic, interaction rhythm, and a cleaner model for embodied movement through a connected house.
- Do not use it to overwrite Blackout Manor's runtime architecture wholesale. The current scene/director ownership stays in place.

### Motion Donor
- `kumarankm/Amongus` (MIT)
- Use for: readable top-down locomotion cadence only, especially pacing, anticipation, and quick readability of character direction changes.
- Do not borrow character shape language, iconography, UI identity, or social-deduction branding cues.

### Genre Reference Only
- `OpenSuspect` (GPL-3.0)
- Use for: ambition reference, task and meeting readability ideas, spectator-mode aspirations.
- Do not transplant code, art, audio, or GPL-bound implementation details into this repository.

### Importable UI and Audio
- Kenney UI Pack (CC0)
- Kenney UI Audio (CC0)
- Use for: temporary but clean alpha-ready buttons, panels, prompts, feedback sounds, and menu affordances outside the live runtime's bespoke game identity.

### Importable Environment Baseline
- OGA `Modern Houses Tileset TopDown` (CC0)
- Use only as a safe baseline for floorplan blocking, room dressing placeholders, and quick environment readability if the current procedural baseline needs support during the overhaul.

### Reference-Only Mood Sources
- OGA `mansion interior top down tileset` (CC-BY-SA 4.0)
- LPC and LPC-derived interior references
- Use for: mood study, palette guidance, density, room dressing inspiration.
- Do not import until a later explicit license review approves a compliant use path.

## Anti-Goals
- Not an Among Us clone.
- Not a Sims clone.
- Not a toolroom with game visuals layered underneath.
- Not a benchmark dashboard pretending to be a game.
- Not a room-card replay viewer with decorative maps.

## Current Architecture That Must Survive
- `GameRuntimeHost` remains the host entry point from `apps/web`.
- `packages/client-game` remains the primary product surface.
- Existing world-first scene/director ownership remains the foundation.
- Engine rules, roles, timings, and replay contracts stay untouched.
- Surveillance mode remains in-runtime rather than splitting into a separate website surface.

## Camera Model
- Default camera: whole-manor cutaway overview
- Secondary mode: room focus
- Tertiary mode: surveillance console
- Future inspection mode: controlled room zoom without changing authority
- Clicking or selecting a room may zoom into that room
- `Esc` returns to whole-manor mode
- Major events such as report, sabotage, and meeting briefly override passive roaming focus

## House Model
The manor is one connected floorplan with visible corridors, thresholds, and doors. The viewer should understand how a character got somewhere.

### Required Spaces
- Grand Hall
- Dining / Meeting Room
- Kitchen
- Pantry / Scullery
- Library
- Study
- Ballroom
- Greenhouse / Conservatory
- Surveillance Hall
- Generator Room
- Cellar / Boiler Room
- Servants’ Corridor

## Character Direction
Characters are stylized realistic humans in formal storm-night masquerade attire.

### Per-Character Identity Kit
Each agent must have:
- unique silhouette
- unique outfit cut
- one accessory
- one accent color
- one portrait framing detail
- one posture bias

### Visible Posture States
These derive from public state only:
- calm
- alert
- suspicious
- shaken
- confident
- defiant

## Motion Rules
- No room-to-room teleporting.
- All travel must pass through doors and corridors.
- Room entry and exit must be visible.
- Characters must approach task hotspots before interacting.
- Walk speed is spectator-readable, not benchmark-fast.
- Major events get short camera linger.
- Movement should communicate intent, not only location change.

## Meeting Rules
- Meeting alarm rings in-world.
- All surviving agents walk to the dining room.
- Agents move to assigned chairs before the meeting interface fully settles.
- Chairs visually align around the long table.
- Portrait strip appears only after physical gathering starts.
- Vote and elimination outcomes are staged in-world first and summarized second.

## Live HUD

### Allowed
- phase label
- timer
- subtitle strip
- room status indicators
- surveillance indicators
- compact event board

### Not Allowed
- fairness charts
- hidden-role analytics
- private reasoning
- benchmark panels
- contributor and debug chrome on the live route

## Audio Direction
Required:
- footsteps by room material
- door open and close
- storm ambience
- thunder accents
- meeting bell
- sabotage pulse
- clue stinger
- furniture and chair scrape for meetings

## Licensing Rules
- Prefer CC0 or clearly compatible MIT/CC0 sources for early imports.
- Do not import ripped assets.
- Keep asset credits separate from code licensing.
- Document every imported art and audio source.
- Treat GPL and share-alike references as non-importable unless later cleared by a specific license decision.

## Integration Rules
- Presentation changes must not alter engine rules.
- Presentation changes must not expose private cognition.
- All room art must load through asset manifests.
- Surveillance feeds must reuse the same visual language as the main runtime.
- Donor logic should be adapted into Blackout Manor ownership patterns, not copied in as a parallel architecture.

## Definition Of Success
A first-time reviewer should open `/game/demo` and immediately understand:
- this is a real game runtime
- this is one connected manor
- these are distinct human characters
- movement is spatial and believable
- meetings are staged physically
- the game is spectator-first and watchable
