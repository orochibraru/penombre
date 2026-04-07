import path from "node:path";
import { test as setup } from "@playwright/test";

export const AUTH_STORAGE_STATE = path.resolve("e2e/.auth/user.json");

/**
 * Signs in once and saves browser storage state so all other tests
 * can reuse the session without re-authenticating.
 *
 * Requires these environment variables (or defaults for local dev):
 *   E2E_EMAIL    — test user email    (default: test@example.com)
 *   E2E_PASSWORD — test user password (default: password)
 */
setup("authenticate", async ({ page }) => {
	const email = process.env.E2E_EMAIL ?? "admin@example.com";
	const password = process.env.E2E_PASSWORD ?? "Admin1234!";

	await page.goto("/auth/sign-in");

	await page.locator("#email").fill(email);
	await page.locator("#password").fill(password);
	// Use exact match to avoid also matching "Sign in with a passkey"
	await page.getByRole("button", { name: "Sign in", exact: true }).click();

	// Wait until redirected to the main app
	await page.waitForURL("**/browse**", { timeout: 15_000 });

	await page.context().storageState({ path: AUTH_STORAGE_STATE });
});
