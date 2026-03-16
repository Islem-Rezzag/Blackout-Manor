import type { LeaderboardDelta } from "@blackout-manor/db";
import type { EngineReplayLog } from "@blackout-manor/engine";
import type { RoleId } from "@blackout-manor/shared";

const DEFAULT_SEASON_ID = "season_01";

const roleToSide = (roleId: RoleId) =>
  roleId === "shadow" ? "shadow" : "household";

export const createLeaderboardDeltasFromReplay = (
  replay: EngineReplayLog,
  seasonId = DEFAULT_SEASON_ID,
): LeaderboardDelta[] => {
  const finalFrame = replay.frames.at(-1);

  if (!finalFrame) {
    return [];
  }

  const winnerTeam = finalFrame.winner?.team ?? null;

  return finalFrame.players.map((player) => {
    const side = roleToSide(player.role);

    return {
      seasonId,
      playerId: player.id,
      displayName: player.displayName,
      roleId: player.role,
      side,
      didWin: winnerTeam !== null && winnerTeam === side,
      survived: player.status === "alive",
      wasExiled: player.status === "exiled",
      matchId: replay.matchId,
    };
  });
};
