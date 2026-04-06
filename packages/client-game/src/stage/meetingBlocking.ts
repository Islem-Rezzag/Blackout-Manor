import type { PlayerId, PublicPlayerState } from "@blackout-manor/shared";
import { DEFAULT_ROOM_LABELS } from "@blackout-manor/shared";
import type {
  CameraPlan,
  InspectionPresentation,
  MeetingPresentation,
} from "../directors/types";
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

export const MEETING_ALARM_FOCUS_MS = 1_040;
export const MEETING_PANEL_DELAY_MS = 240;
export const MEETING_PORTRAIT_DELAY_MS = 520;

export type MeetingDirectionTimings = {
  alarmFocusMs: number;
  overviewReturnMs: number;
  hallFocusMs: number;
  panelRevealMs: number;
  portraitRevealMs: number;
};

export type MeetingDirectionPhase = "alarm" | "overview" | "gather";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

  const longestTravelMs = Math.max(0, ...travelDurationsMs.values());
  const alarmFocusMs = meeting.alarmRoomId ? MEETING_ALARM_FOCUS_MS : 0;
  const overviewWindowMs = clamp(Math.round(longestTravelMs * 0.24), 540, 860);
  const hallFocusMs = alarmFocusMs + overviewWindowMs;
  const panelRevealMs = hallFocusMs + MEETING_PANEL_DELAY_MS;
  const portraitRevealMs =
    hallFocusMs +
    Math.max(
      MEETING_PORTRAIT_DELAY_MS,
      clamp(Math.round(longestTravelMs * 0.16), 460, 740),
    );

  return {
    seatPositions,
    movementOrigins,
    travelDurationsMs,
    directionTimings: {
      alarmFocusMs,
      overviewReturnMs: alarmFocusMs,
      hallFocusMs,
      panelRevealMs,
      portraitRevealMs,
    } satisfies MeetingDirectionTimings,
  };
};

export const resolveMeetingDirection = (options: {
  meeting: MeetingPresentation;
  elapsedMs: number;
  directionTimings: MeetingDirectionTimings;
}): {
  phase: MeetingDirectionPhase;
  camera: CameraPlan;
  inspection: InspectionPresentation;
} => {
  const { directionTimings, elapsedMs, meeting } = options;

  if (meeting.alarmRoomId && elapsedMs < directionTimings.alarmFocusMs) {
    return {
      phase: "alarm",
      camera: {
        roomId: meeting.alarmRoomId,
        immediate: false,
        reason: "report",
        detail:
          "The camera holds on the public alarm room before the hall gathers.",
      },
      inspection: {
        mode: "inspect",
        roomId: meeting.alarmRoomId,
        immediate: false,
        label: `Inspecting ${DEFAULT_ROOM_LABELS[meeting.alarmRoomId]}`,
        detail:
          "The alarm room stays readable first so the spectator understands why the manor is about to convene.",
      },
    };
  }

  if (elapsedMs < directionTimings.hallFocusMs) {
    return {
      phase: "overview",
      camera: {
        roomId: null,
        immediate: false,
        reason: "meeting",
        detail:
          "The view returns to the whole manor while surviving guests converge on the grand hall.",
      },
      inspection: {
        mode: "overview",
        roomId: null,
        immediate: false,
        label: "Whole manor overview",
        detail:
          "Meeting convergence keeps the entire floorplan legible until the tribunal settles.",
      },
    };
  }

  return {
    phase: "gather",
    camera: {
      roomId: meeting.meetingRoomId,
      immediate: false,
      reason: "meeting",
      detail:
        "Grand hall framing holds the tribunal while public arrivals settle into place.",
    },
    inspection: {
      mode: "inspect",
      roomId: meeting.meetingRoomId,
      immediate: false,
      label: `Inspecting ${DEFAULT_ROOM_LABELS[meeting.meetingRoomId]}`,
      detail:
        "Meeting focus centers the tribunal table and public cast reactions without exposing hidden information.",
    },
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
