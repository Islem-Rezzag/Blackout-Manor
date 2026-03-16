import {
  getNeighboringRooms,
  shuffleDeterministically,
  validateAction,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PlayerId,
  RoomId,
} from "@blackout-manor/shared";

import type { MatchController } from "../match-orchestrator/MatchController";

type SimulationMemory = {
  meetingKey: string | null;
  reportKey: string | null;
  meetingActors: Set<PlayerId>;
  reportActors: Set<PlayerId>;
  promisedTargets: Map<PlayerId, PlayerId>;
  confidedTargets: Map<PlayerId, PlayerId>;
};

const ROAM_ACTIONS_PER_TICK = 2;
const REPORT_ACTIONS_PER_TICK = 1;
const MEETING_ACTIONS_PER_TICK = 2;

const isAlive = (controller: MatchController, playerId: PlayerId) =>
  controller.state.players.some(
    (player) => player.id === playerId && player.status === "alive",
  );

const livingPlayers = (controller: MatchController) =>
  controller.state.players.filter((player) => player.status === "alive");

const playerIndex = (controller: MatchController, playerId: PlayerId) =>
  Math.max(
    0,
    controller.state.players.findIndex((player) => player.id === playerId),
  );

const openNeighbors = (controller: MatchController, roomId: RoomId) =>
  getNeighboringRooms(roomId, controller.state.servicePassageUnlocked).filter(
    (neighborId) =>
      controller.state.rooms.find((room) => room.roomId === neighborId)
        ?.doorState === "open",
  );

const createProposalBase = (
  controller: MatchController,
  actorId: PlayerId,
) => ({
  actorId,
  phaseId: controller.state.phaseId,
  confidence: 0.67,
  emotionalIntent: "confident" as const,
});

const isProposalLegal = (
  controller: MatchController,
  proposal: AgentActionProposal,
) => validateAction(controller.state, proposal).isLegal;

const findTaskForActor = (controller: MatchController, actorId: PlayerId) => {
  const actor = controller.state.players.find(
    (player) => player.id === actorId,
  );

  if (!actor || actor.roomId === null) {
    return null;
  }

  if (actor.activeTaskId) {
    const activeTask = controller.state.tasks.find(
      (task) => task.taskId === actor.activeTaskId,
    );

    if (
      activeTask &&
      activeTask.roomId === actor.roomId &&
      activeTask.status !== "completed" &&
      activeTask.status !== "blocked"
    ) {
      return activeTask;
    }
  }

  return controller.state.tasks.find(
    (task) =>
      task.roomId === actor.roomId &&
      !actor.completedTaskIds.includes(task.taskId) &&
      task.status !== "completed" &&
      task.status !== "blocked" &&
      (task.assignedPlayerIds.includes(actorId) ||
        task.assignedPlayerIds.length < (task.kind === "two-person" ? 2 : 1)),
  );
};

export class DeterministicBotOrchestrator {
  readonly #memory: SimulationMemory = {
    meetingKey: null,
    reportKey: null,
    meetingActors: new Set<PlayerId>(),
    reportActors: new Set<PlayerId>(),
    promisedTargets: new Map<PlayerId, PlayerId>(),
    confidedTargets: new Map<PlayerId, PlayerId>(),
  };

  constructor(private readonly controller: MatchController) {}

  runSteps(steps = 1) {
    let lastUpdate: ReturnType<MatchController["advanceTicks"]> = {
      snapshot: this.controller.getSnapshot(),
      recentEvents: [],
    };

    for (
      let step = 0;
      step < steps && !this.controller.completed && !this.controller.terminated;
      step += 1
    ) {
      lastUpdate = this.step();
    }

    return lastUpdate;
  }

  step() {
    if (
      this.controller.paused ||
      this.controller.completed ||
      this.controller.terminated
    ) {
      return {
        snapshot: this.controller.getSnapshot(),
        recentEvents: [],
      };
    }

    this.#syncMemory();

    if (this.controller.state.phaseId === "roam") {
      let actionsTaken = 0;

      for (const actorId of this.#actorOrder()) {
        if (
          this.controller.state.phaseId !== "roam" ||
          actionsTaken >= ROAM_ACTIONS_PER_TICK
        ) {
          break;
        }

        const proposal = this.#chooseRoamAction(actorId);

        if (!proposal) {
          continue;
        }

        const result = this.controller.submitProposal(actorId, proposal);

        if (!result.ok) {
          continue;
        }

        actionsTaken += 1;
        this.#syncMemory();
      }
    }

    if (this.controller.state.phaseId === "report") {
      let actionsTaken = 0;

      for (const actorId of this.#actorOrder()) {
        if (
          this.controller.state.phaseId !== "report" ||
          actionsTaken >= REPORT_ACTIONS_PER_TICK
        ) {
          break;
        }

        const proposal = this.#chooseReportAction(actorId);

        if (!proposal) {
          continue;
        }

        const result = this.controller.submitProposal(actorId, proposal);

        if (!result.ok) {
          continue;
        }

        actionsTaken += 1;
        this.#syncMemory();
      }
    }

    if (this.controller.state.phaseId === "meeting") {
      let actionsTaken = 0;

      for (const actorId of this.#actorOrder()) {
        if (
          this.controller.state.phaseId !== "meeting" ||
          actionsTaken >= MEETING_ACTIONS_PER_TICK
        ) {
          break;
        }

        const proposal = this.#chooseMeetingAction(actorId);

        if (!proposal) {
          continue;
        }

        const result = this.controller.submitProposal(actorId, proposal);

        if (!result.ok) {
          continue;
        }

        actionsTaken += 1;
        this.#syncMemory();
      }
    }

    if (this.controller.state.phaseId === "vote") {
      for (const actorId of this.#actorOrder()) {
        if (this.controller.state.phaseId !== "vote") {
          break;
        }

        const proposal = this.#chooseVoteAction(actorId);

        if (!proposal) {
          continue;
        }

        this.controller.submitProposal(actorId, proposal);
      }
    }

    return this.controller.advanceTicks(1);
  }

  #actorOrder() {
    return shuffleDeterministically(
      livingPlayers(this.controller).map((player) => player.id),
      this.controller.state.seed +
        this.controller.state.tick +
        this.controller.state.currentRound * 97,
    ).items;
  }

  #syncMemory() {
    const phaseKey = `${this.controller.state.phaseId}:${this.controller.state.phaseStartedAtTick}`;

    if (
      this.controller.state.phaseId === "meeting" &&
      this.#memory.meetingKey !== phaseKey
    ) {
      this.#memory.meetingKey = phaseKey;
      this.#memory.meetingActors = new Set<PlayerId>();
      this.#memory.promisedTargets = new Map<PlayerId, PlayerId>();
      this.#memory.confidedTargets = new Map<PlayerId, PlayerId>();
    }

    if (
      this.controller.state.phaseId === "report" &&
      this.#memory.reportKey !== phaseKey
    ) {
      this.#memory.reportKey = phaseKey;
      this.#memory.reportActors = new Set<PlayerId>();
    }

    if (this.controller.state.phaseId === "roam") {
      this.#memory.meetingKey = null;
      this.#memory.reportKey = null;
      this.#memory.meetingActors = new Set<PlayerId>();
      this.#memory.reportActors = new Set<PlayerId>();
      this.#memory.promisedTargets = new Map<PlayerId, PlayerId>();
      this.#memory.confidedTargets = new Map<PlayerId, PlayerId>();
    }
  }

  #chooseReportAction(actorId: PlayerId): AgentActionProposal | null {
    if (this.#memory.reportActors.has(actorId)) {
      return null;
    }

    const actor = this.controller.state.players.find(
      (player) => player.id === actorId,
    );

    if (!actor || actor.role !== "investigator" || actor.roomId === null) {
      return null;
    }

    const candidateActions: AgentActionProposal[] = [
      {
        ...createProposalBase(this.controller, actorId),
        actionId: "recover-clue",
        targetRoomId: actor.roomId,
      },
      {
        ...createProposalBase(this.controller, actorId),
        actionId: "dust-room",
        targetRoomId: actor.roomId,
      },
    ];

    for (const proposal of candidateActions) {
      if (!isProposalLegal(this.controller, proposal)) {
        continue;
      }

      this.#memory.reportActors.add(actorId);
      return proposal;
    }

    return null;
  }

  #chooseMeetingAction(actorId: PlayerId): AgentActionProposal | null {
    if (this.#memory.meetingActors.has(actorId)) {
      return null;
    }

    const actor = this.controller.state.players.find(
      (player) => player.id === actorId,
    );

    if (!actor) {
      return null;
    }

    const targets = livingPlayers(this.controller)
      .filter((player) => player.id !== actorId)
      .map((player) => player.id);

    if (targets.length === 0) {
      return null;
    }

    const targetPlayerId =
      targets[
        (playerIndex(this.controller, actorId) +
          this.controller.state.currentRound) %
          targets.length
      ];

    if (!targetPlayerId) {
      return null;
    }

    const proposals: AgentActionProposal[] = [];

    if (playerIndex(this.controller, actorId) % 2 === 0) {
      proposals.push({
        ...createProposalBase(this.controller, actorId),
        actionId: "promise",
        targetPlayerId,
        promiseText: "I will not vote against you this round.",
      });
    }

    if (playerIndex(this.controller, actorId) % 3 === 0) {
      proposals.push({
        ...createProposalBase(this.controller, actorId),
        actionId: "confide",
        targetPlayerId,
      });
    }

    proposals.push({
      ...createProposalBase(this.controller, actorId),
      actionId: "reassure",
      targetPlayerId,
    });

    for (const proposal of proposals) {
      if (!isProposalLegal(this.controller, proposal)) {
        continue;
      }

      this.#memory.meetingActors.add(actorId);

      if (proposal.actionId === "promise") {
        this.#memory.promisedTargets.set(actorId, proposal.targetPlayerId);
      }

      if (proposal.actionId === "confide") {
        this.#memory.confidedTargets.set(actorId, proposal.targetPlayerId);
      }

      return proposal;
    }

    return null;
  }

  #chooseRoamAction(actorId: PlayerId): AgentActionProposal | null {
    const actor = this.controller.state.players.find(
      (player) => player.id === actorId,
    );

    if (!actor || actor.roomId === null) {
      return null;
    }

    const reportableBodyId = (Object.entries(
      this.controller.state.bodyLocations,
    ).find(
      ([playerId, roomId]) =>
        roomId === actor.roomId &&
        !this.controller.state.reportedBodyIds.includes(playerId) &&
        isAlive(this.controller, actorId),
    )?.[0] ?? null) as PlayerId | null;

    if (reportableBodyId) {
      return {
        ...createProposalBase(this.controller, actorId),
        actionId: "report-body",
        discoveredPlayerId: reportableBodyId,
      };
    }

    if (actor.role === "shadow") {
      const eliminationTarget = livingPlayers(this.controller).find(
        (player) =>
          player.id !== actorId &&
          player.team === "household" &&
          player.roomId === actor.roomId &&
          !Object.hasOwn(this.controller.state.bodyLocations, player.id),
      );

      if (eliminationTarget) {
        return {
          ...createProposalBase(this.controller, actorId),
          actionId: "eliminate",
          targetPlayerId: eliminationTarget.id,
        };
      }

      const sabotageTaskId = this.controller.state.tasks.find(
        (task) =>
          task.kind === "two-person" &&
          task.status !== "completed" &&
          task.status !== "blocked",
      )?.taskId;

      const sabotageActions: AgentActionProposal[] = [
        {
          ...createProposalBase(this.controller, actorId),
          actionId: "trigger-blackout",
        },
        {
          ...createProposalBase(this.controller, actorId),
          actionId: "jam-door",
          targetRoomId: actor.roomId,
        },
        ...(sabotageTaskId
          ? [
              {
                ...createProposalBase(this.controller, actorId),
                actionId: "delay-two-person-task" as const,
                taskId: sabotageTaskId,
              },
            ]
          : []),
      ];

      const sabotageAction =
        sabotageActions[
          (this.controller.state.tick + playerIndex(this.controller, actorId)) %
            sabotageActions.length
        ];

      if (
        sabotageAction &&
        this.controller.state.tick % 3 ===
          playerIndex(this.controller, actorId) % 3
      ) {
        return sabotageAction;
      }
    }

    if (
      actor.role === "steward" &&
      !this.controller.state.servicePassageUnlocked &&
      this.controller.state.currentRound >= 2
    ) {
      return {
        ...createProposalBase(this.controller, actorId),
        actionId: "unlock-service-passage",
      };
    }

    const task = findTaskForActor(this.controller, actorId);

    if (task) {
      return {
        ...createProposalBase(this.controller, actorId),
        actionId:
          task.assignedPlayerIds.includes(actorId) || task.progress > 0
            ? "continue-task"
            : "start-task",
        taskId: task.taskId,
      };
    }

    const roomChoices = shuffleDeterministically(
      openNeighbors(this.controller, actor.roomId),
      this.controller.state.seed +
        this.controller.state.tick +
        playerIndex(this.controller, actorId) * 17,
    ).items;
    const targetRoomId = roomChoices[0];

    if (!targetRoomId) {
      return null;
    }

    return {
      ...createProposalBase(this.controller, actorId),
      actionId: "move",
      targetRoomId,
    };
  }

  #chooseVoteAction(actorId: PlayerId): AgentActionProposal | null {
    if (Object.hasOwn(this.controller.state.votes, actorId)) {
      return null;
    }

    const actor = this.controller.state.players.find(
      (player) => player.id === actorId,
    );

    if (!actor) {
      return null;
    }

    const candidates = livingPlayers(this.controller)
      .filter((player) => player.id !== actorId)
      .map((player) => player.id);

    if (candidates.length === 0) {
      return {
        ...createProposalBase(this.controller, actorId),
        actionId: "skip-vote",
      };
    }

    const promisedTarget = this.#memory.promisedTargets.get(actorId);
    const confidedTarget = this.#memory.confidedTargets.get(actorId);
    const aliveShadows = livingPlayers(this.controller).filter(
      (player) => player.role === "shadow",
    );
    const aliveHousehold = livingPlayers(this.controller).filter(
      (player) => player.role !== "shadow",
    );

    let targetPlayerId: PlayerId | null = null;

    if (
      promisedTarget &&
      isAlive(this.controller, promisedTarget) &&
      playerIndex(this.controller, actorId) % 2 === 0
    ) {
      targetPlayerId = promisedTarget;
    } else if (
      confidedTarget &&
      isAlive(this.controller, confidedTarget) &&
      playerIndex(this.controller, actorId) % 3 === 0
    ) {
      targetPlayerId = confidedTarget;
    } else if (
      actor.role !== "shadow" &&
      aliveHousehold.length - aliveShadows.length <= 1 &&
      aliveShadows.length > 0
    ) {
      targetPlayerId = aliveShadows[0]?.id ?? null;
    } else if (actor.role === "shadow") {
      targetPlayerId =
        livingPlayers(this.controller).find(
          (player) => player.role !== "shadow",
        )?.id ?? null;
    } else {
      targetPlayerId =
        shuffleDeterministically(
          candidates,
          this.controller.state.seed +
            this.controller.state.tick +
            playerIndex(this.controller, actorId) * 23 +
            this.controller.state.currentRound,
        ).items[0] ?? null;
    }

    if (!targetPlayerId) {
      return {
        ...createProposalBase(this.controller, actorId),
        actionId: "skip-vote",
      };
    }

    return {
      ...createProposalBase(this.controller, actorId),
      actionId: "vote-player",
      targetPlayerId,
    };
  }
}
