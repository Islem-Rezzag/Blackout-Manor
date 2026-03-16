export class SoundBus {
  #enabled = true;

  setEnabled(enabled: boolean) {
    this.#enabled = enabled;
  }

  get enabled() {
    return this.#enabled;
  }

  play(_cue: "hover" | "snapshot" | "alert") {
    return this.#enabled;
  }
}
