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
	// Listen for console messages
	page.on("console", (msg) => console.log(`Browser console: ${msg.text()}`));

	// Listen for page errors
	page.on("pageerror", (err) => console.error(`Browser error: ${err}`));

	await page.goto("/auth/sign-in");

	// Wait for the sign-in page to load
	await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

	// Fill in credentials
	await page.getByLabel(/email/i).fill(testEmail);
	await page.getByLabel(/password/i).fill(testPassword);

	// Submit the form and wait for navigation
	const [response] = await Promise.all([
		page.waitForResponse((resp) => resp.url().includes("/api/auth"), {
			timeout: 10000,
		}),
		page.getByRole("button", { name: /sign in/i }).click(),
	]);

	console.log(`Auth API response status: ${response.status()}`);

	if (!response.ok()) {
		const body = await response.text();
		console.error(`Auth failed with body: ${body}`);
	}

	// Wait for navigation to complete - either to browse or root (which redirects to browse)
	await page.waitForURL(
		(url) => url.pathname === "/" || url.pathname === "/browse",
		{
			timeout: 15000,
		},
	);

	// If we're at root, wait for the redirect to browse
	if (page.url().endsWith("/")) {
		await page.waitForURL(/\/browse/, { timeout: 5000 });
	}

	// Verify we're logged in by checking for a user-specific element
	await expect(page.locator("body")).not.toContainText("Sign In");

	// Save auth state for reuse
	await page.context().storageState({ path: authFile });
});
