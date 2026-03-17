import type {
  MatchEvent,
  MatchSnapshot,
  PlayerId,
} from "@blackout-manor/shared";

import type { MeetingPresentation } from "./types";

const MEETING_ROOM_ID = "grand-hall" as const;

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

export class MeetingDirector {
  derive(snapshot: MatchSnapshot): MeetingPresentation {
    const latestEvent = findLatestMeetingEvent(snapshot);
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
