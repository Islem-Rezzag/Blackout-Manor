import { pathToFileURL } from "node:url";

import { env } from "./config/env";
import { startServer } from "./server";
import { createBotOnlyMatch } from "./services/match-orchestrator/matchAdmin";

export * from "./runtime";
export * from "./server";
export * from "./services/match-orchestrator/matchAdmin";

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  void startServer()
    .then(async (server) => {
      console.info(
        `Blackout Manor server listening on http://${env.SERVER_HOST}:${env.SERVER_PORT}`,
      );

      if (process.argv.includes("--bot-only")) {
        const created = await createBotOnlyMatch(server.runtime);

        console.info(
          `Bot-only match ready: match=${created.matchId ?? "pending"} room=${created.roomId}`,
        );
      }
    })
    .catch((error: unknown) => {
      console.error("Failed to start Blackout Manor server.", error);
      process.exitCode = 1;
    });
}
