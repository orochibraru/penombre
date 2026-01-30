import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * E2E test for large folder uploads (200+ files)
 * Ensures no files are dropped and performance is acceptable.
 */
test.describe("Large Folder Upload", () => {
	// 60 seconds should be plenty for 250 files
	test.setTimeout(60_000);

	const FILE_COUNT = 250;

	test("can upload a folder with 250 files without dropping any", async ({
		page,
	}) => {
		await page.goto("/browse");

		// Create a dedicated folder for this test first
		const testContainerName = `large-test-${Date.now()}`;

		// Create folder via UI
		await page
			.getByRole("button", { name: "New", exact: true })
			.first()
			.click();
		await page.getByRole("menuitem", { name: /folder/i }).click();

		const folderDialog = page.getByRole("dialog");
		await folderDialog.getByRole("textbox").fill(testContainerName);
		await folderDialog.getByRole("button", { name: /create/i }).click();
		await expect(folderDialog).not.toBeVisible({ timeout: 5000 });

		// Navigate into the folder
		await page
			.getByRole("cell", { name: testContainerName, exact: true })
			.dblclick();
		await expect(page).toHaveURL(/\/browse\/.+/, { timeout: 5000 });

		// Create temp folder with 250 files
		const tempDir = os.tmpdir();
		const testFolderName = `large-folder-${Date.now()}`;
		const testFolderPath = path.join(tempDir, testFolderName);

		fs.mkdirSync(testFolderPath);

		// Create 250 files with predictable names
		for (let i = 1; i <= FILE_COUNT; i++) {
			const fileName = `file-${String(i).padStart(4, "0")}.txt`;
			fs.writeFileSync(
				path.join(testFolderPath, fileName),
				`Content of file ${i}. This is test data for large folder upload test.`,
			);
		}

		try {
			// Open upload dialog via New button in sidebar
			await page
				.getByRole("button", { name: "New", exact: true })
				.first()
				.click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			// Find file input for folder upload
			const folderInput = dialog.locator('input[type="file"][webkitdirectory]');

			// Upload the large folder
			await folderInput.setInputFiles(testFolderPath);

			// Click upload button
			await dialog.getByRole("button", { name: /upload/i }).click();

			// Wait for dialog to close
			await expect(dialog).not.toBeVisible({ timeout: 5_000 });

			// Wait for uploads to complete - 250 small text files should be fast
			await page.waitForTimeout(15_000);

			// Reload to ensure we see all files
			await page.reload();

			// Verify files by checking first, middle, and last exist
			await expect(
				page.getByRole("cell", { name: /file-0001\.txt/ }),
			).toBeVisible({ timeout: 10_000 });

			await expect(
				page.getByRole("cell", { name: /file-0100\.txt/ }),
			).toBeVisible({ timeout: 10_000 });

			await expect(
				page.getByRole("cell", { name: /file-0250\.txt/ }),
			).toBeVisible({ timeout: 10_000 });

			// Count all table rows (files) - should have exactly 250
			const fileRows = page.locator("table tbody tr");
			await expect(fileRows).toHaveCount(FILE_COUNT, { timeout: 10_000 });
		} finally {
			// Cleanup temp files
			if (fs.existsSync(testFolderPath)) {
				fs.rmSync(testFolderPath, { recursive: true, force: true });
			}
		}
	});

	test("can upload a folder with mixed files and subfolders totaling 200+ items", async ({
		page,
	}) => {
		await page.goto("/browse");

		// Create a dedicated folder for this test first
		const testContainerName = `mixed-test-${Date.now()}`;

		await page
			.getByRole("button", { name: "New", exact: true })
			.first()
			.click();
		await page.getByRole("menuitem", { name: /folder/i }).click();

		const folderDialog = page.getByRole("dialog");
		await folderDialog.getByRole("textbox").fill(testContainerName);
		await folderDialog.getByRole("button", { name: /create/i }).click();
		await expect(folderDialog).not.toBeVisible({ timeout: 5000 });

		// Navigate into the folder
		await page
			.getByRole("cell", { name: testContainerName, exact: true })
			.dblclick();
		await expect(page).toHaveURL(/\/browse\/.+/, { timeout: 5000 });

		const tempDir = os.tmpdir();
		const testFolderName = `mixed-large-folder-${Date.now()}`;
		const testFolderPath = path.join(tempDir, testFolderName);

		fs.mkdirSync(testFolderPath);

		// Create structure:
		// - 50 files in root
		// - 5 subfolders, each with 40 files = 200 files in subfolders
		// Total: 255 items (50 root files + 5 folders + 200 nested files)

		// Root files
		const rootFileCount = 50;
		for (let i = 1; i <= rootFileCount; i++) {
			const fileName = `root-${String(i).padStart(3, "0")}.txt`;
			fs.writeFileSync(
				path.join(testFolderPath, fileName),
				`Root file ${i} content`,
			);
		}

		// Create 5 subfolders with 40 files each
		const subfolderCount = 5;
		const filesPerSubfolder = 40;
		for (let s = 1; s <= subfolderCount; s++) {
			const subfolderName = `subfolder-${String(s).padStart(2, "0")}`;
			const subfolderPath = path.join(testFolderPath, subfolderName);
			fs.mkdirSync(subfolderPath);

			for (let f = 1; f <= filesPerSubfolder; f++) {
				const fileName = `nested-${String(f).padStart(3, "0")}.txt`;
				fs.writeFileSync(
					path.join(subfolderPath, fileName),
					`Subfolder ${s}, file ${f} content`,
				);
			}
		}

		try {
			// Open upload dialog
			await page
				.getByRole("button", { name: "New", exact: true })
				.first()
				.click();
			await page.getByRole("menuitem", { name: /file/i }).click();

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const folderInput = dialog.locator('input[type="file"][webkitdirectory]');
			await folderInput.setInputFiles(testFolderPath);

			await dialog.getByRole("button", { name: /upload/i }).click();
			await expect(dialog).not.toBeVisible({ timeout: 5_000 });

			// Wait for uploads to complete
			await page.waitForTimeout(15_000);

			// Reload to ensure we see all files
			await page.reload();

			// Verify root has 50 files + 5 folders = 55 items
			const rootRows = page.locator("table tbody tr");
			await expect(rootRows).toHaveCount(rootFileCount + subfolderCount, {
				timeout: 10_000,
			});

			// Navigate into first subfolder and verify it has 40 files
			await page
				.getByRole("cell", { name: "subfolder-01", exact: true })
				.dblclick();

			await expect(page).toHaveURL(/\/browse\/.+/, { timeout: 5000 });

			const subfolderRows = page.locator("table tbody tr");
			await expect(subfolderRows).toHaveCount(filesPerSubfolder, {
				timeout: 10_000,
			});

			// Verify first and last file in subfolder
			await expect(
				page.getByRole("cell", { name: /nested-001\.txt/ }),
			).toBeVisible();
			await expect(
				page.getByRole("cell", { name: /nested-040\.txt/ }),
			).toBeVisible();
		} finally {
			if (fs.existsSync(testFolderPath)) {
				fs.rmSync(testFolderPath, { recursive: true, force: true });
			}
		}
	});
});
