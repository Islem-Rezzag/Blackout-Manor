# Room Plate Prompts V2

## Shared Production Rules

These prompts are for reference generation, paintover, Figma briefing, or artist direction. They are not final runtime assets unless a later branch explicitly clears source, license, layer, manifest, and QA requirements.

All room plates should follow the same base prompt:

> Premium 2.5D gothic manor cutaway game environment, wide readable isometric/top-down hybrid camera, warm amber interior lighting against cold blue storm exterior, stylized realistic detail, readable doors and floor paths, hand-authored cinematic social-deduction staging, no dashboard UI, no sci-fi, no generic cartoon spaceship, no bean-shaped characters, no copyrighted game imitation.

Recommended base camera:

- 2.5D cutaway with visible floor, lower wall, and back wall.
- Whole-manor plate target: room geometry readable at 1600x1100 runtime scale.
- Room-focus target: room can crop to a medium shot without losing thresholds or task side.
- Export with transparent background where possible; keep lighting masks and foreground objects separate.

Recommended shared layers:

- `floor_base`
- `floor_detail`
- `wall_back`
- `wall_trim`
- `door_thresholds`
- `hero_props`
- `secondary_props`
- `task_hotspots`
- `body_clearance_mask`
- `character_path_mask`
- `warm_light`
- `cold_window_light`
- `shadow_contact`
- `foreground_occluders`
- `label_safe_area`

## Grand Hall

### Purpose In Gameplay

The Grand Hall is the orientation anchor, spawn space, travel hub, and emotional center of the manor. It must explain routes to social, service, technical, and private wings.

### Emotional Tone

Grand, watchful, aristocratic, and exposed. It should feel impressive but unsafe during a blackout.

### Camera Angle

Wide 2.5D cutaway centered on a broad floor medallion. Show the back wall, staircase/landing logic, and at least four exit directions.

### Lighting

Large warm chandelier glow, amber wall sconces, marble/floor reflections, cold storm spill through high windows, occasional lightning rim on stairs and railings.

### Main Silhouettes

Double staircase or split landing, central floor compass/medallion, tall windows, statues or grandfather clock, wide thresholds to wings.

### Hero Props

Grand staircase, chandelier, grandfather clock, marble medallion, portrait busts, umbrella/coat stand near service threshold.

### Interactive/Task Readability

The grandfather clock task must be on a clean reachable edge. Leave a visible approach lane and a clear "standing at clock" interaction side.

### Body Readability

Reserve a readable body zone near but not under the chandelier/floor medallion. A fallen suspect must silhouette against a lighter floor, not dark carpet.

### Door/Threshold Readability

Use visually distinct thresholds: social arches for library/ballroom/dining, simpler service threshold for kitchen/corridor, and a stair/landing marker if vertical travel is implied.

### Required Layers

`floor-grand-hall-base`, `floor-grand-hall-medallion`, `wall-grand-hall`, `prop-grand-stair`, `prop-grand-clock`, `light-grand-chandelier`, `mask-grand-hall-paths`, `mask-grand-hall-body`.

### Negative Prompt / Avoid List

Avoid throne room fantasy, empty hotel lobby, symmetrical flat card, oversized UI labels, hidden doors, pure black corners, tiny unreadable clock, sci-fi control panels.

### Suggested Dimensions

Reference: 2400x1500. Runtime plate family: floor 1024x768, wall 1024x384, prop sheets at 512 or 1024 per hero prop.

### Asset Keys

`room-grand-hall-plate`, `floor-grand-hall-v2`, `wall-grand-hall-v2`, `prop-grand-stair-v2`, `prop-grand-clock-v2`, `light-grand-chandelier-v2`, `mask-grand-hall-paths-v2`.

## Dining And Meeting Room

### Purpose In Gameplay

The Dining and Meeting Room is the tribunal set for reports, meetings, votes, accusations, alibis, and public social pressure. It should support ten seated suspects with clear table blocking.

### Emotional Tone

Formal, tense, ritualistic, and theatrical. Dinner has become a trial.

### Camera Angle

Wide cutaway with long table centered horizontally. The camera must read all ten chairs, entry lanes, head/foot seats, and speaker focus.

### Lighting

Warm table candles, chandelier glow, deep red velvet shadows, cold window rim behind the table, subtle lightning reflection on glassware and silver.

### Main Silhouettes

Long table, ten chairs, candelabra line, tall curtains/windows, wall portraits, double doors from Grand Hall, vote focus at table center.

### Hero Props

Long dining table, ten distinct chair backs, candelabra, silver service, wall portrait, bell or meeting gong, vote urn/ballot tray.

### Interactive/Task Readability

Meeting UI must align with physical seats. Leave clean clickable/screen-safe zones above portraits and at table center.

### Body Readability

Bodies are rare in meeting mode, but pre-meeting reports should allow a body silhouette near an aisle or threshold without chair overlap.

### Door/Threshold Readability

The Grand Hall double-door threshold must be obvious and ceremonial. A service door can exist but should be visually subordinate.

### Required Layers

`floor-dining-meeting-base`, `wall-dining-meeting`, `prop-meeting-table`, `prop-meeting-chairs`, `prop-vote-tray`, `light-table-candles`, `mask-meeting-seat-anchors`, `mask-meeting-body`.

### Negative Prompt / Avoid List

Avoid banquet clutter covering seats, round-table layout, modern conference room, courtroom dais, tiny chairs, unreadable ballot state, social deduction spaceship meeting room.

### Suggested Dimensions

Reference: 2600x1400. Runtime plate family: floor 1280x720, wall 1280x360, chair/table atlas 2048x1024.

### Asset Keys

`room-dining-meeting-plate`, `floor-dining-meeting-v2`, `wall-dining-meeting-v2`, `prop-meeting-table-v2`, `prop-meeting-chair-set-v2`, `prop-vote-tray-v2`, `mask-meeting-seat-anchors-v2`.

## Kitchen

### Purpose In Gameplay

The Kitchen supports service tasks, hot-water pressure, silver tea preparation, evidence discovery, and movement into the service loop.

### Emotional Tone

Busy, warm, practical, slightly chaotic, and dangerous under pressure.

### Camera Angle

Medium-wide cutaway showing counters, island, stove/range, pantry/service threshold, and at least one window or cold exterior edge.

### Lighting

Warm stove light, practical overhead lamps, pale tile bounce, cold rain through side windows, red-orange warning glow near pressure task when active.

### Main Silhouettes

Large range, central island, hanging copper pots, tiled wall, pantry shelves, service door.

### Hero Props

Range/stove, kitchen island with silver service, copper pot rack, tile backsplash, pantry cabinet, pressure gauge cluster.

### Interactive/Task Readability

`prepare-silver-tea-service` and `balance-hot-water-pressure` need separate readable approach sides. The pressure task should be tied to pipes/gauge, not a floating icon.

### Body Readability

Reserve a lighter tile zone near the island or service threshold. Avoid placing bodies under pot rack shadows or behind the island.

### Door/Threshold Readability

Show service threshold to pantry/corridor and main threshold to Grand Hall or Ballroom route. Service doors are plainer, narrower, and cooler.

### Required Layers

`floor-kitchen-tile`, `wall-kitchen-tile`, `prop-kitchen-range`, `prop-kitchen-island`, `prop-kitchen-pressure-gauge`, `prop-kitchen-pantry`, `mask-kitchen-paths`, `mask-kitchen-body`.

### Negative Prompt / Avoid List

Avoid modern stainless showroom, sterile lab kitchen, unreadable clutter, food gore, massive island blocking all paths, neon task icons, sci-fi pipes.

### Suggested Dimensions

Reference: 2200x1400. Runtime plate family: floor 1024x768, wall 1024x320, prop atlas 2048x1024.

### Asset Keys

`room-kitchen-plate`, `floor-kitchen-v2`, `wall-kitchen-v2`, `prop-kitchen-range-v2`, `prop-kitchen-island-v2`, `prop-kitchen-pressure-gauge-v2`, `prop-kitchen-pantry-v2`.

## Library

### Purpose In Gameplay

The Library supports radio tuning, quiet accusation staging, evidence research, and east-wing movement to the Study and Surveillance Room.

### Emotional Tone

Intellectual, warm, suspicious, and enclosed. It should feel like secrets are stored in the walls.

### Camera Angle

Wide room cutaway with shelves on the back wall, fireplace or reading area, desk/radio zone, and visible door to Study or Grand Hall.

### Lighting

Fireplace warmth, green desk lamp, candle shelf points, cold window edge, lightning briefly reflecting on glass cabinet doors.

### Main Silhouettes

Tall bookcases, fireplace, globe or ladder, reading chairs, radio desk, arched door.

### Hero Props

Fireplace, police-band radio desk, book ladder, globe, evidence shelf, leather chairs.

### Interactive/Task Readability

`tune-police-band-radio` should sit at a desk with a clear standing side and enough visual space for a character, speech bubble, and evidence chip.

### Body Readability

Reserve a rug or light pool near the fireplace edge or between shelves and chairs. Do not hide bodies behind chairs or book stacks.

### Door/Threshold Readability

Doors to Grand Hall and Study should read as an elegant knowledge-cluster connection. The Study door may be narrower and more private.

### Required Layers

`floor-library-rug`, `wall-library-books`, `prop-library-fireplace`, `prop-library-radio-desk`, `prop-library-ladder`, `light-library-fire`, `mask-library-paths`, `mask-library-body`.

### Negative Prompt / Avoid List

Avoid generic school library, modern office shelves, magic wizard tower, unreadable book clutter, hidden radio, labels as main identity, sci-fi monitors.

### Suggested Dimensions

Reference: 2400x1400. Runtime plate family: floor 1152x768, wall 1152x384, prop atlas 2048x1024.

### Asset Keys

`room-library-plate`, `floor-library-v2`, `wall-library-v2`, `prop-library-fireplace-v2`, `prop-library-radio-desk-v2`, `prop-library-ladder-v2`.

## Study

### Purpose In Gameplay

The Study is a private suspicion room for ledger filing, evidence hiding, safe interactions, and high-pressure alibi conflicts.

### Emotional Tone

Tight, secretive, wealthy, and accusatory.

### Camera Angle

Compact cutaway with desk foreground/midground, wall evidence board, safe, door to Library/Grand Hall, and enough floor for two-person confrontation.

### Lighting

Green banker lamp, warm desk pool, cold window slit, safe highlight, deep but readable wall shadows.

### Main Silhouettes

Heavy desk, safe, evidence board, framed portraits, lamp cone, narrow private door.

### Hero Props

Ledger desk, wall case/evidence board, safe, filing drawers, desk lamp, sealed letters.

### Interactive/Task Readability

`file-guest-ledger` must be centered on a clear desk edge. The safe should be visually important but not mistaken for the active task unless future content uses it.

### Body Readability

Reserve a clear floor triangle between desk and door. Avoid bodies hidden under the desk or black-on-green rug.

### Door/Threshold Readability

The room should have an intimate private threshold, visually narrower than Library or Ballroom entrances. If a Library connection exists, it should be obvious.

### Required Layers

`floor-study-rug`, `wall-study-paper`, `prop-study-desk`, `prop-study-safe`, `prop-study-evidence-board`, `light-study-banker-lamp`, `mask-study-paths`, `mask-study-body`.

### Negative Prompt / Avoid List

Avoid modern detective office, pinboard cliche overpowering room, unreadable paper mess, horror basement mood, bright computer screens, sci-fi safe.

### Suggested Dimensions

Reference: 2000x1400. Runtime plate family: floor 896x672, wall 896x320, prop atlas 1536x1024.

### Asset Keys

`room-study-plate`, `floor-study-v2`, `wall-study-v2`, `prop-study-desk-v2`, `prop-study-safe-v2`, `prop-study-evidence-board-v2`.

## Ballroom

### Purpose In Gameplay

The Ballroom supports social movement, masque inventory sorting, organ pipe synchronization, public clustering, and dramatic crossing shots.

### Emotional Tone

Glamorous, theatrical, lonely, and uneasy.

### Camera Angle

Wide open cutaway with a readable dance floor, small stage or organ zone, curtain wall, threshold to Grand Hall/Kitchen/Greenhouse.

### Lighting

Warm polished floor reflections, low stage lights, muted red curtains, cold blue window/storm edge, occasional colored stage bulbs kept subtle.

### Main Silhouettes

Open parquet floor, piano or organ, stage curtains, balcony/raised trim, mask inventory rack.

### Hero Props

Pipe organ or grand piano, stage, curtain wall, mask inventory trunk/rack, floor medallion or dance pattern.

### Interactive/Task Readability

`sort-masque-inventory` and `synchronize-organ-pipes` need distinct prop clusters. Keep dance floor clear for bodies and character crossing.

### Body Readability

Bodies should read strongly on the polished floor, especially near the stage apron or center floor. Avoid patterned floor detail directly under body zones.

### Door/Threshold Readability

Grand social threshold must read large. Greenhouse transition can spill cold green-blue light into one edge.

### Required Layers

`floor-ballroom-parquet`, `wall-ballroom-curtain`, `prop-ballroom-organ`, `prop-ballroom-stage`, `prop-ballroom-mask-rack`, `light-ballroom-stage`, `mask-ballroom-paths`, `mask-ballroom-body`.

### Negative Prompt / Avoid List

Avoid nightclub, casino, empty gym, sci-fi stage, overbright colored spotlights, cluttered dance floor, generic fantasy ballroom.

### Suggested Dimensions

Reference: 2600x1500. Runtime plate family: floor 1280x768, wall 1280x384, prop atlas 2048x1024.

### Asset Keys

`room-ballroom-plate`, `floor-ballroom-v2`, `wall-ballroom-v2`, `prop-ballroom-organ-v2`, `prop-ballroom-stage-v2`, `prop-ballroom-mask-rack-v2`.

## Greenhouse

### Purpose In Gameplay

The Greenhouse supports valve tasks, storm atmosphere, visual contrast, and glass-house suspicion scenes.

### Emotional Tone

Lush, cold, fragile, and exposed to the storm.

### Camera Angle

Long glass conservatory cutaway with visible planter lanes, valve hotspot, exterior rain beyond glass, and doors to Ballroom/Study/Generator route.

### Lighting

Cool moon-rain glass light, warm spill from adjacent manor door, small lanterns, wet leaf highlights, valve warning glints when active.

### Main Silhouettes

Glass ribs, planter rows, workbench, valve wheel, watering cans, climbing plants.

### Hero Props

Valve station, greenhouse bench, planter rows, glass roof ribs, hanging plants, broken pane or rain gutter.

### Interactive/Task Readability

`rebalance-greenhouse-valves` should sit on a clear wall/pipe edge with visible hand-wheel silhouette and character standing side.

### Body Readability

Reserve a pale stone path or central tile lane. Avoid bodies hidden under plant canopy.

### Door/Threshold Readability

Glass threshold should be unique: cooler, brighter, more fragile than wood/stone doors. Use light spill to show connections.

### Required Layers

`floor-greenhouse-stone`, `wall-greenhouse-glass`, `prop-greenhouse-valves`, `prop-greenhouse-bench`, `prop-greenhouse-planters`, `light-greenhouse-rain`, `mask-greenhouse-paths`, `mask-greenhouse-body`.

### Negative Prompt / Avoid List

Avoid tropical jungle opacity, bright fantasy garden, modern laboratory greenhouse, plant clutter hiding floor, unreadable glass grid, sci-fi hydroponics.

### Suggested Dimensions

Reference: 2400x1400. Runtime plate family: floor 1152x768, wall/glass 1152x448, prop atlas 2048x1024.

### Asset Keys

`room-greenhouse-plate`, `floor-greenhouse-v2`, `wall-greenhouse-glass-v2`, `prop-greenhouse-valves-v2`, `prop-greenhouse-bench-v2`, `prop-greenhouse-planters-v2`.

## Surveillance Room

### Purpose In Gameplay

The Surveillance Room supports camera-feed fiction, corridor film rewind task, public observation, and cold contrast against warm manor rooms.

### Emotional Tone

Secretive, technical, analog, and watchful.

### Camera Angle

Compact cutaway with desk/console foreground, monitor wall back, archive shelves, visible door to Library/Generator cluster.

### Lighting

Cold CRT glow, low amber desk lamp, blue-gray shadow, small red recording lights, warm spill from doorway.

### Main Silhouettes

Monitor wall, console desk, reel/film archive, operator chair, cable bundles, camera switcher.

### Hero Props

Screen wall, console bank, rewind film station, archive rack, rolling chair, tape reels.

### Interactive/Task Readability

`rewind-corridor-film` must be a tactile analog film task, not a modern computer. Keep screen wall readable but do not turn it into a website dashboard.

### Body Readability

Reserve a floor zone between chair and door or beside the console. Cold screen glow should outline the body.

### Door/Threshold Readability

Door should connect to the technical/lower band or library side. Use cooler mechanical threshold treatment.

### Required Layers

`floor-surveillance-room`, `wall-surveillance-monitors`, `prop-surveillance-console`, `prop-surveillance-film-reels`, `prop-surveillance-archive`, `light-surveillance-crt`, `mask-surveillance-paths`, `mask-surveillance-body`.

### Negative Prompt / Avoid List

Avoid cyberpunk command center, modern security office, web dashboard monitors, neon hacker visuals, hidden door, illegible screen noise.

### Suggested Dimensions

Reference: 2200x1400. Runtime plate family: floor 1024x672, wall 1024x384, prop atlas 2048x1024.

### Asset Keys

`room-surveillance-plate`, `floor-surveillance-room-v2`, `wall-surveillance-monitors-v2`, `prop-surveillance-console-v2`, `prop-surveillance-screenwall-v2`, `prop-surveillance-archive-v2`.

## Generator Room

### Purpose In Gameplay

The Generator Room supports breaker reset, sabotage tension, power-state readability, and mechanical route logic.

### Emotional Tone

Industrial, dangerous, loud, and unstable.

### Camera Angle

Medium cutaway with generator core, breaker lattice, pipes/cables, door to greenhouse/surveillance/cellar route, and clear task side.

### Lighting

Green generator core glow when stable, amber warning lights, red emergency pulse under sabotage, cold metal reflections, occasional blackout flicker.

### Main Silhouettes

Generator cylinder/core, breaker panel, pipe wall, cable floor runs, caution stripes used sparingly.

### Hero Props

Generator core, breaker lattice, console bank, cable bundle, pressure pipe, warning lamp.

### Interactive/Task Readability

`reset-breaker-lattice` must read at a panel with enough standing space and a visible state change from broken to stable.

### Body Readability

Reserve a floor patch away from dense cables. Body silhouette should contrast against gray floor or green core rim.

### Door/Threshold Readability

Mechanical thresholds are heavier metal, lower, and more utilitarian. Doorways must not disappear into pipe clutter.

### Required Layers

`floor-generator-metal`, `wall-generator-pipe`, `prop-generator-core`, `prop-generator-breaker-lattice`, `prop-generator-cables`, `light-generator-core`, `light-generator-alert`, `mask-generator-paths`, `mask-generator-body`.

### Negative Prompt / Avoid List

Avoid spaceship engine room, clean sci-fi reactor, modern server room, unreadable cable nest, neon hazard overload, giant props blocking task access.

### Suggested Dimensions

Reference: 2200x1400. Runtime plate family: floor 1024x672, wall 1024x384, prop atlas 2048x1024.

### Asset Keys

`room-generator-plate`, `floor-generator-room-v2`, `wall-generator-room-v2`, `prop-generator-core-v2`, `prop-generator-breaker-lattice-v2`, `prop-generator-cables-v2`.

## Cellar

### Purpose In Gameplay

The Cellar supports boiler pressure restoration, coal-carrying cooperation, low-level dread, and back-route alibis.

### Emotional Tone

Heavy, damp, old, hot-cold, and claustrophobic but readable.

### Camera Angle

Low-feeling cutaway with boiler on one side, coal area, pipe wall, stair/door threshold, and clear central work lane.

### Lighting

Boiler fire orange, steam haze, cold damp stone shadows, low red gauge glow, warm highlights on brass valves.

### Main Silhouettes

Large boiler, coal crate, valve wheels, pipe runs, stone arch, stair threshold.

### Hero Props

Boiler, coal bin, valve wheel, pressure gauge, shovel, pipe manifold, steam vent.

### Interactive/Task Readability

`restore-boiler-pressure` and `carry-coal-to-the-boiler` need separate but related zones. Coal carry should imply two-person movement and a clear handoff path.

### Body Readability

Reserve a lighter stone path between coal and boiler. Avoid bodies hidden by steam, pipes, or firebox glow.

### Door/Threshold Readability

Stair or cellar door should be obvious and distinct from pipe arches. Use a clear vertical descent cue.

### Required Layers

`floor-cellar-stone`, `wall-cellar-brick`, `prop-cellar-boiler`, `prop-cellar-coal-bin`, `prop-cellar-valves`, `light-cellar-firebox`, `fx-cellar-steam-mask`, `mask-cellar-paths`, `mask-cellar-body`.

### Negative Prompt / Avoid List

Avoid horror dungeon, gore, pure black room, fantasy cave, modern plant room, steam that hides tasks, unreadable pipe overload.

### Suggested Dimensions

Reference: 2400x1400. Runtime plate family: floor 1152x672, wall 1152x384, prop atlas 2048x1024.

### Asset Keys

`room-cellar-plate`, `floor-cellar-v2`, `wall-cellar-v2`, `prop-cellar-boiler-v2`, `prop-cellar-coal-bin-v2`, `prop-cellar-valves-v2`, `fx-cellar-steam-v2`.

## Corridors And Thresholds

### Purpose In Gameplay

Corridors and thresholds explain embodied travel, alibis, witness lines, door states, service movement, and suspicion around transitions.

### Emotional Tone

Narrow, watchful, transitional, and spatially honest.

### Camera Angle

Readable cutaway strips and door-node plates that can connect rooms without looking like disconnected bridges.

### Lighting

Warm sconces in front-of-house corridors, colder service lamps in technical routes, storm spill at exterior/glass thresholds, blackout dim layers that preserve door edges.

### Main Silhouettes

Arches, door frames, stair markers, service passages, carpet runners, wall trim, threshold floor plates.

### Hero Props

Door frames, brass handles, stair markers, service signs, wall sconces, corridor rugs, camera sightline hints.

### Interactive/Task Readability

Thresholds should help viewers understand "entered," "left," "blocked," "jammed," "sealed," or "watched" states without text-only dependence.

### Body Readability

Corridor body zones need floor contrast and enough width that a body does not look like a wall ornament or shadow.

### Door/Threshold Readability

Door families must be visually distinct:

- social: arched, brass, warm trim
- service: plainer wood/paint, narrower, practical
- greenhouse: glass/iron, cold spill
- mechanical: metal, rivets, warning light
- stair/cellar: vertical marker, steps, heavier shadow

### Required Layers

`floor-corridor-social`, `floor-corridor-service`, `threshold-social`, `threshold-service`, `threshold-greenhouse`, `threshold-mechanical`, `threshold-stair`, `light-corridor-sconce`, `mask-corridor-body`.

### Negative Prompt / Avoid List

Avoid magic teleport pads, invisible door edges, modern office halls, sci-fi airlocks, overwide empty bridges, thresholds readable only by labels.

### Suggested Dimensions

Reference: 1600x512 per family. Runtime thresholds: 256x384 source per door family, scalable to node size. Corridor floor strips: 1024x256 or 1024x384.

### Asset Keys

`threshold-social-v2`, `threshold-service-v2`, `threshold-greenhouse-v2`, `threshold-mechanical-v2`, `threshold-stair-v2`, `floor-corridor-social-v2`, `floor-corridor-service-v2`.

## Exterior Storm/Backdrop Layer

### Purpose In Gameplay

The exterior storm sells isolation, pressure, blackout mood, and contrast behind the warm interior. It frames the manor without becoming the play surface.

### Emotional Tone

Cold, wet, dangerous, distant, and cinematic.

### Camera Angle

Wide background layer behind the cutaway shell: roofline, trees, rain bands, lightning sky, wet stone edges, and window silhouettes.

### Lighting

Deep slate-blue storm, moon-gray clouds, lightning flashes, rain silver streaks, dim tree silhouettes, warm interior window leaks.

### Main Silhouettes

Roof mass, chimneys, high windows, tree line, rain sheets, lightning forks, wet stone foundation.

### Hero Props

Roof ridge, chimney stack, distant gate/tree silhouettes, rain bands, lightning masks, storm cloud parallax.

### Interactive/Task Readability

The storm is atmospheric only. It must not add false interactables or compete with room state markers.

### Body Readability

Exterior layers must not darken body-safe floor masks or create visual noise over rooms.

### Door/Threshold Readability

Cold exterior spill should make window and glass thresholds legible without implying extra exits unless supported by map metadata.

### Required Layers

`backdrop-storm-sky`, `backdrop-roofline`, `backdrop-tree-line`, `fx-rain-bands`, `fx-lightning-mask`, `light-window-cold-spill`, `mask-exterior-safe`.

### Negative Prompt / Avoid List

Avoid fantasy castle panorama, bright daytime rain, generic horror poster, storm hiding interior, lightning that whites out UI, decorative orbs, UI baked into background.

### Suggested Dimensions

Reference: 3200x1800. Runtime backdrop layers: 2048x1152 for sky/roof, 2048x512 for parallax rain bands, 1024x512 for lightning masks.

### Asset Keys

`backdrop-storm-sky-v2`, `backdrop-roofline-v2`, `backdrop-tree-line-v2`, `fx-rain-bands-v2`, `fx-lightning-mask-v2`, `light-window-cold-spill-v2`.
