import type { MatchSnapshot, PhaseId, RoomId } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import type { AvatarNavigationState } from "../entities/avatar/PlayerAvatarLayer";
import { buildTaskReadabilityPresentation } from "../tasking/taskReadability";
import {
  deriveAmbienceState,
  deriveNavigationSoundCues,
  deriveSnapshotSoundCues,
  footstepCueForSurface,
  roomSoundProfileForRoom,
} from "./publicEventFeedback";

const ROOM_IDS = [
  "grand-hall",
  "kitchen",
  "library",
  "study",
  "ballroom",
  "greenhouse",
  "surveillance-hall",
  "generator-room",
  "cellar",
  "servants-corridor",
] as const satisfies readonly RoomId[];

const createSnapshot = (
  overrides: Partial<MatchSnapshot> & {
    phaseId?: PhaseId;
  } = {},
): MatchSnapshot =>
  ({
    tick: overrides.tick ?? 24,
    phaseId: overrides.phaseId ?? "roam",
    players:
      overrides.players ??
      ([
        {
          id: "iris",
          displayName: "Iris",
          connected: true,
          roomId: "grand-hall",
          status: "alive",
          publicImage: {
            credibility: 0.68,
            suspiciousness: 0.22,
          },
          emotion: {
            pleasure: 0.24,
            arousal: 0.12,
            dominance: 0.18,
            label: "calm",
            intensity: 0.28,
            updatedAtTick: 24,
          },
          bodyLanguage: "calm",
          completedTaskCount: 1,
        },
        {
          id: "victor",
          displayName: "Victor",
          connected: true,
          roomId: "generator-room",
          status: "alive",
          publicImage: {
            credibility: 0.58,
            suspiciousness: 0.36,
          },
          emotion: {
            pleasure: 0.02,
            arousal: 0.44,
            dominance: 0.16,
            label: "calm",
            intensity: 0.42,
            updatedAtTick: 24,
          },
          bodyLanguage: "confident",
          completedTaskCount: 0,
        },
      ] as unknown as MatchSnapshot["players"]),
    rooms:
      overrides.rooms ??
      (ROOM_IDS.map((roomId) => ({
        roomId,
        occupantIds:
          roomId === "grand-hall"
            ? ["iris"]
            : roomId === "generator-room"
              ? ["victor"]
              : [],
        taskIds: roomId === "generator-room" ? ["reset-breaker-lattice"] : [],
        clueIds: [],
        lightLevel: roomId === "generator-room" ? "dim" : "lit",
        doorState: "open",
      })) as unknown as MatchSnapshot["rooms"]),
    tasks:
      overrides.tasks ??
      ([
        {
          taskId: "reset-breaker-lattice",
          roomId: "generator-room",
          kind: "solo",
          status: "in-progress",
          assignedPlayerIds: ["victor"],
          progress: 0.52,
        },
      ] as unknown as MatchSnapshot["tasks"]),
    recentEvents: overrides.recentEvents ?? [],
  }) as MatchSnapshot;

describe("publicEventFeedback", () => {
  it("derives public event cues from snapshot deltas", () => {
    const previousSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      tick: 25,
      phaseId: "meeting",
      tasks: [
        {
          taskId: "reset-breaker-lattice",
          roomId: "generator-room",
          kind: "solo",
          status: "blocked",
          assignedPlayerIds: ["victor"],
          progress: 0.52,
        },
      ],
      rooms: createSnapshot().rooms.map((room) =>
        room.roomId === "generator-room"
          ? { ...room, lightLevel: "blackout" }
          : room,
      ),
      recentEvents: [
        {
          id: "event-meeting",
          eventId: "meeting-called",
          tick: 25,
          phaseId: "meeting",
          playerId: "iris",
          reason: "Compare alibis.",
        },
        {
          id: "event-task",
          eventId: "task-completed",
          tick: 25,
          phaseId: "roam",
          playerId: "victor",
          taskId: "reset-breaker-lattice",
          roomId: "generator-room",
        },
        {
          id: "event-clue",
          eventId: "clue-discovered",
          tick: 25,
          phaseId: "meeting",
          playerId: "iris",
          clueId: "clue-1",
          roomId: "study",
        },
      ],
    });
    const taskReadability = buildTaskReadabilityPresentation(snapshot);

    const cues = deriveSnapshotSoundCues({
      previousSnapshot,
      snapshot,
      taskReadability,
    });

    expect(cues.map((cue) => cue.cueId)).toEqual(
      expect.arrayContaining([
        "meeting-bell",
        "task-complete",
        "clue-stinger",
        "task-blocked",
        "sabotage-pulse",
      ]),
    );
  });

  it("derives door and seating cues from navigation transitions", () => {
    const previousNavigationStates = new Map<string, AvatarNavigationState>([
      [
        "iris",
        {
          roomId: "grand-hall",
          moving: true,
          paused: false,
          arrived: false,
          waypointKind: "room-exit",
        },
      ],
      [
        "victor",
        {
          roomId: "grand-hall",
          moving: true,
          paused: false,
          arrived: false,
          waypointKind: "door-threshold",
        },
      ],
    ]);
    const navigationStates = new Map<string, AvatarNavigationState>([
      [
        "iris",
        {
          roomId: "study",
          moving: true,
          paused: false,
          arrived: false,
          waypointKind: "door-threshold",
        },
      ],
      [
        "victor",
        {
          roomId: "grand-hall",
          moving: false,
          paused: false,
          arrived: true,
          waypointKind: null,
        },
      ],
    ]);

    const cues = deriveNavigationSoundCues({
      previousNavigationStates,
      navigationStates,
      phaseId: "meeting",
    });

    expect(cues.map((cue) => cue.cueId)).toEqual(
      expect.arrayContaining(["door-open", "meeting-seat"]),
    );
  });

  it("resolves ambience and surface cues from public room state", () => {
    const snapshot = createSnapshot({
      rooms: createSnapshot().rooms.map((room) =>
        room.roomId === "grand-hall"
          ? { ...room, lightLevel: "blackout" }
          : room,
      ),
    });
    const ambience = deriveAmbienceState({
      snapshot,
      focusedRoomId: "grand-hall",
      stormLevel: 0.88,
    });

    expect(roomSoundProfileForRoom("generator-room")).toBe("mechanical");
    expect(footstepCueForSurface("glass")).toBe("footstep-glass");
    expect(ambience.roomSurface).toBe("parquet");
    expect(ambience.blackoutLevel).toBeGreaterThan(0);
  });
});
