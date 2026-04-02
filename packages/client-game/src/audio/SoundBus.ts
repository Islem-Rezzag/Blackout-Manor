import type { PlayerId } from "@blackout-manor/shared";

import {
  footstepCueForSurface,
  footstepIntervalMsForSurface,
  type PublicAmbienceState,
  type PublicMovementFeedbackState,
  type PublicSoundCueId,
} from "./publicEventFeedback";

type AudioCtor = typeof AudioContext;

type AudioGlobal = typeof globalThis & {
  AudioContext?: AudioCtor;
  webkitAudioContext?: AudioCtor;
};

type SoundEnvelope = {
  frequency: number;
  gain: number;
  durationMs: number;
  type: OscillatorType;
  detune?: number;
};

type CueDefinition = {
  primary: SoundEnvelope;
  secondary?: SoundEnvelope;
};

type CueOptions = {
  intensity?: number;
};

const audioGlobal = globalThis as AudioGlobal;

const CUE_DEFINITIONS: Record<PublicSoundCueId, CueDefinition> = {
  hover: {
    primary: { frequency: 900, gain: 0.018, durationMs: 64, type: "sine" },
  },
  snapshot: {
    primary: { frequency: 520, gain: 0.018, durationMs: 110, type: "triangle" },
  },
  alert: {
    primary: { frequency: 220, gain: 0.028, durationMs: 170, type: "triangle" },
    secondary: {
      frequency: 310,
      gain: 0.014,
      durationMs: 140,
      type: "sine",
      detune: 4,
    },
  },
  "footstep-parquet": {
    primary: { frequency: 132, gain: 0.014, durationMs: 76, type: "triangle" },
  },
  "footstep-stone": {
    primary: { frequency: 108, gain: 0.015, durationMs: 92, type: "triangle" },
  },
  "footstep-service": {
    primary: { frequency: 124, gain: 0.013, durationMs: 82, type: "square" },
  },
  "footstep-mechanical": {
    primary: { frequency: 92, gain: 0.015, durationMs: 88, type: "square" },
  },
  "footstep-glass": {
    primary: { frequency: 184, gain: 0.012, durationMs: 72, type: "sine" },
    secondary: {
      frequency: 328,
      gain: 0.005,
      durationMs: 52,
      type: "triangle",
      detune: 7,
    },
  },
  "door-open": {
    primary: { frequency: 208, gain: 0.018, durationMs: 144, type: "triangle" },
    secondary: {
      frequency: 164,
      gain: 0.012,
      durationMs: 158,
      type: "sine",
      detune: -3,
    },
  },
  "door-close": {
    primary: { frequency: 152, gain: 0.019, durationMs: 132, type: "triangle" },
  },
  "meeting-bell": {
    primary: { frequency: 784, gain: 0.034, durationMs: 280, type: "sine" },
    secondary: {
      frequency: 523,
      gain: 0.02,
      durationMs: 340,
      type: "triangle",
      detune: 2,
    },
  },
  "meeting-seat": {
    primary: { frequency: 172, gain: 0.014, durationMs: 108, type: "triangle" },
  },
  "sabotage-pulse": {
    primary: { frequency: 104, gain: 0.034, durationMs: 230, type: "triangle" },
    secondary: {
      frequency: 62,
      gain: 0.018,
      durationMs: 280,
      type: "sine",
      detune: -6,
    },
  },
  "clue-stinger": {
    primary: { frequency: 644, gain: 0.024, durationMs: 190, type: "triangle" },
    secondary: {
      frequency: 966,
      gain: 0.012,
      durationMs: 150,
      type: "sine",
      detune: 5,
    },
  },
  "task-complete": {
    primary: { frequency: 560, gain: 0.022, durationMs: 190, type: "triangle" },
    secondary: {
      frequency: 840,
      gain: 0.01,
      durationMs: 150,
      type: "sine",
      detune: 3,
    },
  },
  "task-blocked": {
    primary: { frequency: 176, gain: 0.025, durationMs: 180, type: "triangle" },
    secondary: {
      frequency: 148,
      gain: 0.011,
      durationMs: 190,
      type: "sine",
      detune: -5,
    },
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class SoundBus {
  #enabled = true;
  #audioContext: AudioContext | null = null;
  #masterGain: GainNode | null = null;
  #ambienceGain: GainNode | null = null;
  #roomGain: GainNode | null = null;
  #stormOscillator: OscillatorNode | null = null;
  #roomOscillator: OscillatorNode | null = null;
  #tensionOscillator: OscillatorNode | null = null;
  readonly #movementTimers = new Map<PlayerId, number>();

  setEnabled(enabled: boolean) {
    this.#enabled = enabled;

    if (!enabled) {
      this.#movementTimers.clear();
      this.#setGainValue(this.#ambienceGain, 0);
      this.#setGainValue(this.#roomGain, 0);
    }
  }

  get enabled() {
    return this.#enabled;
  }

  play(cue: PublicSoundCueId, options: CueOptions = {}) {
    if (!this.#enabled) {
      return false;
    }

    const context = this.#ensureAudioContext();
    const masterGain = this.#masterGain;
    const definition = CUE_DEFINITIONS[cue];

    if (!context || !masterGain || !definition) {
      return false;
    }

    void context.resume().catch(() => {});
    this.#playEnvelope(context, masterGain, definition.primary, options);

    if (definition.secondary) {
      this.#playEnvelope(context, masterGain, definition.secondary, options);
    }

    return true;
  }

  syncMovement(
    states: readonly PublicMovementFeedbackState[],
    deltaMs: number,
  ) {
    if (!this.#enabled) {
      return;
    }

    const activePlayers = new Set<PlayerId>();

    for (const state of states) {
      activePlayers.add(state.playerId);

      if (
        !state.moving ||
        state.paused ||
        state.waypointKind === "door-threshold" ||
        state.waypointKind === "hotspot"
      ) {
        this.#movementTimers.delete(state.playerId);
        continue;
      }

      const intervalMs = footstepIntervalMsForSurface(state.surfaceProfile);
      const nextTimer =
        (this.#movementTimers.get(state.playerId) ?? 0) + deltaMs;

      if (nextTimer >= intervalMs) {
        this.play(footstepCueForSurface(state.surfaceProfile), {
          intensity: state.waypointKind === "corridor" ? 0.92 : 0.82,
        });
        this.#movementTimers.set(state.playerId, nextTimer - intervalMs);
        continue;
      }

      this.#movementTimers.set(state.playerId, nextTimer);
    }

    for (const playerId of [...this.#movementTimers.keys()]) {
      if (!activePlayers.has(playerId)) {
        this.#movementTimers.delete(playerId);
      }
    }
  }

  syncAmbience(state: PublicAmbienceState) {
    if (!this.#enabled) {
      return;
    }

    const context = this.#ensureAudioContext();
    const ambienceGain = this.#ambienceGain;
    const roomGain = this.#roomGain;
    const stormOscillator = this.#stormOscillator;
    const roomOscillator = this.#roomOscillator;
    const tensionOscillator = this.#tensionOscillator;

    if (
      !context ||
      !ambienceGain ||
      !roomGain ||
      !stormOscillator ||
      !roomOscillator ||
      !tensionOscillator
    ) {
      return;
    }

    void context.resume().catch(() => {});

    const stormGain =
      0.01 + state.stormLevel * 0.024 + state.blackoutLevel * 0.014;
    const roomBaseFrequency = (() => {
      switch (state.roomSurface) {
        case "stone":
          return 126;
        case "service":
          return 146;
        case "mechanical":
          return 104;
        case "glass":
          return 188;
        default:
          return 162;
      }
    })();

    ambienceGain.gain.cancelScheduledValues(context.currentTime);
    ambienceGain.gain.linearRampToValueAtTime(
      clamp(stormGain, 0.009, 0.056),
      context.currentTime + 0.24,
    );
    roomGain.gain.cancelScheduledValues(context.currentTime);
    roomGain.gain.linearRampToValueAtTime(
      state.meetingActive ? 0.014 : 0.009 + state.blackoutLevel * 0.008,
      context.currentTime + 0.28,
    );

    stormOscillator.frequency.setValueAtTime(
      34 + state.stormLevel * 12 + state.blackoutLevel * 6,
      context.currentTime,
    );
    roomOscillator.frequency.setValueAtTime(
      roomBaseFrequency + state.blackoutLevel * 12,
      context.currentTime,
    );
    tensionOscillator.frequency.setValueAtTime(
      state.meetingActive ? 286 : 214 + state.stormLevel * 24,
      context.currentTime,
    );
  }

  destroy() {
    this.#movementTimers.clear();
    this.#stormOscillator?.stop();
    this.#roomOscillator?.stop();
    this.#tensionOscillator?.stop();
    this.#stormOscillator?.disconnect();
    this.#roomOscillator?.disconnect();
    this.#tensionOscillator?.disconnect();
    this.#ambienceGain?.disconnect();
    this.#roomGain?.disconnect();
    this.#masterGain?.disconnect();
    this.#stormOscillator = null;
    this.#roomOscillator = null;
    this.#tensionOscillator = null;
    this.#ambienceGain = null;
    this.#roomGain = null;
    this.#masterGain = null;
    this.#audioContext = null;
  }

  #ensureAudioContext() {
    if (this.#audioContext) {
      return this.#audioContext;
    }

    const AudioContextCtor =
      audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    const context = new AudioContextCtor();
    const masterGain = context.createGain();
    masterGain.gain.value = 0.14;
    masterGain.connect(context.destination);

    const ambienceGain = context.createGain();
    ambienceGain.gain.value = 0;
    ambienceGain.connect(masterGain);

    const roomGain = context.createGain();
    roomGain.gain.value = 0;
    roomGain.connect(masterGain);

    const stormOscillator = context.createOscillator();
    stormOscillator.type = "triangle";
    stormOscillator.frequency.value = 42;
    stormOscillator.connect(ambienceGain);
    stormOscillator.start();

    const roomOscillator = context.createOscillator();
    roomOscillator.type = "sine";
    roomOscillator.frequency.value = 160;
    roomOscillator.connect(roomGain);
    roomOscillator.start();

    const tensionOscillator = context.createOscillator();
    tensionOscillator.type = "triangle";
    tensionOscillator.frequency.value = 220;
    tensionOscillator.connect(roomGain);
    tensionOscillator.start();

    this.#audioContext = context;
    this.#masterGain = masterGain;
    this.#ambienceGain = ambienceGain;
    this.#roomGain = roomGain;
    this.#stormOscillator = stormOscillator;
    this.#roomOscillator = roomOscillator;
    this.#tensionOscillator = tensionOscillator;

    return context;
  }

  #playEnvelope(
    context: AudioContext,
    output: GainNode,
    envelope: SoundEnvelope,
    options: CueOptions,
  ) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const intensity = clamp(options.intensity ?? 1, 0.2, 1.35);
    const durationSeconds = envelope.durationMs / 1000;

    oscillator.type = envelope.type;
    oscillator.frequency.setValueAtTime(
      envelope.frequency,
      context.currentTime,
    );
    if (typeof envelope.detune === "number") {
      oscillator.detune.setValueAtTime(
        envelope.detune * 100,
        context.currentTime,
      );
    }

    gainNode.gain.setValueAtTime(
      envelope.gain * intensity,
      context.currentTime,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + durationSeconds,
    );

    oscillator.connect(gainNode);
    gainNode.connect(output);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + durationSeconds);
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  #setGainValue(node: GainNode | null, value: number) {
    if (!node || !this.#audioContext) {
      return;
    }

    node.gain.cancelScheduledValues(this.#audioContext.currentTime);
    node.gain.linearRampToValueAtTime(
      value,
      this.#audioContext.currentTime + 0.12,
    );
  }
}
