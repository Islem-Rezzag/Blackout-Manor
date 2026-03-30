import type { MatchSnapshot, RoomId } from "@blackout-manor/shared";
import { DEFAULT_ROOM_LABELS } from "@blackout-manor/shared";

import type {
  InspectionMode,
  InspectionPresentation,
  ObservationMode,
  RuntimeSceneId,
} from "./types";

const INSPECTION_SCENE_IDS = new Set<RuntimeSceneId>(["manor-world", "replay"]);

type DeriveOptions = {
  scene: RuntimeSceneId;
  snapshot: MatchSnapshot | null;
  observationMode: ObservationMode;
  surveillanceRoomId: RoomId | null;
  activeRoomId: RoomId | null;
  fallbackImmediate: boolean;
};

export class InspectionDirector {
  #mode: InspectionMode = "overview";
  #roomId: RoomId | null = null;
  #pendingImmediate: boolean | null = null;

  inspectRoom(roomId: RoomId) {
    this.#mode = "inspect";
    this.#roomId = roomId;
    this.#pendingImmediate = false;
  }

  setMode(mode: InspectionMode) {
    this.#mode = mode;
    this.#roomId = mode === "inspect" ? this.#roomId : null;
    this.#pendingImmediate = false;
  }

  clear() {
    this.#mode = "overview";
    this.#roomId = null;
    this.#pendingImmediate = false;
  }

  derive(options: DeriveOptions): InspectionPresentation {
    const {
      activeRoomId,
      fallbackImmediate,
      observationMode,
      scene,
      snapshot,
      surveillanceRoomId,
    } = options;

    if (!snapshot || !INSPECTION_SCENE_IDS.has(scene)) {
      return {
        mode: "overview",
        roomId: null,
        immediate: true,
        label: "Whole manor overview",
        detail: "Observation scenes are not active.",
      };
    }

    if (
      this.#roomId &&
      !snapshot.rooms.some((room) => room.roomId === this.#roomId)
    ) {
      this.#roomId = null;
      this.#mode = "overview";
    }

    const resolveImmediate = () => {
      const immediate = this.#pendingImmediate ?? fallbackImmediate;
      this.#pendingImmediate = null;
      return immediate;
    };

    if (observationMode === "surveillance") {
      const roomId =
        surveillanceRoomId ?? activeRoomId ?? snapshot.rooms[0]?.roomId ?? null;

      return {
        mode: "inspect",
        roomId,
        immediate: fallbackImmediate,
        label: roomId
          ? `${DEFAULT_ROOM_LABELS[roomId]} surveillance`
          : "Surveillance feed",
        detail:
          "The console pins the main camera to the selected public feed while the full manor stays available on the monitor wall.",
      };
    }

    if (this.#mode === "inspect" && this.#roomId) {
      return {
        mode: "inspect",
        roomId: this.#roomId,
        immediate: resolveImmediate(),
        label: `Inspecting ${DEFAULT_ROOM_LABELS[this.#roomId]}`,
        detail:
          "Room focus strengthens cutaway readability, task props, and active cast silhouettes without exposing private state.",
      };
    }

    this.#mode = "overview";
    this.#roomId = null;

    return {
      mode: "overview",
      roomId: null,
      immediate: resolveImmediate(),
      label: "Whole manor overview",
      detail:
        "The full floorplan stays visible while public events still highlight the room that matters most.",
    };
  }
}
