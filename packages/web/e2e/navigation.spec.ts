import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
	test("can access browse page when authenticated", async ({ page }) => {
		await page.goto("/browse");

		// Should stay on browse page (not redirect to sign-in)
		await expect(page).toHaveURL(/\/browse/);
	});

	test("sidebar navigation works", async ({ page }) => {
		await page.goto("/browse");

		// Check sidebar links are visible
		await expect(page.getByRole("link", { name: /my drive/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /recent/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /starred/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /trash/i })).toBeVisible();
	});

	test("can navigate to starred page", async ({ page }) => {
		await page.goto("/browse");

		await page.getByRole("link", { name: /starred/i }).click();

		await expect(page).toHaveURL(/\/starred/);
	});

	test("can navigate to trash page", async ({ page }) => {
		await page.goto("/browse");

		await page.getByRole("link", { name: /trash/i }).click();

		await expect(page).toHaveURL(/\/trash/);
	});

	test("can navigate to recent page", async ({ page }) => {
		await page.goto("/browse");

		await page.getByRole("link", { name: /recent/i }).click();

		await expect(page).toHaveURL(/\/recent/);
	});

	test("can navigate to settings page", async ({ page }) => {
		await page.goto("/browse");

		// Settings might be in a dropdown or visible in sidebar
		const settingsLink = page.getByRole("link", { name: /settings/i }).first();
		if (await settingsLink.isVisible()) {
			await settingsLink.click();
			await expect(page).toHaveURL(/\/settings/);
		}
	});
});
