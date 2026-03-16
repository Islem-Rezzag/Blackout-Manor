import {
  PLAYER_STATUS_IDS,
  ROLE_IDS,
  ROOM_IDS,
  TEAM_IDS,
} from "@blackout-manor/shared";
import { z } from "zod";

import { REPLAY_HIGHLIGHT_KIND_IDS, type SavedReplayEnvelope } from "./types";

const EngineWinnerSchema = z
  .object({
    team: z.enum(TEAM_IDS),
    reason: z.string().min(1),
    decidedAtTick: z.number().int().nonnegative(),
  })
  .strict();

const ReplayPlayerSnapshotSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    role: z.enum(ROLE_IDS),
    status: z.enum(PLAYER_STATUS_IDS),
    roomId: z.enum(ROOM_IDS).nullable(),
  })
  .passthrough();

const EngineEventSchema = z
  .object({
    sequence: z.number().int().positive(),
    type: z.string().min(1),
    tick: z.number().int().nonnegative(),
  })
  .passthrough();

const EngineReplayFrameSchema = z
  .object({
    tick: z.number().int().nonnegative(),
    phaseId: z.string().min(1),
    events: z.array(EngineEventSchema),
    players: z.array(ReplayPlayerSnapshotSchema),
    rooms: z.array(z.unknown()),
    tasks: z.array(z.unknown()),
    winner: EngineWinnerSchema.nullable(),
  })
  .strict();

const EngineReplayLogSchema = z
  .object({
    replayId: z.string().min(1),
    matchId: z.string().min(1),
    seed: z.number().int().nonnegative(),
    config: z
      .object({
        matchId: z.string().min(1),
        seed: z.number().int().nonnegative(),
      })
      .passthrough(),
    events: z.array(EngineEventSchema),
    frames: z.array(EngineReplayFrameSchema),
  })
  .strict();

export const ReplayHighlightMarkerSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(REPLAY_HIGHLIGHT_KIND_IDS),
    tick: z.number().int().nonnegative(),
    sequence: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().min(1),
    playersInvolved: z.array(z.string().min(1)),
    metadata: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    ),
  })
  .strict();

export const SavedReplayEnvelopeSchema = z
  .object({
    formatVersion: z.literal("1.0.0"),
    exportedAt: z.string().datetime({ offset: true }),
    replay: EngineReplayLogSchema,
    highlights: z.array(ReplayHighlightMarkerSchema),
    summary: z
      .object({
        replayId: z.string().min(1),
        matchId: z.string().min(1),
        seed: z.number().int().nonnegative(),
        finalTick: z.number().int().nonnegative(),
        totalEvents: z.number().int().nonnegative(),
        totalHighlights: z.number().int().nonnegative(),
        winner: EngineWinnerSchema.nullable(),
      })
      .strict(),
  })
  .strict();

export const parseSavedReplayEnvelope = (value: unknown): SavedReplayEnvelope =>
  SavedReplayEnvelopeSchema.parse(value) as SavedReplayEnvelope;
