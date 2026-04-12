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
  manifestEntry("floor-grand-hall-premium", "floorGrandHallPremium"),
  manifestEntry("floor-library-premium", "floorLibraryPremium"),
  manifestEntry("floor-meeting-wing", "floorMeetingWing"),
  manifestEntry("floor-kitchen-premium", "floorKitchenPremium"),
  manifestEntry("floor-study-premium", "floorStudyPremium"),
  manifestEntry("floor-ballroom-premium", "floorBallroomPremium"),
  manifestEntry("floor-greenhouse-premium", "floorGreenhousePremium"),
  manifestEntry(
    "floor-surveillance-hall-premium",
    "floorSurveillanceHallPremium",
  ),
  manifestEntry("floor-generator-room-premium", "floorGeneratorRoomPremium"),
  manifestEntry("floor-cellar-premium", "floorCellarPremium"),
  manifestEntry(
    "floor-service-corridor-premium",
    "floorServiceCorridorPremium",
  ),
  manifestEntry("floor-intelligence-spine", "floorIntelligenceSpine"),
  manifestEntry("floor-cross-gallery-premium", "floorCrossGalleryPremium"),
  manifestEntry("floor-service-link-premium", "floorServiceLinkPremium"),
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
  manifestEntry("wall-grand-hall-premium", "wallGrandHallPremium"),
  manifestEntry("wall-library-premium", "wallLibraryPremium"),
  manifestEntry("wall-kitchen-premium", "wallKitchenPremium"),
  manifestEntry("wall-study-premium", "wallStudyPremium"),
  manifestEntry("wall-ballroom-premium", "wallBallroomPremium"),
  manifestEntry("wall-greenhouse-premium", "wallGreenhousePremium"),
  manifestEntry(
    "wall-surveillance-hall-premium",
    "wallSurveillanceHallPremium",
  ),
  manifestEntry("wall-generator-room-premium", "wallGeneratorRoomPremium"),
  manifestEntry("wall-cellar-premium", "wallCellarPremium"),
  manifestEntry("wall-service-corridor-premium", "wallServiceCorridorPremium"),
  manifestEntry("door-threshold-social", "doorThresholdSocial"),
  manifestEntry("door-threshold-service", "doorThresholdService"),
  manifestEntry("door-threshold-greenhouse", "doorThresholdGreenhouse"),
  manifestEntry("door-threshold-mechanical", "doorThresholdMechanical"),
  manifestEntry("door-threshold-stair", "doorThresholdStair"),
  manifestEntry("prop-grand-stair", "propGrandStair"),
  manifestEntry("prop-grand-clock", "propGrandClock"),
  manifestEntry("prop-grand-tribunal-chairbank", "propGrandTribunalChairbank"),
  manifestEntry("prop-grand-tribunal-table", "propGrandTribunalTable"),
  manifestEntry("prop-grand-console", "propGrandConsole"),
  manifestEntry("prop-kitchen-island", "propKitchenIsland"),
  manifestEntry("prop-kitchen-pantry", "propKitchenPantry"),
  manifestEntry("prop-kitchen-range-premium", "propKitchenRangePremium"),
  manifestEntry("prop-kitchen-utensil-rack", "propKitchenUtensilRack"),
  manifestEntry("prop-kitchen-tea-cart", "propKitchenTeaCart"),
  manifestEntry("prop-kitchen-dish-shelf", "propKitchenDishShelf"),
  manifestEntry("prop-kitchen-butcher-block", "propKitchenButcherBlock"),
  manifestEntry("prop-library-fireplace", "propLibraryFireplace"),
  manifestEntry("prop-library-desk", "propLibraryDesk"),
  manifestEntry("prop-library-stacks", "propLibraryStacks"),
  manifestEntry("prop-library-ladder", "propLibraryLadder"),
  manifestEntry("prop-library-reading-club", "propLibraryReadingClub"),
  manifestEntry("prop-study-safe", "propStudySafe"),
  manifestEntry("prop-study-desk-premium", "propStudyDeskPremium"),
  manifestEntry("prop-study-evidence-board", "propStudyEvidenceBoard"),
  manifestEntry("prop-study-filing-cabinet", "propStudyFilingCabinet"),
  manifestEntry("prop-study-side-table", "propStudySideTable"),
  manifestEntry("prop-study-portrait-rail", "propStudyPortraitRail"),
  manifestEntry("prop-ballroom-organ", "propBallroomOrgan"),
  manifestEntry("prop-ballroom-stage", "propBallroomStage"),
  manifestEntry("prop-ballroom-mask-wall", "propBallroomMaskWall"),
  manifestEntry("prop-ballroom-candelabra", "propBallroomCandelabra"),
  manifestEntry("prop-ballroom-bench", "propBallroomBench"),
  manifestEntry("prop-ballroom-drape-stand", "propBallroomDrapeStand"),
  manifestEntry("prop-greenhouse-bench", "propGreenhouseBench"),
  manifestEntry("prop-greenhouse-planter-bed", "propGreenhousePlanterBed"),
  manifestEntry("prop-greenhouse-valve-bank", "propGreenhouseValveBank"),
  manifestEntry("prop-greenhouse-pot-shelf", "propGreenhousePotShelf"),
  manifestEntry(
    "prop-greenhouse-hanging-basket",
    "propGreenhouseHangingBasket",
  ),
  manifestEntry("prop-surveillance-screenwall", "propSurveillanceScreenwall"),
  manifestEntry("prop-surveillance-archive", "propSurveillanceArchive"),
  manifestEntry("prop-surveillance-desk", "propSurveillanceDesk"),
  manifestEntry("prop-surveillance-switchboard", "propSurveillanceSwitchboard"),
  manifestEntry("prop-surveillance-cable-rack", "propSurveillanceCableRack"),
  manifestEntry("prop-surveillance-reel-stack", "propSurveillanceReelStack"),
  manifestEntry("prop-surveillance-task-lamp", "propSurveillanceTaskLamp"),
  manifestEntry("prop-generator-core", "propGeneratorCore"),
  manifestEntry("prop-generator-pipes", "propGeneratorPipes"),
  manifestEntry("prop-generator-breaker-wall", "propGeneratorBreakerWall"),
  manifestEntry("prop-generator-tool-cart", "propGeneratorToolCart"),
  manifestEntry("prop-generator-cable-bundle", "propGeneratorCableBundle"),
  manifestEntry("prop-generator-fuse-crate", "propGeneratorFuseCrate"),
  manifestEntry("prop-cellar-coal", "propCellarCoal"),
  manifestEntry("prop-cellar-boiler-premium", "propCellarBoilerPremium"),
  manifestEntry("prop-cellar-valve-bank", "propCellarValveBank"),
  manifestEntry("prop-cellar-workbench", "propCellarWorkbench"),
  manifestEntry("prop-cellar-coal-scuttle", "propCellarCoalScuttle"),
  manifestEntry("prop-crate-stack", "propCrateStack"),
  manifestEntry("prop-service-trolley", "propServiceTrolley"),
  manifestEntry("prop-service-hooks", "propServiceHooks"),
  manifestEntry("prop-service-linen-shelf", "propServiceLinenShelf"),
  manifestEntry("prop-service-umbrella-stand", "propServiceUmbrellaStand"),
  manifestEntry("prop-service-hamper", "propServiceHamper"),
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
