"use client";

import type {
  ClientGameController,
  ClientGameState,
} from "@blackout-manor/client-game";
import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import { parseSavedReplayEnvelope } from "@blackout-manor/replay-viewer/schemas";
import { usePathname, useSearchParams } from "next/navigation";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LiveGamePanels } from "./LiveGamePanels";
import { ReplayTheater } from "./ReplayTheater";
import {
  deriveLiveUiModel,
  deriveReplayUiModel,
  type PlayShellDefaults,
  type PlaySurfaceMode,
  readPlayShellConfig,
} from "./uiModel";

type BlackoutGameShellProps = PlayShellDefaults & {
  sampleReplayEndpoint: string;
};

const useDownloadUrl = (payload: string | null) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    setUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [payload]);

  return url;
};

export function BlackoutGameShell({
  defaultActorId,
  defaultMode,
  defaultRoomId,
  defaultServerUrl,
  sampleReplayEndpoint,
}: BlackoutGameShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ClientGameController | null>(null);
  const [state, setState] = useState<ClientGameState | null>(null);
  const [sampleReplay, setSampleReplay] = useState<SavedReplayEnvelope | null>(
    null,
  );
  const [replayStatus, setReplayStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [replayFrameIndex, setReplayFrameIndex] = useState(0);
  const deferredFrameIndex = useDeferredValue(replayFrameIndex);
  const search = searchParams.toString();
  const replaySource = searchParams.get("source");
  const shellConfig = useMemo(
    () =>
      readPlayShellConfig(
        {
          defaultActorId,
          defaultMode,
          defaultRoomId,
          defaultServerUrl,
        },
        search.length > 0 ? `?${search}` : "",
      ),
    [defaultActorId, defaultMode, defaultRoomId, defaultServerUrl, search],
  );
  const surfaceMode = shellConfig.surfaceMode;
  const replayEndpoint =
    replaySource === "open" ? "/api/replays/open" : sampleReplayEndpoint;

  useEffect(() => {
    if (
      surfaceMode === "replay" ||
      !shellConfig.connection ||
      !hostRef.current
    ) {
      return;
    }

    let disposed = false;
    const connection = shellConfig.connection;

    const mount = async () => {
      const { mountBlackoutGame } = await import("@blackout-manor/client-game");

      if (!hostRef.current || disposed) {
        return;
      }

      controllerRef.current = await mountBlackoutGame({
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
  }, [shellConfig.connection, surfaceMode]);

  useEffect(() => {
    if (surfaceMode !== "replay") {
      setSampleReplay(null);
      setReplayStatus("idle");
      setReplayFrameIndex(0);
      return;
    }

    let active = true;
    setReplayStatus("loading");

    const loadReplay = async () => {
      try {
        const response = await fetch(replayEndpoint, {
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
          setSampleReplay(payload);
          setReplayFrameIndex(0);
          setReplayStatus("ready");
        });
      } catch {
        if (!active) {
          return;
        }

        setReplayStatus("error");
      }
    };

    void loadReplay();

    return () => {
      active = false;
    };
  }, [replayEndpoint, surfaceMode]);

  const liveModel = useMemo(
    () => deriveLiveUiModel(state, surfaceMode),
    [state, surfaceMode],
  );
  const replayModel = useMemo(
    () =>
      sampleReplay
        ? deriveReplayUiModel(sampleReplay, deferredFrameIndex)
        : null,
    [deferredFrameIndex, sampleReplay],
  );
  const replayUrl = useDownloadUrl(
    replayModel?.exportPayload.replayJson ?? null,
  );
  const highlightsUrl = useDownloadUrl(
    replayModel?.exportPayload.highlightsJson ?? null,
  );

  const buildViewHref = (nextView: PlaySurfaceMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);

    if (nextView === "spectator") {
      params.delete("playerId");
    } else if (
      nextView === "player" &&
      !params.get("playerId") &&
      defaultActorId
    ) {
      params.set("playerId", defaultActorId);
    }

    const nextSearch = params.toString();
    return nextSearch.length > 0 ? `${pathname}?${nextSearch}` : pathname;
  };

  return (
    <>
      <nav className="play-view-nav">
        <a
          className={`view-nav-link${surfaceMode === "player" ? " active" : ""}`}
          href={buildViewHref("player")}
        >
          Player view
        </a>
        <a
          className={`view-nav-link${surfaceMode === "spectator" ? " active" : ""}`}
          href={buildViewHref("spectator")}
        >
          Spectator view
        </a>
        <a
          className={`view-nav-link${surfaceMode === "replay" ? " active" : ""}`}
          href={buildViewHref("replay")}
        >
          Replay theater
        </a>
      </nav>

      {surfaceMode === "replay" ? (
        <ReplayTheater
          status={replayStatus}
          model={replayModel}
          replayUrl={replayUrl}
          highlightsUrl={highlightsUrl}
          onFrameChange={(event) => {
            setReplayFrameIndex(event.currentTarget.valueAsNumber);
          }}
        />
      ) : (
        <LiveGamePanels model={liveModel} state={state} hostRef={hostRef} />
      )}
    </>
  );
}
