import { describe, expect, it } from "vitest";
import {
  getCorridorFloorTextureKey,
  getDoorThresholdConfig,
  getImportedRoomArt,
} from "../stage/importedArt";
import { MANOR_RENDER_MAP } from "../tiled/manorLayout";
import {
  assertAssetCatalogIntegrity,
  CLIENT_GAME_ASSET_CATALOG_V2,
  type ClientGameAssetV2,
  getAssetByKey,
  getAssetsByCategory,
  getAssetsBySwapGroup,
  getFallbackChain,
  isRuntimeReadyAsset,
  requireAssetByKey,
} from "./assetCatalogV2";
import { CLIENT_GAME_ASSET_MANIFEST } from "./assetManifest";
import { CLIENT_GAME_ASSET_SOURCE_LEDGER_V2 } from "./assetSourceLedgerV2";
import { CLIENT_GAME_ASSET_SOURCES } from "./assetSources";
import { CLIENT_GAME_DERIVED_TEXTURE_PLAN } from "./derivedClientAssets";
import { INLINE_ASSETS } from "./inlineAssets";

describe("Asset Pipeline V2 catalog", () => {
  it("validates catalog keys, source IDs, fallbacks, and placeholder metadata", () => {
    expect(() => assertAssetCatalogIntegrity()).not.toThrow();

    const keys = CLIENT_GAME_ASSET_CATALOG_V2.map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);

    for (const asset of CLIENT_GAME_ASSET_CATALOG_V2) {
      expect(CLIENT_GAME_ASSET_SOURCE_LEDGER_V2[asset.sourceId]).toBeDefined();

      if (asset.fallbackKey) {
        expect(getAssetByKey(asset.fallbackKey)).toBeDefined();
      }

      if (asset.placeholder) {
        expect(asset.notes).toMatch(/placeholder|baseline|fallback/i);
      }
    }
  });

  it("represents current manifest, inline, derived, and source-ledger references", () => {
    const catalogKeys = new Set(
      CLIENT_GAME_ASSET_CATALOG_V2.map((asset) => asset.key),
    );
    const representedInlineKeys = new Set(
      CLIENT_GAME_ASSET_CATALOG_V2.flatMap((asset) =>
        asset.inlineSourceKey ? [asset.inlineSourceKey] : [],
      ),
    );

    for (const manifestAsset of CLIENT_GAME_ASSET_MANIFEST) {
      expect(catalogKeys.has(manifestAsset.key)).toBe(true);
    }

    for (const derivedAsset of CLIENT_GAME_DERIVED_TEXTURE_PLAN) {
      expect(catalogKeys.has(derivedAsset.key)).toBe(true);
    }

    const missingInlineKeys = Object.keys(INLINE_ASSETS).filter(
      (inlineKey) => !representedInlineKeys.has(inlineKey),
    );
    expect(missingInlineKeys).toEqual([]);

    for (const sourceId of Object.keys(CLIENT_GAME_ASSET_SOURCES)) {
      expect(sourceId in CLIENT_GAME_ASSET_SOURCE_LEDGER_V2).toBe(true);
    }
  });

  it("resolves helpers by key, category, swap group, and fallback chain", () => {
    expect(requireAssetByKey("room-shell").key).toBe("room-shell");
    expect(
      getAssetsByCategory("hud-panels").map((asset) => asset.key),
    ).toContain("procedural-hud-panels");
    expect(
      getAssetsBySwapGroup("manor-rendering").some(
        (asset) => asset.key === "floor-grand-hall",
      ),
    ).toBe(true);
    expect(
      getFallbackChain("floor-grand-hall").map((asset) => asset.key),
    ).toEqual(["floor-grand-hall", "floor-parquet", "room-floor"]);
    expect(isRuntimeReadyAsset(requireAssetByKey("room-shell"))).toBe(true);
  });

  it("blocks generated-reference and unknown-license assets from runtime readiness", () => {
    const runtimeReadyAsset = requireAssetByKey("room-shell");
    const generatedReferenceAsset: ClientGameAssetV2 = {
      ...runtimeReadyAsset,
      key: "bad-generated-reference",
      sourceId: "blackout-generated-reference-only",
      licenseStatus: "GeneratedReferenceOnly",
      generatedReferenceOnly: true,
      runtimeReady: true,
      notes: "Generated reference placeholder should be blocked.",
    };
    const unknownBlockedAsset: ClientGameAssetV2 = {
      ...runtimeReadyAsset,
      key: "bad-unknown-blocked",
      sourceId: "blocked-unknown-license",
      licenseStatus: "UnknownBlocked",
      generatedReferenceOnly: false,
      runtimeReady: true,
      notes: "Unknown blocked placeholder source should not be runtime-ready.",
    };

    expect(isRuntimeReadyAsset(generatedReferenceAsset)).toBe(false);
    expect(isRuntimeReadyAsset(unknownBlockedAsset)).toBe(false);
    expect(() =>
      assertAssetCatalogIntegrity([
        ...CLIENT_GAME_ASSET_CATALOG_V2,
        generatedReferenceAsset,
      ]),
    ).toThrow(/generatedReferenceOnly/);
    expect(() =>
      assertAssetCatalogIntegrity([
        ...CLIENT_GAME_ASSET_CATALOG_V2,
        unknownBlockedAsset,
      ]),
    ).toThrow(/UnknownBlocked/);
  });

  it("resolves room, corridor, and threshold art keys used by the manor layout", () => {
    for (const roomId of MANOR_RENDER_MAP.roomOrder) {
      const roomArt = getImportedRoomArt(roomId);
      const roomArtKeys = [
        roomArt.floorKey,
        roomArt.wallKey,
        ...roomArt.heroProps.map((prop) => prop.key),
      ];

      for (const key of roomArtKeys) {
        expect(requireAssetByKey(key).key).toBe(key);
      }
    }

    for (const corridor of MANOR_RENDER_MAP.corridors) {
      const key = getCorridorFloorTextureKey(corridor.className);
      expect(requireAssetByKey(key).key).toBe(key);
    }

    for (const doorNode of MANOR_RENDER_MAP.doorNodes) {
      const key = getDoorThresholdConfig(doorNode).key;
      expect(requireAssetByKey(key).key).toBe(key);
    }
  });
});
