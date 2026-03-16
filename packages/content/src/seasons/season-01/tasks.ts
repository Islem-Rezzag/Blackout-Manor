import type { TaskDefinition } from "@blackout-manor/shared";

export const SEASON_01_STANDARD_TASKS = [
  {
    id: "reset-breaker-lattice",
    label: "Reset breaker lattice",
    roomId: "generator-room",
    kind: "solo",
    evidenceTags: ["power", "repair", "generator"],
  },
  {
    id: "file-guest-ledger",
    label: "File guest ledger",
    roomId: "study",
    kind: "solo",
    evidenceTags: ["records", "paperwork", "study"],
  },
  {
    id: "rewind-corridor-film",
    label: "Rewind corridor film",
    roomId: "surveillance-hall",
    kind: "solo",
    evidenceTags: ["surveillance", "film", "timing"],
  },
  {
    id: "rebalance-greenhouse-valves",
    label: "Rebalance greenhouse valves",
    roomId: "greenhouse",
    kind: "solo",
    evidenceTags: ["valves", "water", "greenhouse"],
  },
  {
    id: "sort-masque-inventory",
    label: "Sort masque inventory",
    roomId: "ballroom",
    kind: "solo",
    evidenceTags: ["inventory", "costumes", "ballroom"],
  },
  {
    id: "prepare-silver-tea-service",
    label: "Prepare silver tea service",
    roomId: "kitchen",
    kind: "solo",
    evidenceTags: ["kitchen", "service", "silver"],
  },
  {
    id: "tune-police-band-radio",
    label: "Tune police-band radio",
    roomId: "library",
    kind: "solo",
    evidenceTags: ["radio", "library", "signal"],
  },
  {
    id: "wind-grandfather-clock",
    label: "Wind grandfather clock",
    roomId: "grand-hall",
    kind: "solo",
    evidenceTags: ["clock", "timing", "grand-hall"],
  },
  {
    id: "restore-boiler-pressure",
    label: "Restore boiler pressure",
    roomId: "cellar",
    kind: "solo",
    evidenceTags: ["boiler", "pressure", "cellar"],
  },
] as const satisfies readonly TaskDefinition[];

export const SEASON_01_COOPERATIVE_TASKS = [
  {
    id: "carry-coal-to-the-boiler",
    label: "Carry coal to the boiler",
    roomId: "cellar",
    kind: "two-person",
    evidenceTags: ["coal", "cooperation", "boiler"],
  },
  {
    id: "move-portrait-crate-into-storage",
    label: "Move portrait crate into storage",
    roomId: "servants-corridor",
    kind: "two-person",
    evidenceTags: ["crate", "storage", "cooperation"],
  },
  {
    id: "synchronize-organ-pipes",
    label: "Synchronize organ pipes",
    roomId: "ballroom",
    kind: "two-person",
    evidenceTags: ["music", "precision", "cooperation"],
  },
  {
    id: "balance-hot-water-pressure",
    label: "Balance hot-water pressure",
    roomId: "kitchen",
    kind: "two-person",
    evidenceTags: ["pipes", "pressure", "cooperation"],
  },
] as const satisfies readonly TaskDefinition[];

export const SEASON_01_TASKS = [
  ...SEASON_01_STANDARD_TASKS,
  ...SEASON_01_COOPERATIVE_TASKS,
] as const;
