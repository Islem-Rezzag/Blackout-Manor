import type {
  PhaseId,
  PlayerId,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";

import { getRoomRenderData, getRoomSeatPosition } from "../tiled/manorLayout";
import type { SeatResolver } from "./ManorWorldStage";

export const worldSeatResolver: SeatResolver = (roomId, seatIndex, seatCount) =>
  getRoomSeatPosition(roomId, seatIndex, seatCount);

const createMeetingSeatPosition = (
  meetingRoomId: RoomId,
  phaseId: PhaseId,
  seatIndex: number,
  seatCount: number,
) => {
  const room = getRoomRenderData(meetingRoomId);

  if (phaseId === "reveal" && seatCount > 1 && seatIndex === seatCount - 1) {
    return {
      x: room.focusPoint.x,
      y: room.bounds.y + room.height * 0.76,
    };
  }

  const angle =
    Math.PI * 0.18 +
    (Math.PI * 0.64 * (seatIndex + 0.5)) / Math.max(1, seatCount);
  const radiusX = room.width * 0.28;
  const radiusY = room.height * 0.22;

  return {
    x: room.focusPoint.x + Math.cos(angle) * radiusX,
    y: room.focusPoint.y + Math.sin(angle) * radiusY + 28,
  };
};

export const createMeetingSeatMap = (
  players: readonly PublicPlayerState[],
  meetingRoomId: RoomId,
  phaseId: PhaseId,
  targetPlayerId: PlayerId | null,
) => {
  const seatedPlayers = players.filter(
    (player) => player.roomId === meetingRoomId,
  );
  const orderedPlayers =
    phaseId === "reveal" && targetPlayerId
      ? [
          ...seatedPlayers.filter((player) => player.id !== targetPlayerId),
          ...seatedPlayers.filter((player) => player.id === targetPlayerId),
        ]
      : seatedPlayers;
  const seatMap = new Map<PlayerId, { x: number; y: number }>();

  orderedPlayers.forEach((player, seatIndex) => {
    seatMap.set(
      player.id,
      createMeetingSeatPosition(
        meetingRoomId,
        phaseId,
        seatIndex,
        orderedPlayers.length,
      ),
    );
  });

  return seatMap;
};

export const createMeetingSeatResolver = (
  meetingRoomId: RoomId,
  phaseId: PhaseId,
): SeatResolver => {
  return (_roomId, seatIndex, seatCount) =>
    createMeetingSeatPosition(meetingRoomId, phaseId, seatIndex, seatCount);
};

export const createFinaleSeatResolver = (roomId: RoomId): SeatResolver => {
  const room = getRoomRenderData(roomId);

  return (_unusedRoomId, seatIndex, seatCount) => {
    const columns = Math.max(3, Math.ceil(Math.sqrt(Math.max(seatCount, 1))));
    const rows = Math.max(1, Math.ceil(seatCount / columns));
    const column = seatIndex % columns;
    const row = Math.floor(seatIndex / columns);
    const usableWidth = room.width * 0.58;
    const usableHeight = room.height * 0.34;

    return {
      x:
        room.focusPoint.x -
        usableWidth / 2 +
        ((column + 0.5) / columns) * usableWidth,
      y:
        room.focusPoint.y -
        usableHeight / 2 +
        ((row + 0.5) / rows) * usableHeight +
        72,
    };
  };
};
