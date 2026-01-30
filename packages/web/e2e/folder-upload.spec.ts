import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Folder Upload", () => {
	test("can upload a folder with nested files", async ({ page }) => {
		await page.goto("/browse");

		// Create a temp folder structure to upload
		const tempDir = os.tmpdir();
		const testFolderName = `e2e-test-folder-${Date.now()}`;
		const testFolderPath = path.join(tempDir, testFolderName);

		// Create folder structure:
		// testFolder/
		//   ├── file1.txt
		//   ├── subfolder/
		//   │   ├── file2.txt
		//   │   └── nested/
		//   │       └── file3.txt
		//   └── file4.txt
		fs.mkdirSync(testFolderPath);
		fs.writeFileSync(
			path.join(testFolderPath, "file1.txt"),
			"Content of file 1",
		);
		fs.writeFileSync(
			path.join(testFolderPath, "file4.txt"),
			"Content of file 4",
		);

		const subfolderPath = path.join(testFolderPath, "subfolder");
		fs.mkdirSync(subfolderPath);
		fs.writeFileSync(
			path.join(subfolderPath, "file2.txt"),
			"Content of file 2",
		);

		const nestedPath = path.join(subfolderPath, "nested");
		fs.mkdirSync(nestedPath);
		fs.writeFileSync(path.join(nestedPath, "file3.txt"), "Content of file 3");

		try {
			// Open upload dialog via New button in sidebar
			await page
				.getByRole("button", { name: "New", exact: true })
				.first()
				.click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			// Find file input for folder upload within the dialog
			// Target the folder input specifically (has webkitdirectory attribute)
			const folderInput = dialog.locator('input[type="file"][webkitdirectory]');

			// Set the directory path for folder upload
			await folderInput.setInputFiles(testFolderPath);

			// Click upload button
			await dialog.getByRole("button", { name: /upload/i }).click();

			// Wait for dialog to close (upload happens in background)
			await expect(dialog).not.toBeVisible({ timeout: 5000 });

			// Wait a bit for uploads to process
			await page.waitForTimeout(10000);

			// Verify subfolder was created
			await expect(
				page.getByRole("cell", { name: "subfolder", exact: true }),
			).toBeVisible({});

			// Navigate into subfolder
			await page
				.getByRole("cell", { name: "subfolder", exact: true })
				.dblclick();

			// Verify file2.txt is in subfolder
			await expect(
				page.getByRole("cell", { name: /^file2\.txt\s/ }),
			).toBeVisible({
				timeout: 10000,
			});

			// Verify nested folder exists
			await expect(
				page.getByRole("cell", { name: "nested", exact: true }),
			).toBeVisible({
				timeout: 10000,
			});

			// Navigate into nested folder
			await page.getByRole("cell", { name: "nested", exact: true }).dblclick();
			// Verify file3.txt is in nested folder
			await expect(page.getByRole("cell", { name: /file3\.txt/ })).toBeVisible({
				timeout: 10000,
			});
		} finally {
			// Cleanup temp files
			if (fs.existsSync(testFolderPath)) {
				fs.rmSync(testFolderPath, { recursive: true, force: true });
			}
		}
	});

	test("can upload a simple folder with files at root level", async ({
		page,
	}) => {
		await page.goto("/browse");

		const tempDir = os.tmpdir();
		const testFolderName = `simple-folder-${Date.now()}`;
		const testFolderPath = path.join(tempDir, testFolderName);

		// Create a simple folder with two files
		fs.mkdirSync(testFolderPath);
		fs.writeFileSync(
			path.join(testFolderPath, "simple-file1.txt"),
			"Simple content 1",
		);
		fs.writeFileSync(
			path.join(testFolderPath, "simple-file2.txt"),
			"Simple content 2",
		);

		try {
			// Open upload dialog via New button in sidebar
			await page
				.getByRole("button", { name: "New", exact: true })
				.first()
				.click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			// Find file input for folder upload within the dialog
			const folderInput = dialog.locator('input[type="file"][webkitdirectory]');

			// Upload simple folder
			await folderInput.setInputFiles(testFolderPath);

			// Click upload button
			await dialog.getByRole("button", { name: /upload/i }).click();

			// Wait for dialog to close
			// Verify both files appear in the root listing (inside the created folder)
			await expect(
				page.getByRole("cell", { name: /simple-file1\.txt/ }),
			).toBeVisible({ timeout: 10000 });
			await expect(
				page.getByRole("cell", { name: /simple-file2\.txt/ }),
			).toBeVisible({ timeout: 10000 });
		} finally {
			// Cleanup temp files
			if (fs.existsSync(testFolderPath)) {
				fs.rmSync(testFolderPath, { recursive: true, force: true });
			}
		}
	});
});
