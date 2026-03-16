import type { ClientMessage, ServerMessage } from "@blackout-manor/shared";

import type { ClientGameConnectionMode } from "../types";

export type MatchConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

export type MatchConnectionListener = (
  message: ServerMessage,
) => void | Promise<void>;

export type MatchConnectionErrorListener = (
  error: Error,
) => void | Promise<void>;

export interface MatchConnection {
  readonly mode: ClientGameConnectionMode;
  readonly roomId: string | null;
  connect(): Promise<void>;
  send(message: ClientMessage): Promise<void>;
  subscribe(listener: MatchConnectionListener): () => void;
  onError(listener: MatchConnectionErrorListener): () => void;
  disconnect(): Promise<void>;
}
