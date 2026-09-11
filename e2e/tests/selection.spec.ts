import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** The bulk action bar, which only exists while a multi-selection is live. */
const bulkBar = (page: import("@playwright/test").Page) =>
	page.getByText(/\d+ selected/);

/**
 * Fail on any uncaught exception.
 *
 * A selection handler can update the list and *then* throw, which leaves the
 * UI looking correct while half the handler never ran — exactly what an
 * assertion on the bulk bar alone would miss.
 */
function watchForErrors(page: import("@playwright/test").Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	return errors;
}

test.describe("Selection", () => {
	test("a grid tile checkbox selects the file", async ({ page }) => {
		const errors = watchForErrors(page);
		await page.request.put("/api/v1/preferences", { data: { layout: "grid" } });
		await goToBrowse(page);

		const box = page.locator('[data-slot="checkbox"]').first();
		await expect(box).toBeAttached({ timeout: 15_000 });
		// force: the box only becomes visible on hover until something is
		// selected, which is styling rather than a reason it cannot be clicked.
		await box.click({ force: true });

		// The checkbox tracks its own state, so asserting on it alone would
		// pass even when nothing was actually selected — the bar is the proof
		// that the selection reached the app.
		await expect(box).toHaveAttribute("data-state", "checked");
		await expect(bulkBar(page)).toBeVisible({ timeout: 10_000 });
		expect(errors).toEqual([]);
	});

	test("selecting two rows in list mode opens the bulk actions", async ({
		page,
	}) => {
		const errors = watchForErrors(page);
		await page.request.put("/api/v1/preferences", { data: { layout: "list" } });
		await goToBrowse(page);

		const boxes = page.locator('[data-slot="checkbox"]');
		await expect(boxes.first()).toBeVisible({ timeout: 15_000 });

		// Index 0 is the header's select-all; take two rows.
		await boxes.nth(1).click();
		await boxes.nth(2).click();

		await expect(bulkBar(page)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("2 selected")).toBeVisible();
		expect(errors).toEqual([]);
	});

	test("shift-click selects a contiguous range", async ({ page }) => {
		await page.request.put("/api/v1/preferences", { data: { layout: "list" } });
		await goToBrowse(page);

		const boxes = page.locator('[data-slot="checkbox"]');
		await expect(boxes.first()).toBeVisible({ timeout: 15_000 });

		await boxes.nth(1).click();
		await boxes.nth(4).click({ modifiers: ["Shift"] });

		// Anchor through target inclusive: four rows.
		await expect(page.getByText("4 selected")).toBeVisible({
			timeout: 10_000,
		});
	});
});
