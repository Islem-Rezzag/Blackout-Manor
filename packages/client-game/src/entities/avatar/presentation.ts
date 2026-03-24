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

export type AvatarSilhouette = "slim" | "poised" | "broad" | "compact";
export type AvatarMaskStyle = "half" | "wing" | "owl" | "spire";
export type AvatarOutfitStyle = "tailcoat" | "cloak" | "gown" | "vest";
export type AvatarAccessoryStyle =
  | "plume"
  | "brooch"
  | "monocle"
  | "chain"
  | "rose";
export type AvatarBubbleStyle = "formal" | "soft" | "thorn" | "glass";

export type AvatarAppearance = {
  key: string;
  personaId: string;
  silhouette: AvatarSilhouette;
  maskStyle: AvatarMaskStyle;
  outfitStyle: AvatarOutfitStyle;
  accessoryStyle: AvatarAccessoryStyle;
  bubbleStyle: AvatarBubbleStyle;
  bodyColor: number;
  shadowColor: number;
  outfitColor: number;
  trimColor: number;
  accessoryColor: number;
  maskColor: number;
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
  const silhouetteByBucket = {
    steady: "poised",
    volatile: "broad",
    social: "slim",
    strategist: "compact",
  } satisfies Record<
    (typeof SEASON_01_PERSONA_CARDS)[number]["balanceBucket"],
    AvatarSilhouette
  >;
  const outfitByBucket = {
    steady: "cloak",
    volatile: "tailcoat",
    social: "gown",
    strategist: "vest",
  } satisfies Record<
    (typeof SEASON_01_PERSONA_CARDS)[number]["balanceBucket"],
    AvatarOutfitStyle
  >;
  const bubbleByBucket = {
    steady: "soft",
    volatile: "thorn",
    social: "glass",
    strategist: "formal",
  } satisfies Record<
    (typeof SEASON_01_PERSONA_CARDS)[number]["balanceBucket"],
    AvatarBubbleStyle
  >;
  const maskSeed =
    (seed ^
      Math.round(persona.socialStyle.analyticalFocus * 100) ^
      Math.round(persona.socialStyle.deception * 1000)) >>>
    0;
  const bubbleStyle = bubbleByBucket[persona.balanceBucket];
  const bubbleBase = BUBBLE_STYLE_BASE[bubbleStyle];

  return {
    key: `${player.id}:${persona.id}`,
    personaId: persona.id,
    silhouette: silhouetteByBucket[persona.balanceBucket],
    maskStyle: pickVariant(["half", "wing", "owl", "spire"] as const, maskSeed),
    outfitStyle: outfitByBucket[persona.balanceBucket],
    accessoryStyle: pickVariant(
      ["plume", "brooch", "monocle", "chain", "rose"] as const,
      seed >>> 3,
    ),
    bubbleStyle,
    bodyColor: pickVariant(BODY_PALETTE, seed >>> 5),
    shadowColor: 0x05070a,
    outfitColor: pickVariant(OUTFIT_PALETTE, seed >>> 7),
    trimColor: pickVariant(TRIM_PALETTE, seed >>> 9),
    accessoryColor: pickVariant(ACCESSORY_PALETTE, seed >>> 11),
    maskColor: pickVariant(
      [0xf2e6cf, 0xdde8f4, 0xf0d1cc, 0xeadfae] as const,
      seed >>> 13,
    ),
    nameColor:
      persona.socialStyle.assertiveness >= 0.72 ? "#fff0df" : "#eef3fb",
    bubbleFill: bubbleBase.fill,
    bubbleStroke: bubbleBase.stroke,
    bubbleTextColor: bubbleBase.text,
    bubbleFontFamily: bubbleBase.fontFamily,
    movementCadence: 0.85 + persona.socialStyle.talkativeness * 0.9,
    idleAmplitude: 0.8 + persona.socialStyle.riskTolerance * 1.6,
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
