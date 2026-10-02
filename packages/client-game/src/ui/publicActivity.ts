import {
  DEFAULT_ROOM_LABELS,
  type MatchSnapshot,
} from "@blackout-manor/shared";
import { PHASE_LABELS } from "../session/sessionPresentation";

export const derivePublicActivity = (snapshot: MatchSnapshot) => {
  const name = (id: string) =>
    snapshot.players.find((player) => player.id === id)?.displayName ??
    "A guest";
  return [...snapshot.recentEvents]
    .reverse()
    .flatMap((event) => {
      let text: string;
      switch (event.eventId) {
        case "phase-changed":
          text = `${PHASE_LABELS[event.toPhaseId]} begins`;
          break;
        case "discussion-turn":
          text = `${name(event.playerId)}: ${event.text}`;
          break;
        case "task-completed":
          text = `${name(event.playerId)} restored a task in ${DEFAULT_ROOM_LABELS[event.roomId]}`;
          break;
        case "task-progressed":
          text = `${name(event.playerId)} is working in ${DEFAULT_ROOM_LABELS[event.roomId]}`;
          break;
        case "body-reported":
          text = `A body was reported in ${event.roomId ? DEFAULT_ROOM_LABELS[event.roomId] : "the manor"}`;
          break;
        case "meeting-called":
          text = "The guests have been called to the hall";
          break;
        case "sabotage-triggered":
          text = `Sabotage in ${event.roomId ? DEFAULT_ROOM_LABELS[event.roomId] : "the manor"}`;
          break;
        case "vote-cast":
          text = `${name(event.playerId)} cast a ballot`;
          break;
        case "player-exiled":
          text = `${name(event.playerId)} was exiled`;
          break;
        default:
          return [];
      }
      return [{ id: event.id, tick: event.tick, text }];
    })
    .slice(0, 5);
};
