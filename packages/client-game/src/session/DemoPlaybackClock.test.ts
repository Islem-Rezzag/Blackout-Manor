import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoPlaybackClock } from "./DemoPlaybackClock";

afterEach(() => vi.useRealTimers());

describe("local demo playback clock", () => {
  it("waits for start and preserves the partial tick across pause and resume", () => {
    vi.useFakeTimers();
    const advance = vi.fn();
    const clock = new DemoPlaybackClock(1200, advance);
    vi.advanceTimersByTime(60_000);
    expect(advance).not.toHaveBeenCalled();
    expect(clock.getState().status).toBe("ready");
    clock.play();
    clock.play();
    vi.advanceTimersByTime(1000);
    clock.pause();
    expect(clock.getState().tickFraction).toBeCloseTo(5 / 12);
    vi.advanceTimersByTime(10_000);
    expect(advance).not.toHaveBeenCalled();
    clock.play();
    vi.advanceTimersByTime(1399);
    expect(advance).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(advance).toHaveBeenCalledTimes(1);
    clock.destroy();
  });

  it("changes wall-clock speed without losing tick progress or advancing while paused", () => {
    vi.useFakeTimers();
    const advance = vi.fn();
    const clock = new DemoPlaybackClock(1200, advance);
    clock.play();
    vi.advanceTimersByTime(600);
    clock.setSpeed(2);
    expect(clock.getState().tickFraction).toBe(0.25);
    vi.advanceTimersByTime(450);
    expect(advance).toHaveBeenCalledTimes(1);
    clock.step();
    expect(advance).toHaveBeenCalledTimes(1);
    clock.pause();
    clock.step();
    expect(advance).toHaveBeenCalledTimes(2);
    clock.destroy();
    clock.play();
    clock.step();
    vi.advanceTimersByTime(10_000);
    expect(advance).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
