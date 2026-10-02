import { expect, test } from "@playwright/test";

test("viewer owns local start and pause; controls survive the meeting", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-01-01T08:00:00Z") });
  await page.goto("/game/demo");
  const hud = page.locator(".manor-hud");
  await expect(hud.getByRole("region", { name: "Session ready" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".game-runtime-topbar")).toBeHidden();
  await page.clock.pauseAt(new Date("2026-01-01T09:00:00Z"));
  await page.clock.fastForward(2400);
  await expect(hud.locator('[data-field="clock"]')).toHaveText("00:00");
  await hud
    .getByRole("region", { name: "Session ready" })
    .getByRole("button", { name: "Start night" })
    .click();
  await hud.getByLabel("Playback speed").selectOption("0.25");
  await page.clock.fastForward(4800);
  await expect(hud.locator('[data-field="clock"]')).toHaveText("00:01");
  await hud.getByRole("button", { name: "Pause playback" }).click();
  const pausedTime = await hud.locator('[data-field="clock"]').textContent();
  await page.clock.fastForward(2400);
  await expect(hud.locator('[data-field="clock"]')).toHaveText(
    pausedTime ?? "",
  );
  for (let tick = 2; tick <= 16; tick += 1)
    await hud.getByRole("button", { name: "Next tick" }).click();
  await expect(hud).toHaveCount(1);
  await expect(hud).toHaveAttribute("data-directed", "true");
  await expect(hud.locator('[data-phase="meeting"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(
    hud.getByRole("button", { name: "Resume playback" }),
  ).toBeVisible();
  await expect(
    hud.getByRole("button", { name: "Choose a room" }),
  ).toBeDisabled();
  await hud
    .getByRole("button", { name: "Public activity", exact: true })
    .click();
  await expect(
    hud.getByRole("complementary", { name: "Public activity" }),
  ).toContainText("Discussion begins");
  await expect(hud.locator(".estate-guest")).toHaveCount(10);
  await expect(hud.locator(".estate-subtitle p")).toContainText("I saw");
  expect(errors).toEqual([]);
});

test("archive playback has a working visible frame cursor and scrubber", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/dev/play?view=replay");
  const hud = page.locator(".manor-hud");
  await expect(hud.getByRole("button", { name: "Next frame" })).toBeVisible({
    timeout: 20_000,
  });
  const initial = await hud.locator('[data-field="clock"]').textContent();
  await hud.getByRole("button", { name: "Next frame" }).click();
  await expect(hud.locator('[data-field="clock"]')).not.toHaveText(
    initial ?? "",
  );
  await hud.getByRole("button", { name: "Previous frame" }).click();
  await expect(hud.locator('[data-field="clock"]')).toHaveText(initial ?? "");
  await hud.getByRole("button", { name: "Resume playback" }).click();
  await expect(hud.locator('[data-field="clock"]')).not.toHaveText(
    initial ?? "",
  );
  await hud.getByRole("button", { name: "Pause playback" }).click();
  await expect(hud.getByLabel("Replay frame")).toBeVisible();
});
