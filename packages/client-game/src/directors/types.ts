import type {
  ReplayHighlightMarker,
  SavedReplayEnvelope,
} from "@blackout-manor/replay-viewer";
import type { MatchSnapshot, PlayerId, RoomId } from "@blackout-manor/shared";

import type { ClientGameState } from "../types";

export type RuntimeSceneId = "manor-world" | "meeting" | "endgame" | "replay";

export type CameraPlan = {
  roomId: RoomId | null;
  immediate: boolean;
};

export type MeetingPresentation = {
  meetingRoomId: RoomId;
  stagedSnapshot: MatchSnapshot;
  speakerId: PlayerId | null;
  targetPlayerId: PlayerId | null;
  header: string;
  detail: string;
};

export type EndgamePresentation = {
  stagedSnapshot: MatchSnapshot;
  title: string;
  subtitle: string;
  summaryTag: string;
};

export type ReplayPresentation = {
  envelope: SavedReplayEnvelope;
  frameIndex: number;
  totalFrames: number;
  snapshot: MatchSnapshot | null;
  title: string;
  subtitle: string;
  highlightMarkers: ReplayHighlightMarker[];
  canStepBackward: boolean;
  canStepForward: boolean;
};

export type GamePresentationState = {
  runtimeState: ClientGameState;
  activeScene: RuntimeSceneId;
  snapshot: MatchSnapshot | null;
  camera: CameraPlan;
  banner: {
    eyebrow: string;
    title: string;
    detail: string;
  };
  meeting: MeetingPresentation | null;
  endgame: EndgamePresentation | null;
  replay: ReplayPresentation | null;
};
