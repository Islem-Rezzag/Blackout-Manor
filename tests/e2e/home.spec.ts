import { expect, test } from "@playwright/test";

test("opens the manor directly from the public root", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/game\/demo$/);
  await expect(page.getByTestId("game-runtime-host")).toBeVisible();
  await expect(page.locator(".launcher-shell")).toHaveCount(0);
});
