import type * as Phaser from "phaser";

import type { ManorDoorNode, ManorRenderRoom } from "../../tiled/manorLayout";
import type { EnvironmentRoomLayerContainers } from "./EnvironmentRenderTypes";

export const getWallSpans = (
  length: number,
  openings: readonly { start: number; end: number }[],
) => {
  const spans: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const opening of [...openings].sort((a, b) => a.start - b.start)) {
    const start = Math.max(0, Math.min(length, opening.start));
    const end = Math.max(start, Math.min(length, opening.end));
    if (start > cursor) spans.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < length) spans.push({ start: cursor, end: length });
  return spans;
};

export const drawRoomArchitecture = (
  scene: Phaser.Scene,
  room: ManorRenderRoom,
  containers: EnvironmentRoomLayerContainers,
  doors: readonly ManorDoorNode[],
) => {
  const graphics = scene.add.graphics();
  const left = -room.width / 2;
  const top = -room.height / 2 + room.framing.floorInsetY;
  const roomDoors = doors.filter((door) => door.roomId === room.roomId);
  const drawEdge = (edge: "west" | "east" | "south") => {
    const vertical = edge !== "south";
    const length = vertical ? room.height : room.width;
    const openings = roomDoors
      .filter((door) => door.orientation === edge)
      .map((door) => {
        const center = vertical
          ? door.y - room.y - top
          : door.x - room.x - left;
        const size = (vertical ? door.height : door.width) / 2 + 7;
        return { start: center - size, end: center + size };
      });
    for (const span of getWallSpans(length, openings)) {
      const x = vertical
        ? edge === "west"
          ? left - 7
          : -left - 2
        : left + span.start;
      const y = vertical ? top + span.start : top + room.height - 2;
      const w = vertical ? 9 : span.end - span.start;
      const h = vertical ? span.end - span.start : 9;
      graphics.fillStyle(0x1a2723, 1).fillRect(x + 3, y + 5, w, h);
      graphics.fillStyle(0x858973, 1).fillRect(x, y, w, h);
      graphics.lineStyle(1, 0xd1c8a2, 0.7).strokeRect(x, y, w, h);
      graphics
        .fillStyle(0x3f5147, 1)
        .fillRect(x + 2, y + 2, Math.max(2, w - 4), Math.max(2, h - 4));
    }
  };
  drawEdge("west");
  drawEdge("east");
  drawEdge("south");
  // Raised pilasters establish wall thickness without covering floor interaction lanes.
  for (const x of [left - 4, -left - 6]) {
    graphics.fillStyle(0x1a2622).fillRect(x + 3, top - 17, 12, 43);
    graphics.fillStyle(0xa8a188).fillRect(x, top - 23, 12, 40);
    graphics.fillStyle(0xd0c5a3).fillRect(x - 3, top - 25, 18, 6);
    graphics.fillStyle(0x697365).fillRect(x + 3, top - 15, 5, 28);
  }
  containers.walls.addAt(graphics, 0);
};
