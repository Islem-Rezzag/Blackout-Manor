import type {
  ReplayHighlightMarker,
  SavedReplayEnvelope,
} from "@blackout-manor/replay-viewer";
import type {
  LightLevelId,
  MatchSnapshot,
  PlayerId,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";

import type { ClientGameState } from "../types";

export type RuntimeSceneId = "manor-world" | "meeting" | "endgame" | "replay";
export type ObservationMode = "roaming" | "surveillance";
export type CameraReasonId =
  | "meeting"
  | "endgame"
  | "report"
  | "sabotage"
  | "interaction"
  | "surveillance"
  | "actor"
  | "default";

export type CameraPlan = {
  roomId: RoomId | null;
  immediate: boolean;
  reason: CameraReasonId;
  detail: string;
};

export type MeetingPresentation = {
  meetingRoomId: RoomId;
  sequenceId: string;
  originSnapshot: MatchSnapshot;
  alarmRoomId: RoomId | null;
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

export type VisibleSubtitle = {
  text: string;
  speakerId: PlayerId | null;
  roomId: RoomId | null;
  tone: "speech" | "alert" | "status";
};

export type RoomStatusIndicator = {
  roomId: RoomId;
  label: string;
  lightLevel: LightLevelId;
  doorState: MatchSnapshot["rooms"][number]["doorState"];
  occupantCount: number;
  flagged: boolean;
};

export type SurveillanceFeedPresentation = {
  roomId: RoomId;
  label: string;
  lightLevel: LightLevelId;
  doorState: MatchSnapshot["rooms"][number]["doorState"];
  occupants: PublicPlayerState[];
  occupantCount: number;
  statusLine: string;
  priority: number;
  selected: boolean;
  markers: {
    body: boolean;
    sabotage: boolean;
    clue: boolean;
  };
};

export type SurveillancePresentation = {
  available: boolean;
  mode: ObservationMode;
  selectedRoomId: RoomId | null;
  feedRooms: SurveillanceFeedPresentation[];
  statusIndicators: RoomStatusIndicator[];
  subtitle: VisibleSubtitle | null;
  indicatorLabel: string;
  cameraLabel: string;
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
  surveillance: SurveillancePresentation;
};
