import { expect, test } from "@playwright/test";

test("presents the public root as a game-first launcher", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /blackout manor/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /enter game/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /watch demo room/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /enter game/i }).click();
  await expect(page).toHaveURL(/\/game\/demo$/);
  await expect(page.getByTestId("game-runtime-host")).toBeVisible();
});

test("renders the live manor canvas", async ({ page }) => {
  await page.goto("/game/demo");

  await expect(page.getByTestId("game-runtime-host")).toBeVisible();
  await expect(
    page.locator(".game-runtime-canvas-host canvas").first(),
  ).toBeVisible();
  await expect(page.getByTestId("game-runtime-room-label")).toContainText(
    "Room demo",
  );
});

test("keeps the legacy play route as a compatibility redirect", async ({
  page,
}) => {
  await page.goto("/play");

  await expect(page).toHaveURL(/\/game\/demo$/);
  await expect(page.getByTestId("game-runtime-host")).toBeVisible();
});

test("loads replay through the runtime from the dev shell", async ({
  page,
}) => {
  await page.goto("/dev/play?view=replay");

  await expect(page.getByTestId("game-runtime-host")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.locator(".game-runtime-canvas-host canvas").first(),
  ).toBeVisible();
  await expect(page.getByTestId("game-runtime-room-label")).toContainText(
    "Room demo",
  );
});

test("keeps fairness behind the dev route", async ({ page }) => {
  await page.goto("/fairness");

  await expect(page).toHaveURL(/\/dev\/fairness$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Season 01 balance and replay telemetry/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Replay-backed EQ Metrics/i }),
  ).toBeVisible();
});
