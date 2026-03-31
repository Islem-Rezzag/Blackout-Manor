import { describe, expect, it } from "vitest";

import {
  buildGameRuntimeConnection,
  normalizeRoomId,
  resolveReplayEndpointForSurface,
} from "./runtimeSurface";

describe("runtimeSurface", () => {
  it("keeps live surfaces from loading replay endpoints", () => {
    expect(
      resolveReplayEndpointForSurface("live", "/api/replays/open"),
    ).toBeNull();
    expect(
      resolveReplayEndpointForSurface("dev-replay", "/api/replays/open"),
    ).toBe("/api/replays/open");
  });

  it("builds live-route connections without replay mode even if replay query params are present", () => {
    const connection = buildGameRuntimeConnection({
      surface: "live",
      roomId: "demo",
      defaultMode: "live",
      defaultServerUrl: "ws://127.0.0.1:2567",
      defaultActorId: null,
      search: "view=replay&source=open&mode=live",
      replay: null,
    });

    expect(connection.mode).toBe("live");
    expect(connection.roomId).toBe("demo");
  });

  it("builds replay-mode connections only for dev replay surfaces", () => {
    const replay = {
      replay: {
        replayId: "replay-1",
        matchId: "match-1",
      },
    } as never;

    const connection = buildGameRuntimeConnection({
      surface: "dev-replay",
      roomId: "demo",
      defaultMode: "mock",
      defaultServerUrl: "ws://127.0.0.1:2567",
      defaultActorId: "agent-7",
      search: "",
      replay,
    });

    expect(connection.mode).toBe("replay");
    expect(connection.roomId).toBe("demo");
    expect(connection.actorId).toBe("agent-7");
  });

  it("normalizes blank room ids to demo", () => {
    expect(normalizeRoomId("   ")).toBe("demo");
  });
});
