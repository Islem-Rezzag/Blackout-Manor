export const MATCH_STATUS_IDS = [
  "staging",
  "running",
  "paused",
  "completed",
  "terminated",
] as const;

export type MatchStatus = (typeof MATCH_STATUS_IDS)[number];

export const WINNER_TEAM_IDS = ["household", "shadow"] as const;

export type WinnerTeam = (typeof WINNER_TEAM_IDS)[number] | null;

export type DatabaseProvider = "sqlite" | "postgresql";

export type DatabaseConfig = {
  provider: DatabaseProvider;
  connectionString: string;
};

export type MatchMetadataInput = {
  matchId: string;
  roomId: string;
  roomName: string;
  botOnly: boolean;
  seed: number;
  speedProfileId: string;
  status: MatchStatus;
  sourceLobbyRoomId?: string;
  replayId?: string;
  winnerTeam?: WinnerTeam;
  startedAt?: string;
  endedAt?: string;
};

export type MatchMetadataPatch = Partial<
  Omit<
    MatchMetadataInput,
    "matchId" | "roomId" | "roomName" | "botOnly" | "seed" | "speedProfileId"
  >
>;

export type MatchMetadataRecord = {
  matchId: string;
  roomId: string;
  roomName: string;
  botOnly: boolean;
  seed: number;
  speedProfileId: string;
  status: MatchStatus;
  sourceLobbyRoomId: string | null;
  replayId: string | null;
  winnerTeam: WinnerTeam;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReplayMetadataInput = {
  replayId: string;
  matchId: string;
  seed: number;
  winnerTeam: WinnerTeam;
  highlightCount: number;
  finalTick: number;
  totalEvents: number;
  payloadJson: string;
};

export type ReplayMetadataRecord = {
  replayId: string;
  matchId: string;
  seed: number;
  winnerTeam: WinnerTeam;
  highlightCount: number;
  finalTick: number;
  totalEvents: number;
  createdAt: string;
};

export type ReplayRecord = ReplayMetadataRecord & {
  payloadJson: string;
};

export type LeaderboardDelta = {
  playerId: string;
  displayName: string;
  seasonId: string;
  roleId: string;
  side: "household" | "shadow";
  didWin: boolean;
  survived: boolean;
  wasExiled: boolean;
  matchId: string;
};

export type LeaderboardEntryRecord = {
  seasonId: string;
  playerId: string;
  displayName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  survivalCount: number;
  exileCount: number;
  householdMatches: number;
  shadowMatches: number;
  householdWins: number;
  shadowWins: number;
  lastMatchId: string | null;
  updatedAt: string;
};

export type MetricsSnapshot = {
  totalMatches: number;
  activeMatches: number;
  completedMatches: number;
  terminatedMatches: number;
  replayCount: number;
  leaderboardEntries: number;
};
