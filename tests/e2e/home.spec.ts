import { expect, test } from "@playwright/test";

test("renders the public launcher", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /blackout manor/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /enter game/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /watch demo room/i }),
  ).toBeVisible();
  await expect(page.getByText(/Contributor and debug routes/i)).toBeVisible();
});
