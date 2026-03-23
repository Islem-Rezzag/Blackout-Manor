# Concept Art Review

Reference asset: [`blackout-manor-concept-v1.png`](./reference/blackout-manor-concept-v1.png)

This document translates the concept image into implementation requirements for Milestone 6B and later. The image is a north-star composition and mood target, not a literal map export.

## What The Image Gets Right
- It reads as one connected house instead of detached room cards.
- The `Grand Hall` works as a spatial anchor and visual heart of the manor.
- The warm interior versus cold storm exterior contrast is immediately legible.
- The room set already supports the social-deduction fantasy: dining room, library, study, ballroom, service spaces, surveillance room, generator room, and cellar.
- Characters read as masked humans with distinct costume silhouettes instead of abstract tokens.
- The event board sits as a restrained broadcast layer instead of a benchmark dashboard.
- Meeting staging feels physical because the `Dining Room` is clearly a destination space.

## What Becomes Implementation Requirements
- The manor must keep a dominant central hall that visually explains movement between wings.
- Major rooms need strong hero props that remain legible from whole-manor view.
- The whole-manor overview must preserve at least partial visibility of `Dining Room`, `Grand Hall`, `Library`, `Study`, `Kitchen`, `Ballroom`, `Surveillance Hall`, `Generator Room`, and `Cellar / Boiler Room`.
- Service circulation must exist as a real route, not only as implied off-screen travel.
- Dining seating for 10 agents must stay stable, visible, and camera-readable.
- Surveillance should remain an in-world console aesthetic, not a detached website layer.
- The storm exterior must remain visible enough to sell atmosphere without drowning the room interiors in darkness.

## What Stays Reference-Only
- The exact painterly finish and texture treatment.
- The exact crop and poster-like composition.
- The exact costuming of the depicted cast.
- The exact wall heights and decorative density.
- The exact placement of the event board and lower status strip.
- The exact proportions of the rooms when those proportions would hurt pathing or gameplay readability.

## What Must Change For Gameplay Readability
- Door thresholds need to be wider and more explicit than shown in the image.
- Corridor transitions need clearer sightlines so travel is easy to follow from the overview camera.
- Some shadow-heavy corners should be opened up or simplified near interaction hotspots.
- Hotspot props must be placed on the readable edge of a room rather than buried inside dense dressing.
- The `Study`, `Generator Room`, and `Cellar / Boiler Room` need stronger task-side clearance than the art currently suggests.
- The `Dining Room` table needs more spacing around chair backs and aisle lanes for 10-character meeting blocking.
- The whole-manor mode should reduce decorative clutter compared with the concept so doors, routes, and public actions remain readable.

## What Must Change For Pathing, Camera, And Task Clarity
- The path network must be continuous and explicit: hall routes, service corridor routes, greenhouse access, and lower-level access all need visible logic.
- `Grand Hall` should be a camera anchor with clean diagonals and visible exits to the west wing, east wing, and lower/service routes.
- `Kitchen` and `Pantry / Scullery` need a clearer service loop so support movement does not feel like teleporting.
- `Library` and `Study` need either a visible internal door or a shared threshold strategy that makes accusation scenes readable.
- `Surveillance Hall`, `Generator Room`, and `Cellar / Boiler Room` should form a legible technical cluster rather than three isolated chambers.
- Task staging needs readable approach lanes so viewers can distinguish "walking to a hotspot" from "already interacting."
- Room-focus mode should tighten on task edges, meeting positions, and public confrontations while keeping the nearest door or corridor edge in frame.

## What Must Not Be Copied Literally
- Do not trace the image into a final map one-to-one.
- Do not treat every depicted object as required gameplay geometry.
- Do not import or recreate any implied third-party style elements without license review.
- Do not freeze the camera to the exact concept composition; the runtime needs reversible overview, room-focus, and surveillance logic.
- Do not keep painterly darkness where it would hide pathing, task readability, or public evidence moments.
- Do not copy the exact cast faces or costume designs as if they are final production assets.

## Implementation Reading
- Treat the image as proof of tone, hierarchy, and house coherence.
- Treat [`FLOORPLAN_FROM_CONCEPT.md`](./FLOORPLAN_FROM_CONCEPT.md) as the playable adaptation.
- Treat [`ROOM_PROP_AND_TASK_MATRIX.md`](./ROOM_PROP_AND_TASK_MATRIX.md) as the room-by-room blockout brief.
- Treat [`CHARACTER_AND_UI_STYLE_GUIDE.md`](./CHARACTER_AND_UI_STYLE_GUIDE.md) as the cast and HUD translation layer.
