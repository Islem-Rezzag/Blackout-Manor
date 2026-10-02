import type { RoomId, TaskId } from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import type {
  ManorBackdropRect,
  ManorCorridorSegment,
  ManorDoorNode,
  ManorRenderMap,
  ManorRenderRoom,
} from "../../tiled/manorLayout";
import type {
  ImportedHeroPropPlacement,
  ImportedRoomArt,
} from "../importedArt";

export type EnvironmentStageLayers = {
  backdrop: Phaser.GameObjects.Container;
  floor: Phaser.GameObjects.Container;
  props: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.Container;
  walls: Phaser.GameObjects.Container;
  interaction: Phaser.GameObjects.Container;
  focus: Phaser.GameObjects.Container;
};

export type EnvironmentRoomLayerContainers = {
  floor: Phaser.GameObjects.Container;
  props: Phaser.GameObjects.Container;
  lights: Phaser.GameObjects.Container;
  walls: Phaser.GameObjects.Container;
  interaction: Phaser.GameObjects.Container;
  focus: Phaser.GameObjects.Container;
};

export type EnvironmentRoomVisual = {
  roomId: RoomId;
  containers: EnvironmentRoomLayerContainers;
  allContainers: Phaser.GameObjects.Container[];
  shellShadow: Phaser.GameObjects.Image;
  shell: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  floorSpecular: Phaser.GameObjects.Image;
  accent: Phaser.GameObjects.Image;
  dust: Phaser.GameObjects.Image;
  interiorVignette: Phaser.GameObjects.Image;
  ambientGlow: Phaser.GameObjects.Image;
  blackoutShade: Phaser.GameObjects.Rectangle;
  emergencyWash: Phaser.GameObjects.Image;
  decorShadows: Phaser.GameObjects.Image[];
  decorObjects: Phaser.GameObjects.Shape[];
  decorHighlights: Phaser.GameObjects.Image[];
  heroPropShadows: Phaser.GameObjects.Image[];
  heroProps: Phaser.GameObjects.Image[];
  lightGlows: Phaser.GameObjects.Image[];
  windowOverlays: Phaser.GameObjects.Image[];
  cutawayShadow: Phaser.GameObjects.Image;
  cutawayBacking: Phaser.GameObjects.Image;
  cutawayWall: Phaser.GameObjects.Image;
  cutawayTrim: Phaser.GameObjects.Rectangle;
  titlePlate: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  theme: Phaser.GameObjects.Text;
  statePlate: Phaser.GameObjects.Rectangle;
  state: Phaser.GameObjects.Text;
  clueMarker: Phaser.GameObjects.Image;
  sabotagePulse: Phaser.GameObjects.Image;
  sabotageBanner: Phaser.GameObjects.Image;
  sabotageLabel: Phaser.GameObjects.Text;
  focusBeam: Phaser.GameObjects.Image;
  focusFrame: Phaser.GameObjects.Rectangle;
  taskChips: Phaser.GameObjects.Text[];
  hitTarget: Phaser.GameObjects.Rectangle;
};

export type EnvironmentCorridorVisual = {
  segment: ManorCorridorSegment;
  shellShadow: Phaser.GameObjects.Image;
  shell: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  specular: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  trim: Phaser.GameObjects.Rectangle;
};

export type EnvironmentDoorNodeVisual = {
  node: ManorDoorNode;
  threshold: Phaser.GameObjects.Rectangle;
  thresholdArt: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Image;
  marker: Phaser.GameObjects.Rectangle;
};

export type EnvironmentThresholdArt = {
  key: string;
  angle: number;
  tint: number;
};

export type EnvironmentRoomRenderPlan = {
  roomId: RoomId;
  room: ManorRenderRoom;
  art: ImportedRoomArt;
  taskIds: readonly TaskId[];
};

export type EnvironmentCorridorRenderPlan = {
  segment: ManorCorridorSegment;
  floorKey: string;
};

export type EnvironmentThresholdRenderPlan = {
  node: ManorDoorNode;
  art: EnvironmentThresholdArt;
};

export type EnvironmentRenderPlan = {
  renderMap: ManorRenderMap;
  backdropRects: readonly ManorBackdropRect[];
  rooms: readonly EnvironmentRoomRenderPlan[];
  corridors: readonly EnvironmentCorridorRenderPlan[];
  thresholds: readonly EnvironmentThresholdRenderPlan[];
};

export type EnvironmentAssetUsage =
  | "backdrop"
  | "room-shell"
  | "room-floor"
  | "room-wall"
  | "room-prop"
  | "room-lighting"
  | "room-weather"
  | "room-state"
  | "room-focus"
  | "corridor"
  | "threshold";

export type EnvironmentAssetReference = {
  key: string;
  usage: EnvironmentAssetUsage;
  roomId?: RoomId;
  corridorId?: number;
  doorNodeId?: number;
  prop?: ImportedHeroPropPlacement;
};
