import { describe, expect, it } from "vitest";

import {
  deriveObservationHudLayout,
  selectObservationStatusIndicators,
} from "./ObservationHud";

const createSurveillancePresentation = (overrides?: {
  mode?: "roaming" | "surveillance";
  flagged?: boolean;
}) => ({
  available: true,
  mode: overrides?.mode ?? "roaming",
  selectedRoomId:
    overrides?.mode === "surveillance" ? ("study" as const) : null,
  feedRooms: [],
  statusIndicators: [
    {
      roomId: "study" as const,
      label: "Study",
      lightLevel: "lit" as const,
      doorState: "open" as const,
      occupantCount: 2,
      flagged: overrides?.flagged ?? false,
    },
    {
      roomId: "library" as const,
      label: "Library",
      lightLevel: "dim" as const,
      doorState: "jammed" as const,
      occupantCount: 1,
      flagged: true,
    },
  ],
  subtitle: null,
  indicatorLabel: "Roaming observation - auto-follow",
  cameraLabel: "Whole manor overview",
});

describe("ObservationHud helpers", () => {
  it("hides fallback subtitle chrome during calm whole-manor overview", () => {
    const layout = deriveObservationHudLayout({
      camera: {
        roomId: null,
        immediate: false,
        reason: "default",
        detail: "Neutral manor framing.",
      },
      inspection: {
        mode: "overview",
        roomId: null,
        immediate: false,
        label: "Whole manor overview",
        detail: "Full house stays visible.",
      },
      surveillance: createSurveillancePresentation(),
      hasSubtitle: false,
    });

    expect(layout.strongFocus).toBe(false);
    expect(layout.showSubtitle).toBe(false);
    expect(layout.maxStatusChips).toBe(1);
  });

  it("keeps subtitle chrome and full status chips in surveillance mode", () => {
    const layout = deriveObservationHudLayout({
      camera: {
        roomId: "study",
        immediate: false,
        reason: "surveillance",
        detail: "Tracking the selected room feed.",
      },
      inspection: {
        mode: "inspect",
        roomId: "study",
        immediate: false,
        label: "Study surveillance",
        detail: "Feed is pinned to a public room.",
      },
      surveillance: createSurveillancePresentation({ mode: "surveillance" }),
      hasSubtitle: false,
    });

    expect(layout.showSubtitle).toBe(true);
    expect(layout.showFallbackSubtitle).toBe(true);
    expect(layout.maxStatusChips).toBe(3);
  });

  it("prioritizes flagged rooms before passive indicators outside surveillance mode", () => {
    const indicators = selectObservationStatusIndicators({
      surveillance: createSurveillancePresentation({ flagged: false }),
      strongFocus: false,
      maxStatusChips: 2,
    });

    expect(indicators).toHaveLength(1);
    expect(indicators[0]?.roomId).toBe("library");
  });
});
