import {
  DEFAULT_ROOM_LABELS,
  type MatchSnapshot,
  type PlayerId,
} from "@blackout-manor/shared";
import type {
  CameraPlan,
  InspectionPresentation,
  RuntimeSceneId,
} from "./types";

export const deriveFollowInspection = (options: {
  followedPlayerId: PlayerId | null;
  snapshot: MatchSnapshot | null;
  scene: RuntimeSceneId;
  camera: CameraPlan;
}): InspectionPresentation | null => {
  const { snapshot, followedPlayerId, scene, camera } = options;
  if (
    !snapshot ||
    !followedPlayerId ||
    !["manor-world", "replay"].includes(scene)
  )
    return null;
  if (
    !["intro", "roam"].includes(snapshot.phaseId) ||
    ["report", "sabotage", "endgame"].includes(camera.reason)
  )
    return null;
  const player = snapshot.players.find(
    (candidate) => candidate.id === followedPlayerId,
  );
  if (!player?.roomId || player.status !== "alive") return null;
  return {
    mode: "inspect",
    roomId: player.roomId,
    immediate: false,
    label: `Following ${player.displayName} / ${DEFAULT_ROOM_LABELS[player.roomId]}`,
    detail: "Public guest location",
  };
};
