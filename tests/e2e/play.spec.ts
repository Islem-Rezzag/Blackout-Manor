import { expect, test } from "@playwright/test";

test("renders the live manor canvas", async ({ page }) => {
  await page.goto("/play");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Blackout Manor control room",
    }),
  ).toBeVisible();
  await expect(page.locator(".game-canvas-host canvas").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Live floor" }),
  ).toBeVisible();
});

test("loads the replay theater dossier", async ({ page }) => {
  await page.goto("/play?view=replay");

  await expect(
    page.getByRole("heading", { level: 2, name: "Replay theater" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("replay-theater")).toBeVisible();
  await expect(page.getByTestId("timeline-scrubber")).toBeVisible();
});
