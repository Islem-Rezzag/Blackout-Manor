import type {
  RoleId,
  RoomDefinition,
  RoomId,
  TaskDefinition,
  TeamId,
} from "@blackout-manor/shared";

export type MapMetadata = {
  id: string;
  seasonId: string;
  label: string;
  version: string;
  summary: string;
  spawnRoomId: RoomId;
  emergencyMeetingRoomId: RoomId;
  minimapBounds: {
    width: number;
    height: number;
  };
  weatherProfile: {
    exteriorMood: string;
    interiorMood: string;
    stormIntensity: number;
  };
  rooms: readonly RoomDefinition[];
};

export type SabotageTargetKind = "global" | "room" | "task" | "social";

export type SabotageTypeDefinition = {
  id: string;
  actionId: string;
  label: string;
  summary: string;
  targetKind: SabotageTargetKind;
  durationSeconds: number;
  cooldownSeconds: number;
  visibility: "stealth" | "suspicious" | "public";
  evidenceTags: readonly string[];
};

export type RoleContentDefinition = {
  id: RoleId;
  team: TeamId;
  label: string;
  summary: string;
  publicBrief: string;
  secretBrief: string;
  activeActionIds: readonly string[];
  passiveTraits: readonly string[];
  winConditionText: string;
};

export type PersonaSocialStyle = {
  talkativeness: number;
  assertiveness: number;
  empathy: number;
  deception: number;
  riskTolerance: number;
  analyticalFocus: number;
};

export type PersonaCardDefinition = {
  id: string;
  label: string;
  archetype: string;
  summary: string;
  socialStyle: PersonaSocialStyle;
  preferredTones: readonly string[];
  emotionalDefaults: readonly string[];
  pressureBehavior: string;
  allianceBehavior: string;
  suspicionBehavior: string;
  balanceBucket: "steady" | "volatile" | "social" | "strategist";
};

export type DialogueToneTag = {
  id: string;
  label: string;
  summary: string;
  sentenceGuidance: readonly string[];
};

export type EmotionalStanceTag = {
  id: string;
  label: string;
  summary: string;
  defaultEmotionLabel: string;
  witnessEffect: string;
};

export type SeasonContentDefinition = {
  id: string;
  label: string;
  map: MapMetadata;
  tasks: {
    standard: readonly TaskDefinition[];
    cooperative: readonly TaskDefinition[];
  };
  sabotageTypes: readonly SabotageTypeDefinition[];
  roles: readonly RoleContentDefinition[];
  personas: readonly PersonaCardDefinition[];
  dialogue: {
    toneTags: readonly DialogueToneTag[];
    emotionalStanceTags: readonly EmotionalStanceTag[];
  };
};

export type TiledPropertyType = "string" | "int" | "float" | "bool" | "color";

export type TiledPropertyValue = string | number | boolean;

export type TiledProperty = {
  name: string;
  type: TiledPropertyType;
  value: TiledPropertyValue;
};

export type TiledPoint = {
  x: number;
  y: number;
};

export type TiledObject = {
  id: number;
  name: string;
  class?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  point?: boolean;
  ellipse?: boolean;
  polygon?: readonly TiledPoint[];
  properties?: readonly TiledProperty[];
};

export type TiledObjectLayer = {
  id: number;
  name: string;
  type: "objectgroup";
  visible: boolean;
  opacity: number;
  objects: readonly TiledObject[];
};

export type TiledMapJson = {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: readonly TiledObjectLayer[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: "orthogonal";
  renderorder: "right-down";
  tiledversion: string;
  tileheight: number;
  tilesets: readonly unknown[];
  tilewidth: number;
  type: "map";
  version: string;
  width: number;
};
