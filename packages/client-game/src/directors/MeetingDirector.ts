import type {
  MatchEvent,
  MatchSnapshot,
  PlayerId,
} from "@blackout-manor/shared";

import type { MeetingPresentation } from "./types";

const MEETING_ROOM_ID = "grand-hall" as const;
const MEETING_PHASES = new Set<MatchSnapshot["phaseId"]>([
  "meeting",
  "vote",
  "reveal",
]);

const findLatestMeetingEvent = (snapshot: MatchSnapshot) =>
  [...snapshot.recentEvents]
    .reverse()
    .find((event) =>
      [
        "body-reported",
        "meeting-called",
        "discussion-turn",
        "vote-cast",
        "player-exiled",
      ].includes(event.eventId),
    );

const findMeetingTriggerEvent = (snapshot: MatchSnapshot) =>
  [...snapshot.recentEvents]
    .reverse()
    .find((event) =>
      ["body-reported", "meeting-called"].includes(event.eventId),
    );

const eventRoomId = (event: MatchEvent | undefined) => {
  if (!event) {
    return null;
  }

  if ("roomId" in event) {
    return event.roomId ?? null;
  }

  return null;
};

const describeMeetingHeader = (
  snapshot: MatchSnapshot,
  _event: MatchEvent | undefined,
) => {
  switch (snapshot.phaseId) {
    case "meeting":
      return "The cast gathers beneath the chandelier";
    case "vote":
      return "Votes are being cast in the hall";
    case "reveal":
      return "The manor answers with an exile";
    default:
      return "The manor holds its breath";
  }
};

const describeMeetingDetail = (
  snapshot: MatchSnapshot,
  speakerId: PlayerId | null,
  targetPlayerId: PlayerId | null,
) => {
  const speaker =
    speakerId !== null
      ? snapshot.players.find((player) => player.id === speakerId)?.displayName
      : null;
  const target =
    targetPlayerId !== null
      ? snapshot.players.find((player) => player.id === targetPlayerId)
          ?.displayName
      : null;

  if (snapshot.phaseId === "vote" && target) {
    return `${speaker ?? "The table"} turns the room toward ${target}.`;
  }

  if (snapshot.phaseId === "reveal" && target) {
    return `${target} is forced into the light while the survivors hold position.`;
  }

  if (speaker && target) {
    return `${speaker} pushes the story toward ${target} as the room closes ranks.`;
  }

  return "Surviving guests leave their routes and converge on the public floor.";
};

const reorderPlayersForReveal = (
  players: MatchSnapshot["players"],
  targetPlayerId: PlayerId | null,
) => {
  if (!targetPlayerId) {
    return players;
  }

  return [...players].sort((left, right) => {
    if (left.id === targetPlayerId) {
      return 1;
    }

    if (right.id === targetPlayerId) {
      return -1;
    }

    return 0;
  });
};

const cloneSnapshot = (snapshot: MatchSnapshot) => ({
  ...snapshot,
  players: snapshot.players.map((player) => ({ ...player })),
  rooms: snapshot.rooms.map((room) => ({
    ...room,
    occupantIds: [...room.occupantIds],
  })),
  tasks: snapshot.tasks.map((task) => ({
    ...task,
    assignedPlayerIds: [...task.assignedPlayerIds],
  })),
  recentEvents: [...snapshot.recentEvents],
});

export class MeetingDirector {
  #lastNonMeetingSnapshot: MatchSnapshot | null = null;
  #activeOriginSnapshot: MatchSnapshot | null = null;
  #activeSequenceId: string | null = null;

  track(snapshot: MatchSnapshot) {
    if (!MEETING_PHASES.has(snapshot.phaseId)) {
      this.#lastNonMeetingSnapshot = cloneSnapshot(snapshot);
    }
  }

  derive(snapshot: MatchSnapshot): MeetingPresentation {
    const latestEvent = findLatestMeetingEvent(snapshot);
    const triggerEvent = findMeetingTriggerEvent(snapshot) ?? latestEvent;
    const sequenceId = `${triggerEvent?.id ?? snapshot.matchId}:${triggerEvent?.tick ?? snapshot.tick}`;

    if (this.#activeSequenceId !== sequenceId) {
      this.#activeSequenceId = sequenceId;
      this.#activeOriginSnapshot =
        this.#lastNonMeetingSnapshot !== null
          ? cloneSnapshot(this.#lastNonMeetingSnapshot)
          : cloneSnapshot(snapshot);
    }

    const originSnapshot =
      this.#activeOriginSnapshot !== null
        ? cloneSnapshot(this.#activeOriginSnapshot)
        : cloneSnapshot(snapshot);
    const speakerId =
      latestEvent && "playerId" in latestEvent ? latestEvent.playerId : null;
    const targetPlayerId =
      latestEvent && "targetPlayerId" in latestEvent
        ? (latestEvent.targetPlayerId ?? null)
        : latestEvent?.eventId === "player-exiled"
          ? latestEvent.playerId
          : null;
    const reorderedPlayers = reorderPlayersForReveal(
      snapshot.players,
      snapshot.phaseId === "reveal" ? targetPlayerId : null,
    );

    const stagedPlayers = reorderedPlayers.map((player) => {
      if (player.status === "alive") {
        return {
          ...player,
          roomId: MEETING_ROOM_ID,
          bodyLanguage:
            snapshot.phaseId === "vote"
              ? ("agitated" as const)
              : snapshot.phaseId === "reveal"
                ? player.id === targetPlayerId
                  ? ("shaken" as const)
                  : ("defiant" as const)
                : ("confident" as const),
        };
      }

      if (snapshot.phaseId === "reveal" && player.id === targetPlayerId) {
        return {
          ...player,
          roomId: MEETING_ROOM_ID,
          bodyLanguage: "shaken" as const,
        };
      }

      return {
        ...player,
        roomId: null,
      };
    });

    const stagedRooms = snapshot.rooms.map((room) => {
      if (room.roomId !== MEETING_ROOM_ID) {
        return {
          ...room,
          occupantIds: [],
        };
      }

      return {
        ...room,
        lightLevel: "lit" as const,
        doorState: "sealed" as const,
        occupantIds: stagedPlayers
          .filter((player) => player.roomId === MEETING_ROOM_ID)
          .map((player) => player.id),
      };
    });

    return {
      meetingRoomId: MEETING_ROOM_ID,
      sequenceId,
      originSnapshot,
      alarmRoomId: eventRoomId(triggerEvent),
      stagedSnapshot: {
        ...snapshot,
        players: stagedPlayers,
        rooms: stagedRooms,
      },
      speakerId,
      targetPlayerId,
      header: describeMeetingHeader(snapshot, latestEvent),
      detail: describeMeetingDetail(snapshot, speakerId, targetPlayerId),
    };
  }
}
