import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	openNewFolderDialog,
	waitForDialog,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

test.describe("Create Folder", () => {
	test.beforeEach(async ({ page }) => {
		await goToBrowse(page);
	});

	test("creates a folder via the New button", async ({ page }) => {
		const folderName = `e2e-folder-${Date.now()}`;

		await openNewFolderDialog(page);

		const dialog = await waitForDialog(page, "Create a new folder");
		const input = dialog.getByRole("textbox");
		await input.clear();
		await input.fill(folderName);
		await dialog.getByRole("button", { name: "Create" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemVisible(page, folderName);
	});

	test("creates a folder in an empty folder via empty-state button", async ({
		page,
	}) => {
		// Create a fresh parent folder via API so we have an empty folder to enter
		const parentName = `e2e-empty-parent-${Date.now()}`;
		const childName = `e2e-child-${Date.now()}`;

		const resp = await page.request.post("/api/v1/storage/folder", {
			data: { name: parentName },
		});
		expect(resp.ok()).toBeTruthy();
		const { data } = await resp.json();
		const parentId: string = data.id;

		try {
			// Navigate into the empty parent folder using its UUID path
			await goToBrowse(page, parentId);

			// Click the "New Folder" empty-state button
			await page.getByRole("button", { name: "New Folder" }).first().click();

			const dialog = await waitForDialog(page, "Create a new folder");
			const input = dialog.getByRole("textbox");
			await input.clear();
			await input.fill(childName);
			await dialog.getByRole("button", { name: "Create" }).click();
			await expect(dialog).toBeHidden({ timeout: 5_000 });

			await expectItemVisible(page, childName);
		} finally {
			// Clean up parent (and its contents) via API
			await page.request.delete(`/api/v1/storage/folder/${parentId}`, {
				data: {},
			});
		}
	});

	test("creates a nested folder inside an existing folder", async ({
		page,
	}) => {
		// Create a parent folder via API to navigate into
		const parentName = `e2e-nested-parent-${Date.now()}`;
		const childName = `e2e-nested-child-${Date.now()}`;

		const resp = await page.request.post("/api/v1/storage/folder", {
			data: { name: parentName },
		});
		expect(resp.ok()).toBeTruthy();
		const { data } = await resp.json();
		const parentId: string = data.id;

		try {
			await goToBrowse(page, parentId);
			await openNewFolderDialog(page);

			const dialog = await waitForDialog(page, "Create a new folder");
			const input = dialog.getByRole("textbox");
			await input.clear();
			await input.fill(childName);
			await dialog.getByRole("button", { name: "Create" }).click();
			await expect(dialog).toBeHidden({ timeout: 5_000 });

			await expectItemVisible(page, childName);
		} finally {
			await page.request.delete(`/api/v1/storage/folder/${parentId}`, {
				data: {},
			});
		}
	});

	test("cancelling the dialog does not create a folder", async ({ page }) => {
		await openNewFolderDialog(page);

		const dialog = await waitForDialog(page, "Create a new folder");
		const folderName = `e2e-cancelled-${Date.now()}`;
		await dialog.getByRole("textbox").fill(folderName);
		await dialog.getByRole("button", { name: "Cancel" }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemAbsent(page, folderName);
	});

	test("does not create a folder with an empty name", async ({ page }) => {
		await openNewFolderDialog(page);

		const dialog = await waitForDialog(page, "Create a new folder");
		const input = dialog.getByRole("textbox");
		await input.clear();

		// The Create button should be disabled when the name is empty
		const createBtn = dialog.getByRole("button", { name: "Create" });
		const isDisabled = await createBtn.isDisabled();
		if (isDisabled) {
			await expect(createBtn).toBeDisabled();
		} else {
			await createBtn.click();
			// Dialog should still be visible (validation error shown)
			await expect(dialog).toBeVisible();
		}
	});
});
