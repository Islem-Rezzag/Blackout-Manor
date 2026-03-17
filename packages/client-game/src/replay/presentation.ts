import { MANOR_V1_MAP, SEASON_01_TASKS } from "@blackout-manor/content";
import type {
  ReplayHighlightMarker,
  SavedReplayEnvelope,
} from "@blackout-manor/replay-viewer";
import {
  DEFAULT_ROOM_LABELS,
  DEFAULT_TIMINGS,
  type MatchConfig,
  type MatchEvent,
  type MatchSnapshot,
  type PhaseId,
  type PlayerId,
  type PublicPlayerState,
  type ReplayFrame,
  type RoleId,
  type RoomId,
  type RoomState,
  RoomStateSchema,
  type TaskState,
  TaskStateSchema,
} from "@blackout-manor/shared";

type EngineReplayFrame = SavedReplayEnvelope["replay"]["frames"][number];
type EngineReplayPlayer = EngineReplayFrame["players"][number];

export type ReplayPresentationFrame = {
  index: number;
  tick: number;
  phaseId: PhaseId;
  snapshot: MatchSnapshot;
  replayFrame: ReplayFrame;
  highlightMarkers: ReplayHighlightMarker[];
  winner: SavedReplayEnvelope["summary"]["winner"];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toRoleCounts = (players: readonly EngineReplayPlayer[]) => {
  const counts: Record<RoleId, number> = {
    shadow: 0,
    investigator: 0,
    steward: 0,
    household: 0,
  };

  for (const player of players) {
    const role = player.role as RoleId;
    if (role in counts) {
      counts[role] += 1;
    }
  }

  return counts;
};

const toSpeedProfileId = (
  replay: SavedReplayEnvelope["replay"],
): MatchConfig["speedProfileId"] => {
  const candidate = replay.config.speedProfileId;
  if (
    candidate === "showcase" ||
    candidate === "fast-sim" ||
    candidate === "headless-regression"
  ) {
    return candidate;
  }

  return "showcase";
};

const createReplayConfig = (
  envelope: SavedReplayEnvelope,
  playerCount: number,
  roleCounts: Record<RoleId, number>,
): MatchConfig => ({
  matchId: envelope.replay.matchId,
  seed: envelope.replay.seed,
  speedProfileId: toSpeedProfileId(envelope.replay),
  officialPublicMode: true,
  modelPackId: "replay-theater-pack",
  allowPrivateWhispers: true,
  playerCount,
  roomIds: MANOR_V1_MAP.rooms.map((room) => room.id),
  taskIds: SEASON_01_TASKS.map((task) => task.id),
  roleDistribution: roleCounts,
  timings: DEFAULT_TIMINGS.showcase,
});

const roomIdFromValue = (value: unknown): RoomId | null => {
  if (typeof value !== "string") {
    return null;
  }

  return MANOR_V1_MAP.rooms.some((room) => room.id === value)
    ? (value as RoomId)
    : null;
};

const inferEmotionLabel = (
  player: EngineReplayPlayer,
  phaseId: PhaseId,
): PublicPlayerState["emotion"]["label"] => {
  if (player.status !== "alive") {
    return "shaken";
  }

  if (player.role === "shadow") {
    return phaseId === "meeting" || phaseId === "vote"
      ? "confident"
      : "suspicious";
  }

  if (phaseId === "report" || phaseId === "reveal") {
    return "afraid";
  }

  if (phaseId === "meeting" || phaseId === "vote") {
    return "determined";
  }

  return "calm";
};

const inferBodyLanguage = (
  player: EngineReplayPlayer,
  phaseId: PhaseId,
): PublicPlayerState["bodyLanguage"] => {
  if (player.status !== "alive") {
    return "shaken";
  }

  if (phaseId === "vote" || phaseId === "reveal") {
    return player.role === "shadow" ? "defiant" : "agitated";
  }

  if (player.role === "shadow") {
    return "confident";
  }

  return "calm";
};

const inferPublicImage = (
  player: EngineReplayPlayer,
): PublicPlayerState["publicImage"] => ({
  credibility:
    player.role === "investigator"
      ? 0.68
      : player.role === "steward"
        ? 0.61
        : player.status === "alive"
          ? 0.54
          : 0.34,
  suspiciousness:
    player.role === "shadow" ? 0.72 : player.status === "alive" ? 0.28 : 0.16,
});

const createPublicPlayerState = (
  player: EngineReplayPlayer,
  tick: number,
  phaseId: PhaseId,
): PublicPlayerState => {
  const roomId = roomIdFromValue(player.roomId);
  const publicImage = inferPublicImage(player);
  const emotionLabel = inferEmotionLabel(player, phaseId);

  return {
    id: player.id,
    displayName: player.displayName,
    roomId,
    status: player.status,
    connected: true,
    publicImage,
    emotion: {
      pleasure: player.status === "alive" ? 0.12 : -0.42,
      arousal:
        phaseId === "meeting" || phaseId === "vote" || phaseId === "reveal"
          ? 0.68
          : 0.34,
      dominance: player.role === "shadow" ? 0.54 : 0.18,
      label: emotionLabel,
      intensity:
        phaseId === "meeting" || phaseId === "vote" || phaseId === "reveal"
          ? 0.72
          : 0.46,
      updatedAtTick: tick,
    },
    bodyLanguage: inferBodyLanguage(player, phaseId),
    completedTaskCount:
      player.status === "alive" ? (player.role === "household" ? 2 : 1) : 0,
  };
};

const coerceTaskStates = (frame: EngineReplayFrame): TaskState[] => {
  const parsed = frame.tasks
    .map((task) => TaskStateSchema.safeParse(task))
    .flatMap((result) => (result.success ? [result.data] : []));

  if (parsed.length > 0) {
    return parsed;
  }

  return SEASON_01_TASKS.map((task) => ({
    taskId: task.id,
    roomId: task.roomId,
    kind: task.kind,
    status: "available",
    assignedPlayerIds: [],
    progress: 0,
  }));
};

const coerceRoomStates = (
  frame: EngineReplayFrame,
  players: readonly PublicPlayerState[],
  tasks: readonly TaskState[],
): RoomState[] => {
  const parsed = frame.rooms
    .map((room) => RoomStateSchema.safeParse(room))
    .flatMap((result) => (result.success ? [result.data] : []));

  if (parsed.length > 0) {
    return parsed;
  }

  return MANOR_V1_MAP.rooms.map((room) => ({
    roomId: room.id,
    lightLevel: room.id === "generator-room" ? "dim" : "lit",
    doorState: "open",
    occupantIds: players
      .filter(
        (player) => player.roomId === room.id && player.status === "alive",
      )
      .map((player) => player.id),
    taskIds: tasks
      .filter((task) => task.roomId === room.id)
      .map((task) => task.taskId),
  }));
};

const buildSyntheticDiscussionText = (
  actorId: PlayerId,
  actionId: string,
  targetPlayerId: PlayerId | null,
): string => {
  switch (actionId) {
    case "promise":
      return `${actorId} promises ${targetPlayerId ?? "the table"} protection.`;
    case "press":
      return `${actorId} presses ${targetPlayerId ?? "the room"} for a clearer timeline.`;
    case "comfort":
      return `${actorId} steadies ${targetPlayerId ?? "a witness"} before speaking.`;
    case "reassure":
      return `${actorId} asks the room to slow down and compare details.`;
    case "apologize":
      return `${actorId} tries to repair a frayed accusation.`;
    case "confide":
      return `${actorId} leans in with a private alliance plea.`;
    default:
      return `${actorId} advances the story with ${actionId}.`;
  }
};

const createSyntheticEvents = (
  frame: EngineReplayFrame,
  players: readonly PublicPlayerState[],
  highlights: readonly ReplayHighlightMarker[],
): MatchEvent[] => {
  const playerRoomLookup = new Map(
    players.map((player) => [player.id, player.roomId]),
  );
  const events: MatchEvent[] = [];

  for (const event of frame.events) {
    if (!isRecord(event) || typeof event.type !== "string") {
      continue;
    }

    if (event.type === "phase-changed") {
      events.push({
        id: `replay-phase-${frame.tick}`,
        eventId: "phase-changed",
        tick: frame.tick,
        phaseId: frame.phaseId,
        fromPhaseId:
          typeof event.fromPhaseId === "string"
            ? (event.fromPhaseId as PhaseId)
            : frame.phaseId,
        toPhaseId:
          typeof event.toPhaseId === "string"
            ? (event.toPhaseId as PhaseId)
            : frame.phaseId,
      } as MatchEvent);
      continue;
    }

    if (event.type === "vote-resolved") {
      const exiledPlayerId =
        typeof event.exiledPlayerId === "string"
          ? (event.exiledPlayerId as PlayerId)
          : null;

      if (exiledPlayerId) {
        events.push({
          id: `replay-exile-${frame.tick}-${exiledPlayerId}`,
          eventId: "player-exiled",
          tick: frame.tick,
          phaseId: frame.phaseId,
          playerId: exiledPlayerId,
        } as MatchEvent);
      }
      continue;
    }

    if (event.type !== "action-recorded" || !isRecord(event.proposal)) {
      continue;
    }

    const proposal = event.proposal;
    const proposalRecord = proposal as Record<string, unknown>;
    const actorId =
      typeof proposalRecord.actorId === "string"
        ? (proposalRecord.actorId as PlayerId)
        : null;
    const actionId =
      typeof proposalRecord.actionId === "string"
        ? proposalRecord.actionId
        : "observe";
    const targetPlayerId =
      typeof proposalRecord.targetPlayerId === "string"
        ? (proposalRecord.targetPlayerId as PlayerId)
        : typeof proposalRecord.discoveredPlayerId === "string"
          ? (proposalRecord.discoveredPlayerId as PlayerId)
          : null;

    if (!actorId) {
      continue;
    }

    if (actionId === "report-body") {
      const roomId = playerRoomLookup.get(actorId) ?? "cellar";
      events.push({
        id: `replay-report-${frame.tick}-${actorId}`,
        eventId: "body-reported",
        tick: frame.tick,
        phaseId: frame.phaseId,
        playerId: actorId,
        targetPlayerId: targetPlayerId ?? actorId,
        roomId,
      } as MatchEvent);
      continue;
    }

    if (actionId === "vote-player" || actionId === "skip-vote") {
      events.push({
        id: `replay-vote-${frame.tick}-${actorId}`,
        eventId: "vote-cast",
        tick: frame.tick,
        phaseId: frame.phaseId,
        playerId: actorId,
        targetPlayerId: actionId === "skip-vote" ? null : targetPlayerId,
      } as MatchEvent);
      continue;
    }

    events.push({
      id: `replay-discussion-${frame.tick}-${actorId}-${actionId}`,
      eventId: "discussion-turn",
      tick: frame.tick,
      phaseId: frame.phaseId,
      playerId: actorId,
      targetPlayerId,
      text:
        typeof proposal.speech === "object" &&
        proposal.speech !== null &&
        typeof (proposal.speech as Record<string, unknown>).text === "string"
          ? ((proposal.speech as Record<string, unknown>).text as string)
          : buildSyntheticDiscussionText(actorId, actionId, targetPlayerId),
    } as MatchEvent);
  }

  for (const highlight of highlights) {
    if (highlight.kind !== "report") {
      continue;
    }

    const actorId = highlight.playersInvolved[0] ?? players[0]?.id;
    const targetPlayerId = highlight.playersInvolved[1] ?? actorId ?? null;
    const roomId =
      targetPlayerId && playerRoomLookup.get(targetPlayerId)
        ? (playerRoomLookup.get(targetPlayerId) as RoomId)
        : "cellar";

    if (!actorId || !targetPlayerId) {
      continue;
    }

    events.push({
      id: `replay-highlight-report-${highlight.id}`,
      eventId: "body-reported",
      tick: highlight.tick,
      phaseId: frame.phaseId,
      playerId: actorId,
      targetPlayerId,
      roomId,
    } as MatchEvent);
  }

  return events.slice(-16);
};

const buildReplayFrame = (
  frame: EngineReplayFrame,
  snapshot: MatchSnapshot,
): ReplayFrame => ({
  tick: frame.tick,
  phaseId: snapshot.phaseId,
  events: snapshot.recentEvents,
  players: snapshot.players,
  rooms: snapshot.rooms,
  tasks: snapshot.tasks,
});

const ensurePhaseId = (phaseId: string): PhaseId => {
  if (
    phaseId === "intro" ||
    phaseId === "roam" ||
    phaseId === "report" ||
    phaseId === "meeting" ||
    phaseId === "vote" ||
    phaseId === "reveal" ||
    phaseId === "resolution" ||
    phaseId === "reflection"
  ) {
    return phaseId;
  }

  return "roam";
};

export const createReplayPresentationFrames = (
  envelope: SavedReplayEnvelope,
): ReplayPresentationFrame[] => {
  const frames = envelope.replay.frames;
  const firstPlayers = frames[0]?.players ?? [];
  const config = createReplayConfig(
    envelope,
    Math.max(firstPlayers.length, 1),
    toRoleCounts(firstPlayers),
  );

  return frames.map((frame, index) => {
    const phaseId = ensurePhaseId(frame.phaseId);
    const players = frame.players.map((player) =>
      createPublicPlayerState(player, frame.tick, phaseId),
    );
    const tasks = coerceTaskStates(frame);
    const rooms = coerceRoomStates(frame, players, tasks);
    const highlightMarkers = envelope.highlights.filter(
      (highlight) => highlight.tick === frame.tick,
    );
    const recentEvents = createSyntheticEvents(
      frame,
      players,
      highlightMarkers,
    );
    const snapshot: MatchSnapshot = {
      matchId: envelope.replay.matchId,
      phaseId,
      tick: frame.tick,
      config,
      players,
      rooms,
      tasks,
      recentEvents,
    };

    return {
      index,
      tick: frame.tick,
      phaseId,
      snapshot,
      replayFrame: buildReplayFrame(frame, snapshot),
      highlightMarkers,
      winner: frame.winner ?? envelope.summary.winner,
    };
  });
};

export const findReplayPresentationFrameIndex = (
  frames: readonly ReplayPresentationFrame[],
  tick: number,
) => {
  if (frames.length === 0) {
    return 0;
  }

  const exactIndex = frames.findIndex((frame) => frame.tick === tick);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const nearest = frames.reduce(
    (best, frame, index) => {
      const distance = Math.abs(frame.tick - tick);
      if (distance < best.distance) {
        return { index, distance };
      }

      return best;
    },
    { index: 0, distance: Math.abs(frames[0]?.tick ?? 0) },
  );

  return nearest.index;
};

export const describeReplayRoom = (roomId: RoomId) =>
  DEFAULT_ROOM_LABELS[roomId];
