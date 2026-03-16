import { ROOM_IDS, TASK_IDS } from "./ids";

export const PROTOCOL_VERSION = "1.0.0";

export const OFFICIAL_V1_CAST = {
  shadow: 2,
  investigator: 1,
  steward: 1,
  household: 6,
} as const;

export const DEFAULT_PHASE_SEQUENCE = [
  "intro",
  "roam",
  "report",
  "meeting",
  "vote",
  "reveal",
  "resolution",
] as const;

export const DEFAULT_TIMINGS = {
  showcase: {
    castIntroSeconds: 5,
    roamRoundCount: { min: 4, max: 6 },
    roamRoundSeconds: 90,
    discussionSeconds: 70,
    voteSeconds: 15,
    hardCapSeconds: 28 * 60,
  },
  "fast-sim": {
    castIntroSeconds: 3,
    roamRoundCount: { min: 3, max: 5 },
    roamRoundSeconds: 45,
    discussionSeconds: 35,
    voteSeconds: 10,
    hardCapSeconds: 12 * 60,
  },
  "headless-regression": {
    castIntroSeconds: 0,
    roamRoundCount: { min: 2, max: 4 },
    roamRoundSeconds: 15,
    discussionSeconds: 10,
    voteSeconds: 5,
    hardCapSeconds: 180,
  },
} as const;

export const DEFAULT_TASK_ROOM_IDS = {
  "reset-breaker-lattice": "generator-room",
  "file-guest-ledger": "study",
  "rewind-corridor-film": "surveillance-hall",
  "rebalance-greenhouse-valves": "greenhouse",
  "sort-masque-inventory": "ballroom",
  "prepare-silver-tea-service": "kitchen",
  "tune-police-band-radio": "library",
  "wind-grandfather-clock": "grand-hall",
  "restore-boiler-pressure": "cellar",
  "carry-coal-to-the-boiler": "cellar",
  "move-portrait-crate-into-storage": "servants-corridor",
  "synchronize-organ-pipes": "ballroom",
  "balance-hot-water-pressure": "kitchen",
} as const;

export const DEFAULT_TASK_KIND_BY_ID = {
  "reset-breaker-lattice": "solo",
  "file-guest-ledger": "solo",
  "rewind-corridor-film": "solo",
  "rebalance-greenhouse-valves": "solo",
  "sort-masque-inventory": "solo",
  "prepare-silver-tea-service": "solo",
  "tune-police-band-radio": "solo",
  "wind-grandfather-clock": "solo",
  "restore-boiler-pressure": "solo",
  "carry-coal-to-the-boiler": "two-person",
  "move-portrait-crate-into-storage": "two-person",
  "synchronize-organ-pipes": "two-person",
  "balance-hot-water-pressure": "two-person",
} as const;

export const DEFAULT_ROOM_LABELS = {
  "grand-hall": "Grand Hall",
  library: "Library",
  study: "Study",
  kitchen: "Kitchen",
  ballroom: "Ballroom",
  greenhouse: "Greenhouse",
  "generator-room": "Generator Room",
  "surveillance-hall": "Surveillance Hall",
  cellar: "Cellar",
  "servants-corridor": "Servants' Corridor",
} as const;

export const DEFAULT_TASK_IDS = [...TASK_IDS];

export const DEFAULT_ROOM_IDS = [...ROOM_IDS];
