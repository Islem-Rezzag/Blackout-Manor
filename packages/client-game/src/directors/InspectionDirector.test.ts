import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { MockMatchConnection } from "../network/mockMatchConnection";
import { InspectionDirector } from "./InspectionDirector";

const loadMockSnapshot = async (): Promise<MatchSnapshot> => {
  vi.useFakeTimers();
  const connection = new MockMatchConnection({ tickMs: 200 });
  let snapshot: MatchSnapshot | null = null;

  connection.subscribe((message) => {
    if (message.type === "server.match.snapshot") {
      snapshot = message.match;
    }
  });

  await connection.connect();
  vi.useRealTimers();
  await connection.disconnect();

  if (!snapshot) {
    throw new Error("Expected mock connection to produce a snapshot.");
  }

  return snapshot;
};

describe("InspectionDirector", () => {
  it("defaults to a whole-manor overview in roaming scenes", async () => {
    const snapshot = await loadMockSnapshot();
    const presentation = new InspectionDirector().derive({
      scene: "manor-world",
      snapshot,
      observationMode: "roaming",
      surveillanceRoomId: null,
      activeRoomId: "library",
      fallbackImmediate: true,
    });

    expect(presentation.mode).toBe("overview");
    expect(presentation.roomId).toBeNull();
    expect(presentation.label).toBe("Whole manor overview");
  });

  it("locks to an inspected room in roaming mode", async () => {
    const snapshot = await loadMockSnapshot();
    const director = new InspectionDirector();
    director.inspectRoom("study");

    const presentation = director.derive({
      scene: "manor-world",
      snapshot,
      observationMode: "roaming",
      surveillanceRoomId: null,
      activeRoomId: "library",
      fallbackImmediate: true,
    });

    expect(presentation.mode).toBe("inspect");
    expect(presentation.roomId).toBe("study");
    expect(presentation.immediate).toBe(false);
  });

  it("lets surveillance temporarily override roaming inspection", async () => {
    const snapshot = await loadMockSnapshot();
    const director = new InspectionDirector();
    director.inspectRoom("study");

    const presentation = director.derive({
      scene: "replay",
      snapshot,
      observationMode: "surveillance",
      surveillanceRoomId: "greenhouse",
      activeRoomId: "library",
      fallbackImmediate: false,
    });

    expect(presentation.mode).toBe("inspect");
    expect(presentation.roomId).toBe("greenhouse");
    expect(presentation.label).toContain("Greenhouse");
  });
});
