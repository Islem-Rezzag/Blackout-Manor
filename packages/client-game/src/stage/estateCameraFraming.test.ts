import { describe, expect, it } from "vitest";

import {
  estateInspectionZoom,
  estateOverviewZoom,
  estateWorldViewport,
} from "./estateCameraFraming";

describe("responsive estate camera", () => {
  for (const [width, height] of [
    [1280, 820],
    [1920, 1080],
    [390, 844],
  ]) {
    it(`fits the overview and room inspection at ${width}x${height}`, () => {
      if (width === undefined || height === undefined) return;
      const overviewZoom = estateOverviewZoom(width, height);
      const viewport = estateWorldViewport(width, height);
      expect(viewport.y).toBeGreaterThanOrEqual(width <= 800 ? 340 : 200);
      expect(viewport.y + viewport.height).toBeLessThanOrEqual(height - 100);
      expect(1600 * overviewZoom).toBeLessThanOrEqual(width);
      expect(1000 * overviewZoom).toBeLessThanOrEqual(viewport.height);
      const zoom = estateInspectionZoom({
        width,
        height,
        roomWidth: 300,
        roomHeight: 190,
        overviewZoom,
      });
      expect(zoom).toBeGreaterThan(overviewZoom);
      expect(410 * zoom).toBeLessThanOrEqual(width - 48);
      expect(340 * zoom).toBeLessThanOrEqual(viewport.height);
    });
  }
});
