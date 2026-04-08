import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	openUploadDialog,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

const FIXTURE_DIR = path.resolve("e2e/fixtures");

test.describe("File Upload @s3", () => {
	// Tests in this group require S3/Garage storage to be operational.
	// They run with playwright.config.ts (S3 backend) and are excluded
	// from playwright.local.config.ts via grepInvert: /@s3/.

	test.beforeEach(async ({ page }) => {
		await goToBrowse(page);
	});

	test("uploads a single file via the upload dialog", async ({ page }) => {
		const fileName = "test-upload.txt";

		await openUploadDialog(page);

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Set the file on the hidden file input inside the upload dialog
		const fileInput = dialog.locator("input[type=file]").first();
		await fileInput.setInputFiles(path.join(FIXTURE_DIR, fileName));

		// Confirm the upload
		await dialog.getByRole("button", { name: /upload/i }).click();

		// The item should appear in the file list
		await expectItemVisible(page, fileName);
	});

	test("uploads multiple files at once", async ({ page }) => {
		const files = ["test-upload.txt", "test-image.png"];

		await openUploadDialog(page);

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const fileInput = dialog.locator("input[type=file]").first();
		await fileInput.setInputFiles(files.map((f) => path.join(FIXTURE_DIR, f)));

		await dialog.getByRole("button", { name: /upload/i }).click();

		for (const name of files) {
			await expectItemVisible(page, name);
		}
	});

	test("uploads a file by dragging onto the file area", async ({ page }) => {
		const fileName = "test-upload.txt";
		const filePath = path.join(FIXTURE_DIR, fileName);

		// Simulate a drop event on the file list drop zone
		const dropZone = page.locator("[role=region]").first();
		await dropZone.dispatchEvent("dragover", {
			dataTransfer: await page.evaluateHandle(() => new DataTransfer()),
		});

		const buffer = readFileSync(filePath);
		const dataTransfer = await page.evaluateHandle(
			({ content, name }) => {
				const dt = new DataTransfer();
				const file = new File([new Uint8Array(content)], name, {
					type: "text/plain",
				});
				dt.items.add(file);
				return dt;
			},
			{ content: Array.from(buffer), name: fileName },
		);

		await dropZone.dispatchEvent("drop", { dataTransfer });

		// The upload dialog should open with the pending file
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible({ timeout: 5_000 });

		await dialog.getByRole("button", { name: /upload/i }).click();

		await expectItemVisible(page, fileName);
	});

	test("shows uploaded file in subfolder when folder is open", async ({
		page,
	}) => {
		const folderName = `e2e-upload-folder-${Date.now()}`;
		const fileName = "test-upload.txt";

		// Create the target folder via API so we don't depend on pre-existing data
		const resp = await page.request.post("/api/v1/storage/folder", {
			data: { name: folderName },
		});
		expect(resp.ok()).toBeTruthy();
		const { data } = await resp.json();
		const folderId: string = data.id;

		try {
			await goToBrowse(page, folderId);
			await openUploadDialog(page);

			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const fileInput = dialog.locator("input[type=file]").first();
			await fileInput.setInputFiles(path.join(FIXTURE_DIR, fileName));

			await dialog.getByRole("button", { name: /upload/i }).click();

			await expectItemVisible(page, fileName);
		} finally {
			await page.request
				.delete(`/api/v1/storage/folder/${folderId}`, { data: {} })
				.catch(() => {
					/* ignore */
				});
		}
	});

	test("cancelling the upload dialog does not add a file", async ({ page }) => {
		// Use a fixture file not uploaded by any other test to keep this test isolated
		const fileName = "e2e-cancel.txt";

		await openUploadDialog(page);

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const fileInput = dialog.locator("input[type=file]").first();
		await fileInput.setInputFiles(path.join(FIXTURE_DIR, fileName));

		await dialog.getByRole("button", { name: /cancel/i }).click();
		await expect(dialog).toBeHidden({ timeout: 5_000 });

		await expectItemAbsent(page, fileName);
	});
});
