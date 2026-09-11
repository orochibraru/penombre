import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, openItemMenu } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * Share links, from creating one to a stranger opening it.
 *
 * The visitor half must be genuinely anonymous. `browser.newContext()`
 * inherits `storageState` from `test.use()`, so without an explicit
 * `storageState: undefined` the "visitor" is the owner — who is allowed past
 * their own password gate, quietly turning these into tests of nothing.
 */
async function makeFolder(page: import("@playwright/test").Page) {
	const name = `e2e-share-${Date.now()}`;
	const created = await page.request.post("/api/v1/storage/folder", {
		data: { name },
	});
	expect(created.ok()).toBeTruthy();
	await goToBrowse(page);
	await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
	return name;
}

/** Open the share dialog for `name` and return the created link. */
async function createLink(
	page: import("@playwright/test").Page,
	name: string,
	password?: string,
) {
	await openItemMenu(page, name);
	await page.getByRole("menuitem", { name: "Share", exact: true }).click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible({ timeout: 10_000 });

	if (password) {
		await dialog.locator("#share-password").fill(password);
	}

	await dialog.getByRole("button", { name: "Create link" }).click();

	const field = dialog.locator("input[readonly]").first();
	await expect(field).toBeVisible({ timeout: 15_000 });
	const url = await field.inputValue();
	expect(url).toContain("/s/");
	return url;
}

test.describe("Sharing", () => {
	// Each case creates a folder, opens a dialog, mints a link and then opens
	// it in a second browser context — more steps than the default budget.
	test.setTimeout(60_000);

	test("a link opens for someone with no session", async ({
		page,
		browser,
	}) => {
		const name = await makeFolder(page);
		const url = await createLink(page, name);

		const visitor = await browser.newContext({ storageState: undefined });
		const visitorPage = await visitor.newPage();
		await visitorPage.goto(url);

		await expect(visitorPage.getByText(name).first()).toBeVisible({
			timeout: 15_000,
		});
		await expect(
			visitorPage.getByRole("link", { name: /download/i }).first(),
		).toBeVisible();
		await visitor.close();
	});

	test("a password-protected link asks before showing anything", async ({
		page,
		browser,
	}) => {
		const name = await makeFolder(page);
		const url = await createLink(page, name, "hunter2hunter2");

		const visitor = await browser.newContext({ storageState: undefined });
		const visitorPage = await visitor.newPage();
		await visitorPage.goto(url);

		// The name must not leak before the password is given.
		await expect(visitorPage.getByText(/password protected/i)).toBeVisible({
			timeout: 15_000,
		});
		await expect(visitorPage.getByText(name)).toBeHidden();

		await visitorPage.locator('input[type="password"]').fill("hunter2hunter2");
		await visitorPage.getByRole("button", { name: "Unlock" }).click();

		await expect(visitorPage.getByText(name).first()).toBeVisible({
			timeout: 15_000,
		});
		await visitor.close();
	});

	test("a wrong password is refused", async ({ page, browser }) => {
		const name = await makeFolder(page);
		const url = await createLink(page, name, "hunter2hunter2");

		const visitor = await browser.newContext({ storageState: undefined });
		const visitorPage = await visitor.newPage();
		await visitorPage.goto(url);
		await visitorPage
			.locator('input[type="password"]')
			.fill("not-the-password");
		await visitorPage.getByRole("button", { name: "Unlock" }).click();

		await expect(visitorPage.getByText(name)).toBeHidden();
		await visitor.close();
	});

	test("an unknown token does not exist", async ({ browser }) => {
		const visitor = await browser.newContext({ storageState: undefined });
		const visitorPage = await visitor.newPage();
		const res = await visitorPage.goto("/s/definitely-not-a-real-token");
		expect(res?.status()).toBe(404);
		await visitor.close();
	});
});
