import { expect, test } from "@playwright/test";

test("halaman login tampil", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login Pengelola Masjid" })).toBeVisible();
});
