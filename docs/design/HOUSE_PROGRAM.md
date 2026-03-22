# House Program

## Core Floorplan Vision
Blackout Manor is one connected house with a central circulation spine, readable wings, and visible thresholds. The viewer should be able to trace movement from one space to another through actual doors and corridors.

## Final Room List
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

## Floorplan Structure

### Main Spine
- `Grand Hall` is the central orientation room.
- It connects the social wing, study wing, and service circulation.
- It acts as the viewer's default spatial reference point.

### East Social Wing
- `Dining / Meeting Room`
- `Ballroom`
- `Greenhouse / Conservatory`

### West Service Wing
- `Kitchen`
- `Pantry / Scullery`
- `Servants’ Corridor`
- access down to `Cellar / Boiler Room`

### North Intelligence Wing
- `Library`
- `Study`
- `Surveillance Hall`
- `Generator Room`

### Lower Level
- `Cellar / Boiler Room`
- reached by service stair from `Servants’ Corridor`

## Suggested Room Sizes
These are target gameplay-art blockout sizes, not engine rules.

| Room | Target Size | Notes |
| --- | --- | --- |
| Grand Hall | 18 x 14 tiles | central anchor, broad sightlines |
| Dining / Meeting Room | 16 x 12 tiles | long table, 10-seat blocking |
| Kitchen | 14 x 12 tiles | dense service props and work triangle |
| Pantry / Scullery | 8 x 8 tiles | narrow prep/storage annex |
| Library | 14 x 12 tiles | shelves + fireplace + desk sightline |
| Study | 10 x 10 tiles | tighter, suspicion-heavy room |
| Ballroom | 18 x 14 tiles | open floor and strong silhouette |
| Greenhouse / Conservatory | 14 x 10 tiles | glass perimeter and wet highlights |
| Surveillance Hall | 12 x 10 tiles | monitor wall + operator desk |
| Generator Room | 10 x 8 tiles | industrial, noisy, dangerous |
| Servants’ Corridor | 6 x 18 tiles | narrow back-of-house connector |
| Cellar / Boiler Room | 14 x 10 tiles | pipes, tanks, steam, service routes |

## Adjacency Map

| Room | Connected To |
| --- | --- |
| Grand Hall | Dining / Meeting Room, Ballroom, Library, Kitchen, Servants’ Corridor |
| Dining / Meeting Room | Grand Hall, Ballroom |
| Ballroom | Grand Hall, Dining / Meeting Room, Greenhouse / Conservatory |
| Greenhouse / Conservatory | Ballroom |
| Library | Grand Hall, Study |
| Study | Library, Surveillance Hall |
| Surveillance Hall | Study, Generator Room |
| Generator Room | Surveillance Hall, Servants’ Corridor |
| Kitchen | Grand Hall, Pantry / Scullery, Servants’ Corridor |
| Pantry / Scullery | Kitchen, Servants’ Corridor |
| Servants’ Corridor | Grand Hall, Kitchen, Pantry / Scullery, Generator Room, Cellar stair |
| Cellar / Boiler Room | Servants’ Corridor |

## Threshold And Door Logic
- Primary social doors are wide double doors between `Grand Hall`, `Dining / Meeting Room`, and `Ballroom`
- Study wing uses narrower single doors to increase tension and concealment
- Service spaces use simpler, more utilitarian doors
- The Greenhouse threshold should feel semi-exterior and visibly different from interior doorways
- Lower-level access is by stair threshold, not direct same-plane room cut

## Corridor Logic
- Front-of-house circulation happens through the `Grand Hall`
- Back-of-house circulation happens through the `Servants’ Corridor`
- Suspicious movement should be legible because there are only a few believable cross-house routes
- Generator access should feel slightly tucked away without becoming hidden from the viewer

## Room Props And Hotspots

### Grand Hall
- grand staircase backdrop
- grandfather clock
- storm-lit windows
- bell rope
- central rug
- hotspot: clock winding, bell pull

### Dining / Meeting Room
- long oak table
- ten chairs
- candles
- sideboard
- bell rope or gong pull
- hotspot: meeting call, seating, vote staging

### Kitchen
- range
- prep island
- sink wall
- hanging utensils
- tea service area
- hotspot: silver service, supply prep

### Pantry / Scullery
- shelves
- crates
- dish rack
- cleaning station
- hotspot: inventory, hidden service tasks

### Library
- tall shelves
- rolling ladder
- fireplace
- reading desk
- globe
- hotspot: radio tuning, ledger review, clue reading

### Study
- heavy desk
- chair
- safe
- ledger cabinet
- evidence board
- hotspot: filing, ledger handling, radio or clue comparison

### Ballroom
- open dance floor
- piano
- curtain wall
- stage edge
- masque display
- hotspot: inventory sorting, organ synchronization, social visibility

### Greenhouse / Conservatory
- planter beds
- potting bench
- irrigation valves
- glass walls
- wet floor highlights
- hotspot: valve rebalance, clue traces

### Surveillance Hall
- monitor wall
- reel archive
- switchboard
- control desk
- hotspot: camera rewind, loop checks, clue review

### Generator Room
- breaker lattice
- fuse wall
- coils
- warning lamps
- floor cables
- hotspot: breaker reset, sabotage recovery

### Servants’ Corridor
- coat pegs
- rolling trolley
- service shelves
- boiler stair
- hotspot: hidden route traversal, supply carrying

### Cellar / Boiler Room
- boiler tank
- coal bins
- steam pipes
- valves
- damp stains
- hotspot: boiler pressure, coal carry, hot water balancing

## Dining / Meeting Seating Plan For 10 Agents
Use a long table with 4 seats per side and 1 seat at each short end.

| Seat | Position |
| --- | --- |
| 1 | north head |
| 2 | west upper |
| 3 | west mid-upper |
| 4 | west mid-lower |
| 5 | west lower |
| 6 | south foot |
| 7 | east lower |
| 8 | east mid-lower |
| 9 | east mid-upper |
| 10 | east upper |

### Seating Rules
- Seat order should stay stable during a match for readability
- The same seat map should drive portrait ordering, in-world blocking, and camera staging
- Exiled or dead players should be visibly absent from their seat position
