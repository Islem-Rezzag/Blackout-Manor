import type {
  EngineEvent,
  EngineReplayFrame,
  EngineReplayLog,
} from "@blackout-manor/engine";
import type { PlayerId, RoleId } from "@blackout-manor/shared";

import type { ReplayHighlightMarker } from "./types";

type EngineActionRecordedEvent = Extract<
  EngineEvent,
  { type: "action-recorded" }
>;

type RelationshipMarker = {
  actorId: PlayerId;
  targetPlayerId: PlayerId;
  sequence: number;
  tick: number;
};

const roleToTeam = (role: RoleId) =>
  role === "shadow" ? "shadow" : "household";

const getRoleByPlayerId = (replay: EngineReplayLog) => {
  const roleMap = new Map<PlayerId, RoleId>();

  for (const frame of replay.frames) {
    for (const player of frame.players) {
      roleMap.set(player.id, player.role);
    }
  }

  for (const event of replay.events) {
    if (event.type !== "roles-assigned") {
      continue;
    }

    for (const assignment of event.assignments) {
      roleMap.set(assignment.playerId, assignment.role);
    }
  }

  return roleMap;
};

const getPlayerNameById = (replay: EngineReplayLog) => {
  const nameMap = new Map<PlayerId, string>();

  for (const frame of replay.frames) {
    for (const player of frame.players) {
      nameMap.set(player.id, player.displayName);
    }
  }

  return nameMap;
};

const getFrameIndexBySequence = (replay: EngineReplayLog) => {
  const frameIndex = new Map<number, number>();

  replay.frames.forEach((frame, index) => {
    frame.events.forEach((event) => {
      frameIndex.set(event.sequence, index);
    });
  });

  return frameIndex;
};

const getFrameBeforeEvent = (
  replay: EngineReplayLog,
  frameIndexBySequence: Map<number, number>,
  sequence: number,
): EngineReplayFrame | null => {
  const frameIndex = frameIndexBySequence.get(sequence);

  if (typeof frameIndex !== "number" || frameIndex <= 0) {
    return null;
  }

  return replay.frames[frameIndex - 1] ?? null;
};

const createMarker = (
  kind: ReplayHighlightMarker["kind"],
  sequence: number,
  tick: number,
  title: string,
  description: string,
  playersInvolved: PlayerId[],
  metadata: ReplayHighlightMarker["metadata"],
): ReplayHighlightMarker => ({
  id: `${kind}:${sequence}`,
  kind,
  sequence,
  tick,
  title,
  description,
  playersInvolved,
  metadata,
});

const pushUniqueMarker = (
  markers: ReplayHighlightMarker[],
  marker: ReplayHighlightMarker,
) => {
  if (markers.some((candidate) => candidate.id === marker.id)) {
    return;
  }

  markers.push(marker);
};

const actionEventToMarker = (
  _replay: EngineReplayLog,
  event: EngineActionRecordedEvent,
  playerNames: Map<PlayerId, string>,
  promises: Map<string, RelationshipMarker>,
  confidences: Map<string, RelationshipMarker>,
): ReplayHighlightMarker[] => {
  const markers: ReplayHighlightMarker[] = [];
  const actorName =
    playerNames.get(event.proposal.actorId) ?? event.proposal.actorId;

  switch (event.proposal.actionId) {
    case "report-body": {
      const targetName =
        playerNames.get(event.proposal.discoveredPlayerId) ??
        event.proposal.discoveredPlayerId;

      markers.push(
        createMarker(
          "report",
          event.sequence,
          event.tick,
          "Body reported",
          `${actorName} reported ${targetName}.`,
          [event.proposal.actorId, event.proposal.discoveredPlayerId],
          {
            actionId: event.proposal.actionId,
          },
        ),
      );
      break;
    }
    case "promise": {
      promises.set(
        `${event.proposal.actorId}:${event.proposal.targetPlayerId}`,
        {
          actorId: event.proposal.actorId,
          targetPlayerId: event.proposal.targetPlayerId,
          sequence: event.sequence,
          tick: event.tick,
        },
      );
      break;
    }
    case "confide": {
      confidences.set(
        `${event.proposal.actorId}:${event.proposal.targetPlayerId}`,
        {
          actorId: event.proposal.actorId,
          targetPlayerId: event.proposal.targetPlayerId,
          sequence: event.sequence,
          tick: event.tick,
        },
      );
      break;
    }
    case "vote-player":
    case "eliminate": {
      const targetPlayerId = event.proposal.targetPlayerId;
      const targetName = playerNames.get(targetPlayerId) ?? targetPlayerId;
      const promiseKey = `${event.proposal.actorId}:${targetPlayerId}`;
      const outgoingPromise = promises.get(promiseKey);
      const outgoingConfide = confidences.get(promiseKey);

      if (outgoingPromise) {
        markers.push(
          createMarker(
            "promise-break",
            event.sequence,
            event.tick,
            "Promise broken",
            `${actorName} promised safety to ${targetName}, then turned on them.`,
            [event.proposal.actorId, targetPlayerId],
            {
              triggerActionId: event.proposal.actionId,
              promiseSequence: outgoingPromise.sequence,
            },
          ),
        );
      }

      if (outgoingConfide) {
        markers.push(
          createMarker(
            "betrayal",
            event.sequence,
            event.tick,
            "Alliance betrayed",
            `${actorName} confided in ${targetName}, then betrayed that trust.`,
            [event.proposal.actorId, targetPlayerId],
            {
              triggerActionId: event.proposal.actionId,
              confideSequence: outgoingConfide.sequence,
            },
          ),
        );
      }
      break;
    }
  }

  return markers;
};

export const extractReplayHighlights = (
  replay: EngineReplayLog,
): ReplayHighlightMarker[] => {
  const markers: ReplayHighlightMarker[] = [];
  const roleByPlayerId = getRoleByPlayerId(replay);
  const playerNames = getPlayerNameById(replay);
  const frameIndexBySequence = getFrameIndexBySequence(replay);
  const promises = new Map<string, RelationshipMarker>();
  const confidences = new Map<string, RelationshipMarker>();

  for (const event of replay.events) {
    if (event.type === "action-recorded") {
      const derivedMarkers = actionEventToMarker(
        replay,
        event,
        playerNames,
        promises,
        confidences,
      );

      for (const marker of derivedMarkers) {
        pushUniqueMarker(markers, marker);
      }

      continue;
    }

    if (event.type !== "vote-resolved" || !event.exiledPlayerId) {
      continue;
    }

    const exiledRole = roleByPlayerId.get(event.exiledPlayerId);
    const exiledName =
      playerNames.get(event.exiledPlayerId) ?? event.exiledPlayerId;

    if (exiledRole && roleToTeam(exiledRole) === "household") {
      pushUniqueMarker(
        markers,
        createMarker(
          "wrong-vote",
          event.sequence,
          event.tick,
          "Wrong vote",
          `${exiledName} was exiled even though they were not a Shadow.`,
          [event.exiledPlayerId],
          {
            exiledRole,
          },
        ),
      );
    }

    if (exiledRole && roleToTeam(exiledRole) === "shadow") {
      const previousFrame = getFrameBeforeEvent(
        replay,
        frameIndexBySequence,
        event.sequence,
      );

      if (!previousFrame) {
        continue;
      }

      const aliveHousehold = previousFrame.players.filter(
        (player) =>
          player.status === "alive" && roleToTeam(player.role) === "household",
      ).length;
      const aliveShadows = previousFrame.players.filter(
        (player) =>
          player.status === "alive" && roleToTeam(player.role) === "shadow",
      ).length;

      if (aliveHousehold - aliveShadows > 1) {
        continue;
      }

      pushUniqueMarker(
        markers,
        createMarker(
          "clutch-save",
          event.sequence,
          event.tick,
          "Clutch save",
          `${exiledName} was removed with the Shadows close to parity.`,
          [event.exiledPlayerId],
          {
            aliveHousehold,
            aliveShadows,
          },
        ),
      );
    }
  }

  return markers.sort((left, right) => left.sequence - right.sequence);
};
