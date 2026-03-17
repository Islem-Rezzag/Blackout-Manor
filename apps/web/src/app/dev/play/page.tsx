import { Suspense } from "react";

import { env } from "@/env";
import { GameRuntimeHost } from "@/features/game/GameRuntimeHost";
import { BlackoutGameShell } from "@/features/play/BlackoutGameShell";

type DevPlayPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DevPlayPage({ searchParams }: DevPlayPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = Array.isArray(resolvedSearchParams.view)
    ? resolvedSearchParams.view[0]
    : resolvedSearchParams.view;
  const replaySource = Array.isArray(resolvedSearchParams.source)
    ? resolvedSearchParams.source[0]
    : resolvedSearchParams.source;
  const roomId = Array.isArray(resolvedSearchParams.roomId)
    ? resolvedSearchParams.roomId[0]
    : resolvedSearchParams.roomId;
  const resolvedRoomId = roomId ?? env.NEXT_PUBLIC_MATCH_ROOM_ID ?? "demo";

  if (viewParam === "replay") {
    return (
      <main className="game-route-page">
        <Suspense
          fallback={
            <section className="game-runtime-shell">
              <div className="game-runtime-stage game-runtime-loading">
                <div className="game-runtime-topbar">
                  <div className="game-runtime-wordmark">
                    <span className="eyebrow">Blackout Manor</span>
                    <h1>Replay Archive</h1>
                  </div>
                </div>
                <div className="game-runtime-status-banner" role="status">
                  Loading replay runtime
                </div>
              </div>
            </section>
          }
        >
          <GameRuntimeHost
            roomId={resolvedRoomId}
            defaultMode={env.NEXT_PUBLIC_CLIENT_GAME_MODE}
            defaultServerUrl={env.NEXT_PUBLIC_MATCH_SERVER_URL}
            defaultActorId={env.NEXT_PUBLIC_MATCH_PLAYER_ID ?? null}
            replayEndpoint={
              replaySource === "open"
                ? "/api/replays/open"
                : "/api/replays/sample"
            }
          />
        </Suspense>
      </main>
    );
  }

  return (
    <main className="play-shell">
      <header className="play-header">
        <div>
          <span className="eyebrow">Developer Control Room</span>
          <h1>Blackout Manor control room</h1>
          <p>
            This shell keeps player, spectator, replay, and debugging workflows
            accessible for development. The primary live player path now starts
            at <a href="/game/demo">/game/[roomId]</a>.
          </p>
        </div>
        <div className="play-badges">
          <a className="view-nav-link" href="/game/demo">
            Enter demo room
          </a>
          <a className="view-nav-link" href="/dev">
            Developer routes
          </a>
          <span className="play-badge">
            Default {env.NEXT_PUBLIC_CLIENT_GAME_MODE}
          </span>
          <span className="play-badge">
            Server {env.NEXT_PUBLIC_MATCH_SERVER_URL}
          </span>
        </div>
      </header>
      <Suspense
        fallback={
          <section className="support-panel replay-loading">
            <span className="eyebrow">Loading</span>
            <h2>Preparing the manor interface</h2>
            <p>
              Loading player, spectator, and replay controls for the current
              room.
            </p>
          </section>
        }
      >
        <BlackoutGameShell
          defaultMode={env.NEXT_PUBLIC_CLIENT_GAME_MODE}
          defaultRoomId={env.NEXT_PUBLIC_MATCH_ROOM_ID ?? null}
          defaultServerUrl={env.NEXT_PUBLIC_MATCH_SERVER_URL}
          defaultActorId={env.NEXT_PUBLIC_MATCH_PLAYER_ID ?? null}
          sampleReplayEndpoint="/api/replays/sample"
        />
      </Suspense>
    </main>
  );
}
