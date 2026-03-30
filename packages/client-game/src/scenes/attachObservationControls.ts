import type * as Phaser from "phaser";

import type { GameDirector } from "../directors/GameDirector";
import type { RuntimeSceneId } from "../directors/types";

const selectFeed = (director: GameDirector, index: number) => {
  const roomId = director.getState().surveillance.feedRooms[index]?.roomId;

  if (roomId) {
    director.focusSurveillanceRoom(roomId);
  }
};

export const attachObservationControls = (
  scene: Phaser.Scene,
  director: GameDirector,
  sceneId: RuntimeSceneId,
) => {
  const keyboard = scene.input.keyboard;

  if (!keyboard) {
    return () => {};
  }

  const bind = (
    eventName: string,
    handler: (event: KeyboardEvent) => void | Promise<void>,
  ) => {
    const guardedHandler = (event: KeyboardEvent) => {
      if (director.getState().activeScene !== sceneId) {
        return;
      }

      handler(event);
    };

    keyboard.on(eventName, guardedHandler);

    return () => {
      keyboard.off(eventName, guardedHandler);
    };
  };

  const disposers = [
    bind("keydown-V", () => {
      director.toggleObservationMode();
    }),
    bind("keydown-ESC", () => {
      director.exitObservationFocus();
    }),
    bind("keydown-Q", () => {
      director.cycleSurveillanceRoom(-1);
    }),
    bind("keydown-E", () => {
      director.cycleSurveillanceRoom(1);
    }),
    bind("keydown-TAB", (event) => {
      event.preventDefault();
      director.cycleSurveillanceRoom(1);
    }),
    bind("keydown-ONE", () => {
      selectFeed(director, 0);
    }),
    bind("keydown-TWO", () => {
      selectFeed(director, 1);
    }),
    bind("keydown-THREE", () => {
      selectFeed(director, 2);
    }),
    bind("keydown-FOUR", () => {
      selectFeed(director, 3);
    }),
  ];

  return () => {
    for (const dispose of disposers) {
      dispose();
    }
  };
};
