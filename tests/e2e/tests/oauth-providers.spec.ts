import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * Providers can come from the environment or from here. Saving one reloads
 * the auth layer (`refreshAuth`), so this also checks the instance offers it
 * straight away rather than after a restart.
 */
test.describe("OAuth providers", () => {
	test("an admin adds a provider and removes it again", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		await page.goto("/admin/settings");
		// The card is a form, so it only works once the page has hydrated.
		await page.waitForLoadState("networkidle");
		await page.getByRole("button", { name: "Add a provider" }).click();
		// Fields are addressed by id: the delete form carries a hidden
		// `providerName` of its own, so the name alone is ambiguous.
		await expect(page.locator("#new-name")).toBeVisible({ timeout: 10_000 });

		await page.locator("#new-name").fill("e2e-oidc");
		await page.locator("#new-pretty").fill("E2E Provider");
		await page
			.locator("#new-discovery")
			.fill("https://id.example.com/.well-known/openid-configuration");
		await page.locator("#new-client").fill("client-id");
		await page.locator("#new-secret").fill("client-secret");
		await page.getByRole("button", { name: "Save changes" }).last().click();

		const row = page.locator('[data-provider="e2e-oidc"]');
		await expect(row).toBeVisible({ timeout: 10_000 });
		await expect(row).toContainText("E2E Provider");

		// No restart: the instance registered it on save.
		await expect(async () => {
			const listed = await page.request.get("/api/v1/auth/providers");
			expect(listed.ok()).toBe(true);
			expect(await listed.text()).toContain("e2e-oidc");
		}).toPass({ timeout: 10_000 });

		// The secret is never sent back to the page, so editing starts blank.
		await row.getByRole("button", { name: "Edit" }).click();
		await expect(row.locator("#e2e-oidc-secret")).toHaveValue("");
		await expect(row.locator("#e2e-oidc-name")).toHaveValue("e2e-oidc");

		await row.getByRole("button", { name: "Remove" }).click();
		await expect(page.locator('[data-provider="e2e-oidc"]')).toHaveCount(0, {
			timeout: 10_000,
		});

		await expect(async () => {
			const listed = await page.request.get("/api/v1/auth/providers");
			expect(await listed.text()).not.toContain("e2e-oidc");
		}).toPass({ timeout: 10_000 });

		expect(errors).toEqual([]);
	});
});
