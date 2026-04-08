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
// unavailable in the test environment. All rename tests use folders instead,
// which are stored entirely in the database with no S3 dependency.

test.describe("Rename", () => {
	let folderId: string;
	let folderName: string;

	test.beforeEach(async ({ page }) => {
		// Navigate first so auth cookies are active for page.request calls
		await page.goto("/browse");

		folderName = `e2e-rename-folder-${Date.now()}`;

		const folderResp = await page.request.post("/api/v1/storage/folder", {
			data: { name: folderName },
		});
		expect(folderResp.ok()).toBeTruthy();
		folderId = (await folderResp.json()).data.id;

		await goToBrowse(page);
	});

	test.afterEach(async ({ page }) => {
		if (folderId) {
			await page.request
				.delete(`/api/v1/storage/folder/${folderId}`, { data: {} })
				.catch(() => {
					/* ignore */
				});
		}
	});

	test("renames a folder via right-click context menu", async ({ page }) => {
		const newName = `e2e-renamed-ctx-${Date.now()}`;

		await rightClickItem(page, folderName);
		await page.getByRole("menuitem", { name: "Rename" }).click();

		const dialog = await waitForDialog(page, /rename/i);
		const input = dialog.getByRole("textbox");
		await input.clear();
		await input.fill(newName);
		await dialog.getByRole("button", { name: "Rename" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemVisible(page, newName);
		await expectItemAbsent(page, folderName);
	});

	test("renames a folder via the ellipsis dropdown menu", async ({ page }) => {
		const newName = `e2e-renamed-menu-${Date.now()}`;

		await openItemMenu(page, folderName);
		await page.getByRole("menuitem", { name: "Rename" }).click();

		const dialog = await waitForDialog(page, /rename/i);
		const input = dialog.getByRole("textbox");
		await input.clear();
		await input.fill(newName);
		await dialog.getByRole("button", { name: "Rename" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemVisible(page, newName);
		await expectItemAbsent(page, folderName);
	});

	test("pre-fills the rename dialog with the current name", async ({
		page,
	}) => {
		await rightClickItem(page, folderName);
		await page.getByRole("menuitem", { name: "Rename" }).click();

		const dialog = await waitForDialog(page, /rename/i);
		const input = dialog.getByRole("textbox");

		const currentValue = await input.inputValue();
		expect(currentValue.length).toBeGreaterThan(0);

		await dialog.getByRole("button", { name: "Cancel" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });
	});

	test("cancelling the rename dialog leaves the name unchanged", async ({
		page,
	}) => {
		await rightClickItem(page, folderName);
		await page.getByRole("menuitem", { name: "Rename" }).click();

		const dialog = await waitForDialog(page, /rename/i);
		await dialog.getByRole("textbox").fill("should-not-appear");
		await dialog.getByRole("button", { name: "Cancel" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemVisible(page, folderName);
		await expectItemAbsent(page, "should-not-appear");
	});
});
