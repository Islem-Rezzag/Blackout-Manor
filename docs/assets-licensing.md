# Asset Licensing Notes

## Code
Repository source code is MIT licensed. See the root [LICENSE](../LICENSE).

## Placeholder and Prototype Assets
- Prototype placeholder art should be treated as separate from code.
- Kenney prototype assets are suitable for early local development because they are CC0, but keep attribution notes in release documentation when you ship derivatives or edited packs.
- Replace prototype art, audio, and branding assets before any public commercial launch so Blackout Manor has a clean original identity.

## Imported Runtime Baseline
The current feature branch now includes one approved third-party runtime art baseline:

- OGA `Modern Houses Tileset TopDown`
  - license: `CC0-1.0`
  - source page: [OpenGameArt - Modern Houses Tileset TopDown](https://opengameart.org/content/modern-houses-tileset-topdown)
  - checked-in source sheet: [apps/web/public/game-assets/client-game/oga-modern-houses/tiletest.png](../apps/web/public/game-assets/client-game/oga-modern-houses/tiletest.png)
  - current use:
    - derived floor textures
    - derived cutaway wall textures
    - derived door-threshold art
    - derived hero-prop silhouettes for key task rooms
  - replacement plan:
    - keep as a legal blocker baseline until bespoke Blackout Manor environment art replaces it

## Deferred Approved Sources
These sources remain approved but are not yet imported into the runtime on this branch:

- Kenney UI Pack (`CC0`)
- Kenney UI Audio (`CC0`)

They stay deferred until the branch needs a tighter UI/audio replacement pass than the current in-world runtime requires.

## Contributor Rule
When adding assets, document the source, license, and intended replacement plan in the same PR. Do not mix unclear third-party assets into the main branch.
