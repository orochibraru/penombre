import process from "node:process";
import { expect, test } from "@playwright/test";

/**
 * Exercises the two-factor plugin end to end.
 *
 * The point is the wiring rather than the cryptography: enabling writes to the
 * `two_factor` table through better-auth's Drizzle adapter, which looks its
 * columns up by name. A renamed property compiles fine and only fails here.
 */
const PASSWORD = process.env.E2E_PASSWORD ?? "Admin1234!";

test.describe("Two-factor", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/account/security");
	});

	test("enrols and then turns back off", async ({ page }) => {
		const card = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Two-factor authentication" });
		await expect(card).toBeVisible();

		await card.getByLabel("Password", { exact: true }).fill(PASSWORD);
		await card.getByRole("button", { name: "Turn on" }).click();

		// The secret only exists if the row was written and read back.
		await expect(card.getByText(/enter this secret by hand/i)).toBeVisible({
			timeout: 15_000,
		});
		await expect(card.getByText(/backup codes/i).first()).toBeVisible();

		// Leave the instance as we found it, or every later run starts enrolled.
		await page.reload();
		const after = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Two-factor authentication" });
		await after.getByLabel("Password", { exact: true }).fill(PASSWORD);
		await after.getByRole("button", { name: "Turn off" }).click();
		await expect(after.getByRole("button", { name: "Turn on" })).toBeVisible({
			timeout: 15_000,
		});
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
