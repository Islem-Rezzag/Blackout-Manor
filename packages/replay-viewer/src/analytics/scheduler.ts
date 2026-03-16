import { SEASON_01_PERSONA_CARDS } from "@blackout-manor/content";
import { shuffleDeterministically } from "@blackout-manor/engine";
import type { PlayerId } from "@blackout-manor/shared";

import type {
  PersonaRotationAssignment,
  PersonaRotationScheduleEntry,
} from "./types";

const PLAYER_IDS = Array.from(
  { length: 10 },
  (_, index) => `agent-${String(index + 1).padStart(2, "0")}`,
) as PlayerId[];

const MATCH_SEED_STRIDE = 97;
const SWAP_SEED_OFFSET = 50_000;

const buildAssignments = (
  baseSeed: number,
  slotOffset: number,
): PersonaRotationAssignment[] => {
  const personaIds = shuffleDeterministically(
    SEASON_01_PERSONA_CARDS.map((persona) => persona.id),
    baseSeed,
  ).items.slice(0, PLAYER_IDS.length);
  const personaById = new Map(
    SEASON_01_PERSONA_CARDS.map((persona) => [persona.id, persona]),
  );

  return PLAYER_IDS.map((playerId, slotIndex) => {
    const personaId =
      personaIds[(slotIndex + slotOffset) % PLAYER_IDS.length] ??
      personaIds[slotIndex];

    if (!personaId) {
      throw new Error(`Missing persona assignment for slot ${slotIndex}.`);
    }

    const persona = personaById.get(personaId);

    if (!persona) {
      throw new Error(`Unknown persona ${personaId}.`);
    }

    return {
      playerId,
      displayName: persona.label,
      personaId: persona.id,
      slotIndex,
    };
  });
};

export const createPersonaRotationSchedule = (
  baseSeeds: readonly number[],
  options?: {
    rotationPairsPerSeed?: number;
    matchPrefix?: string;
  },
): PersonaRotationScheduleEntry[] => {
  const rotationPairsPerSeed = options?.rotationPairsPerSeed ?? 5;
  const matchPrefix = options?.matchPrefix ?? "fairness";
  const entries: PersonaRotationScheduleEntry[] = [];

  for (const baseSeed of baseSeeds) {
    for (
      let rotationIndex = 0;
      rotationIndex < rotationPairsPerSeed;
      rotationIndex += 1
    ) {
      const forwardOffset = rotationIndex;
      const swappedOffset = rotationIndex + rotationPairsPerSeed;

      entries.push({
        entryId: `${baseSeed}:forward:${rotationIndex}`,
        matchId: `${matchPrefix}-${baseSeed}-f${rotationIndex}`,
        baseSeed,
        matchSeed: baseSeed + rotationIndex * MATCH_SEED_STRIDE,
        rotationIndex,
        slotOffset: forwardOffset,
        variant: "forward",
        assignments: buildAssignments(baseSeed, forwardOffset),
      });
      entries.push({
        entryId: `${baseSeed}:swapped:${rotationIndex}`,
        matchId: `${matchPrefix}-${baseSeed}-s${rotationIndex}`,
        baseSeed,
        matchSeed:
          baseSeed + SWAP_SEED_OFFSET + rotationIndex * MATCH_SEED_STRIDE,
        rotationIndex,
        slotOffset: swappedOffset,
        variant: "swapped",
        assignments: buildAssignments(baseSeed, swappedOffset),
      });
    }
  }

  return entries;
};
