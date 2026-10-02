import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1280, height: 820 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`estate controls fit and work at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.clock.install({ time: new Date("2026-01-01T08:00:00Z") });
    await page.goto("/game/demo");
    const hud = page.locator(".manor-hud:not([hidden])");
    await expect(
      hud.getByRole("heading", { name: "Blackout Manor" }),
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(hud.locator(".estate-guest")).toHaveCount(10);
    // The fixed future target stays ahead of slow CI startup and protocol latency.
    await page.clock.pauseAt(new Date("2026-01-01T09:00:00Z"));
    await expect(hud.locator('[data-field="alive"]')).toHaveText("10 / 10");
    await expect(
      hud.getByRole("region", { name: "Session ready" }),
    ).toBeVisible();
    await expect(hud.locator('[data-field="clock"]')).toHaveText("00:00");
    await hud
      .getByRole("region", { name: "Session ready" })
      .getByRole("button", { name: "Start night" })
      .click();
    await page.clock.fastForward(2400);
    await hud.getByRole("button", { name: "Pause playback" }).click();
    await hud.getByRole("button", { name: "Next tick" }).click();
    await expect(
      hud.getByRole("region", { name: "Session ready" }),
    ).toBeHidden();
    await expect(hud.locator('[data-phase="roam"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(hud.locator('[data-field="clock"]')).toHaveText("00:02");
    await hud.locator(".estate-guest").first().click();
    await expect(hud.locator(".estate-location")).toContainText("Following");

    await hud.getByRole("button", { name: "Choose a room" }).click();
    await expect(
      hud.getByRole("region", { name: "Manor rooms" }),
    ).toBeVisible();
    await hud.getByRole("button", { name: /^Library/ }).click();
    await expect(hud.locator(".estate-location")).toContainText("Library");
    await expect(hud.getByRole("region", { name: "Manor rooms" })).toBeHidden();

    await hud.getByRole("button", { name: "Estate overview" }).click();
    await hud.getByRole("button", { name: "Surveillance cameras" }).click();
    await expect(
      hud.getByRole("button", { name: "Surveillance cameras" }),
    ).toHaveAttribute("aria-pressed", "true");
    await hud.getByRole("button", { name: "Estate overview" }).click();
    await expect(
      hud.getByRole("button", { name: "Surveillance cameras" }),
    ).toHaveAttribute("aria-pressed", "false");

    await hud.getByRole("button", { name: "Mute manor sound" }).click();
    await expect(
      hud.getByRole("button", { name: "Enable manor sound" }),
    ).toHaveAttribute("aria-pressed", "true");
    await hud.getByRole("button", { name: "Enable manor sound" }).click();

    const bounds = await hud.evaluate((root) => {
      const selectors = [
        ".estate-header",
        ".estate-nav",
        ".estate-bottom",
        ".estate-tools",
        ".estate-transport",
        ".estate-phase-track",
      ];
      return selectors.map((selector) => {
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        return rect
          ? { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }
          : null;
      });
    });
    for (const box of bounds) {
      expect(box).not.toBeNull();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect(box?.y).toBeGreaterThanOrEqual(0);
      expect(box?.right).toBeLessThanOrEqual(viewport.width);
      expect(box?.bottom).toBeLessThanOrEqual(viewport.height);
    }
    expect(errors).toEqual([]);
  });
}
