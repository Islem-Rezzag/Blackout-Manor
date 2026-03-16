import { expect, test } from "@playwright/test";

test("renders the workspace shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Blackout Manor" }),
  ).toBeVisible();
  await expect(page.getByText("Monorepo foundation")).toBeVisible();
});
