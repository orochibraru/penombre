/**
 * Produces the screenshots used by the README and the docs showcase.
 *
 * Not a test of behaviour — it asserts only enough to fail loudly when a page
 * stops rendering, so a broken screen can't be published as marketing. Run it
 * on demand:
 *
 *     bun run screenshots
 *
 * Output lands in `docs/images/`, which the README and the docs site both
 * reference directly. The showcase page is built from these files, which is the
 * point: there is no demo instance to keep alive.
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { expect, type Page, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	goToBrowse,
	openUploadDialog,
	sameOrigin,
	setVersioning,
	unfold,
} from "../helpers";

const OUT_DIR = join(process.cwd(), "docs", "images");
/** What the feature graphics are laid out around (`mise run graphics`). */
const GRAPHICS_DIR = join(OUT_DIR, "graphics", "src");
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
 * A band's drive: real photos, footage and music (credited in
 * `e2e/fixtures/CREDITS.md`) under the names a band would give them, and one
 * file of every other kind the UI previews. Uploaded last, the pictures lead
 * a listing sorted by date.
 */
const MEDIA: Record<string, string> = {
	"Olympia, front row.jpg": "showcase-photo.jpg",
	"Olympia, crowd.jpg": "showcase-photo-2.jpg",
	"Mixing desk.jpg": "showcase-photo-3.jpg",
	"Test pressing.jpg": "showcase-photo-4.jpg",
	"Rehearsal, full band.mp4": "showcase-video.mp4",
};
const FILES: Record<string, string> = {
	"Stage plot.pdf": "showcase-report.pdf",
	"Release notes.md": "showcase-notes.md",
	"Tour budget.csv": "showcase-budget.csv",
	"tour-site.ts": "showcase-script.ts",
	"Stage model.obj": "showcase-model.obj",
	"Stems backup.zip": "showcase-backup.zip",
	"Lyrics.txt": "test-upload.txt",
};
const PHOTO = "Olympia, front row.jpg";

/** One song in three takes: each upload keeps the one before as a version. */
const TRACK = "Midnight drive.mp3";
const TAKES = [
	"showcase-track-v1.mp3",
	"showcase-track-v2.mp3",
	"showcase-track.mp3",
];

const RIDER = [
	"<h1>Tour rider 2027</h1>",
	"<p>Everything the band needs on the day, from load-in to the last encore.",
	" Send questions to the tour manager at least <strong>two weeks</strong>",
	" before the show.</p>",
	`<img src="data:image/jpeg;base64,${readFileSync(join(FIXTURES, "showcase-photo-3.jpg")).toString("base64")}">`,
	"<h2>Stage</h2><ul>",
	"<li><p>Drum riser 2.4 × 2 m, 40 cm high</p></li>",
	"<li><p>Four wedges and two side fills</p></li>",
	"<li><p>Six 230 V outlets stage left</p></li></ul>",
	"<h2>Schedule</h2><table>",
	"<tr><th><p>Time</p></th><th><p>What</p></th></tr>",
	"<tr><td><p>14:00</p></td><td><p>Load-in</p></td></tr>",
	"<tr><td><p>17:30</p></td><td><p>Soundcheck</p></td></tr>",
	"<tr><td><p>21:00</p></td><td><p>Show</p></td></tr></table>",
].join("");

const MERCH = `Item,Size,Stock,Price,Value
Tour tee,S,24,25,=C2*D2
Tour tee,M,40,25,=C3*D3
Tour tee,L,36,25,=C4*D4
Hoodie,M,18,55,=C5*D5
Vinyl LP,,60,30,=C6*D6
Tote bag,,45,15,=C7*D7
Poster,,80,10,=C8*D8
,,,Total,=SUM(E2:E8)`;

/** Through the upload dialog, as `name: fixture`. */
async function upload(page: Page, files: Record<string, string>) {
	await openUploadDialog(page);
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await dialog
		.locator("input[type=file]")
		.first()
		.setInputFiles(
			Object.entries(files).map(([name, fixture]) => ({
				name,
				mimeType: "application/octet-stream",
				buffer: readFileSync(join(FIXTURES, fixture)),
			})),
		);
	await dialog.getByRole("button", { name: /upload/i }).click();
	await expect(dialog).toBeHidden();
	await page.waitForLoadState("networkidle");
}

// Instance-wide, and every other spec expects a same-name upload to be
// `name (1)`: back off whatever happened.
test.afterAll(async ({ browser }) => {
	const context = await browser.newContext({
		storageState: AUTH_STORAGE_STATE,
	});
	await setVersioning(await context.newPage(), false);
	await context.close();
});

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

/** Files the editor shots open, by id. */
const opened: Record<"document" | "sheet" | "deck", string> = {
	document: "",
	sheet: "",
	deck: "",
};

test("seeds the band's drive", async ({ page }) => {
	await setVersioning(page, true);
	await goToBrowse(page);
	await upload(page, FILES);

	const write = async (
		kind: "document" | "sheet",
		name: string,
		content: string,
	) => {
		const made = await page.request.post("/api/v1/documents", {
			headers: sameOrigin(),
			data: { kind, name },
		});
		expect(made.ok()).toBeTruthy();
		const id: string = (await made.json()).data.id;
		const saved = await page.request.post(`/api/v1/storage/file/${id}/office`, {
			headers: sameOrigin(),
			data: { content },
		});
		expect(saved.ok()).toBeTruthy();
		return id;
	};
	opened.document = await write("document", "Tour rider", RIDER);
	opened.sheet = await write("sheet", "Merch stock", MERCH);
	const deck = await page.request.post("/api/v1/documents/presentation", {
		headers: sameOrigin(),
		data: { template: "aurora", name: "Tour 2027" },
	});
	expect(deck.ok()).toBeTruthy();
	opened.deck = (await deck.json()).data.id;

	for (const take of TAKES) {
		await upload(page, { [TRACK]: take });
	}
	await upload(page, MEDIA);

	// The slowest of the bunch: thumbnails and the waveform are generated at
	// write time, so the last row appearing means the library is ready to
	// photograph.
	await goToBrowse(page);
	for (const name of [PHOTO, TRACK]) {
		await expect(page.getByText(name).first()).toBeVisible({
			timeout: 60_000,
		});
	}
});

/** Back to the list, with the track's earlier takes unfolded under it. */
async function listWithTakes(page: Page) {
	const toList = page.getByRole("button", { name: "Grid", exact: true });
	if (await toList.isVisible().catch(() => false)) {
		await toList.click();
		await page.waitForLoadState("networkidle");
	}
	await unfold(page, TRACK);
	await expect(
		page.getByRole("row").filter({ hasText: /^\s*v1\b/ }),
	).toBeVisible();
}

/** Let the aurora, thumbnails and any transition settle before capturing. */
async function settle(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1200);
}

interface Shot {
	name: string;
	/** A function when the page is a file only known once seeded. */
	path: string | (() => string);
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
		prepare: listWithTakes,
	},
	{
		name: "preview",
		path: "/browse",
		expect: /my drive/i,
		prepare: async (page) => {
			await page.getByText(PHOTO).first().click();
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
			await unfold(page, TRACK);
			await page.getByText(TRACK).first().click();
			// The waveform replaces the progress bar once the peaks land.
			await expect(page.locator('[data-slot="waveform"]').first()).toBeVisible({
				timeout: 20_000,
			});
		},
	},
	{
		name: "document",
		path: () => `/edit/${opened.document}`,
		expect: /Tour rider\.docx/,
		prepare: async (page) => {
			await expect(page.locator(".ProseMirror")).toBeVisible({
				timeout: 20_000,
			});
		},
	},
	{
		name: "sheet",
		path: () => `/edit/${opened.sheet}`,
		expect: /Merch stock\.xlsx/,
		prepare: async (page) => {
			await expect(page.getByRole("gridcell").first()).toBeVisible({
				timeout: 20_000,
			});
		},
	},
	{
		name: "slides",
		path: () => `/edit/${opened.deck}`,
		expect: /Tour 2027\.pptx/,
		prepare: async (page) => {
			await expect(page.locator("[data-el]").first()).toBeVisible({
				timeout: 20_000,
			});
		},
	},
	{
		name: "slides-templates",
		path: "/browse",
		expect: /my drive/i,
		prepare: async (page) => {
			await page.getByRole("button", { name: "New", exact: true }).click();
			await page
				.getByRole("menuitem", { name: "Presentation", exact: true })
				.click();
			await expect(page.getByRole("dialog")).toBeVisible();
		},
	},
	{ name: "categories", path: "/categories/IMAGES", expect: /images/i },
	{ name: "recent", path: "/recent", expect: /recent/i },
	{ name: "shared", path: "/shared", expect: /links/i },
	{ name: "trash", path: "/trash", expect: /trash/i },
	{
		name: "settings-notifications",
		path: "/settings",
		expect: /notifications/i,
	},
	{ name: "settings-appearance", path: "/settings/display", expect: /theme/i },
	{ name: "settings-storage", path: "/settings/storage", expect: /storage/i },
	{ name: "admin", path: "/admin", expect: /dashboard/i },
	{ name: "admin-activity", path: "/admin/activity", expect: /admin/i },
];

for (const shot of SHOTS) {
	for (const theme of ["light", "dark"] as const) {
		test(`captures ${shot.name} (${theme})`, async ({ page }) => {
			const path = typeof shot.path === "function" ? shot.path() : shot.path;
			await page.emulateMedia({ colorScheme: theme });
			await page.goto(path);
			await page.waitForLoadState("networkidle");

			// mode-watcher toggles `.dark` on <html> from the emulated
			// `prefers-color-scheme`; wait for it rather than trust that the
			// media emulation alone produced the right paint before capture.
			await page.waitForFunction(
				(wantDark) =>
					document.documentElement.classList.contains("dark") === wantDark,
				theme === "dark",
				{ timeout: 5_000 },
			);

			// Fail rather than publish a redirected, blank or errored page.
			// The URL check catches an auth redirect, which would otherwise
			// publish the drive under an "admin" filename.
			expect(new URL(page.url()).pathname).toBe(path);
			await expect(page.getByText(shot.expect).first()).toBeVisible({
				timeout: 15_000,
			});

			await shot.prepare?.(page);
			await settle(page);

			const suffix = theme === "dark" ? "-dark" : "";
			const png = await page.screenshot({ fullPage: false });
			await Bun.write(
				join(OUT_DIR, `${shot.name}${suffix}.webp`),
				await new Bun.Image(png).webp({ quality: 90 }).bytes(),
			);
		});
	}
}

test("captures the drive for the web feature graphic", async ({ browser }) => {
	// The window in the graphic is 760px wide at double density: a 1280x800
	// page at 1.25 fills it without a resample worth seeing.
	const context = await browser.newContext({
		storageState: AUTH_STORAGE_STATE,
		viewport: { width: 1280, height: 800 },
		deviceScaleFactor: 1.25,
		colorScheme: "dark",
	});
	const page = await context.newPage();
	await page.goto("/browse");
	await expect(page.getByText(/my drive/i).first()).toBeVisible({
		timeout: 15_000,
	});
	await page.waitForFunction(() =>
		document.documentElement.classList.contains("dark"),
	);
	// The list: every kind's preview beside its name, and a track's takes.
	await listWithTakes(page);
	await settle(page);
	await mkdir(GRAPHICS_DIR, { recursive: true });
	await Bun.write(
		join(GRAPHICS_DIR, "web.webp"),
		await new Bun.Image(await page.screenshot()).webp({ quality: 90 }).bytes(),
	);
	await context.close();
});

test("writes an index of what was captured", async () => {
	const lines = SHOTS.flatMap((shot) =>
		["", "-dark"].map(
			(suffix) =>
				`- \`${shot.name}${suffix}.webp\` — ${typeof shot.path === "string" ? shot.path : "a seeded file's editor"}`,
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
