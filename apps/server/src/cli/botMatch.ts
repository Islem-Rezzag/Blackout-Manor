import { startServer, stopServer } from "../server";
import { createBotOnlyMatch } from "../services/match-orchestrator/matchAdmin";

const parseArgValue = (flag: string) => {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
};

const parseNumberArg = (flag: string) => {
  const value = parseArgValue(flag);

  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const main = async () => {
  const seed = parseNumberArg("--seed") ?? 17;
  const matchId = parseArgValue("--match-id") ?? undefined;
  const speedProfileId = (parseArgValue("--speed") ?? "headless-regression") as
    | "showcase"
    | "fast-sim"
    | "headless-regression";
  const exitAfterCreate = process.argv.includes("--exit-after-create");
  const server = await startServer();
  const address = server.httpServer.address();
  const baseUrl =
    address && typeof address !== "string"
      ? `http://127.0.0.1:${address.port}`
      : "http://127.0.0.1:2567";

  try {
    const created = await createBotOnlyMatch(server.runtime, {
      seed,
      speedProfileId,
      ...(matchId ? { matchId } : {}),
    });

    console.info(`server: ${baseUrl}`);
    console.info(`match: ${created.matchId ?? "pending"}`);
    console.info(`room: ${created.roomId}`);
    console.info(`speed: ${speedProfileId}`);

    if (exitAfterCreate) {
      await stopServer(server);
    }
  } catch (error) {
    await stopServer(server);
    throw error;
  }
};

void main().catch((error: unknown) => {
  console.error("Failed to start a bot-only match.", error);
  process.exitCode = 1;
});
