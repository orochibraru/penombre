import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** Asserts on each action's effect, never on the button existing. */

/**
 * Two files through the API, then a fresh listing. Seeding by upload raced the
 * post-upload refresh, which re-rendered the rows under the checkbox clicks.
 */
async function seed(page: import("@playwright/test").Page) {
	const stamp = Date.now();
	for (const name of [`e2e-bulk-a-${stamp}.txt`, `e2e-bulk-b-${stamp}.txt`]) {
		const created = await page.request.post("/api/v1/storage/file", {
			data: { name, size: 16 },
		});
		expect(created.ok()).toBeTruthy();
	}
	await goToBrowse(page);
}

/**
 * Tick the rows holding these exact names.
 *
 * By name, not index: the drive accumulates items across the suite and
 * folders sort above files, so "the first two rows" is not stable — a test
 * that asserts on specific items must pick those items.
 */
async function selectNamed(
	page: import("@playwright/test").Page,
	names: string[],
) {
	for (const name of names) {
		await page
			.getByRole("row")
			.filter({ hasText: name })
			.locator('[data-slot="checkbox"]')
			.first()
			.click();
	}
	await expect(page.getByText(`${names.length} selected`)).toBeVisible({
		timeout: 10_000,
	});
	await page.waitForTimeout(600);
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
		await seed(page);
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

		await selectNamed(page, names);
		await page.getByRole("button", { name: "Star", exact: true }).click();
		// Navigating before the toast aborts whichever PUT is still in flight.
		await expect(page.getByText('Added "2" to starred')).toBeVisible();

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
		await seed(page);

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
		await seed(page);
		await selectRows(page, 2);

		await page.getByRole("button", { name: "Clear" }).click();
		await expect(page.getByText(/\d+ selected/)).toBeHidden({
			timeout: 10_000,
		});
	});

	test("the count follows deselection", async ({ page }) => {
		await seed(page);
		await selectRows(page, 2);

		// Unticking writes `false` rather than deleting the key, so a naive
		// count kept reporting the high-water mark.
		await page.locator('[data-slot="checkbox"]').nth(2).click();
		await expect(page.getByText("1 selected")).toBeVisible({
			timeout: 10_000,
		});
	});
});
