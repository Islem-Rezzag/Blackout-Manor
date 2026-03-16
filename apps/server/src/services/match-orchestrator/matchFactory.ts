import { SEASON_01_PERSONA_CARDS } from "@blackout-manor/content";
import {
  getDefaultMatchConfig,
  shuffleDeterministically,
} from "@blackout-manor/engine";
import {
  DEFAULT_TIMINGS,
  type MatchConfig,
  type MatchId,
  type PlayerId,
  type SpeedProfileId,
} from "@blackout-manor/shared";

import type { ManagedMatchPlayer, MatchRoomCreateOptions } from "./types";

const MODEL_PACK_BY_SPEED: Record<SpeedProfileId, string> = {
  showcase: "official/gpt-5.4-season-1",
  "fast-sim": "official/gpt-5-mini-season-1",
  "headless-regression": "official/gpt-5-mini-season-1",
};

const makeManagedPlayerId = (prefix: string, index: number): PlayerId =>
  `${prefix}-${String(index).padStart(2, "0")}`;

const dedupePlayers = (players: ManagedMatchPlayer[]) => {
  const seen = new Set<string>();

  return players.filter((player) => {
    if (seen.has(player.id)) {
      return false;
    }

    seen.add(player.id);
    return true;
  });
};

const createBotPlayers = (
  seed: number,
  existingIds: Set<string>,
  count: number,
): ManagedMatchPlayer[] => {
  const shuffled = shuffleDeterministically(
    SEASON_01_PERSONA_CARDS,
    seed,
  ).items;
  const players: ManagedMatchPlayer[] = [];
  let index = 1;

  for (const persona of shuffled) {
    if (players.length >= count) {
      break;
    }

    const playerId = makeManagedPlayerId("agent", index);
    index += 1;

    if (existingIds.has(playerId)) {
      continue;
    }

    existingIds.add(playerId);
    players.push({
      id: playerId,
      displayName: persona.label,
      isBot: true,
    });
  }

  return players;
};

const createHumanPlaceholders = (
  existingIds: Set<string>,
  count: number,
): ManagedMatchPlayer[] => {
  const players: ManagedMatchPlayer[] = [];
  let index = 1;

  while (players.length < count) {
    const playerId = makeManagedPlayerId("player", index);
    index += 1;

    if (existingIds.has(playerId)) {
      continue;
    }

    existingIds.add(playerId);
    players.push({
      id: playerId,
      displayName: `Guest ${String(players.length + 1).padStart(2, "0")}`,
      isBot: false,
    });
  }

  return players;
};

export const createManagedMatchPlayers = (
  options: Pick<MatchRoomCreateOptions, "botOnly" | "players" | "seed">,
) => {
  const seed = options.seed ?? 17;
  const stagedPlayers = dedupePlayers(options.players ?? []);

  if (stagedPlayers.length > 10) {
    throw new Error(
      "Blackout Manor match creation supports at most 10 players.",
    );
  }

  const existingIds = new Set(stagedPlayers.map((player) => player.id));
  const remainingSlots = 10 - stagedPlayers.length;

  if (remainingSlots <= 0) {
    return stagedPlayers;
  }

  if (options.botOnly || stagedPlayers.length > 0) {
    return [
      ...stagedPlayers,
      ...createBotPlayers(seed, existingIds, remainingSlots),
    ];
  }

  return [
    ...stagedPlayers,
    ...createHumanPlaceholders(existingIds, remainingSlots),
  ];
};

export const createManagedMatchId = (seed: number, providedMatchId?: MatchId) =>
  providedMatchId ?? (`match-${seed}-${Date.now()}` as MatchId);

export const createManagedMatchConfig = (
  matchId: MatchId,
  seed: number,
  speedProfileId: SpeedProfileId,
): MatchConfig => {
  const baseConfig = getDefaultMatchConfig(matchId, seed);

  return {
    ...baseConfig,
    speedProfileId,
    modelPackId: MODEL_PACK_BY_SPEED[speedProfileId],
    timings: {
      ...DEFAULT_TIMINGS[speedProfileId],
    },
  };
};
