import { afterEach, describe, expect, it } from "vitest";

import { type AppServer, startServer, stopServer } from "./server";

const TEST_ADMIN_TOKEN = "blackout-manor-test-admin";

const getBaseUrl = (server: AppServer) => {
  const address = server.httpServer.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected an ephemeral HTTP server address.");
  }

  return `http://127.0.0.1:${address.port}`;
};

const authHeaders = () => ({
  "x-admin-token": TEST_ADMIN_TOKEN,
});

describe("server admin endpoints", () => {
  let server: AppServer | null = null;

  afterEach(async () => {
    if (server) {
      await stopServer(server);
      server = null;
    }
  });

  it("rejects admin requests without the admin token", async () => {
    server = await startServer({
      host: "127.0.0.1",
      port: 0,
      environment: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_PROVIDER: "sqlite",
        DATABASE_URL: ":memory:",
        ADMIN_API_TOKEN: TEST_ADMIN_TOKEN,
      },
    });

    const baseUrl = getBaseUrl(server);
    const response = await fetch(`${baseUrl}/admin/matches`);

    expect(response.status).toBe(401);
    const payload = (await response.json()) as {
      code: string;
    };
    expect(payload.code).toBe("admin-auth-required");
  });

  it("creates, persists, and serves replay/admin metadata over HTTP", async () => {
    server = await startServer({
      host: "127.0.0.1",
      port: 0,
      environment: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_PROVIDER: "sqlite",
        DATABASE_URL: ":memory:",
        ADMIN_API_TOKEN: TEST_ADMIN_TOKEN,
      },
    });

    const baseUrl = getBaseUrl(server);
    const createResponse = await fetch(`${baseUrl}/admin/matches`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        seed: 17,
        speedProfileId: "headless-regression",
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      matchId: string | null;
      roomId: string;
    };

    expect(created.roomId).toBeTruthy();
    expect(created.matchId).toBeTruthy();

    if (!created.matchId) {
      throw new Error("Expected created match id to be available.");
    }

    const matchesResponse = await fetch(`${baseUrl}/admin/matches`, {
      headers: authHeaders(),
    });
    const matchesPayload = (await matchesResponse.json()) as {
      matches: Array<{ matchId: string }>;
    };
    expect(
      matchesPayload.matches.some((match) => match.matchId === created.matchId),
    ).toBe(true);

    const terminateResponse = await fetch(
      `${baseUrl}/admin/matches/${created.matchId}/terminate`,
      {
        method: "POST",
        headers: authHeaders(),
      },
    );

    expect(terminateResponse.status).toBe(200);
    const terminated = (await terminateResponse.json()) as {
      status: string;
      replayId: string | null;
    };
    expect(terminated.status).toBe("terminated");
    expect(terminated.replayId).toBeTruthy();

    if (!terminated.replayId) {
      throw new Error("Expected replay id after termination.");
    }

    const replaysResponse = await fetch(`${baseUrl}/admin/replays`, {
      headers: authHeaders(),
    });
    expect(replaysResponse.status).toBe(200);
    const replaysPayload = (await replaysResponse.json()) as {
      replays: Array<{ replayId: string }>;
    };
    expect(
      replaysPayload.replays.some(
        (replay) => replay.replayId === terminated.replayId,
      ),
    ).toBe(true);

    const downloadResponse = await fetch(
      `${baseUrl}/admin/replays/${terminated.replayId}/download`,
      {
        headers: authHeaders(),
      },
    );
    expect(downloadResponse.status).toBe(200);
    const replayDownload = await downloadResponse.text();
    expect(replayDownload).toContain(terminated.replayId);

    const metricsResponse = await fetch(`${baseUrl}/admin/metrics`, {
      headers: authHeaders(),
    });
    expect(metricsResponse.status).toBe(200);
    const metrics = (await metricsResponse.json()) as {
      totalMatches: number;
      replayCount: number;
    };
    expect(metrics.totalMatches).toBeGreaterThanOrEqual(1);
    expect(metrics.replayCount).toBeGreaterThanOrEqual(1);

    const leaderboardResponse = await fetch(
      `${baseUrl}/admin/leaderboards/season_01`,
      {
        headers: authHeaders(),
      },
    );
    expect(leaderboardResponse.status).toBe(200);
    const leaderboard = (await leaderboardResponse.json()) as {
      entries: Array<{ playerId: string }>;
    };
    expect(leaderboard.entries.length).toBe(10);
  });
});
