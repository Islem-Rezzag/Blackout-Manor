import {
  MANOR_V1_MAP,
  SEASON_01_PERSONA_CARDS,
  SEASON_01_TASKS,
} from "@blackout-manor/content";
import {
  BODY_LANGUAGE_IDS,
  ClientMatchProposeActionMessageSchema,
  type ClientMessage,
  ClientPingMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
  DEFAULT_TIMINGS,
  EMOTION_LABEL_IDS,
  type MatchConfig,
  type MatchEvent,
  type MatchPrivateState,
  type MatchSnapshot,
  MatchSnapshotSchema,
  type PlayerId,
  PROTOCOL_VERSION,
  type PublicPlayerState,
  type ReplayFrame,
  ReplayFrameSchema,
  type RoleId,
  type RoomId,
  type RoomState,
  ServerHelloMessageSchema,
  ServerMatchEventMessageSchema,
  ServerMatchPrivateStateMessageSchema,
  ServerMatchSnapshotMessageSchema,
  type ServerMessage,
  ServerReplayChunkMessageSchema,
  ServerValidationErrorMessageSchema,
  type TaskState,
  type TeamId,
} from "@blackout-manor/shared";

import type { MatchConnection } from "./types";

type MockConnectionOptions = {
  roomId?: string;
  actorId?: PlayerId;
  seed?: number;
  tickMs?: number;
};

type MockMutableState = {
  matchId: string;
  tick: number;
  phaseId: MatchSnapshot["phaseId"];
  config: MatchConfig;
  players: PublicPlayerState[];
  tasks: TaskState[];
  events: MatchEvent[];
};

type MockRoleAssignment = {
  role: RoleId;
  team: TeamId;
};

const DEFAULT_TICK_MS = 1200;
const MAX_RECENT_EVENTS = 24;
const MOCK_ROOM_ID = "mock-manor-room";
const MOCK_MATCH_ID = "mock-manor-match";
const PLAYER_ROUTE = MANOR_V1_MAP.rooms.map((room) => room.id);

const createRng = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current += 0x6d2b79f5;
    let next = current;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pickFrom = <TValue>(values: readonly TValue[], index: number) => {
  if (values.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }

  const value =
    values[((index % values.length) + values.length) % values.length];

  if (value === undefined) {
    throw new Error("Deterministic pick resolved to an undefined value.");
  }

  return value;
};

const createConfig = (seed: number, matchId: string): MatchConfig => ({
  matchId,
  seed,
  speedProfileId: "showcase",
  playerCount: 10,
  officialPublicMode: true,
  modelPackId: "official-dev-mock-pack",
  allowPrivateWhispers: true,
  roomIds: MANOR_V1_MAP.rooms.map((room) => room.id),
  taskIds: SEASON_01_TASKS.map((task) => task.id),
  roleDistribution: {
    shadow: 2,
    investigator: 1,
    steward: 1,
    household: 6,
  },
  timings: DEFAULT_TIMINGS.showcase,
});

const createEmotion = (
  tick: number,
  intensity: number,
  labelIndex: number,
) => ({
  pleasure: clamp(0.2 + intensity * 0.3, -1, 1),
  arousal: clamp(0.15 + intensity * 0.55, -1, 1),
  dominance: clamp(-0.1 + intensity * 0.4, -1, 1),
  label: pickFrom(EMOTION_LABEL_IDS, labelIndex),
  intensity: clamp(intensity, 0, 1),
  updatedAtTick: tick,
});

const createPublicPlayer = (index: number, tick: number): PublicPlayerState => {
  const persona = SEASON_01_PERSONA_CARDS[index];
  const playerId = `player-${String(index + 1).padStart(2, "0")}` as PlayerId;
  const roomId = pickFrom(PLAYER_ROUTE, index);
  const suspiciousness = clamp(((index * 17) % 100) / 100, 0.12, 0.72);

  return {
    id: playerId,
    displayName: persona?.label ?? `Mask ${String(index + 1).padStart(2, "0")}`,
    roomId,
    status: "alive",
    connected: true,
    publicImage: {
      credibility: clamp(0.32 + index * 0.04, 0, 1),
      suspiciousness,
    },
    emotion: createEmotion(tick, 0.25 + suspiciousness * 0.4, index),
    bodyLanguage: pickFrom(BODY_LANGUAGE_IDS, index),
    completedTaskCount: 0,
  };
};

const createTasks = (): TaskState[] =>
  SEASON_01_TASKS.map((task) => ({
    taskId: task.id,
    roomId: task.roomId,
    kind: task.kind,
    status: "available",
    assignedPlayerIds: [],
    progress: 0,
  }));

const createRooms = (
  players: PublicPlayerState[],
  tasks: TaskState[],
): RoomState[] =>
  MANOR_V1_MAP.rooms.map((room) => ({
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

const createSnapshot = (state: MockMutableState): MatchSnapshot =>
  MatchSnapshotSchema.parse({
    matchId: state.matchId,
    phaseId: state.phaseId,
    tick: state.tick,
    config: state.config,
    players: state.players,
    rooms: createRooms(state.players, state.tasks),
    tasks: state.tasks,
    recentEvents: state.events.slice(-MAX_RECENT_EVENTS),
  });

const createBaseState = (
  seed: number,
  matchId = MOCK_MATCH_ID,
): MockMutableState => ({
  matchId,
  tick: 0,
  phaseId: "intro",
  config: createConfig(seed, matchId),
  players: Array.from({ length: 10 }, (_, index) =>
    createPublicPlayer(index, 0),
  ),
  tasks: createTasks(),
  events: [],
});

const createRoleAssignments = (
  players: PublicPlayerState[],
): Map<PlayerId, MockRoleAssignment> => {
  const roles: RoleId[] = [
    "shadow",
    "shadow",
    "investigator",
    "steward",
    "household",
    "household",
    "household",
    "household",
    "household",
    "household",
  ];

  return new Map(
    players.map((player, index) => [
      player.id,
      {
        role: roles[index] ?? "household",
        team: roles[index] === "shadow" ? "shadow" : "household",
      },
    ]),
  );
};

export class MockMatchConnection implements MatchConnection {
  readonly mode = "mock" as const;
  readonly roomId: string;
  readonly #listeners = new Set<(message: ServerMessage) => void>();
  readonly #errorListeners = new Set<(error: Error) => void>();
  readonly #actorId: PlayerId | null;
  readonly #tickMs: number;
  readonly #rng: () => number;
  readonly #roleAssignments: Map<PlayerId, MockRoleAssignment>;
  #state: MockMutableState;
  #replayFrames: ReplayFrame[] = [];
  #timer: ReturnType<typeof setInterval> | null = null;
  #disposed = false;

  constructor(options: MockConnectionOptions = {}) {
    this.roomId = options.roomId ?? MOCK_ROOM_ID;
    this.#actorId = options.actorId ?? ("player-01" as PlayerId);
    this.#tickMs = options.tickMs ?? DEFAULT_TICK_MS;
    this.#rng = createRng(options.seed ?? 17);
    this.#state = createBaseState(options.seed ?? 17);
    this.#roleAssignments = createRoleAssignments(this.#state.players);
  }

  async connect() {
    if (this.#disposed) {
      throw new Error("This mock connection has been disposed.");
    }

    this.#emit(
      ServerHelloMessageSchema.parse({
        type: "server.hello",
        protocolVersion: PROTOCOL_VERSION,
        serverTime: new Date().toISOString(),
        roomChannelId: "match",
      }),
    );
    this.#emitPrivateState();
    this.#emitSnapshot();

    if (!this.#timer) {
      this.#timer = setInterval(() => {
        try {
          this.#advanceTick();
        } catch (error) {
          this.#emitError(
            error instanceof Error
              ? error
              : new Error("Mock simulation tick failed."),
          );
        }
      }, this.#tickMs);
    }
  }

  async send(message: ClientMessage) {
    switch (message.type) {
      case "client.match.propose-action":
        this.#handleProposal(
          ClientMatchProposeActionMessageSchema.parse(message),
        );
        return;
      case "client.ping":
        ClientPingMessageSchema.parse(message);
        return;
      case "client.replay.request":
        this.#emitReplay(
          0,
          ClientReplayRequestMessageSchema.parse(message).replayId ??
            `replay-${this.#state.matchId}`,
        );
        return;
      case "client.replay.seek":
        {
          const replayRequest = ClientReplaySeekMessageSchema.parse(message);
          this.#emitReplay(replayRequest.tick, replayRequest.replayId);
        }
        return;
      default:
        this.#emitValidationError(
          "unsupported-message",
          `Mock mode does not support ${message.type}.`,
        );
    }
  }

  subscribe(listener: (message: ServerMessage) => void) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  onError(listener: (error: Error) => void) {
    this.#errorListeners.add(listener);
    return () => {
      this.#errorListeners.delete(listener);
    };
  }

  async disconnect() {
    this.#disposed = true;
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #handleProposal(
    message: ReturnType<typeof ClientMatchProposeActionMessageSchema.parse>,
  ) {
    if (message.matchId !== this.#state.matchId) {
      this.#emitValidationError(
        "match-mismatch",
        "Intent targeted the wrong match id.",
      );
      return;
    }

    if (message.proposal.actorId !== this.#actorId) {
      this.#emitValidationError(
        "actor-mismatch",
        "Mock mode only allows the local actor to send intents.",
      );
      return;
    }

    if (message.proposal.phaseId !== this.#state.phaseId) {
      this.#emitValidationError(
        "phase-mismatch",
        "Intent phase does not match the current snapshot.",
      );
      return;
    }

    if (message.proposal.actionId === "move") {
      this.#applyMove(message.proposal.targetRoomId);
      return;
    }

    if (message.proposal.actionId === "start-task") {
      this.#applyStartTask(message.proposal.taskId);
      return;
    }

    this.#emitValidationError(
      "unsupported-intent",
      `Mock mode supports move and start-task only, received ${message.proposal.actionId}.`,
    );
  }

  #applyMove(targetRoomId: RoomId) {
    if (this.#state.phaseId !== "roam") {
      this.#emitValidationError(
        "illegal-action",
        "Movement is only legal during roam in mock mode.",
      );
      return;
    }

    const actor = this.#state.players.find(
      (player) => player.id === this.#actorId,
    );

    if (!actor || actor.roomId === null) {
      this.#emitValidationError("actor-missing", "Local actor is unavailable.");
      return;
    }

    const currentRoom = MANOR_V1_MAP.rooms.find(
      (room) => room.id === actor.roomId,
    );

    if (
      !currentRoom?.neighboringRoomIds.some(
        (neighborRoomId) => neighborRoomId === targetRoomId,
      )
    ) {
      this.#emitValidationError(
        "illegal-action",
        "Target room is not adjacent to the actor.",
      );
      return;
    }

    actor.roomId = targetRoomId;
    actor.bodyLanguage = "defiant";
    actor.emotion = createEmotion(this.#state.tick, 0.42, this.#state.tick + 3);
    this.#emitSnapshot();
  }

  #applyStartTask(taskId: TaskState["taskId"]) {
    if (this.#state.phaseId !== "roam") {
      this.#emitValidationError(
        "illegal-action",
        "Tasks are only legal during roam in mock mode.",
      );
      return;
    }

    const actor = this.#state.players.find(
      (player) => player.id === this.#actorId,
    );
    const task = this.#state.tasks.find(
      (candidate) => candidate.taskId === taskId,
    );

    if (!actor || !task || actor.roomId !== task.roomId) {
      this.#emitValidationError(
        "illegal-action",
        "The local actor must be in the task room to start it.",
      );
      return;
    }

    task.status = "in-progress";
    task.assignedPlayerIds = [actor.id];
    task.progress = clamp(task.progress + 0.34, 0, 1);
    actor.completedTaskCount += task.progress >= 1 ? 1 : 0;
    this.#appendEvent({
      id: `mock-task-progress-${this.#state.tick}-${task.taskId}`,
      eventId: "task-progressed",
      tick: this.#state.tick,
      phaseId: this.#state.phaseId,
      playerId: actor.id,
      taskId: task.taskId,
      roomId: task.roomId,
      progress: task.progress,
    });

    if (task.progress >= 1) {
      task.status = "completed";
      this.#appendEvent({
        id: `mock-task-complete-${this.#state.tick}-${task.taskId}`,
        eventId: "task-completed",
        tick: this.#state.tick,
        phaseId: this.#state.phaseId,
        playerId: actor.id,
        taskId: task.taskId,
        roomId: task.roomId,
      });
    }

    this.#emitSnapshot();
  }

  #advanceTick() {
    this.#state.tick += 1;

    const cycleTick = this.#state.tick % 28;
    const previousPhase = this.#state.phaseId;
    if (cycleTick < 2) {
      this.#state.phaseId = "intro";
    } else if (cycleTick < 14) {
      this.#state.phaseId = "roam";
    } else if (cycleTick < 16) {
      this.#state.phaseId = "report";
    } else if (cycleTick < 21) {
      this.#state.phaseId = "meeting";
    } else if (cycleTick < 24) {
      this.#state.phaseId = "vote";
    } else if (cycleTick < 26) {
      this.#state.phaseId = "reveal";
    } else {
      this.#state.phaseId = "roam";
    }

    if (previousPhase !== this.#state.phaseId) {
      this.#appendEvent({
        id: `mock-phase-${this.#state.tick}`,
        eventId: "phase-changed",
        tick: this.#state.tick,
        phaseId: this.#state.phaseId,
        fromPhaseId: previousPhase,
        toPhaseId: this.#state.phaseId,
      });
    }

    if (this.#state.phaseId === "roam") {
      this.#advanceRoam();
    } else if (this.#state.phaseId === "meeting") {
      this.#advanceMeeting();
    } else if (this.#state.phaseId === "vote") {
      this.#advanceVote();
    } else if (this.#state.phaseId === "reveal") {
      this.#advanceReveal();
    }

    this.#emitSnapshot();
  }

  #advanceRoam() {
    for (const [index, player] of this.#state.players.entries()) {
      if (player.status !== "alive" || player.roomId === null) {
        continue;
      }

      const room = MANOR_V1_MAP.rooms.find(
        (candidate) => candidate.id === player.roomId,
      );
      const nextRoomId = room
        ? (pickFrom(
            room.neighboringRoomIds,
            Math.floor(this.#rng() * room.neighboringRoomIds.length),
          ) ?? player.roomId)
        : player.roomId;
      player.roomId = nextRoomId;
      player.bodyLanguage = pickFrom(
        BODY_LANGUAGE_IDS,
        index + this.#state.tick,
      );

      const suspicionShift =
        player.publicImage.suspiciousness + (this.#rng() - 0.5) * 0.08;
      player.publicImage.suspiciousness = clamp(suspicionShift, 0.08, 0.92);
      player.publicImage.credibility = clamp(
        player.publicImage.credibility + (this.#rng() - 0.5) * 0.05,
        0.1,
        0.95,
      );
      player.emotion = createEmotion(
        this.#state.tick,
        clamp(0.2 + this.#rng() * 0.55, 0, 1),
        index + this.#state.tick,
      );
    }

    const task = this.#state.tasks[this.#state.tick % this.#state.tasks.length];
    const worker = this.#state.players.find(
      (player) => player.status === "alive" && player.roomId === task?.roomId,
    );

    if (task && worker) {
      task.status = "in-progress";
      task.assignedPlayerIds = [worker.id];
      task.progress = clamp(task.progress + 0.2, 0, 1);
      worker.completedTaskCount += task.progress >= 1 ? 1 : 0;
      this.#appendEvent({
        id: `mock-progress-${this.#state.tick}-${task.taskId}`,
        eventId: "task-progressed",
        tick: this.#state.tick,
        phaseId: this.#state.phaseId,
        playerId: worker.id,
        taskId: task.taskId,
        roomId: task.roomId,
        progress: task.progress,
      });

      if (task.progress >= 1) {
        task.status = "completed";
        this.#appendEvent({
          id: `mock-complete-${this.#state.tick}-${task.taskId}`,
          eventId: "task-completed",
          tick: this.#state.tick,
          phaseId: this.#state.phaseId,
          playerId: worker.id,
          taskId: task.taskId,
          roomId: task.roomId,
        });
      }
    }
  }

  #advanceMeeting() {
    const speaker =
      this.#state.players[this.#state.tick % this.#state.players.length];
    const target =
      this.#state.players[(this.#state.tick + 3) % this.#state.players.length];

    if (!speaker || !target) {
      return;
    }

    this.#appendEvent({
      id: `mock-discussion-${this.#state.tick}`,
      eventId: "discussion-turn",
      tick: this.#state.tick,
      phaseId: "meeting",
      playerId: speaker.id,
      text:
        this.#state.tick % 2 === 0
          ? `I saw ${target.displayName} drift away from the ${target.roomId}.`
          : `${target.displayName} feels rehearsed. Compare the timing, not the panic.`,
      targetPlayerId: target.id,
    });
  }

  #advanceVote() {
    const voter =
      this.#state.players[this.#state.tick % this.#state.players.length];
    const target =
      this.#state.players[
        (this.#state.tick + 2) % this.#state.players.length
      ] ?? null;

    if (!voter) {
      return;
    }

    this.#appendEvent({
      id: `mock-vote-${this.#state.tick}-${voter.id}`,
      eventId: "vote-cast",
      tick: this.#state.tick,
      phaseId: "vote",
      playerId: voter.id,
      targetPlayerId: target?.id ?? null,
    });
  }

  #advanceReveal() {
    const target = this.#state.players.find(
      (player) => player.status === "alive",
    );

    if (!target) {
      return;
    }

    target.status = "exiled";
    target.roomId = null;
    this.#appendEvent({
      id: `mock-exile-${this.#state.tick}`,
      eventId: "player-exiled",
      tick: this.#state.tick,
      phaseId: "reveal",
      playerId: target.id,
    });
  }

  #appendEvent(event: MatchEvent) {
    this.#state.events.push(event);
    this.#state.events = this.#state.events.slice(-MAX_RECENT_EVENTS);
    this.#emit(
      ServerMatchEventMessageSchema.parse({
        type: "server.match.event",
        matchId: this.#state.matchId,
        event,
      }),
    );
  }

  #emitSnapshot() {
    const snapshot = createSnapshot(this.#state);
    const replayFrame = ReplayFrameSchema.parse({
      tick: snapshot.tick,
      phaseId: snapshot.phaseId,
      events: snapshot.recentEvents,
      players: snapshot.players,
      rooms: snapshot.rooms,
      tasks: snapshot.tasks,
    });
    const existingFrameIndex = this.#replayFrames.findIndex(
      (frame) => frame.tick === replayFrame.tick,
    );

    if (existingFrameIndex >= 0) {
      this.#replayFrames[existingFrameIndex] = replayFrame;
    } else {
      this.#replayFrames.push(replayFrame);
    }

    this.#emit(
      ServerMatchSnapshotMessageSchema.parse({
        type: "server.match.snapshot",
        match: snapshot,
      }),
    );
  }

  #emitValidationError(code: string, message: string) {
    this.#emit(
      ServerValidationErrorMessageSchema.parse({
        type: "server.validation-error",
        code,
        message,
        issues: [],
      }),
    );
  }

  #emitPrivateState() {
    if (!this.#actorId) {
      return;
    }

    const assignment = this.#roleAssignments.get(this.#actorId);

    if (!assignment) {
      return;
    }

    const privateState = {
      playerId: this.#actorId,
      role: assignment.role,
      team: assignment.team,
      knownAllyPlayerIds:
        assignment.role === "shadow"
          ? [...this.#roleAssignments.entries()]
              .filter(
                ([playerId, candidate]) =>
                  playerId !== this.#actorId && candidate.role === "shadow",
              )
              .map(([playerId]) => playerId)
          : [],
      revealedAtTick: this.#state.tick,
    } satisfies MatchPrivateState;

    this.#emit(
      ServerMatchPrivateStateMessageSchema.parse({
        type: "server.match.private-state",
        matchId: this.#state.matchId,
        privateState,
      }),
    );
  }

  #emitReplay(fromTick: number, replayId = `replay-${this.#state.matchId}`) {
    const frames = this.#replayFrames.filter((frame) => frame.tick >= fromTick);

    this.#emit(
      ServerReplayChunkMessageSchema.parse({
        type: "server.replay.chunk",
        replayId,
        matchId: this.#state.matchId,
        startIndex: 0,
        totalFrames: frames.length,
        isFinalChunk: true,
        frames,
      }),
    );
  }

  #emit(message: ServerMessage) {
    for (const listener of this.#listeners) {
      listener(message);
    }
  }

  #emitError(error: Error) {
    for (const listener of this.#errorListeners) {
      listener(error);
    }
  }
}
