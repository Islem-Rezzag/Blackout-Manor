import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { deserializeSavedReplayEnvelope } from "../packages/replay-viewer/src/index";
import { getPositionalArgs, getStringArg, parseCliArgs } from "./lib/cli";

const STAGED_REPLAY_PATH = resolve(".local/replay-open/current.replay.json");
const DEFAULT_REPLAY_URL = "http://127.0.0.1:3000/play?view=replay&source=open";

const openBrowser = (url: string) => {
  if (process.platform === "win32") {
    return spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  }

  if (process.platform === "darwin") {
    return spawnSync("open", [url], { stdio: "ignore" });
  }

  return spawnSync("xdg-open", [url], { stdio: "ignore" });
};

const argv = process.argv.slice(2);
const args = parseCliArgs(argv);
const positionals = getPositionalArgs(argv);
const sourceArg = getStringArg(args, "file");
const replayFile = sourceArg ?? positionals[0];

if (!replayFile) {
  console.error("Usage: pnpm replay:open <file> [--url http://127.0.0.1:3000]");
  process.exit(1);
}

const replayPath = resolve(replayFile);
const payload = readFileSync(replayPath, "utf8");
deserializeSavedReplayEnvelope(payload);
mkdirSync(dirname(STAGED_REPLAY_PATH), { recursive: true });
copyFileSync(replayPath, STAGED_REPLAY_PATH);

const url = getStringArg(args, "url", DEFAULT_REPLAY_URL) ?? DEFAULT_REPLAY_URL;
const shouldLaunch = args.get("no-launch") !== true;

console.info(`staged: ${STAGED_REPLAY_PATH}`);
console.info(`source: ${replayPath}`);
console.info(`url: ${url}`);

if (shouldLaunch) {
  openBrowser(url);
}
