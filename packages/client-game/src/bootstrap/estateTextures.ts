import type { RoomId } from "@blackout-manor/shared";
import type * as Phaser from "phaser";

import { MANOR_RENDER_MAP } from "../tiled/manorLayout";
import {
  ESTATE_MATERIALS,
  ESTATE_TEXTURE_PLAN,
  type EstateMaterial,
} from "./estateTexturePlan";

type PaintContext = CanvasRenderingContext2D;

const rect = (
  ctx: PaintContext,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

const line = (
  ctx: PaintContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const ellipse = (
  ctx: PaintContext,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

const randomSequence = (seed: number) => {
  let state = seed;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
};

const seedFrom = (text: string) =>
  [...text].reduce((seed, c) => Math.imul(seed, 31) + c.charCodeAt(0), 17);

const bevel = (
  ctx: PaintContext,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  edge = "#bbaa7e",
) => {
  ctx.save();
  ctx.shadowColor = "#060b0a99";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 5;
  rect(ctx, x, y, w, h, color);
  ctx.restore();
  line(ctx, x, y, x + w, y, edge, 2);
  line(ctx, x, y, x, y + h, edge, 1);
  line(ctx, x + w, y, x + w, y + h, "#111b19", 2);
  line(ctx, x, y + h, x + w, y + h, "#111b19", 3);
};

const grain = (
  ctx: PaintContext,
  w: number,
  h: number,
  seed: number,
  count = 1400,
) => {
  const random = randomSequence(seed);
  for (let i = 0; i < count; i++) {
    const x = random() * w;
    const y = random() * h;
    rect(ctx, x, y, 0.5 + random() * 2, 0.5, i % 2 ? "#fff9dd12" : "#0715131a");
  }
};

export const paintEstateFloor = (
  ctx: PaintContext,
  width: number,
  height: number,
  material: EstateMaterial,
  seed = 37,
) => {
  const random = randomSequence(seed);
  rect(ctx, 0, 0, width, height, material.base);
  if (material.floor === "parquet") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI / 4);
    for (let y = -width; y < width; y += 14) {
      for (let x = -width; x < width; x += 58) {
        const offset = (Math.floor(y / 14) % 4) * 14;
        rect(
          ctx,
          x + offset,
          y,
          56,
          13,
          random() > 0.5 ? material.base : material.alternate,
        );
        line(ctx, x + offset + 3, y + 4, x + offset + 53, y + 4, "#e3c28b22");
        line(ctx, x + offset + 8, y + 10, x + offset + 44, y + 10, "#332a221f");
      }
    }
    ctx.restore();
  } else if (material.floor === "boards") {
    for (let y = 0; y < height; y += 16) {
      rect(ctx, 0, y, width, 15, y % 32 ? material.base : material.alternate);
      for (let x = y % 48; x < width; x += 78) {
        line(ctx, x, y, x, y + 15, "#262d2977");
        ellipse(ctx, x + 3, y + 3, 0.8, 0.8, "#252c29");
      }
    }
  } else {
    const tile =
      material.floor === "stone" ? 30 : material.floor === "marble" ? 30 : 20;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        rect(
          ctx,
          x + 1,
          y + 1,
          tile - 1,
          tile - 1,
          (x / tile + y / tile) % 2 ? material.alternate : material.base,
        );
        line(ctx, x + 2, y + 2, x + tile - 2, y + 2, "#eee9cb20");
        if (material.floor === "marble" || material.floor === "stone") {
          line(
            ctx,
            x + random() * tile,
            y + 4,
            x + random() * tile,
            y + tile - 2,
            "#e3e6d21c",
          );
        }
        if (material.floor === "tile" && (x / tile + y / tile) % 2 === 0) {
          ctx.save();
          ctx.translate(x + tile / 2, y + tile / 2);
          ctx.rotate(Math.PI / 4);
          rect(ctx, -2, -2, 4, 4, material.alternate);
          ctx.restore();
        }
      }
    }
  }
  for (const inset of [5, 9]) {
    ctx.strokeStyle = inset === 5 ? "#242c2588" : "#d4c19488";
    ctx.lineWidth = inset === 5 ? 3 : 1;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  }
  if (material.rug) {
    const rw = width * 0.51;
    const rh = height * 0.43;
    const x = (width - rw) / 2;
    const y = (height - rh) / 2 + 20;
    rect(ctx, x + 3, y + 4, rw, rh, "#111a1970");
    rect(ctx, x, y, rw, rh, material.rug);
    for (const inset of [3, 7, 11]) {
      ctx.strokeStyle = "#d7bd875c";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + inset, y + inset, rw - inset * 2, rh - inset * 2);
    }
    for (let px = x + 18; px < x + rw - 12; px += 18) {
      for (let py = y + 16; py < y + rh - 10; py += 16) {
        line(ctx, px - 3, py, px + 3, py, "#d2b78365");
        line(ctx, px, py - 3, px, py + 3, "#d2b78365");
      }
    }
    for (let py = y + 1; py < y + rh; py += 3) {
      line(ctx, x - 3, py, x, py, "#baa77e");
      line(ctx, x + rw, py, x + rw + 3, py, "#baa77e");
    }
  }
  grain(ctx, width, height, seed);
  const shade = ctx.createLinearGradient(0, 0, width * 0.3, height);
  shade.addColorStop(0, "#0c1b2475");
  shade.addColorStop(0.35, "#fff3cb05");
  shade.addColorStop(1, "#0b1d2236");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
};

const paintWall = (ctx: PaintContext, w: number, h: number, roomId: RoomId) => {
  const material = ESTATE_MATERIALS[roomId];
  rect(ctx, 0, 0, w, h, material.wall);
  rect(ctx, 0, h * 0.56, w, h * 0.44, "#242f2b");
  for (let x = 8; x < w - 8; x += 32) {
    ctx.strokeStyle = "#a3986d60";
    ctx.strokeRect(x, h * 0.62, 24, h * 0.29);
    if (roomId !== "greenhouse") {
      line(ctx, x + 5, 9, x + 5, h * 0.52, "#b8bd9f1c");
      ellipse(ctx, x + 16, h * 0.3, 2, 4, "#d1c39824");
    }
  }
  rect(ctx, 0, 0, w, 5, "#292e27");
  rect(ctx, 0, 5, w, 2, material.trim);
  rect(ctx, 0, h * 0.56, w, 2, material.trim);
  rect(ctx, 0, h - 4, w, 4, "#111b19");
  const windows =
    roomId === "greenhouse"
      ? 6
      : roomId === "grand-hall" || roomId === "ballroom"
        ? 3
        : 2;
  for (let i = 0; i < windows; i++) {
    const x = ((i + 0.5) * w) / windows - 12;
    bevel(ctx, x - 3, 9, 30, h - 18, "#182f32", material.trim);
    rect(ctx, x, 11, 24, h - 23, "#49737a");
    rect(ctx, x + 2, 13, 20, (h - 25) * 0.5, "#81a5a077");
    line(ctx, x + 12, 11, x + 12, h - 12, "#1a2e2c", 2);
    line(ctx, x, h / 2, x + 24, h / 2, "#1a2e2c", 2);
    if (roomId === "ballroom" || roomId === "library") {
      rect(ctx, x - 8, 9, 7, h - 13, "#603844");
      rect(ctx, x + 25, 9, 7, h - 13, "#603844");
    }
  }
  for (let i = 1; i < windows; i++) {
    const x = (i * w) / windows;
    const glow = ctx.createRadialGradient(x, h * 0.4, 1, x, h * 0.4, 25);
    glow.addColorStop(0, "#f9cf7877");
    glow.addColorStop(1, "#f9cf7800");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 25, 0, 50, h);
    line(ctx, x, h * 0.5, x, h * 0.28, "#b99a61", 3);
    ellipse(ctx, x, h * 0.28, 4, 5, "#ffe2a3");
    ellipse(ctx, x, h * 0.28, 2, 3, "#fff1c7");
  }
  const light = ctx.createLinearGradient(0, 0, 0, h);
  light.addColorStop(0, "#07111d60");
  light.addColorStop(1, "#f8ce6a10");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, seedFrom(roomId), 500);
};

const plant = (ctx: PaintContext, x: number, y: number, scale = 1) => {
  ellipse(ctx, x + 3, y + 5, 18 * scale, 10 * scale, "#081a1480");
  ellipse(ctx, x, y + 3, 10 * scale, 7 * scale, "#856e50");
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    ctx.save();
    ctx.translate(
      x + Math.cos(angle) * 6 * scale,
      y - 8 + Math.sin(angle) * 5 * scale,
    );
    ctx.rotate(angle);
    ellipse(
      ctx,
      6 * scale,
      0,
      11 * scale,
      4 * scale,
      i % 2 ? "#456849" : "#64815a",
    );
    line(ctx, 0, 0, 13 * scale, 0, "#98a86b55");
    ctx.restore();
  }
};

const paintProp = (ctx: PaintContext, key: string) => {
  if (key.includes("stair")) {
    bevel(ctx, 22, 32, 156, 106, "#343a32");
    for (let y = 38; y < 136; y += 8) {
      rect(ctx, 30, y, 140, 6, y % 16 ? "#b4a48a" : "#968a76");
      rect(ctx, 87, y, 29, 6, "#864755");
      line(ctx, 28, y, 172, y, "#e0c99c88");
    }
    for (const x of [25, 175]) {
      line(ctx, x, 26, x, 143, "#bcab83", 4);
      for (let y = 30; y < 140; y += 13) ellipse(ctx, x, y, 3, 4, "#d7c193");
    }
  } else if (key.includes("clock")) {
    bevel(ctx, 68, 17, 63, 143, "#543e2e", "#b79865");
    bevel(ctx, 73, 22, 53, 48, "#342a24", "#cfb07c");
    ellipse(ctx, 100, 46, 21, 20, "#d2c49c");
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ellipse(
        ctx,
        100 + Math.sin(a) * 17,
        46 + Math.cos(a) * 16,
        1,
        1,
        "#363a30",
      );
    }
    line(ctx, 100, 46, 100, 33, "#292d26", 2);
    line(ctx, 100, 46, 113, 51, "#292d26", 2);
    bevel(ctx, 81, 79, 37, 65, "#242b23");
    line(ctx, 101, 84, 98, 127, "#baa05b", 2);
    ellipse(ctx, 98, 132, 9, 9, "#bba464");
  } else if (
    key.includes("bookshelf") ||
    key.includes("pantry") ||
    key.includes("archive")
  ) {
    bevel(ctx, 27, 22, 146, 135, "#483d2e");
    const colors = ["#8f5d51", "#647969", "#b69c65", "#5a697c", "#927e67"];
    for (let row = 0; row < 4; row++) {
      const y = 29 + row * 30;
      rect(ctx, 34, y, 132, 25, "#202920");
      for (let i = 0; i < 15; i++) {
        const x = 36 + i * 8.5;
        const height = 15 + ((i * 3 + row) % 8);
        rect(
          ctx,
          x,
          y + 25 - height,
          6,
          height,
          colors[(i + row) % colors.length] ?? "#96775a",
        );
        rect(ctx, x + 1, y + 28 - height, 4, 1, "#d5c69eaa");
      }
      line(ctx, 33, y + 27, 167, y + 27, "#9f855c", 3);
    }
  } else if (key.includes("fireplace") || key.includes("boiler")) {
    bevel(
      ctx,
      33,
      22,
      134,
      128,
      key.includes("boiler") ? "#465252" : "#aaa18a",
    );
    bevel(ctx, 43, 28, 114, 15, "#bbb093");
    bevel(ctx, 57, 56, 86, 73, "#172321");
    const fire = ctx.createRadialGradient(100, 113, 2, 100, 106, 47);
    fire.addColorStop(0, "#ffe7a1");
    fire.addColorStop(0.4, "#df895e");
    fire.addColorStop(1, "#be562100");
    ctx.fillStyle = fire;
    ctx.fillRect(53, 61, 94, 70);
    for (let x = 70; x < 138; x += 10) {
      line(ctx, x, 91, x, 130, "#223330", 2);
    }
    bevel(ctx, 26, 144, 149, 10, "#7c7968");
  } else if (key.includes("planter") || key.includes("greenhouse-bench")) {
    bevel(ctx, 25, 80, 150, 64, "#7a7562");
    rect(ctx, 32, 86, 136, 46, "#2e3a2d");
    for (let i = 0; i < 5; i++) plant(ctx, 42 + i * 29, 101, 0.9);
  } else if (key.includes("screenwall") || key.includes("console")) {
    bevel(ctx, 21, 26, 158, 108, "#2f403c", "#80978a");
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 29 + col * 50;
        const y = 34 + row * 42;
        bevel(ctx, x, y, 43, 32, "#102927", "#648b7c");
        rect(ctx, x + 4, y + 4, 35, 23, "#487c68");
        for (let l = 0; l < 23; l += 3)
          line(ctx, x + 4, y + 4 + l, x + 39, y + 4 + l, "#173b3144");
        line(ctx, x + 7, y + 20, x + 13, y + 11, "#a2c7a8");
        line(ctx, x + 13, y + 11, x + 32, y + 16, "#a2c7a8");
      }
    }
    bevel(ctx, 20, 137, 161, 15, "#57655a");
    for (let x = 38; x < 170; x += 10) ellipse(ctx, x, 144, 2, 1, "#ceb57d");
  } else if (key.includes("generator")) {
    bevel(ctx, 25, 41, 150, 101, "#42584d", "#99a18b");
    ellipse(ctx, 93, 90, 46, 40, "#223d33");
    ellipse(ctx, 93, 90, 34, 31, "#718778");
    ellipse(ctx, 93, 90, 24, 21, "#334e42");
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      line(
        ctx,
        93 + Math.cos(a) * 13,
        90 + Math.sin(a) * 12,
        93 + Math.cos(a) * 29,
        90 + Math.sin(a) * 27,
        "#abb092",
        3,
      );
    }
    for (const x of [36, 154]) bevel(ctx, x, 29, 10, 126, "#8f8a72");
    ellipse(ctx, 147, 62, 7, 7, "#cdbb81");
    line(ctx, 147, 62, 151, 57, "#333f36", 1);
  } else if (key.includes("organ")) {
    for (let i = 0; i < 11; i++) {
      const height = 52 + (5 - Math.abs(5 - i)) * 11;
      bevel(ctx, 35 + i * 12, 125 - height, 9, height, "#a29d82", "#ded1aa");
    }
    bevel(ctx, 24, 124, 152, 27, "#5c4534");
    rect(ctx, 40, 128, 120, 14, "#d9cfad");
    for (let x = 42; x < 157; x += 8) rect(ctx, x, 128, 3, 9, "#24302a");
  } else if (key.includes("safe")) {
    bevel(ctx, 44, 28, 112, 129, "#546052", "#9ba58d");
    bevel(ctx, 54, 41, 92, 104, "#35493e", "#b3af87");
    ellipse(ctx, 100, 88, 15, 15, "#b5a67a");
    line(ctx, 88, 88, 112, 88, "#394d40", 3);
    line(ctx, 100, 76, 100, 100, "#394d40", 3);
  } else if (
    key.includes("desk") ||
    key.includes("island") ||
    key.includes("stage") ||
    key.includes("range")
  ) {
    const isRange = key.includes("range");
    bevel(ctx, 23, 60, 155, 84, isRange ? "#63716b" : "#7c5e3e", "#c9b081");
    for (let x = 30; x < 178; x += 17) line(ctx, x, 65, x, 135, "#3a30221f");
    if (isRange) {
      for (const x of [58, 105, 151]) {
        ellipse(ctx, x, 84, 14, 11, "#283e37");
        ellipse(ctx, x, 84, 8, 6, "#8c9b82");
      }
      bevel(ctx, 57, 114, 84, 18, "#bfae88");
    } else {
      rect(ctx, 63, 81, 44, 29, "#d8c8a0");
      for (let y = 88; y < 106; y += 4) line(ctx, 68, y, 99, y, "#776e4c77");
      ellipse(ctx, 143, 90, 9, 7, "#cebd83");
      ellipse(ctx, 143, 88, 6, 4, "#eee0b4");
    }
  } else {
    bevel(ctx, 25, 62, 95, 81, "#7f6545", "#c1a273");
    bevel(ctx, 108, 40, 60, 103, "#6b6249", "#b5a47a");
    for (const x of [39, 105, 122, 156])
      line(ctx, x, 71, x, 138, "#cab68950", 3);
  }
  grain(ctx, 200, 180, seedFrom(key), 250);
};

const armchair = (
  ctx: PaintContext,
  x: number,
  y: number,
  upholstery: string,
) => {
  rect(ctx, x + 5, y + 9, 32, 31, "#0d17178f");
  bevel(ctx, x, y, 29, 32, "#493d2b", "#b89968");
  bevel(ctx, x + 4, y + 6, 21, 22, upholstery, "#bd9b6577");
  bevel(ctx, x - 2, y + 8, 6, 24, upholstery);
  bevel(ctx, x + 25, y + 8, 6, 24, upholstery);
  bevel(ctx, x + 2, y - 3, 25, 10, upholstery);
};

const paintRoomFurnishings = (
  ctx: PaintContext,
  w: number,
  h: number,
  id: RoomId,
) => {
  if (id === "library" || id === "study") {
    armchair(ctx, 26, h * 0.52, id === "library" ? "#864c53" : "#49635c");
    armchair(ctx, 26, h * 0.76, id === "library" ? "#864c53" : "#49635c");
    bevel(ctx, 31, h * 0.69, 20, 12, "#ae8b57");
    ellipse(ctx, 40, h * 0.69 + 4, 3, 2, "#e4d5a6");
    plant(ctx, w - 31, h - 42, 0.8);
  } else if (id === "ballroom") {
    ctx.save();
    ctx.translate(w * 0.13, h * 0.63);
    ctx.rotate(-0.15);
    ctx.shadowColor = "#11180e99";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = "#252729";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(44, 0);
    ctx.bezierCurveTo(79, 10, 68, 37, 47, 44);
    ctx.lineTo(4, 44);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    rect(ctx, 6, 30, 39, 10, "#e5ddc0");
    for (let x = 9; x < 43; x += 4) line(ctx, x, 30, x, 40, "#656754");
    for (let x = 11; x < 43; x += 5) rect(ctx, x, 30, 2, 5, "#171e20");
    line(ctx, 3, 8, 46, 4, "#8b8064");
    bevel(ctx, 11, 51, 31, 11, "#453c30");
    ctx.restore();
    plant(ctx, w - 31, h - 42, 0.9);
  } else if (id === "greenhouse") {
    for (let y = 70; y < h - 35; y += 30) {
      for (const x of [24, w - 25]) plant(ctx, x, y, 1.05);
    }
    for (let x = 64; x < w - 40; x += 40) plant(ctx, x, 57, 0.75);
  } else if (id === "kitchen") {
    bevel(ctx, 22, h * 0.63, 68, 27, "#9d9c82", "#d1c5a2");
    ellipse(ctx, 43, h * 0.63 + 12, 12, 9, "#e0d7b5");
    ellipse(ctx, 44, h * 0.63 + 11, 7, 5, "#b99451");
    bevel(ctx, 61, h * 0.63 + 5, 22, 17, "#bd9770");
    for (const x of [68, 74, 79])
      ellipse(ctx, x, h * 0.63 + 11, 3, 4, "#6b844e");
  } else if (id === "cellar") {
    for (const x of [34, 74, 111]) {
      bevel(ctx, x - 17, 82, 33, 42, "#786040", "#b59b72");
      ellipse(ctx, x, 82, 16, 9, "#a4885b");
      for (const y of [91, 114]) line(ctx, x - 15, y, x + 15, y, "#354a3d", 4);
      for (let dx = -9; dx < 13; dx += 6)
        line(ctx, x + dx, 87, x + dx, 118, "#463e3266");
    }
  } else if (id === "servants-corridor") {
    for (const x of [20, w - 60]) {
      bevel(ctx, x, 29, 38, 45, "#453e2b");
      rect(ctx, x + 3, 33, 32, 38, "#aba794");
      rect(ctx, x + 4, 44, 30, 26, "#67786b");
      bevel(ctx, x + 7, 34, 24, 10, "#d1c8ab");
    }
  } else if (id === "grand-hall") {
    const tableX = w * 0.14;
    const tableY = h * 0.54;
    const tableWidth = w * 0.72;
    const tableHeight = h * 0.19;
    rect(ctx, tableX + 5, tableY + 8, tableWidth, tableHeight, "#17221ba6");
    bevel(ctx, tableX, tableY, tableWidth, tableHeight, "#725d43", "#c3a678");
    bevel(
      ctx,
      tableX + 6,
      tableY + 5,
      tableWidth - 12,
      tableHeight - 10,
      "#8b7451",
      "#a28b64",
    );
    rect(
      ctx,
      tableX + 10,
      tableY + tableHeight * 0.42,
      tableWidth - 20,
      tableHeight * 0.16,
      "#b9ae87",
    );
    for (let seat = 0; seat < 5; seat += 1) {
      const x = tableX + tableWidth * ((seat + 0.5) / 5);
      ellipse(ctx, x, tableY + 10, 6, 4, "#e2d3ac");
      ellipse(ctx, x, tableY + tableHeight - 10, 6, 4, "#e2d3ac");
    }
    for (const x of [27, w - 45]) {
      plant(ctx, x + 8, h - 52, 0.95);
      bevel(ctx, x, h * 0.45, 22, 42, "#6d4d46", "#ac8c62");
      for (let y = h * 0.45 + 8; y < h * 0.45 + 40; y += 10)
        line(ctx, x + 3, y, x + 19, y, "#a6776255");
    }
  }
};

const paintGrounds = (ctx: PaintContext, w: number, h: number) => {
  rect(ctx, 0, 0, w, h, "#1d302c");
  const random = randomSequence(810);
  for (let i = 0; i < 21000; i++) {
    const x = random() * w;
    const y = random() * h;
    rect(ctx, x, y, 1 + random() * 4, 1, i % 2 ? "#77927420" : "#0c201c30");
  }
  // One masonry footprint under every room and passage joins the estate visually.
  const footprints = [
    ...Object.values(MANOR_RENDER_MAP.rooms).map((room) => room.bounds),
    ...MANOR_RENDER_MAP.corridors,
  ];
  for (const b of footprints) {
    ctx.save();
    ctx.shadowColor = "#081812bb";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 14;
    rect(ctx, b.x - 14, b.y - 24, b.width + 28, b.height + 40, "#151f1c");
    ctx.restore();
    rect(ctx, b.x - 13, b.y - 23, b.width + 26, b.height + 26, "#858571");
    ctx.strokeStyle = "#c1bf9c";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 14, b.y - 24, b.width + 28, b.height + 27);
  }
  // Terrace, gate, and formal garden remain outside playable room geometry.
  for (let y = 979; y < h; y += 17) {
    for (let x = 427; x < 1077; x += 37) {
      rect(
        ctx,
        x + (y % 34 ? 18 : 0),
        y,
        35,
        16,
        y % 34 ? "#4a5c50" : "#586456",
      );
    }
  }
  for (const x of [410, 1082]) {
    for (let y = 967; y < 1090; y += 12) {
      ellipse(ctx, x, y, 11, 8, "#334e38");
      ellipse(ctx, x - 2, y - 2, 8, 5, "#4c6545");
    }
  }
  ellipse(ctx, 756, 1033, 68, 34, "#142b27");
  ellipse(ctx, 756, 1029, 64, 32, "#989c83");
  ellipse(ctx, 756, 1029, 55, 25, "#355b57");
  ellipse(ctx, 751, 1023, 41, 17, "#63898455");
  ellipse(ctx, 756, 1028, 18, 12, "#a1a58b");
  ellipse(ctx, 756, 1018, 11, 9, "#bec0a0");
  for (let x = 58; x < 1475; x += 19) {
    line(ctx, x, 1027, x, 1058, "#112720", 3);
    ctx.beginPath();
    ctx.moveTo(x - 4, 1027);
    ctx.lineTo(x, 1020);
    ctx.lineTo(x + 4, 1027);
    ctx.fillStyle = "#142d23";
    ctx.fill();
  }
  line(ctx, 58, 1033, 1475, 1033, "#71837255", 2);
  line(ctx, 58, 1047, 1475, 1047, "#102a21", 3);
  for (let i = 0; i < 35; i++) {
    const x =
      i < 12
        ? 25 + random() * 65
        : i < 24
          ? 1460 + random() * 95
          : 80 + random() * 1450;
    const y = i < 24 ? 40 + random() * 950 : 30 + random() * 24;
    const radius = 22 + random() * 30;
    ellipse(ctx, x + 12, y + 18, radius, radius * 0.7, "#0b1f1777");
    for (let leaf = 0; leaf < 22; leaf++) {
      const a = random() * Math.PI * 2;
      const r = random() * radius;
      ellipse(
        ctx,
        x + Math.cos(a) * r,
        y + Math.sin(a) * r * 0.8,
        radius * 0.36,
        radius * 0.26,
        leaf % 3 ? "#304a37" : "#4a6545",
      );
    }
  }
  for (const [x, y] of [
    [171, 282],
    [1413, 298],
    [842, 579],
    [432, 957],
    [1097, 963],
  ]) {
    if (x === undefined || y === undefined) continue;
    bevel(ctx, x - 6, y - 6, 12, 15, "#a5a88d");
    ellipse(ctx, x, y - 6, 5, 4, "#f5d18b");
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 46);
    glow.addColorStop(0, "#f8d38b30");
    glow.addColorStop(1, "#f8d38b00");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 46, y - 46, 92, 92);
  }
};

export const registerEstateTextures = (
  textures: Phaser.Textures.TextureManager,
) => {
  for (const entry of ESTATE_TEXTURE_PLAN) {
    if (textures.exists(entry.key)) continue;
    const canvas = textures.createCanvas(
      entry.key,
      entry.width * 2,
      entry.height * 2,
    );
    if (!canvas) continue;
    const ctx = canvas.getContext();
    ctx.scale(2, 2);
    if (entry.key === "estate-grounds") {
      paintGrounds(ctx, entry.width, entry.height);
    } else if (
      entry.key === "estate-gallery" ||
      entry.key === "estate-dining-gallery"
    ) {
      paintEstateFloor(ctx, entry.width, entry.height, {
        ...ESTATE_MATERIALS.library,
        rug: null,
      });
      rect(
        ctx,
        0,
        entry.height * 0.36,
        entry.width,
        entry.height * 0.3,
        "#784853",
      );
      line(
        ctx,
        0,
        entry.height * 0.38,
        entry.width,
        entry.height * 0.38,
        "#bd9a68",
        2,
      );
      if (entry.key === "estate-dining-gallery") {
        for (let x = 65; x < entry.width - 45; x += 40) {
          armchair(ctx, x, 19, "#775145");
          armchair(ctx, x, 101, "#775145");
        }
        armchair(ctx, 30, 59, "#775145");
        armchair(ctx, entry.width - 52, 59, "#775145");
        bevel(ctx, 51, 52, entry.width - 100, 52, "#8a6947", "#c1a273");
        rect(ctx, 60, 67, entry.width - 118, 18, "#a4a38c");
        for (let x = 80; x < entry.width - 60; x += 40) {
          ellipse(ctx, x, 61, 9, 5, "#e5d8b2");
          ellipse(ctx, x, 94, 9, 5, "#e5d8b2");
          line(ctx, x + 13, 57, x + 13, 64, "#e2d2ad");
        }
        for (const x of [125, 206]) {
          ellipse(ctx, x, 75, 7, 3, "#ad9060");
          line(ctx, x, 75, x, 63, "#d7c49a", 2);
          ellipse(ctx, x, 61, 2, 4, "#ffdda5");
        }
      }
      line(
        ctx,
        0,
        entry.height * 0.64,
        entry.width,
        entry.height * 0.64,
        "#bd9a68",
        2,
      );
    } else if (entry.key.startsWith("estate-floor-")) {
      const roomId = entry.key.slice(13) as RoomId;
      paintEstateFloor(
        ctx,
        entry.width,
        entry.height,
        ESTATE_MATERIALS[roomId],
        seedFrom(roomId),
      );
      paintRoomFurnishings(ctx, entry.width, entry.height, roomId);
      if (roomId === "grand-hall") {
        ctx.strokeStyle = "#d5c295";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          entry.width / 2,
          entry.height * 0.56,
          64,
          47,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8;
          line(
            ctx,
            entry.width / 2,
            entry.height * 0.56,
            entry.width / 2 + Math.cos(a) * 60,
            entry.height * 0.56 + Math.sin(a) * 43,
            "#ccba9277",
          );
        }
      }
    } else if (entry.key.startsWith("estate-wall-")) {
      paintWall(ctx, entry.width, entry.height, entry.key.slice(12) as RoomId);
    } else {
      ctx.scale(entry.width / 200, entry.height / 180);
      paintProp(ctx, entry.fallbackKey);
    }
    canvas.refresh();
  }
};
