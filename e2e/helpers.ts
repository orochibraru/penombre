import { expect, type Page, test } from "@playwright/test";

const AUTH_STORAGE_STATE = "e2e/.auth/user.json";

export { AUTH_STORAGE_STATE };

/** A browser sends it and `request` does not; a bodiless mutation needs it. */
export function sameOrigin(): { origin: string } {
	return { origin: test.info().project.use.baseURL ?? "" };
}

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

	// Retry the right-click until the context menu is visible (up to 3 attempts).
	// A single right-click can silently fail if the element isn't fully stable.
	const menu = page.locator('[role="menu"]');
	for (let i = 0; i < 3; i++) {
		await target.click({ button: "right" });
		// waitFor, not isVisible: the latter resolves immediately, so a menu
		// still animating in reads as absent and the click is retried in vain.
		const appeared = await menu
			.waitFor({ state: "visible", timeout: 1000 })
			.then(() => true)
			.catch(() => false);
		if (appeared) {
			await clearPointer(page);
			return;
		}
	}
	// Final assertion — surfaces a clear error if all retries failed
	await expect(menu).toBeVisible({ timeout: 3000 });
	await clearPointer(page);
}

/**
 * A row low on the screen opens its menu shifted up, under the pointer the
 * right-click left there. The entry beneath it is highlighted, and a
 * dispatched click on another entry then ran both: Notes opened Share too.
 */
async function clearPointer(page: Page) {
	await page.mouse.move(0, 0);
}

/**
 * Pick an entry from the open context menu, re-opening it if it goes.
 *
 * A listing that refreshes — an upload settling, a thumbnail arriving — tears
 * the menu down mid-click, and Playwright then waits for an element that no
 * longer exists. Under load in CI that is a guaranteed 30s timeout rather than
 * a rare one, so the menu is reopened on the item rather than trusted to stay.
 *
 * `confirm` is what the entry was supposed to do — a navigation, a dialog.
 * Pass it whenever there is one. A forced click reports success as soon as it
 * is dispatched, but a menu being torn down at that instant never runs its
 * handler, so "the click worked" and "the thing happened" are different
 * questions, and only the second one is worth retrying on.
 */
export async function chooseMenuItem(
	page: Page,
	itemName: string,
	entry: RegExp | string,
	confirm?: () => Promise<unknown>,
) {
	const menuItem = page.getByRole("menuitem", { name: entry });
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await expect(menuItem.first()).toBeVisible({ timeout: 5000 });
			// Not a click: a menu still animating in never passes the stability
			// check, and a forced click lands by coordinates on whichever entry
			// has slid under them — Duplicate, in the run that caught it.
			await menuItem.first().dispatchEvent("click", {}, { timeout: 5000 });
			await confirm?.();
			return;
		} catch (error) {
			if (attempt === 2) {
				throw error;
			}
			// Never assume a vanished menu means the entry fired: it also
			// closes on a stray pointer move, and the caller would then assert
			// against something that never happened.
			await page.keyboard.press("Escape");
			await rightClickItem(page, itemName);
		}
	}
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
	await expect(dialog).toBeVisible({ timeout: 5000 });
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
	await expect(dialog).toBeHidden({ timeout: 5000 });
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
