import {
  ClientMessageSchema,
  ReplaySerializationEnvelopeSchema,
  ServerMessageSchema,
} from "../schemas";

export { PROTOCOL_VERSION } from "../constants";

export const parseClientMessage = (payload: unknown) =>
  ClientMessageSchema.parse(payload);

export const parseServerMessage = (payload: unknown) =>
  ServerMessageSchema.parse(payload);

export const serializeReplayEnvelope = (payload: unknown) =>
  JSON.stringify(ReplaySerializationEnvelopeSchema.parse(payload));

export const deserializeReplayEnvelope = (payload: string) =>
  ReplaySerializationEnvelopeSchema.parse(JSON.parse(payload));
