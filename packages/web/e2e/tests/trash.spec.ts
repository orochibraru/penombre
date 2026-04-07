import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	openItemMenu,
	rightClickItem,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

// NOTE: File creation via the API requires S3 storage access, which is currently
// unavailable in the test environment. All trash tests use folders instead,
// which are stored entirely in the database with no S3 dependency.
// Folder trash: POST /api/v1/storage/folder/{id}/trash
// Folder restore: POST /api/v1/storage/folder/{id}/restore
// Folder delete: DELETE /api/v1/storage/folder/{id}

async function goToTrash(page: import("@playwright/test").Page) {
	await page.goto("/trash");
	await page.waitForLoadState("networkidle");
}

/** Create a folder via API and return its id. */
async function createFolder(
	page: import("@playwright/test").Page,
	name: string,
): Promise<string> {
	const resp = await page.request.post("/api/v1/storage/folder", {
		data: { name },
	});
	expect(resp.ok()).toBeTruthy();
	const json = await resp.json();
	return json.data.id as string;
}

/** Trash a folder via API. */
async function trashFolder(page: import("@playwright/test").Page, id: string) {
	const resp = await page.request.post(`/api/v1/storage/folder/${id}/trash`, {
		data: {},
	});
	expect(resp.ok()).toBeTruthy();
}

/** Force-delete a folder via API (works regardless of trash state). */
async function forceDeleteFolder(
	page: import("@playwright/test").Page,
	id: string,
) {
	await page.request.delete(`/api/v1/storage/folder/${id}`).catch(() => {
		/* ignore */
	});
}

/**
 * If the app shows a "Are you absolutely sure?" confirmation dialog, click
 * "Continue" to proceed. Some destructive/restorative actions require this.
 */
async function confirmContinueIfVisible(page: import("@playwright/test").Page) {
	// Use .first() to avoid strict-mode issues if multiple dialogs match at once
	const confirmDialog = page
		.locator('[role="dialog"],[role="alertdialog"]')
		.filter({ hasText: /absolutely sure/i })
		.first();
	if (await confirmDialog.isVisible({ timeout: 4_000 }).catch(() => false)) {
		await confirmDialog.getByRole("button", { name: "Continue" }).click();
		await expect(confirmDialog).toBeHidden({ timeout: 5_000 });
	}
}

test.describe("Trash", () => {
	// Navigate to root before each test so auth cookies are active for page.request calls
	test.beforeEach(async ({ page }) => {
		await page.goto("/browse");
	});

	test.describe("Move to trash", () => {
		test("moves a folder to trash via context menu", async ({ page }) => {
			const folderName = `e2e-trash-ctx-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			try {
				await goToBrowse(page);
				await expectItemVisible(page, folderName);

				await rightClickItem(page, folderName);
				await page.getByRole("menuitem", { name: "Move to trash" }).click();

				await expectItemAbsent(page, folderName);

				// Verify it appears in /trash
				await goToTrash(page);
				await expectItemVisible(page, folderName);
				// No need to restore — forceDeleteFolder in finally handles trashed folders
			} finally {
				await forceDeleteFolder(page, folderId);
			}
		});

		test("moves a folder to trash via the ellipsis dropdown menu", async ({
			page,
		}) => {
			const folderName = `e2e-trash-menu-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			try {
				await goToBrowse(page);
				await openItemMenu(page, folderName);
				await page.getByRole("menuitem", { name: "Move to trash" }).click();

				await expectItemAbsent(page, folderName);

				await goToTrash(page);
				await expectItemVisible(page, folderName);
				// No need to restore — forceDeleteFolder in finally handles trashed folders
			} finally {
				await forceDeleteFolder(page, folderId);
			}
		});
	});

	test.describe("Restore from trash", () => {
		test.beforeEach(async ({ page }) => {
			// Dismiss any confirmation dialog left over from a previous test
			await confirmContinueIfVisible(page).catch(() => {});
		});

		test("restores a folder from trash via context menu", async ({ page }) => {
			const folderName = `e2e-restore-ctx-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			try {
				// Trash via API
				await trashFolder(page, folderId);

				await goToTrash(page);
				await expectItemVisible(page, folderName);

				await rightClickItem(page, folderName);
				await page.getByRole("menuitem", { name: "Restore" }).click();
				await confirmContinueIfVisible(page);

				await expectItemAbsent(page, folderName);

				// Verify it's back in drive root
				await goToBrowse(page);
				await expectItemVisible(page, folderName);
			} finally {
				await forceDeleteFolder(page, folderId);
			}
		});

		test("restores a folder from trash via the ellipsis dropdown menu", async ({
			page,
		}) => {
			const folderName = `e2e-restore-menu-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			try {
				await trashFolder(page, folderId);

				await goToTrash(page);
				await expectItemVisible(page, folderName);

				await openItemMenu(page, folderName);
				await page.getByRole("menuitem", { name: "Restore" }).click();
				await confirmContinueIfVisible(page);

				await expectItemAbsent(page, folderName);

				await goToBrowse(page);
				await expectItemVisible(page, folderName);
			} finally {
				await forceDeleteFolder(page, folderId);
			}
		});
	});

	test.describe("Permanent deletion", () => {
		test.beforeEach(async ({ page }) => {
			// Dismiss any confirmation dialog left over from a previous test
			await confirmContinueIfVisible(page).catch(() => {});
		});

		test("permanently deletes a trashed folder", async ({ page }) => {
			const folderName = `e2e-perm-delete-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			// Trash via API before attempting permanent delete
			await trashFolder(page, folderId);

			await goToTrash(page);
			await expectItemVisible(page, folderName);

			// Permanently delete via context menu
			await rightClickItem(page, folderName);
			await page.getByRole("menuitem", { name: "Delete permanently" }).click();

			// Confirm in the "Are you absolutely sure?" dialog
			await confirmContinueIfVisible(page);

			await expectItemAbsent(page, folderName);

			// Verify it did not come back to the drive root
			await goToBrowse(page);
			await expectItemAbsent(page, folderName);
		});

		test("does not permanently delete when cancelling the confirmation", async ({
			page,
		}) => {
			const folderName = `e2e-cancel-perm-delete-${Date.now()}`;
			const folderId = await createFolder(page, folderName);

			try {
				await trashFolder(page, folderId);

				await goToTrash(page);
				await expectItemVisible(page, folderName);

				await rightClickItem(page, folderName);
				await page
					.getByRole("menuitem", { name: "Delete permanently" })
					.click();

				// The "Are you absolutely sure?" dialog should appear — cancel it
				const confirmDialog = page
					.locator('[role="dialog"],[role="alertdialog"]')
					.filter({ hasText: /absolutely sure/i })
					.first();
				await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
				await confirmDialog.getByRole("button", { name: "Cancel" }).click();
				await expect(confirmDialog).toBeHidden({ timeout: 5_000 });

				// Item should still be visible in trash
				await expectItemVisible(page, folderName);
			} finally {
				await forceDeleteFolder(page, folderId);
			}
		});
	});
});
