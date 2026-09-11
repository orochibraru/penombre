/**
 * Produces the screenshots used by the README and the docs showcase.
 *
 * Not a test of behaviour — it asserts only enough to fail loudly when a page
 * stops rendering, so a broken screen can't be published as marketing. Run it
 * on demand:
 *
 *     bun run screenshots
 *
 * Output lands in `docs/images/`, which both the README and `packages/docs`
 * reference directly. The showcase page in the docs is built from these files,
 * which is the point: there is no demo instance to keep alive.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { expect, type Page, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, openUploadDialog } from "../helpers";

const OUT_DIR = join(process.cwd(), "docs", "images");
const FIXTURES = join(process.cwd(), "e2e", "fixtures");

/** Wide enough to show the sidebar and a full grid row. */
test.use({
	storageState: AUTH_STORAGE_STATE,
	viewport: { width: 1440, height: 900 },
});

// Screenshots are a serial pipeline over one seeded library, not independent
// cases — running them in parallel would race on the same uploads.
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	await mkdir(OUT_DIR, { recursive: true });
});

/**
 * One dummy per category the app knows how to categorise, so every code path
 * the UI has — thumbnails, waveforms, PDF rasterising, syntax highlighting,
 * the generic icon — is exercised by the shots rather than asserted about in
 * the abstract.
 */
const SEEDS = [
	"showcase-photo.jpg",
	"showcase-video.mp4",
	"showcase-track.mp3",
	"showcase-report.pdf",
	"showcase-script.ts",
	"showcase-notes.md",
	"showcase-budget.csv",
	"showcase-model.obj",
	"showcase-backup.zip",
	"test-image.png",
	"test-upload.txt",
];

/**
 * Start from an empty drive.
 *
 * These are marketing shots of the root folder, so leftovers from an earlier
 * run of the other suites would end up in them. Safe here: the screenshot
 * pipeline runs before those suites, and each of them seeds its own fixtures.
 */
test("clears the drive", async ({ page }) => {
	await goToBrowse(page);
	const removed = await page.evaluate(async () => {
		const listed = await (await fetch("/api/v1/storage/list")).json();
		const items = (listed?.data?.list ?? []) as Array<{
			key: string;
			type?: string;
		}>;
		for (const item of items) {
			const isFolder = item.type === "folder" || item.key.endsWith("/");
			const key = item.key.replace(/\/$/, "");
			await fetch(
				isFolder
					? `/api/v1/storage/folder/${encodeURIComponent(key)}`
					: `/api/v1/storage/file/${encodeURIComponent(key)}`,
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: "{}",
				},
			);
		}
		return items.length;
	});
	console.log(`[screenshots] cleared ${removed} item(s) from the drive`);
});

test("seeds one file of every supported kind", async ({ page }) => {
	await goToBrowse(page);
	await openUploadDialog(page);

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();

	await dialog
		.locator("input[type=file]")
		.first()
		.setInputFiles(SEEDS.map((name) => join(FIXTURES, name)));
	await dialog.getByRole("button", { name: /upload/i }).click();

	// The slowest of the bunch: thumbnails and the waveform are generated at
	// write time, so the last row appearing means the library is ready to
	// photograph.
	for (const name of ["showcase-photo.jpg", "showcase-track.mp3"]) {
		await expect(page.getByText(name).first()).toBeVisible({
			timeout: 60_000,
		});
	}
});

/** Let the aurora, thumbnails and any transition settle before capturing. */
async function settle(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1200);
}

interface Shot {
	name: string;
	path: string;
	expect: RegExp;
	/** Anything to do on the page before the shutter, e.g. open a dialog. */
	prepare?: (page: Page) => Promise<void>;
}

const SHOTS: Shot[] = [
	{
		name: "hero",
		path: "/browse",
		expect: /my drive/i,
		// Grid: the one shot that has to sell the thing at a glance. The
		// button is labelled with the *current* layout, so "List" switches to
		// grid, and the preference sticks for the shots that follow.
		prepare: async (page) => {
			const toGrid = page.getByRole("button", { name: "List", exact: true });
			if (await toGrid.isVisible().catch(() => false)) {
				await toGrid.click();
				await page.waitForLoadState("networkidle");
			}
		},
	},
	{
		name: "browse",
		path: "/browse",
		expect: /my drive/i,
		// Back to the list, so this is not a second copy of the hero: the
		// layout is a saved preference, and the hero left it on grid.
		prepare: async (page) => {
			const toList = page.getByRole("button", { name: "Grid", exact: true });
			if (await toList.isVisible().catch(() => false)) {
				await toList.click();
				await page.waitForLoadState("networkidle");
			}
		},
	},
	{
		name: "preview",
		path: "/browse",
		expect: /my drive/i,
		prepare: async (page) => {
			await page.getByText("showcase-photo.jpg").first().click();
			await expect(page.getByRole("dialog")).toBeVisible({
				timeout: 15_000,
			});
		},
	},
	{
		name: "music",
		path: "/categories/MUSIC",
		expect: /music/i,
		prepare: async (page) => {
			await page.getByText("showcase-track.mp3").first().click();
			// The waveform replaces the progress bar once the peaks land.
			await expect(page.locator('[data-slot="waveform"]').first()).toBeVisible({
				timeout: 20_000,
			});
		},
	},
	{ name: "categories", path: "/categories/IMAGES", expect: /images/i },
	{ name: "recent", path: "/recent", expect: /recent/i },
	{ name: "shared", path: "/shared", expect: /shared/i },
	{ name: "trash", path: "/trash", expect: /trash/i },
	{ name: "settings-appearance", path: "/settings/display", expect: /theme/i },
	{ name: "settings-storage", path: "/settings/storage", expect: /storage/i },
	{ name: "admin", path: "/admin", expect: /dashboard/i },
	{ name: "admin-activity", path: "/admin/activity", expect: /admin/i },
];

for (const shot of SHOTS) {
	for (const theme of ["light", "dark"] as const) {
		test(`captures ${shot.name} (${theme})`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: theme });
			await page.goto(shot.path);
			await page.waitForLoadState("networkidle");

			// Fail rather than publish a redirected, blank or errored page.
			// The URL check catches an auth redirect, which would otherwise
			// publish the drive under an "admin" filename.
			expect(new URL(page.url()).pathname).toBe(shot.path);
			await expect(page.getByText(shot.expect).first()).toBeVisible({
				timeout: 15_000,
			});

			await shot.prepare?.(page);
			await settle(page);

			const suffix = theme === "dark" ? "-dark" : "";
			await page.screenshot({
				path: join(OUT_DIR, `${shot.name}${suffix}.png`),
				fullPage: false,
			});
		});
	}
}

test("writes an index of what was captured", async () => {
	const lines = SHOTS.flatMap((shot) =>
		["", "-dark"].map(
			(suffix) => `- \`${shot.name}${suffix}.png\` — ${shot.path}`,
		),
	);
	await writeFile(
		join(OUT_DIR, "README.md"),
		[
			"# Screenshots",
			"",
			"Generated by `bun run screenshots`. Do not edit by hand.",
			"",
			"They are published by `docs/showcase.md`, which is what the README",
			"links to — there is no demo instance.",
			"",
			...lines,
			"",
		].join("\n"),
	);
});
