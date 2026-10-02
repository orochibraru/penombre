import process from "node:process";
import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../helpers";

/**
 * Exercises the two-factor plugin end to end.
 *
 * The point is the wiring rather than the cryptography: enabling writes to the
 * `two_factor` table through better-auth's Drizzle adapter, which looks its
 * columns up by name. A renamed property compiles fine and only fails here.
 */
test.use({ storageState: AUTH_STORAGE_STATE });

const PASSWORD = process.env.E2E_PASSWORD ?? "Admin1234!";

test.describe("Two-factor", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/account/security");
	});

	test("issues a secret and backup codes", async ({ page }) => {
		const card = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Two-factor authentication" });
		await expect(card).toBeVisible();

		await card.getByLabel("Password", { exact: true }).fill(PASSWORD);
		await card.getByRole("button", { name: "Turn on" }).click();

		// Both only exist if the row was written and read back through the
		// adapter, which is the part that breaks when a column is renamed.
		await expect(card.getByText(/enter this secret by hand/i)).toBeVisible({
			timeout: 15_000,
		});
		await expect(card.getByText(/backup codes/i).first()).toBeVisible();

		// The account is deliberately *not* enrolled yet: better-auth only
		// sets `twoFactorEnabled` once a generated code has been verified, so
		// this leaves nothing behind for later tests to trip over — and a
		// secret nobody proved they can read never locks the account.
		await page.reload();
		await expect(
			page
				.locator('[data-slot="card"]')
				.filter({ hasText: "Two-factor authentication" })
				.getByRole("button", { name: "Turn on" }),
		).toBeVisible({ timeout: 15_000 });
	});

	test("rejects a wrong password", async ({ page }) => {
		const card = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Two-factor authentication" });
		await card.getByLabel("Password", { exact: true }).fill("not-the-password");
		await card.getByRole("button", { name: "Turn on" }).click();

		await expect(card.getByText(/enter this secret by hand/i)).toBeHidden();
	});
});
