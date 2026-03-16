import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from "node:http";

import { ROOM_CHANNEL_IDS } from "@blackout-manor/shared";
import { Server as ColyseusServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import type { Express } from "express";

import { env } from "./config/env";
import { createHttpApp } from "./http/createHttpApp";
import { LobbyRoom } from "./rooms/LobbyRoom";
import { MatchRoom } from "./rooms/MatchRoom";
import { createServerRuntime } from "./runtime";
import type { ServerRuntime } from "./services/match-orchestrator/types";

export type AppServer = {
  app: Express;
  httpServer: HttpServer;
  gameServer: ColyseusServer;
  runtime: ServerRuntime;
};

export type CreateAppServerOptions = {
  host?: string;
  port?: number;
  runtime?: ServerRuntime;
  environment?: Record<string, unknown>;
};

export async function createAppServer(
  options: CreateAppServerOptions = {},
): Promise<AppServer> {
  const runtime =
    options.runtime ?? (await createServerRuntime(options.environment));
  const app = createHttpApp(runtime);
  const httpServer = createHttpServer(app);
  const gameServer = new ColyseusServer({
    transport: new WebSocketTransport({
      server: httpServer,
    }),
  });

  gameServer.define(ROOM_CHANNEL_IDS[0], LobbyRoom, {
    runtime,
  });
  gameServer.define(ROOM_CHANNEL_IDS[1], MatchRoom, {
    runtime,
  });

  return {
    app,
    httpServer,
    gameServer,
    runtime,
  };
}

export async function startServer(
  options: CreateAppServerOptions = {},
): Promise<AppServer> {
  const server = await createAppServer(options);
  const host = options.host ?? env.SERVER_HOST;
  const port = options.port ?? env.SERVER_PORT;

  await new Promise<void>((resolve, reject) => {
    server.httpServer.once("error", reject);
    server.httpServer.listen(port, host, () => {
      server.httpServer.off("error", reject);
      resolve();
    });
  });

  return server;
}

export async function stopServer(server: AppServer): Promise<void> {
  await server.gameServer.gracefullyShutdown(false);

  await new Promise<void>((resolve, reject) => {
    if (!server.httpServer.listening) {
      resolve();
      return;
    }

    server.httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await server.runtime.database.close();
}
