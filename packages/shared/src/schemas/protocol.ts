import { z } from "zod";

import { PROTOCOL_VERSION } from "../constants";
import {
  AgentActionProposalSchema,
  LobbySnapshotSchema,
  MatchEventSchema,
  MatchIdSchema,
  MatchPrivateStateSchema,
  MatchSnapshotSchema,
  PlayerIdSchema,
  ReplayEnvelopeSchema,
  ReplayFrameSchema,
  ReplayIdSchema,
  RoomChannelIdSchema,
} from "./contracts";

export const HealthcheckResponseSchema = z
  .object({
    name: z.string().min(1),
    status: z.enum(["ok", "scaffolded"]),
    protocolVersion: z.string().min(1),
  })
  .strict();

export const ClientPingMessageSchema = z
  .object({
    type: z.literal("client.ping"),
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict();

export const ClientLobbySetReadyMessageSchema = z
  .object({
    type: z.literal("client.lobby.set-ready"),
    playerId: PlayerIdSchema,
    ready: z.boolean(),
  })
  .strict();

export const ClientMatchProposeActionMessageSchema = z
  .object({
    type: z.literal("client.match.propose-action"),
    matchId: MatchIdSchema,
    proposal: AgentActionProposalSchema,
  })
  .strict();

export const ClientReplayRequestMessageSchema = z
  .object({
    type: z.literal("client.replay.request"),
    replayId: ReplayIdSchema.optional(),
    matchId: MatchIdSchema.optional(),
  })
  .strict()
  .refine(
    (value) => value.replayId !== undefined || value.matchId !== undefined,
    {
      message: "A replay request requires either replayId or matchId.",
    },
  );

export const ClientReplaySeekMessageSchema = z
  .object({
    type: z.literal("client.replay.seek"),
    replayId: ReplayIdSchema,
    tick: z.number().int().nonnegative(),
  })
  .strict();

export const ClientMessageSchema = z.discriminatedUnion("type", [
  ClientPingMessageSchema,
  ClientLobbySetReadyMessageSchema,
  ClientMatchProposeActionMessageSchema,
  ClientReplayRequestMessageSchema,
  ClientReplaySeekMessageSchema,
]);

export const ServerHelloMessageSchema = z
  .object({
    type: z.literal("server.hello"),
    protocolVersion: z.literal(PROTOCOL_VERSION),
    serverTime: z.string().datetime({ offset: true }),
    roomChannelId: RoomChannelIdSchema,
  })
  .strict();

export const ServerPongMessageSchema = z
  .object({
    type: z.literal("server.pong"),
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict();

export const ServerLobbySnapshotMessageSchema = z
  .object({
    type: z.literal("server.lobby.snapshot"),
    lobby: LobbySnapshotSchema,
  })
  .strict();

export const ServerMatchSnapshotMessageSchema = z
  .object({
    type: z.literal("server.match.snapshot"),
    match: MatchSnapshotSchema,
  })
  .strict();

export const ServerMatchPrivateStateMessageSchema = z
  .object({
    type: z.literal("server.match.private-state"),
    matchId: MatchIdSchema,
    privateState: MatchPrivateStateSchema,
  })
  .strict();

export const ServerMatchEventMessageSchema = z
  .object({
    type: z.literal("server.match.event"),
    matchId: MatchIdSchema,
    event: MatchEventSchema,
  })
  .strict();

export const ServerReplayChunkMessageSchema = z
  .object({
    type: z.literal("server.replay.chunk"),
    replayId: ReplayIdSchema,
    matchId: MatchIdSchema,
    startIndex: z.number().int().nonnegative(),
    totalFrames: z.number().int().nonnegative(),
    isFinalChunk: z.boolean(),
    frames: z.array(ReplayFrameSchema),
  })
  .strict();

export const ServerValidationErrorMessageSchema = z
  .object({
    type: z.literal("server.validation-error"),
    code: z.string().min(1).max(64),
    message: z.string().min(1).max(240),
    issues: z.array(z.string().min(1).max(240)).max(12),
  })
  .strict();

export const ServerHealthcheckMessageSchema = z
  .object({
    type: z.literal("server.healthcheck"),
    payload: HealthcheckResponseSchema,
  })
  .strict();

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ServerHelloMessageSchema,
  ServerPongMessageSchema,
  ServerLobbySnapshotMessageSchema,
  ServerMatchSnapshotMessageSchema,
  ServerMatchPrivateStateMessageSchema,
  ServerMatchEventMessageSchema,
  ServerReplayChunkMessageSchema,
  ServerValidationErrorMessageSchema,
  ServerHealthcheckMessageSchema,
]);

export const ReplaySerializationEnvelopeSchema = ReplayEnvelopeSchema;

export type HealthcheckResponse = z.infer<typeof HealthcheckResponseSchema>;
export type ClientPingMessage = z.infer<typeof ClientPingMessageSchema>;
export type ClientLobbySetReadyMessage = z.infer<
  typeof ClientLobbySetReadyMessageSchema
>;
export type ClientMatchProposeActionMessage = z.infer<
  typeof ClientMatchProposeActionMessageSchema
>;
export type ClientReplayRequestMessage = z.infer<
  typeof ClientReplayRequestMessageSchema
>;
export type ClientReplaySeekMessage = z.infer<
  typeof ClientReplaySeekMessageSchema
>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ServerHelloMessage = z.infer<typeof ServerHelloMessageSchema>;
export type ServerPongMessage = z.infer<typeof ServerPongMessageSchema>;
export type ServerLobbySnapshotMessage = z.infer<
  typeof ServerLobbySnapshotMessageSchema
>;
export type ServerMatchSnapshotMessage = z.infer<
  typeof ServerMatchSnapshotMessageSchema
>;
export type ServerMatchPrivateStateMessage = z.infer<
  typeof ServerMatchPrivateStateMessageSchema
>;
export type ServerMatchEventMessage = z.infer<
  typeof ServerMatchEventMessageSchema
>;
export type ServerReplayChunkMessage = z.infer<
  typeof ServerReplayChunkMessageSchema
>;
export type ServerValidationErrorMessage = z.infer<
  typeof ServerValidationErrorMessageSchema
>;
export type ServerHealthcheckMessage = z.infer<
  typeof ServerHealthcheckMessageSchema
>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
