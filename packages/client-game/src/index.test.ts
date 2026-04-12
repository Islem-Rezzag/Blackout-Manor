import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import { CLIENT_GAME_ASSET_MANIFEST } from "./bootstrap/assetManifest";
import { CLIENT_GAME_ASSET_SOURCES } from "./bootstrap/assetSources";
import { CLIENT_GAME_DERIVED_TEXTURE_PLAN } from "./bootstrap/derivedClientAssets";
import { MeetingDirector } from "./directors/MeetingDirector";
import { PhaseDirector } from "./directors/PhaseDirector";
import { MockMatchConnection } from "./network/mockMatchConnection";
import { ReplayMatchConnection } from "./network/replayMatchConnection";
import {
  getCorridorArtProfile,
  getCorridorFloorTextureKey,
  getDoorThresholdConfig,
  getImportedRoomArt,
  isProductionArtDoorNode,
  isProductionArtRoomId,
  isVerticalSliceCorridorSegment,
  isVerticalSliceRoomId,
} from "./stage/importedArt";
import {
  getDoorNodesForRoom,
  getRoomSeatPosition,
  MANOR_RENDER_MAP,
  MANOR_ROOM_LAYOUTS,
} from "./tiled/manorLayout";

const requireSnapshot = (value: MatchSnapshot | null) => {
  if (!value) {
    throw new Error("Expected a snapshot from mock mode.");
  }

  return value;
};

describe("client-game package", () => {
  it("generates stable manor room seats inside room bounds", () => {
    const seat = getRoomSeatPosition("grand-hall", 0, 4);
    const room = MANOR_ROOM_LAYOUTS["grand-hall"];

    expect(seat.x).toBeGreaterThan(room.x - room.width / 2);
    expect(seat.x).toBeLessThan(room.x + room.width / 2);
    expect(seat.y).toBeGreaterThan(room.y - room.height / 2);
    expect(seat.y).toBeLessThan(room.y + room.height / 2);
  });

  it("spreads larger cast groups across readable rows in major rooms", () => {
    const seats = Array.from({ length: 6 }, (_, index) =>
      getRoomSeatPosition("grand-hall", index, 6),
    );
    const distinctRows = new Set(seats.map((seat) => seat.y));
    const xPositions = seats
      .map((seat) => seat.x)
      .sort((left, right) => left - right);
    const yPositions = seats
      .map((seat) => seat.y)
      .sort((top, bottom) => top - bottom);
    const minX = xPositions[0] ?? 0;
    const maxX = xPositions[xPositions.length - 1] ?? 0;
    const minY = yPositions[0] ?? 0;
    const maxY = yPositions[yPositions.length - 1] ?? 0;

    expect(distinctRows.size).toBe(2);
    expect(maxX - minX).toBeGreaterThan(180);
    expect(maxY - minY).toBeGreaterThan(50);
  });

  it("parses the external tiled manor map into render data", () => {
    expect(MANOR_RENDER_MAP.roomOrder).toHaveLength(10);
    expect(MANOR_RENDER_MAP.corridors.length).toBeGreaterThan(0);
    expect(MANOR_RENDER_MAP.doorNodes.length).toBeGreaterThan(0);
    expect(MANOR_RENDER_MAP.rooms["grand-hall"].lights.length).toBeGreaterThan(
      0,
    );
    expect(MANOR_RENDER_MAP.rooms.greenhouse.windows.length).toBeGreaterThan(0);
    expect(MANOR_RENDER_MAP.rooms["grand-hall"].cameraAnchor).not.toEqual(
      MANOR_RENDER_MAP.rooms["grand-hall"].focusPoint,
    );
    expect(MANOR_RENDER_MAP.rooms.ballroom.anchors.sabotageY).toBeLessThan(0);
    expect(MANOR_RENDER_MAP.rooms.library.surfaces.shellColor).toBeGreaterThan(
      0,
    );
    expect(
      getDoorNodesForRoom("grand-hall").some((doorNode) =>
        doorNode.targetRoomIds.includes("kitchen"),
      ),
    ).toBe(true);
    expect(
      MANOR_RENDER_MAP.corridors.some(
        (segment) => segment.className === "meeting-wing",
      ),
    ).toBe(true);
  });

  it("exposes a replaceable client asset manifest for the manor renderer", () => {
    const assetKeys = CLIENT_GAME_ASSET_MANIFEST.map((asset) => asset.key);
    const derivedAssetKeys = CLIENT_GAME_DERIVED_TEXTURE_PLAN.map(
      (asset) => asset.key,
    );

    expect(assetKeys).toContain("room-shell");
    expect(assetKeys).toContain("oga-modern-houses-sheet");
    expect(assetKeys).toContain("focus-beam");
    expect(assetKeys).toContain("storm-cloud");
    expect(assetKeys).toContain("floor-grand-hall");
    expect(assetKeys).toContain("floor-grand-hall-premium");
    expect(assetKeys).toContain("floor-library-premium");
    expect(assetKeys).toContain("floor-meeting-wing");
    expect(assetKeys).toContain("floor-kitchen-premium");
    expect(assetKeys).toContain("floor-study-premium");
    expect(assetKeys).toContain("floor-ballroom-premium");
    expect(assetKeys).toContain("floor-greenhouse-premium");
    expect(assetKeys).toContain("floor-surveillance-hall-premium");
    expect(assetKeys).toContain("floor-generator-room-premium");
    expect(assetKeys).toContain("floor-cellar-premium");
    expect(assetKeys).toContain("floor-service-corridor-premium");
    expect(assetKeys).toContain("floor-intelligence-spine");
    expect(assetKeys).toContain("floor-cross-gallery-premium");
    expect(assetKeys).toContain("floor-service-link-premium");
    expect(assetKeys).toContain("wall-greenhouse");
    expect(assetKeys).toContain("wall-grand-hall-premium");
    expect(assetKeys).toContain("wall-kitchen-premium");
    expect(assetKeys).toContain("wall-study-premium");
    expect(assetKeys).toContain("wall-ballroom-premium");
    expect(assetKeys).toContain("wall-greenhouse-premium");
    expect(assetKeys).toContain("wall-surveillance-hall-premium");
    expect(assetKeys).toContain("wall-generator-room-premium");
    expect(assetKeys).toContain("wall-cellar-premium");
    expect(assetKeys).toContain("wall-service-corridor-premium");
    expect(assetKeys).toContain("door-threshold-social");
    expect(assetKeys).toContain("prop-ballroom-stage");
    expect(assetKeys).toContain("prop-grand-tribunal-table");
    expect(assetKeys).toContain("prop-library-desk");
    expect(assetKeys).toContain("prop-kitchen-range-premium");
    expect(assetKeys).toContain("prop-study-desk-premium");
    expect(assetKeys).toContain("prop-ballroom-mask-wall");
    expect(assetKeys).toContain("prop-greenhouse-planter-bed");
    expect(assetKeys).toContain("prop-surveillance-desk");
    expect(assetKeys).toContain("prop-generator-breaker-wall");
    expect(assetKeys).toContain("prop-cellar-boiler-premium");
    expect(assetKeys).toContain("prop-service-trolley");
    expect(derivedAssetKeys).toContain("floor-parquet");
    expect(derivedAssetKeys).toContain("wall-stone");
    expect(derivedAssetKeys).toContain("prop-kitchen-range");
    expect(CLIENT_GAME_ASSET_SOURCES["oga-modern-houses-cc0"].license).toBe(
      "CC0-1.0",
    );
  });

  it("maps bespoke manor surfaces and thresholds to the environment pass", () => {
    const grandHallArt = getImportedRoomArt("grand-hall");
    const kitchenArt = getImportedRoomArt("kitchen");
    const libraryArt = getImportedRoomArt("library");
    const studyArt = getImportedRoomArt("study");
    const ballroomArt = getImportedRoomArt("ballroom");
    const greenhouseArt = getImportedRoomArt("greenhouse");
    const surveillanceArt = getImportedRoomArt("surveillance-hall");
    const generatorArt = getImportedRoomArt("generator-room");
    const cellarArt = getImportedRoomArt("cellar");
    const servantsCorridorArt = getImportedRoomArt("servants-corridor");
    const greenhouseDoor = getDoorNodesForRoom("greenhouse")[0];
    const serviceDoor = getDoorNodesForRoom("kitchen")[0];
    const mechanicalDoor = {
      roomId: "generator-room",
      targetRoomIds: ["cellar"],
      kind: "door",
      orientation: "north",
    } as unknown as (typeof MANOR_RENDER_MAP.doorNodes)[number];

    expect(greenhouseDoor).toBeDefined();
    if (!greenhouseDoor) {
      throw new Error("Expected a greenhouse door node.");
    }

    const eastSliceCorridor = MANOR_RENDER_MAP.corridors.find(
      (segment) => segment.x === 960 && segment.y === 220,
    );
    const galleryCorridor = MANOR_RENDER_MAP.corridors.find(
      (segment) => segment.className === "gallery",
    );
    const serviceCorridor = MANOR_RENDER_MAP.corridors.find(
      (segment) => segment.className === "service-link",
    );

    expect(grandHallArt.floorKey).toBe("floor-grand-hall-premium");
    expect(grandHallArt.wallKey).toBe("wall-grand-hall-premium");
    expect(grandHallArt.heroProps).toHaveLength(5);
    expect(kitchenArt.floorKey).toBe("floor-kitchen-premium");
    expect(kitchenArt.wallKey).toBe("wall-kitchen-premium");
    expect(kitchenArt.heroProps).toHaveLength(5);
    expect(libraryArt.floorKey).toBe("floor-library-premium");
    expect(libraryArt.wallKey).toBe("wall-library-premium");
    expect(libraryArt.heroProps).toHaveLength(5);
    expect(studyArt.floorKey).toBe("floor-study-premium");
    expect(studyArt.wallKey).toBe("wall-study-premium");
    expect(studyArt.heroProps).toHaveLength(4);
    expect(ballroomArt.floorKey).toBe("floor-ballroom-premium");
    expect(ballroomArt.wallKey).toBe("wall-ballroom-premium");
    expect(ballroomArt.heroProps).toHaveLength(4);
    expect(greenhouseArt.floorKey).toBe("floor-greenhouse-premium");
    expect(greenhouseArt.wallKey).toBe("wall-greenhouse-premium");
    expect(greenhouseArt.heroProps).toHaveLength(4);
    expect(surveillanceArt.floorKey).toBe("floor-surveillance-hall-premium");
    expect(surveillanceArt.wallKey).toBe("wall-surveillance-hall-premium");
    expect(surveillanceArt.heroProps).toHaveLength(4);
    expect(generatorArt.floorKey).toBe("floor-generator-room-premium");
    expect(generatorArt.wallKey).toBe("wall-generator-room-premium");
    expect(generatorArt.heroProps).toHaveLength(4);
    expect(cellarArt.floorKey).toBe("floor-cellar-premium");
    expect(cellarArt.wallKey).toBe("wall-cellar-premium");
    expect(cellarArt.heroProps).toHaveLength(4);
    expect(servantsCorridorArt.floorKey).toBe("floor-service-corridor-premium");
    expect(servantsCorridorArt.wallKey).toBe("wall-service-corridor-premium");
    expect(servantsCorridorArt.heroProps).toHaveLength(4);
    expect(isVerticalSliceRoomId("grand-hall")).toBe(true);
    expect(isVerticalSliceRoomId("study")).toBe(false);
    expect(isProductionArtRoomId("study")).toBe(true);
    expect(isProductionArtRoomId("library")).toBe(true);
    expect(getCorridorFloorTextureKey("meeting-wing")).toBe(
      "floor-meeting-wing",
    );
    expect(getCorridorArtProfile("meeting-wing")).toBe("front-house");
    expect(isVerticalSliceCorridorSegment("meeting-wing")).toBe(true);
    expect(eastSliceCorridor).toBeDefined();
    if (!eastSliceCorridor) {
      throw new Error("Expected the hall-library corridor segment.");
    }
    expect(getCorridorArtProfile(eastSliceCorridor)).toBe("intelligence");
    expect(isVerticalSliceCorridorSegment(eastSliceCorridor)).toBe(true);
    expect(getCorridorFloorTextureKey(eastSliceCorridor)).toBe(
      "floor-intelligence-spine",
    );
    expect(galleryCorridor).toBeDefined();
    if (!galleryCorridor) {
      throw new Error("Expected a gallery corridor segment.");
    }
    expect(getCorridorArtProfile(galleryCorridor)).toBe("gallery");
    expect(getCorridorFloorTextureKey(galleryCorridor)).toBe(
      "floor-cross-gallery-premium",
    );
    expect(serviceCorridor).toBeDefined();
    if (!serviceCorridor) {
      throw new Error("Expected a service corridor segment.");
    }
    expect(getCorridorArtProfile(serviceCorridor)).toBe("service");
    expect(getCorridorFloorTextureKey(serviceCorridor)).toBe(
      "floor-service-link-premium",
    );
    expect(getDoorThresholdConfig(greenhouseDoor).key).toBe(
      "door-threshold-greenhouse",
    );
    expect(serviceDoor).toBeDefined();
    if (!serviceDoor) {
      throw new Error("Expected a kitchen door node.");
    }
    expect(getDoorThresholdConfig(serviceDoor).key).toBe(
      "door-threshold-service",
    );
    expect(isProductionArtDoorNode(serviceDoor)).toBe(true);
    expect(getDoorThresholdConfig(mechanicalDoor).key).toBe(
      "door-threshold-mechanical",
    );
  });

  it("emits hello, private role, and snapshot in mock mode", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    const received: string[] = [];

    connection.subscribe((message) => {
      received.push(message.type);
    });

    await connection.connect();

    expect(received[0]).toBe("server.hello");
    expect(received[1]).toBe("server.match.private-state");
    expect(received[2]).toBe("server.match.snapshot");

    vi.useRealTimers();
    await connection.disconnect();
  });

  it("routes meeting and resolution phases away from the roam scene", () => {
    const director = new PhaseDirector();
    const baseState = {
      mode: "live",
      status: "connected",
      roomId: "fixture-room",
      actorId: "player-01",
      hello: null,
      privateState: null,
      snapshot: null,
      recentEvents: [],
      replay: {
        status: "idle",
        replayId: null,
        matchId: null,
        frames: [],
        totalFrames: 0,
        isComplete: false,
      },
      lastValidationError: null,
      lastErrorMessage: null,
      fpsEstimate: 60,
    } as const;

    expect(
      director.resolveScene(
        {
          ...baseState,
          snapshot: { phaseId: "meeting" },
        } as typeof baseState & { snapshot: { phaseId: "meeting" } },
        null,
      ),
    ).toBe("meeting");
    expect(
      director.resolveScene(
        {
          ...baseState,
          snapshot: { phaseId: "resolution" },
        } as typeof baseState & { snapshot: { phaseId: "resolution" } },
        null,
      ),
    ).toBe("endgame");
  });

  it("stages surviving players into the grand hall during meetings", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    let snapshot: MatchSnapshot | null = null;

    connection.subscribe((message) => {
      if (message.type === "server.match.snapshot") {
        snapshot = message.match;
      }
    });

    await connection.connect();
    const currentSnapshot = requireSnapshot(snapshot);

    const meetingSnapshot = {
      ...currentSnapshot,
      phaseId: "meeting",
      recentEvents: [
        {
          id: "discussion-1",
          eventId: "discussion-turn",
          tick: currentSnapshot.tick,
          phaseId: "meeting",
          playerId: currentSnapshot.players[0]?.id ?? "player-01",
          targetPlayerId: currentSnapshot.players[1]?.id ?? "player-02",
          text: "Compare the corridor timeline before you vote.",
        },
      ],
    } satisfies MatchSnapshot;

    const presentation = new MeetingDirector().derive(meetingSnapshot);

    expect(presentation.meetingRoomId).toBe("grand-hall");
    expect(
      presentation.stagedSnapshot.players
        .filter((player) => player.status === "alive")
        .every((player) => player.roomId === "grand-hall"),
    ).toBe(true);

    vi.useRealTimers();
    await connection.disconnect();
  });

  it("loads replay mode through the same client connection contract", async () => {
    const replay = parseSavedReplayEnvelope(
      JSON.parse(
        readFileSync(
          resolve(
            __dirname,
            "../../replay-viewer/src/fixtures/highlight-replay.json",
          ),
          "utf8",
        ),
      ),
    );
    const connection = new ReplayMatchConnection({
      mode: "replay",
      replay,
    });
    const received: string[] = [];

    connection.subscribe((message) => {
      received.push(message.type);
    });

    await connection.connect();
    await connection.send({
      type: "client.replay.seek",
      replayId: replay.replay.replayId,
      tick: 2,
    });

    expect(received).toContain("server.hello");
    expect(received).toContain("server.replay.chunk");
    expect(received).toContain("server.match.snapshot");

    await connection.disconnect();
  });
});
