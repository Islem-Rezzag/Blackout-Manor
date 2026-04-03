import { SEASON_01_PERSONA_CARDS } from "@blackout-manor/content";
import type { MatchEvent, PublicPlayerState } from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import {
  actionIconLabel,
  buildAvatarCueMap,
  directionFromVector,
  resolveAvatarAppearance,
  resolveAvatarPose,
  resolveVisiblePosture,
  visiblePostureLabel,
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

  it("gives every persona a distinct identity kit instead of only rotating colors", () => {
    const signatures = new Set(
      SEASON_01_PERSONA_CARDS.map((card, index) => {
        const appearance = resolveAvatarAppearance(
          createPlayer(`player-${index + 1}`, card.label),
        );

        return [
          appearance.personaId,
          appearance.silhouette,
          appearance.bodyType,
          appearance.outfitStyle,
          appearance.maskStyle,
          appearance.maskDetailStyle,
          appearance.hairStyle,
          appearance.accessoryStyle,
          appearance.headdressStyle,
          appearance.portraitFrameStyle,
          appearance.stanceBias,
          appearance.outfitColor,
          appearance.trimColor,
        ].join(":");
      }),
    );

    expect(signatures.size).toBe(SEASON_01_PERSONA_CARDS.length);
  });

  it("keeps character adornment cues deterministic across repeated resolution", () => {
    const appearances = SEASON_01_PERSONA_CARDS.map((card, index) =>
      resolveAvatarAppearance(createPlayer(`player-${index + 1}`, card.label)),
    );

    expect(
      new Set(appearances.map((appearance) => appearance.headdressStyle)).size,
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(appearances.map((appearance) => appearance.maskDetailStyle)).size,
    ).toBeGreaterThanOrEqual(5);
    expect(
      appearances.every(
        (appearance) =>
          typeof appearance.secondaryColor === "number" &&
          typeof appearance.portraitGlowColor === "number",
      ),
    ).toBe(true);
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
    expect(resolveVisiblePosture({ ...player, status: "alive" })).toBe(
      "confident",
    );
  });

  it("classifies accusation and comfort cues from meeting events", () => {
    const players = [
      createPlayer("player-01", "Velvet Host"),
      createPlayer("player-02", "Iron Witness"),
      createPlayer("player-03", "Silver Alibi"),
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
        playerId: "player-03",
        text: "He changed his story. Compare that before you trust him.",
        targetPlayerId: "player-02",
      },
    ];

    const cues = buildAvatarCueMap(players, events, "meeting");

    expect(cues.get("player-01")?.gesture).toBe("comfort");
    expect(cues.get("player-01")?.actionIcon).toBe("protection");
    expect(cues.get("player-03")?.gesture).toBe("accuse");
    expect(cues.get("player-03")?.actionIcon).toBe("accusation");
    expect(cues.get("player-02")?.gesture).toBe("recoil");
  });

  it("tracks recoil, report, and directional facing", () => {
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
    expect(cues.get("player-01")?.actionIcon).toBe("report");
    expect(directionFromVector(-10, -5)).toBe("north-west");
    expect(directionFromVector(8, 1)).toBe("east");
  });

  it("maps public suspicion and public alerts into readable visible postures", () => {
    const suspiciousPlayer = createPlayer("player-03", "Amber Doubt", {
      publicImage: {
        credibility: 0.42,
        suspiciousness: 0.72,
      },
      emotion: {
        pleasure: -0.08,
        arousal: 0.42,
        dominance: 0.16,
        label: "suspicious",
        intensity: 0.58,
        updatedAtTick: 7,
      },
    });
    const alertPlayer = createPlayer("player-04", "Lantern Steward", {
      bodyLanguage: "agitated",
      emotion: {
        pleasure: 0.1,
        arousal: 0.56,
        dominance: 0.28,
        label: "determined",
        intensity: 0.62,
        updatedAtTick: 8,
      },
    });

    expect(resolveVisiblePosture(suspiciousPlayer)).toBe("suspicious");
    expect(resolveVisiblePosture(alertPlayer)).toBe("alert");
    expect(visiblePostureLabel("alert")).toBe("Alert");
    expect(actionIconLabel("vote-pressure")).toBe("VOTE");
  });
});
