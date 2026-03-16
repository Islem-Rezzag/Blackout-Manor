import { BlackoutManorDatabase } from "./BlackoutManorDatabase";
import { dbPackageManifest, resolveDatabaseConfig } from "./config";

export const createBlackoutManorDatabase = async (
  environment: NodeJS.ProcessEnv = process.env,
) => {
  const database = new BlackoutManorDatabase(
    resolveDatabaseConfig(environment),
  );
  await database.initialize();
  return database;
};

export type * from "./types";
export { BlackoutManorDatabase, dbPackageManifest, resolveDatabaseConfig };
