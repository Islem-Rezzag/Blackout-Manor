import { Suspense } from "react";
import { env } from "@/env";
import { BlackoutGameShell } from "@/features/play/BlackoutGameShell";

export default function PlayPage() {
  return (
    <main className="play-shell">
      <header className="play-header">
        <div>
          <span className="eyebrow">Night Interface</span>
          <h1>Blackout Manor control room</h1>
          <p>
            Live player mode keeps the server authoritative, spectator mode
            keeps hidden information sealed until the night ends, and replay
            theater opens the deeper social dossier after the match.
          </p>
        </div>
        <div className="play-badges">
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
