import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("File Management", () => {
	const testFolderName = `e2e-test-folder-${Date.now()}`;

	test("browse page shows file listing area", async ({ page }) => {
		await page.goto("/browse");

		// The file table should be visible (even if empty)
		await expect(page.getByRole("table")).toBeVisible();
	});

	test("can open create folder option via New button", async ({ page }) => {
		await page.goto("/browse");

		// Click New button to open dropdown menu
		await page.getByRole("button", { name: "New" }).click();

		// Look for "Folder" in dropdown menu
		const folderOption = page.getByRole("menuitem", { name: /folder/i });
		await expect(folderOption).toBeVisible();
	});

	test("can create a new folder", async ({ page }) => {
		await page.goto("/browse");

		// Use New button to open menu
		await page.getByRole("button", { name: "New" }).click();

		// Click "Folder" in menu
		await page.getByRole("menuitem", { name: /folder/i }).click();

		// Dialog should open
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Fill in folder name
		const input = dialog.getByRole("textbox");
		await input.fill(testFolderName);

		// Submit
		await dialog.getByRole("button", { name: /create/i }).click();

		// Wait for dialog to close
		await expect(dialog).not.toBeVisible({ timeout: 5000 });

		// Folder should appear in the list - use table cell to be more specific
		await expect(page.getByRole("cell", { name: testFolderName })).toBeVisible({
			timeout: 5000,
		});
	});

	test("can navigate into a folder", async ({ page }) => {
		// First create a folder
		await page.goto("/browse");

		// Use New button to open menu
		await page.getByRole("button", { name: "New" }).click();
		await page.getByRole("menuitem", { name: /folder/i }).click();

		const navFolderName = `nav-test-${Date.now()}`;
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("textbox").fill(navFolderName);
		await dialog.getByRole("button", { name: /create/i }).click();
		await expect(dialog).not.toBeVisible({ timeout: 5000 });

		// Wait for folder to appear in the list first
		const folderCell = page.getByRole("cell", { name: navFolderName });
		await expect(folderCell).toBeVisible({ timeout: 5000 });

		// Double-click to navigate into folder
		await folderCell.dblclick();

		// URL should update to /browse/<uuid> format
		await expect(page).toHaveURL(/\/browse\/.+/, {
			timeout: 5000,
		});

		// Breadcrumb should show the folder name
		await expect(
			page.getByRole("navigation", { name: "breadcrumb" }),
		).toContainText(navFolderName);
	});

	test("can open upload option via New button", async ({ page }) => {
		await page.goto("/browse");

		// Click New button to open dropdown menu
		await page.getByRole("button", { name: "New" }).click();

		// Look for "File" or "Upload" in the menu
		const uploadOption = page.getByRole("menuitem", { name: /file/i });
		await expect(uploadOption).toBeVisible();
	});

	test("upload dialog shows file input", async ({ page }) => {
		await page.goto("/browse");

		// Use New button to open menu and click upload
		await page.getByRole("button", { name: "New" }).click();
		await page.getByRole("menuitem", { name: /file/i }).click();

		// Dialog should open with file input
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
	});

	test("can upload a file", async ({ page }) => {
		await page.goto("/browse");

		// Create a temp file to upload
		const tempDir = os.tmpdir();
		const testFileName = `e2e-test-file-${Date.now()}.txt`;
		const testFilePath = path.join(tempDir, testFileName);
		fs.writeFileSync(testFilePath, "This is a test file for e2e testing.");

		try {
			// Open upload dialog via New button
			await page.getByRole("button", { name: "New" }).click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			// Find file input within the dialog using the label - pick the main file dropzone
			const fileInput = dialog.getByLabel(/drag.*drop/i);
			await fileInput.setInputFiles(testFilePath);

			// Click upload button
			await dialog.getByRole("button", { name: /upload/i }).click();

			// Wait for upload to complete and dialog to close
			await expect(dialog).not.toBeVisible({ timeout: 15000 });

			// File should appear in listing - use cell to be specific
			await expect(page.getByRole("cell", { name: testFileName })).toBeVisible({
				timeout: 10000,
			});
		} finally {
			// Cleanup temp file
			if (fs.existsSync(testFilePath)) {
				fs.unlinkSync(testFilePath);
			}
		}
	});
});

test.describe("File Actions", () => {
	test("can right-click a file to see actions", async ({ page }) => {
		await page.goto("/browse");

		// First upload a file to have something to interact with
		const tempDir = os.tmpdir();
		const testFileName = `action-test-${Date.now()}.txt`;
		const testFilePath = path.join(tempDir, testFileName);
		fs.writeFileSync(testFilePath, "Test file for actions.");

		try {
			// Open upload dialog via New button
			await page.getByRole("button", { name: "New" }).click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			// Find file input within the dialog using the label - pick the main file dropzone
			const fileInput = dialog.getByLabel(/drag.*drop/i);
			await fileInput.setInputFiles(testFilePath);
			await dialog.getByRole("button", { name: /upload/i }).click();
			await expect(dialog).not.toBeVisible({ timeout: 15000 });

			// Wait for file to appear - use cell to be specific
			const fileCell = page.getByRole("cell", { name: testFileName });
			await expect(fileCell).toBeVisible({ timeout: 10000 });

			// Right-click on the file cell
			await fileCell.click({ button: "right" });

			// Context menu should show file actions
			await expect(
				page.getByRole("menuitem", { name: /download|rename|move/i }).first(),
			).toBeVisible();
		} finally {
			if (fs.existsSync(testFilePath)) {
				fs.unlinkSync(testFilePath);
			}
		}
	});
});
