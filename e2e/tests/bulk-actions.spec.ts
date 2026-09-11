import { join } from "node:path";
import process from "node:process";
import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, openUploadDialog } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * The bulk action bar.
 *
 * Every one of these was broken at some point while nothing failed: two
 * actions were `() => []` stubs, and the bar itself sat under the upload
 * progress panel where its buttons could not be clicked. Assertions are on
 * the *effect* of each action, never on the button existing.
 */

/** Upload fixtures and return the names that landed. */
async function seed(page: import("@playwright/test").Page, names: string[]) {
	await goToBrowse(page);
	await openUploadDialog(page);
	const dialog = page.getByRole("dialog");
	await dialog
		.locator("input[type=file]")
		.first()
		.setInputFiles(
			names.map((name) => join(process.cwd(), "e2e", "fixtures", name)),
		);
	await dialog.getByRole("button", { name: /upload/i }).click();
	await expect(page.getByText(names[0] ?? "").first()).toBeVisible({
		timeout: 20_000,
	});
}

/** Tick `count` rows and wait for the bar to finish sliding in. */
async function selectRows(
	page: import("@playwright/test").Page,
	count: number,
) {
	const boxes = page.locator('[data-slot="checkbox"]');
	await expect(boxes.first()).toBeVisible({ timeout: 15_000 });
	// Index 0 is the header's select-all.
	for (let i = 1; i <= count; i++) {
		await boxes.nth(i).click();
	}
	await expect(page.getByText(`${count} selected`)).toBeVisible({
		timeout: 10_000,
	});
	// The bar slides in; clicking mid-animation misses.
	await page.waitForTimeout(600);
}

test.describe("Bulk actions", () => {
	test.beforeEach(async ({ page }) => {
		await page.request.put("/api/v1/preferences", { data: { layout: "list" } });
	});

	test("the bar's buttons are actually clickable", async ({ page }) => {
		await seed(page, ["test-upload.txt", "test-image.png"]);
		await selectRows(page, 2);

		// A fixed overlay in the same corner used to intercept these clicks,
		// so assert the button is the real hit target at its own centre.
		const button = page.getByRole("button", { name: "Move to Trash" });
		const box = await button.boundingBox();
		expect(box).not.toBeNull();
		const hit = await page.evaluate(
			({ x, y }) => {
				const el = document.elementFromPoint(x, y);
				return el?.closest("button")?.textContent?.trim() ?? "none";
			},
			{
				x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
				y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
			},
		);
		expect(hit).toContain("Move to Trash");
	});

	test("Star marks every selected item", async ({ page }) => {
		// Folders with names we chose, rather than uploads: a fixture landing
		// in a drive that already holds it is renamed "… (2).txt", so the
		// fixture filename is not what ends up on screen.
		const stamp = Date.now();
		const names = [`e2e-star-a-${stamp}`, `e2e-star-b-${stamp}`];
		for (const name of names) {
			const created = await page.request.post("/api/v1/storage/folder", {
				data: { name },
			});
			expect(created.ok()).toBeTruthy();
		}

		await goToBrowse(page);
		for (const name of names) {
			await expect(page.getByText(name).first()).toBeVisible({
				timeout: 15_000,
			});
		}

		await selectRows(page, 2);
		await page.getByRole("button", { name: "Star", exact: true }).click();

		// The starred view is the proof the change reached the server.
		await page.goto("/starred");
		for (const name of names) {
			await expect(page.getByText(name).first()).toBeVisible({
				timeout: 15_000,
			});
		}
	});

	test("Share is offered for one item and withheld for several", async ({
		page,
	}) => {
		await seed(page, ["test-upload.txt", "test-image.png"]);

		await selectRows(page, 1);
		await expect(
			page.getByRole("button", { name: "Share", exact: true }),
		).toBeVisible();

		// A share link addresses a single resource, so it is not offered for
		// a set — better than a button that cannot do what it says.
		const boxes = page.locator('[data-slot="checkbox"]');
		await boxes.nth(2).click();
		await expect(page.getByText("2 selected")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Share", exact: true }),
		).toBeHidden();
	});

	test("Clear empties the selection", async ({ page }) => {
		await seed(page, ["test-upload.txt", "test-image.png"]);
		await selectRows(page, 2);

		await page.getByRole("button", { name: "Clear" }).click();
		await expect(page.getByText(/\d+ selected/)).toBeHidden({
			timeout: 10_000,
		});
	});

	test("the count follows deselection", async ({ page }) => {
		await seed(page, ["test-upload.txt", "test-image.png"]);
		await selectRows(page, 2);

		// Unticking writes `false` rather than deleting the key, so a naive
		// count kept reporting the high-water mark.
		await page.locator('[data-slot="checkbox"]').nth(2).click();
		await expect(page.getByText("1 selected")).toBeVisible({
			timeout: 10_000,
		});
	});
});
