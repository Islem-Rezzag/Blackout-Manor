import { describe, expect, it } from "vitest";

import {
  estateInspectionZoom,
  estateOverviewZoom,
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
      expect(1600 * overviewZoom).toBeLessThanOrEqual(width);
      expect(1120 * overviewZoom).toBeLessThanOrEqual(height - 230);
      const zoom = estateInspectionZoom({
        width,
        height,
        roomWidth: 300,
        roomHeight: 190,
        overviewZoom,
      });
      expect(zoom).toBeGreaterThan(overviewZoom);
      expect(410 * zoom).toBeLessThanOrEqual(width - 48);
      expect(340 * zoom).toBeLessThanOrEqual(height - 245);
    });
  }
});
