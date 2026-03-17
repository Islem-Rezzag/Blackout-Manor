import type { MatchEvent, MatchSnapshot, RoomId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

export type RoomSignal = {
  clue: boolean;
  body: boolean;
  sabotage: boolean;
  sabotageLabel: string | null;
};

export const readableTaskLabel = (taskId: string) =>
  taskId
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

export const eventRoomId = (event: MatchEvent): RoomId | null => {
  switch (event.eventId) {
    case "task-progressed":
    case "task-completed":
    case "player-eliminated":
    case "body-reported":
    case "clue-discovered":
      return event.roomId;
    case "sabotage-triggered":
      return event.roomId ?? null;
    default:
      return null;
  }
};

export const createRoomSignalMap = (snapshot: MatchSnapshot) => {
  const signals = new Map<RoomId, RoomSignal>();

  for (const roomState of snapshot.rooms) {
    signals.set(roomState.roomId, {
      clue: false,
      body: false,
      sabotage: false,
      sabotageLabel: null,
    });
  }

  for (const event of snapshot.recentEvents) {
    switch (event.eventId) {
      case "clue-discovered": {
        const roomSignal = signals.get(event.roomId);
        if (roomSignal) {
          roomSignal.clue = true;
        }
        break;
      }
      case "player-eliminated":
      case "body-reported": {
        const roomSignal = signals.get(event.roomId);
        if (roomSignal) {
          roomSignal.body = true;
        }
        break;
      }
      case "sabotage-triggered":
        if (event.roomId) {
          const roomSignal = signals.get(event.roomId);
          if (roomSignal) {
            roomSignal.sabotage = true;
            roomSignal.sabotageLabel = readableTaskLabel(event.actionId);
          }
        }
        break;
      default:
        break;
    }
  }

  return signals;
};

export const describeSignalLabel = (
  roomState: MatchSnapshot["rooms"][number],
  signal: RoomSignal,
) => {
  if (signal.body) {
    return "Report site";
  }

  if (signal.sabotageLabel) {
    return signal.sabotageLabel;
  }

  if (signal.clue) {
    return "Fresh clue";
  }

  if (roomState.lightLevel === "blackout") {
    return "Blackout";
  }

  if (roomState.doorState === "sealed") {
    return "Sealed";
  }

  if (roomState.doorState === "jammed") {
    return "Jammed";
  }

  if (roomState.occupantIds.length >= 4) {
    return "Crowded";
  }

  if (roomState.occupantIds.length === 0) {
    return "Quiet";
  }

  return "Under watch";
};

export const blackoutStrengthFromSnapshot = (snapshot: MatchSnapshot) => {
  const blackoutRooms = snapshot.rooms.filter(
    (roomState) => roomState.lightLevel === "blackout",
  ).length;
  const dimRooms = snapshot.rooms.filter(
    (roomState) => roomState.lightLevel === "dim",
  ).length;

  if (blackoutRooms > 0) {
    return 0.58 + (blackoutRooms / snapshot.rooms.length) * 0.34;
  }

  if (dimRooms > 0) {
    return 0.22 + (dimRooms / snapshot.rooms.length) * 0.18;
  }

  return 0.08;
};

const splitColor = (color: number) => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

export const mixColor = (
  fromColor: number,
  toColor: number,
  amount: number,
) => {
  const from = splitColor(fromColor);
  const to = splitColor(toColor);
  const clamped = Phaser.Math.Clamp(amount, 0, 1);
  const r = Math.round(from.r + (to.r - from.r) * clamped);
  const g = Math.round(from.g + (to.g - from.g) * clamped);
  const b = Math.round(from.b + (to.b - from.b) * clamped);

  return (r << 16) | (g << 8) | b;
};

export const lightLevelToFactor = (
  lightLevel: MatchSnapshot["rooms"][number]["lightLevel"],
) => {
  switch (lightLevel) {
    case "blackout":
      return 0.14;
    case "dim":
      return 0.48;
    default:
      return 1;
  }
};
