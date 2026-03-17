import { Suspense } from "react";

import { env } from "@/env";
import { GameRuntimeHost } from "@/features/game/GameRuntimeHost";

type GameRoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function GameRoomPage({ params }: GameRoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="game-route-page">
      <Suspense
        fallback={
          <section className="game-runtime-shell">
            <div className="game-runtime-stage game-runtime-loading">
              <div className="game-runtime-topbar">
                <div className="game-runtime-wordmark">
                  <span className="eyebrow">Blackout Manor</span>
                  <h1>Masquerade Night</h1>
                </div>
              </div>
              <div className="game-runtime-status-banner" role="status">
                Joining room {roomId}
              </div>
            </div>
          </section>
        }
      >
        <GameRuntimeHost
          roomId={roomId}
          defaultMode={env.NEXT_PUBLIC_CLIENT_GAME_MODE}
          defaultServerUrl={env.NEXT_PUBLIC_MATCH_SERVER_URL}
          defaultActorId={env.NEXT_PUBLIC_MATCH_PLAYER_ID ?? null}
        />
      </Suspense>
    </main>
  );
}
