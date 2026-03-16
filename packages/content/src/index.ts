import { SEASON_01_CONTENT } from "./seasons/season-01";
import { MANOR_V1_MAP } from "./seasons/season-01/map";
import { SEASON_01_PERSONA_CARDS } from "./seasons/season-01/personas";

export { SEASON_01_BALANCE_CONSTANTS } from "./balance/season-01";
export { MANOR_V1_TILED_MAP_JSON } from "./maps";
export {
  SEASON_01_CONTENT,
  SEASON_01_CONTENT_PACK,
} from "./seasons/season-01";
export {
  SEASON_01_DIALOGUE_TONE_TAGS,
  SEASON_01_EMOTIONAL_STANCE_TAGS,
} from "./seasons/season-01/dialogue";
export {
  MANOR_V1_MAP,
  MANOR_V1_ROOMS,
} from "./seasons/season-01/map";
export { SEASON_01_PERSONA_CARDS } from "./seasons/season-01/personas";
export { SEASON_01_ROLES } from "./seasons/season-01/roles";
export { SEASON_01_SABOTAGE_TYPES } from "./seasons/season-01/sabotage";
export {
  SEASON_01_COOPERATIVE_TASKS,
  SEASON_01_STANDARD_TASKS,
  SEASON_01_TASKS,
} from "./seasons/season-01/tasks";
export type * from "./types";

export const contentPackageManifest = {
  name: "@blackout-manor/content",
  status: "ready",
  defaultSeasonId: SEASON_01_CONTENT.id,
  mapId: MANOR_V1_MAP.id,
  personaCount: SEASON_01_PERSONA_CARDS.length,
} as const;
