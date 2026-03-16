import type { MatchId } from "@blackout-manor/shared";
import {
  HealthcheckResponseSchema,
  PROTOCOL_VERSION,
} from "@blackout-manor/shared";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { ZodError, z } from "zod";

import { createValidationError } from "../services/match-orchestrator/matchAdapters";
import {
  createBotOnlyMatch,
  fastForwardMatchSimulation,
  pauseMatchSimulation,
  resumeMatchSimulation,
  terminateMatchSimulation,
} from "../services/match-orchestrator/matchAdmin";
import type { ServerRuntime } from "../services/match-orchestrator/types";

const CreateMatchRequestSchema = z
  .object({
    botOnly: z.literal(true).default(true),
    matchId: z.string().min(1).max(64).optional(),
    seed: z.number().int().nonnegative().optional(),
    speedProfileId: z
      .enum(["showcase", "fast-sim", "headless-regression"])
      .optional(),
  })
  .strict();

const FastForwardRequestSchema = z
  .object({
    steps: z.number().int().positive().max(10_000).default(10),
  })
  .strict();

const formatIssues = (error: ZodError) =>
  error.issues.map((issue) => issue.message).slice(0, 12);

const respondValidationError = (
  response: Response,
  error: { code: string; message: string; issues?: string[] },
  statusCode = 400,
) => {
  response
    .status(statusCode)
    .json(createValidationError(error.code, error.message, error.issues ?? []));
};

const getAdminToken = (request: Request) => {
  const bearerToken = request.headers.authorization?.startsWith("Bearer ")
    ? request.headers.authorization.slice("Bearer ".length)
    : null;
  const headerToken = request.header("x-admin-token");

  return bearerToken ?? headerToken ?? null;
};

const createAdminGuard =
  (runtime: ServerRuntime) =>
  (request: Request, response: Response, next: NextFunction) => {
    if (getAdminToken(request) !== runtime.adminAuthToken) {
      respondValidationError(
        response,
        {
          code: "admin-auth-required",
          message: "A valid admin token is required for this route.",
        },
        401,
      );
      return;
    }

    next();
  };

const createMatchHandler = async (
  runtime: ServerRuntime,
  request: Request,
  response: Response,
) => {
  try {
    const payload = CreateMatchRequestSchema.parse(request.body ?? {});
    const created = await createBotOnlyMatch(runtime, {
      ...(payload.matchId ? { matchId: payload.matchId } : {}),
      ...(typeof payload.seed === "number" ? { seed: payload.seed } : {}),
      ...(payload.speedProfileId
        ? { speedProfileId: payload.speedProfileId }
        : {}),
    });

    response.status(201).json({
      ...created,
      botOnly: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      respondValidationError(
        response,
        {
          code: "invalid-create-request",
          message: "Invalid match creation payload.",
          issues: formatIssues(error),
        },
        400,
      );
      return;
    }

    respondValidationError(
      response,
      {
        code: "match-create-failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the requested match.",
      },
      500,
    );
  }
};

export function createHttpApp(runtime: ServerRuntime): Express {
  const app = express();
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json(
      HealthcheckResponseSchema.parse({
        name: "blackout-manor-server",
        status: "ok",
        protocolVersion: PROTOCOL_VERSION,
      }),
    );
  });

  app.get("/health", (_request, response) => {
    response.json(
      HealthcheckResponseSchema.parse({
        name: "blackout-manor-server",
        status: "ok",
        protocolVersion: PROTOCOL_VERSION,
      }),
    );
  });

  app.use("/admin", createAdminGuard(runtime));

  app.get("/admin/matches", async (_request, response) => {
    response.json({
      matches: await runtime.database.listMatchMetadata(),
    });
  });

  app.post("/admin/matches", async (request, response) => {
    await createMatchHandler(runtime, request, response);
  });

  app.post("/admin/matches/bot-only", async (request, response) => {
    await createMatchHandler(runtime, request, response);
  });

  app.post("/admin/matches/:matchId/pause", async (request, response) => {
    try {
      const result = await pauseMatchSimulation(
        runtime,
        request.params.matchId as MatchId,
      );
      response.json(result);
    } catch (error) {
      respondValidationError(
        response,
        {
          code: "match-not-found",
          message:
            error instanceof Error
              ? error.message
              : "Unable to pause the match.",
        },
        404,
      );
    }
  });

  app.post("/admin/matches/:matchId/resume", async (request, response) => {
    try {
      const result = await resumeMatchSimulation(
        runtime,
        request.params.matchId as MatchId,
      );
      response.json(result);
    } catch (error) {
      respondValidationError(
        response,
        {
          code: "match-not-found",
          message:
            error instanceof Error
              ? error.message
              : "Unable to resume the match.",
        },
        404,
      );
    }
  });

  app.post(
    "/admin/matches/:matchId/fast-forward",
    async (request, response) => {
      try {
        const payload = FastForwardRequestSchema.parse(request.body ?? {});
        const result = await fastForwardMatchSimulation(
          runtime,
          request.params.matchId as MatchId,
          payload.steps,
        );
        response.json(result);
      } catch (error) {
        if (error instanceof ZodError) {
          respondValidationError(
            response,
            {
              code: "invalid-fast-forward-request",
              message: "Invalid fast-forward payload.",
              issues: formatIssues(error),
            },
            400,
          );
          return;
        }

        respondValidationError(
          response,
          {
            code: "match-not-found",
            message:
              error instanceof Error
                ? error.message
                : "Unable to fast-forward the match.",
          },
          404,
        );
      }
    },
  );

  app.post("/admin/matches/:matchId/terminate", async (request, response) => {
    try {
      const result = await terminateMatchSimulation(
        runtime,
        request.params.matchId as MatchId,
      );
      response.json(result);
    } catch (error) {
      respondValidationError(
        response,
        {
          code: "match-not-found",
          message:
            error instanceof Error
              ? error.message
              : "Unable to terminate the match.",
        },
        404,
      );
    }
  });

  app.get("/admin/replays", async (_request, response) => {
    response.json({
      replays: await runtime.replayStore.listMetadata(),
    });
  });

  app.get("/admin/replays/:replayId/download", async (request, response) => {
    const payloadJson = await runtime.replayStore.getPayloadByReplayId(
      request.params.replayId,
    );

    if (!payloadJson) {
      respondValidationError(
        response,
        {
          code: "replay-not-found",
          message: "No replay is available for that replay id.",
        },
        404,
      );
      return;
    }

    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader(
      "content-disposition",
      `attachment; filename="${request.params.replayId}.replay.json"`,
    );
    response.send(payloadJson);
  });

  app.get("/admin/leaderboards/:seasonId", async (request, response) => {
    response.json({
      seasonId: request.params.seasonId,
      entries: await runtime.database.listLeaderboard(request.params.seasonId),
    });
  });

  app.get("/admin/metrics", async (_request, response) => {
    response.json(await runtime.database.getMetricsSnapshot());
  });

  return app;
}
