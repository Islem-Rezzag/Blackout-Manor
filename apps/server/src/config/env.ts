import "dotenv/config";

import { z } from "zod";

const rawServerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SERVER_HOST: z.string().default("127.0.0.1"),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(2567),
  BOT_MODEL_MODE: z.enum(["scripted", "openai"]).optional(),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:6379"),
  ADMIN_API_TOKEN: z.string().min(12).optional(),
  OPENAI_API_KEY: z.string().min(20).optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
});

const rawEnv = rawServerEnvSchema.parse(process.env);

if (rawEnv.NODE_ENV === "production" && !rawEnv.ADMIN_API_TOKEN) {
  throw new Error("ADMIN_API_TOKEN must be configured in production.");
}

if (rawEnv.BOT_MODEL_MODE === "openai" && !rawEnv.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY must be configured when BOT_MODEL_MODE=openai.",
  );
}

export const env = {
  ...rawEnv,
  BOT_MODEL_MODE:
    rawEnv.BOT_MODEL_MODE ?? (rawEnv.OPENAI_API_KEY ? "openai" : "scripted"),
  DATABASE_PROVIDER:
    rawEnv.DATABASE_PROVIDER ??
    (rawEnv.NODE_ENV === "production" ? "postgresql" : "sqlite"),
  DATABASE_URL: rawEnv.DATABASE_URL ?? "",
  ADMIN_API_TOKEN: rawEnv.ADMIN_API_TOKEN ?? "blackout-manor-local-admin-token",
  OPENAI_API_KEY: rawEnv.OPENAI_API_KEY ?? "",
  OPENAI_BASE_URL: rawEnv.OPENAI_BASE_URL ?? "",
} as const;
