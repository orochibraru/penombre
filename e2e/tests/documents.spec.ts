import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse } from "../helpers";

// Required per spec file: the chromium project sets no storageState of its
// own, so a file that omits this runs signed out and every test redirects to
// the sign-in page.
test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * Fail on any uncaught exception.
 *
 * Learned the hard way: an editor can mount, be `contenteditable`, and render
 * its content while still throwing on every document change. Asserting on the
 * DOM alone passed a page that was broken in the console.
 */
function watchForErrors(page: import("@playwright/test").Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	return errors;
}

/**
 * Creating and editing the three built-in document types.
 *
 * Covers the whole path — New menu, two-step create, redirect to the editor,
 * the editor actually mounting — because each editor fails differently when it
 * breaks, and a mounted-but-empty editor looks fine in a screenshot.
 */
const KINDS = [
	{ label: "Document", extension: ".html" },
	{ label: "Sheet", extension: ".csv" },
	{ label: "Presentation", extension: ".md" },
];

test.describe("Documents", () => {
	for (const kind of KINDS) {
		test(`creates a ${kind.label.toLowerCase()} and opens its editor`, async ({
			page,
		}) => {
			const errors = watchForErrors(page);
			await goToBrowse(page);
			await page.getByRole("button", { name: "New", exact: true }).click();
			await page
				.getByRole("menuitem", { name: kind.label, exact: true })
				.click();

			await page.waitForURL("**/edit/**", { timeout: 20_000 });
			await expect(
				page.getByRole("heading", { name: new RegExp(kind.extension) }),
			).toBeVisible({ timeout: 15_000 });
			expect(errors).toEqual([]);
		});
	}

	test("a document editor is editable, not just rendered", async ({ page }) => {
		const errors = watchForErrors(page);
		await goToBrowse(page);
		await page.getByRole("button", { name: "New", exact: true }).click();
		await page.getByRole("menuitem", { name: "Document", exact: true }).click();
		await page.waitForURL("**/edit/**", { timeout: 20_000 });

		// ProseKit only supplies context; without an explicit mount this
		// element never becomes contenteditable and the page looks blank.
		const surface = page.locator(".ProseMirror");
		await expect(surface).toBeVisible({ timeout: 15_000 });
		await expect(surface).toHaveAttribute("contenteditable", "true");

		// Typing is what exercises the doc-change handler, which is where the
		// editor context error surfaced.
		await surface.click();
		await page.keyboard.type("Hello from a test.");
		await expect(surface).toContainText("Hello from a test.");
		expect(errors).toEqual([]);
	});

	test("a sheet renders a grid with labelled columns", async ({ page }) => {
		await goToBrowse(page);
		await page.getByRole("button", { name: "New", exact: true }).click();
		await page.getByRole("menuitem", { name: "Sheet", exact: true }).click();
		await page.waitForURL("**/edit/**", { timeout: 20_000 });

		await expect(
			page.getByRole("columnheader", { name: "A", exact: true }),
		).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByRole("button", { name: "Add row" })).toBeVisible();
	});
});
