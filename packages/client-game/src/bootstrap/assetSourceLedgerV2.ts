export const CLIENT_GAME_ASSET_LICENSE_STATUSES_V2 = [
  "ProjectOwned",
  "Placeholder",
  "GeneratedReferenceOnly",
  "CC0",
  "CC-BY",
  "CustomOwned",
  "UnknownBlocked",
] as const;

export type ClientGameAssetLicenseStatusV2 =
  (typeof CLIENT_GAME_ASSET_LICENSE_STATUSES_V2)[number];

export type ClientGameAssetSourceLedgerEntryV2 = {
  sourceId: string;
  ownerOrAuthor: string;
  licenseStatus: ClientGameAssetLicenseStatusV2;
  attributionRequired: boolean;
  sourceUrl?: string;
  sourceFile?: string;
  reviewed: boolean;
  notes: string;
};

export const CLIENT_GAME_ASSET_SOURCE_LEDGER_V2 = {
  "blackout-inline": {
    sourceId: "blackout-inline",
    ownerOrAuthor: "Blackout Manor project",
    licenseStatus: "Placeholder",
    attributionRequired: false,
    sourceFile: "packages/client-game/src/bootstrap/inlineAssets.ts",
    reviewed: true,
    notes:
      "Project-authored inline SVG/data-URI placeholders used by the current runtime. These are legal fallback assets, not final production art.",
  },
  "blackout-runtime-procedural": {
    sourceId: "blackout-runtime-procedural",
    ownerOrAuthor: "Blackout Manor project",
    licenseStatus: "Placeholder",
    attributionRequired: false,
    sourceFile: "packages/client-game/src",
    reviewed: true,
    notes:
      "Procedural Phaser graphics, WebAudio synthesis, and runtime-drawn UI/avatar placeholders. These are allowed fallback surfaces until replaced by cataloged production assets.",
  },
  "blackout-system-font-stack": {
    sourceId: "blackout-system-font-stack",
    ownerOrAuthor: "Browser/system font providers",
    licenseStatus: "Placeholder",
    attributionRequired: false,
    reviewed: true,
    notes:
      "CSS/system font-family stacks used by the runtime. No font binaries are committed; future bundled fonts need their own reviewed source rows.",
  },
  "oga-modern-houses-cc0": {
    sourceId: "oga-modern-houses-cc0",
    ownerOrAuthor: "OpenGameArt Modern Houses Tileset TopDown source page",
    licenseStatus: "CC0",
    attributionRequired: false,
    sourceUrl: "https://opengameart.org/content/modern-houses-tileset-topdown",
    sourceFile:
      "apps/web/public/game-assets/client-game/oga-modern-houses/tiletest.png",
    reviewed: true,
    notes:
      "Approved CC0 baseline sheet currently used for derived manor blocker textures. It remains a temporary replacement baseline, not bespoke final Blackout Manor art.",
  },
  "blackout-generated-reference-only": {
    sourceId: "blackout-generated-reference-only",
    ownerOrAuthor: "Blackout Manor generated-reference workflow",
    licenseStatus: "GeneratedReferenceOnly",
    attributionRequired: false,
    reviewed: false,
    notes:
      "Reserved for generated reference images and prompt studies. Assets from this source are never runtime-ready unless later reclassified by a separate ownership review.",
  },
  "blocked-unknown-license": {
    sourceId: "blocked-unknown-license",
    ownerOrAuthor: "Unknown or unreviewed source",
    licenseStatus: "UnknownBlocked",
    attributionRequired: true,
    reviewed: false,
    notes:
      "Guardrail source for rejected or unreviewed material. Runtime assets must not use this source.",
  },
} as const satisfies Record<string, ClientGameAssetSourceLedgerEntryV2>;

export type ClientGameAssetSourceIdV2 =
  keyof typeof CLIENT_GAME_ASSET_SOURCE_LEDGER_V2;
