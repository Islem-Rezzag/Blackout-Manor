import type { RoomDefinition } from "@blackout-manor/shared";

import type { MapMetadata } from "../../types";

export const MANOR_V1_ROOMS = [
  {
    id: "grand-hall",
    label: "Grand Hall",
    neighboringRoomIds: ["library", "study", "ballroom", "kitchen"],
    taskIds: ["wind-grandfather-clock"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "library",
    label: "Library",
    neighboringRoomIds: ["grand-hall", "study", "surveillance-hall"],
    taskIds: ["tune-police-band-radio"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "study",
    label: "Study",
    neighboringRoomIds: ["grand-hall", "library", "greenhouse"],
    taskIds: ["file-guest-ledger"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "kitchen",
    label: "Kitchen",
    neighboringRoomIds: [
      "grand-hall",
      "ballroom",
      "cellar",
      "servants-corridor",
    ],
    taskIds: ["prepare-silver-tea-service", "balance-hot-water-pressure"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "ballroom",
    label: "Ballroom",
    neighboringRoomIds: ["grand-hall", "kitchen", "greenhouse"],
    taskIds: ["sort-masque-inventory", "synchronize-organ-pipes"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "greenhouse",
    label: "Greenhouse",
    neighboringRoomIds: ["ballroom", "study", "generator-room"],
    taskIds: ["rebalance-greenhouse-valves"],
    hasCameras: false,
    supportsSealing: true,
  },
  {
    id: "generator-room",
    label: "Generator Room",
    neighboringRoomIds: ["greenhouse", "surveillance-hall", "cellar"],
    taskIds: ["reset-breaker-lattice"],
    hasCameras: false,
    supportsSealing: false,
  },
  {
    id: "surveillance-hall",
    label: "Surveillance Hall",
    neighboringRoomIds: ["library", "generator-room"],
    taskIds: ["rewind-corridor-film"],
    hasCameras: true,
    supportsSealing: true,
  },
  {
    id: "cellar",
    label: "Cellar",
    neighboringRoomIds: ["kitchen", "generator-room", "servants-corridor"],
    taskIds: ["restore-boiler-pressure", "carry-coal-to-the-boiler"],
    hasCameras: false,
    supportsSealing: false,
  },
  {
    id: "servants-corridor",
    label: "Servants' Corridor",
    neighboringRoomIds: ["kitchen", "cellar"],
    taskIds: ["move-portrait-crate-into-storage"],
    hasCameras: false,
    supportsSealing: false,
  },
] as const satisfies readonly RoomDefinition[];

export const MANOR_V1_MAP = {
  id: "manor_v1",
  seasonId: "season_01",
  label: "Blackout Manor",
  version: "1.0.0",
  summary:
    "A compact storm-lashed manor tuned for social deduction, fast pathing, and believable alibis.",
  spawnRoomId: "grand-hall",
  emergencyMeetingRoomId: "grand-hall",
  minimapBounds: {
    width: 1600,
    height: 1100,
  },
  weatherProfile: {
    exteriorMood: "storm-blue rain and lightning",
    interiorMood: "warm gaslight with long shadows",
    stormIntensity: 0.86,
  },
  rooms: MANOR_V1_ROOMS,
} as const satisfies MapMetadata;
