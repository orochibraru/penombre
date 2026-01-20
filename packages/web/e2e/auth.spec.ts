import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("sign-in page loads correctly", async ({ page }) => {
		// Clear auth state for this test
		await page.context().clearCookies();

		await page.goto("/auth/sign-in");

		await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("shows error for invalid credentials", async ({ page }) => {
		// Clear auth state for this test
		await page.context().clearCookies();

		await page.goto("/auth/sign-in");

		await page.getByLabel(/email/i).fill("invalid@test.com");
		await page.getByLabel(/password/i).fill("wrongpassword");
		await page.getByRole("button", { name: /sign in/i }).click();

		// Should show an error in the alert element
		await expect(page.getByRole("alert")).toContainText(/invalid|error/i, {
			timeout: 10000,
		});
	});

	test("redirects unauthenticated users to sign-in", async ({ page }) => {
		// Clear auth state
		await page.context().clearCookies();

		await page.goto("/browse");

		// Should redirect to sign-in
		await expect(page).toHaveURL(/\/auth\/sign-in/);
	});
});
