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
  manifestEntry("floor-grand-hall", "floorGrandHall"),
  manifestEntry("floor-library", "floorLibrary"),
  manifestEntry("floor-study", "floorStudy"),
  manifestEntry("floor-ballroom", "floorBallroom"),
  manifestEntry("floor-kitchen", "floorKitchen"),
  manifestEntry("floor-greenhouse", "floorGreenhouse"),
  manifestEntry("floor-surveillance-hall", "floorSurveillanceHall"),
  manifestEntry("floor-generator-room", "floorGeneratorRoom"),
  manifestEntry("floor-cellar", "floorCellar"),
  manifestEntry("floor-service-corridor", "floorServiceCorridor"),
  manifestEntry("floor-gallery", "floorGallery"),
  manifestEntry("wall-grand-hall", "wallGrandHall"),
  manifestEntry("wall-library", "wallLibrary"),
  manifestEntry("wall-study", "wallStudy"),
  manifestEntry("wall-ballroom", "wallBallroom"),
  manifestEntry("wall-kitchen", "wallKitchen"),
  manifestEntry("wall-greenhouse", "wallGreenhouse"),
  manifestEntry("wall-surveillance-hall", "wallSurveillanceHall"),
  manifestEntry("wall-generator-room", "wallGeneratorRoom"),
  manifestEntry("wall-cellar", "wallCellar"),
  manifestEntry("wall-service-corridor", "wallServiceCorridor"),
  manifestEntry("door-threshold-social", "doorThresholdSocial"),
  manifestEntry("door-threshold-service", "doorThresholdService"),
  manifestEntry("door-threshold-greenhouse", "doorThresholdGreenhouse"),
  manifestEntry("door-threshold-mechanical", "doorThresholdMechanical"),
  manifestEntry("door-threshold-stair", "doorThresholdStair"),
  manifestEntry("prop-grand-stair", "propGrandStair"),
  manifestEntry("prop-grand-clock", "propGrandClock"),
  manifestEntry("prop-kitchen-island", "propKitchenIsland"),
  manifestEntry("prop-kitchen-pantry", "propKitchenPantry"),
  manifestEntry("prop-library-fireplace", "propLibraryFireplace"),
  manifestEntry("prop-study-safe", "propStudySafe"),
  manifestEntry("prop-ballroom-organ", "propBallroomOrgan"),
  manifestEntry("prop-ballroom-stage", "propBallroomStage"),
  manifestEntry("prop-greenhouse-bench", "propGreenhouseBench"),
  manifestEntry("prop-surveillance-screenwall", "propSurveillanceScreenwall"),
  manifestEntry("prop-surveillance-archive", "propSurveillanceArchive"),
  manifestEntry("prop-generator-core", "propGeneratorCore"),
  manifestEntry("prop-generator-pipes", "propGeneratorPipes"),
  manifestEntry("prop-cellar-coal", "propCellarCoal"),
  manifestEntry("prop-crate-stack", "propCrateStack"),
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
