import type {
  MatchSnapshot,
  PhaseId,
  PlayerId,
  RoomId,
} from "@blackout-manor/shared";

import type { AvatarNavigationState } from "../entities/avatar/PlayerAvatarLayer";
import type { TaskReadabilityPresentation } from "../tasking/taskReadability";

export type RoomSoundProfileId =
  | "parquet"
  | "stone"
  | "service"
  | "mechanical"
  | "glass";

export type PublicSoundCueId =
  | "hover"
  | "snapshot"
  | "alert"
  | "footstep-parquet"
  | "footstep-stone"
  | "footstep-service"
  | "footstep-mechanical"
  | "footstep-glass"
  | "door-open"
  | "door-close"
  | "meeting-bell"
  | "meeting-seat"
  | "sabotage-pulse"
  | "clue-stinger"
  | "task-complete"
  | "task-blocked";

export type PublicSoundCue = {
  cueId: PublicSoundCueId;
  key: string;
  roomId: RoomId | null;
  playerId?: PlayerId;
  soundHookId?: string;
  intensity?: number;
};

export type PublicMovementFeedbackState = {
  playerId: PlayerId;
  roomId: RoomId | null;
  moving: boolean;
  paused: boolean;
  arrived: boolean;
  waypointKind: AvatarNavigationState["waypointKind"];
  surfaceProfile: RoomSoundProfileId;
};

export type PublicAmbienceState = {
  phaseId: PhaseId;
  focusedRoomId: RoomId | null;
  roomSurface: RoomSoundProfileId;
  stormLevel: number;
  blackoutLevel: number;
  meetingActive: boolean;
};

const ROOM_SOUND_PROFILES: Record<RoomId, RoomSoundProfileId> = {
  "grand-hall": "parquet",
  kitchen: "stone",
  library: "parquet",
  study: "parquet",
  ballroom: "parquet",
  greenhouse: "glass",
  "surveillance-hall": "service",
  "generator-room": "mechanical",
  cellar: "mechanical",
  "servants-corridor": "service",
};

const FEEDBACK_PHASES = new Set<PhaseId>([
  "meeting",
  "vote",
  "reveal",
  "resolution",
]);

const uniqueCues = (cues: readonly PublicSoundCue[]) => {
  const deduped = new Map<string, PublicSoundCue>();

  for (const cue of cues) {
    if (!deduped.has(cue.key)) {
      deduped.set(cue.key, cue);
    }
  }

  return [...deduped.values()];
};

export const roomSoundProfileForRoom = (
  roomId: RoomId | null,
): RoomSoundProfileId =>
  roomId ? (ROOM_SOUND_PROFILES[roomId] ?? "parquet") : "service";

export const footstepCueForSurface = (
  surfaceProfile: RoomSoundProfileId,
): PublicSoundCueId => {
  switch (surfaceProfile) {
    case "stone":
      return "footstep-stone";
    case "service":
      return "footstep-service";
    case "mechanical":
      return "footstep-mechanical";
    case "glass":
      return "footstep-glass";
    default:
      return "footstep-parquet";
  }
};

export const footstepIntervalMsForSurface = (
  surfaceProfile: RoomSoundProfileId,
) => {
  switch (surfaceProfile) {
    case "stone":
      return 420;
    case "service":
      return 390;
    case "mechanical":
      return 360;
    case "glass":
      return 460;
    default:
      return 380;
  }
};

export const deriveSnapshotSoundCues = (options: {
  previousSnapshot: MatchSnapshot | null;
  snapshot: MatchSnapshot;
  taskReadability: TaskReadabilityPresentation;
}) => {
  const { previousSnapshot, snapshot, taskReadability } = options;
  const previousEventIds = new Set(
    previousSnapshot?.recentEvents.map((event) => event.id) ?? [],
  );
  const cues: PublicSoundCue[] = [];

  for (const event of snapshot.recentEvents) {
    if (previousEventIds.has(event.id)) {
      continue;
    }

    switch (event.eventId) {
      case "meeting-called":
      case "body-reported":
        cues.push({
          cueId: "meeting-bell",
          key: `meeting:${event.id}`,
          roomId: event.eventId === "body-reported" ? event.roomId : null,
          playerId: event.playerId,
          intensity: event.eventId === "body-reported" ? 1 : 0.92,
        });
        break;
      case "sabotage-triggered":
        {
          const soundHookId = event.taskId
            ? taskReadability.nodes.get(event.taskId)?.soundHookId
            : undefined;

          cues.push({
            cueId: "sabotage-pulse",
            key: `sabotage:${event.id}`,
            roomId: event.roomId ?? null,
            playerId: event.playerId,
            ...(soundHookId ? { soundHookId } : {}),
            intensity: 1,
          });
        }
        break;
      case "clue-discovered":
        cues.push({
          cueId: "clue-stinger",
          key: `clue:${event.id}`,
          roomId: event.roomId,
          playerId: event.playerId,
          intensity: 0.9,
        });
        break;
      case "task-completed":
        {
          const soundHookId = taskReadability.nodes.get(
            event.taskId,
          )?.soundHookId;

          cues.push({
            cueId: "task-complete",
            key: `task-complete:${event.id}`,
            roomId: event.roomId,
            playerId: event.playerId,
            ...(soundHookId ? { soundHookId } : {}),
            intensity: 0.82,
          });
        }
        break;
      default:
        break;
    }
  }

  const previousTasks = new Map(
    previousSnapshot?.tasks.map((task) => [task.taskId, task]) ?? [],
  );
  const sabotageRooms = new Set(
    cues
      .filter((cue) => cue.cueId === "sabotage-pulse" && cue.roomId)
      .map((cue) => cue.roomId as RoomId),
  );

  for (const task of snapshot.tasks) {
    const previousTask = previousTasks.get(task.taskId);

    if (previousTask?.status !== "blocked" && task.status === "blocked") {
      const soundHookId = taskReadability.nodes.get(task.taskId)?.soundHookId;

      cues.push({
        cueId: "task-blocked",
        key: `task-blocked:${snapshot.tick}:${task.taskId}`,
        roomId: task.roomId,
        ...(soundHookId ? { soundHookId } : {}),
        intensity: 0.72,
      });
    }
  }

  const previousRooms = new Map(
    previousSnapshot?.rooms.map((room) => [room.roomId, room]) ?? [],
  );

  for (const room of snapshot.rooms) {
    const previousRoom = previousRooms.get(room.roomId);

    if (
      previousRoom &&
      !sabotageRooms.has(room.roomId) &&
      ((previousRoom.lightLevel !== "blackout" &&
        room.lightLevel === "blackout") ||
        (previousRoom.doorState === "open" && room.doorState !== "open"))
    ) {
      cues.push({
        cueId: "sabotage-pulse",
        key: `room-alert:${snapshot.tick}:${room.roomId}`,
        roomId: room.roomId,
        intensity: 0.76,
      });
    }
  }

  if (
    previousSnapshot &&
    previousSnapshot.phaseId !== snapshot.phaseId &&
    snapshot.phaseId === "meeting" &&
    !cues.some((cue) => cue.cueId === "meeting-bell")
  ) {
    cues.push({
      cueId: "meeting-bell",
      key: `phase-meeting:${snapshot.tick}`,
      roomId: null,
      intensity: 0.86,
    });
  }

  return uniqueCues(cues);
};

export const deriveNavigationSoundCues = (options: {
  previousNavigationStates: ReadonlyMap<PlayerId, AvatarNavigationState>;
  navigationStates: ReadonlyMap<PlayerId, AvatarNavigationState>;
  phaseId: PhaseId;
}) => {
  const { navigationStates, phaseId, previousNavigationStates } = options;
  const cues: PublicSoundCue[] = [];
  const meetingPhase = FEEDBACK_PHASES.has(phaseId);

  for (const [playerId, state] of navigationStates.entries()) {
    const previousState = previousNavigationStates.get(playerId);

    if (
      state.waypointKind === "door-threshold" &&
      previousState?.waypointKind !== "door-threshold"
    ) {
      cues.push({
        cueId: "door-open",
        key: `door-open:${playerId}:${state.roomId ?? "none"}:${state.waypointKind}`,
        roomId: state.roomId,
        playerId,
        intensity: 0.44,
      });
    }

    if (
      previousState?.waypointKind === "door-threshold" &&
      state.waypointKind === "room-entry"
    ) {
      cues.push({
        cueId: "door-close",
        key: `door-close:${playerId}:${state.roomId ?? "none"}`,
        roomId: state.roomId,
        playerId,
        intensity: 0.38,
      });
    }

    if (
      meetingPhase &&
      previousState &&
      !previousState.arrived &&
      state.arrived &&
      !state.moving
    ) {
      cues.push({
        cueId: "meeting-seat",
        key: `meeting-seat:${playerId}:${state.roomId ?? "none"}`,
        roomId: state.roomId,
        playerId,
        intensity: 0.52,
      });
    }
  }

  return uniqueCues(cues);
};

export const deriveMovementFeedbackStates = (
  navigationStates: ReadonlyMap<PlayerId, AvatarNavigationState>,
) =>
  [...navigationStates.entries()].map(
    ([playerId, state]): PublicMovementFeedbackState => ({
      playerId,
      roomId: state.roomId,
      moving: state.moving,
      paused: state.paused,
      arrived: state.arrived,
      waypointKind: state.waypointKind,
      surfaceProfile:
        state.waypointKind === "corridor"
          ? "service"
          : roomSoundProfileForRoom(state.roomId),
    }),
  );

export const deriveAmbienceState = (options: {
  snapshot: MatchSnapshot;
  focusedRoomId: RoomId | null;
  stormLevel: number;
}): PublicAmbienceState => {
  const blackoutRooms = options.snapshot.rooms.filter(
    (room) => room.lightLevel === "blackout",
  ).length;
  const blackoutLevel =
    blackoutRooms / Math.max(1, options.snapshot.rooms.length);

  return {
    phaseId: options.snapshot.phaseId,
    focusedRoomId: options.focusedRoomId,
    roomSurface: roomSoundProfileForRoom(options.focusedRoomId),
    stormLevel: options.stormLevel,
    blackoutLevel,
    meetingActive: FEEDBACK_PHASES.has(options.snapshot.phaseId),
  };
};
