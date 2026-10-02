import { describe, expect, it } from "vitest";

import { getImportedRoomArt } from "../stage/importedArt";
import { MANOR_RENDER_MAP } from "../tiled/manorLayout";
import {
  getFallbackChain,
  isRuntimeReadyAsset,
  requireAssetByKey,
} from "./assetCatalogV2";
import {
  ESTATE_MATERIALS,
  ESTATE_TEXTURE_PLAN,
  estateFloorKey,
  estateWallKey,
} from "./estateTexturePlan";

describe("estate procedural materials", () => {
  it("provides a material and baseline fallback for every room", () => {
    for (const roomId of MANOR_RENDER_MAP.roomOrder) {
      expect(ESTATE_MATERIALS[roomId]).toBeDefined();
      const baseline = getImportedRoomArt(roomId);
      expect(requireAssetByKey(estateFloorKey(roomId)).fallbackKey).toBe(
        baseline.floorKey,
      );
      expect(requireAssetByKey(estateWallKey(roomId)).fallbackKey).toBe(
        baseline.wallKey,
      );
    }
  });

  it("registers unique, procedural, runtime-ready keys with valid fallbacks", () => {
    expect(new Set(ESTATE_TEXTURE_PLAN.map(({ key }) => key)).size).toBe(
      ESTATE_TEXTURE_PLAN.length,
    );
    for (const texture of ESTATE_TEXTURE_PLAN) {
      const asset = requireAssetByKey(texture.key);
      expect(asset.kind).toBe("procedural");
      expect(asset.placeholder).toBe(true);
      expect(asset.generatedReferenceOnly).toBe(false);
      expect(asset.dimensions).toEqual({
        width: texture.width * 2,
        height: texture.height * 2,
      });
      for (const fallback of getFallbackChain(texture.key)) {
        expect(isRuntimeReadyAsset(fallback)).toBe(true);
      }
    }
  });
});
