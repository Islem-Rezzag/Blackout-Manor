import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";
import type { MatchSnapshot } from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import type { ClientGameRuntime } from "../bootstrap/runtime";
import type { ClientGameState } from "../types";
import { CameraDirector } from "./CameraDirector";
import { MeetingDirector } from "./MeetingDirector";
import { PhaseDirector } from "./PhaseDirector";
import { ReplayDirector } from "./ReplayDirector";
import { SurveillanceDirector } from "./SurveillanceDirector";
import type {
  EndgamePresentation,
  GamePresentationState,
  ObservationMode,
  RuntimeSceneId,
} from "./types";

const CONTENT_SCENE_KEYS = {
  "manor-world": "manor-world",
  meeting: "meeting",
  endgame: "endgame",
  replay: "replay",
} as const;

type Listener = (state: GamePresentationState) => void;

const roleTitle = (
  role: NonNullable<ClientGameState["privateState"]>["role"] | undefined,
) => {
  switch (role) {
    case "shadow":
      return "Shadow";
    case "investigator":
      return "Investigator";
    case "steward":
      return "Steward";
    case "household":
      return "Household";
    default:
      return "Witness";
  }
};

const buildBanner = (
  state: ClientGameState,
  scene: RuntimeSceneId,
  snapshot: MatchSnapshot | null,
) => {
  if (scene === "replay") {
    return {
      eyebrow: "Replay",
      title: "Replay theater",
      detail: "Revisit the same night through the same in-world camera path.",
    };
  }

  if (!snapshot) {
    return {
      eyebrow: "Connecting",
      title: "Storm over Blackout Manor",
      detail: "The house is drawing the cast into place.",
    };
  }

  if (scene === "meeting") {
    return {
      eyebrow: snapshot.phaseId.toUpperCase(),
      title: "The hall convenes",
      detail: "Every surviving guest is pulled into the chandelier light.",
    };
  }

  if (scene === "endgame") {
    return {
      eyebrow: "Resolution",
      title: "The night resolves",
      detail:
        "The manor gives its last answer before the storm finally breaks.",
    };
  }

  if (snapshot.phaseId === "report") {
    return {
      eyebrow: "Report",
      title: "A report cuts through the storm",
      detail:
        "The camera turns to the discovered room before the hall gathers.",
    };
  }

  return {
    eyebrow: snapshot.phaseId.toUpperCase(),
    title: "Masquerade Night",
    detail:
      state.mode === "live"
        ? "Watch the manor in motion as stories form, fracture, and harden."
        : "Local demo mode preserves the same world-first night inside the manor.",
  };
};

const createEndgamePresentation = (
  snapshot: MatchSnapshot,
  runtimeState: ClientGameState,
  replayEnvelope: SavedReplayEnvelope | null,
): EndgamePresentation => {
  const stagedPlayers = snapshot.players.map((player) => ({
    ...player,
    roomId: "grand-hall" as const,
    bodyLanguage:
      player.status === "alive" ? ("confident" as const) : ("shaken" as const),
  }));

  const stagedRooms = snapshot.rooms.map((room) =>
    room.roomId === "grand-hall"
      ? {
          ...room,
          lightLevel: "lit" as const,
          doorState: "open" as const,
          occupantIds: stagedPlayers.map((player) => player.id),
        }
      : {
          ...room,
          occupantIds: [],
        },
  );

  const winner = replayEnvelope?.summary.winner ?? null;
  const role = runtimeState.privateState?.role;

  return {
    stagedSnapshot: {
      ...snapshot,
      players: stagedPlayers,
      rooms: stagedRooms,
    },
    title: winner
      ? `${winner.team === "shadow" ? "Shadows" : "Household"} take the manor`
      : "The storm leaves only survivors and silence",
    subtitle: winner
      ? `Win condition: ${winner.reason}`
      : role
        ? `You leave the manor as ${roleTitle(role)}.`
        : "Live mode keeps hidden-role reveals sealed on the player path.",
    summaryTag: winner ? `Tick ${winner.decidedAtTick}` : "Public result",
  };
};

export class GameDirector {
  readonly #runtime: ClientGameRuntime;
  readonly #phaseDirector = new PhaseDirector();
  readonly #cameraDirector = new CameraDirector();
  readonly #meetingDirector = new MeetingDirector();
  readonly #replayDirector: ReplayDirector;
  readonly #surveillanceDirector = new SurveillanceDirector();
  readonly #listeners = new Set<Listener>();
  #scenePlugin: Phaser.Scenes.ScenePlugin | null = null;
  #state: GamePresentationState;

  constructor(
    runtime: ClientGameRuntime,
    replayEnvelope: SavedReplayEnvelope | null,
  ) {
    this.#runtime = runtime;
    this.#replayDirector = new ReplayDirector(replayEnvelope);
    this.#state = this.#deriveState(runtime.getState(), replayEnvelope);

    runtime.subscribe((runtimeState) => {
      this.#state = this.#deriveState(runtimeState, replayEnvelope);
      this.#emit();
      this.#syncSceneActivation();
    });
  }

  attachScenePlugin(scenePlugin: Phaser.Scenes.ScenePlugin) {
    this.#scenePlugin = scenePlugin;
    this.#syncSceneActivation();
  }

  getState() {
    return this.#state;
  }

  subscribe(listener: Listener) {
    this.#listeners.add(listener);
    listener(this.#state);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  stepReplay(delta: number) {
    this.#replayDirector.step(delta);
    this.#state = this.#deriveState(
      this.#runtime.getState(),
      this.#state.replay?.envelope ?? null,
    );
    this.#emit();
    this.#syncSceneActivation();
  }

  jumpReplay(index: number) {
    this.#replayDirector.jump(index);
    this.#state = this.#deriveState(
      this.#runtime.getState(),
      this.#state.replay?.envelope ?? null,
    );
    this.#emit();
    this.#syncSceneActivation();
  }

  toggleObservationMode() {
    this.#surveillanceDirector.toggleMode();
    this.#refreshDerivedState();
  }

  setObservationMode(mode: ObservationMode) {
    this.#surveillanceDirector.setMode(mode);
    this.#refreshDerivedState();
  }

  focusSurveillanceRoom(roomId: MatchSnapshot["rooms"][number]["roomId"]) {
    this.#surveillanceDirector.focusRoom(roomId);
    this.#refreshDerivedState();
  }

  cycleSurveillanceRoom(delta: number) {
    const rooms = this.#state.surveillance.feedRooms.map((feed) => feed.roomId);
    this.#surveillanceDirector.cycleFocus(rooms, delta);
    this.#refreshDerivedState();
  }

  #deriveState(
    runtimeState: ClientGameState,
    replayEnvelope: SavedReplayEnvelope | null,
  ): GamePresentationState {
    const replay = this.#replayDirector.derive(runtimeState);
    const activeScene = this.#phaseDirector.resolveScene(runtimeState, replay);
    const snapshot = replay?.snapshot ?? runtimeState.snapshot;
    const meeting =
      snapshot && activeScene === "meeting"
        ? this.#meetingDirector.derive(snapshot)
        : null;
    const stageSnapshot =
      activeScene === "meeting"
        ? (meeting?.stagedSnapshot ?? snapshot)
        : activeScene === "endgame" && snapshot
          ? createEndgamePresentation(snapshot, runtimeState, replayEnvelope)
              .stagedSnapshot
          : snapshot;
    const endgame =
      activeScene === "endgame" && snapshot
        ? createEndgamePresentation(snapshot, runtimeState, replayEnvelope)
        : null;
    const initialCamera = this.#cameraDirector.resolvePlan({
      scene: activeScene,
      runtimeState,
      snapshot: stageSnapshot,
      meetingRoomId: meeting?.meetingRoomId ?? null,
      observationMode: "roaming",
      surveillanceRoomId: null,
    });
    const surveillance = this.#surveillanceDirector.derive({
      scene: activeScene,
      snapshot: stageSnapshot,
      runtimeState,
      camera: initialCamera,
    });
    const camera = this.#cameraDirector.resolvePlan({
      scene: activeScene,
      runtimeState,
      snapshot: stageSnapshot,
      meetingRoomId: meeting?.meetingRoomId ?? null,
      observationMode: surveillance.mode,
      surveillanceRoomId: surveillance.selectedRoomId,
    });

    return {
      runtimeState,
      activeScene,
      snapshot: stageSnapshot,
      camera,
      banner: buildBanner(runtimeState, activeScene, snapshot),
      meeting,
      endgame,
      replay,
      surveillance: {
        ...surveillance,
        cameraLabel: camera.detail,
      },
    };
  }

  #refreshDerivedState() {
    this.#state = this.#deriveState(
      this.#runtime.getState(),
      this.#state.replay?.envelope ?? null,
    );
    this.#emit();
    this.#syncSceneActivation();
  }

  #syncSceneActivation() {
    if (!this.#scenePlugin) {
      return;
    }

    for (const [sceneId, sceneKey] of Object.entries(
      CONTENT_SCENE_KEYS,
    ) as Array<[RuntimeSceneId, string]>) {
      if (sceneId === this.#state.activeScene) {
        this.#scenePlugin.wake(sceneKey);
        this.#scenePlugin.bringToTop(sceneKey);
      } else {
        this.#scenePlugin.sleep(sceneKey);
      }
    }
  }

  #emit() {
    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}
