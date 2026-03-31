export type ClientGameAssetSourceId =
  | "blackout-inline"
  | "oga-modern-houses-cc0";

export type ClientGameAssetSource = {
  id: ClientGameAssetSourceId;
  label: string;
  license: string;
  importStatus: "inline-original" | "approved-import";
  sourceUrl: string | null;
  notes: string;
};

export const CLIENT_GAME_ASSET_SOURCES: Record<
  ClientGameAssetSourceId,
  ClientGameAssetSource
> = {
  "blackout-inline": {
    id: "blackout-inline",
    label: "Blackout Manor inline procedural placeholders",
    license: "MIT",
    importStatus: "inline-original",
    sourceUrl: null,
    notes:
      "Procedural SVG/data-URI textures kept for effects, overlays, and any asset families not yet replaced by approved imports.",
  },
  "oga-modern-houses-cc0": {
    id: "oga-modern-houses-cc0",
    label: "OGA Modern Houses Tileset TopDown",
    license: "CC0-1.0",
    importStatus: "approved-import",
    sourceUrl: "https://opengameart.org/content/modern-houses-tileset-topdown",
    notes:
      "Safe blocker-baseline environment pack used for 6I floor, wall, door, and hero-prop textures. Intended as a temporary legal baseline until bespoke manor art replaces it.",
  },
};
