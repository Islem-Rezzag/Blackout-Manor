import type { MatchId, SpeedProfileId } from "@blackout-manor/shared";
import { matchMaker } from "@colyseus/core";
import type { MatchRoom } from "../../rooms/MatchRoom";
import type { ServerRuntime } from "./types";

type CreateBotOnlyMatchOptions = {
  matchId?: MatchId;
  seed?: number;
  speedProfileId?: SpeedProfileId;
};

const resolveRoomId = (runtime: ServerRuntime, matchId: MatchId) => {
  const roomId = runtime.matchRegistry.getRoomId(matchId);

  if (!roomId) {
    throw new Error(`No live match room is registered for ${matchId}.`);
  }

  return roomId;
};

export const createBotOnlyMatch = async (
  runtime: ServerRuntime,
  options: CreateBotOnlyMatchOptions = {},
) => {
  const seed = options.seed ?? 17;
  const speedProfileId = options.speedProfileId ?? "headless-regression";
  const room = await matchMaker.createRoom("match", {
    botOnly: true,
    autoStart: true,
    ...(options.matchId ? { matchId: options.matchId } : {}),
    seed,
    speedProfileId,
  });

  const metadata = runtime.matchRegistry
    .list()
    .find((match) => match.roomId === room.roomId);

  if (metadata) {
    await runtime.database.upsertMatchMetadata({
      matchId: metadata.matchId,
      roomId: metadata.roomId,
      roomName: metadata.roomName,
      botOnly: metadata.botOnly,
      seed,
      speedProfileId,
      status: metadata.status,
      ...(metadata.sourceLobbyRoomId
        ? { sourceLobbyRoomId: metadata.sourceLobbyRoomId }
        : {}),
    });
  }

  return {
    roomId: room.roomId,
    roomName: room.name,
    matchId: metadata?.matchId ?? null,
  };
};

export const pauseMatchSimulation = async (
  runtime: ServerRuntime,
  matchId: MatchId,
) => {
  const roomId = resolveRoomId(runtime, matchId);
  return matchMaker.remoteRoomCall<MatchRoom>(roomId, "pauseSimulation");
};

export const resumeMatchSimulation = async (
  runtime: ServerRuntime,
  matchId: MatchId,
) => {
  const roomId = resolveRoomId(runtime, matchId);
  return matchMaker.remoteRoomCall<MatchRoom>(roomId, "resumeSimulation");
};

export const fastForwardMatchSimulation = async (
  runtime: ServerRuntime,
  matchId: MatchId,
  steps: number,
) => {
  const roomId = resolveRoomId(runtime, matchId);
  return matchMaker.remoteRoomCall<MatchRoom>(roomId, "fastForwardSimulation", [
    steps,
  ]);
};

export const terminateMatchSimulation = async (
  runtime: ServerRuntime,
  matchId: MatchId,
) => {
  const roomId = resolveRoomId(runtime, matchId);
  return matchMaker.remoteRoomCall<MatchRoom>(roomId, "terminateSimulation");
};
