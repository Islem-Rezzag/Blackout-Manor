import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer/schemas";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROUTE_DIR = dirname(fileURLToPath(import.meta.url));

const SAMPLE_REPLAY_PATH = resolve(
  ROUTE_DIR,
  "../../../../../../../",
  "packages/replay-viewer/src/fixtures/highlight-replay.json",
);

export async function GET() {
  try {
    const payload = await readFile(SAMPLE_REPLAY_PATH, "utf8");
    const replay = parseSavedReplayEnvelope(JSON.parse(payload));

    return NextResponse.json(replay, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message: "Sample replay is unavailable.",
      },
      { status: 500 },
    );
  }
}
