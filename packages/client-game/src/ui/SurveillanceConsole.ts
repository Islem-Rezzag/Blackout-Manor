import type { RoomId } from "@blackout-manor/shared";
import { Cctv } from "lucide";
import type * as Phaser from "phaser";

import {
  estateFloorKey,
  estatePropKey,
  estateWallKey,
} from "../bootstrap/estateTexturePlan";
import type {
  SurveillanceFeedPresentation,
  SurveillancePresentation,
} from "../directors/types";
import { resolveAvatarAppearance } from "../entities/avatar/presentation";
import { getImportedRoomArt } from "../stage/importedArt";
import { getRoomRenderData, getRoomSeatPosition } from "../tiled/manorLayout";
import { createControlIcon as createElement } from "./controlIcons";

const STYLES = `
.estate-surveillance{position:absolute;right:30px;bottom:115px;width:430px;z-index:4;pointer-events:auto;color:#e5ddc5;background:#12231ff5;border:1px solid #9f9c713f;padding:15px;border-radius:4px;box-shadow:0 10px 30px #07191166;font:11px 'Segoe UI',sans-serif;letter-spacing:0}
.estate-surveillance[hidden]{display:none}
.estate-surveillance *{box-sizing:border-box;letter-spacing:0}
.estate-surveillance header{display:flex;gap:9px;align-items:center;margin-bottom:13px}
.estate-surveillance header svg{width:18px;height:18px;color:#c4ab75}
.estate-surveillance h2{font:18px Georgia,serif;font-weight:normal;margin:0}
.estate-surveillance header small{margin-left:auto;color:#9aac98;font-size:9px}
.estate-feeds{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.estate-feed{font:inherit;text-align:left;padding:0;border:1px solid #8297743f;border-radius:3px;background:#1b2f27;color:inherit;overflow:hidden;cursor:pointer;min-width:0}
.estate-feed:hover,.estate-feed[aria-pressed=true]{border-color:#cab479;background:#304537}
.estate-feed:focus-visible{outline:2px solid #e1c388;outline-offset:3px}
.estate-feed-heading{display:flex;justify-content:space-between;gap:6px;padding:10px 10px 8px;align-items:center}
.estate-feed-heading strong{font:14px Georgia,serif;font-weight:normal;min-width:0}
.estate-feed-heading small{font-size:8px;color:#c0bd8e;flex-shrink:0}
.estate-feed canvas{display:block;width:100%;aspect-ratio:20/11;background:#22382d}
.estate-feed p{margin:0;padding:8px 10px 3px;color:#d3d5b5;font-size:10px;line-height:1.3;min-height:24px}
.estate-feed > small{display:block;padding:0 10px 9px;color:#9aaf99;font-size:9px}
.estate-surveillance{isolation:isolate;contain:layout paint;transform:translateZ(0)}
.estate-feed{display:grid;grid-template-rows:34px auto 32px 22px}
.estate-feed[hidden]{display:none}
.estate-feed canvas{height:auto;contain:paint}
@media(max-width:800px){.estate-surveillance{right:16px;left:16px;bottom:106px;width:auto;padding:10px;max-height:calc(100% - 296px);overflow:auto}.estate-surveillance h2{font-size:16px}.estate-surveillance header small{font-size:8px}.estate-feeds{gap:8px}.estate-feed-heading{padding:8px}.estate-feed-heading strong{font-size:12px}}
`;

type FeedCard = {
  button: HTMLButtonElement;
  canvas: HTMLCanvasElement;
  title: HTMLElement;
  status: HTMLElement;
  marker: HTMLElement;
  occupancy: HTMLElement;
  roomId: RoomId | null;
  signature: string;
};

export class SurveillanceConsole {
  readonly #scene: Phaser.Scene;
  readonly #root: HTMLDivElement;
  readonly #cards: FeedCard[];
  readonly #abort = new AbortController();
  #visible = false;

  constructor(options: {
    scene: Phaser.Scene;
    onSelectRoom: (roomId: RoomId) => void;
  }) {
    this.#scene = options.scene;
    this.#root = document.createElement("div");
    this.#root.className = "estate-surveillance";
    this.#root.hidden = true;
    this.#root.innerHTML = `<style>${STYLES}</style><header><h2>Room cameras</h2><small>PUBLIC FEEDS</small></header><div class="estate-feeds"></div>`;
    this.#root.querySelector("header")?.prepend(createElement(Cctv));
    options.scene.game.canvas.parentElement?.append(this.#root);
    this.#cards = Array.from({ length: 4 }, () => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "estate-feed";
      button.hidden = true;
      const heading = document.createElement("div");
      heading.className = "estate-feed-heading";
      const title = document.createElement("strong");
      const marker = document.createElement("small");
      heading.append(title, marker);
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 220;
      canvas.setAttribute("aria-hidden", "true");
      const status = document.createElement("p");
      const occupancy = document.createElement("small");
      button.append(heading, canvas, status, occupancy);
      const card = {
        button,
        canvas,
        title,
        marker,
        status,
        occupancy,
        roomId: null as RoomId | null,
        signature: "",
      };
      button.addEventListener(
        "click",
        () => {
          if (card.roomId) options.onSelectRoom(card.roomId);
        },
        { signal: this.#abort.signal },
      );
      this.#root.querySelector(".estate-feeds")?.append(button);
      return card;
    });
    this.#scene.events.on("sleep", this.#hide);
    this.#scene.events.on("wake", this.#show);
  }

  readonly #hide = () => {
    this.#root.hidden = true;
  };
  readonly #show = () => {
    this.#root.hidden = !this.#visible;
  };

  setPresentation(presentation: SurveillancePresentation) {
    this.#visible =
      presentation.available &&
      presentation.mode === "surveillance" &&
      presentation.feedRooms.length > 0;
    if (!this.#visible) {
      this.#root.hidden = true;
      return;
    }
    for (const [index, card] of this.#cards.entries()) {
      const feed = presentation.feedRooms[index];
      card.button.hidden = !feed;
      card.roomId = feed?.roomId ?? null;
      if (!feed) continue;
      const signature = JSON.stringify(feed);
      if (card.signature === signature) continue;
      card.signature = signature;
      card.title.textContent = feed.label;
      card.status.textContent = feed.statusLine;
      card.marker.textContent = feed.markers.body
        ? "REPORT"
        : feed.markers.sabotage
          ? "SABOTAGE"
          : feed.markers.clue
            ? "CLUE"
            : feed.lightLevel.toUpperCase();
      card.occupancy.textContent =
        feed.occupantCount === 1
          ? "1 witness"
          : `${feed.occupantCount} present`;
      card.button.setAttribute("aria-pressed", String(feed.selected));
      card.button.setAttribute(
        "aria-label",
        `${feed.label} camera, ${feed.statusLine}, ${card.occupancy.textContent}`,
      );
      this.#paintFeed(card.canvas, feed);
    }
    this.#root.hidden = false;
  }

  #paintFeed(canvas: HTMLCanvasElement, feed: SurveillanceFeedPresentation) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const room = getRoomRenderData(feed.roomId);
    const art = getImportedRoomArt(feed.roomId);
    ctx.clearRect(0, 0, 400, 220);
    ctx.drawImage(this.#source(estateFloorKey(feed.roomId)), 0, 0, 400, 220);
    ctx.drawImage(this.#source(estateWallKey(feed.roomId)), 0, 0, 400, 47);
    for (const prop of art.heroProps) {
      const width = (prop.width / room.width) * 400;
      const height = (prop.height / room.height) * 220;
      ctx.drawImage(
        this.#source(estatePropKey(prop.key)),
        ((prop.x - room.bounds.x) / room.width) * 400 - width / 2,
        ((prop.y - room.bounds.y) / room.height) * 220 - height / 2,
        width,
        height,
      );
    }
    for (const [index, player] of feed.occupants.slice(0, 8).entries()) {
      const seat = getRoomSeatPosition(
        feed.roomId,
        index,
        Math.min(8, feed.occupants.length),
      );
      const x = Math.max(
        12,
        Math.min(388, ((seat.x - room.bounds.x) / room.width) * 400),
      );
      const y = Math.max(
        59,
        Math.min(203, ((seat.y - room.bounds.y) / room.height) * 220),
      );
      const appearance = resolveAvatarAppearance(player);
      ctx.fillStyle = "#10241c88";
      ctx.beginPath();
      ctx.ellipse(x + 3, y + 8, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `#${appearance.outfitColor.toString(16).padStart(6, "0")}`;
      ctx.fillRect(x - 5, y - 6, 10, 15);
      ctx.fillStyle = `#${appearance.bodyColor.toString(16).padStart(6, "0")}`;
      ctx.beginPath();
      ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle =
      feed.lightLevel === "blackout"
        ? "#091512d9"
        : feed.lightLevel === "dim"
          ? "#09151255"
          : "#23473515";
    ctx.fillRect(0, 0, 400, 220);
    ctx.fillStyle = "#07160f20";
    for (let y = 0; y < 220; y += 4) ctx.fillRect(0, y, 400, 1);
  }

  #source(key: string) {
    return this.#scene.textures.get(key).getSourceImage() as
      | HTMLCanvasElement
      | HTMLImageElement;
  }

  resize(_width: number, _height: number) {}

  destroy() {
    this.#abort.abort();
    this.#scene.events.off("sleep", this.#hide);
    this.#scene.events.off("wake", this.#show);
    this.#root.remove();
  }
}
