import { describe, expect, it, vi } from "vitest";

import { MockMatchConnection } from "./network/mockMatchConnection";
import {
  getRoomSeatPosition,
  MANOR_RENDER_MAP,
  MANOR_ROOM_LAYOUTS,
} from "./tiled/manorLayout";

describe("client-game package", () => {
  it("generates stable manor room seats inside room bounds", () => {
    const seat = getRoomSeatPosition("grand-hall", 0, 4);
    const room = MANOR_ROOM_LAYOUTS["grand-hall"];

    expect(seat.x).toBeGreaterThan(room.x - room.width / 2);
    expect(seat.x).toBeLessThan(room.x + room.width / 2);
    expect(seat.y).toBeGreaterThan(room.y - room.height / 2);
    expect(seat.y).toBeLessThan(room.y + room.height / 2);
  });

  it("parses the external tiled manor map into render data", () => {
    expect(MANOR_RENDER_MAP.roomOrder).toHaveLength(10);
    expect(MANOR_RENDER_MAP.rooms["grand-hall"].lights.length).toBeGreaterThan(
      0,
    );
    expect(MANOR_RENDER_MAP.rooms.greenhouse.windows.length).toBeGreaterThan(0);
  });

  it("emits hello, private role, and snapshot in mock mode", async () => {
    vi.useFakeTimers();
    const connection = new MockMatchConnection({ tickMs: 200 });
    const received: string[] = [];

    connection.subscribe((message) => {
      received.push(message.type);
    });

    await connection.connect();

    expect(received[0]).toBe("server.hello");
    expect(received[1]).toBe("server.match.private-state");
    expect(received[2]).toBe("server.match.snapshot");

    vi.useRealTimers();
    await connection.disconnect();
  });
});
