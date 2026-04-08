import { expect, type Page } from "@playwright/test";

const AUTH_STORAGE_STATE = "e2e/.auth/user.json";

export { AUTH_STORAGE_STATE };

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

export async function goToBrowse(page: Page, subPath = "") {
	const url = subPath ? `/browse/${subPath}` : "/browse";
	await page.goto(url);
	await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// Context menu helpers
// ---------------------------------------------------------------------------

/** Right-click an item row/card by its visible name. */
export async function rightClickItem(page: Page, name: string) {
	const item = page
		.getByRole("row")
		.filter({ hasText: name })
		.or(page.locator("[data-item]").filter({ hasText: name }));
	const target = item.first();
	await target.scrollIntoViewIfNeeded();
	await page.waitForTimeout(100); // let scroll animation settle

	// Retry the right-click until the context menu is visible (up to 3 attempts).
	// A single right-click can silently fail if the element isn't fully stable.
	const menu = page.locator('[role="menu"]');
	for (let i = 0; i < 3; i++) {
		await target.click({ button: "right" });
		const appeared = await menu
			.isVisible({ timeout: 1_000 })
			.catch(() => false);
		if (appeared) return;
	}
	// Final assertion — surfaces a clear error if all retries failed
	await expect(menu).toBeVisible({ timeout: 3_000 });
}

/** Open the ellipsis dropdown menu on an item by its visible name. */
export async function openItemMenu(page: Page, name: string) {
	const row = page
		.getByRole("row")
		.filter({ hasText: name })
		.or(page.locator("[data-item]").filter({ hasText: name }))
		.first();
	await row.hover();
	await row.getByRole("button", { name: "Open menu" }).click();
}

// ---------------------------------------------------------------------------
// Dialog helpers
// ---------------------------------------------------------------------------

/** Wait for a dialog containing `headingText` and return it. */
export async function waitForDialog(page: Page, headingText: RegExp | string) {
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible({ timeout: 5_000 });
	if (headingText) {
		await expect(dialog.getByRole("heading")).toContainText(headingText);
	}
	return dialog;
}

/** Fill the rename dialog input and confirm. */
export async function submitRenameDialog(page: Page, newName: string) {
	const dialog = await waitForDialog(page, /rename/i);
	const input = dialog.getByRole("textbox");
	await input.clear();
	await input.fill(newName);
	await dialog.getByRole("button", { name: "Rename" }).click();
	await expect(dialog).toBeHidden({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

/** Trigger the upload dialog via the "New" sidebar button → "File Upload". */
export async function openUploadDialog(page: Page) {
	await page.getByRole("button", { name: "New", exact: true }).click();
	await page.getByRole("menuitem", { name: "File Upload" }).click();
}

/** Open the new-folder dialog via the "New" sidebar button → "Folder". */
export async function openNewFolderDialog(page: Page) {
	await page.getByRole("button", { name: "New", exact: true }).click();
	await page.getByRole("menuitem", { name: "Folder" }).click();
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert an item with the given name is visible in the current view. */
export async function expectItemVisible(page: Page, name: string) {
	await expect(
		page
			.getByRole("row")
			.filter({ hasText: name })
			.or(page.locator("[data-item]").filter({ hasText: name }))
			.first(),
	).toBeVisible({ timeout: 10_000 });
}

/** Assert an item is NOT visible in the current view. */
export async function expectItemAbsent(page: Page, name: string) {
	// Rows must have no text match; wait for list to settle first
	await page.waitForLoadState("networkidle");
	const row = page.getByRole("row").filter({ hasText: name });
	const card = page.locator("[data-item]").filter({ hasText: name });
	await expect(row.or(card).first()).toBeHidden({ timeout: 10_000 });
}
