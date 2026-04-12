import type { PublicPlayerState, RoomId } from "@blackout-manor/shared";
import * as Phaser from "phaser";

import type {
  SurveillanceFeedPresentation,
  SurveillancePresentation,
} from "../directors/types";
import { resolveAvatarAppearance } from "../entities/avatar/presentation";
import { getImportedRoomArt } from "../stage/importedArt";
import { createFeedPalette } from "../stage/renderTheme";
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
  shell: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  accent: Phaser.GameObjects.Rectangle;
  cutaway: Phaser.GameObjects.Image;
  dust: Phaser.GameObjects.Image;
  specular: Phaser.GameObjects.Image;
  marker: Phaser.GameObjects.Text;
  propShadows: Phaser.GameObjects.Image[];
  props: Phaser.GameObjects.Image[];
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
const MAX_FEED_PROP_SPRITES = 3;
const CONSOLE_SIDE_WING = 88;
const CONSOLE_WIDTH =
  CARD_WIDTH * CARD_COLUMNS + CARD_GAP + 28 + CONSOLE_SIDE_WING * 2;
const CONSOLE_HEIGHT = 48 + CARD_GAP + CARD_HEIGHT * 2 + CARD_GAP + 28;

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

const occupantTint = (player: PublicPlayerState) => {
  const appearance = resolveAvatarAppearance(player);

  return {
    fill: appearance.outfitColor,
    stroke: appearance.trimColor,
  };
};

const selectFeedProps = (roomArt: ReturnType<typeof getImportedRoomArt>) =>
  [...roomArt.supportProps, ...roomArt.heroProps].slice(
    0,
    MAX_FEED_PROP_SPRITES,
  );

export class SurveillanceConsole {
  readonly #scene: Phaser.Scene;
  readonly #root: Phaser.GameObjects.Container;
  readonly #consoleBackdrop: Phaser.GameObjects.Rectangle;
  readonly #consoleGlow: Phaser.GameObjects.Image;
  readonly #cableRack: Phaser.GameObjects.Image;
  readonly #leftArchive: Phaser.GameObjects.Image;
  readonly #rightReels: Phaser.GameObjects.Image;
  readonly #titlePlate: Phaser.GameObjects.Rectangle;
  readonly #title: Phaser.GameObjects.Text;
  readonly #hint: Phaser.GameObjects.Text;
  readonly #cards: FeedCard[];
  readonly #onSelectRoom: (roomId: RoomId) => void;

  constructor(options: SurveillanceConsoleOptions) {
    this.#scene = options.scene;
    this.#onSelectRoom = options.onSelectRoom;
    this.#consoleBackdrop = options.scene.add
      .rectangle(0, 116, CONSOLE_WIDTH, CONSOLE_HEIGHT, 0x040d14, 0.38)
      .setStrokeStyle(1, 0x73a8c9, 0.14);
    this.#consoleGlow = options.scene.add
      .image(0, 134, "room-glow")
      .setDisplaySize(CONSOLE_WIDTH - 36, CONSOLE_HEIGHT - 54)
      .setTint(0x7dbfd8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.08);
    this.#cableRack = options.scene.add
      .image(0, 32, "prop-surveillance-cable-rack")
      .setDisplaySize(CONSOLE_WIDTH - 52, 46)
      .setAlpha(0.74);
    this.#leftArchive = options.scene.add
      .image(
        -(CARD_WIDTH + CARD_GAP / 2) - 88,
        174,
        "prop-surveillance-archive",
      )
      .setDisplaySize(92, 92)
      .setAlpha(0.72);
    this.#rightReels = options.scene.add
      .image(
        CARD_WIDTH + CARD_GAP / 2 + 88,
        174,
        "prop-surveillance-reel-stack",
      )
      .setDisplaySize(92, 102)
      .setAlpha(0.76);
    this.#titlePlate = options.scene.add
      .rectangle(0, 0, CONSOLE_WIDTH - 20, 48, 0x061018, 0.84)
      .setStrokeStyle(1, 0x73a8c9, 0.2);
    this.#title = options.scene.add.text(
      -(CONSOLE_WIDTH / 2) + 28,
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
      -(CONSOLE_WIDTH / 2) + 28,
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
      this.#consoleBackdrop,
      this.#consoleGlow,
      this.#cableRack,
      this.#leftArchive,
      this.#rightReels,
      this.#titlePlate,
      this.#title,
      this.#hint,
      ...this.#cards.map((card) => card.container),
    ]);
    this.#root.setDepth(322);
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
    this.#root.setPosition(
      width - CONSOLE_WIDTH / 2 - 24,
      height - CONSOLE_HEIGHT / 2 - 94,
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
    const shell = this.#scene.add
      .image(0, 18, "room-shell")
      .setDisplaySize(CARD_WIDTH - 8, CARD_HEIGHT - 26)
      .setAlpha(0.94);
    const frame = this.#scene.add
      .rectangle(0, 18, CARD_WIDTH - 24, 78, 0x0e151b, 0.9)
      .setStrokeStyle(1, 0x73a8c9, 0.14);
    const floor = this.#scene.add
      .image(0, 18, "floor-grand-hall")
      .setDisplaySize(CARD_WIDTH - 36, 62)
      .setAlpha(0.92);
    const accent = this.#scene.add
      .rectangle(0, 18, CARD_WIDTH - 58, 34, 0x365062, 0.2)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const cutaway = this.#scene.add
      .image(0, -7, "wall-grand-hall")
      .setDisplaySize(CARD_WIDTH - 30, 18)
      .setAlpha(0.9);
    const dust = this.#scene.add
      .image(0, 18, "room-dust")
      .setDisplaySize(CARD_WIDTH - 44, 60)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.1);
    const specular = this.#scene.add
      .image(0, 18, "room-specular")
      .setDisplaySize(CARD_WIDTH - 42, 60)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.12);
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
    const propShadows = Array.from({ length: MAX_FEED_PROP_SPRITES }, () =>
      this.#scene.add
        .image(0, 0, "room-shadow")
        .setDisplaySize(24, 12)
        .setAlpha(0.12),
    );
    const props = Array.from({ length: MAX_FEED_PROP_SPRITES }, () =>
      this.#scene.add
        .image(0, 0, "prop-crate-stack")
        .setDisplaySize(22, 18)
        .setAlpha(0.72),
    );

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
        shell,
        frame,
        floor,
        accent,
        ...propShadows,
        ...props,
        cutaway,
        dust,
        specular,
        marker,
        ...occupants,
        occupantLabel,
        hitArea,
      ]),
      plate,
      title,
      status,
      frame,
      shell,
      floor,
      accent,
      cutaway,
      dust,
      specular,
      marker,
      propShadows,
      props,
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
    const room = getRoomRenderData(feed.roomId);
    const roomArt = getImportedRoomArt(feed.roomId);
    const visibleProps = selectFeedProps(roomArt);
    const palette = createFeedPalette({
      room,
      lightLevel: feed.lightLevel,
      selected: feed.selected,
      flagged: Boolean(feed.markers.body || feed.markers.sabotage),
    });

    card.title.setText(`${index + 1}. ${feed.label}`);
    card.status.setText(feed.statusLine);
    card.occupantLabel.setText(occupancyLabel(feed.occupantCount));
    card.plate.setFillStyle(palette.plateFill, 0.86);
    card.plate.setStrokeStyle(
      1.4,
      palette.plateStroke,
      feed.selected ? 0.34 : 0.18,
    );
    card.shell.setTint(room.surfaces.shellColor);
    card.frame.setStrokeStyle(
      1,
      palette.plateStroke,
      feed.selected ? 0.3 : 0.14,
    );
    card.floor.setTexture(roomArt.floorKey);
    card.floor.setTint(palette.frameFill);
    card.floor.setAlpha(feed.selected ? 0.98 : 0.92);
    card.accent.setFillStyle(palette.accentFill, 0.22);
    card.cutaway.setTexture(roomArt.wallKey);
    card.cutaway.setTint(palette.cutawayFill);
    card.cutaway.setAlpha(feed.selected ? 0.94 : 0.88);
    card.dust.setTint(palette.dustTint);
    card.specular.setTint(room.ambienceColor);
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

    const visibleOccupants = feed.occupants.slice(0, MAX_OCCUPANT_PIPS);
    const frameWidth = CARD_WIDTH - 36;
    const frameHeight = 62;
    const frameTop = 18 - frameHeight / 2;
    const frameLeft = -frameWidth / 2;
    const widthScale = frameWidth / room.bounds.width;
    const heightScale = frameHeight / room.bounds.height;

    for (const [propIndex, propImage] of card.props.entries()) {
      const prop = visibleProps[propIndex];
      const shadow = card.propShadows[propIndex];

      if (!prop || !shadow) {
        propImage.setVisible(false);
        shadow?.setVisible(false);
        continue;
      }

      const normalizedX = (prop.x - room.bounds.x) / room.bounds.width;
      const normalizedY = (prop.y - room.bounds.y) / room.bounds.height;
      const displayWidth = Phaser.Math.Clamp(
        prop.width * widthScale * 1.12,
        18,
        frameWidth * 0.42,
      );
      const displayHeight = Phaser.Math.Clamp(
        prop.height * heightScale * 1.18,
        12,
        frameHeight * 0.62,
      );
      const x = frameLeft + normalizedX * frameWidth;
      const y = frameTop + normalizedY * frameHeight + 3;

      shadow
        .setVisible(true)
        .setPosition(x, y + displayHeight * 0.18)
        .setDisplaySize(displayWidth * 1.08, Math.max(10, displayHeight * 0.38))
        .setAlpha(feed.selected ? 0.18 : 0.12);
      propImage
        .setVisible(true)
        .setTexture(prop.key)
        .setPosition(x, y)
        .setDisplaySize(displayWidth, displayHeight)
        .setAlpha(Math.min(feed.selected ? 0.82 : 0.72, prop.alpha));
    }

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
