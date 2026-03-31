import type * as Phaser from "phaser";

import type { ClientGameAssetSourceId } from "./assetSources";
import { INLINE_ASSETS } from "./inlineAssets";

type InlineAssetKey = keyof typeof INLINE_ASSETS;

type AssetManifestEntry = {
  key: string;
  kind: "image";
  src: string;
  relativePath?: string;
  swapGroup: string;
  sourceId: ClientGameAssetSourceId;
  placeholder: boolean;
};

export const DEFAULT_CLIENT_GAME_ASSET_BASE_URL = "/game-assets/client-game";

const manifestEntry = (
  key: string,
  sourceKey: InlineAssetKey,
): AssetManifestEntry => ({
  key,
  kind: "image",
  src: INLINE_ASSETS[sourceKey],
  swapGroup: "manor-rendering",
  sourceId: "blackout-inline",
  placeholder: true,
});

const importedEntry = (
  key: string,
  relativePath: string,
  baseUrl = DEFAULT_CLIENT_GAME_ASSET_BASE_URL,
): AssetManifestEntry => ({
  key,
  kind: "image",
  src: `${baseUrl}/${relativePath}`,
  relativePath,
  swapGroup: "manor-rendering",
  sourceId: "oga-modern-houses-cc0",
  placeholder: false,
});

export const CLIENT_GAME_ASSET_MANIFEST = [
  manifestEntry("room-shell", "roomShell"),
  manifestEntry("room-floor", "roomFloor"),
  manifestEntry("room-vignette", "roomVignette"),
  manifestEntry("room-dust", "roomDust"),
  manifestEntry("room-specular", "roomSpecular"),
  manifestEntry("room-wall", "roomWall"),
  manifestEntry("room-shadow", "roomShadow"),
  manifestEntry("focus-beam", "focusBeam"),
  manifestEntry("signal-pulse", "signalPulse"),
  manifestEntry("storm-cloud", "stormCloud"),
  manifestEntry("player-token", "playerToken"),
  manifestEntry("room-glow", "roomGlow"),
  manifestEntry("clue-marker", "clueMarker"),
  manifestEntry("sabotage-stripe", "sabotageStripe"),
  manifestEntry("rain-sheen", "rainSheen"),
  importedEntry("oga-modern-houses-sheet", "oga-modern-houses/tiletest.png"),
] as const;

export const loadClientGameAssetManifest = (
  loader: Phaser.Loader.LoaderPlugin,
  options?: {
    assetBaseUrl?: string;
  },
) => {
  const assetBaseUrl =
    options?.assetBaseUrl ?? DEFAULT_CLIENT_GAME_ASSET_BASE_URL;

  for (const manifestAsset of CLIENT_GAME_ASSET_MANIFEST) {
    const asset =
      manifestAsset.sourceId === "oga-modern-houses-cc0" &&
      manifestAsset.relativePath
        ? importedEntry(
            manifestAsset.key,
            manifestAsset.relativePath,
            assetBaseUrl,
          )
        : manifestAsset;

    if (asset.kind === "image") {
      loader.image(asset.key, asset.src);
    }
  }
};
