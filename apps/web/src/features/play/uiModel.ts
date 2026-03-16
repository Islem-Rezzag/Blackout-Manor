import type {
  ClientGameConnectionOptions,
  ClientGameState,
} from "@blackout-manor/client-game";
import { MANOR_V1_MAP } from "@blackout-manor/content";
import { phaseDurationById } from "@blackout-manor/engine";
import type {
  ReplayHighlightMarker,
  SavedReplayEnvelope,
} from "@blackout-manor/replay-viewer";
import type {
  MatchEvent,
  MatchSnapshot,
  PhaseId,
  PlayerId,
  RoleId,
  RoomId,
} from "@blackout-manor/shared";

export type PlaySurfaceMode = "player" | "spectator" | "replay";

export type PlayShellDefaults = {
  defaultMode: "mock" | "live";
  defaultServerUrl: string;
  defaultRoomId: string | null;
  defaultActorId: string | null;
};

export type PlayShellConfig = {
  connection: ClientGameConnectionOptions | null;
  surfaceMode: PlaySurfaceMode;
};

export type LiveRoomCard = {
  roomId: RoomId;
  label: string;
  occupantCount: number;
  taskCount: number;
  lightLevel: MatchSnapshot["rooms"][number]["lightLevel"];
  doorState: MatchSnapshot["rooms"][number]["doorState"];
  isCurrent: boolean;
  isFlagged: boolean;
};

export type CastCard = {
  id: PlayerId;
  displayName: string;
  roomLabel: string;
  status: MatchSnapshot["players"][number]["status"];
  suspicion: number;
  credibility: number;
  emotionLabel: string;
  bodyLanguage: MatchSnapshot["players"][number]["bodyLanguage"];
  contradictionCount: number;
  colorA: string;
  colorB: string;
  role?: RoleId;
  roleVisible?: boolean;
};

export type EvidenceCard = {
  id: string;
  tag: string;
  title: string;
  detail: string;
};

export type ContradictionMarker = {
  playerId: PlayerId;
  displayName: string;
  count: number;
  reason: string;
};

export type LiveMeetingModel = {
  timerLabel: string;
  headline: string;
  portraits: CastCard[];
  evidenceCards: EvidenceCard[];
  contradictionMarkers: ContradictionMarker[];
};

export type ConfessionalBeat = {
  title: string;
  quote: string;
  detail: string;
};

export type RoleRevealModel = {
  role: RoleId;
  title: string;
  subtitle: string;
  knownAllyLabels: string[];
};

export type PostMatchModel = {
  headline: string;
  stats: Array<{ label: string; value: string }>;
};

export type LiveUiModel = {
  surfaceMode: PlaySurfaceMode;
  analyticsUnlocked: boolean;
  showLobby: boolean;
  phaseLabel: string;
  timerLabel: string;
  objective: string;
  objectiveDetail: string;
  alerts: string[];
  roomCards: LiveRoomCard[];
  castCards: CastCard[];
  evidenceCards: EvidenceCard[];
  transcript: string[];
  meeting: LiveMeetingModel | null;
  confessional: ConfessionalBeat | null;
  roleReveal: RoleRevealModel | null;
  postMatch: PostMatchModel | null;
};

export type ReplaySignalPoint = {
  tick: number;
  value: number;
};

export type ReplayLedgerEntry = {
  id: string;
  kind: "promise" | "confide";
  actorId: PlayerId;
  actorName: string;
  targetId: PlayerId;
  targetName: string;
  tick: number;
  status: "kept" | "broken";
  resolution: string;
};

export type ReplayRoomStage = {
  roomId: RoomId;
  label: string;
  occupants: string[];
  lightLevel: string;
  doorState: string;
  flagged: boolean;
};

export type ReplayUiModel = {
  summary: {
    title: string;
    subtitle: string;
    winnerLabel: string;
  };
  frameIndex: number;
  totalFrames: number;
  currentFrame: {
    tick: number;
    phaseLabel: string;
  };
  stageRooms: ReplayRoomStage[];
  castCards: CastCard[];
  evidenceCards: EvidenceCard[];
  trustSeries: ReplaySignalPoint[];
  suspicionSeries: ReplaySignalPoint[];
  promiseLedger: ReplayLedgerEntry[];
  highlightMarkers: ReplayHighlightMarker[];
  exportPayload: {
    replayJson: string;
    highlightsJson: string;
  };
};

const MEETING_PHASE_IDS = new Set<PhaseId>([
  "report",
  "meeting",
  "vote",
  "reveal",
]);

const PHASE_LABELS: Record<PhaseId, string> = {
  intro: "Role Reveal",
  roam: "Roam",
  report: "Body Report",
  meeting: "Meeting",
  vote: "Vote",
  reveal: "Verdict",
  resolution: "Aftermath",
  reflection: "Reflection",
};

const ROLE_REVEAL_COPY: Record<RoleId, { title: string; subtitle: string }> = {
  shadow: {
    title: "You are a Shadow",
    subtitle:
      "Stay credible, seed confusion, and leave the Household chasing ghosts.",
  },
  investigator: {
    title: "You are the Investigator",
    subtitle:
      "Read the room, turn clues into leverage, and expose contradictions without overplaying your hand.",
  },
  steward: {
    title: "You are the Steward",
    subtitle:
      "Anchor the room, create public alibis, and keep frightened witnesses coherent.",
  },
  household: {
    title: "You are Household",
    subtitle:
      "Work the manor, watch the timing, and survive long enough to name the right culprit.",
  },
};

const OBJECTIVE_COPY: Record<PhaseId, { label: string; detail: string }> = {
  intro: {
    label: "Masks descend over the manor",
    detail:
      "Read the cast, steady the room, and prepare to move when the storm lets go.",
  },
  roam: {
    label: "Stabilize the estate",
    detail:
      "Build alibis through visible work, keep sight lines, and do not hand the Shadows empty corridors.",
  },
  report: {
    label: "Lock the scene",
    detail:
      "Gather first impressions while the timeline is still fresh and fear has not rewritten it.",
  },
  meeting: {
    label: "Control the narrative",
    detail:
      "Use evidence, pressure, and reassurance carefully. The room will remember who sounded certain too early.",
  },
  vote: {
    label: "Commit to a verdict",
    detail:
      "A rushed vote hands the manor away. A timid vote gives the Shadows another round.",
  },
  reveal: {
    label: "Absorb the fallout",
    detail:
      "Credibility shifts here. Every correct warning and every bad push changes the next room.",
  },
  resolution: {
    label: "The night writes its final story",
    detail:
      "Review the damage, the alliances, and the moments that broke the manor open.",
  },
  reflection: {
    label: "Hold the room in memory",
    detail:
      "Revisit who kept their nerve, who broke trust, and where the tide turned.",
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roomLabelById = Object.fromEntries(
  MANOR_V1_MAP.rooms.map((room) => [room.id, room.label]),
) as Record<RoomId, string>;

const formatPhaseLabel = (phaseId: PhaseId) => PHASE_LABELS[phaseId];

const hashPalette = (value: string) => {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const hueA = hash % 360;
  const hueB = (hueA + 42) % 360;

  return {
    colorA: `hsl(${hueA} 72% 58%)`,
    colorB: `hsl(${hueB} 74% 68%)`,
  };
};

const describePublicEvent = (event: MatchEvent) => {
  switch (event.eventId) {
    case "body-reported":
      return {
        tag: "Report",
        title: `${event.playerId} found ${event.targetPlayerId}`,
        detail: `${event.playerId} called the room into ${roomLabelById[event.roomId]}.`,
      };
    case "meeting-called":
      return {
        tag: "Alarm",
        title: `${event.playerId} rang the bell`,
        detail: event.reason,
      };
    case "discussion-turn":
      return {
        tag: "Claim",
        title: `${event.playerId} took the floor`,
        detail: event.text,
      };
    case "vote-cast":
      return {
        tag: "Vote",
        title: `${event.playerId} voted ${event.targetPlayerId ?? "skip"}`,
        detail: "The room edges closer to a verdict.",
      };
    case "player-exiled":
      return {
        tag: "Reveal",
        title: `${event.playerId} was exiled`,
        detail: "Trust immediately rebalances around the result.",
      };
    case "task-completed":
      return {
        tag: "Task",
        title: `${event.playerId} completed ${event.taskId}`,
        detail: `${roomLabelById[event.roomId]} now carries a cleaner alibi trail.`,
      };
    case "sabotage-triggered":
      return {
        tag: "Sabotage",
        title: `${event.playerId} triggered ${event.actionId}`,
        detail:
          "The manor environment changed, and every timeline around it just got harder to trust.",
      };
    case "clue-discovered":
      return {
        tag: "Clue",
        title: `${event.playerId} found ${event.clueId}`,
        detail: `${roomLabelById[event.roomId]} now holds a sharper line of inquiry.`,
      };
    case "phase-changed":
      return {
        tag: "Phase",
        title: `${formatPhaseLabel(event.toPhaseId)} begins`,
        detail: `${formatPhaseLabel(event.fromPhaseId)} gives way to ${formatPhaseLabel(event.toPhaseId)}.`,
      };
    default:
      return {
        tag: "Event",
        title: event.eventId,
        detail: "The manor remembers every public move.",
      };
  }
};

export const buildContradictionMarkers = (
  events: readonly MatchEvent[],
  snapshot: MatchSnapshot | null,
): ContradictionMarker[] => {
  const targetsByPlayer = new Map<PlayerId, Set<PlayerId>>();

  for (const event of events) {
    if (event.eventId !== "discussion-turn" || !event.targetPlayerId) {
      continue;
    }

    const targets = targetsByPlayer.get(event.playerId) ?? new Set<PlayerId>();
    targets.add(event.targetPlayerId);
    targetsByPlayer.set(event.playerId, targets);
  }

  return [...targetsByPlayer.entries()]
    .filter(([, targets]) => targets.size > 1)
    .map(([playerId, targets]) => ({
      playerId,
      displayName:
        snapshot?.players.find((player) => player.id === playerId)
          ?.displayName ?? playerId,
      count: targets.size - 1,
      reason: "Shifted accusation targets within the same pressure window.",
    }))
    .sort((left, right) => right.count - left.count);
};

const buildTimerLabel = (snapshot: MatchSnapshot | null) => {
  if (!snapshot) {
    return "Awaiting authoritative state";
  }

  if (snapshot.phaseId === "reflection") {
    return "Cooling down";
  }

  const duration = phaseDurationById(snapshot.config, snapshot.phaseId);

  if (duration === null) {
    return "Open-ended";
  }

  const phaseBoundary = [...snapshot.recentEvents]
    .reverse()
    .find(
      (event) =>
        event.eventId === "phase-changed" &&
        event.toPhaseId === snapshot.phaseId &&
        event.tick <= snapshot.tick,
    );
  const phaseStartedAtTick = phaseBoundary?.tick ?? snapshot.tick;
  const remaining = Math.max(
    0,
    duration - (snapshot.tick - phaseStartedAtTick),
  );

  return `${remaining}s remaining`;
};

const buildTranscript = (events: readonly MatchEvent[]) =>
  events
    .slice(-6)
    .reverse()
    .map((event) => describePublicEvent(event).title);

const buildConfessionalBeat = (
  events: readonly MatchEvent[],
): ConfessionalBeat | null => {
  const keyEvent = [...events]
    .reverse()
    .find((event) =>
      [
        "body-reported",
        "player-exiled",
        "sabotage-triggered",
        "discussion-turn",
      ].includes(event.eventId),
    );

  if (!keyEvent) {
    return null;
  }

  if (keyEvent.eventId === "body-reported") {
    return {
      title: "Confessional",
      quote: `${keyEvent.playerId} dragged the whole room into ${roomLabelById[keyEvent.roomId]}.`,
      detail:
        "This is where alibis begin to harden and panic starts making liars sound sincere.",
    };
  }

  if (keyEvent.eventId === "player-exiled") {
    return {
      title: "Confessional",
      quote: `${keyEvent.playerId} took the verdict alone.`,
      detail:
        "Who pushed hardest matters almost as much as whether the vote was right.",
    };
  }

  if (keyEvent.eventId === "sabotage-triggered") {
    return {
      title: "Confessional",
      quote: `${keyEvent.actionId} changed the geometry of trust.`,
      detail: "Environmental pressure turns small doubts into public momentum.",
    };
  }

  if (keyEvent.eventId === "discussion-turn") {
    return {
      title: "Confessional",
      quote: keyEvent.text,
      detail:
        "A single sentence can anchor the room or fracture it for the rest of the match.",
    };
  }

  return null;
};

const buildLiveAlerts = (state: ClientGameState) => {
  const alerts: string[] = [];

  if (state.lastValidationError) {
    alerts.push(state.lastValidationError.message);
  }

  for (const room of state.snapshot?.rooms ?? []) {
    if (room.lightLevel === "blackout") {
      alerts.push(`${roomLabelById[room.roomId]} is under blackout.`);
    }

    if (room.doorState !== "open") {
      alerts.push(
        `${roomLabelById[room.roomId]} is ${room.doorState.replace("-", " ")}.`,
      );
    }
  }

  return alerts.slice(0, 4);
};

const buildRoleReveal = (state: ClientGameState): RoleRevealModel | null => {
  if (!state.privateState) {
    return null;
  }

  const copy = ROLE_REVEAL_COPY[state.privateState.role];
  const knownAllyLabels = state.privateState.knownAllyPlayerIds.map(
    (playerId) =>
      state.snapshot?.players.find((player) => player.id === playerId)
        ?.displayName ?? playerId,
  );

  return {
    role: state.privateState.role,
    title: copy.title,
    subtitle: copy.subtitle,
    knownAllyLabels,
  };
};

const buildRoomCards = (state: ClientGameState, actorRoomId: RoomId | null) =>
  (state.snapshot?.rooms ?? [])
    .map((room) => ({
      roomId: room.roomId,
      label: roomLabelById[room.roomId],
      occupantCount: room.occupantIds.length,
      taskCount: room.taskIds.length,
      lightLevel: room.lightLevel,
      doorState: room.doorState,
      isCurrent: actorRoomId === room.roomId,
      isFlagged: room.lightLevel !== "lit" || room.doorState !== "open",
    }))
    .sort((left, right) =>
      left.isCurrent === right.isCurrent ? 0 : left.isCurrent ? -1 : 1,
    );

const buildCastCards = (
  snapshot: MatchSnapshot | null,
  contradictions: readonly ContradictionMarker[],
  options?: { roleVisible?: boolean; roleByPlayerId?: Map<PlayerId, RoleId> },
): CastCard[] =>
  (snapshot?.players ?? [])
    .map((player) => {
      const contradiction = contradictions.find(
        (marker) => marker.playerId === player.id,
      );
      const palette = hashPalette(player.id);
      const role =
        options?.roleVisible === true
          ? options.roleByPlayerId?.get(player.id)
          : undefined;

      return {
        id: player.id,
        displayName: player.displayName,
        roomLabel: player.roomId
          ? roomLabelById[player.roomId]
          : "Off the floor",
        status: player.status,
        suspicion: player.publicImage.suspiciousness,
        credibility: player.publicImage.credibility,
        emotionLabel: player.emotion.label,
        bodyLanguage: player.bodyLanguage,
        contradictionCount: contradiction?.count ?? 0,
        colorA: palette.colorA,
        colorB: palette.colorB,
        ...(role ? { role } : {}),
        roleVisible: options?.roleVisible ?? false,
      };
    })
    .sort((left, right) => right.suspicion - left.suspicion);

const isMatchOver = (snapshot: MatchSnapshot | null) =>
  snapshot?.phaseId === "resolution";

const buildPostMatchModel = (state: ClientGameState): PostMatchModel | null => {
  if (!isMatchOver(state.snapshot)) {
    return null;
  }

  const aliveCount =
    state.snapshot?.players.filter((player) => player.status === "alive")
      .length ?? 0;
  const taskCompletedCount =
    state.snapshot?.tasks.filter((task) => task.status === "completed")
      .length ?? 0;
  const reportCount = state.snapshot?.recentEvents.filter(
    (event) => event.eventId === "body-reported",
  ).length;

  return {
    headline: "Aftermath dossier",
    stats: [
      { label: "Survivors", value: String(aliveCount) },
      { label: "Tasks restored", value: String(taskCompletedCount) },
      { label: "Recent reports", value: String(reportCount ?? 0) },
      {
        label: "View",
        value: state.actorId ? "Player archive" : "Spectator archive",
      },
    ],
  };
};

export const deriveLiveUiModel = (
  state: ClientGameState | null,
  surfaceMode: PlaySurfaceMode,
): LiveUiModel => {
  const snapshot = state?.snapshot ?? null;
  const contradictions = buildContradictionMarkers(
    snapshot?.recentEvents ?? [],
    snapshot,
  );
  const analyticsUnlocked =
    surfaceMode !== "player" &&
    (surfaceMode === "replay" || isMatchOver(snapshot));
  const actorRoomId =
    state?.actorId && snapshot
      ? (snapshot.players.find((player) => player.id === state.actorId)
          ?.roomId ?? null)
      : null;
  const currentObjective = snapshot
    ? OBJECTIVE_COPY[snapshot.phaseId]
    : OBJECTIVE_COPY.intro;

  return {
    surfaceMode,
    analyticsUnlocked,
    showLobby:
      !snapshot ||
      state?.status === "connecting" ||
      (snapshot.phaseId === "intro" && surfaceMode !== "replay"),
    phaseLabel: snapshot ? formatPhaseLabel(snapshot.phaseId) : "Connecting",
    timerLabel: buildTimerLabel(snapshot),
    objective: currentObjective.label,
    objectiveDetail: currentObjective.detail,
    alerts: state ? buildLiveAlerts(state) : [],
    roomCards: state ? buildRoomCards(state, actorRoomId) : [],
    castCards: buildCastCards(snapshot, contradictions),
    evidenceCards: (snapshot?.recentEvents ?? [])
      .slice(-4)
      .reverse()
      .map((event) => ({
        id: event.id,
        ...describePublicEvent(event),
      })),
    transcript: buildTranscript(snapshot?.recentEvents ?? []),
    meeting:
      snapshot && MEETING_PHASE_IDS.has(snapshot.phaseId)
        ? {
            timerLabel: buildTimerLabel(snapshot),
            headline: `${formatPhaseLabel(snapshot.phaseId)} pressure chamber`,
            portraits: buildCastCards(snapshot, contradictions),
            evidenceCards: (snapshot.recentEvents ?? [])
              .slice(-6)
              .reverse()
              .map((event) => ({
                id: event.id,
                ...describePublicEvent(event),
              })),
            contradictionMarkers: contradictions,
          }
        : null,
    confessional: buildConfessionalBeat(snapshot?.recentEvents ?? []),
    roleReveal:
      surfaceMode === "player" && snapshot?.phaseId === "intro" && state
        ? buildRoleReveal(state)
        : null,
    postMatch: state ? buildPostMatchModel(state) : null,
  };
};

const averageRelationshipMetric = (
  frame: SavedReplayEnvelope["replay"]["frames"][number],
  key: "trust" | "suspectScore",
) => {
  let total = 0;
  let count = 0;

  for (const player of frame.players) {
    const relationships = Object.values(player.relationships ?? {});

    for (const relationship of relationships) {
      total += relationship[key] ?? 0;
      count += 1;
    }
  }

  return count === 0 ? 0 : total / count;
};

const buildReplaySeries = (
  replay: SavedReplayEnvelope,
  key: "trust" | "suspectScore",
) =>
  replay.replay.frames.map((frame) => ({
    tick: frame.tick,
    value: averageRelationshipMetric(frame, key),
  }));

const buildReplayEvidenceCards = (
  events: SavedReplayEnvelope["replay"]["frames"][number]["events"],
) =>
  events
    .slice(-5)
    .reverse()
    .map((event) => {
      switch (event.type) {
        case "action-recorded":
          return {
            id: `${event.sequence}`,
            tag: event.proposal.actionId,
            title: `${event.proposal.actorId} used ${event.proposal.actionId}`,
            detail:
              "speech" in event.proposal && event.proposal.speech
                ? event.proposal.speech.text
                : "The manor log marked the move as part of the official replay.",
          };
        case "phase-changed":
          return {
            id: `${event.sequence}`,
            tag: "phase",
            title: `${formatPhaseLabel(event.toPhaseId as PhaseId)} engaged`,
            detail: `Transitioned from ${event.fromPhaseId} to ${event.toPhaseId}.`,
          };
        case "vote-resolved":
          return {
            id: `${event.sequence}`,
            tag: "vote",
            title: event.exiledPlayerId
              ? `${event.exiledPlayerId} was exiled`
              : "The room skipped the exile",
            detail:
              "A single tally can reset the social hierarchy for the next round.",
          };
        default:
          return {
            id: `${event.sequence}`,
            tag: event.type,
            title: event.type,
            detail: "Recorded in the official deterministic log.",
          };
      }
    });

export const createPromiseLedger = (
  replay: SavedReplayEnvelope,
): ReplayLedgerEntry[] => {
  const entries: ReplayLedgerEntry[] = [];
  const outstanding = new Map<string, number[]>();
  const nameByPlayerId = new Map(
    replay.replay.frames[0]?.players.map((player) => [
      player.id,
      player.displayName,
    ]) ?? [],
  );

  for (const event of replay.replay.events) {
    if (event.type !== "action-recorded") {
      continue;
    }

    if (
      event.proposal.actionId === "promise" ||
      event.proposal.actionId === "confide"
    ) {
      const key = `${event.proposal.actorId}:${event.proposal.targetPlayerId}`;
      const entryIndex =
        entries.push({
          id: `${event.proposal.actionId}-${event.sequence}`,
          kind: event.proposal.actionId === "promise" ? "promise" : "confide",
          actorId: event.proposal.actorId,
          actorName:
            nameByPlayerId.get(event.proposal.actorId) ??
            event.proposal.actorId,
          targetId: event.proposal.targetPlayerId,
          targetName:
            nameByPlayerId.get(event.proposal.targetPlayerId) ??
            event.proposal.targetPlayerId,
          tick: event.tick,
          status: "kept",
          resolution:
            event.proposal.actionId === "promise"
              ? "Held through the rest of the match."
              : "The alliance survived the night.",
        }) - 1;
      const pendingIndices = outstanding.get(key) ?? [];
      pendingIndices.push(entryIndex);
      outstanding.set(key, pendingIndices);
      continue;
    }

    if (
      event.proposal.actionId !== "vote-player" &&
      event.proposal.actionId !== "eliminate"
    ) {
      continue;
    }

    const key = `${event.proposal.actorId}:${event.proposal.targetPlayerId}`;
    const pendingIndices = outstanding.get(key);

    if (!pendingIndices || pendingIndices.length === 0) {
      continue;
    }

    for (const index of pendingIndices) {
      const entry = entries[index];

      if (!entry) {
        continue;
      }

      entry.status = "broken";
      entry.resolution =
        event.proposal.actionId === "vote-player"
          ? "Broken when the actor voted against the target."
          : "Broken when the actor eliminated the target.";
    }

    outstanding.delete(key);
  }

  return entries;
};

const buildReplayRoomStage = (
  frame: SavedReplayEnvelope["replay"]["frames"][number],
) => {
  const roomStateById = new Map(
    frame.rooms.map((room) => [room.roomId as RoomId, room]),
  );

  return MANOR_V1_MAP.rooms.map((room) => {
    const roomState = roomStateById.get(room.id);
    const occupants = frame.players
      .filter(
        (player) => player.roomId === room.id && player.status === "alive",
      )
      .map((player) => player.displayName);
    const flagged = frame.events.some((event) => {
      if (event.type !== "action-recorded") {
        return false;
      }

      if ("targetRoomId" in event.proposal) {
        return event.proposal.targetRoomId === room.id;
      }

      return false;
    });

    return {
      roomId: room.id,
      label: room.label,
      occupants,
      lightLevel: roomState?.lightLevel ?? "lit",
      doorState: roomState?.doorState ?? "open",
      flagged,
    };
  });
};

const buildReplayCastCards = (
  replay: SavedReplayEnvelope,
  frame: SavedReplayEnvelope["replay"]["frames"][number],
) => {
  const roleByPlayerId = new Map(
    replay.replay.frames[0]?.players.map((player) => [
      player.id,
      player.role,
    ]) ?? [],
  );
  const snapshot: MatchSnapshot = {
    matchId: replay.replay.matchId,
    phaseId: frame.phaseId as PhaseId,
    tick: frame.tick,
    config: replay.replay.config,
    players: frame.players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      roomId: player.roomId,
      status: player.status,
      connected: true,
      publicImage: player.publicImage ?? {
        credibility: 0.5,
        suspiciousness: player.role === "shadow" ? 0.6 : 0.3,
      },
      emotion: player.emotion ?? {
        pleasure: 0,
        arousal: player.status === "alive" ? 0.2 : -0.2,
        dominance: player.role === "shadow" ? 0.2 : 0,
        label: player.status === "alive" ? "calm" : "shaken",
        intensity: player.status === "alive" ? 0.35 : 0.55,
      },
      bodyLanguage:
        player.emotion?.label === "afraid" || player.emotion?.label === "shaken"
          ? "shaken"
          : player.emotion?.label === "confident"
            ? "confident"
            : (player.emotion?.intensity ?? 0.35) > 0.6
              ? "agitated"
              : "calm",
      completedTaskCount: player.completedTaskIds?.length ?? 0,
    })),
    rooms: frame.rooms,
    tasks: frame.tasks,
    recentEvents: [],
  };

  return buildCastCards(snapshot, [], {
    roleVisible: true,
    roleByPlayerId,
  });
};

export const deriveReplayUiModel = (
  replay: SavedReplayEnvelope,
  requestedFrameIndex: number,
): ReplayUiModel => {
  const frameIndex = clamp(
    requestedFrameIndex,
    0,
    Math.max(0, replay.replay.frames.length - 1),
  );
  const frame = replay.replay.frames[frameIndex] ?? replay.replay.frames[0];

  if (!frame) {
    throw new Error("Replay is missing frames.");
  }

  const winnerLabel = replay.summary.winner
    ? `${replay.summary.winner.team === "shadow" ? "Shadows" : "Household"} won by ${replay.summary.winner.reason.replaceAll("-", " ")}`
    : "Winner unavailable";

  return {
    summary: {
      title: "Replay theater",
      subtitle: `Seed ${replay.summary.seed} / ${replay.summary.totalHighlights} highlight moments`,
      winnerLabel,
    },
    frameIndex,
    totalFrames: replay.replay.frames.length,
    currentFrame: {
      tick: frame.tick,
      phaseLabel: formatPhaseLabel(frame.phaseId as PhaseId),
    },
    stageRooms: buildReplayRoomStage(frame),
    castCards: buildReplayCastCards(replay, frame),
    evidenceCards: buildReplayEvidenceCards(frame.events),
    trustSeries: buildReplaySeries(replay, "trust"),
    suspicionSeries: buildReplaySeries(replay, "suspectScore"),
    promiseLedger: createPromiseLedger(replay),
    highlightMarkers: replay.highlights,
    exportPayload: {
      replayJson: JSON.stringify(replay, null, 2),
      highlightsJson: JSON.stringify(replay.highlights, null, 2),
    },
  };
};

export const readPlayShellConfig = (
  defaults: PlayShellDefaults,
  search: string,
): PlayShellConfig => {
  const params = new URLSearchParams(search);
  const surfaceParam = params.get("view");
  const actorId =
    params.get("playerId") ?? defaults.defaultActorId ?? undefined;
  const modeParam = params.get("mode");
  const surfaceMode: PlaySurfaceMode =
    surfaceParam === "replay"
      ? "replay"
      : surfaceParam === "spectator"
        ? "spectator"
        : actorId
          ? "player"
          : "spectator";

  if (surfaceMode === "replay") {
    return {
      connection: null,
      surfaceMode,
    };
  }

  const mode =
    modeParam === "live" || modeParam === "mock"
      ? modeParam
      : defaults.defaultMode;
  const requestedActorId = surfaceMode === "spectator" ? undefined : actorId;

  if (mode === "live") {
    const roomId = params.get("roomId") ?? defaults.defaultRoomId;

    if (!roomId) {
      return {
        surfaceMode,
        connection: {
          mode: "mock",
          roomId: "mock-manor-room",
          ...(requestedActorId ? { actorId: requestedActorId } : {}),
        },
      };
    }

    return {
      surfaceMode,
      connection: {
        mode: "live",
        serverUrl: params.get("serverUrl") ?? defaults.defaultServerUrl,
        roomId,
        ...(requestedActorId ? { actorId: requestedActorId } : {}),
      },
    };
  }

  return {
    surfaceMode,
    connection: {
      mode: "mock",
      roomId: params.get("roomId") ?? "mock-manor-room",
      ...(requestedActorId ? { actorId: requestedActorId } : {}),
    },
  };
};
