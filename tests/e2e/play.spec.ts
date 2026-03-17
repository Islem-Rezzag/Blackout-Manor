import { expect, test } from "@playwright/test";

test("renders the live manor canvas", async ({ page }) => {
  await page.goto("/game/demo");

  await expect(page.getByTestId("game-runtime-host")).toBeVisible();
  await expect(page.locator(".game-runtime-canvas-host canvas").first()).toBeVisible();
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

test("loads replay through the runtime from the dev shell", async ({ page }) => {
  await page.goto("/dev/play?view=replay");

  await expect(page.getByTestId("game-runtime-host")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator(".game-runtime-canvas-host canvas").first()).toBeVisible();
  await expect(page.getByTestId("game-runtime-room-label")).toContainText(
    "Room demo",
  );
});

test("keeps fairness behind the dev route", async ({ page }) => {
  await page.goto("/fairness");

  await expect(page).toHaveURL(/\/dev\/fairness$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Season 01 balance telemetry/i }),
  ).toBeVisible();
});
