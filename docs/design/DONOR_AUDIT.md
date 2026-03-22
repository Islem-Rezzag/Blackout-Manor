# Donor Audit

This document locks what may be borrowed, what must remain reference-only, and where license boundaries sit for the Embodied Spectator Overhaul.

| Source | License | Classification | What To Borrow | What Not To Borrow | License Implications |
| --- | --- | --- | --- | --- | --- |
| `danielart/phaser-rpg-template` | MIT | Importable donor | Room traversal logic, door and corridor grammar, layered map structure, interaction rhythm, hotspot navigation ideas | Full project structure transplant, gameplay rules, UI identity, quest or RPG systems that do not fit Blackout Manor | MIT-compatible. Keep attribution in donor audit and avoid copying code blindly without adaptation. |
| `kumarankm/Amongus` | MIT | Importable donor, narrow scope | Readable top-down locomotion cadence, movement anticipation, quick direction readability | Character identity, UI look, map design, task flow, impostor brand language | MIT-compatible, but visual identity must stay clearly distinct. |
| `OpenSuspect` | GPL-3.0 | Reference-only | Social-deduction ambition, meeting/task readability ideas, spectator framing goals | Any code, assets, audio, direct UI implementation, or structure that would create GPL inheritance pressure | GPL-3.0 is incompatible with the current codebase direction for transplant use. Treat as inspiration only. |
| Kenney UI Pack | CC0 | Importable | Temporary launcher, menu, button, prompt, and HUD-support pieces outside bespoke in-world presentation | Over-reliance on stock UI that defines final product identity | Safe to import with no attribution requirement, though attribution remains good practice. |
| Kenney UI Audio | CC0 | Importable | Buttons, menu clicks, confirm/back sounds, light shell audio | Final unique game identity if it needs bespoke sound later | Safe to import with no attribution requirement, though attribution remains good practice. |
| OGA `Modern Houses Tileset TopDown` | CC0 | Importable baseline | Floorplan blocking, interior readability placeholder tiles, safe environment baseline | Final authored manor identity if it starts to feel generic | Safe to import. Good short-term blocker solution. |
| OGA `mansion interior top down tileset` | CC-BY-SA 4.0 | Reference-only | Mood, room density, prop clustering, palette inspiration | Direct import of tiles, edits, derivatives, or mixed-pack reuse | Share-alike obligations make it a poor default import path. Keep reference-only unless separately approved. |
| LPC and LPC-derived interior references | Mixed, often CC-BY-SA / GPL-compatible ecosystems | Reference-only | Spatial readability, prop density, tile organization, genre vocabulary | Direct import without line-by-line license review and provenance checks | Too mixed for safe default import. Treat as mood board material only. |

## Locked Decisions
- `danielart/phaser-rpg-template` is the primary code donor.
- `kumarankm/Amongus` is a motion donor only.
- `OpenSuspect` is reference-only and may not be transplanted.
- Kenney UI Pack and UI Audio are safe importable support layers.
- OGA `Modern Houses Tileset TopDown` is safe as an optional placeholder environment baseline.
- OGA `mansion interior top down tileset` and LPC-style interiors stay reference-only pending a future explicit license review.

## Practical Rule
If a source is not clearly MIT or CC0 for the intended use, assume reference-only until a later review says otherwise.
