import type * as Phaser from "phaser";

import { INLINE_ASSETS } from "./inlineAssets";

type InlineAssetKey = keyof typeof INLINE_ASSETS;

type AssetManifestEntry = {
  key: string;
  kind: "image";
  src: string;
  swapGroup: string;
  placeholder: boolean;
};

const manifestEntry = (
  key: string,
  sourceKey: InlineAssetKey,
): AssetManifestEntry => ({
  key,
  kind: "image",
  src: INLINE_ASSETS[sourceKey],
  swapGroup: "manor-rendering",
  placeholder: true,
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
] as const;

export const loadClientGameAssetManifest = (
  loader: Phaser.Loader.LoaderPlugin,
) => {
  for (const asset of CLIENT_GAME_ASSET_MANIFEST) {
    if (asset.kind === "image") {
      loader.image(asset.key, asset.src);
    }
  }
};
