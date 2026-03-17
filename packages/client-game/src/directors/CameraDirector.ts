import type { MatchEvent, MatchSnapshot, RoomId } from "@blackout-manor/shared";

import type { ClientGameState } from "../types";
import type { CameraPlan, RuntimeSceneId } from "./types";

const eventRoomId = (event: MatchEvent): RoomId | null => {
  switch (event.eventId) {
    case "task-progressed":
    case "task-completed":
    case "player-eliminated":
    case "body-reported":
    case "clue-discovered":
      return event.roomId;
    case "sabotage-triggered":
      return event.roomId ?? null;
    default:
      return null;
  }
};

const findLatestEventRoom = (
  snapshot: MatchSnapshot,
  preferredEventIds?: readonly MatchEvent["eventId"][],
) => {
  const preferred = preferredEventIds ? new Set(preferredEventIds) : null;

  for (const event of [...snapshot.recentEvents].reverse()) {
    if (preferred && !preferred.has(event.eventId)) {
      continue;
    }

    const roomId = eventRoomId(event);
    if (roomId) {
      return roomId;
    }
  }

  return null;
};

export class CameraDirector {
  resolvePlan(options: {
    scene: RuntimeSceneId;
    runtimeState: ClientGameState;
    snapshot: MatchSnapshot | null;
    meetingRoomId: RoomId | null;
  }): CameraPlan {
    const { meetingRoomId, runtimeState, scene, snapshot } = options;

    if (!snapshot) {
      return {
        roomId: null,
        immediate: true,
      };
    }

    if (scene === "meeting" && meetingRoomId) {
      return {
        roomId: meetingRoomId,
        immediate: false,
      };
    }

    if (scene === "endgame") {
      return {
        roomId: "grand-hall",
        immediate: false,
      };
    }

    if (scene === "replay" && snapshot.phaseId === "resolution") {
      return {
        roomId: "grand-hall",
        immediate: false,
      };
    }

    if (snapshot.phaseId === "report") {
      return {
        roomId:
          findLatestEventRoom(snapshot, [
            "body-reported",
            "player-eliminated",
          ]) ??
          meetingRoomId ??
          "cellar",
        immediate: false,
      };
    }

    const latestEventRoom = findLatestEventRoom(snapshot);
    if (latestEventRoom) {
      return {
        roomId: latestEventRoom,
        immediate: false,
      };
    }

    const actorRoom = runtimeState.actorId
      ? snapshot.players.find((player) => player.id === runtimeState.actorId)
          ?.roomId
      : null;

    return {
      roomId: actorRoom ?? snapshot.rooms[0]?.roomId ?? null,
      immediate: true,
    };
  }
}
