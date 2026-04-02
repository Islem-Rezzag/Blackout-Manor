import type { PlayerId, PublicPlayerState } from "@blackout-manor/shared";
import type { MeetingPresentation } from "../directors/types";
import type {
  AvatarMovementOrigin,
  AvatarNavigationState,
} from "../entities/avatar/PlayerAvatarLayer";
import {
  buildEmbodiedMovementPlan,
  estimateMovementPlanDurationMs,
  type NavigationPoint,
} from "../navigation/manorNavigation";
import { createMeetingSeatMap, worldSeatResolver } from "./seatResolvers";

export const MEETING_ALARM_FOCUS_MS = 920;
export const MEETING_PANEL_DELAY_MS = 280;
export const MEETING_PORTRAIT_DELAY_MS = 640;

const buildSnapshotSeatPositions = (
  players: readonly PublicPlayerState[],
  roomSeatResolver: typeof worldSeatResolver,
) => {
  const byRoom = new Map<string, PublicPlayerState[]>();
  const positions = new Map<PlayerId, NavigationPoint>();

  for (const player of players) {
    if (!player.roomId) {
      continue;
    }

    const roomPlayers = byRoom.get(player.roomId) ?? [];
    roomPlayers.push(player);
    byRoom.set(player.roomId, roomPlayers);
  }

  for (const player of players) {
    if (!player.roomId) {
      continue;
    }

    const roomPlayers = byRoom.get(player.roomId) ?? [player];
    const seatIndex = roomPlayers.findIndex(
      (candidate) => candidate.id === player.id,
    );
    positions.set(
      player.id,
      roomSeatResolver(player.roomId, seatIndex, roomPlayers.length),
    );
  }

  return positions;
};

export const createMeetingBlocking = (meeting: MeetingPresentation) => {
  const originPositions = buildSnapshotSeatPositions(
    meeting.originSnapshot.players,
    worldSeatResolver,
  );
  const seatPositions = createMeetingSeatMap(
    meeting.stagedSnapshot.players,
    meeting.meetingRoomId,
    meeting.stagedSnapshot.phaseId,
    meeting.targetPlayerId,
  );
  const movementOrigins = new Map<PlayerId, AvatarMovementOrigin>();
  const travelDurationsMs = new Map<PlayerId, number>();

  for (const player of meeting.stagedSnapshot.players) {
    if (!player.roomId) {
      continue;
    }

    const seatPosition = seatPositions.get(player.id);
    const originPlayer = meeting.originSnapshot.players.find(
      (candidate) => candidate.id === player.id,
    );

    if (!seatPosition || !originPlayer?.roomId) {
      continue;
    }

    const originPosition = originPositions.get(player.id) ?? seatPosition;
    movementOrigins.set(player.id, {
      roomId: originPlayer.roomId,
      position: originPosition,
    });

    const travelPlan = buildEmbodiedMovementPlan({
      fromRoomId: originPlayer.roomId,
      toRoomId: player.roomId,
      currentPosition: originPosition,
      targetPosition: seatPosition,
      phaseId: meeting.stagedSnapshot.phaseId,
      cue: {
        eventId: null,
        gesture: "move",
        speechText: null,
        targetPlayerId: null,
        emphasis: 0,
        actionIcon: null,
      },
    });
    travelDurationsMs.set(
      player.id,
      estimateMovementPlanDurationMs(travelPlan),
    );
  }

  return {
    seatPositions,
    movementOrigins,
    travelDurationsMs,
  };
};

export const deriveMeetingTravelStatuses = (options: {
  meeting: MeetingPresentation;
  navigationStates: ReadonlyMap<PlayerId, AvatarNavigationState>;
  travelDurationsMs: ReadonlyMap<PlayerId, number>;
  elapsedMs: number;
}) => {
  const { elapsedMs, meeting, navigationStates, travelDurationsMs } = options;
  const statusMap = new Map<PlayerId, string>();

  for (const player of meeting.stagedSnapshot.players) {
    if (!player.connected) {
      statusMap.set(player.id, "ABSENT");
      continue;
    }

    if (player.status !== "alive") {
      statusMap.set(player.id, "REMOVED");
      continue;
    }

    const navigationState = navigationStates.get(player.id);
    const travelDuration = travelDurationsMs.get(player.id) ?? 0;

    if (navigationState?.arrived && !navigationState.moving) {
      statusMap.set(player.id, "SEATED");
      continue;
    }

    if (elapsedMs > travelDuration + 550 && !navigationState?.arrived) {
      statusMap.set(player.id, "LATE");
      continue;
    }

    statusMap.set(player.id, "TRAVELING");
  }

  return statusMap;
};
