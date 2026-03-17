import type { MatchEvent, MatchSnapshot, RoomId } from "@blackout-manor/shared";

import { eventRoomId } from "../stage/signals";
import type { ClientGameState } from "../types";
import type { CameraPlan, ObservationMode, RuntimeSceneId } from "./types";

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
    observationMode: ObservationMode;
    surveillanceRoomId: RoomId | null;
  }): CameraPlan {
    const {
      meetingRoomId,
      observationMode,
      runtimeState,
      scene,
      snapshot,
      surveillanceRoomId,
    } = options;

    if (!snapshot) {
      return {
        roomId: null,
        immediate: true,
        reason: "default",
        detail: "Awaiting authoritative snapshot",
      };
    }

    if (
      observationMode === "surveillance" &&
      surveillanceRoomId &&
      (scene === "manor-world" || scene === "replay")
    ) {
      return {
        roomId: surveillanceRoomId,
        immediate: false,
        reason: "surveillance",
        detail: `Tracking ${surveillanceRoomId} through the surveillance console`,
      };
    }

    if (scene === "meeting" && meetingRoomId) {
      return {
        roomId: meetingRoomId,
        immediate: false,
        reason: "meeting",
        detail: "Meeting staging anchors the camera in the grand hall",
      };
    }

    if (scene === "endgame") {
      return {
        roomId: "grand-hall",
        immediate: false,
        reason: "endgame",
        detail: "Final reveal holds on the grand hall",
      };
    }

    if (scene === "replay" && snapshot.phaseId === "resolution") {
      return {
        roomId: "grand-hall",
        immediate: false,
        reason: "endgame",
        detail: "Replay resolution holds on the grand hall",
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
        reason: "report",
        detail: "Body reports and visible eliminations take camera priority",
      };
    }

    const sabotageRoom = findLatestEventRoom(snapshot, ["sabotage-triggered"]);
    if (sabotageRoom) {
      return {
        roomId: sabotageRoom,
        immediate: false,
        reason: "sabotage",
        detail: "Sabotage events override passive roaming focus",
      };
    }

    const interactionRoom = findLatestEventRoom(snapshot, [
      "clue-discovered",
      "task-completed",
      "task-progressed",
    ]);
    if (interactionRoom) {
      return {
        roomId: interactionRoom,
        immediate: false,
        reason: "interaction",
        detail: "Visible public interactions guide roaming observation",
      };
    }

    const latestEventRoom = findLatestEventRoom(snapshot);
    if (latestEventRoom) {
      return {
        roomId: latestEventRoom,
        immediate: false,
        reason: "interaction",
        detail: "Recent room activity keeps the camera moving",
      };
    }

    const actorRoom = runtimeState.actorId
      ? snapshot.players.find((player) => player.id === runtimeState.actorId)
          ?.roomId
      : null;

    return {
      roomId: actorRoom ?? snapshot.rooms[0]?.roomId ?? null,
      immediate: true,
      reason: actorRoom ? "actor" : "default",
      detail: actorRoom
        ? "Following the local actor across the manor"
        : "Holding a neutral manor overview",
    };
  }
}
