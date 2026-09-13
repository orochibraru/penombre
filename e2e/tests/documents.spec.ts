import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemVisible,
	goToBrowse,
	rightClickItem,
	submitRenameDialog,
} from "../helpers";

// Required per spec file: the chromium project sets no storageState of its
// own, so a file that omits this runs signed out and every test redirects to
// the sign-in page.
test.use({ storageState: AUTH_STORAGE_STATE });

/** An editor can mount, render, and still throw on every change. */
function watchForErrors(page: import("@playwright/test").Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	return errors;
}

/** Covers New menu → create → redirect → the editor actually mounting. */
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

test.describe("Documents in folders", () => {
	let parentId: string;
	let childId: string;

	test.beforeEach(async ({ page }) => {
		// Navigate first so auth cookies are active for page.request calls.
		await page.goto("/browse");

		const parent = await page.request.post("/api/v1/storage/folder", {
			data: { name: `e2e-docs-parent-${Date.now()}` },
		});
		expect(parent.ok()).toBeTruthy();
		parentId = (await parent.json()).data.id;

		// Nested, not top-level: a folder path is a chain of ids, so a caller
		// that keeps only the last segment still resolves a one-deep folder
		// and the bug hides.
		const child = await page.request.post("/api/v1/storage/folder", {
			data: { name: `e2e-docs-child-${Date.now()}`, parent: parentId },
		});
		expect(child.ok()).toBeTruthy();
		childId = (await child.json()).data.id;
	});

	test.afterEach(async ({ page }) => {
		if (parentId) {
			await page.request
				.delete(`/api/v1/storage/folder/${parentId}`, { data: {} })
				.catch(() => {
					/* ignore */
				});
		}
	});

	test("a new document lands in the folder being browsed", async ({ page }) => {
		await goToBrowse(page, `${parentId}/${childId}`);
		await page.getByRole("button", { name: "New", exact: true }).click();
		await page.getByRole("menuitem", { name: "Document", exact: true }).click();
		await page.waitForURL("**/edit/**", { timeout: 20_000 });

		await goToBrowse(page, `${parentId}/${childId}`);
		await expectItemVisible(page, "Untitled document");
	});

	test("renames a file that lives inside a folder", async ({ page }) => {
		const created = await page.request.post(
			`/api/v1/storage/file?folder=${parentId}/${childId}`,
			{ data: { name: `e2e-nested-${Date.now()}.txt`, size: 0 } },
		);
		expect(created.ok()).toBeTruthy();
		const original: string = (await created.json()).data.metadata.name;

		const newName = `e2e-nested-renamed-${Date.now()}.txt`;
		await goToBrowse(page, `${parentId}/${childId}`);
		await rightClickItem(page, original);
		await page.getByRole("menuitem", { name: "Rename" }).click();
		await submitRenameDialog(page, newName);

		await expectItemVisible(page, newName);
	});
});

test.describe("Smart rename", () => {
	test("the file name follows the document's heading", async ({ page }) => {
		const newTitle = `e2e-titled-${Date.now()}`;

		await goToBrowse(page);
		await page.getByRole("button", { name: "New", exact: true }).click();
		await page.getByRole("menuitem", { name: "Document", exact: true }).click();
		await page.waitForURL("**/edit/**", { timeout: 20_000 });

		const surface = page.locator(".ProseMirror");
		await expect(surface).toBeVisible({ timeout: 15_000 });

		const heading = surface.locator("h1").first();
		await heading.click();
		await page.keyboard.press("Home");
		await page.keyboard.press("Shift+End");
		await page.keyboard.type(newTitle);

		// The page heading carries the extension; the document's own does not.
		await expect(
			page.getByRole("heading", { name: `${newTitle}.html` }),
		).toBeVisible({ timeout: 20_000 });
	});
});
