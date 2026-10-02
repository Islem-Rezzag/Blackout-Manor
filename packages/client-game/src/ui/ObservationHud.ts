import {
  DEFAULT_ROOM_LABELS,
  type MatchSnapshot,
  type PlayerId,
  type PublicPlayerState,
  type RoomId,
} from "@blackout-manor/shared";
import {
  Cctv,
  House,
  List,
  Map as MapIcon,
  Maximize,
  Minimize,
  Moon,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Users,
  VenetianMask,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide";
import type * as Phaser from "phaser";
import { subscribeManorSoundEnabled } from "../audio/soundPreference";

import type {
  CameraPlan,
  InspectionPresentation,
  SurveillancePresentation,
} from "../directors/types";
import { resolveAvatarAppearance } from "../entities/avatar/presentation";
import {
  PHASE_LABELS,
  type SessionPresentation,
} from "../session/sessionPresentation";
import { createControlIcon as createElement } from "./controlIcons";
import { ESTATE_HUD_STYLES } from "./estateHudStyles";
import { derivePublicActivity } from "./publicActivity";

type ObservationHudContent = {
  camera: CameraPlan;
  inspection: InspectionPresentation;
  surveillance: SurveillancePresentation;
  phaseLabel: string;
  timerText?: string | null;
  contextText?: string | null;
  snapshot?: MatchSnapshot;
  followedPlayerId?: PlayerId | null;
  directed?: boolean;
};

export const deriveObservationHudLayout = (options: {
  camera: CameraPlan;
  inspection: InspectionPresentation;
  surveillance: SurveillancePresentation;
  hasSubtitle: boolean;
}) => {
  const { camera, hasSubtitle, inspection, surveillance } = options;
  const inspecting = inspection.mode === "inspect";
  const strongFocus =
    inspecting ||
    ["report", "sabotage", "meeting", "endgame"].includes(camera.reason);
  const flaggedIndicatorCount = surveillance.statusIndicators.filter(
    (indicator) => indicator.flagged,
  ).length;
  return {
    inspecting,
    strongFocus,
    showFallbackSubtitle:
      !hasSubtitle && (surveillance.mode === "surveillance" || strongFocus),
    showSubtitle:
      hasSubtitle || surveillance.mode === "surveillance" || strongFocus,
    expandedSubtitle: hasSubtitle
      ? strongFocus
      : surveillance.mode === "surveillance" || strongFocus,
    maxStatusChips:
      surveillance.mode === "surveillance"
        ? 3
        : strongFocus
          ? 2
          : Math.min(2, flaggedIndicatorCount),
  };
};

export const selectObservationStatusIndicators = (options: {
  surveillance: SurveillancePresentation;
  strongFocus: boolean;
  maxStatusChips: number;
}) => {
  const { maxStatusChips, strongFocus, surveillance } = options;
  if (maxStatusChips <= 0) return [];
  if (surveillance.mode === "surveillance")
    return surveillance.statusIndicators.slice(0, maxStatusChips);
  const flagged = surveillance.statusIndicators.filter(
    (indicator) => indicator.flagged,
  );
  return (
    strongFocus
      ? [
          ...flagged,
          ...surveillance.statusIndicators.filter(
            (indicator) => !indicator.flagged,
          ),
        ]
      : flagged
  ).slice(0, maxStatusChips);
};

export const deriveEstatePublicSummary = (snapshot: MatchSnapshot) => ({
  alive: snapshot.players.filter((player) => player.status === "alive").length,
  guests: snapshot.players.length,
  taskPercent: Math.round(
    (snapshot.tasks.reduce((sum, task) => sum + task.progress, 0) /
      Math.max(1, snapshot.tasks.length)) *
      100,
  ),
});

const color = (value: number) => `#${value.toString(16).padStart(6, "0")}`;

const paintGuestPortrait = (
  canvas: HTMLCanvasElement,
  player: PublicPlayerState,
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const look = resolveAvatarAppearance(player);
  ctx.clearRect(0, 0, 70, 80);
  ctx.fillStyle = color(look.outfitColor);
  ctx.beginPath();
  ctx.moveTo(6, 78);
  ctx.lineTo(14, 48);
  ctx.quadraticCurveTo(34, 33, 56, 48);
  ctx.lineTo(64, 78);
  ctx.fill();
  ctx.fillStyle = color(look.trimColor);
  ctx.beginPath();
  ctx.moveTo(24, 45);
  ctx.lineTo(35, 65);
  ctx.lineTo(47, 45);
  ctx.lineTo(39, 77);
  ctx.lineTo(30, 77);
  ctx.fill();
  ctx.fillStyle = color(look.bodyColor);
  ctx.beginPath();
  ctx.ellipse(35, 28, 15, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color(look.secondaryColor);
  ctx.beginPath();
  ctx.ellipse(35, 15, 16, 10, -0.15, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color(look.maskColor);
  ctx.beginPath();
  ctx.moveTo(19, 24);
  ctx.lineTo(51, 24);
  ctx.lineTo(46, 35);
  ctx.lineTo(35, 31);
  ctx.lineTo(24, 35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#18231d";
  ctx.fillRect(24, 27, 7, 3);
  ctx.fillRect(39, 27, 7, 3);
  ctx.strokeStyle = color(look.maskAccentColor);
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 24, 30, 10);
  ctx.fillStyle = color(look.accessoryColor);
  ctx.beginPath();
  ctx.arc(49, 52, 3, 0, Math.PI * 2);
  ctx.fill();
};

export class ObservationHud {
  readonly #root: HTMLDivElement;
  readonly #scene: Phaser.Scene;
  readonly #selectRoom: ((roomId: RoomId) => void) | undefined;
  readonly #guests = new globalThis.Map<string, HTMLButtonElement>();
  readonly #rooms = new globalThis.Map<RoomId, HTMLButtonElement>();
  readonly #abort = new AbortController();
  readonly #unsubscribeSound: () => void;
  readonly #persistent: boolean;
  readonly #play: HTMLButtonElement;
  readonly #step: HTMLButtonElement;
  readonly #back: HTMLButtonElement;
  readonly #speed: HTMLSelectElement;
  readonly #scrubber: HTMLInputElement;
  #activitySignature = "";
  #soundEnabled = true;

  constructor(options: {
    scene: Phaser.Scene;
    onSelectRoom?: (roomId: RoomId) => void;
    onOverview?: () => void;
    onSurveillance?: () => void;
    onSoundChange?: (enabled: boolean) => void;
    onFollowPlayer?: (playerId: PlayerId) => void;
    onPlay?: () => void;
    onStep?: (delta: number) => void;
    onSpeed?: (speed: number) => void;
    onSeek?: (index: number) => void;
    persistent?: boolean;
  }) {
    this.#scene = options.scene;
    this.#persistent = options.persistent ?? false;
    this.#selectRoom = options.onSelectRoom;
    const root = document.createElement("div");
    root.className = "manor-hud";
    root.innerHTML = `<style>${ESTATE_HUD_STYLES}</style>
      <header class="estate-header">
        <div class="estate-brand"><div class="estate-crest"></div><div><h1>Blackout Manor</h1><p>The masquerade after midnight</p></div></div>
        <div class="estate-clock"><small data-field="clock-label">Demo time</small><strong data-field="clock">00:00</strong><span data-field="clock-detail">Ready to begin</span></div>
        <div class="estate-totals"><div class="estate-total" data-icon="guests" title="Guests remaining"><strong data-field="alive"></strong><small>Guests remaining</small></div><div class="estate-total" data-icon="tasks" title="House restored"><strong data-field="tasks"></strong><small>House restored</small></div></div>
      </header>
      <nav class="estate-nav" aria-label="Observation mode"></nav>
      <div class="estate-transport" aria-label="Session controls"><span class="estate-session-status"></span></div>
      <div class="estate-phase-track" aria-label="Match phase"></div>
      <div class="estate-location"></div>
      <section class="estate-room-menu" hidden aria-label="Manor rooms"><h2>Inside the estate</h2></section>
      <div class="estate-subtitle" hidden data-tone="speech"><small></small><p></p></div>
      <section class="estate-ready" aria-label="Session ready" hidden><small>LOCAL DEMO / TEN GUESTS</small><h2>The guests are ready.</h2><div class="estate-ready-action"></div></section>
      <aside class="estate-activity" aria-label="Public activity" hidden><header><h2>Public activity</h2></header><ol></ol><p class="estate-activity-empty">No public events yet.</p></aside>
      <footer class="estate-bottom"><div class="estate-cast-heading"><strong>The guests</strong><small>Masquerade night</small></div><div class="estate-cast" aria-label="Guest focus"></div><div class="estate-tools"></div></footer>
      <p class="estate-tool-error" role="status" hidden></p>`;
    this.#root = root;
    options.scene.game.canvas.parentElement?.append(root);
    root.querySelector(".estate-crest")?.append(createElement(VenetianMask));
    root.querySelector('[data-icon="guests"]')?.prepend(createElement(Users));
    root.querySelector('[data-icon="tasks"]')?.prepend(createElement(Wrench));
    const nav = this.#element(".estate-nav");
    const overview = this.#button(
      "Estate overview",
      House,
      () => options.onOverview?.(),
      "Estate",
    );
    overview.dataset.command = "overview";
    overview.setAttribute("aria-pressed", "true");
    const surveillance = this.#button(
      "Surveillance cameras",
      Cctv,
      () => options.onSurveillance?.(),
      "Cameras",
    );
    surveillance.dataset.command = "surveillance";
    surveillance.setAttribute("aria-pressed", "false");
    const rooms = this.#button("Choose a room", MapIcon, () => {
      const menu = this.#element(".estate-room-menu");
      menu.hidden = !menu.hidden;
      rooms.setAttribute("aria-expanded", String(!menu.hidden));
    });
    rooms.dataset.command = "rooms";
    rooms.setAttribute("aria-expanded", "false");
    nav.append(overview, surveillance, rooms);
    const activity = this.#button("Public activity", List, () => {
      const panel = this.#element(".estate-activity");
      panel.hidden = !panel.hidden;
      activity.setAttribute("aria-expanded", String(!panel.hidden));
    });
    activity.dataset.command = "activity";
    activity.setAttribute("aria-expanded", "false");
    nav.append(activity);
    this.#element(".estate-activity header").append(
      this.#button("Close public activity", X, () => {
        this.#element(".estate-activity").hidden = true;
        activity.setAttribute("aria-expanded", "false");
      }),
    );
    const track = this.#element(".estate-phase-track");
    for (const [phase, label] of Object.entries(PHASE_LABELS)) {
      const segment = document.createElement("div");
      segment.dataset.phase = phase;
      const text = document.createElement("span");
      text.textContent = label;
      const progress = document.createElement("i");
      segment.append(text, progress);
      track.append(segment);
    }
    const transport = this.#element(".estate-transport");
    this.#back = this.#button("Previous frame", SkipBack, () =>
      options.onStep?.(-1),
    );
    this.#play = this.#button("Start night", Play, () => options.onPlay?.());
    this.#play.dataset.command = "play";
    this.#step = this.#button("Next tick", SkipForward, () =>
      options.onStep?.(1),
    );
    this.#speed = document.createElement("select");
    this.#speed.setAttribute("aria-label", "Playback speed");
    this.#speed.title = "Local playback speed";
    for (const speed of [0.25, 0.5, 1, 2]) {
      const option = document.createElement("option");
      option.value = String(speed);
      option.textContent = `${speed}x`;
      this.#speed.append(option);
    }
    this.#speed.addEventListener(
      "change",
      () => options.onSpeed?.(Number(this.#speed.value)),
      { signal: this.#abort.signal },
    );
    this.#scrubber = document.createElement("input");
    this.#scrubber.type = "range";
    this.#scrubber.min = "0";
    this.#scrubber.step = "1";
    this.#scrubber.setAttribute("aria-label", "Replay frame");
    this.#scrubber.addEventListener(
      "input",
      () => options.onSeek?.(Number(this.#scrubber.value)),
      { signal: this.#abort.signal },
    );
    transport.append(
      this.#back,
      this.#play,
      this.#step,
      this.#speed,
      this.#scrubber,
    );
    this.#element(".estate-ready-action").append(
      this.#button(
        "Start night",
        Play,
        () => options.onPlay?.(),
        "Start night",
      ),
    );
    const tools = this.#element(".estate-tools");
    const sound = this.#button("Mute manor sound", Volume2, () => {
      this.#soundEnabled = !this.#soundEnabled;
      options.onSoundChange?.(this.#soundEnabled);
      sound.replaceChildren(
        createElement(this.#soundEnabled ? Volume2 : VolumeX),
      );
      sound.title = this.#soundEnabled
        ? "Mute manor sound"
        : "Enable manor sound";
      sound.setAttribute("aria-label", sound.title);
      sound.setAttribute("aria-pressed", String(!this.#soundEnabled));
    });
    sound.setAttribute("aria-pressed", "false");
    this.#unsubscribeSound = subscribeManorSoundEnabled((enabled) => {
      this.#soundEnabled = enabled;
      sound.replaceChildren(createElement(enabled ? Volume2 : VolumeX));
      sound.title = enabled ? "Mute manor sound" : "Enable manor sound";
      sound.setAttribute("aria-label", sound.title);
      sound.setAttribute("aria-pressed", String(!enabled));
    });
    const fullscreen = this.#button("Enter fullscreen", Maximize, async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await options.scene.game.canvas.parentElement?.requestFullscreen();
      } catch {
        const message = this.#element(".estate-tool-error");
        message.hidden = false;
        message.textContent = "Fullscreen is unavailable in this browser.";
      }
    });
    document.addEventListener(
      "fullscreenchange",
      () => {
        const active = Boolean(document.fullscreenElement);
        fullscreen.replaceChildren(createElement(active ? Minimize : Maximize));
        fullscreen.title = active ? "Exit fullscreen" : "Enter fullscreen";
        fullscreen.setAttribute("aria-label", fullscreen.title);
      },
      { signal: this.#abort.signal },
    );
    tools.append(sound, fullscreen);
    const menu = this.#element(".estate-room-menu");
    for (const [roomId, label] of Object.entries(DEFAULT_ROOM_LABELS)) {
      const id = roomId as RoomId;
      const button = document.createElement("button");
      button.type = "button";
      const name = document.createElement("span");
      name.textContent = label;
      const status = document.createElement("small");
      button.append(name, status);
      button.addEventListener(
        "click",
        () => {
          this.#selectRoom?.(id);
          menu.hidden = true;
          rooms.setAttribute("aria-expanded", "false");
        },
        { signal: this.#abort.signal },
      );
      this.#rooms.set(id, button);
      menu.append(button);
    }
    if (!this.#persistent) {
      options.scene.events.on("sleep", this.#hide);
      options.scene.events.on("wake", this.#show);
      options.scene.events.on("pause", this.#hide);
      options.scene.events.on("resume", this.#show);
    }
    this.#followPlayer = options.onFollowPlayer;
  }

  readonly #followPlayer: ((playerId: PlayerId) => void) | undefined;

  readonly #hide = () => {
    this.#root.hidden = true;
  };
  readonly #show = () => {
    this.#root.hidden = false;
  };

  #element(selector: string) {
    const element = this.#root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing manor HUD element ${selector}`);
    return element;
  }

  #button(
    label: string,
    icon: typeof House,
    action: () => void | Promise<void>,
    text?: string,
  ) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.append(createElement(icon));
    if (text) {
      const span = document.createElement("span");
      span.textContent = text;
      button.append(span);
    }
    button.addEventListener(
      "click",
      () => {
        void action();
      },
      { signal: this.#abort.signal },
    );
    return button;
  }

  setContent(content: ObservationHudContent) {
    const { inspection, snapshot, surveillance } = content;
    this.#root.dataset.directed = String(content.directed ?? false);
    (this.#element('[data-command="overview"]') as HTMLButtonElement).disabled =
      content.directed ?? false;
    (this.#element('[data-command="rooms"]') as HTMLButtonElement).disabled =
      content.directed ?? false;
    this.#element('[data-command="overview"]').setAttribute(
      "aria-pressed",
      String(surveillance.mode !== "surveillance"),
    );
    this.#element('[data-command="surveillance"]').setAttribute(
      "aria-pressed",
      String(surveillance.mode === "surveillance"),
    );
    (
      this.#element('[data-command="surveillance"]') as HTMLButtonElement
    ).disabled = !surveillance.available;
    const location = this.#element(".estate-location");
    location.replaceChildren(
      createElement(inspection.mode === "inspect" ? House : Moon),
    );
    const locationLabel = document.createElement("span");
    locationLabel.textContent =
      inspection.mode === "inspect"
        ? inspection.label
        : content.directed
          ? "Grand hall / Directed scene"
          : "Whole manor / Storm outside";
    location.append(locationLabel);
    const subtitle = this.#element(".estate-subtitle");
    subtitle.hidden = !surveillance.subtitle;
    if (surveillance.subtitle) {
      subtitle.dataset.tone = surveillance.subtitle.tone;
      this.#element(".estate-subtitle small").textContent =
        surveillance.subtitle.speakerLabel ?? "THE MANOR";
      this.#element(".estate-subtitle p").textContent =
        surveillance.subtitle.text;
    }
    if (!snapshot) return;
    const summary = deriveEstatePublicSummary(snapshot);
    const activity = derivePublicActivity(snapshot);
    const activitySignature = activity.map((event) => event.id).join("|");
    if (activitySignature !== this.#activitySignature) {
      this.#activitySignature = activitySignature;
      this.#element(".estate-activity ol").replaceChildren(
        ...activity.map((event) => {
          const row = document.createElement("li");
          const tick = document.createElement("small");
          tick.textContent = `T${event.tick}`;
          const text = document.createElement("span");
          text.textContent = event.text;
          row.append(tick, text);
          return row;
        }),
      );
    }
    this.#element(".estate-activity-empty").hidden = activity.length > 0;
    this.#element('[data-field="alive"]').textContent =
      `${summary.alive} / ${summary.guests}`;
    this.#element('[data-field="tasks"]').textContent =
      `${summary.taskPercent}%`;
    for (const room of snapshot.rooms) {
      const button = this.#rooms.get(room.roomId);
      if (!button) continue;
      button.setAttribute(
        "aria-current",
        String(inspection.roomId === room.roomId),
      );
      const status = button.querySelector("small");
      if (status)
        status.textContent =
          room.lightLevel === "blackout"
            ? "Blackout"
            : `${room.occupantIds.length} present`;
    }
    const publicIds = new Set(snapshot.players.map((player) => player.id));
    for (const [id, button] of this.#guests) {
      if (publicIds.has(id)) continue;
      button.remove();
      this.#guests.delete(id);
    }
    for (const player of snapshot.players) {
      let button = this.#guests.get(player.id);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "estate-guest";
        const portrait = document.createElement("canvas");
        portrait.width = 70;
        portrait.height = 80;
        portrait.setAttribute("aria-hidden", "true");
        paintGuestPortrait(portrait, player);
        const name = document.createElement("span");
        name.textContent = player.displayName;
        const dot = document.createElement("i");
        const status = document.createElement("small");
        button.append(portrait, name, status, dot);
        button.addEventListener(
          "click",
          () => {
            const roomId = button?.dataset.room as RoomId | undefined;
            if (this.#followPlayer) this.#followPlayer(player.id);
            else if (roomId) this.#selectRoom?.(roomId);
          },
          { signal: this.#abort.signal },
        );
        this.#guests.set(player.id, button);
        this.#element(".estate-cast").append(button);
      }
      button.dataset.room = player.roomId ?? "";
      button.dataset.alive = String(player.status === "alive");
      button.disabled =
        player.status !== "alive" ||
        !player.roomId ||
        Boolean(content.directed);
      button.setAttribute(
        "aria-pressed",
        String(content.followedPlayerId === player.id),
      );
      button.dataset.speaking = String(
        surveillance.subtitle?.speakerId === player.id &&
          surveillance.subtitle.tone === "speech",
      );
      const status = button.querySelector("small");
      if (status)
        status.textContent =
          player.status !== "alive"
            ? player.status
            : button.dataset.speaking === "true"
              ? "Speaking"
              : player.roomId
                ? DEFAULT_ROOM_LABELS[player.roomId]
                : "Present";
      button.title = `Follow ${player.displayName} / ${player.roomId ? DEFAULT_ROOM_LABELS[player.roomId] : "Absent"} / ${player.status}`;
      button.setAttribute("aria-label", button.title);
    }
  }

  setSession(session: SessionPresentation) {
    this.#root.dataset.session = session.status;
    this.#element('[data-field="clock"]').textContent = session.clock;
    this.#element('[data-field="clock-label"]').textContent =
      session.clockLabel;
    this.#element('[data-field="clock-detail"]').textContent = session.detail;
    const status = this.#element(".estate-session-status");
    status.replaceChildren(
      createElement(
        session.status === "live"
          ? Radio
          : session.status === "playing"
            ? Play
            : Pause,
      ),
    );
    const label = document.createElement("span");
    label.textContent =
      session.mode === "mock"
        ? "Local demo"
        : session.mode === "replay"
          ? "Replay"
          : "Live match";
    status.append(label);
    for (const segment of this.#root.querySelectorAll<HTMLElement>(
      "[data-phase]",
    )) {
      const active = segment.dataset.phase === session.phase;
      segment.setAttribute("aria-current", String(active));
      const progress = segment.querySelector<HTMLElement>("i");
      if (progress)
        progress.style.width = active
          ? `${(session.phaseProgress ?? 1) * 100}%`
          : "0%";
    }
    const playing = session.status === "playing";
    const playLabel =
      session.status === "ready"
        ? "Start night"
        : playing
          ? "Pause playback"
          : "Resume playback";
    if (this.#play.title !== playLabel) {
      this.#play.title = playLabel;
      this.#play.setAttribute("aria-label", playLabel);
      this.#play.replaceChildren(createElement(playing ? Pause : Play));
    }
    this.#play.hidden = !session.canControl;
    this.#back.hidden = session.mode !== "replay";
    this.#back.disabled = session.frameIndex <= 0;
    this.#step.hidden = !session.canControl;
    this.#step.disabled =
      session.status !== "paused" ||
      (session.mode === "replay" &&
        session.frameIndex >= session.totalFrames - 1);
    this.#step.title = session.mode === "replay" ? "Next frame" : "Next tick";
    this.#step.setAttribute("aria-label", this.#step.title);
    this.#speed.hidden = !session.canControl;
    this.#speed.value = String(session.speed);
    this.#scrubber.hidden = session.mode !== "replay";
    this.#scrubber.max = String(Math.max(0, session.totalFrames - 1));
    this.#scrubber.value = String(session.frameIndex);
    this.#element(".estate-ready").hidden =
      session.status !== "ready" || !session.canControl;
  }

  resize(_width: number, _height: number) {}

  destroy() {
    this.#unsubscribeSound();
    this.#abort.abort();
    this.#scene.events.off("sleep", this.#hide);
    this.#scene.events.off("wake", this.#show);
    this.#scene.events.off("pause", this.#hide);
    this.#scene.events.off("resume", this.#show);
    this.#root.remove();
    this.#guests.clear();
  }
}
