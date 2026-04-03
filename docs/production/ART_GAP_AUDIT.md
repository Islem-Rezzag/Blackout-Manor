# Production Art Gap Audit

## Scope
This document is the Milestone `8A` audit for the current spectator-first alpha. It is intentionally blunt. The goal is to explain why Blackout Manor now reads as a strong alpha presentation but still does not read like a top-tier finished game.

This audit does not propose gameplay, HEART, route, or benchmark changes. It evaluates presentation only.

## Executive Summary
Blackout Manor currently succeeds at structure, readability intent, and spectator-first staging. It fails at production-art authority.

The runtime now looks like a carefully directed alpha, not a shipped premium game. The core issue is not architecture. The core issue is that too many visible layers are still synthesized, placeholder-like, repeated, or insufficiently authored:

- the manor shell language is still procedural and too uniform
- room dressing is too sparse and too diagrammatic
- key hero props are isolated silhouettes instead of rich authored set pieces
- avatars are clever vector rigs, but they still read as system-generated stand-ins rather than finished character art
- meeting portraits are readable, but not yet premium portrait illustration
- the HUD is legible, but still closer to a polished overlay than a final branded broadcast package
- audio is serviceable and privacy-safe, but still unmistakably synthetic

The result is that the game reads as "impressive prototype with discipline" rather than "finished original visual world."

## What Already Works Well

### Structural strengths
- The runtime is genuinely game-first rather than dashboard-first.
- `/game` remains analytics-free and correctly owned by the Phaser runtime.
- The manor now reads as one connected space better than earlier milestones.
- Room inspection, surveillance, meeting travel, and replay share a coherent runtime language.
- Stage layering, cutaway logic, event emphasis, and task readability are architecturally ready for better art.

### Spectator strengths
- Whole-house orientation is stronger than earlier builds.
- Character clustering is more readable than before.
- Meetings now stage as physical gatherings rather than abstract UI state.
- The event board, subtitle strip, and room status language are understandable at a glance.
- The asset manifest and source documentation are clean enough to support a safe replacement program.

### Production-pipeline strengths
- `Tiled`-driven layout and room metadata can survive a full art replacement.
- `importedArt.ts`, `assetManifest.ts`, and `assetSources.ts` already isolate swap points.
- `ManorWorldStage.ts` has explicit art layers instead of one unstructured render soup.
- `PlayerAvatarLayer.ts`, `AvatarRig.ts`, and `MeetingPortraitStrip.ts` define stable presentation surfaces that can be upgraded without changing rules.

## What Currently Looks Prototype-Grade

### Manor shell treatment
The rooms still inherit the same shell grammar: rounded shell, repeated floor treatment, repeated glow/specular treatment, repeated cutaway wall logic. That makes the house readable, but not authored.

The current manor reads like one rendering system applied many times, not one bespoke estate with rooms shaped by architecture and furniture.

### Environment material quality
The baseline art is legally clean, but visually thin:

- floor/wall materials repeat too often
- thresholds are serviceable, not memorable
- shadows and highlights are generalized rather than object-specific
- window treatment and storm spill are atmospheric but not materially convincing

The environment still feels like a stylized blockout with finish applied on top.

### Prop density and set dressing
Most rooms still have one or two real hero props plus abstract decor shapes. That is enough for task readability, but not enough for premium environmental storytelling.

Many spaces still read as:
- "room background + one interactable prop"
- "empty circulation field with decorative accents"
- "symbolic room fiction rather than lived-in room fiction"

### Character rendering
The avatar system is technically smart but visually limited:

- procedural vector drawing still reads as generated geometry
- outfits imply masquerade styling but do not deliver final garment richness
- motion has improved, but still lacks real weight shifts, anticipation, garment drag, and follow-through
- the cast is more distinct than before, yet still not instantly iconic

The avatars now clear the alpha bar. They do not clear the "premium spectator game" bar.

### Portrait presentation
Meeting portraits are organized well and structurally consistent, but they still read as dressed-up runtime cards rather than final character art. The framing language is there; the finish level is not.

### Audio finish
The current mix is subtle and readable, but it is still an oscillator-driven placeholder layer. It supports interaction clarity. It does not build a believable manor or a luxury-thriller sound identity.

## What Still Feels Fake Or Generic

### Fake
- repeated shell shading across rooms
- generalized glow/specular passes that are not tied to actual material response
- furniture rendered as isolated icons or silhouettes rather than integrated set dressing
- avatar anatomy and costume folds implied by shape language instead of authored art
- synthetic tones standing in for diegetic room sound

### Generic
- too many surfaces still share the same baseline panel/floor/wall treatment
- room identities lean on labels and hotspot cues more than on pure environmental silhouette
- the live broadcast overlay is competent, but not yet unmistakably Blackout Manor
- the launcher copy and chrome are clean, but still feel like a strong web shell rather than a final game presentation campaign

## Room Composition Problems

### Whole-manor composition
- The manor is readable, but it still does not form one unforgettable poster composition.
- Some rooms still feel like neighboring modules rather than wings inside one designed estate.
- The wide view relies on stage effects and labels to carry clarity that the architecture should increasingly carry by itself.

### Per-room composition
- Some rooms lack a dominant focal cluster visible from the whole-manor view.
- Traversal space sometimes wins over lived-in density, making rooms feel too open.
- Cutaway clarity is good, but some spaces become too diagrammatic because the furniture rhythm is underdeveloped.
- Adjacent rooms do not always differentiate themselves fast enough through shape alone.

### Meeting room
- The meeting destination is functionally readable, but the set itself still lacks a premium centerpiece table, chair language, wall treatment, and lighting composition.
- The tribunal feeling comes from staging logic and overlays more than from the room art itself.

## Furniture And Prop Density Problems

### Current density issue
The room program is intellectually correct, but not yet visually saturated enough.

Rooms need:
- more secondary furniture
- more wall-bound dressing
- more floor clutter with restraint
- stronger prop stacking and grouping
- more architectural trim and object scale contrast

### Current symptom by room type
- `Grand Hall`: orientation is good, but the room still lacks grand-architecture authority.
- `Kitchen`: task hotspots are readable, but the room still feels underdressed for a working service space.
- `Library` and `Study`: fiction is strong, but object richness is still too sparse to feel premium.
- `Ballroom`: readable silhouette, but still more stage blockout than fully realized social room.
- `Greenhouse`: glazing mood is present, but planting density and bench detail are still too light.
- `Surveillance Hall` and `Generator Room`: functional, but closer to clean prop stations than richly built technical spaces.
- `Cellar`: the boiler logic is readable, but the room needs much heavier machinery presence.

## Character Art And Animation Problems

### Art problems
- Vector rigs are readable but still too clean and too mathematically smooth.
- Garment silhouettes suggest class/costume differences without delivering tailored finish.
- Mask language is varied, but not yet luxurious.
- Body variety exists in system form more than in authored character-presence form.

### Animation problems
- Locomotion is less snappy than before, but still lacks final animation nuance.
- Idle behavior remains system-generated rather than character-authored.
- Gesture language communicates state, but not theatrical specificity.
- Group scenes still need stronger spacing, settle timing, and reactive micro-blocking.

### Portrait/world consistency gap
The current rig and portrait strip do a solid job maintaining identity continuity, but both sides are still built from the same placeholder-grade visual vocabulary. They are aligned; they are not final.

## Camera, Pacing, And Readability Problems

### Camera
- The wide cutaway is functional, but not yet compositionally luxurious.
- Inspection mode zooms correctly, but it still feels like a smart camera state, not a hand-authored cinematic framing language.
- Meeting focus is clearer than before, but the scene still depends on overlay treatment to feel dramatic.

### Pacing
- Travel timing has improved, yet scenes still lack the confidence of final timing direction.
- Camera lingers are better, but still feel system-tuned rather than editorially authored.
- Some event reveals still read as "runtime emphasis" instead of "showpiece staging."

### Readability
- Readability currently leans on overlays, labels, and hotspot logic more than on pure environmental clarity.
- This is acceptable for alpha. It is not the final target.

## UI, Text Scale, And Event Board Problems

### What works
- The observation HUD is much stronger than earlier milestones.
- Text scale is no longer tiny.
- Subtitle and event hierarchy is understandable in motion.

### Remaining problems
- The event board is still a tasteful overlay, not a fully owned broadcast package.
- Typography choices are solid but not distinctive enough to carry final identity.
- Some HUD plates still feel like polished utility panels rather than premium diegetic-broadcast elements.
- Meeting plates and portrait-strip framing are readable, but still visibly system-driven.
- The launcher shell is good alpha marketing, but not yet a final brand campaign surface.

## Audio Polish Gaps
- Current cues are synthesized, not recorded/designed production assets.
- Footsteps are categorized correctly but still too abstract.
- Room ambience exists, but not as authored location soundscapes.
- Meetings need table/chair/crowd texture beyond simple signal reinforcement.
- Storm needs more layered environmental identity and less "procedural mood bed" feel.
- Audio currently supports readability more than fiction.

## What Must Be Replaced

### Replace first
- room shell art language
- floor, wall, threshold, and trim sets
- hero props for every high-readability room
- meeting table, chairs, and surrounding set dressing
- portraits
- in-world avatar art and animation
- broadcast typography package for subtitles / state plates / event board
- synthetic public feedback audio

### Replace later but still replace
- launcher visual campaign treatment
- some generalized VFX textures once room/material art is stronger

## What Can Stay

### Architecture and systems that should survive
- Tiled-authored room and corridor layout approach
- world-first scene/director ownership
- room focus / surveillance / replay route separation
- task readability geometry model
- manifest-driven asset loading
- source tracking and licensing discipline

### Presentation structures that can stay with art replacement
- `ManorWorldStage.ts` layer separation
- `PlayerAvatarLayer.ts` identity/label/status responsibilities
- `MeetingPortraitStrip.ts` role as a meeting presentation surface
- `ObservationHud.ts` information architecture
- `SoundBus.ts` cue taxonomy and public-only routing, but not the synthesized sound content

## Bottom Line
Blackout Manor is no longer blocked by product direction. It is blocked by authored finish.

The next production-art phase should not chase more systems polish first. It should replace the environment, character, and audio baselines that are currently carrying too much of the runtime's visible identity. Until that happens, the project will continue to look like a sophisticated alpha rather than a premium final game.
