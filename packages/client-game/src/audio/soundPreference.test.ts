import { afterEach, describe, expect, it, vi } from "vitest";

import {
  setManorSoundEnabled,
  subscribeManorSoundEnabled,
} from "./soundPreference";

afterEach(() => setManorSoundEnabled(true));

describe("manor sound preference", () => {
  it("shares mute state with active and newly created scene subscribers", () => {
    const live = vi.fn();
    const stopLive = subscribeManorSoundEnabled(live);
    setManorSoundEnabled(false);
    const meeting = vi.fn();
    const stopMeeting = subscribeManorSoundEnabled(meeting);
    expect(live).toHaveBeenLastCalledWith(false);
    expect(meeting).toHaveBeenLastCalledWith(false);
    stopLive();
    stopMeeting();
    setManorSoundEnabled(true);
    expect(live).toHaveBeenLastCalledWith(false);
    expect(meeting).toHaveBeenLastCalledWith(false);
  });
});
