import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { DatabaseConfig, DatabaseProvider } from "./types";

const LOCAL_SQLITE_PATH = ".local/blackout-manor-dev.sqlite";

const normalizeProvider = (
  provider?: string | null,
): DatabaseProvider | null => {
  if (!provider) {
    return null;
  }

  if (provider === "sqlite" || provider === "postgresql") {
    return provider;
  }

  return null;
};

const ensureSqliteParentDirectory = (filepath: string) => {
  if (filepath === ":memory:") {
    return filepath;
  }

  const absolutePath = resolve(filepath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  return absolutePath;
};

const defaultConnectionString = (
  provider: DatabaseProvider,
  nodeEnv: string,
) =>
  provider === "sqlite"
    ? nodeEnv === "test"
      ? ":memory:"
      : LOCAL_SQLITE_PATH
    : "postgresql://postgres:postgres@127.0.0.1:5432/blackout_manor";

export const resolveDatabaseConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseConfig => {
  const nodeEnv = environment.NODE_ENV ?? "development";
  const provider =
    normalizeProvider(environment.DATABASE_PROVIDER) ??
    (nodeEnv === "production" ? "postgresql" : "sqlite");
  const configuredConnectionString = environment.DATABASE_URL?.trim();
  const fallbackConnectionString = defaultConnectionString(provider, nodeEnv);
  const connectionString =
    configuredConnectionString && configuredConnectionString.length > 0
      ? configuredConnectionString
      : fallbackConnectionString;

  return {
    provider,
    connectionString:
      provider === "sqlite"
        ? ensureSqliteParentDirectory(connectionString)
        : connectionString,
  };
};

export const dbPackageManifest = {
  name: "@blackout-manor/db",
  status: "ready",
  localFallback: "sqlite",
  productionProvider: "postgresql",
} as const;
