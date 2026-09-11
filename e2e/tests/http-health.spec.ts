import { join } from "node:path";
import process from "node:process";
import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	goToBrowse,
	openNewFolderDialog,
	openUploadDialog,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** A dialog posting to a page with no form actions 405s and looks dead. */
interface BadResponse {
	status: number;
	method: string;
	url: string;
}

function watchHttp(page: import("@playwright/test").Page): BadResponse[] {
	const bad: BadResponse[] = [];
	page.on("response", (res) => {
		if (res.status() === 405 || res.status() >= 500) {
			bad.push({
				status: res.status(),
				method: res.request().method(),
				url: new URL(res.url()).pathname,
			});
		}
	});
	return bad;
}

test.describe("HTTP health", () => {
	test("the core flows never answer 405 or 5xx", async ({ page }) => {
		const bad = watchHttp(page);
		await page.request.put("/api/v1/preferences", { data: { layout: "list" } });

		// Browse, upload, create a folder, select, trash — the paths whose
		// dialogs submit forms.
		await goToBrowse(page);

		await openUploadDialog(page);
		const uploadDialog = page.getByRole("dialog");
		await uploadDialog
			.locator("input[type=file]")
			.first()
			.setInputFiles(join(process.cwd(), "e2e", "fixtures", "test-upload.txt"));
		await uploadDialog.getByRole("button", { name: /upload/i }).click();
		await page.waitForTimeout(2500);

		const folderName = `e2e-http-${Date.now()}`;
		await openNewFolderDialog(page);
		const folderDialog = page.getByRole("dialog");
		await folderDialog.getByRole("textbox").first().fill(folderName);
		await folderDialog.getByRole("button", { name: /create/i }).click();
		await expect(page.getByText(folderName).first()).toBeVisible({
			timeout: 15_000,
		});

		// Bulk trash, which submits the confirm dialog.
		const boxes = page.locator('[data-slot="checkbox"]');
		await boxes.nth(1).click();
		await expect(page.getByText(/\d+ selected/)).toBeVisible({
			timeout: 10_000,
		});
		await page.waitForTimeout(600);
		await page.getByRole("button", { name: "Move to Trash" }).click();
		await page.waitForTimeout(2500);

		// And the other main pages.
		for (const path of ["/trash", "/starred", "/shared", "/recent"]) {
			await page.goto(path);
			await page.waitForLoadState("networkidle");
		}

		expect(bad, `unexpected responses: ${JSON.stringify(bad)}`).toEqual([]);
	});
});
