import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../helpers";

// Required per spec file: the chromium project sets no storageState of its
// own, so a file that omits this runs signed out and every test redirects to
// the sign-in page.
test.use({ storageState: AUTH_STORAGE_STATE });

const FIXTURE_DIR = path.resolve("tests/e2e/fixtures");

/**
 * An Office file lands on disk unchanged and is edited in place, so what this
 * spec is really asserting is that the bytes survive a round trip through the
 * browser: upload, open, edit, reload, and the content that was never touched
 * is still there.
 */
async function uploadFixture(page: Page, name: string): Promise<string> {
	// Navigate first so the auth cookies are active for page.request.
	await page.goto("/browse");

	const bytes = readFileSync(path.join(FIXTURE_DIR, name));
	const unique = `${Date.now()}-${name}`;

	const created = await page.request.post("/api/v1/storage/file", {
		data: { name: unique, size: bytes.byteLength },
	});
	expect(created.ok()).toBeTruthy();
	const id = (await created.json()).data.id as string;

	const uploaded = await page.request.post(
		`/api/v1/storage/file/${id}/upload`,
		{
			// SvelteKit refuses a cross-site form post, and a multipart body
			// from `page.request` is exactly that unless it says where it
			// came from — the browser would have sent this header itself.
			headers: { origin: new URL(page.url()).origin },
			multipart: {
				file: { name: unique, mimeType: "application/zip", buffer: bytes },
			},
		},
	);
	expect(uploaded.ok()).toBeTruthy();
	return id;
}

/**
 * Make an edit, and keep making it until a save lands.
 *
 * The editors render server-side, so their values are on screen before the
 * page is hydrated. An edit that lands in that gap looks like it took — the
 * DOM really does hold the new value — and is then thrown away when hydration
 * takes the input over, with no `input` event ever reaching the component.
 * Asserting on the value is therefore not enough; the save indicator is the
 * first thing that only appears once the edit actually reached the app.
 */
async function editUntilSaved(page: Page, edit: () => Promise<void>) {
	await expect(async () => {
		await edit();
		// The editors save themselves two seconds after the last keystroke.
		await expect(page.getByText(/saved at/i)).toBeVisible({ timeout: 5000 });
	}).toPass({ timeout: 40_000 });
}

test.describe("Office documents", () => {
	test("a spreadsheet opens in the grid and saves back as a spreadsheet", async ({
		page,
	}) => {
		const id = await uploadFixture(page, "office-report.xlsx");
		await page.goto(`/edit/${id}`);

		const cell = (row: string, col: string) =>
			page.locator(`td[data-row="${row}"][data-col="${col}"]`);
		await expect(cell("0", "0")).toHaveText("Item", { timeout: 20_000 });
		const widget = page.getByRole("gridcell", { name: "Widget", exact: true });
		await expect(widget).toBeVisible();
		const row = (await widget.getAttribute("data-row")) ?? "";
		const col = (await widget.getAttribute("data-col")) ?? "";

		// Typing on a selected cell replaces what it holds.
		await editUntilSaved(page, async () => {
			await cell(row, col).click();
			await page.keyboard.type("Widget MK II");
			await page.keyboard.press("Enter");
		});

		// Reloading reads the file back off disk, so this only passes if what
		// was written is still a workbook we can open.
		await page.reload();
		await expect(cell(row, col)).toHaveText("Widget MK II", {
			timeout: 20_000,
		});
		// The header row was never touched and must have come back untouched.
		await expect(cell("0", "0")).toHaveText("Item");
	});

	test("a Word document opens in the rich text editor with its formatting", async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		const id = await uploadFixture(page, "office-report.docx");
		await page.goto(`/edit/${id}`);

		const surface = page.locator(".ProseMirror");
		await expect(surface).toBeVisible({ timeout: 20_000 });
		await expect(surface.locator("h1")).toHaveText("Quarterly report");
		await expect(surface.locator("strong")).toHaveText("12%");
		// ProseKit renders a list item as its own `div`, not as an `li`.
		await expect(surface.locator(".prosemirror-flat-list")).toHaveCount(2);
		// The picture is handed over as a data URL rather than dropped.
		await expect(surface.locator("img")).toHaveCount(1);

		await editUntilSaved(page, async () => {
			await surface.locator("h1").click();
			await page.keyboard.press("End");
			await page.keyboard.type(" 2026");
		});

		await page.reload();
		await expect(page.locator(".ProseMirror h1")).toHaveText(
			"Quarterly report 2026",
			{ timeout: 20_000 },
		);
		// Everything the editor was not asked to change is still there.
		await expect(
			page.locator(".ProseMirror .prosemirror-flat-list"),
		).toHaveCount(2);
		await expect(page.locator(".ProseMirror img")).toHaveCount(1);
		expect(errors).toEqual([]);
	});

	test("a presentation opens in the slide editor and keeps its other slides", async ({
		page,
	}) => {
		const id = await uploadFixture(page, "office-report.pptx");
		await page.goto(`/edit/${id}`);

		// `data-el` marks the slide on the canvas, not the rail's thumbnails.
		const body = page
			.locator("[data-el]")
			.filter({ hasText: "No private formats" });
		await expect(body).toBeVisible({ timeout: 20_000 });

		await editUntilSaved(page, async () => {
			await body.dblclick();
			await page.keyboard.press("ControlOrMeta+End");
			await page.keyboard.type(" today");
			await page.keyboard.press("Escape");
		});

		await page.reload();
		await expect(
			page.locator("[data-el]").filter({ hasText: "No private formats today" }),
		).toBeVisible({ timeout: 20_000 });
		// Slide two was never opened, let alone edited.
		await expect(page.getByLabel("Slide 2", { exact: true })).toBeVisible();
	});
});
