import { SEASON_01_PERSONA_CARDS } from "@blackout-manor/content";
import type {
  BodyLanguageId,
  MatchEvent,
  PhaseId,
  PlayerId,
  PublicPlayerState,
  TaskId,
} from "@blackout-manor/shared";

export type AvatarFacing =
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west";

export type AvatarGesture =
  | "idle"
  | "move"
  | "accuse"
  | "recoil"
  | "comfort"
  | "reassure";
export type VisiblePostureId =
  | "calm"
  | "alert"
  | "suspicious"
  | "shaken"
  | "confident"
  | "defiant";
export type AvatarActionIconId =
  | "report"
  | "sabotage"
  | "clue"
  | "vote-pressure"
  | "reassure"
  | "accusation"
  | "protection";

export type AvatarSilhouette =
  | "lithe"
  | "regal"
  | "broad"
  | "compact"
  | "draped"
  | "structured";
export type AvatarBodyType = "short" | "medium" | "tall";
export type AvatarMaskStyle =
  | "domino"
  | "half"
  | "wing"
  | "owl"
  | "spire"
  | "petal"
  | "crescent";
export type AvatarOutfitStyle =
  | "tailcoat"
  | "cloakcoat"
  | "ballgown"
  | "column-gown"
  | "waistcoat"
  | "shawl-drape";
export type AvatarAccessoryStyle =
  | "plume"
  | "brooch"
  | "monocle"
  | "chain"
  | "rose"
  | "fan"
  | "cane"
  | "keyring";
export type AvatarHairStyle =
  | "cropped"
  | "swept"
  | "bun"
  | "braid"
  | "waved"
  | "coiffed";
export type AvatarBubbleStyle = "formal" | "soft" | "thorn" | "glass";
export type AvatarPortraitFrameStyle =
  | "arch"
  | "velvet"
  | "brass"
  | "laurel"
  | "thorn"
  | "gallery";
export type AvatarHeaddressStyle =
  | "none"
  | "tiara"
  | "feather-halo"
  | "veil"
  | "crownlet"
  | "laurel";
export type AvatarMaskDetailStyle =
  | "filigree"
  | "jeweled"
  | "split"
  | "lace"
  | "etched"
  | "winged";
export type AvatarStanceBias =
  | "grounded"
  | "guarded"
  | "gliding"
  | "commanding"
  | "measured"
  | "buoyant";

export type AvatarAppearance = {
  key: string;
  personaId: string;
  silhouette: AvatarSilhouette;
  bodyType: AvatarBodyType;
  maskStyle: AvatarMaskStyle;
  outfitStyle: AvatarOutfitStyle;
  accessoryStyle: AvatarAccessoryStyle;
  hairStyle: AvatarHairStyle;
  bubbleStyle: AvatarBubbleStyle;
  portraitFrameStyle: AvatarPortraitFrameStyle;
  headdressStyle: AvatarHeaddressStyle;
  maskDetailStyle: AvatarMaskDetailStyle;
  stanceBias: AvatarStanceBias;
  bodyColor: number;
  shadowColor: number;
  outfitColor: number;
  secondaryColor: number;
  liningColor: number;
  trimColor: number;
  accessoryColor: number;
  maskColor: number;
  maskAccentColor: number;
  portraitGlowColor: number;
  nameColor: string;
  bubbleFill: number;
  bubbleStroke: number;
  bubbleTextColor: string;
  bubbleFontFamily: string;
  movementCadence: number;
  idleAmplitude: number;
  assertiveness: number;
  empathy: number;
  analyticalFocus: number;
};

type PersonaIdentityKit = Pick<
  AvatarAppearance,
  | "silhouette"
  | "bodyType"
  | "maskStyle"
  | "outfitStyle"
  | "accessoryStyle"
  | "hairStyle"
  | "bubbleStyle"
  | "portraitFrameStyle"
  | "stanceBias"
  | "bodyColor"
  | "outfitColor"
  | "trimColor"
  | "accessoryColor"
  | "maskColor"
>;

type PersonaAdornmentKit = Pick<
  AvatarAppearance,
  "headdressStyle" | "maskDetailStyle"
>;

export type AvatarInteractionCue = {
  eventId: string | null;
  gesture: AvatarGesture;
  speechText: string | null;
  targetPlayerId: PlayerId | null;
  emphasis: number;
  actionIcon: AvatarActionIconId | null;
  taskId?: TaskId | null;
  badgeText?: string | null;
  lookAt?: { x: number; y: number } | null;
};

const BODY_PALETTE = [
  0xf1d3bd, 0xe3ba9e, 0xd39e82, 0xc88866, 0x8d6449, 0x6d4b38,
] as const;
const OUTFIT_PALETTE = [
  0x7c2331, 0x234967, 0x355936, 0x593f25, 0x4d2e60, 0x2c2f45,
] as const;
const TRIM_PALETTE = [
  0xdcb873, 0xa6d3d8, 0xc5d0e0, 0xe6b8b6, 0xd8d4b0,
] as const;
const ACCESSORY_PALETTE = [
  0xf0cf8a, 0xb9d7f2, 0xe49f8b, 0xc6b0e8, 0x98d0be,
] as const;
const BUBBLE_STYLE_BASE = {
  formal: {
    fill: 0xf6efe4,
    stroke: 0x304556,
    text: "#18212b",
    fontFamily: "Georgia, Times, serif",
  },
  soft: {
    fill: 0xf3efe8,
    stroke: 0x5d6f5a,
    text: "#21301f",
    fontFamily: "Palatino Linotype, Georgia, serif",
  },
  thorn: {
    fill: 0x24161e,
    stroke: 0xe0a67f,
    text: "#fff2ea",
    fontFamily: "Segoe UI, sans-serif",
  },
  glass: {
    fill: 0xddeaf2,
    stroke: 0x4f667f,
    text: "#122134",
    fontFamily: "Trebuchet MS, Verdana, sans-serif",
  },
} as const;

const PERSONA_IDENTITY_KITS = {
  "clockwork-advocate": {
    silhouette: "structured",
    bodyType: "medium",
    maskStyle: "domino",
    outfitStyle: "waistcoat",
    accessoryStyle: "monocle",
    hairStyle: "cropped",
    bubbleStyle: "formal",
    portraitFrameStyle: "brass",
    stanceBias: "measured",
    bodyColor: 0xd7b49a,
    outfitColor: 0x2f3646,
    trimColor: 0xd0ad68,
    accessoryColor: 0xe5c879,
    maskColor: 0xf3e5cf,
  },
  "velvet-host": {
    silhouette: "regal",
    bodyType: "tall",
    maskStyle: "wing",
    outfitStyle: "ballgown",
    accessoryStyle: "rose",
    hairStyle: "bun",
    bubbleStyle: "soft",
    portraitFrameStyle: "velvet",
    stanceBias: "gliding",
    bodyColor: 0xe2bea7,
    outfitColor: 0x6c1f2e,
    trimColor: 0xe2b980,
    accessoryColor: 0xf0d594,
    maskColor: 0xf7e8d6,
  },
  "iron-witness": {
    silhouette: "broad",
    bodyType: "tall",
    maskStyle: "owl",
    outfitStyle: "cloakcoat",
    accessoryStyle: "chain",
    hairStyle: "cropped",
    bubbleStyle: "formal",
    portraitFrameStyle: "gallery",
    stanceBias: "grounded",
    bodyColor: 0x8f6b53,
    outfitColor: 0x37424f,
    trimColor: 0xb7c8d6,
    accessoryColor: 0x9ab0ba,
    maskColor: 0xdfe8ee,
  },
  "spark-journalist": {
    silhouette: "lithe",
    bodyType: "medium",
    maskStyle: "petal",
    outfitStyle: "shawl-drape",
    accessoryStyle: "plume",
    hairStyle: "waved",
    bubbleStyle: "glass",
    portraitFrameStyle: "arch",
    stanceBias: "buoyant",
    bodyColor: 0xc99775,
    outfitColor: 0x49506b,
    trimColor: 0xe3a461,
    accessoryColor: 0xf1bd7a,
    maskColor: 0xf0d9c9,
  },
  "hearth-keeper": {
    silhouette: "draped",
    bodyType: "medium",
    maskStyle: "crescent",
    outfitStyle: "shawl-drape",
    accessoryStyle: "brooch",
    hairStyle: "bun",
    bubbleStyle: "soft",
    portraitFrameStyle: "laurel",
    stanceBias: "grounded",
    bodyColor: 0xb98a68,
    outfitColor: 0x46503c,
    trimColor: 0xc6b07c,
    accessoryColor: 0xe7c98e,
    maskColor: 0xf2e4d4,
  },
  "marble-skeptic": {
    silhouette: "compact",
    bodyType: "medium",
    maskStyle: "spire",
    outfitStyle: "waistcoat",
    accessoryStyle: "monocle",
    hairStyle: "swept",
    bubbleStyle: "formal",
    portraitFrameStyle: "brass",
    stanceBias: "guarded",
    bodyColor: 0xd7ad90,
    outfitColor: 0x3f3d46,
    trimColor: 0xbfc7d5,
    accessoryColor: 0xdfe6f3,
    maskColor: 0xe8e7df,
  },
  "lantern-peacemaker": {
    silhouette: "regal",
    bodyType: "medium",
    maskStyle: "wing",
    outfitStyle: "cloakcoat",
    accessoryStyle: "fan",
    hairStyle: "braid",
    bubbleStyle: "soft",
    portraitFrameStyle: "laurel",
    stanceBias: "gliding",
    bodyColor: 0xc89a7e,
    outfitColor: 0x27525d,
    trimColor: 0xbbd2ac,
    accessoryColor: 0xe4d596,
    maskColor: 0xedeee0,
  },
  "glass-fox": {
    silhouette: "structured",
    bodyType: "tall",
    maskStyle: "half",
    outfitStyle: "tailcoat",
    accessoryStyle: "cane",
    hairStyle: "swept",
    bubbleStyle: "thorn",
    portraitFrameStyle: "thorn",
    stanceBias: "guarded",
    bodyColor: 0xd2a080,
    outfitColor: 0x45224d,
    trimColor: 0xd78ea7,
    accessoryColor: 0xbfc3f1,
    maskColor: 0xf0d8de,
  },
  "storm-orator": {
    silhouette: "broad",
    bodyType: "tall",
    maskStyle: "spire",
    outfitStyle: "tailcoat",
    accessoryStyle: "plume",
    hairStyle: "coiffed",
    bubbleStyle: "thorn",
    portraitFrameStyle: "thorn",
    stanceBias: "commanding",
    bodyColor: 0xb97c5a,
    outfitColor: 0x6f1e1f,
    trimColor: 0xf0a15c,
    accessoryColor: 0xf1c76d,
    maskColor: 0xf0d7c8,
  },
  "quiet-ledger": {
    silhouette: "compact",
    bodyType: "short",
    maskStyle: "domino",
    outfitStyle: "waistcoat",
    accessoryStyle: "keyring",
    hairStyle: "cropped",
    bubbleStyle: "formal",
    portraitFrameStyle: "gallery",
    stanceBias: "measured",
    bodyColor: 0x9a6d53,
    outfitColor: 0x384653,
    trimColor: 0xa8bfd6,
    accessoryColor: 0xe0d39c,
    maskColor: 0xece2d2,
  },
  "parlor-comedian": {
    silhouette: "lithe",
    bodyType: "medium",
    maskStyle: "petal",
    outfitStyle: "tailcoat",
    accessoryStyle: "fan",
    hairStyle: "waved",
    bubbleStyle: "glass",
    portraitFrameStyle: "velvet",
    stanceBias: "buoyant",
    bodyColor: 0xe0b99f,
    outfitColor: 0x3d3557,
    trimColor: 0xf0be8d,
    accessoryColor: 0xefb6ba,
    maskColor: 0xf7e5d6,
  },
  "oak-sentinel": {
    silhouette: "broad",
    bodyType: "tall",
    maskStyle: "owl",
    outfitStyle: "cloakcoat",
    accessoryStyle: "cane",
    hairStyle: "cropped",
    bubbleStyle: "formal",
    portraitFrameStyle: "gallery",
    stanceBias: "grounded",
    bodyColor: 0xa57957,
    outfitColor: 0x334237,
    trimColor: 0xc5a66f,
    accessoryColor: 0xc9c59d,
    maskColor: 0xe7dfcf,
  },
  "mirror-diplomat": {
    silhouette: "regal",
    bodyType: "tall",
    maskStyle: "half",
    outfitStyle: "column-gown",
    accessoryStyle: "chain",
    hairStyle: "coiffed",
    bubbleStyle: "glass",
    portraitFrameStyle: "arch",
    stanceBias: "gliding",
    bodyColor: 0xd7a888,
    outfitColor: 0x295068,
    trimColor: 0xd6b4e9,
    accessoryColor: 0xc6e0ef,
    maskColor: 0xf1e1d6,
  },
  "cinder-gambler": {
    silhouette: "structured",
    bodyType: "medium",
    maskStyle: "crescent",
    outfitStyle: "tailcoat",
    accessoryStyle: "keyring",
    hairStyle: "swept",
    bubbleStyle: "thorn",
    portraitFrameStyle: "brass",
    stanceBias: "commanding",
    bodyColor: 0xbb845f,
    outfitColor: 0x4a342a,
    trimColor: 0xe58a49,
    accessoryColor: 0xf2c18d,
    maskColor: 0xedddd2,
  },
  "velour-romantic": {
    silhouette: "draped",
    bodyType: "medium",
    maskStyle: "wing",
    outfitStyle: "ballgown",
    accessoryStyle: "rose",
    hairStyle: "bun",
    bubbleStyle: "soft",
    portraitFrameStyle: "velvet",
    stanceBias: "gliding",
    bodyColor: 0xe4bcaa,
    outfitColor: 0x5c2a46,
    trimColor: 0xe0adc1,
    accessoryColor: 0xf0d7a7,
    maskColor: 0xf5e8dc,
  },
  "needle-cross-examiner": {
    silhouette: "structured",
    bodyType: "medium",
    maskStyle: "domino",
    outfitStyle: "waistcoat",
    accessoryStyle: "chain",
    hairStyle: "cropped",
    bubbleStyle: "formal",
    portraitFrameStyle: "brass",
    stanceBias: "guarded",
    bodyColor: 0xc28b69,
    outfitColor: 0x25394a,
    trimColor: 0xcfd7dd,
    accessoryColor: 0xbfd0dd,
    maskColor: 0xe7dfd0,
  },
} as const satisfies Record<
  (typeof SEASON_01_PERSONA_CARDS)[number]["id"],
  PersonaIdentityKit
>;

const PERSONA_ADORNMENT_KITS = {
  "clockwork-advocate": {
    headdressStyle: "crownlet",
    maskDetailStyle: "etched",
  },
  "velvet-host": {
    headdressStyle: "tiara",
    maskDetailStyle: "jeweled",
  },
  "iron-witness": {
    headdressStyle: "none",
    maskDetailStyle: "winged",
  },
  "spark-journalist": {
    headdressStyle: "feather-halo",
    maskDetailStyle: "filigree",
  },
  "hearth-keeper": {
    headdressStyle: "veil",
    maskDetailStyle: "lace",
  },
  "marble-skeptic": {
    headdressStyle: "none",
    maskDetailStyle: "split",
  },
  "lantern-peacemaker": {
    headdressStyle: "laurel",
    maskDetailStyle: "filigree",
  },
  "glass-fox": {
    headdressStyle: "crownlet",
    maskDetailStyle: "split",
  },
  "storm-orator": {
    headdressStyle: "feather-halo",
    maskDetailStyle: "winged",
  },
  "quiet-ledger": {
    headdressStyle: "none",
    maskDetailStyle: "etched",
  },
  "parlor-comedian": {
    headdressStyle: "feather-halo",
    maskDetailStyle: "jeweled",
  },
  "oak-sentinel": {
    headdressStyle: "laurel",
    maskDetailStyle: "etched",
  },
  "mirror-diplomat": {
    headdressStyle: "tiara",
    maskDetailStyle: "split",
  },
  "cinder-gambler": {
    headdressStyle: "crownlet",
    maskDetailStyle: "jeweled",
  },
  "velour-romantic": {
    headdressStyle: "veil",
    maskDetailStyle: "filigree",
  },
  "needle-cross-examiner": {
    headdressStyle: "none",
    maskDetailStyle: "etched",
  },
} as const satisfies Record<
  (typeof SEASON_01_PERSONA_CARDS)[number]["id"],
  PersonaAdornmentKit
>;

const STANCE_MOTION = {
  grounded: { cadence: 0.88, idle: 0.84 },
  guarded: { cadence: 0.82, idle: 0.72 },
  gliding: { cadence: 0.96, idle: 0.92 },
  commanding: { cadence: 1.08, idle: 0.94 },
  measured: { cadence: 0.78, idle: 0.7 },
  buoyant: { cadence: 1.12, idle: 1.04 },
} as const satisfies Record<
  AvatarStanceBias,
  { cadence: number; idle: number }
>;

const COMFORT_WORDS = [
  "breathe",
  "breath",
  "calm",
  "steady",
  "safe",
  "sorry",
  "alright",
  "okay",
  "with me",
] as const;
const REASSURE_WORDS = [
  "compare",
  "timeline",
  "facts",
  "hold",
  "wait",
  "slow",
  "not panic",
  "not enough",
  "careful",
] as const;

const hashString = (value: string) => {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
};

const splitColor = (color: number) => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

const blendColor = (fromColor: number, toColor: number, amount: number) => {
  const from = splitColor(fromColor);
  const to = splitColor(toColor);
  const t = Math.max(0, Math.min(1, amount));

  return (
    (Math.round(from.r + (to.r - from.r) * t) << 16) |
    (Math.round(from.g + (to.g - from.g) * t) << 8) |
    Math.round(from.b + (to.b - from.b) * t)
  );
};

const pickVariant = <TValue>(values: readonly TValue[], seed: number) => {
  const index = ((seed % values.length) + values.length) % values.length;
  const value = values[index];

  if (value === undefined) {
    throw new Error("Avatar variant selection resolved to an undefined value.");
  }

  return value;
};

const normalizeText = (value: string) => value.toLowerCase();

const findPersonaCard = (
  player: Pick<PublicPlayerState, "id" | "displayName">,
) => {
  const byName = SEASON_01_PERSONA_CARDS.find(
    (candidate) =>
      normalizeText(candidate.label) === normalizeText(player.displayName),
  );

  if (byName) {
    return byName;
  }

  return pickVariant(
    SEASON_01_PERSONA_CARDS,
    hashString(`${player.id}:${player.displayName}`),
  );
};

const createFallbackIdentityKit = (
  persona: (typeof SEASON_01_PERSONA_CARDS)[number],
  seed: number,
): PersonaIdentityKit => ({
  silhouette: pickVariant(
    ["lithe", "regal", "broad", "compact", "draped", "structured"] as const,
    seed,
  ),
  bodyType: pickVariant(["short", "medium", "tall"] as const, seed >>> 1),
  maskStyle: pickVariant(
    ["domino", "half", "wing", "owl", "spire", "petal", "crescent"] as const,
    seed >>> 2,
  ),
  outfitStyle: pickVariant(
    [
      "tailcoat",
      "cloakcoat",
      "ballgown",
      "column-gown",
      "waistcoat",
      "shawl-drape",
    ] as const,
    seed >>> 3,
  ),
  accessoryStyle: pickVariant(
    [
      "plume",
      "brooch",
      "monocle",
      "chain",
      "rose",
      "fan",
      "cane",
      "keyring",
    ] as const,
    seed >>> 4,
  ),
  hairStyle: pickVariant(
    ["cropped", "swept", "bun", "braid", "waved", "coiffed"] as const,
    seed >>> 5,
  ),
  bubbleStyle: pickVariant(
    ["formal", "soft", "thorn", "glass"] as const,
    seed ^ hashString(persona.balanceBucket),
  ),
  portraitFrameStyle: pickVariant(
    ["arch", "velvet", "brass", "laurel", "thorn", "gallery"] as const,
    seed >>> 6,
  ),
  stanceBias: pickVariant(
    [
      "grounded",
      "guarded",
      "gliding",
      "commanding",
      "measured",
      "buoyant",
    ] as const,
    seed >>> 7,
  ),
  bodyColor: pickVariant(BODY_PALETTE, seed >>> 8),
  outfitColor: pickVariant(OUTFIT_PALETTE, seed >>> 9),
  trimColor: pickVariant(TRIM_PALETTE, seed >>> 10),
  accessoryColor: pickVariant(ACCESSORY_PALETTE, seed >>> 11),
  maskColor: pickVariant(
    [0xf2e6cf, 0xdde8f4, 0xf0d1cc, 0xeadfae] as const,
    seed >>> 12,
  ),
});

const createFallbackAdornmentKit = (seed: number): PersonaAdornmentKit => ({
  headdressStyle: pickVariant(
    ["none", "tiara", "feather-halo", "veil", "crownlet", "laurel"] as const,
    seed,
  ),
  maskDetailStyle: pickVariant(
    ["filigree", "jeweled", "split", "lace", "etched", "winged"] as const,
    seed >>> 1,
  ),
});

export const resolveAvatarPose = (
  player: Pick<PublicPlayerState, "bodyLanguage" | "emotion">,
): BodyLanguageId => {
  if (player.bodyLanguage === "confident") {
    return "confident";
  }

  if (
    player.bodyLanguage === "calm" &&
    player.emotion.dominance >= 0.45 &&
    player.emotion.pleasure >= 0.18 &&
    player.emotion.intensity <= 0.82
  ) {
    return "confident";
  }

  return player.bodyLanguage;
};

export const resolveVisiblePosture = (
  player: Pick<
    PublicPlayerState,
    "status" | "bodyLanguage" | "emotion" | "publicImage"
  >,
  cue?: Pick<AvatarInteractionCue, "gesture" | "actionIcon" | "emphasis">,
): VisiblePostureId => {
  if (player.status !== "alive") {
    return "shaken";
  }

  if (player.bodyLanguage === "defiant") {
    return "defiant";
  }

  if (
    player.bodyLanguage === "shaken" ||
    cue?.gesture === "recoil" ||
    player.emotion.label === "afraid" ||
    player.emotion.label === "shaken" ||
    player.emotion.label === "guilty" ||
    (player.emotion.intensity >= 0.76 && player.emotion.pleasure <= -0.15)
  ) {
    return "shaken";
  }

  if (
    cue?.actionIcon === "accusation" ||
    cue?.actionIcon === "vote-pressure" ||
    cue?.gesture === "accuse" ||
    player.emotion.label === "suspicious" ||
    player.publicImage.suspiciousness >= 0.62
  ) {
    return "suspicious";
  }

  if (
    player.bodyLanguage === "confident" ||
    player.emotion.label === "confident" ||
    (player.emotion.dominance >= 0.48 &&
      player.publicImage.credibility >= 0.54 &&
      player.emotion.intensity <= 0.84)
  ) {
    return "confident";
  }

  if (
    player.bodyLanguage === "agitated" ||
    cue?.actionIcon === "report" ||
    cue?.actionIcon === "sabotage" ||
    cue?.actionIcon === "clue" ||
    cue?.actionIcon === "reassure" ||
    cue?.actionIcon === "protection" ||
    player.emotion.arousal >= 0.44 ||
    (cue?.gesture === "move" && (cue.emphasis ?? 0) >= 0.45)
  ) {
    return "alert";
  }

  return "calm";
};

export const visiblePostureLabel = (posture: VisiblePostureId) => {
  switch (posture) {
    case "alert":
      return "Alert";
    case "suspicious":
      return "Suspicious";
    case "shaken":
      return "Shaken";
    case "confident":
      return "Confident";
    case "defiant":
      return "Defiant";
    default:
      return "Calm";
  }
};

export const actionIconLabel = (actionIcon: AvatarActionIconId) => {
  switch (actionIcon) {
    case "report":
      return "REPORT";
    case "sabotage":
      return "SABOTAGE";
    case "clue":
      return "CLUE";
    case "vote-pressure":
      return "VOTE";
    case "reassure":
      return "REASSURE";
    case "accusation":
      return "ACCUSE";
    case "protection":
      return "PROTECT";
    default:
      return "";
  }
};

export const resolveAvatarAppearance = (
  player: Pick<PublicPlayerState, "id" | "displayName">,
): AvatarAppearance => {
  const persona = findPersonaCard(player);
  const seed = hashString(`${player.id}:${persona.id}:${player.displayName}`);
  const identityKit =
    PERSONA_IDENTITY_KITS[persona.id] ??
    createFallbackIdentityKit(persona, seed >>> 1);
  const adornmentKit =
    PERSONA_ADORNMENT_KITS[persona.id] ??
    createFallbackAdornmentKit(seed >>> 13);
  const bubbleStyle = identityKit.bubbleStyle;
  const bubbleBase = BUBBLE_STYLE_BASE[bubbleStyle];
  const stanceMotion = STANCE_MOTION[identityKit.stanceBias];
  const secondaryColor = blendColor(
    identityKit.outfitColor,
    identityKit.trimColor,
    0.34,
  );
  const liningColor = blendColor(
    identityKit.outfitColor,
    identityKit.accessoryColor,
    0.48,
  );
  const maskAccentColor = blendColor(
    identityKit.maskColor,
    identityKit.accessoryColor,
    0.56,
  );
  const portraitGlowColor = blendColor(
    identityKit.trimColor,
    identityKit.accessoryColor,
    0.42,
  );

  return {
    key: `${player.id}:${persona.id}`,
    personaId: persona.id,
    silhouette: identityKit.silhouette,
    bodyType: identityKit.bodyType,
    maskStyle: identityKit.maskStyle,
    outfitStyle: identityKit.outfitStyle,
    accessoryStyle: identityKit.accessoryStyle,
    hairStyle: identityKit.hairStyle,
    bubbleStyle,
    portraitFrameStyle: identityKit.portraitFrameStyle,
    headdressStyle: adornmentKit.headdressStyle,
    maskDetailStyle: adornmentKit.maskDetailStyle,
    stanceBias: identityKit.stanceBias,
    bodyColor: identityKit.bodyColor,
    shadowColor: 0x05070a,
    outfitColor: identityKit.outfitColor,
    secondaryColor,
    liningColor,
    trimColor: identityKit.trimColor,
    accessoryColor: identityKit.accessoryColor,
    maskColor: identityKit.maskColor,
    maskAccentColor,
    portraitGlowColor,
    nameColor:
      persona.socialStyle.assertiveness >= 0.72 ? "#fff0df" : "#eef3fb",
    bubbleFill: bubbleBase.fill,
    bubbleStroke: bubbleBase.stroke,
    bubbleTextColor: bubbleBase.text,
    bubbleFontFamily: bubbleBase.fontFamily,
    movementCadence:
      stanceMotion.cadence + persona.socialStyle.talkativeness * 0.58,
    idleAmplitude: stanceMotion.idle + persona.socialStyle.riskTolerance * 0.86,
    assertiveness: persona.socialStyle.assertiveness,
    empathy: persona.socialStyle.empathy,
    analyticalFocus: persona.socialStyle.analyticalFocus,
  };
};

const includesAny = (value: string, patterns: readonly string[]) =>
  patterns.some((pattern) => value.includes(pattern));

const classifyDiscussionGesture = (
  text: string,
  targetPlayerId: PlayerId | undefined,
  pose: BodyLanguageId,
): AvatarGesture => {
  const normalized = normalizeText(text);

  if (includesAny(normalized, COMFORT_WORDS)) {
    return "comfort";
  }

  if (targetPlayerId) {
    return "accuse";
  }

  if (includesAny(normalized, REASSURE_WORDS)) {
    return "reassure";
  }

  if (pose === "shaken") {
    return "recoil";
  }

  return pose === "confident" ? "reassure" : "idle";
};

const actionIconFromGesture = (
  gesture: AvatarGesture,
): AvatarActionIconId | null => {
  switch (gesture) {
    case "comfort":
      return "protection";
    case "reassure":
      return "reassure";
    case "accuse":
      return "accusation";
    default:
      return null;
  }
};

const createDefaultCue = (phaseId: PhaseId): AvatarInteractionCue => ({
  eventId: null,
  gesture: phaseId === "roam" ? "move" : "idle",
  speechText: null,
  targetPlayerId: null,
  emphasis: 0,
  actionIcon: null,
});

export const buildAvatarCueMap = (
  players: readonly PublicPlayerState[],
  recentEvents: readonly MatchEvent[],
  phaseId: PhaseId,
) => {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const cues = new Map<PlayerId, AvatarInteractionCue>();

  for (const player of players) {
    cues.set(player.id, createDefaultCue(phaseId));
  }

  for (const event of [...recentEvents].reverse()) {
    switch (event.eventId) {
      case "discussion-turn": {
        if (cues.get(event.playerId)?.eventId) {
          break;
        }

        const pose = resolveAvatarPose(
          playerMap.get(event.playerId) ?? {
            bodyLanguage: "calm",
            emotion: {
              pleasure: 0,
              arousal: 0,
              dominance: 0,
              label: "calm",
              intensity: 0,
              updatedAtTick: event.tick,
            },
          },
        );
        const gesture = classifyDiscussionGesture(
          event.text,
          event.targetPlayerId,
          pose,
        );
        cues.set(event.playerId, {
          eventId: event.id,
          gesture,
          speechText: event.text,
          targetPlayerId: event.targetPlayerId ?? null,
          emphasis: event.targetPlayerId ? 0.9 : 0.6,
          actionIcon: actionIconFromGesture(gesture),
        });

        if (event.targetPlayerId && !cues.get(event.targetPlayerId)?.eventId) {
          cues.set(event.targetPlayerId, {
            eventId: `${event.id}:target`,
            gesture: "recoil",
            speechText: null,
            targetPlayerId: event.playerId,
            emphasis: 0.62,
            actionIcon: "accusation",
          });
        }
        break;
      }
      case "vote-cast": {
        if (cues.get(event.playerId)?.eventId) {
          break;
        }

        cues.set(event.playerId, {
          eventId: event.id,
          gesture: "accuse",
          speechText: null,
          targetPlayerId: event.targetPlayerId,
          emphasis: event.targetPlayerId ? 0.82 : 0.55,
          actionIcon: "vote-pressure",
        });

        if (event.targetPlayerId && !cues.get(event.targetPlayerId)?.eventId) {
          cues.set(event.targetPlayerId, {
            eventId: `${event.id}:target`,
            gesture: "recoil",
            speechText: null,
            targetPlayerId: event.playerId,
            emphasis: 0.78,
            actionIcon: "vote-pressure",
          });
        }
        break;
      }
      case "body-reported": {
        if (!cues.get(event.playerId)?.eventId) {
          cues.set(event.playerId, {
            eventId: event.id,
            gesture: "recoil",
            speechText: "Body found.",
            targetPlayerId: event.targetPlayerId,
            emphasis: 1,
            actionIcon: "report",
          });
        }
        break;
      }
      case "sabotage-triggered": {
        if (cues.get(event.playerId)?.eventId) {
          break;
        }

        cues.set(event.playerId, {
          eventId: event.id,
          gesture: phaseId === "roam" ? "move" : "idle",
          speechText: null,
          targetPlayerId: null,
          emphasis: 0.86,
          actionIcon: "sabotage",
        });
        break;
      }
      case "clue-discovered": {
        if (cues.get(event.playerId)?.eventId) {
          break;
        }

        cues.set(event.playerId, {
          eventId: event.id,
          gesture: phaseId === "roam" ? "move" : "idle",
          speechText: null,
          targetPlayerId: null,
          emphasis: 0.64,
          actionIcon: "clue",
        });
        break;
      }
      case "player-eliminated":
      case "player-exiled": {
        const targetPlayerId =
          event.eventId === "player-eliminated"
            ? event.targetPlayerId
            : event.playerId;
        if (!cues.get(targetPlayerId)?.eventId) {
          cues.set(targetPlayerId, {
            eventId: event.id,
            gesture: "recoil",
            speechText: null,
            targetPlayerId: null,
            emphasis: 1,
            actionIcon: "report",
          });
        }
        break;
      }
      case "emotion-shifted": {
        if (cues.get(event.playerId)?.eventId) {
          break;
        }

        if (
          event.emotion.label === "afraid" ||
          event.emotion.label === "guilty" ||
          event.emotion.intensity >= 0.82
        ) {
          cues.set(event.playerId, {
            eventId: event.id,
            gesture: "recoil",
            speechText: null,
            targetPlayerId: null,
            emphasis: event.emotion.intensity,
            actionIcon: null,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return cues;
};

export const directionFromVector = (
  deltaX: number,
  deltaY: number,
  fallback: AvatarFacing = "south",
): AvatarFacing => {
  if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) {
    return fallback;
  }

  const angle = Math.atan2(deltaY, deltaX);

  if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
    return "east";
  }

  if (angle >= Math.PI / 8 && angle < (3 * Math.PI) / 8) {
    return "south-east";
  }

  if (angle >= (3 * Math.PI) / 8 && angle < (5 * Math.PI) / 8) {
    return "south";
  }

  if (angle >= (5 * Math.PI) / 8 && angle < (7 * Math.PI) / 8) {
    return "south-west";
  }

  if (angle >= (7 * Math.PI) / 8 || angle < (-7 * Math.PI) / 8) {
    return "west";
  }

  if (angle >= (-7 * Math.PI) / 8 && angle < (-5 * Math.PI) / 8) {
    return "north-west";
  }

  if (angle >= (-5 * Math.PI) / 8 && angle < (-3 * Math.PI) / 8) {
    return "north";
  }

  return "north-east";
};
