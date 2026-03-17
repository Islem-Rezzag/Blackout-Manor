import type {
  MatchSnapshot,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";
import { DEFAULT_ROOM_LABELS } from "@blackout-manor/shared";
import {
  createRoomSignalMap,
  describeSignalLabel,
  eventRoomId,
  type RoomSignal,
  readableTaskLabel,
} from "../stage/signals";
import type { ClientGameState } from "../types";
import type {
  CameraPlan,
  ObservationMode,
  RoomStatusIndicator,
  RuntimeSceneId,
  SurveillanceFeedPresentation,
  SurveillancePresentation,
  VisibleSubtitle,
} from "./types";

const SURVEILLANCE_SCENE_IDS = new Set<RuntimeSceneId>([
  "manor-world",
  "replay",
]);
const MAX_FEEDS = 4;

const isObservationScene = (scene: RuntimeSceneId) =>
  SURVEILLANCE_SCENE_IDS.has(scene);

const playersByRoom = (snapshot: MatchSnapshot) => {
  const lookup = new Map<RoomId, PublicPlayerState[]>();

  for (const room of snapshot.rooms) {
    lookup.set(room.roomId, []);
  }

  for (const player of snapshot.players) {
    if (!player.roomId) {
      continue;
    }

    const roomPlayers = lookup.get(player.roomId) ?? [];
    roomPlayers.push(player);
    lookup.set(player.roomId, roomPlayers);
  }

  return lookup;
};

const roomPriority = (options: {
  snapshot: MatchSnapshot;
  roomState: MatchSnapshot["rooms"][number];
  selectedRoomId: RoomId | null;
  cameraRoomId: RoomId | null;
  signal: RoomSignal | undefined;
}) => {
  const { cameraRoomId, roomState, selectedRoomId, signal, snapshot } = options;

  if (!signal) {
    return 0;
  }

  let priority = roomState.occupantIds.length * 12;

  if (selectedRoomId === roomState.roomId) {
    priority += 160;
  }

  if (cameraRoomId === roomState.roomId) {
    priority += 120;
  }

  if (signal.body) {
    priority += 300;
  }

  if (signal.sabotage) {
    priority += 230;
  }

  if (signal.clue) {
    priority += 120;
  }

  if (roomState.lightLevel === "blackout") {
    priority += 140;
  }

  if (roomState.doorState !== "open") {
    priority += 110;
  }

  const eventWeight = [...snapshot.recentEvents]
    .reverse()
    .findIndex((event) => eventRoomId(event) === roomState.roomId);

  if (eventWeight >= 0) {
    priority += Math.max(0, 80 - eventWeight * 8);
  }

  return priority;
};

const buildSubtitle = (snapshot: MatchSnapshot): VisibleSubtitle | null => {
  for (const event of [...snapshot.recentEvents].reverse()) {
    switch (event.eventId) {
      case "discussion-turn":
        return {
          text: event.text,
          speakerId: event.playerId,
          roomId: null,
          tone: "speech",
        };
      case "body-reported":
        return {
          text: `${event.playerId} reports ${event.targetPlayerId} in ${DEFAULT_ROOM_LABELS[event.roomId]}.`,
          speakerId: event.playerId,
          roomId: event.roomId,
          tone: "alert",
        };
      case "sabotage-triggered":
        return {
          text: `${readableTaskLabel(event.actionId)} disturbs ${event.roomId ? DEFAULT_ROOM_LABELS[event.roomId] : "the manor"}.`,
          speakerId: null,
          roomId: event.roomId ?? null,
          tone: "alert",
        };
      case "task-completed":
        return {
          text: `${event.playerId} finishes ${readableTaskLabel(event.taskId)} in ${DEFAULT_ROOM_LABELS[event.roomId]}.`,
          speakerId: event.playerId,
          roomId: event.roomId,
          tone: "status",
        };
      case "clue-discovered":
        return {
          text: `${event.playerId} surfaces a clue in ${DEFAULT_ROOM_LABELS[event.roomId]}.`,
          speakerId: event.playerId,
          roomId: event.roomId,
          tone: "status",
        };
      default:
        break;
    }
  }

  return null;
};

type DeriveOptions = {
  scene: RuntimeSceneId;
  snapshot: MatchSnapshot | null;
  runtimeState: ClientGameState;
  camera: CameraPlan;
};

export class SurveillanceDirector {
  #mode: ObservationMode = "roaming";
  #selectedRoomId: RoomId | null = null;

  toggleMode() {
    this.#mode = this.#mode === "roaming" ? "surveillance" : "roaming";
  }

  setMode(mode: ObservationMode) {
    this.#mode = mode;
  }

  focusRoom(roomId: RoomId) {
    this.#mode = "surveillance";
    this.#selectedRoomId = roomId;
  }

  cycleFocus(rooms: readonly RoomId[], delta: number) {
    if (rooms.length === 0) {
      return;
    }

    const currentIndex = this.#selectedRoomId
      ? rooms.indexOf(this.#selectedRoomId)
      : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (((currentIndex + delta) % rooms.length) + rooms.length) %
          rooms.length;

    this.#selectedRoomId = rooms[nextIndex] ?? rooms[0] ?? null;
    this.#mode = "surveillance";
  }

  derive({
    camera,
    runtimeState,
    scene,
    snapshot,
  }: DeriveOptions): SurveillancePresentation {
    if (!snapshot || !isObservationScene(scene)) {
      return {
        available: false,
        mode: "roaming",
        selectedRoomId: null,
        feedRooms: [],
        statusIndicators: [],
        subtitle: null,
        indicatorLabel: "Observation unavailable",
        cameraLabel: camera.detail,
      };
    }

    const perRoomPlayers = playersByRoom(snapshot);
    const signalMap = createRoomSignalMap(snapshot);

    if (
      this.#selectedRoomId &&
      !snapshot.rooms.some((room) => room.roomId === this.#selectedRoomId)
    ) {
      this.#selectedRoomId = null;
    }

    const actorRoomId = runtimeState.actorId
      ? (snapshot.players.find((player) => player.id === runtimeState.actorId)
          ?.roomId ?? null)
      : null;
    const fallbackRoomId =
      this.#selectedRoomId ??
      camera.roomId ??
      actorRoomId ??
      snapshot.rooms[0]?.roomId ??
      null;
    const selectedRoomId =
      this.#mode === "surveillance" ? fallbackRoomId : null;
    const prioritizedFeeds = snapshot.rooms
      .map((roomState) => {
        const signal = signalMap.get(roomState.roomId);
        const occupants = perRoomPlayers.get(roomState.roomId) ?? [];
        const priority = roomPriority({
          snapshot,
          roomState,
          selectedRoomId,
          cameraRoomId: camera.roomId,
          signal,
        });

        return {
          roomId: roomState.roomId,
          label: DEFAULT_ROOM_LABELS[roomState.roomId],
          lightLevel: roomState.lightLevel,
          doorState: roomState.doorState,
          occupants,
          occupantCount: occupants.length,
          statusLine: signal
            ? describeSignalLabel(roomState, signal)
            : `${occupants.length} present`,
          priority,
          selected: selectedRoomId === roomState.roomId,
          markers: {
            body: signal?.body ?? false,
            sabotage: signal?.sabotage ?? false,
            clue: signal?.clue ?? false,
          },
        } satisfies SurveillanceFeedPresentation;
      })
      .sort((left, right) => right.priority - left.priority);
    const feedRooms = prioritizedFeeds.slice(0, MAX_FEEDS);

    if (
      selectedRoomId &&
      !feedRooms.some((feed) => feed.roomId === selectedRoomId)
    ) {
      const selectedFeed = prioritizedFeeds.find(
        (feed) => feed.roomId === selectedRoomId,
      );

      if (selectedFeed) {
        feedRooms[feedRooms.length - 1] = selectedFeed;
        feedRooms.sort((left, right) => right.priority - left.priority);
      }
    }

    const statusIndicators = feedRooms.slice(0, 3).map((feed) => ({
      roomId: feed.roomId,
      label: feed.label,
      lightLevel: feed.lightLevel,
      doorState: feed.doorState,
      occupantCount: feed.occupantCount,
      flagged:
        feed.markers.body ||
        feed.markers.sabotage ||
        feed.lightLevel === "blackout",
    })) satisfies RoomStatusIndicator[];

    if (
      this.#mode === "surveillance" &&
      selectedRoomId === null &&
      feedRooms[0]?.roomId
    ) {
      this.#selectedRoomId = feedRooms[0].roomId;
    }

    const finalSelectedRoomId =
      this.#mode === "surveillance"
        ? (this.#selectedRoomId ?? feedRooms[0]?.roomId ?? null)
        : null;

    return {
      available: true,
      mode: this.#mode,
      selectedRoomId: finalSelectedRoomId,
      feedRooms: feedRooms.map((feed) => ({
        ...feed,
        selected: finalSelectedRoomId === feed.roomId,
      })),
      statusIndicators,
      subtitle: buildSubtitle(snapshot),
      indicatorLabel:
        this.#mode === "surveillance"
          ? `Surveillance console · ${feedRooms.length} feeds`
          : "Roaming observation · auto-follow",
      cameraLabel:
        this.#mode === "surveillance"
          ? `${DEFAULT_ROOM_LABELS[finalSelectedRoomId ?? camera.roomId ?? snapshot.rooms[0]?.roomId ?? "grand-hall"]} feed`
          : camera.detail,
    };
  }
}
