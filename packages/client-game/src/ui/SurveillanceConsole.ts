import type {
  LightLevelId,
  PublicPlayerState,
  RoomId,
} from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type {
  SurveillanceFeedPresentation,
  SurveillancePresentation,
} from "../directors/types";
import { resolveAvatarAppearance } from "../entities/avatar/presentation";
import { lightLevelToFactor, mixColor } from "../stage/signals";
import { getRoomRenderData, getRoomSeatPosition } from "../tiled/manorLayout";

type SurveillanceConsoleOptions = {
  scene: Phaser.Scene;
  onSelectRoom: (roomId: RoomId) => void;
};

type FeedCard = {
  container: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  frame: Phaser.GameObjects.Rectangle;
  floor: Phaser.GameObjects.Rectangle;
  accent: Phaser.GameObjects.Rectangle;
  cutaway: Phaser.GameObjects.Rectangle;
  marker: Phaser.GameObjects.Text;
  occupants: Phaser.GameObjects.Arc[];
  occupantLabel: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
  roomId: RoomId | null;
};

const CARD_WIDTH = 236;
const CARD_HEIGHT = 148;
const CARD_GAP = 16;
const CARD_COLUMNS = 2;
const MAX_OCCUPANT_PIPS = 8;

const occupancyLabel = (occupants: number) =>
  occupants === 1 ? "1 witness" : `${occupants} present`;

const markerLabel = (feed: SurveillanceFeedPresentation) => {
  if (feed.markers.body) {
    return "REPORT";
  }

  if (feed.markers.sabotage) {
    return "SABOTAGE";
  }

  if (feed.markers.clue) {
    return "CLUE";
  }

  return "";
};

const markerColor = (feed: SurveillanceFeedPresentation) => {
  if (feed.markers.body) {
    return { fill: 0x5a1d23, stroke: 0xff997f, text: "#fff0ea" };
  }

  if (feed.markers.sabotage) {
    return { fill: 0x382215, stroke: 0xf0b080, text: "#fff3e5" };
  }

  if (feed.markers.clue) {
    return { fill: 0x2a2417, stroke: 0xe8d28a, text: "#fff8dd" };
  }

  return { fill: 0x17222a, stroke: 0x73a8c9, text: "#dce6ef" };
};

const roomFrameTint = (roomId: RoomId, lightLevel: LightLevelId) => {
  const room = getRoomRenderData(roomId);
  const lightFactor = lightLevelToFactor(lightLevel);

  return {
    floor: mixColor(room.fillColor, 0x05080c, 1 - lightFactor),
    accent: mixColor(room.accentColor, 0x0d141a, 1 - lightFactor * 0.86),
    cutaway: mixColor(room.cutawayColor, 0x05080c, 1 - lightFactor * 0.78),
  };
};

const occupantTint = (player: PublicPlayerState) => {
  const appearance = resolveAvatarAppearance(player);

  return {
    fill: appearance.outfitColor,
    stroke: appearance.trimColor,
  };
};

export class SurveillanceConsole {
  readonly #scene: Phaser.Scene;
  readonly #root: Phaser.GameObjects.Container;
  readonly #titlePlate: Phaser.GameObjects.Rectangle;
  readonly #title: Phaser.GameObjects.Text;
  readonly #hint: Phaser.GameObjects.Text;
  readonly #cards: FeedCard[];
  readonly #onSelectRoom: (roomId: RoomId) => void;

  constructor(options: SurveillanceConsoleOptions) {
    this.#scene = options.scene;
    this.#onSelectRoom = options.onSelectRoom;
    this.#titlePlate = options.scene.add
      .rectangle(0, 0, CARD_WIDTH * 2 + CARD_GAP + 28, 48, 0x061018, 0.78)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    this.#title = options.scene.add.text(
      -(CARD_WIDTH + CARD_GAP / 2) + 8,
      -8,
      "Surveillance Console",
      {
        color: "#f5f0e4",
        fontFamily: "Palatino Linotype, Georgia, serif",
        fontSize: "18px",
        fontStyle: "bold",
      },
    );
    this.#hint = options.scene.add.text(
      -(CARD_WIDTH + CARD_GAP / 2) + 8,
      12,
      "Click a feed or press 1-4 to lock the camera.",
      {
        color: "#9eb9ca",
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "11px",
      },
    );

    this.#cards = Array.from({ length: 4 }, (_, index) =>
      this.#createCard(index),
    );
    this.#root = options.scene.add.container(0, 0, [
      this.#titlePlate,
      this.#title,
      this.#hint,
      ...this.#cards.map((card) => card.container),
    ]);
    this.#root.setDepth(114);
    this.#root.setScrollFactor(0);
    this.#root.setVisible(false);
    this.resize(options.scene.scale.width, options.scene.scale.height);
  }

  setPresentation(presentation: SurveillancePresentation) {
    const visible =
      presentation.available &&
      presentation.mode === "surveillance" &&
      presentation.feedRooms.length > 0;
    this.#root.setVisible(visible);

    if (!visible) {
      return;
    }

    for (const [index, card] of this.#cards.entries()) {
      const feed = presentation.feedRooms[index];

      if (!feed) {
        card.container.setVisible(false);
        card.roomId = null;
        continue;
      }

      card.container.setVisible(true);
      card.roomId = feed.roomId;
      this.#renderCard(card, feed, index);
    }
  }

  resize(width: number, height: number) {
    const totalWidth = CARD_WIDTH * 2 + CARD_GAP + 28;
    const totalHeight = 48 + CARD_GAP + CARD_HEIGHT * 2 + CARD_GAP;
    this.#root.setPosition(
      width - totalWidth / 2 - 24,
      height - totalHeight / 2 - 94,
    );
  }

  destroy() {
    this.#root.destroy(true);
  }

  #createCard(index: number): FeedCard {
    const column = index % CARD_COLUMNS;
    const row = Math.floor(index / CARD_COLUMNS);
    const x =
      -((CARD_WIDTH + CARD_GAP) / 2) + column * (CARD_WIDTH + CARD_GAP) + 7;
    const y = row * (CARD_HEIGHT + CARD_GAP) + 82;

    const plate = this.#scene.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x081018, 0.82)
      .setStrokeStyle(1, 0x73a8c9, 0.18);
    const title = this.#scene.add.text(-100, -57, "", {
      color: "#f5f0e4",
      fontFamily: "Palatino Linotype, Georgia, serif",
      fontSize: "16px",
      fontStyle: "bold",
      wordWrap: { width: 128 },
    });
    const status = this.#scene.add.text(-100, -34, "", {
      color: "#d7dee9",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      wordWrap: { width: 164 },
    });
    const frame = this.#scene.add
      .rectangle(0, 18, CARD_WIDTH - 24, 78, 0x0e151b, 0.96)
      .setStrokeStyle(1, 0x73a8c9, 0.14);
    const floor = this.#scene.add.rectangle(
      0,
      18,
      CARD_WIDTH - 36,
      62,
      0x24303a,
      1,
    );
    const accent = this.#scene.add
      .rectangle(0, 18, CARD_WIDTH - 58, 34, 0x365062, 0.2)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const cutaway = this.#scene.add.rectangle(
      0,
      -7,
      CARD_WIDTH - 30,
      18,
      0x4c5a64,
      0.88,
    );
    const marker = this.#scene.add.text(84, -57, "", {
      color: "#dce6ef",
      backgroundColor: "#17222a",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      padding: { left: 6, right: 6, top: 4, bottom: 4 },
    });
    marker.setOrigin(1, 0.5);
    const occupantLabel = this.#scene.add.text(-100, 52, "", {
      color: "#b7cad6",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "11px",
      wordWrap: { width: 170 },
    });

    const occupants = Array.from({ length: MAX_OCCUPANT_PIPS }, () =>
      this.#scene.add
        .circle(0, 0, 5, 0x7aa6d8, 1)
        .setStrokeStyle(1, 0xf5f0e4, 0.5),
    );

    const hitArea = this.#scene.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", () => {
      if (card.roomId) {
        this.#onSelectRoom(card.roomId);
      }
    });

    const card: FeedCard = {
      container: this.#scene.add.container(x, y, [
        plate,
        title,
        status,
        frame,
        floor,
        accent,
        cutaway,
        marker,
        ...occupants,
        occupantLabel,
        hitArea,
      ]),
      plate,
      title,
      status,
      frame,
      floor,
      accent,
      cutaway,
      marker,
      occupants,
      occupantLabel,
      hitArea,
      roomId: null,
    };
    card.container.setVisible(false);

    return card;
  }

  #renderCard(
    card: FeedCard,
    feed: SurveillanceFeedPresentation,
    index: number,
  ) {
    const marker = markerLabel(feed);
    const markerStyle = markerColor(feed);
    const tints = roomFrameTint(feed.roomId, feed.lightLevel);

    card.title.setText(`${index + 1}. ${feed.label}`);
    card.status.setText(feed.statusLine);
    card.occupantLabel.setText(occupancyLabel(feed.occupantCount));
    card.plate.setFillStyle(feed.selected ? 0x091521 : 0x081018, 0.86);
    card.plate.setStrokeStyle(
      1.4,
      feed.selected ? 0xd8c18a : 0x73a8c9,
      feed.selected ? 0.34 : 0.18,
    );
    card.frame.setStrokeStyle(
      1,
      feed.selected ? 0xd8c18a : 0x73a8c9,
      feed.selected ? 0.3 : 0.14,
    );
    card.floor.setFillStyle(tints.floor, 1);
    card.accent.setFillStyle(tints.accent, 0.22);
    card.cutaway.setFillStyle(tints.cutaway, 0.9);
    card.marker.setText(marker || `${feed.lightLevel.toUpperCase()}`);
    card.marker.setStyle({
      color: markerStyle.text,
      backgroundColor: Phaser.Display.Color.RGBToString(
        (markerStyle.fill >> 16) & 0xff,
        (markerStyle.fill >> 8) & 0xff,
        markerStyle.fill & 0xff,
        1,
        "#",
      ),
    });
    card.marker.setStroke("#000000", 0);

    const room = getRoomRenderData(feed.roomId);
    const visibleOccupants = feed.occupants.slice(0, MAX_OCCUPANT_PIPS);
    const frameWidth = CARD_WIDTH - 36;
    const frameHeight = 62;
    const frameTop = 18 - frameHeight / 2;
    const frameLeft = -frameWidth / 2;

    for (const [pipIndex, pip] of card.occupants.entries()) {
      const player = visibleOccupants[pipIndex];

      if (!player) {
        pip.setVisible(false);
        continue;
      }

      const seat = getRoomSeatPosition(
        feed.roomId,
        pipIndex,
        visibleOccupants.length,
      );
      const normalizedX = (seat.x - room.bounds.x) / room.bounds.width;
      const normalizedY = (seat.y - room.bounds.y) / room.bounds.height;
      const tint = occupantTint(player);
      pip.setVisible(true);
      pip.setPosition(
        frameLeft + normalizedX * frameWidth,
        frameTop + normalizedY * frameHeight,
      );
      pip.setFillStyle(tint.fill, player.status === "alive" ? 0.96 : 0.48);
      pip.setStrokeStyle(1, tint.stroke, player.connected ? 0.8 : 0.34);
      pip.setRadius(player.status === "alive" ? 5 : 4);
    }
  }
}
