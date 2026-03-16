import { createBlackoutManorDatabase } from "@blackout-manor/db";

import { env } from "./config/env";
import { MatchRegistry } from "./services/match-orchestrator/MatchRegistry";
import type { ServerRuntime } from "./services/match-orchestrator/types";
import { createAgentDecisionGateway } from "./services/model-gateway/createAgentDecisionGateway";
import { PersistentReplayStore } from "./services/replay-service/PersistentReplayStore";

const toProcessEnv = (environment: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(environment).map(([key, value]) => [
      key,
      typeof value === "string" ? value : String(value),
    ]),
  ) as NodeJS.ProcessEnv;

export const createServerRuntime = async (
  environment: Record<string, unknown> = env,
): Promise<ServerRuntime> => {
  const adminAuthToken =
    typeof environment.ADMIN_API_TOKEN === "string"
      ? environment.ADMIN_API_TOKEN
      : env.ADMIN_API_TOKEN;
  const database = await createBlackoutManorDatabase(toProcessEnv(environment));
  const agentDecisionGateway = createAgentDecisionGateway(environment);

  return {
    matchRegistry: new MatchRegistry(),
    database,
    replayStore: new PersistentReplayStore(database),
    agentDecisionGateway,
    adminAuthToken,
  };
};
