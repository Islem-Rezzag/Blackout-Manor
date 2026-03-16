import { setTimeout as delay } from "node:timers/promises";

import { AGENT_SELECTION_JSON_SCHEMA } from "../../runtime/AgentDecisionGateway";
import {
  OFFICIAL_AGENT_MODEL_PACK,
  resolveOfficialModelId,
} from "../officialPack";
import { redactSecrets } from "../redaction";
import type {
  AgentGatewayLogger,
  AgentModelAdapter,
  AgentModelAdapterResult,
  AgentModelInvocation,
} from "../types";

type FetchLike = typeof fetch;

type OpenAIResponsesModelAdapterOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  logger?: AgentGatewayLogger;
};

const defaultLogger = {
  debug: () => {},
  warn: () => {},
  error: () => {},
};

const extractOutputText = (payload: Record<string, unknown>) => {
  if (
    typeof payload.output_text === "string" &&
    payload.output_text.length > 0
  ) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const entry of content) {
      if (
        entry &&
        typeof entry === "object" &&
        (entry as { type?: string }).type === "output_text" &&
        typeof (entry as { text?: unknown }).text === "string"
      ) {
        return (entry as { text: string }).text;
      }
    }
  }

  return null;
};

export class OpenAIResponsesModelAdapter implements AgentModelAdapter {
  readonly id = "openai-responses";
  readonly #fetchImpl: FetchLike;
  readonly #logger: AgentGatewayLogger;
  readonly #baseUrl: string;

  constructor(private readonly options: OpenAIResponsesModelAdapterOptions) {
    this.#fetchImpl = options.fetchImpl ?? fetch;
    this.#logger = options.logger ?? defaultLogger;
    this.#baseUrl = options.baseUrl ?? OFFICIAL_AGENT_MODEL_PACK.baseUrl;
  }

  async selectAction(
    invocation: AgentModelInvocation,
  ): Promise<AgentModelAdapterResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      invocation.budget.timeoutMs,
    );
    const requestBody = {
      model: resolveOfficialModelId(invocation.speedProfileId),
      input: invocation.prompt,
      store: false,
      max_output_tokens: invocation.budget.maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: OFFICIAL_AGENT_MODEL_PACK.schemaName,
          strict: true,
          schema: AGENT_SELECTION_JSON_SCHEMA,
        },
      },
      metadata: {
        decision_key: invocation.decisionKey,
      },
    };

    try {
      const response = await this.#fetchImpl(`${this.#baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const payload = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        this.#logger.error("openai.responses.error", {
          decisionKey: invocation.decisionKey,
          status: response.status,
          payload: redactSecrets(payload, [this.options.apiKey]),
        });
        throw new Error(`Responses API returned ${response.status}.`);
      }

      const outputText = extractOutputText(payload);

      if (!outputText) {
        throw new Error("Responses API did not return structured output text.");
      }

      return {
        selection: JSON.parse(outputText),
        ...(typeof payload.id === "string"
          ? { providerResponseId: payload.id }
          : {}),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Responses API error.";

      this.#logger.warn("openai.responses.retryable-error", {
        decisionKey: invocation.decisionKey,
        error: redactSecrets(message, [this.options.apiKey]),
      });

      if (message.includes("aborted")) {
        await delay(10);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
