import {
  AgentDecisionGateway,
  OpenAIResponsesModelAdapter,
  ScriptedFallbackAdapter,
} from "@blackout-manor/agents";

import { env } from "../../config/env";

const createServerLogger = () => ({
  debug: (message: string, payload?: Record<string, unknown>) => {
    if (env.NODE_ENV === "test") {
      return;
    }

    console.debug(message, payload ?? {});
  },
  warn: (message: string, payload?: Record<string, unknown>) => {
    console.warn(message, payload ?? {});
  },
  error: (message: string, payload?: Record<string, unknown>) => {
    console.error(message, payload ?? {});
  },
});

export const createAgentDecisionGateway = (
  environment: Record<string, unknown> = env,
) => {
  const logger = createServerLogger();
  const fallbackAdapter = new ScriptedFallbackAdapter();
  const botMode =
    environment.BOT_MODEL_MODE === "openai" ? "openai" : "scripted";
  const apiKey =
    typeof environment.OPENAI_API_KEY === "string"
      ? environment.OPENAI_API_KEY
      : "";
  const baseUrl =
    typeof environment.OPENAI_BASE_URL === "string" &&
    environment.OPENAI_BASE_URL.length > 0
      ? environment.OPENAI_BASE_URL
      : undefined;

  if (botMode === "openai" && apiKey) {
    return new AgentDecisionGateway({
      adapter: new OpenAIResponsesModelAdapter({
        apiKey,
        ...(baseUrl ? { baseUrl } : {}),
        logger,
      }),
      fallbackAdapter,
      logger,
    });
  }

  return new AgentDecisionGateway({
    adapter: fallbackAdapter,
    logger,
  });
};
