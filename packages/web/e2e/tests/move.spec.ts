import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	openItemMenu,
	rightClickItem,
	waitForDialog,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

// NOTE: File creation via the API requires S3 storage access, which is currently
// unavailable in the test environment. All move tests use folders instead,
// which are stored entirely in the database with no S3 dependency.

async function selectMoveDestination(
	page: import("@playwright/test").Page,
	destinationName: string,
) {
	const dialog = await waitForDialog(page, /move/i);
	// The folder name appears in a <span> inside a <button> in the async-loaded tree.
	// Click the span text directly so the event bubbles to the parent button's onclick.
	const folderSpan = dialog.getByText(destinationName, { exact: true });
	await expect(folderSpan).toBeVisible({ timeout: 8_000 });
	await folderSpan.click();
	// Wait for "Move here" to become enabled (reactive state update after selectFolder)
	const moveHereBtn = dialog.getByRole("button", { name: "Move here" });
	await expect(moveHereBtn).toBeEnabled({ timeout: 5_000 });
	await moveHereBtn.click();
	await expect(dialog).toBeHidden({ timeout: 8_000 });
}

async function moveToRoot(page: import("@playwright/test").Page) {
	const dialog = await waitForDialog(page, /move/i);
	// Inside a subfolder the default selectedFolder is "" (root), so "Move here" is
	// already enabled. But click "My Drive" explicitly to make the intent clear.
	const myDriveSpan = dialog.getByText("My Drive", { exact: true });
	await expect(myDriveSpan).toBeVisible({ timeout: 8_000 });
	await myDriveSpan.click();
	const moveHereBtn = dialog.getByRole("button", { name: "Move here" });
	await expect(moveHereBtn).toBeEnabled({ timeout: 5_000 });
	await moveHereBtn.click();
	await expect(dialog).toBeHidden({ timeout: 8_000 });
}

test.describe("Move", () => {
	let srcFolderId: string;
	let destFolderId: string;
	let extraFolderId: string;
	let srcFolderName: string;
	let destFolderName: string;
	let extraFolderName: string;

	test.beforeEach(async ({ page }) => {
		// Navigate first so auth cookies are active for page.request calls
		await page.goto("/browse");

		const ts = Date.now();
		srcFolderName = `e2e-move-src-${ts}`;
		destFolderName = `e2e-move-dest-${ts}`;

		const srcResp = await page.request.post("/api/v1/storage/folder", {
			data: { name: srcFolderName },
		});
		expect(srcResp.ok()).toBeTruthy();
		srcFolderId = (await srcResp.json()).data.id;

		const destResp = await page.request.post("/api/v1/storage/folder", {
			data: { name: destFolderName },
		});
		expect(destResp.ok()).toBeTruthy();
		destFolderId = (await destResp.json()).data.id;

		await goToBrowse(page);
	});

	test.afterEach(async ({ page }) => {
		const ids = [srcFolderId, destFolderId, extraFolderId].filter(Boolean);
		for (const id of ids) {
			await page.request.delete(`/api/v1/storage/folder/${id}`).catch(() => {
				/* ignore */
			});
		}
	});

	test("moves a folder into another folder via context menu", async ({
		page,
	}) => {
		await rightClickItem(page, srcFolderName);
		await page.getByRole("menuitem", { name: "Move", exact: true }).click();

		await selectMoveDestination(page, destFolderName);

		await expectItemAbsent(page, srcFolderName);

		// Navigate into the destination folder (UUID path) and verify
		await goToBrowse(page, destFolderId);
		await expectItemVisible(page, srcFolderName);
	});

	test("moves a folder via the ellipsis dropdown menu", async ({ page }) => {
		await openItemMenu(page, srcFolderName);
		await page.getByRole("menuitem", { name: "Move", exact: true }).click();

		await selectMoveDestination(page, destFolderName);

		await expectItemAbsent(page, srcFolderName);

		await goToBrowse(page, destFolderId);
		await expectItemVisible(page, srcFolderName);
	});

	test("moves a nested folder inside another folder", async ({ page }) => {
		// Create an additional folder so we have two distinct source items
		extraFolderName = `e2e-move-extra-${Date.now()}`;
		const extraResp = await page.request.post("/api/v1/storage/folder", {
			data: { name: extraFolderName },
		});
		expect(extraResp.ok()).toBeTruthy();
		extraFolderId = (await extraResp.json()).data.id;

		await goToBrowse(page);

		await rightClickItem(page, extraFolderName);
		await page.getByRole("menuitem", { name: "Move", exact: true }).click();

		await selectMoveDestination(page, destFolderName);

		await expectItemAbsent(page, extraFolderName);

		await goToBrowse(page, destFolderId);
		await expectItemVisible(page, extraFolderName);
	});

	test("moving to My Drive (root) returns the folder to root", async ({
		page,
	}) => {
		// Move the src folder into the destination folder first
		await rightClickItem(page, srcFolderName);
		await page.getByRole("menuitem", { name: "Move", exact: true }).click();
		await selectMoveDestination(page, destFolderName);

		await expectItemAbsent(page, srcFolderName);

		// Navigate into dest, move it back to root
		await goToBrowse(page, destFolderId);
		await expectItemVisible(page, srcFolderName);

		await rightClickItem(page, srcFolderName);
		await page.getByRole("menuitem", { name: "Move", exact: true }).click();
		await moveToRoot(page);

		await expectItemAbsent(page, srcFolderName);

		// Verify it's back at root
		await goToBrowse(page);
		await expectItemVisible(page, srcFolderName);
	});
});
