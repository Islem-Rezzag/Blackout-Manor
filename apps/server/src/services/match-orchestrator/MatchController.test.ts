import { describe, expect, it } from "vitest";

import { DeterministicBotOrchestrator } from "../simulation-runner/DeterministicBotOrchestrator";
import { MatchController } from "./MatchController";

describe("MatchController", () => {
  it("rejects actor spoofing and illegal actions cleanly", () => {
    const controller = new MatchController({
      matchId: "test-match",
      seed: 19,
      botOnly: false,
    });
    const playerId = controller.availableHumanPlayerIds[0];
    const otherPlayerId = controller.availableHumanPlayerIds[1];

    expect(playerId).toBeDefined();
    expect(otherPlayerId).toBeDefined();

    if (!playerId || !otherPlayerId) {
      throw new Error("Expected human player slots to exist.");
    }

    controller.setPlayerConnected(playerId, true);

    const spoofed = controller.submitProposal(playerId, {
      actorId: otherPlayerId,
      phaseId: "intro",
      actionId: "move",
      targetRoomId: "library",
      confidence: 0.6,
      emotionalIntent: "calm",
    });

    expect(spoofed.ok).toBe(false);

    if (spoofed.ok) {
      throw new Error("Expected spoofed action to fail.");
    }

    expect(spoofed.error.code).toBe("actor-mismatch");

    const illegal = controller.submitProposal(playerId, {
      actorId: playerId,
      phaseId: "intro",
      actionId: "move",
      targetRoomId: "library",
      confidence: 0.6,
      emotionalIntent: "calm",
    });

    expect(illegal.ok).toBe(false);

    if (illegal.ok) {
      throw new Error("Expected illegal action to fail.");
    }

    expect(illegal.error.code).toBe("illegal-action");
    expect(illegal.error.issues[0]).toContain(
      "Movement is only legal during roam",
    );
  });

  it("pauses bot simulation until resumed", () => {
    const controller = new MatchController({
      matchId: "bot-match",
      seed: 23,
      botOnly: true,
      speedProfileId: "headless-regression",
    });
    const orchestrator = new DeterministicBotOrchestrator(controller);
    const introEndTick = controller.state.config.timings.castIntroSeconds + 1;

    controller.advanceTicks(introEndTick);
    const tickBeforeFirstStep = controller.state.tick;
    orchestrator.step();

    expect(controller.state.tick).toBeGreaterThan(tickBeforeFirstStep);

    controller.pause();
    const pausedTick = controller.state.tick;
    orchestrator.step();

    expect(controller.state.tick).toBe(pausedTick);

    controller.resume();
    orchestrator.step();

    expect(controller.state.tick).toBeGreaterThan(pausedTick);
  });
});
