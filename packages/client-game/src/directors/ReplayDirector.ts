import type { SavedReplayEnvelope } from "@blackout-manor/replay-viewer";

import {
  createReplayPresentationFrames,
  findReplayPresentationFrameIndex,
} from "../replay/presentation";
import type { ClientGameState } from "../types";
import type { ReplayPresentation } from "./types";

export class ReplayDirector {
  readonly #envelope: SavedReplayEnvelope | null;
  readonly #frames;
  #frameIndex = 0;

  constructor(envelope: SavedReplayEnvelope | null) {
    this.#envelope = envelope;
    this.#frames = envelope ? createReplayPresentationFrames(envelope) : [];
  }

  get hasReplay() {
    return this.#envelope !== null && this.#frames.length > 0;
  }

  syncToRuntime(state: ClientGameState) {
    if (state.snapshot) {
      this.#frameIndex = findReplayPresentationFrameIndex(
        this.#frames,
        state.snapshot.tick,
      );
    }
  }

  step(delta: number) {
    if (this.#frames.length === 0) {
      return;
    }

    this.#frameIndex = Math.min(
      this.#frames.length - 1,
      Math.max(0, this.#frameIndex + delta),
    );
  }

  jump(index: number) {
    if (this.#frames.length === 0) {
      return;
    }

    this.#frameIndex = Math.min(this.#frames.length - 1, Math.max(0, index));
  }

  derive(state: ClientGameState): ReplayPresentation | null {
    if (!this.#envelope || this.#frames.length === 0) {
      return null;
    }

    if (state.snapshot) {
      this.syncToRuntime(state);
    }

    const currentFrame = this.#frames[this.#frameIndex];
    if (!currentFrame) {
      return null;
    }

    return {
      envelope: this.#envelope,
      frameIndex: this.#frameIndex,
      totalFrames: this.#frames.length,
      snapshot: currentFrame.snapshot,
      title: `Replay ${this.#envelope.summary.replayId}`,
      subtitle:
        currentFrame.highlightMarkers[0]?.description ??
        `Tick ${currentFrame.tick} · ${currentFrame.phaseId.toUpperCase()}`,
      highlightMarkers: currentFrame.highlightMarkers,
      canStepBackward: this.#frameIndex > 0,
      canStepForward: this.#frameIndex < this.#frames.length - 1,
    };
  }
}
