import type { MatchEvent, PublicPlayerState } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import {
  buildAvatarCueMap,
  directionFromVector,
  resolveAvatarAppearance,
  resolveAvatarPose,
} from "./presentation";

const createPlayer = (
  id: PublicPlayerState["id"],
  displayName: string,
  overrides: Partial<PublicPlayerState> = {},
): PublicPlayerState => ({
  id,
  displayName,
  roomId: "grand-hall",
  status: "alive",
  connected: true,
  publicImage: {
    credibility: 0.5,
    suspiciousness: 0.3,
  },
  emotion: {
    pleasure: 0.2,
    arousal: 0.1,
    dominance: 0.2,
    label: "calm",
    intensity: 0.3,
    updatedAtTick: 1,
  },
  bodyLanguage: "calm",
  completedTaskCount: 0,
  ...overrides,
});

describe("avatar presentation", () => {
  it("resolves deterministic appearance from the public player identity", () => {
    const player = createPlayer("player-01", "Velvet Host");
    const left = resolveAvatarAppearance(player);
    const right = resolveAvatarAppearance(player);

    expect(left).toEqual(right);
    expect(left.personaId).toBe("velvet-host");
  });

  it("upgrades calm posture to confident when the public emotion reads dominant and positive", () => {
    const player = createPlayer("player-02", "Clockwork Advocate", {
      emotion: {
        pleasure: 0.42,
        arousal: 0.28,
        dominance: 0.58,
        label: "confident",
        intensity: 0.46,
        updatedAtTick: 4,
      },
    });

    expect(resolveAvatarPose(player)).toBe("confident");
  });

  it("classifies accusation and comfort cues from meeting events", () => {
    const players = [
      createPlayer("player-01", "Velvet Host"),
      createPlayer("player-02", "Iron Witness"),
    ];
    const events: MatchEvent[] = [
      {
        id: "event-1",
        eventId: "discussion-turn",
        tick: 10,
        phaseId: "meeting",
        playerId: "player-01",
        text: "Take a breath. We can compare the timeline after this.",
        targetPlayerId: "player-02",
      },
      {
        id: "event-2",
        eventId: "discussion-turn",
        tick: 11,
        phaseId: "meeting",
        playerId: "player-02",
        text: "He changed his story. Compare that before you trust him.",
        targetPlayerId: "player-01",
      },
    ];

    const cues = buildAvatarCueMap(players, events, "meeting");

    expect(cues.get("player-01")?.gesture).toBe("comfort");
    expect(cues.get("player-02")?.gesture).toBe("accuse");
  });

  it("tracks recoil events and directional facing", () => {
    const players = [createPlayer("player-01", "Velvet Host")];
    const events: MatchEvent[] = [
      {
        id: "event-3",
        eventId: "body-reported",
        tick: 15,
        phaseId: "report",
        playerId: "player-01",
        targetPlayerId: "player-09",
        roomId: "cellar",
      },
    ];

    const cues = buildAvatarCueMap(players, events, "report");

    expect(cues.get("player-01")?.gesture).toBe("recoil");
    expect(directionFromVector(-10, -5)).toBe("north-west");
    expect(directionFromVector(8, 1)).toBe("east");
  });
});
