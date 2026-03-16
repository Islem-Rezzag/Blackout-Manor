import type { AgentDecisionGateway } from "@blackout-manor/agents";
import { shuffleDeterministically } from "@blackout-manor/engine";

import type { MatchController } from "../match-orchestrator/MatchController";
import type { MatchControllerUpdate } from "../match-orchestrator/types";

const ACTIONS_PER_PHASE: Partial<
  Record<MatchController["state"]["phaseId"], number>
> = {
  roam: 2,
  report: 1,
  meeting: 2,
  vote: 10,
};

const ACTIONABLE_PHASES = new Set<MatchController["state"]["phaseId"]>([
  "roam",
  "report",
  "meeting",
  "vote",
]);

const emptyUpdate = (controller: MatchController): MatchControllerUpdate => ({
  snapshot: controller.getSnapshot(),
  recentEvents: [],
});

export class ModelGatewayBotOrchestrator {
  readonly #submittedDecisionKeys = new Set<string>();
  #decisionWindowKey = "";

  constructor(
    private readonly controller: MatchController,
    private readonly gateway: AgentDecisionGateway,
  ) {}

  async runSteps(steps = 1) {
    let lastUpdate = emptyUpdate(this.controller);

    for (
      let step = 0;
      step < steps && !this.controller.completed && !this.controller.terminated;
      step += 1
    ) {
      lastUpdate = await this.step();
    }

    return lastUpdate;
  }

  async step() {
    if (
      this.controller.paused ||
      this.controller.completed ||
      this.controller.terminated
    ) {
      return emptyUpdate(this.controller);
    }

    this.#syncDecisionWindow();

    const recentEvents = [];
    const actionsPerTick =
      ACTIONS_PER_PHASE[this.controller.state.phaseId] ?? 0;
    let actionsTaken = 0;

    for (const actorId of this.#actorOrder()) {
      if (
        this.controller.completed ||
        this.controller.terminated ||
        !ACTIONABLE_PHASES.has(this.controller.state.phaseId) ||
        actionsTaken >= actionsPerTick
      ) {
        break;
      }

      const decisionKey = [
        this.controller.matchId,
        this.controller.state.phaseId,
        this.controller.state.tick,
        actorId,
      ].join(":");

      if (this.#submittedDecisionKeys.has(decisionKey)) {
        continue;
      }

      const decision = await this.gateway.decide({
        decisionKey,
        matchId: this.controller.matchId,
        speedProfileId: this.controller.state.config.speedProfileId,
        actorId,
        phaseId: this.controller.state.phaseId,
        state: this.controller.state,
      });

      if (!decision) {
        continue;
      }

      this.#submittedDecisionKeys.add(decisionKey);

      const result = this.controller.submitProposal(actorId, decision.proposal);

      if (!result.ok) {
        continue;
      }

      actionsTaken += 1;
      recentEvents.push(...result.update.recentEvents);
    }

    const tickUpdate = this.controller.advanceTicks(1);

    return {
      snapshot: tickUpdate.snapshot,
      recentEvents: [...recentEvents, ...tickUpdate.recentEvents],
    };
  }

  #actorOrder() {
    return shuffleDeterministically(
      this.controller.botPlayerIds,
      this.controller.state.seed +
        this.controller.state.tick +
        this.controller.state.currentRound * 97,
    ).items;
  }

  #syncDecisionWindow() {
    const nextWindowKey = [
      this.controller.state.phaseId,
      this.controller.state.tick,
      this.controller.state.phaseStartedAtTick,
    ].join(":");

    if (nextWindowKey === this.#decisionWindowKey) {
      return;
    }

    this.#decisionWindowKey = nextWindowKey;
    this.#submittedDecisionKeys.clear();
  }
}
