import type * as Phaser from "phaser";

import type { ClientGameAssetSourceId } from "./assetSources";

type DerivedTexturePlanEntry = {
  key: string;
  kind: "derived-image";
  swapGroup: string;
  sourceId: ClientGameAssetSourceId;
  sourceKey: string;
  placeholder: boolean;
  description: string;
};

const OGA_SHEET_KEY = "oga-modern-houses-sheet";

export const CLIENT_GAME_DERIVED_TEXTURE_PLAN: readonly DerivedTexturePlanEntry[] =
  [
    {
      key: "floor-parquet",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Warm parquet baseline for hall, library, study, and ballroom rooms.",
    },
    {
      key: "floor-service",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Grey service/basement baseline for kitchen and corridor floors.",
    },
    {
      key: "floor-greenhouse",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Green glasshouse floor texture for greenhouse and garden-facing spaces.",
    },
    {
      key: "floor-stone",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Stone/mechanical floor for cellar and generator spaces.",
    },
    {
      key: "wall-panel",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Panelled cutaway wall texture for social and study rooms.",
    },
    {
      key: "wall-service",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Warm service wall texture for kitchen and corridor support rooms.",
    },
    {
      key: "wall-greenhouse",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Cool greenhouse wall panel texture.",
    },
    {
      key: "wall-stone",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Stone cutaway wall texture for cellar and generator rooms.",
    },
    {
      key: "door-threshold",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Readable threshold/door art for cutaway transitions.",
    },
    {
      key: "prop-bookshelf",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Bookshelf silhouette used in library-facing task spaces.",
    },
    {
      key: "prop-kitchen-range",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Kitchen range/cabinet silhouette for food-service interactions.",
    },
    {
      key: "prop-study-desk",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Desk and records silhouette for study/library tasks.",
    },
    {
      key: "prop-console-bank",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description:
        "Metal cabinet/console silhouette for surveillance and generator stations.",
    },
    {
      key: "prop-planter",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Planter/bench silhouette for greenhouse interactions.",
    },
    {
      key: "prop-boiler",
      kind: "derived-image",
      swapGroup: "manor-rendering",
      sourceId: "oga-modern-houses-cc0",
      sourceKey: OGA_SHEET_KEY,
      placeholder: false,
      description: "Heater/boiler silhouette for basement mechanical spaces.",
    },
  ] as const;

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const createCanvasTexture = (
  textures: Phaser.Textures.TextureManager,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) => {
  if (textures.exists(key)) {
    textures.remove(key);
  }

  const canvasTexture = textures.createCanvas(key, width, height);
  if (!canvasTexture) {
    return;
  }
  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  canvasTexture.refresh();
};

const drawPattern = (
  ctx: CanvasRenderingContext2D,
  sourceImage: CanvasImageSource,
  crop: CropRect,
  destination: { width: number; height: number },
  scale: number,
  backgroundFill: string,
) => {
  ctx.fillStyle = backgroundFill;
  ctx.fillRect(0, 0, destination.width, destination.height);

  const tileWidth = crop.width * scale;
  const tileHeight = crop.height * scale;

  for (let y = 0; y < destination.height; y += tileHeight) {
    for (let x = 0; x < destination.width; x += tileWidth) {
      ctx.drawImage(
        sourceImage,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        x,
        y,
        tileWidth,
        tileHeight,
      );
    }
  }
};

const drawSpriteCrop = (
  ctx: CanvasRenderingContext2D,
  sourceImage: CanvasImageSource,
  crop: CropRect,
  destination: { width: number; height: number },
  scale: number,
) => {
  const spriteWidth = crop.width * scale;
  const spriteHeight = crop.height * scale;
  const x = Math.round((destination.width - spriteWidth) / 2);
  const y = Math.round((destination.height - spriteHeight) / 2);

  ctx.drawImage(
    sourceImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    x,
    y,
    spriteWidth,
    spriteHeight,
  );
};

export const registerDerivedClientGameTextures = (
  textures: Phaser.Textures.TextureManager,
) => {
  if (!textures.exists(OGA_SHEET_KEY)) {
    return;
  }

  const sourceTexture = textures.get(OGA_SHEET_KEY);
  const sourceImage = sourceTexture.getSourceImage() as CanvasImageSource;

  createCanvasTexture(textures, "floor-parquet", 256, 256, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 48, y: 80, width: 32, height: 16 },
      { width: 256, height: 256 },
      4,
      "#5c3a26",
    );
  });
  createCanvasTexture(textures, "floor-service", 256, 256, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 48, y: 160, width: 48, height: 16 },
      { width: 256, height: 256 },
      3,
      "#37363d",
    );
  });
  createCanvasTexture(textures, "floor-greenhouse", 256, 256, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 96, y: 128, width: 64, height: 32 },
      { width: 256, height: 256 },
      2,
      "#2f4734",
    );
  });
  createCanvasTexture(textures, "floor-stone", 256, 256, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 0, y: 144, width: 48, height: 48 },
      { width: 256, height: 256 },
      2,
      "#3a3940",
    );
  });

  createCanvasTexture(textures, "wall-panel", 320, 120, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 32, y: 0, width: 48, height: 64 },
      { width: 320, height: 120 },
      2,
      "#4d4668",
    );
  });
  createCanvasTexture(textures, "wall-service", 320, 120, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 80, y: 0, width: 64, height: 48 },
      { width: 320, height: 120 },
      2,
      "#705745",
    );
  });
  createCanvasTexture(textures, "wall-greenhouse", 320, 120, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 192, y: 0, width: 64, height: 48 },
      { width: 320, height: 120 },
      2,
      "#35685a",
    );
  });
  createCanvasTexture(textures, "wall-stone", 320, 120, (ctx) => {
    drawPattern(
      ctx,
      sourceImage,
      { x: 0, y: 144, width: 48, height: 48 },
      { width: 320, height: 120 },
      2,
      "#4a4b53",
    );
  });

  createCanvasTexture(textures, "door-threshold", 64, 128, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 48, y: 128, width: 16, height: 32 },
      { width: 64, height: 128 },
      4,
    );
  });
  createCanvasTexture(textures, "prop-bookshelf", 160, 224, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 32, y: 0, width: 48, height: 112 },
      { width: 160, height: 224 },
      2,
    );
  });
  createCanvasTexture(textures, "prop-kitchen-range", 192, 128, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 144, y: 16, width: 48, height: 32 },
      { width: 192, height: 128 },
      3,
    );
  });
  createCanvasTexture(textures, "prop-study-desk", 192, 160, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 144, y: 32, width: 48, height: 48 },
      { width: 192, height: 160 },
      3,
    );
  });
  createCanvasTexture(textures, "prop-console-bank", 176, 128, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 160, y: 16, width: 32, height: 32 },
      { width: 176, height: 128 },
      3,
    );
  });
  createCanvasTexture(textures, "prop-planter", 160, 160, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 16, y: 96, width: 48, height: 32 },
      { width: 160, height: 160 },
      3,
    );
  });
  createCanvasTexture(textures, "prop-boiler", 176, 192, (ctx) => {
    drawSpriteCrop(
      ctx,
      sourceImage,
      { x: 0, y: 64, width: 48, height: 48 },
      { width: 176, height: 192 },
      3,
    );
  });
};
