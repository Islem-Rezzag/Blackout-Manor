"use client";

import type {
  ClientGameController,
  ClientGameState,
} from "@blackout-manor/client-game";
import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer/schemas";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import {
  buildGameRuntimeConnection,
  type GameRuntimeSurface,
  resolveReplayEndpointForSurface,
} from "./runtimeSurface";

type GameRuntimeHostProps = {
  surface: GameRuntimeSurface;
  roomId: string;
  defaultMode: "mock" | "live";
  defaultServerUrl: string;
  defaultActorId: string | null;
  replayEndpoint?: string | null;
};

const CLIENT_GAME_ASSET_BASE_URL = "/game-assets/client-game";

const describeStatus = (state: ClientGameState | null) => {
  if (!state) {
    return "Joining the manor";
  }

  switch (state.status) {
    case "connecting":
      return "Joining the manor";
    case "connected":
      return "Storm live";
    case "error":
      return "Connection fault";
    case "closed":
      return "Session closed";
    default:
      return "Preparing the floor";
  }
};

export function GameRuntimeHost({
  defaultActorId,
  defaultMode,
  defaultServerUrl,
  replayEndpoint = null,
  roomId,
  surface,
}: GameRuntimeHostProps) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ClientGameController | null>(null);
  const [state, setState] = useState<ClientGameState | null>(null);
  const [replay, setReplay] = useState<SavedReplayEnvelope | null>(null);
  const [replayStatus, setReplayStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const effectiveReplayEndpoint = resolveReplayEndpointForSurface(
    surface,
    replayEndpoint,
  );

  useEffect(() => {
    if (!effectiveReplayEndpoint) {
      setReplay(null);
      setReplayStatus("idle");
      return;
    }

    let active = true;
    setReplayStatus("loading");

    const loadReplay = async () => {
      try {
        const response = await fetch(effectiveReplayEndpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Replay request failed.");
        }

        const payload = parseSavedReplayEnvelope(await response.json());
        if (!active) {
          return;
        }

        startTransition(() => {
          setReplay(payload);
          setReplayStatus("ready");
        });
      } catch {
        if (!active) {
          return;
        }

        setReplay(null);
        setReplayStatus("error");
      }
    };

    void loadReplay();

    return () => {
      active = false;
    };
  }, [effectiveReplayEndpoint]);

  const connection = useMemo(() => {
    return buildGameRuntimeConnection({
      defaultActorId,
      defaultMode,
      defaultServerUrl,
      replay,
      roomId,
      search,
      surface,
    });
  }, [
    defaultActorId,
    defaultMode,
    defaultServerUrl,
    replay,
    roomId,
    search,
    surface,
  ]);

  useEffect(() => {
    if (
      !hostRef.current ||
      (effectiveReplayEndpoint && replayStatus !== "ready")
    ) {
      return;
    }

    let disposed = false;

    const mount = async () => {
      const { mountBlackoutGame } = await import("@blackout-manor/client-game");

      if (!hostRef.current || disposed) {
        return;
      }

      controllerRef.current = await mountBlackoutGame({
        assetBaseUrl: CLIENT_GAME_ASSET_BASE_URL,
        container: hostRef.current,
        connection,
        onStateChange: (nextState) => {
          startTransition(() => {
            setState(nextState);
          });
        },
      });
    };

    void mount();

    return () => {
      disposed = true;
      const controller = controllerRef.current;
      controllerRef.current = null;
      void controller?.destroy();
      if (hostRef.current) {
        hostRef.current.replaceChildren();
      }
    };
  }, [connection, effectiveReplayEndpoint, replayStatus]);

  const issue =
    replayStatus === "error"
      ? "Replay unavailable."
      : (state?.lastValidationError?.message ??
        state?.lastErrorMessage ??
        null);
  const resolvedRoomId = state?.roomId ?? (roomId.trim() || "demo");

  return (
    <section className="game-runtime-shell" data-testid="game-runtime-host">
      <div className="game-runtime-stage">
        <div ref={hostRef} className="game-runtime-canvas-host" />
        <header className="game-runtime-topbar">
          <div className="game-runtime-wordmark">
            <span className="eyebrow">Blackout Manor</span>
            <h1>Masquerade Night</h1>
          </div>
          <div className="game-runtime-badges">
            <span className="play-badge">
              {connection.mode === "replay"
                ? "Replay archive"
                : connection.mode === "mock"
                  ? "Demo room"
                  : "Live room"}
            </span>
            <span className="play-badge" data-testid="game-runtime-room-label">
              Room {resolvedRoomId}
            </span>
            <span className="play-badge">
              {replayStatus === "loading"
                ? "Loading replay"
                : describeStatus(state)}
            </span>
          </div>
        </header>
        {issue ? (
          <div className="game-runtime-status-banner" role="status">
            {issue}
          </div>
        ) : null}
      </div>
    </section>
  );
}
