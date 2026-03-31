import { GameDirector } from "../directors/GameDirector";
import type { BlackoutGameMountOptions, ClientGameController } from "../types";

import { ClientGameRuntime } from "./runtime";

export const mountBlackoutGame = async ({
  assetBaseUrl,
  container,
  connection,
  width,
  height,
  onStateChange,
}: BlackoutGameMountOptions): Promise<ClientGameController> => {
  const [Phaser, { createGameConfig }] = await Promise.all([
    import("phaser"),
    import("./createGameConfig"),
  ]);
  const runtime = new ClientGameRuntime({
    connection,
    ...(onStateChange ? { onStateChange } : {}),
  });
  const director = new GameDirector(
    runtime,
    connection.mode === "replay" ? connection.replay : null,
  );
  const game = new Phaser.Game(
    createGameConfig({
      ...(assetBaseUrl ? { assetBaseUrl } : {}),
      container,
      director,
      runtime,
      ...(typeof width === "number" ? { width } : {}),
      ...(typeof height === "number" ? { height } : {}),
    }),
  );

  await runtime.start();

  return {
    mode: runtime.mode,
    roomId: runtime.roomId,
    getState: () => runtime.getState(),
    subscribe: (listener) => runtime.subscribe(listener),
    sendIntent: (message) => runtime.sendIntent(message),
    requestReplay: (request) => runtime.requestReplay(request),
    seekReplay: (replayId, tick) => runtime.seekReplay(replayId, tick),
    destroy: async () => {
      await runtime.destroy();
      game.destroy(true);
    },
  };
};
