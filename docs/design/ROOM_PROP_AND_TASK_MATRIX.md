# Room Prop And Task Matrix

This matrix translates the concept image and house program into room-by-room implementation targets. Candidate tasks below are presentation wrappers for existing task logic, not new gameplay rules.

| Room | Required Props | Optional Props | Visual Hotspots | Candidate Visible Tasks | Sound Hooks | Door / Corridor Visibility Needs | Spectator Readability Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Grand Hall | central medallion, chandelier, stair or landing cues, bell rope, storm windows | statues, runner rugs, portrait niches | bell pull, clock or notice point | bell reset, hall inspection, courier handoff | marble footsteps, hall reverb, bell ring, thunder spill | must show all major exits from overview | this is the spatial anchor; never bury exits in shadow |
| Dining / Meeting Room | long table, 10 chairs, sideboard, serving candles | wall portraits, decanters, floral centerpiece | meeting call point, seat positions, sideboard evidence spot | meeting call, evidence placement, seating gather | chair scrape, table thump, bell or gong, murmured room tone | wide main threshold to hall must stay visible | room must read instantly as the meeting destination |
| Kitchen | range, prep island, sink wall, hanging utensils, service shelf | tea cart, chopping block, pantry rack | prep island edge, stove side, silver tray station | service prep, silver count, kettle reset, supply sorting | tile footsteps, clatter, kettle hiss, drawer taps | hall entry and pantry door both visible in focus mode | activity should look busy but still readable from overview |
| Pantry / Scullery | shelves, dish rack, wash basin, storage crates | mop bucket, hanging cloths, bottle rack | inventory shelf, wash station, crate stack | inventory check, dish stack, cleaning reset | crockery clicks, water splash, crate slide | kitchen link and service-corridor link must read as a pass-through | do not let storage clutter hide the route |
| Library | tall shelves, fireplace, reading desk, ladder, globe | side chairs, rug medallion, bust pedestal | desk lamp, bookshelf section, fireplace side | ledger review, clue reading, document compare | wood footsteps, fire crackle, page turns, chair creak | hall threshold must be obvious; optional study link readable in focus | hero silhouette is shelves plus fireplace plus desk triangle |
| Study | heavy desk, safe, evidence board, radio or intercom, filing cabinet | side lamp, wall frames, drawer chest | desk front, evidence board, safe door | safe check, radio tune, case-file sort, clue pinning | desk knock, radio static, paper rustle, drawer slide | hall or library access must be visible, not implied | room should feel tense and precise, not cluttered |
| Ballroom | open floor, piano, stage edge, curtain wall | candelabras, wall mirrors, mask display | piano, center floor, stage corner | score cue, stage-light check, social bait task | wood floor footsteps, piano notes, curtain swish | hall entry should read broad and inviting | keep center floor open enough for confrontations and crossing |
| Greenhouse / Conservatory | planter beds, glass walls, potting bench, irrigation valves | hanging vines, bench seat, buckets | valve bank, planter edge, potting surface | watering sequence, valve balance, specimen check | rain on glass, wet footsteps, watering can, valve turns | annex threshold must show interior-to-glass transition clearly | cool palette room; visibility comes from glazing and planter lanes |
| Surveillance Hall | monitor wall, desk console, reel or archive stacks, switchboard | task lamp, filing shelves, stool | console desk, monitor wall, archive rack | feed rewind, camera loop check, reel swap | monitor hum, button taps, tape spin, relay clicks | service-corridor entry must be obvious; console should face camera well | this is the cold technical counterpart to the warm manor rooms |
| Generator Room | generator core, breaker panel, warning lamps, floor cables | tool cart, pipe cluster, fuse crates | breaker wall, control lever, cable junction | breaker reset, power reroute, fuse replace | machine hum, breaker snap, warning buzz, heavy switch | service route and neighboring tech room relationship must be legible | sabotage readability depends on strong warning-light contrast |
| Servants' Corridor | narrow passage, wall hooks, trolley, service shelves, cellar stair marker | umbrella stand, linen cart, wall clock | trolley stop, stair mouth, supply shelf | supply carry, route traversal, service handoff | stone footsteps, cart wheel squeak, muted door thuds | must visibly connect multiple support rooms in overview | this corridor explains suspicious travel; never hide the full route |
| Cellar / Boiler Room | boiler tank, furnace or firebox, valves, pipes, coal bins | tool bench, drain grate, steam gauge | valve cluster, furnace door, pressure gauge | pressure balance, coal feed, valve vent, heat reset | steam hiss, metal clang, furnace roar, coal shovel | stair arrival and machine cluster must both read in focus mode | heavy machinery must feel dangerous but still navigable |

## Cross-Room Readability Rules
- Every room needs one hero prop cluster visible from whole-manor mode.
- Every active hotspot needs one clear approach edge.
- Door thresholds should never be hidden behind the largest prop in the room.
- Sound hooks should reinforce room identity before the player reads labels.
- Candidate visible tasks must map to existing task logic rather than creating new rule semantics.

## Meeting And Event Priority Rooms
- `Dining / Meeting Room` is the primary gathering room.
- `Grand Hall` is the primary crossing and camera-reset room.
- `Study`, `Generator Room`, `Surveillance Hall`, and `Cellar / Boiler Room` should receive the clearest public-action emphasis because their tasks are easier to read as consequential.
