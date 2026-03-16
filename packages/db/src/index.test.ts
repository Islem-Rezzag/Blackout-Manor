import { afterEach, describe, expect, it } from "vitest";

import { BlackoutManorDatabase } from "./BlackoutManorDatabase";
import type { LeaderboardDelta } from "./types";

describe("BlackoutManorDatabase", () => {
  let database: BlackoutManorDatabase | null = null;

  afterEach(async () => {
    if (database) {
      await database.close();
      database = null;
    }
  });

  it("looks up replay records by replay id and match id", async () => {
    database = await new BlackoutManorDatabase({
      provider: "sqlite",
      connectionString: ":memory:",
    }).initialize();

    await database.saveReplayRecord({
      replayId: "replay-17",
      matchId: "match-17",
      seed: 17,
      winnerTeam: "household",
      highlightCount: 4,
      finalTick: 91,
      totalEvents: 72,
      payloadJson: JSON.stringify({ replayId: "replay-17" }),
    });

    const byReplayId = await database.getReplayRecordById("replay-17");
    const byMatchId = await database.getReplayRecordByMatchId("match-17");
    const listed = await database.listReplayMetadata();

    expect(byReplayId?.payloadJson).toContain("replay-17");
    expect(byMatchId?.replayId).toBe("replay-17");
    expect(listed).toHaveLength(1);
    expect(listed[0]?.highlightCount).toBe(4);
  });

  it("aggregates leaderboard lookups by season", async () => {
    database = await new BlackoutManorDatabase({
      provider: "sqlite",
      connectionString: ":memory:",
    }).initialize();

    const deltas: LeaderboardDelta[] = [
      {
        seasonId: "season_01",
        playerId: "p1",
        displayName: "Agent Ada",
        roleId: "investigator",
        side: "household",
        didWin: true,
        survived: true,
        wasExiled: false,
        matchId: "match-a",
      },
      {
        seasonId: "season_01",
        playerId: "p1",
        displayName: "Agent Ada",
        roleId: "household",
        side: "household",
        didWin: false,
        survived: false,
        wasExiled: true,
        matchId: "match-b",
      },
      {
        seasonId: "season_01",
        playerId: "p2",
        displayName: "Agent Bram",
        roleId: "shadow",
        side: "shadow",
        didWin: true,
        survived: true,
        wasExiled: false,
        matchId: "match-c",
      },
    ];

    await database.applyLeaderboardDeltas(deltas);

    const leaderboard = await database.listLeaderboard("season_01");

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]?.playerId).toBe("p1");
    expect(leaderboard[0]?.matchesPlayed).toBe(2);
    expect(leaderboard[0]?.wins).toBe(1);
    expect(leaderboard[0]?.exileCount).toBe(1);
    expect(leaderboard[1]?.shadowWins).toBe(1);
  });
});
