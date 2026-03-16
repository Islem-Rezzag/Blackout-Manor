import {
  ACTION_IDS,
  ROLE_IDS,
  ROOM_IDS,
  TASK_IDS,
} from "@blackout-manor/shared";
import { describe, expect, it } from "vitest";

import {
  contentPackageManifest,
  MANOR_V1_MAP,
  MANOR_V1_TILED_MAP_JSON,
  SEASON_01_BALANCE_CONSTANTS,
  SEASON_01_CONTENT,
  SEASON_01_COOPERATIVE_TASKS,
  SEASON_01_DIALOGUE_TONE_TAGS,
  SEASON_01_EMOTIONAL_STANCE_TAGS,
  SEASON_01_PERSONA_CARDS,
  SEASON_01_ROLES,
  SEASON_01_SABOTAGE_TYPES,
  SEASON_01_STANDARD_TASKS,
  SEASON_01_TASKS,
} from "./index";

describe("content package", () => {
  it("exposes a ready content manifest", () => {
    expect(contentPackageManifest.status).toBe("ready");
    expect(contentPackageManifest.defaultSeasonId).toBe("season_01");
    expect(contentPackageManifest.personaCount).toBe(16);
  });

  it("ships manor_v1 with the official room layout", () => {
    expect(MANOR_V1_MAP.id).toBe("manor_v1");
    expect(MANOR_V1_MAP.rooms).toHaveLength(10);
    expect(new Set(MANOR_V1_MAP.rooms.map((room) => room.id)).size).toBe(10);

    for (const room of MANOR_V1_MAP.rooms) {
      expect(ROOM_IDS).toContain(room.id);

      for (const neighborId of room.neighboringRoomIds) {
        expect(ROOM_IDS).toContain(neighborId);
      }

      for (const taskId of room.taskIds) {
        expect(TASK_IDS).toContain(taskId);
      }
    }
  });

  it("ships the manor render asset as external tiled json", () => {
    expect(MANOR_V1_TILED_MAP_JSON.type).toBe("map");
    expect(MANOR_V1_TILED_MAP_JSON.layers.length).toBeGreaterThanOrEqual(6);
    expect(MANOR_V1_TILED_MAP_JSON.layers.map((layer) => layer.name)).toEqual(
      expect.arrayContaining([
        "backdrop",
        "rooms_floor",
        "cutaway_walls",
        "decor",
        "light_nodes",
        "focus_points",
        "clue_points",
      ]),
    );
  });

  it("ships the full task set with the expected split", () => {
    expect(SEASON_01_STANDARD_TASKS).toHaveLength(9);
    expect(SEASON_01_COOPERATIVE_TASKS).toHaveLength(4);
    expect(SEASON_01_TASKS).toHaveLength(13);

    for (const task of SEASON_01_STANDARD_TASKS) {
      expect(task.kind).toBe("solo");
      expect(TASK_IDS).toContain(task.id);
    }

    for (const task of SEASON_01_COOPERATIVE_TASKS) {
      expect(task.kind).toBe("two-person");
      expect(TASK_IDS).toContain(task.id);
    }
  });

  it("ships sabotage and role definitions aligned to shared action and role ids", () => {
    expect(SEASON_01_SABOTAGE_TYPES).toHaveLength(7);
    expect(SEASON_01_ROLES).toHaveLength(4);

    for (const sabotage of SEASON_01_SABOTAGE_TYPES) {
      expect(ACTION_IDS).toContain(sabotage.actionId);
    }

    for (const role of SEASON_01_ROLES) {
      expect(ROLE_IDS).toContain(role.id);
      expect(role.activeActionIds.length).toBeGreaterThan(0);
    }
  });

  it("ships a balanced 16-card persona pool", () => {
    expect(SEASON_01_PERSONA_CARDS).toHaveLength(16);
    expect(
      new Set(SEASON_01_PERSONA_CARDS.map((persona) => persona.id)).size,
    ).toBe(16);

    const bucketCounts = SEASON_01_PERSONA_CARDS.reduce(
      (accumulator, persona) => {
        accumulator[persona.balanceBucket] += 1;
        return accumulator;
      },
      {
        steady: 0,
        volatile: 0,
        social: 0,
        strategist: 0,
      },
    );

    expect(bucketCounts.steady).toBe(4);
    expect(bucketCounts.volatile).toBe(4);
    expect(bucketCounts.social).toBe(4);
    expect(bucketCounts.strategist).toBe(4);
  });

  it("ships tone tags, emotional stances, and isolated balance constants", () => {
    expect(SEASON_01_DIALOGUE_TONE_TAGS.length).toBeGreaterThanOrEqual(6);
    expect(SEASON_01_EMOTIONAL_STANCE_TAGS.length).toBeGreaterThanOrEqual(6);
    expect(SEASON_01_BALANCE_CONSTANTS.taskTuning.soloTaskCount).toBe(9);
    expect(SEASON_01_BALANCE_CONSTANTS.taskTuning.cooperativeTaskCount).toBe(4);
    expect(SEASON_01_BALANCE_CONSTANTS.personaScheduler.targetPerBucket).toBe(
      4,
    );
  });

  it("assembles the season pack without hidden engine dependencies", () => {
    expect(SEASON_01_CONTENT.map.id).toBe("manor_v1");
    expect(SEASON_01_CONTENT.personas).toHaveLength(16);
    expect(SEASON_01_CONTENT.tasks.standard).toHaveLength(9);
    expect(SEASON_01_CONTENT.tasks.cooperative).toHaveLength(4);
    expect(SEASON_01_CONTENT.sabotageTypes).toHaveLength(7);
  });
});
