import { MANOR_V1_MAP } from "@blackout-manor/content";
import type { RoomId, TaskId } from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import {
  CLIENT_GAME_ASSET_CATALOG_V2,
  type ClientGameAssetV2,
  getFallbackChain,
  isRuntimeReadyAsset,
  requireAssetByKey,
} from "../../bootstrap/assetCatalogV2";
import type { ClientGameAssetSourceLedgerEntryV2 } from "../../bootstrap/assetSourceLedgerV2";
import {
  getRoomRenderData,
  MANOR_RENDER_MAP,
  MANOR_WORLD_BOUNDS,
  type ManorRenderMap,
  type ManorRenderRoom,
} from "../../tiled/manorLayout";
import type { DirectedCameraPlan } from "../cameraDirection";
import {
  getCorridorFloorTextureKey,
  getDoorThresholdConfig,
  getImportedRoomArt,
} from "../importedArt";
import { drawEnvironmentBackdrop } from "./BackdropRenderer";
import { drawCorridors, refreshCorridorFocus } from "./CorridorRenderer";
import type {
  EnvironmentAssetReference,
  EnvironmentRenderPlan,
  EnvironmentRoomVisual,
  EnvironmentStageLayers,
} from "./EnvironmentRenderTypes";
import { drawRoomPlates } from "./RoomPlateRenderer";
import { drawThresholds, refreshThresholdFocus } from "./ThresholdRenderer";

type AssetSourceLedgerV2 = Record<string, ClientGameAssetSourceLedgerEntryV2>;

const SHARED_ROOM_ENVIRONMENT_KEYS = [
  "room-shadow",
  "room-shell",
  "room-specular",
  "room-glow",
  "room-dust",
  "room-vignette",
  "room-wall",
  "rain-sheen",
  "focus-beam",
  "clue-marker",
  "signal-pulse",
  "sabotage-stripe",
] as const;

const SHARED_BACKDROP_KEYS = ["room-shadow", "storm-cloud"] as const;
const SHARED_CORRIDOR_KEYS = [
  "room-shadow",
  "room-shell",
  "room-specular",
  "room-vignette",
  "room-glow",
] as const;
const SHARED_THRESHOLD_KEYS = ["focus-beam"] as const;

const taskIdsByRoom = new Map<RoomId, readonly TaskId[]>(
  MANOR_V1_MAP.rooms.map((room) => [room.id, room.taskIds]),
);

const uniqueReferences = (references: readonly EnvironmentAssetReference[]) => {
  const seen = new Set<string>();

  return references.filter((reference) => {
    const id = [
      reference.key,
      reference.usage,
      reference.roomId ?? "",
      reference.corridorId ?? "",
      reference.doorNodeId ?? "",
    ].join(":");

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

export const createEnvironmentRenderPlan = (
  renderMap: ManorRenderMap = MANOR_RENDER_MAP,
): EnvironmentRenderPlan => ({
  renderMap,
  backdropRects: renderMap.backdropRects,
  rooms: renderMap.roomOrder.map((roomId) => ({
    roomId,
    room: renderMap.rooms[roomId],
    art: getImportedRoomArt(roomId),
    taskIds: taskIdsByRoom.get(roomId) ?? [],
  })),
  corridors: renderMap.corridors.map((segment) => ({
    segment,
    floorKey: getCorridorFloorTextureKey(segment.className),
  })),
  thresholds: renderMap.doorNodes.map((node) => ({
    node,
    art: getDoorThresholdConfig(node),
  })),
});

export const collectEnvironmentAssetReferences = (
  plan: EnvironmentRenderPlan = createEnvironmentRenderPlan(),
) => {
  const references: EnvironmentAssetReference[] = [];

  for (const key of SHARED_BACKDROP_KEYS) {
    references.push({ key, usage: "backdrop" });
  }

  for (const roomPlan of plan.rooms) {
    const { art, roomId } = roomPlan;

    for (const key of SHARED_ROOM_ENVIRONMENT_KEYS) {
      references.push({ key, roomId, usage: "room-shell" });
    }

    references.push({ key: art.floorKey, roomId, usage: "room-floor" });
    references.push({ key: art.wallKey, roomId, usage: "room-wall" });

    for (const prop of art.heroProps) {
      references.push({ key: prop.key, prop, roomId, usage: "room-prop" });
    }
  }

  for (const corridor of plan.corridors) {
    for (const key of SHARED_CORRIDOR_KEYS) {
      references.push({
        key,
        corridorId: corridor.segment.id,
        usage: "corridor",
      });
    }
    references.push({
      key: corridor.floorKey,
      corridorId: corridor.segment.id,
      usage: "corridor",
    });
  }

  for (const threshold of plan.thresholds) {
    for (const key of SHARED_THRESHOLD_KEYS) {
      references.push({
        key,
        doorNodeId: threshold.node.id,
        usage: "threshold",
      });
    }
    references.push({
      key: threshold.art.key,
      doorNodeId: threshold.node.id,
      usage: "threshold",
    });
  }

  return uniqueReferences(references);
};

export const assertEnvironmentAssetReferencesRuntimeReady = (
  plan: EnvironmentRenderPlan = createEnvironmentRenderPlan(),
  catalog: readonly ClientGameAssetV2[] = CLIENT_GAME_ASSET_CATALOG_V2,
  sourceLedger?: AssetSourceLedgerV2,
) => {
  const references = collectEnvironmentAssetReferences(plan);
  const blockedReferences: string[] = [];

  for (const reference of references) {
    const chain = getFallbackChain(reference.key, catalog);

    for (const asset of chain) {
      const runtimeReady = sourceLedger
        ? isRuntimeReadyAsset(asset, sourceLedger)
        : isRuntimeReadyAsset(asset);

      if (!runtimeReady) {
        blockedReferences.push(
          `${reference.key} uses blocked asset ${asset.key}`,
        );
      }

      if (
        asset.generatedReferenceOnly ||
        asset.licenseStatus === "GeneratedReferenceOnly" ||
        asset.licenseStatus === "UnknownBlocked"
      ) {
        blockedReferences.push(
          `${reference.key} cannot use ${asset.licenseStatus} asset ${asset.key}`,
        );
      }
    }

    requireAssetByKey(reference.key, catalog);
  }

  if (blockedReferences.length > 0) {
    throw new Error(
      `Environment renderer asset references are not runtime-ready:\n- ${blockedReferences.join(
        "\n- ",
      )}`,
    );
  }
};

export type EnvironmentFocusContext = {
  activeRoomId: RoomId | null;
  focusRoomId: RoomId | null;
  inspectedRoomId: RoomId | null;
  hoveredRoomId: RoomId | null;
  emphasis: number;
  roomScaleBoost: number;
  dimStrength: number;
  doorwayEmphasis: number;
  corridorEmphasis: number;
  focusedRoom: ManorRenderRoom | null;
  inspectedRoom: ManorRenderRoom | null;
};

export const createEnvironmentFocusContext = (options: {
  directedPlan: DirectedCameraPlan | null;
  activeRoomId: RoomId | null;
  inspectedRoomId: RoomId | null;
  hoveredRoomId: RoomId | null;
}) => {
  const { activeRoomId, directedPlan, hoveredRoomId, inspectedRoomId } =
    options;
  const focusRoomId = directedPlan?.focusRoomId ?? activeRoomId;
  const focusedRoom = focusRoomId ? getRoomRenderData(focusRoomId) : null;
  const inspectedRoom = inspectedRoomId
    ? getRoomRenderData(inspectedRoomId)
    : null;

  return {
    activeRoomId,
    focusRoomId,
    inspectedRoomId,
    hoveredRoomId,
    emphasis: directedPlan?.emphasis ?? 0,
    roomScaleBoost: directedPlan?.roomScaleBoost ?? 0.014,
    dimStrength: directedPlan?.dimStrength ?? 0.12,
    doorwayEmphasis: directedPlan?.doorwayEmphasis ?? 0.18,
    corridorEmphasis: directedPlan?.corridorEmphasis ?? 0.08,
    focusedRoom,
    inspectedRoom,
  } satisfies EnvironmentFocusContext;
};

export class EnvironmentRenderer {
  readonly #scene: Phaser.Scene;
  readonly #layers: EnvironmentStageLayers;
  readonly #plan: EnvironmentRenderPlan;
  readonly #roomVisuals = new Map<RoomId, EnvironmentRoomVisual>();
  #corridorVisuals: ReturnType<typeof drawCorridors> = [];
  #thresholdVisuals: ReturnType<typeof drawThresholds> = [];
  readonly #callbacks: {
    onHoverRoomChange?: (roomId: RoomId | null) => void;
    onInspectRoom?: (roomId: RoomId) => void;
    onSelectRoom?: (roomId: RoomId) => void;
    onStartTask?: (taskId: TaskId) => void;
  };

  constructor(options: {
    scene: Phaser.Scene;
    layers: EnvironmentStageLayers;
    plan?: EnvironmentRenderPlan;
    onHoverRoomChange?: (roomId: RoomId | null) => void;
    onInspectRoom?: (roomId: RoomId) => void;
    onSelectRoom?: (roomId: RoomId) => void;
    onStartTask?: (taskId: TaskId) => void;
  }) {
    this.#scene = options.scene;
    this.#layers = options.layers;
    this.#plan = options.plan ?? createEnvironmentRenderPlan();
    this.#callbacks = {
      ...(options.onHoverRoomChange
        ? { onHoverRoomChange: options.onHoverRoomChange }
        : {}),
      ...(options.onInspectRoom
        ? { onInspectRoom: options.onInspectRoom }
        : {}),
      ...(options.onSelectRoom ? { onSelectRoom: options.onSelectRoom } : {}),
      ...(options.onStartTask ? { onStartTask: options.onStartTask } : {}),
    };

    assertEnvironmentAssetReferencesRuntimeReady(this.#plan);
  }

  get plan() {
    return this.#plan;
  }

  get roomVisuals() {
    return this.#roomVisuals;
  }

  draw() {
    drawEnvironmentBackdrop({
      scene: this.#scene,
      layers: this.#layers,
      renderMap: this.#plan.renderMap,
      worldBounds: MANOR_WORLD_BOUNDS,
    });
    this.#corridorVisuals = drawCorridors({
      scene: this.#scene,
      layers: this.#layers,
      corridors: this.#plan.corridors,
    });
    const roomVisuals = drawRoomPlates({
      scene: this.#scene,
      layers: this.#layers,
      plan: this.#plan,
      callbacks: this.#callbacks,
    });

    for (const [roomId, visual] of roomVisuals.entries()) {
      this.#roomVisuals.set(roomId, visual);
    }

    this.#thresholdVisuals = drawThresholds({
      scene: this.#scene,
      layers: this.#layers,
      thresholds: this.#plan.thresholds,
    });
  }

  refreshFocus(context: EnvironmentFocusContext) {
    for (const [roomId, visual] of this.#roomVisuals.entries()) {
      const active = context.activeRoomId === roomId;
      const focused = context.focusRoomId === roomId;
      const inspected = context.inspectedRoomId === roomId;
      const hovered = context.hoveredRoomId === roomId;
      const room = getRoomRenderData(roomId);
      const scale = inspected
        ? 1 + context.roomScaleBoost
        : focused
          ? 1 + context.roomScaleBoost * 0.72
          : active
            ? 1 + context.roomScaleBoost * 0.34
            : hovered
              ? 1.012
              : 1;
      const alpha =
        context.inspectedRoomId !== null
          ? inspected
            ? 1
            : focused
              ? Math.max(0.58, 1 - context.dimStrength * 0.52)
              : Math.max(0.24, 1 - context.dimStrength)
          : focused
            ? 1
            : active
              ? 0.95
              : hovered
                ? 0.98
                : 0.92 - context.emphasis * 0.16;

      for (const container of visual.allContainers) {
        container.setScale(scale);
        container.setAlpha(alpha);
      }

      visual.focusBeam
        .setTint(room.surfaces.focusColor)
        .setAlpha(
          inspected
            ? 0.44 + context.emphasis * 0.18
            : focused
              ? 0.22 + context.emphasis * 0.18
              : active
                ? 0.12 + context.emphasis * 0.08
                : hovered
                  ? 0.1
                  : 0,
        );
      visual.focusFrame.setStrokeStyle(
        2.4,
        room.surfaces.focusColor,
        inspected
          ? 1
          : focused
            ? 0.86 + context.emphasis * 0.1
            : active
              ? 0.56 + context.emphasis * 0.08
              : hovered
                ? 0.42
                : 0,
      );
      visual.hitTarget.setFillStyle(
        0xffffff,
        hovered && !inspected ? 0.04 : 0.001,
      );
      visual.interiorVignette.setAlpha(
        inspected
          ? 0.36 + context.emphasis * 0.12
          : focused
            ? 0.28 + context.emphasis * 0.08
            : hovered
              ? 0.22
              : 0.18,
      );
      visual.cutawayBacking.setAlpha(
        inspected
          ? 0.72 + context.emphasis * 0.08
          : focused
            ? 0.58 + context.emphasis * 0.08
            : active
              ? 0.48 + context.emphasis * 0.06
              : hovered
                ? 0.48
                : 0.38,
      );
      visual.cutawayWall.setAlpha(
        inspected ? 1 : focused ? 0.96 : active ? 0.9 : 0.84,
      );
      visual.cutawayTrim.setFillStyle(
        room.accentColor,
        inspected
          ? 0.58 + context.emphasis * 0.06
          : focused
            ? 0.46 + context.emphasis * 0.08
            : active
              ? 0.32 + context.emphasis * 0.04
              : 0.22,
      );
      visual.titlePlate.setFillStyle(
        room.surfaces.titlePlateColor,
        inspected
          ? 0.38 + context.emphasis * 0.04
          : focused
            ? 0.31 + context.emphasis * 0.05
            : 0.22,
      );
      visual.statePlate.setScale(inspected ? 1.02 : focused ? 1.01 : 1);
      visual.title.setScale(
        inspected ? 1.06 : focused ? 1.03 : active ? 1.01 : 1,
      );
      visual.theme.setScale(inspected ? 1.04 : focused ? 1.02 : 1);
    }

    refreshCorridorFocus({
      visuals: this.#corridorVisuals,
      focusedRoom: context.focusedRoom,
      inspectedRoom: context.inspectedRoom,
      inspectedRoomId: context.inspectedRoomId,
      dimStrength: context.dimStrength,
      corridorEmphasis: context.corridorEmphasis,
    });
    refreshThresholdFocus({
      visuals: this.#thresholdVisuals,
      focusRoomId: context.focusRoomId,
      hoveredRoomId: context.hoveredRoomId,
      inspectedRoomId: context.inspectedRoomId,
      doorwayEmphasis: context.doorwayEmphasis,
    });
  }

  destroy() {
    this.#roomVisuals.clear();
    this.#corridorVisuals = [];
    this.#thresholdVisuals = [];
  }
}
