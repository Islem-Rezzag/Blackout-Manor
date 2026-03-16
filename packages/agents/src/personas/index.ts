import {
  type PersonaCardDefinition,
  SEASON_01_PERSONA_CARDS,
} from "@blackout-manor/content";
import { shuffleDeterministically } from "@blackout-manor/engine";
import type { PlayerId } from "@blackout-manor/shared";

const hashString = (value: string) =>
  [...value].reduce(
    (total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619),
    2166136261,
  ) >>> 0;

const rosterSeed = (seed: number, playerIds: readonly PlayerId[]) =>
  (seed ^ hashString([...playerIds].sort().join("|"))) >>> 0;

export type AssignedPersona = {
  playerId: PlayerId;
  slot: number;
  persona: PersonaCardDefinition;
};

export const assignPersonaCards = (
  seed: number,
  playerIds: readonly PlayerId[],
): Record<PlayerId, AssignedPersona> => {
  const sortedPlayerIds = [...playerIds].sort();
  const shuffled = shuffleDeterministically(
    SEASON_01_PERSONA_CARDS.map((persona) => persona.id),
    rosterSeed(seed, sortedPlayerIds),
  );
  const personaById = new Map(
    SEASON_01_PERSONA_CARDS.map((persona) => [persona.id, persona]),
  );

  return Object.fromEntries(
    sortedPlayerIds.map((playerId, slot) => {
      const personaId =
        shuffled.items[slot % shuffled.items.length] ??
        SEASON_01_PERSONA_CARDS[slot % SEASON_01_PERSONA_CARDS.length]?.id;

      if (!personaId) {
        throw new Error(`Missing persona id for slot ${slot}.`);
      }

      const persona = personaById.get(personaId);

      if (!persona) {
        throw new Error(`Missing persona assignment for ${playerId}.`);
      }

      return [
        playerId,
        {
          playerId,
          slot,
          persona,
        } satisfies AssignedPersona,
      ];
    }),
  ) as Record<PlayerId, AssignedPersona>;
};

export const getAssignedPersona = (
  seed: number,
  playerIds: readonly PlayerId[],
  playerId: PlayerId,
) => {
  const assignments = assignPersonaCards(seed, playerIds);
  const assignment = assignments[playerId];

  if (!assignment) {
    throw new Error(`No persona was assigned to ${playerId}.`);
  }

  return assignment;
};
