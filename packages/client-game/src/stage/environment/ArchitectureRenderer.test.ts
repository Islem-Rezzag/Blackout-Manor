import { describe, expect, it } from "vitest";

import { getWallSpans } from "./ArchitectureRenderer";

describe("cutaway masonry", () => {
  it("keeps door openings unobstructed without changing their geometry", () => {
    expect(getWallSpans(100, [{ start: 30, end: 50 }])).toEqual([
      { start: 0, end: 30 },
      { start: 50, end: 100 },
    ]);
  });

  it("unions overlapping, unordered openings and clamps edge doors", () => {
    const doors = [
      { start: 85, end: 110 },
      { start: 35, end: 65 },
      { start: 20, end: 45 },
      { start: -10, end: 10 },
    ];
    expect(getWallSpans(100, doors)).toEqual([
      { start: 10, end: 20 },
      { start: 65, end: 85 },
    ]);
    expect(doors[0]?.start).toBe(85);
  });

  it("retains uninterrupted walls and handles a fully open edge", () => {
    expect(getWallSpans(100, [])).toEqual([{ start: 0, end: 100 }]);
    expect(getWallSpans(100, [{ start: 0, end: 100 }])).toEqual([]);
  });
});
