import { describe, expect, it, vi } from "vitest";

import { createScreenSpaceCamera } from "./ScreenSpaceCamera";

describe("screen-space overlays", () => {
  it("separates UI roots from the world camera and fits the viewport", () => {
    const roots = [{}];
    const world = {};
    const camera = { ignore: vi.fn() };
    const scene = {
      scale: { width: 390, height: 844 },
      children: { list: [world, ...roots] },
      cameras: { add: vi.fn(() => camera), main: { ignore: vi.fn() } },
      events: { on: vi.fn(), once: vi.fn(), off: vi.fn() },
    };
    createScreenSpaceCamera(
      scene as unknown as Parameters<typeof createScreenSpaceCamera>[0],
      roots as Parameters<typeof createScreenSpaceCamera>[1],
    );
    expect(scene.cameras.add).toHaveBeenCalledWith(0, 0, 390, 844);
    expect(camera.ignore).toHaveBeenCalledWith([world]);
    expect(scene.cameras.main.ignore).toHaveBeenCalledWith(roots);
  });

  it("excludes late world objects and detaches on scene shutdown", () => {
    const roots = [{}];
    const world = {};
    const lateAvatar = {};
    const camera = { ignore: vi.fn() };
    const scene = {
      scale: { width: 1280, height: 820 },
      children: { list: [world, ...roots] },
      cameras: { add: vi.fn(() => camera), main: { ignore: vi.fn() } },
      events: { on: vi.fn(), once: vi.fn(), off: vi.fn() },
    };
    createScreenSpaceCamera(
      scene as unknown as Parameters<typeof createScreenSpaceCamera>[0],
      roots as Parameters<typeof createScreenSpaceCamera>[1],
    );
    const synchronize = scene.events.on.mock.calls[0]?.[1];
    expect(scene.events.on).toHaveBeenCalledWith("prerender", synchronize);
    scene.children.list.push(lateAvatar);
    synchronize();
    expect(camera.ignore).toHaveBeenLastCalledWith([world, lateAvatar]);
    scene.events.once.mock.calls[0]?.[1]();
    expect(scene.events.off).toHaveBeenCalledWith("prerender", synchronize);
  });
});
