import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROUTE_DIR = dirname(fileURLToPath(import.meta.url));

const OPEN_REPLAY_PATH = resolve(
  ROUTE_DIR,
  "../../../../../../../",
  ".local/replay-open/current.replay.json",
);

export async function GET() {
  try {
    const payload = await readFile(OPEN_REPLAY_PATH, "utf8");
    const replay = parseSavedReplayEnvelope(JSON.parse(payload));

    return NextResponse.json(replay, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No staged replay is available. Run pnpm replay:open <file> first.",
      },
      { status: 404 },
    );
  }
}
