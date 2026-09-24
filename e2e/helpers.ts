import { expect, type Locator, type Page, test } from "@playwright/test";

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
		await openContextMenu(page, target);
		// waitFor, not isVisible: the latter resolves immediately, so a menu
		// still animating in reads as absent and the click is retried in vain.
		const appeared = await menu
			.waitFor({ state: "visible", timeout: 1000 })
			.then(() => true)
			.catch(() => false);
		if (appeared) {
			return;
		}
	}
	// Final assertion — surfaces a clear error if all retries failed
	await expect(menu).toBeVisible({ timeout: 3000 });
}

/**
 * The event, not a right-click. Linux Chromium opens the menu on mousedown,
 * and a row low on the screen opens it shifted up under the pointer: the
 * button's release then selected the entry there, so Notes also opened Share.
 */
async function openContextMenu(page: Page, target: Locator) {
	await target.waitFor({ state: "visible" });
	const box = await target.boundingBox();
	if (!box) {
		throw new Error("context menu target has no box");
	}
	await page.evaluate(
		({ x, y }) => {
			document.elementFromPoint(x, y)?.dispatchEvent(
				new MouseEvent("contextmenu", {
					bubbles: true,
					cancelable: true,
					button: 2,
					clientX: x,
					clientY: y,
				}),
			);
		},
		{ x: box.x + box.width / 2, y: box.y + box.height / 2 },
	);
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
