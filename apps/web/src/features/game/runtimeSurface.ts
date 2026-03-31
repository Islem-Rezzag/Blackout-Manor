import type { ClientGameConnectionOptions } from "@blackout-manor/client-game";
import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";

export type GameRuntimeSurface = "live" | "dev-replay";

type BuildGameRuntimeConnectionOptions = {
  surface: GameRuntimeSurface;
  roomId: string;
  defaultMode: "mock" | "live";
  defaultServerUrl: string;
  defaultActorId: string | null;
  search: string;
  replay: SavedReplayEnvelope | null;
};

const DEMO_ROOM_IDS = new Set(["demo", "local", "mock-manor-room"]);

export const normalizeRoomId = (roomId: string) => {
  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : "demo";
};

export const resolveReplayEndpointForSurface = (
  surface: GameRuntimeSurface,
  replayEndpoint?: string | null,
) => (surface === "dev-replay" ? (replayEndpoint ?? null) : null);

export const buildGameRuntimeConnection = ({
  defaultActorId,
  defaultMode,
  defaultServerUrl,
  replay,
  roomId,
  search,
  surface,
}: BuildGameRuntimeConnectionOptions): ClientGameConnectionOptions => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const searchParams = new URLSearchParams(search);
  const actorId = searchParams.get("playerId") ?? defaultActorId ?? undefined;

  if (surface === "dev-replay" && replay) {
    return {
      mode: "replay",
      replay,
      roomId: normalizedRoomId,
      ...(actorId ? { actorId } : {}),
    };
  }

  const modeParam = searchParams.get("mode");
  const inferredMode = DEMO_ROOM_IDS.has(normalizedRoomId.toLowerCase())
    ? "mock"
    : defaultMode;
  const mode =
    modeParam === "live" || modeParam === "mock" ? modeParam : inferredMode;

  if (mode === "live") {
    return {
      mode: "live",
      roomId: normalizedRoomId,
      serverUrl: searchParams.get("serverUrl") ?? defaultServerUrl,
      ...(actorId ? { actorId } : {}),
    };
  }

  return {
    mode: "mock",
    roomId: normalizedRoomId,
    ...(actorId ? { actorId } : {}),
  };
};
