import { CLIENT_GAME_ASSET_MANIFEST } from "./assetManifest";
import {
  CLIENT_GAME_ASSET_SOURCE_LEDGER_V2,
  type ClientGameAssetLicenseStatusV2,
  type ClientGameAssetSourceIdV2,
  type ClientGameAssetSourceLedgerEntryV2,
} from "./assetSourceLedgerV2";
import { CLIENT_GAME_DERIVED_TEXTURE_PLAN } from "./derivedClientAssets";
import { INLINE_ASSETS } from "./inlineAssets";

export const CLIENT_GAME_ASSET_CATEGORIES_V2 = [
  "environment-plates",
  "room-floors",
  "room-walls",
  "thresholds",
  "corridors",
  "exterior-storm-layers",
  "hero-props",
  "clue-props",
  "task-props",
  "light-masks",
  "blackout-masks",
  "character-world-sprites",
  "character-portraits",
  "posture-emotion-states",
  "hud-panels",
  "hud-icons",
  "evidence-chips",
  "support-seals",
  "vote-tokens",
  "surveillance-frames",
  "vfx",
  "audio",
  "fonts",
] as const;

export type ClientGameAssetCategoryV2 =
  (typeof CLIENT_GAME_ASSET_CATEGORIES_V2)[number];

export type ClientGameAssetKindV2 =
  | "image"
  | "inline-svg"
  | "derived-image"
  | "atlas"
  | "audio"
  | "font"
  | "procedural";

export type ClientGameAssetDimensionsV2 = {
  width: number;
  height: number;
};

export type ClientGameAssetV2 = {
  key: string;
  category: ClientGameAssetCategoryV2;
  kind: ClientGameAssetKindV2;
  relativePath?: string;
  inlineSourceKey?: string;
  sourceId: ClientGameAssetSourceIdV2;
  licenseStatus: ClientGameAssetLicenseStatusV2;
  placeholder: boolean;
  generatedReferenceOnly: boolean;
  dimensions?: ClientGameAssetDimensionsV2;
  fallbackKey?: string;
  swapGroup: string;
  runtimeReady: boolean;
  notes: string;
};

type AssetSourceLedgerV2 = Record<string, ClientGameAssetSourceLedgerEntryV2>;
type InlineAssetKey = keyof typeof INLINE_ASSETS;

const INLINE_SOURCE_KEY_BY_URI = new Map<string, InlineAssetKey>(
  Object.entries(INLINE_ASSETS).map(([key, value]) => [
    value,
    key as InlineAssetKey,
  ]),
);

const DERIVED_RUNTIME_OVERRIDES = new Set<string>([
  "floor-greenhouse",
  "wall-greenhouse",
]);

const TASK_PROP_KEYS = new Set<string>([
  "prop-bookshelf",
  "prop-kitchen-range",
  "prop-kitchen-island",
  "prop-study-desk",
  "prop-console-bank",
  "prop-planter",
  "prop-boiler",
  "prop-cellar-coal",
  "prop-crate-stack",
]);

const DERIVED_TEXTURE_DIMENSIONS: Readonly<
  Record<string, ClientGameAssetDimensionsV2>
> = {
  "floor-parquet": { width: 256, height: 256 },
  "floor-service": { width: 256, height: 256 },
  "floor-greenhouse": { width: 256, height: 256 },
  "floor-stone": { width: 256, height: 256 },
  "wall-panel": { width: 320, height: 120 },
  "wall-service": { width: 320, height: 120 },
  "wall-greenhouse": { width: 320, height: 120 },
  "wall-stone": { width: 320, height: 120 },
  "door-threshold": { width: 64, height: 128 },
  "prop-bookshelf": { width: 160, height: 224 },
  "prop-kitchen-range": { width: 192, height: 128 },
  "prop-study-desk": { width: 192, height: 160 },
  "prop-console-bank": { width: 176, height: 128 },
  "prop-planter": { width: 160, height: 160 },
  "prop-boiler": { width: 176, height: 192 },
};

const KNOWN_DIMENSIONS_BY_RELATIVE_PATH: Readonly<
  Record<string, ClientGameAssetDimensionsV2>
> = {
  "oga-modern-houses/tiletest.png": { width: 768, height: 512 },
};

const FALLBACK_KEYS_BY_KEY: Record<string, string> = {
  "floor-grand-hall": "floor-parquet",
  "floor-library": "floor-parquet",
  "floor-study": "floor-parquet",
  "floor-ballroom": "floor-parquet",
  "floor-kitchen": "floor-service",
  "floor-surveillance-hall": "floor-service",
  "floor-generator-room": "floor-stone",
  "floor-cellar": "floor-stone",
  "floor-service-corridor": "floor-service",
  "floor-gallery": "floor-parquet",
  "floor-parquet": "room-floor",
  "floor-service": "room-floor",
  "floor-stone": "room-floor",
  "wall-grand-hall": "wall-panel",
  "wall-library": "wall-panel",
  "wall-study": "wall-panel",
  "wall-ballroom": "wall-panel",
  "wall-kitchen": "wall-service",
  "wall-surveillance-hall": "wall-service",
  "wall-generator-room": "wall-stone",
  "wall-cellar": "wall-stone",
  "wall-service-corridor": "wall-service",
  "wall-panel": "room-wall",
  "wall-service": "room-wall",
  "wall-stone": "room-wall",
  "door-threshold-social": "door-threshold",
  "door-threshold-service": "door-threshold",
  "door-threshold-greenhouse": "door-threshold",
  "door-threshold-mechanical": "door-threshold",
  "door-threshold-stair": "door-threshold",
};

const parseInlineSvgDimensions = (
  dataUri: string,
): ClientGameAssetDimensionsV2 | undefined => {
  const prefix = "data:image/svg+xml;charset=utf-8,";
  if (!dataUri.startsWith(prefix)) {
    return undefined;
  }

  const svg = decodeURIComponent(dataUri.slice(prefix.length));
  const match = svg.match(
    /<svg[^>]*\swidth="(?<width>\d+)"[^>]*\sheight="(?<height>\d+)"/u,
  );
  const width = Number(match?.groups?.width);
  const height = Number(match?.groups?.height);

  return Number.isFinite(width) && Number.isFinite(height)
    ? { width, height }
    : undefined;
};

const inferCategoryFromKey = (key: string): ClientGameAssetCategoryV2 => {
  if (key === "oga-modern-houses-sheet" || key === "room-shell") {
    return "environment-plates";
  }

  if (
    key === "floor-service-corridor" ||
    key === "floor-gallery" ||
    key.includes("corridor")
  ) {
    return "corridors";
  }

  if (
    key === "room-floor" ||
    key.startsWith("floor-") ||
    key.startsWith("fallback-inline-floor-")
  ) {
    return "room-floors";
  }

  if (
    key === "room-wall" ||
    key.startsWith("wall-") ||
    key.startsWith("fallback-inline-wall-")
  ) {
    return "room-walls";
  }

  if (key.startsWith("door-threshold")) {
    return "thresholds";
  }

  if (key === "storm-cloud" || key === "rain-sheen") {
    return "exterior-storm-layers";
  }

  if (key === "clue-marker") {
    return "clue-props";
  }

  if (TASK_PROP_KEYS.has(key)) {
    return "task-props";
  }

  if (key.startsWith("prop-")) {
    return "hero-props";
  }

  if (
    key === "focus-beam" ||
    key === "room-glow" ||
    key === "room-shadow" ||
    key === "room-specular"
  ) {
    return "light-masks";
  }

  if (key === "room-vignette" || key === "sabotage-stripe") {
    return "blackout-masks";
  }

  if (key === "player-token") {
    return "character-world-sprites";
  }

  return "vfx";
};

const fallbackKeyFor = (key: string) =>
  key === "floor-greenhouse"
    ? "fallback-inline-floor-greenhouse"
    : key === "wall-greenhouse"
      ? "fallback-inline-wall-greenhouse"
      : FALLBACK_KEYS_BY_KEY[key];

const createManifestCatalogEntry = (
  manifestAsset: (typeof CLIENT_GAME_ASSET_MANIFEST)[number],
): ClientGameAssetV2 => {
  const inlineSourceKey = manifestAsset.relativePath
    ? undefined
    : INLINE_SOURCE_KEY_BY_URI.get(manifestAsset.src);
  const dimensions = manifestAsset.relativePath
    ? KNOWN_DIMENSIONS_BY_RELATIVE_PATH[manifestAsset.relativePath]
    : inlineSourceKey
      ? parseInlineSvgDimensions(INLINE_ASSETS[inlineSourceKey])
      : undefined;
  const fallbackKey = fallbackKeyFor(manifestAsset.key);
  const relativePath = manifestAsset.relativePath;

  return {
    key: manifestAsset.key,
    category: inferCategoryFromKey(manifestAsset.key),
    kind: relativePath ? "image" : "inline-svg",
    ...(relativePath ? { relativePath } : {}),
    ...(inlineSourceKey ? { inlineSourceKey } : {}),
    sourceId: manifestAsset.sourceId,
    licenseStatus:
      manifestAsset.sourceId === "oga-modern-houses-cc0"
        ? "CC0"
        : "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    ...(dimensions ? { dimensions } : {}),
    ...(fallbackKey ? { fallbackKey } : {}),
    swapGroup: manifestAsset.swapGroup,
    runtimeReady: true,
    notes: relativePath
      ? "Approved CC0 baseline asset currently loaded by Phaser. It is a legal temporary placeholder, not final production art."
      : "Project-authored inline placeholder currently loaded by Phaser. Keep as fallback until a reviewed production asset replaces it.",
  };
};

const createDerivedCatalogEntry = (
  derivedAsset: (typeof CLIENT_GAME_DERIVED_TEXTURE_PLAN)[number],
): ClientGameAssetV2 => {
  const fallbackKey = fallbackKeyFor(derivedAsset.key);
  const dimensions = DERIVED_TEXTURE_DIMENSIONS[derivedAsset.key];

  if (!dimensions) {
    throw new Error(`Missing dimensions for derived asset ${derivedAsset.key}`);
  }

  return {
    key: derivedAsset.key,
    category: inferCategoryFromKey(derivedAsset.key),
    kind: "derived-image",
    relativePath: "oga-modern-houses/tiletest.png",
    sourceId: derivedAsset.sourceId,
    licenseStatus: "CC0",
    placeholder: true,
    generatedReferenceOnly: false,
    dimensions,
    ...(fallbackKey ? { fallbackKey } : {}),
    swapGroup: derivedAsset.swapGroup,
    runtimeReady: true,
    notes: `${derivedAsset.description} Derived from the reviewed CC0 baseline sheet; this is a temporary placeholder/fallback texture.`,
  };
};

const createInlineFallbackEntry = (
  key: string,
  inlineSourceKey: InlineAssetKey,
  fallbackKey: string,
): ClientGameAssetV2 => {
  const dimensions = parseInlineSvgDimensions(INLINE_ASSETS[inlineSourceKey]);

  return {
    key,
    category: inferCategoryFromKey(key),
    kind: "inline-svg",
    inlineSourceKey,
    sourceId: "blackout-inline",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    ...(dimensions ? { dimensions } : {}),
    fallbackKey,
    swapGroup: "manor-rendering",
    runtimeReady: true,
    notes:
      "Project-authored inline placeholder retained as an explicit fallback for a runtime key now normally supplied by a derived baseline texture.",
  };
};

const CURRENT_MANIFEST_CATALOG_ASSETS = CLIENT_GAME_ASSET_MANIFEST.filter(
  (manifestAsset) => !DERIVED_RUNTIME_OVERRIDES.has(manifestAsset.key),
).map(createManifestCatalogEntry);

const CURRENT_DERIVED_CATALOG_ASSETS = CLIENT_GAME_DERIVED_TEXTURE_PLAN.map(
  createDerivedCatalogEntry,
);

const INLINE_RUNTIME_FALLBACK_ASSETS: readonly ClientGameAssetV2[] = [
  createInlineFallbackEntry(
    "fallback-inline-floor-greenhouse",
    "floorGreenhouse",
    "room-floor",
  ),
  createInlineFallbackEntry(
    "fallback-inline-wall-greenhouse",
    "wallGreenhouse",
    "room-wall",
  ),
];

const CURRENT_PROCEDURAL_PLACEHOLDER_ASSETS: readonly ClientGameAssetV2[] = [
  {
    key: "procedural-avatar-world-rig",
    category: "character-world-sprites",
    kind: "procedural",
    inlineSourceKey: "procedural:AvatarRig/world",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "character-v2",
    runtimeReady: true,
    notes:
      "Current runtime-drawn world avatar rig placeholder. Future authored sprites should replace it through this swap group without changing agent or engine behavior.",
  },
  {
    key: "procedural-avatar-portrait-card",
    category: "character-portraits",
    kind: "procedural",
    inlineSourceKey: "procedural:MeetingPortraitStrip",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "character-portrait-v2",
    runtimeReady: true,
    notes:
      "Current meeting portrait placeholder drawn from public avatar presentation data. Future portraits must preserve public-state boundaries.",
  },
  {
    key: "procedural-posture-emotion-states",
    category: "posture-emotion-states",
    kind: "procedural",
    inlineSourceKey: "procedural:avatar-presentation/posture",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "character-posture-v2",
    runtimeReady: true,
    notes:
      "Current public posture/emotion placeholder system. Future state art must remain driven only by public presentation state.",
  },
  {
    key: "procedural-hud-panels",
    category: "hud-panels",
    kind: "procedural",
    inlineSourceKey: "procedural:ObservationHud/panels",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "hud-panel-v2",
    runtimeReady: true,
    notes:
      "Current Phaser-drawn HUD panel placeholder. Future HUD art should replace panel plates through cataloged assets, not route chrome.",
  },
  {
    key: "procedural-hud-icons",
    category: "hud-icons",
    kind: "procedural",
    inlineSourceKey: "procedural:public-event-icons",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "hud-icon-v2",
    runtimeReady: true,
    notes:
      "Current text/vector public-event icon placeholder set. Future icons need source metadata and must not imitate third-party social deduction UI.",
  },
  {
    key: "procedural-evidence-chip",
    category: "evidence-chips",
    kind: "procedural",
    inlineSourceKey: "procedural:evidence-claim-surfaces",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "hud-evidence-v2",
    runtimeReady: true,
    notes:
      "Current evidence/claim chip placeholder surface. Future art must show public evidence and claim support only, never hidden reasoning.",
  },
  {
    key: "procedural-support-seal",
    category: "support-seals",
    kind: "procedural",
    inlineSourceKey: "procedural:claim-support-seals",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "hud-support-seal-v2",
    runtimeReady: true,
    notes:
      "Current support-level seal placeholder. Future seals should map to public ClaimSupportLevel values only.",
  },
  {
    key: "procedural-vote-token",
    category: "vote-tokens",
    kind: "procedural",
    inlineSourceKey: "procedural:meeting-vote-token",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "hud-vote-token-v2",
    runtimeReady: true,
    notes:
      "Current meeting/vote token placeholder. Future vote art must preserve existing vote semantics and replay readability.",
  },
  {
    key: "procedural-surveillance-frame",
    category: "surveillance-frames",
    kind: "procedural",
    inlineSourceKey: "procedural:SurveillanceConsole/frame",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "surveillance-frame-v2",
    runtimeReady: true,
    notes:
      "Current surveillance feed frame placeholder. Future frames should remain in-world runtime presentation, not a separate dashboard.",
  },
  {
    key: "procedural-stage-vfx",
    category: "vfx",
    kind: "procedural",
    inlineSourceKey: "procedural:ManorWorldStage/vfx",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    fallbackKey: "signal-pulse",
    swapGroup: "vfx-v2",
    runtimeReady: true,
    notes:
      "Current Phaser-drawn focus, event, and atmospheric VFX placeholders. Future VFX textures must remain performance-conscious and replay-safe.",
  },
  {
    key: "procedural-synth-audio",
    category: "audio",
    kind: "audio",
    inlineSourceKey: "procedural:SoundBus/web-audio",
    sourceId: "blackout-runtime-procedural",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "audio-v2",
    runtimeReady: true,
    notes:
      "Current WebAudio synthesized feedback placeholder. Future audio files need source ledger rows and should not alter gameplay timings.",
  },
  {
    key: "system-font-stack-runtime",
    category: "fonts",
    kind: "font",
    inlineSourceKey: "system-font-stack",
    sourceId: "blackout-system-font-stack",
    licenseStatus: "Placeholder",
    placeholder: true,
    generatedReferenceOnly: false,
    swapGroup: "font-v2",
    runtimeReady: true,
    notes:
      "Current browser/system font stack placeholder. Future bundled fonts require explicit license review before runtime use.",
  },
];

export const CLIENT_GAME_ASSET_CATALOG_V2: readonly ClientGameAssetV2[] = [
  ...CURRENT_MANIFEST_CATALOG_ASSETS,
  ...CURRENT_DERIVED_CATALOG_ASSETS,
  ...INLINE_RUNTIME_FALLBACK_ASSETS,
  ...CURRENT_PROCEDURAL_PLACEHOLDER_ASSETS,
] as const;

const blockedLicenseStatuses = new Set<ClientGameAssetLicenseStatusV2>([
  "GeneratedReferenceOnly",
  "UnknownBlocked",
]);

export const getAssetByKey = (
  key: string,
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
) => catalog.find((asset) => asset.key === key);

export const requireAssetByKey = (
  key: string,
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
) => {
  const asset = getAssetByKey(key, catalog);

  if (!asset) {
    throw new Error(`Unknown client-game asset key: ${key}`);
  }

  return asset;
};

export const getFallbackChain = (
  key: string,
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
) => {
  const chain: ClientGameAssetV2[] = [];
  const visited = new Set<string>();
  let current = requireAssetByKey(key, catalog);

  while (current) {
    if (visited.has(current.key)) {
      throw new Error(`Asset fallback cycle detected at ${current.key}`);
    }

    visited.add(current.key);
    chain.push(current);

    if (!current.fallbackKey) {
      break;
    }

    current = requireAssetByKey(current.fallbackKey, catalog);
  }

  return chain;
};

export const getAssetsByCategory = (
  category: ClientGameAssetCategoryV2,
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
) => catalog.filter((asset) => asset.category === category);

export const getAssetsBySwapGroup = (
  swapGroup: string,
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
) => catalog.filter((asset) => asset.swapGroup === swapGroup);

export const isRuntimeReadyAsset = (
  asset: ClientGameAssetV2,
  sourceLedger: AssetSourceLedgerV2 = CLIENT_GAME_ASSET_SOURCE_LEDGER_V2,
) => {
  const source = sourceLedger[asset.sourceId];

  return (
    asset.runtimeReady &&
    Boolean(source) &&
    !asset.generatedReferenceOnly &&
    !blockedLicenseStatuses.has(asset.licenseStatus) &&
    !blockedLicenseStatuses.has(source?.licenseStatus ?? "UnknownBlocked") &&
    Boolean(source?.reviewed)
  );
};

export const assertAssetCatalogIntegrity = (
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
  sourceLedger: AssetSourceLedgerV2 = CLIENT_GAME_ASSET_SOURCE_LEDGER_V2,
) => {
  const errors: string[] = [];
  const keys = new Set<string>();

  for (const asset of catalog) {
    if (keys.has(asset.key)) {
      errors.push(`Duplicate asset key: ${asset.key}`);
    }
    keys.add(asset.key);
  }

  for (const asset of catalog) {
    const source = sourceLedger[asset.sourceId];

    if (!source) {
      errors.push(`${asset.key} references missing sourceId ${asset.sourceId}`);
    }

    if (!asset.relativePath && !asset.inlineSourceKey) {
      errors.push(`${asset.key} must declare relativePath or inlineSourceKey`);
    }

    if (asset.fallbackKey && !keys.has(asset.fallbackKey)) {
      errors.push(
        `${asset.key} references missing fallbackKey ${asset.fallbackKey}`,
      );
    }

    if (asset.generatedReferenceOnly && asset.runtimeReady) {
      errors.push(`${asset.key} is generatedReferenceOnly but runtimeReady`);
    }

    if (
      asset.runtimeReady &&
      (asset.licenseStatus === "UnknownBlocked" ||
        source?.licenseStatus === "UnknownBlocked")
    ) {
      errors.push(`${asset.key} is UnknownBlocked but runtimeReady`);
    }

    if (
      asset.licenseStatus === "GeneratedReferenceOnly" &&
      asset.runtimeReady
    ) {
      errors.push(
        `${asset.key} has GeneratedReferenceOnly license but runtimeReady`,
      );
    }

    if (asset.licenseStatus === "Placeholder" && !asset.placeholder) {
      errors.push(
        `${asset.key} has Placeholder license but placeholder is false`,
      );
    }

    if (asset.placeholder) {
      const notes = asset.notes.toLowerCase();
      const clearlyMarked =
        notes.includes("placeholder") ||
        notes.includes("baseline") ||
        notes.includes("fallback");

      if (!clearlyMarked) {
        errors.push(
          `${asset.key} is placeholder but notes do not mark it clearly`,
        );
      }
    }

    if (asset.runtimeReady && !isRuntimeReadyAsset(asset, sourceLedger)) {
      errors.push(
        `${asset.key} is runtimeReady but source/license review blocks it`,
      );
    }
  }

  for (const asset of catalog) {
    if (asset.fallbackKey) {
      try {
        getFallbackChain(asset.key, catalog);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Asset Pipeline V2 integrity failed:\n- ${errors.join("\n- ")}`,
    );
  }
};
