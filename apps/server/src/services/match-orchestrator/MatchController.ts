import {
  advanceServerTick,
  bootstrapMatch,
  buildReplayLog,
  dispatchAction,
  type EngineState,
  validateAction,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  ClientMatchProposeActionMessage,
  MatchEvent,
  PlayerId,
} from "@blackout-manor/shared";

import {
  createMatchSnapshot,
  createValidationError,
  mapEngineEventsToMatchEvents,
} from "./matchAdapters";
import {
  createManagedMatchConfig,
  createManagedMatchId,
  createManagedMatchPlayers,
} from "./matchFactory";
import type {
  MatchActionResult,
  MatchControllerUpdate,
  MatchRoomCreateOptions,
} from "./types";

export class MatchController {
  readonly #connectedByPlayerId: Partial<Record<PlayerId, boolean>>;
  readonly #botOnly: boolean;
  #recentEvents: MatchEvent[];
  #state: EngineState;
  #paused = false;
  #terminated = false;

  constructor(options: Omit<MatchRoomCreateOptions, "runtime">) {
    const seed = options.seed ?? 17;
    const matchId = createManagedMatchId(seed, options.matchId);
    const speedProfileId =
      options.speedProfileId ??
      (options.botOnly ? "headless-regression" : "showcase");
    const config = createManagedMatchConfig(matchId, seed, speedProfileId);
    const players = createManagedMatchPlayers({
      seed,
      ...(typeof options.botOnly === "boolean"
        ? { botOnly: options.botOnly }
        : {}),
      ...(options.players ? { players: options.players } : {}),
    });
    const bootstrapped = bootstrapMatch(config, players);

    this.#state = bootstrapped.state;
    this.#recentEvents = [];
    this.#botOnly = options.botOnly ?? players.every((player) => player.isBot);
    this.#connectedByPlayerId = Object.fromEntries(
      this.#state.players.map((player) => [player.id, player.isBot]),
    );
  }

  get matchId() {
    return this.#state.config.matchId;
  }

  get state() {
    return this.#state;
  }

  get botOnly() {
    return this.#botOnly;
  }

  get paused() {
    return this.#paused;
  }

  get terminated() {
    return this.#terminated;
  }

  get completed() {
    return this.#state.phaseId === "resolution" || this.#state.winner !== null;
  }

  get availableHumanPlayerIds() {
    return this.#state.players
      .filter(
        (player) =>
          !player.isBot &&
          !this.#connectedByPlayerId[player.id] &&
          player.status === "alive",
      )
      .map((player) => player.id);
  }

  get botPlayerIds() {
    return this.#state.players
      .filter((player) => player.isBot && player.status === "alive")
      .map((player) => player.id);
  }

  getSnapshot() {
    return createMatchSnapshot(
      this.#state,
      this.#recentEvents,
      this.#connectedByPlayerId,
    );
  }

  setPlayerConnected(
    playerId: PlayerId,
    connected: boolean,
  ): MatchControllerUpdate {
    this.#connectedByPlayerId[playerId] = connected;

    return {
      snapshot: this.getSnapshot(),
      recentEvents: [],
    };
  }

  pause() {
    this.#paused = true;
    return this.getSnapshot();
  }

  resume() {
    this.#paused = false;
    return this.getSnapshot();
  }

  terminate() {
    this.#terminated = true;
    return this.getSnapshot();
  }

  createReplayLog() {
    return buildReplayLog(this.#state);
  }

  handleClientProposal(
    clientPlayerId: PlayerId,
    message: ClientMatchProposeActionMessage,
  ): MatchActionResult {
    if (message.matchId !== this.matchId) {
      return {
        ok: false,
        error: createValidationError(
          "invalid-match",
          "This intent targets the wrong match.",
          [`Expected ${this.matchId} but received ${message.matchId}.`],
        ),
      };
    }

    return this.submitProposal(clientPlayerId, message.proposal);
  }

  submitProposal(
    actorId: PlayerId,
    proposal: AgentActionProposal,
  ): MatchActionResult {
    if (this.#terminated) {
      return {
        ok: false,
        error: createValidationError(
          "match-terminated",
          "This match has already been terminated.",
        ),
      };
    }

    if (this.#paused) {
      return {
        ok: false,
        error: createValidationError(
          "simulation-paused",
          "This match is currently paused by the server.",
        ),
      };
    }

    if (this.completed) {
      return {
        ok: false,
        error: createValidationError(
          "match-complete",
          "This match has already ended.",
        ),
      };
    }

    if (proposal.actorId !== actorId) {
      return {
        ok: false,
        error: createValidationError(
          "actor-mismatch",
          "Clients may only submit intents for their own assigned player.",
          [`Assigned player: ${actorId}. Proposed actor: ${proposal.actorId}.`],
        ),
      };
    }

    const legality = validateAction(this.#state, proposal);

    if (!legality.isLegal) {
      return {
        ok: false,
        error: createValidationError(
          "illegal-action",
          "The requested intent is not legal in the current authoritative state.",
          [legality.reason],
        ),
      };
    }

    const previousState = this.#state;
    const transition = dispatchAction(this.#state, proposal);

    return {
      ok: true,
      update: this.#applyTransition(
        previousState,
        transition.state,
        transition.events,
      ),
    };
  }

  advanceTicks(steps = 1) {
    if (this.#terminated || this.#paused || this.completed) {
      return {
        snapshot: this.getSnapshot(),
        recentEvents: [],
      };
    }

    const previousState = this.#state;
    const transition = advanceServerTick(this.#state, steps);

    return this.#applyTransition(
      previousState,
      transition.state,
      transition.events,
    );
  }

  #applyTransition(
    previousState: EngineState,
    nextState: EngineState,
    engineEvents: EngineState["eventLog"],
  ): MatchControllerUpdate {
    this.#state = nextState;

    const matchEvents = mapEngineEventsToMatchEvents(
      engineEvents,
      previousState.players,
      nextState.players,
      previousState.tasks,
      nextState.tasks,
    );

    this.#recentEvents = [...this.#recentEvents, ...matchEvents].slice(-32);

    return {
      snapshot: this.getSnapshot(),
      recentEvents: matchEvents,
    };
  }
}
