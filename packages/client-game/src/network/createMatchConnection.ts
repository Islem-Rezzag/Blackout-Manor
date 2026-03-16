import type { ClientGameConnectionOptions } from "../types";
import { ColyseusMatchConnection } from "./colyseusMatchConnection";
import { MockMatchConnection } from "./mockMatchConnection";
import type { MatchConnection } from "./types";

export const createMatchConnection = (
  options: ClientGameConnectionOptions,
): MatchConnection => {
  if (options.mode === "mock") {
    return new MockMatchConnection(options);
  }

  return new ColyseusMatchConnection(options);
};
