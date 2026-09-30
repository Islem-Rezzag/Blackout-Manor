import {
  DEFAULT_ROOM_LABELS,
  type MatchSnapshot,
  type PublicPlayerState,
  type RoomId,
} from "@blackout-manor/shared";
import {
  Cctv,
  House,
  Map as MapIcon,
  Maximize,
  Minimize,
  Moon,
  Users,
  VenetianMask,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide";
import type * as Phaser from "phaser";
import { subscribeManorSoundEnabled } from "../audio/soundPreference";

import type {
  CameraPlan,
  InspectionPresentation,
  SurveillancePresentation,
} from "../directors/types";
import { resolveAvatarAppearance } from "../entities/avatar/presentation";
import { createControlIcon as createElement } from "./controlIcons";
import { ESTATE_HUD_STYLES } from "./estateHudStyles";

type ObservationHudContent = {
  camera: CameraPlan;
  inspection: InspectionPresentation;
  surveillance: SurveillancePresentation;
  phaseLabel: string;
  timerText?: string | null;
  contextText?: string | null;
  snapshot?: MatchSnapshot;
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
  #soundEnabled = true;

  constructor(options: {
    scene: Phaser.Scene;
    onSelectRoom?: (roomId: RoomId) => void;
    onOverview?: () => void;
    onSurveillance?: () => void;
    onSoundChange?: (enabled: boolean) => void;
  }) {
    this.#scene = options.scene;
    this.#selectRoom = options.onSelectRoom;
    const root = document.createElement("div");
    root.className = "manor-hud";
    root.innerHTML = `<style>${ESTATE_HUD_STYLES}</style>
      <header class="estate-header">
        <div class="estate-brand"><div class="estate-crest"></div><div><h1>Blackout Manor</h1><p>The masquerade after midnight</p></div></div>
        <div class="estate-phase"><i></i><span data-field="phase">ROAM</span><span data-field="tick"></span></div>
        <div class="estate-totals"><div class="estate-total" data-icon="guests" title="Guests remaining"><strong data-field="alive"></strong><small>Guests remaining</small></div><div class="estate-total" data-icon="tasks" title="House restored"><strong data-field="tasks"></strong><small>House restored</small></div></div>
      </header>
      <nav class="estate-nav" aria-label="Observation mode"></nav>
      <div class="estate-location"></div>
      <section class="estate-room-menu" hidden aria-label="Manor rooms"><h2>Inside the estate</h2></section>
      <div class="estate-subtitle" hidden data-tone="speech"><small></small><p></p></div>
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
    options.scene.events.on("sleep", this.#hide);
    options.scene.events.on("wake", this.#show);
    options.scene.events.on("pause", this.#hide);
    options.scene.events.on("resume", this.#show);
  }

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
    this.#element('[data-field="phase"]').textContent =
      content.phaseLabel === "ROAM" ? "THE MASQUERADE" : content.phaseLabel;
    this.#element('[data-field="tick"]').textContent = content.timerText ?? "";
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
        : "Estate grounds / Storm outside";
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
        button.append(portrait, name, dot);
        button.addEventListener(
          "click",
          () => {
            const roomId = button?.dataset.room as RoomId | undefined;
            if (roomId) this.#selectRoom?.(roomId);
          },
          { signal: this.#abort.signal },
        );
        this.#guests.set(player.id, button);
        this.#element(".estate-cast").append(button);
      }
      button.dataset.room = player.roomId ?? "";
      button.dataset.alive = String(player.status === "alive");
      button.disabled = !player.roomId;
      button.setAttribute(
        "aria-pressed",
        String(Boolean(player.roomId && player.roomId === inspection.roomId)),
      );
      button.title = `${player.displayName} / ${player.roomId ? DEFAULT_ROOM_LABELS[player.roomId] : "Absent"} / ${player.status}`;
      button.setAttribute("aria-label", button.title);
    }
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
