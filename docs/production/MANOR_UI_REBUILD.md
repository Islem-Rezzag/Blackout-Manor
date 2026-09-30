# Estate UI Rebuild

## Presentation Boundary

This rebuild stays in the browser presentation layer. Match rules, agent decisions,
public-state projection, vote handling, replay frames, and fairness thresholds are
unchanged. The public root opens the game directly. The web app remains a thin shell;
the manor and its controls remain owned by `packages/client-game`.

## House Materials

`estateTexturePlan.ts` declares room materials and procedural texture keys using the
existing manor layout and `importedArt` placements. `estateTextures.ts` paints seeded,
cached Canvas bitmaps once during loading: parquet, marble, service tiles, paneled
walls, windows, sconces, furniture, a dining gallery, and formal grounds. No final
room plates, downloaded environment art, or generated reference images are added.

Every estate texture is cataloged in Asset Pipeline V2 as a project-authored
procedural placeholder. Existing baseline keys remain its documented fallback chain.
These bitmaps are built in memory, not committed as runtime art files. Future art
replacement should change catalog mappings and placements rather than simulation.

`ArchitectureRenderer` builds masonry around the existing door openings. It never
changes the navigable layout. Rooms remain stationary during focus so the house's
walls and corridors stay connected. Weather, lighting state, sabotage, and body
markers still consume the existing public presentation data.

## Interface

`ObservationHud` owns accessible runtime DOM controls for overview, surveillance,
room selection, public guest focus, sound, and fullscreen. Public counts and task
progress come only from the provided match snapshot. Guest portraits use the existing
public appearance resolver; there is no replacement character pack or role reveal.
Subtitles contain actual public speech, not generated narrative or reasoning.
The mute preference is shared by all scene sound buses and survives scene changes
within the running game; it is not persisted or sent to a server.

`SurveillanceConsole` paints bounded, cached room thumbnails from the same estate
textures, imported prop placements, and existing public feed data. Its buttons retain
the existing surveillance director callbacks. DOM layout prevents camera zoom from
scaling or overflowing feed panels.

`estateCameraFraming` fits the overview and gives manual inspection a useful close
view on phones. Existing camera reasons and directors still decide what is focused.
`ScreenSpaceCamera` isolates the meeting and result overlays from world-camera zoom;
existing meeting staging, public posture/action cues, and avatar rigs remain intact.
It refreshes exclusions before rendering so late-created guests and speech bubbles
cannot appear a second time through the UI camera. Tribunal names, posture labels,
and action labels live in separate guest-strip bands rather than over crowded world
avatars. Gestures and public speech remain attached to the existing avatar rigs.

Control symbols use the pinned Lucide code dependency. Its reviewed ISC license and
copyright notice are retained in `THIRD_PARTY_UI_NOTICES.md`. No illustration, font,
room-plate, or character asset pack is imported.

## Verification

- Unit coverage checks room materials, catalog registration and fallback validity,
  door opening spans, responsive framing, and world/UI camera separation.
- Browser coverage exercises the root route, live/replay routes, room inspection,
  public guest counts, surveillance, and sound at 1280x820, 1920x1080, and 390x844.
- Local screenshots are captured under ignored `artifacts/ui-rebuild/`. Check both
  overview and inspection, camera thumbnails, replay, and responsive controls.
- Meeting overlays are also checked at 1280x820 and 390x844 with the demo held at
  public tick 20 in the capture browser so its short meeting can finish staging.
  This capture-only timer hold does not change a runtime fixture or match behavior.
- Run the normal client checks and repository quality/fairness gates before merging.

Do not put hidden state in the HUD, turn the live route into a dashboard, commit the
temporary captures, or modify rules to suit camera staging or furniture placement.
