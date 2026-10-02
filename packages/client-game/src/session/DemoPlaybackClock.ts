export type DemoPlaybackSpeed = 0.25 | 0.5 | 1 | 2;

export type DemoPlaybackState = {
  status: "ready" | "playing" | "paused" | "closed";
  speed: DemoPlaybackSpeed;
  tickMs: number;
  tickFraction: number;
};

/** Local rehearsal scheduling only; never controls an authoritative match. */
export class DemoPlaybackClock {
  readonly #tickMs: number;
  readonly #advance: () => void;
  #status: DemoPlaybackState["status"] = "ready";
  #speed: DemoPlaybackSpeed = 0.5;
  #elapsed = 0;
  #startedAt = 0;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(tickMs: number, advance: () => void) {
    if (!Number.isFinite(tickMs) || tickMs <= 0) {
      throw new Error("Demo tick duration must be positive.");
    }
    this.#tickMs = tickMs;
    this.#advance = advance;
  }

  getState(): DemoPlaybackState {
    return {
      status: this.#status,
      speed: this.#speed,
      tickMs: this.#tickMs,
      tickFraction: this.#readElapsed() / this.#tickMs,
    };
  }

  play() {
    if (this.#status === "playing" || this.#status === "closed") return;
    this.#status = "playing";
    this.#schedule();
  }

  pause() {
    if (this.#status !== "playing") return;
    this.#elapsed = this.#readElapsed();
    this.#clearTimer();
    this.#status = "paused";
  }

  setSpeed(speed: DemoPlaybackSpeed) {
    if (![0.25, 0.5, 1, 2].includes(speed) || this.#status === "closed") return;
    this.#elapsed = this.#readElapsed();
    this.#clearTimer();
    this.#speed = speed;
    if (this.#status === "playing") this.#schedule();
  }

  step() {
    if (this.#status !== "paused") return;
    this.#elapsed = 0;
    this.#advance();
  }

  destroy() {
    this.#clearTimer();
    this.#elapsed = 0;
    this.#status = "closed";
  }

  #readElapsed() {
    return Math.min(
      this.#tickMs,
      this.#elapsed +
        (this.#status === "playing"
          ? Math.max(0, Date.now() - this.#startedAt) * this.#speed
          : 0),
    );
  }

  #schedule() {
    this.#startedAt = Date.now();
    this.#timer = setTimeout(
      () => {
        this.#timer = null;
        this.#elapsed = 0;
        this.#startedAt = Date.now();
        this.#advance();
        if (this.#status === "playing") this.#schedule();
      },
      (this.#tickMs - this.#elapsed) / this.#speed,
    );
  }

  #clearTimer() {
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
  }
}
