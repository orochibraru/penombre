import { expect, test as setup } from "@playwright/test";
import { defaultConfigValues } from "$lib/server/config.defaults";

const authFile = "e2e/.auth/user.json";

// Get test credentials from env or use defaults
const testEmail =
	process.env.E2E_TEST_EMAIL ||
	defaultConfigValues.auth.defaultAdminCredentials.email;
const testPassword =
	process.env.E2E_TEST_PASSWORD ||
	defaultConfigValues.auth.defaultAdminCredentials.password;

/**
 * Auth setup - logs in a test user and saves the auth state.
 *
 * This runs before all other tests in the 'chromium' project.
 * The test user must exist in the database with these credentials.
 *
 * To create a test user, run the app and use the admin panel,
 * or insert directly into the database.
 */
setup("authenticate", async ({ page }) => {
	await page.goto("/auth/sign-in");

	// Wait for the sign-in page to load
	await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

	// Fill in credentials
	await page.getByLabel(/email/i).fill(testEmail);
	await page.getByLabel(/password/i).fill(testPassword);

	// Submit the form
	await page.getByRole("button", { name: /sign in/i }).click();

	// Wait for redirect to the main app (browse page)
	await expect(page).toHaveURL(/\/browse/, { timeout: 15000 });

	// Verify we're logged in by checking for a user-specific element
	await expect(page.locator("body")).not.toContainText("Sign In");

	// Save auth state for reuse
	await page.context().storageState({ path: authFile });
});
