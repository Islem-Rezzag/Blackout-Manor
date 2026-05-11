import { MANOR_V1_MAP } from "@blackout-manor/content";
import type { MatchSnapshot } from "@blackout-manor/shared";
import { describe, expect, it, vi } from "vitest";

import {
  CLIENT_GAME_ASSET_CATALOG_V2,
  getFallbackChain,
  isRuntimeReadyAsset,
  requireAssetByKey,
} from "../../bootstrap/assetCatalogV2";
import { SurveillanceDirector } from "../../directors/SurveillanceDirector";
import { MANOR_RENDER_MAP } from "../../tiled/manorLayout";
import type { ClientGameState } from "../../types";
import { resolveDirectedCameraPlan } from "../cameraDirection";
import {
  assertEnvironmentAssetReferencesRuntimeReady,
  collectEnvironmentAssetReferences,
  createEnvironmentFocusContext,
  createEnvironmentRenderPlan,
} from "./EnvironmentRenderer";
import { getThresholdFocusState } from "./ThresholdRenderer";

vi.mock("phaser", () => {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  return {
    default: {
      BlendModes: {
        ADD: "ADD",
        MULTIPLY: "MULTIPLY",
        NORMAL: "NORMAL",
        SCREEN: "SCREEN",
      },
      Math: { Clamp: clamp },
    },
    BlendModes: {
      ADD: "ADD",
      MULTIPLY: "MULTIPLY",
      NORMAL: "NORMAL",
      SCREEN: "SCREEN",
    },
    Math: { Clamp: clamp },
  };
});

const createSnapshot = (): MatchSnapshot => {
  const rooms = MANOR_RENDER_MAP.roomOrder.map((roomId, index) => ({
    roomId,
    lightLevel: index === 6 ? "blackout" : index === 3 ? "dim" : "lit",
    doorState: index === 2 ? "jammed" : "open",
    occupantIds: index === 0 ? ["player-01"] : [],
    taskIds: [],
  })) satisfies MatchSnapshot["rooms"];

  return {
    matchId: "match-environment-v2",
    phaseId: "roam",
    tick: 12,
    config: {
      matchId: "match-environment-v2",
      seed: 7,
      speedProfileId: "showcase",
      playerCount: 1,
      officialPublicMode: true,
      modelPackId: "official-public",
      allowPrivateWhispers: false,
      roomIds: MANOR_RENDER_MAP.roomOrder,
      taskIds: [],
      roleDistribution: {
        shadow: 0,
        investigator: 0,
        steward: 0,
        household: 1,
      },
      timings: {
        castIntroSeconds: 5,
        roamRoundCount: { min: 4, max: 6 },
        roamRoundSeconds: 90,
        discussionSeconds: 70,
        voteSeconds: 15,
        hardCapSeconds: 900,
      },
    },
    players: [
      {
        id: "player-01",
        displayName: "Velvet Host",
        roomId: "grand-hall",
        status: "alive",
        connected: true,
        publicImage: {
          credibility: 0.62,
          suspiciousness: 0.18,
        },
        emotion: {
          pleasure: 0.12,
          arousal: 0.28,
          dominance: 0.18,
          label: "calm",
          intensity: 0.32,
          updatedAtTick: 12,
        },
        bodyLanguage: "calm",
        completedTaskCount: 0,
      },
    ],
    rooms,
    tasks: [],
    recentEvents: [
      {
        id: "sabotage-1",
        eventId: "sabotage-triggered",
        tick: 12,
        phaseId: "roam",
        playerId: "player-01",
        actionId: "trigger-blackout",
        roomId: "generator-room",
      },
    ],
  };
};

const createRuntimeState = (snapshot: MatchSnapshot): ClientGameState => ({
  mode: "live",
  status: "connected",
  roomId: "demo",
  actorId: "player-01",
  hello: null,
  privateState: null,
  snapshot,
  recentEvents: snapshot.recentEvents,
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
});

describe("Manor environment renderer v2", () => {
  it("builds a data-driven render plan from the current manor layout", () => {
    const plan = createEnvironmentRenderPlan();
    const contentRoomsById = new Map(
      MANOR_V1_MAP.rooms.map((room) => [room.id, room]),
    );

    expect(plan.rooms.map((room) => room.roomId)).toEqual(
      MANOR_RENDER_MAP.roomOrder,
    );
    expect(plan.corridors).toHaveLength(MANOR_RENDER_MAP.corridors.length);
    expect(plan.thresholds).toHaveLength(MANOR_RENDER_MAP.doorNodes.length);

    for (const roomPlan of plan.rooms) {
      expect(roomPlan.room).toBe(MANOR_RENDER_MAP.rooms[roomPlan.roomId]);
      expect(roomPlan.art.floorKey).toMatch(/^floor-/);
      expect(roomPlan.art.wallKey).toMatch(/^wall-/);
      expect(roomPlan.taskIds).toEqual(
        contentRoomsById.get(roomPlan.roomId)?.taskIds ?? [],
      );
    }
  });

  it("resolves every room, corridor, threshold, and fallback key through Asset Pipeline V2", () => {
    const plan = createEnvironmentRenderPlan();
    const references = collectEnvironmentAssetReferences(plan);

    expect(references.length).toBeGreaterThan(plan.rooms.length);
    expect(() =>
      assertEnvironmentAssetReferencesRuntimeReady(plan),
    ).not.toThrow();

    for (const reference of references) {
      expect(requireAssetByKey(reference.key).key).toBe(reference.key);

      for (const asset of getFallbackChain(reference.key)) {
        expect(isRuntimeReadyAsset(asset)).toBe(true);
      }
    }
  });

  it("blocks generated-reference-only and unknown-license environment assets", () => {
    const plan = createEnvironmentRenderPlan();
    const floor = requireAssetByKey("floor-grand-hall");
    const generatedReferenceFloor = {
      ...floor,
      sourceId: "blackout-generated-reference-only",
      licenseStatus: "GeneratedReferenceOnly",
      generatedReferenceOnly: true,
      runtimeReady: true,
      notes: "Generated reference placeholder should never be runtime-ready.",
    } satisfies typeof floor;
    const unknownBlockedFloor = {
      ...floor,
      sourceId: "blocked-unknown-license",
      licenseStatus: "UnknownBlocked",
      generatedReferenceOnly: false,
      runtimeReady: true,
      notes: "Unknown blocked placeholder should never be runtime-ready.",
    } satisfies typeof floor;

    expect(() =>
      assertEnvironmentAssetReferencesRuntimeReady(plan, [
        generatedReferenceFloor,
        ...CLIENT_GAME_ASSET_CATALOG_V2,
      ]),
    ).toThrow(/GeneratedReferenceOnly/);
    expect(() =>
      assertEnvironmentAssetReferencesRuntimeReady(plan, [
        unknownBlockedFloor,
        ...CLIENT_GAME_ASSET_CATALOG_V2,
      ]),
    ).toThrow(/UnknownBlocked/);
  });

  it("keeps room inspection and threshold focus compatible with camera direction", () => {
    const plan = createEnvironmentRenderPlan();
    const directedPlan = resolveDirectedCameraPlan({
      camera: {
        roomId: "ballroom",
        immediate: false,
        reason: "interaction",
        detail: "Visible interaction overrides passive roaming.",
      },
      inspection: {
        mode: "inspect",
        roomId: "study",
        immediate: false,
        label: "Inspecting Study",
        detail: "Room focus keeps adjacent thresholds readable.",
      },
      variant: "manor",
    });
    const context = createEnvironmentFocusContext({
      directedPlan,
      activeRoomId: directedPlan.activeRoomId,
      inspectedRoomId: directedPlan.inspectionRoomId,
      hoveredRoomId: null,
    });
    const studyThreshold = plan.thresholds.find(
      ({ node }) =>
        node.roomId === "study" || node.targetRoomIds.includes("study"),
    );

    expect(context.focusRoomId).toBe("study");
    expect(context.inspectedRoomId).toBe("study");
    expect(context.focusedRoom?.roomId).toBe("study");
    expect(studyThreshold).toBeDefined();
    expect(
      getThresholdFocusState({
        nodeRoomId: studyThreshold?.node.roomId ?? "grand-hall",
        targetRoomIds: studyThreshold?.node.targetRoomIds ?? [],
        focusRoomId: context.focusRoomId,
        hoveredRoomId: context.hoveredRoomId,
        inspectedRoomId: context.inspectedRoomId,
      }).inspected,
    ).toBe(true);
  });

  it("keeps surveillance feed rooms inside the environment render plan", () => {
    const plan = createEnvironmentRenderPlan();
    const environmentRoomIds = new Set(plan.rooms.map((room) => room.roomId));
    const snapshot = createSnapshot();
    const director = new SurveillanceDirector();

    director.focusRoom("generator-room");
    const presentation = director.derive({
      scene: "manor-world",
      snapshot,
      runtimeState: createRuntimeState(snapshot),
      camera: {
        roomId: "generator-room",
        immediate: false,
        reason: "surveillance",
        detail: "Tracking generator room through the surveillance console.",
      },
    });

    expect(presentation.available).toBe(true);
    expect(presentation.selectedRoomId).toBe("generator-room");
    expect(environmentRoomIds.has(presentation.selectedRoomId ?? "study")).toBe(
      true,
    );

    for (const feed of presentation.feedRooms) {
      expect(environmentRoomIds.has(feed.roomId)).toBe(true);
    }
  });
});
