import { SEASON_01_BALANCE_CONSTANTS } from "../../balance/season-01";
import type { SeasonContentDefinition } from "../../types";
import {
  SEASON_01_DIALOGUE_TONE_TAGS,
  SEASON_01_EMOTIONAL_STANCE_TAGS,
} from "./dialogue";
import { MANOR_V1_MAP } from "./map";
import { SEASON_01_PERSONA_CARDS } from "./personas";
import { SEASON_01_ROLES } from "./roles";
import { SEASON_01_SABOTAGE_TYPES } from "./sabotage";
import {
  SEASON_01_COOPERATIVE_TASKS,
  SEASON_01_STANDARD_TASKS,
  SEASON_01_TASKS,
} from "./tasks";

export const SEASON_01_CONTENT = {
  id: "season_01",
  label: "Season 01: Blackout Masquerade",
  map: MANOR_V1_MAP,
  tasks: {
    standard: SEASON_01_STANDARD_TASKS,
    cooperative: SEASON_01_COOPERATIVE_TASKS,
  },
  sabotageTypes: SEASON_01_SABOTAGE_TYPES,
  roles: SEASON_01_ROLES,
  personas: SEASON_01_PERSONA_CARDS,
  dialogue: {
    toneTags: SEASON_01_DIALOGUE_TONE_TAGS,
    emotionalStanceTags: SEASON_01_EMOTIONAL_STANCE_TAGS,
  },
} as const satisfies SeasonContentDefinition;

export const SEASON_01_CONTENT_PACK = {
  season: SEASON_01_CONTENT,
  map: MANOR_V1_MAP,
  rooms: MANOR_V1_MAP.rooms,
  tasks: SEASON_01_TASKS,
  sabotageTypes: SEASON_01_SABOTAGE_TYPES,
  roles: SEASON_01_ROLES,
  personas: SEASON_01_PERSONA_CARDS,
  dialogueToneTags: SEASON_01_DIALOGUE_TONE_TAGS,
  emotionalStanceTags: SEASON_01_EMOTIONAL_STANCE_TAGS,
  balance: SEASON_01_BALANCE_CONSTANTS,
} as const;
