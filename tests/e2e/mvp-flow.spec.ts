import { expect, test } from "@playwright/test";

test.describe("Desktop", () => {
  test("halaman login tampil", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Login Pengelola Masjid" })).toBeVisible();
  });

  test("dashboard ringkasan statistik tampil setelah login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@sismata.local");
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Saldo Kas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mutasi Terbaru" })).toBeVisible();
  });
});

test.describe("Mobile (iPhone SE 375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("login mobile dan header full-width", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Login Pengelola Masjid" })).toBeVisible();

    // login
    await page.fill('input[name="email"]', "bendahara@sismata.local");
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // header harus full-width — bounding box lebar >= 370 (dari 375 viewport minus body margin)
    const header = page.locator("header").first();
    const box = await header.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(370);
    }

    // tombol menu drawer visible di mobile
    await expect(page.getByLabel("Buka menu navigasi")).toBeVisible();
  });

  test("drawer mobile tombol tersedia dan akses dari shortcut aksi cepat", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "bendahara@sismata.local");
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // tombol menu drawer tersedia di mobile
    await expect(page.getByLabel("Buka menu navigasi")).toBeVisible();

    // aksi cepat di mobile tetap bisa diakses tanpa drawer
    await expect(page.getByRole("link", { name: /Catat Pembayaran/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kas Masuk/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kas Keluar/ })).toBeVisible();
  });

  test("dashboard mobile menampilkan card mutasi bukan tabel", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "bendahara@sismata.local");
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // di mobile, tabel mutasi tersembunyi
    await expect(page.locator("table")).not.toBeVisible();

    // saldo kas harus terlihat
    await expect(page.getByText("Saldo kas aktif")).toBeVisible();
  });
});
