import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	openUploadDialog,
} from "../helpers";

const FIXTURE_DIR = path.resolve("e2e/fixtures");

test.use({ storageState: AUTH_STORAGE_STATE });

/** Declared by `compose.e2e.yaml` as `VOLUME_E2E_PATH`. */
const VOLUME = "e2e";

/**
 * A mounted volume is a volume like a shared drive is, addressed with
 * `?volume=<name>`. Without that parameter every call falls back to the
 * caller's personal drive, which is how a scanned mount ended up listing its
 * files and then 404ing every one of them.
 *
 * Files are put on the mount through the API rather than by writing to the
 * container's filesystem: what matters here is that the volume's rows are
 * reachable, not that the scanner found them (`scan.test.ts` covers that).
 */
async function createOnVolume(page: Page, name: string): Promise<string> {
	const resp = await page.request.post(
		`/api/v1/storage/file?volume=${VOLUME}`,
		{ data: { name, size: 12 } },
	);
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.metadata.id as string;
}

async function goToVolume(page: Page, sub = "") {
	await page.goto(`/volumes/${VOLUME}${sub}`);
	await page.waitForLoadState("networkidle");
}

test.describe("Mounted volumes", () => {
	test("lists its files, and My Drive does not", async ({ page }) => {
		const name = `volume-only-${Date.now()}.txt`;
		await createOnVolume(page, name);

		await goToVolume(page);
		await expectItemVisible(page, name);

		await page.goto("/browse");
		await expectItemAbsent(page, name);
	});

	// The bug this suite exists for: the listing worked and every file 404'd,
	// because the proxy route had no idea which volume to look in.
	test("serves a file's bytes rather than 404ing", async ({ page }) => {
		await goToVolume(page);

		// Through the dialog, so the whole client path is exercised: the
		// metadata call, the worker's XHR and the listing all have to agree
		// on which volume this is.
		await openUploadDialog(page);
		const dialog = page.getByRole("dialog");
		await dialog
			.locator("input[type=file]")
			.first()
			.setInputFiles(path.join(FIXTURE_DIR, "test-upload.txt"));
		await dialog.getByRole("button", { name: /upload/i }).click();
		await expectItemVisible(page, "test-upload.txt");

		// A row's key is its storage key, not its name — the same thing the
		// page puts in an `<img src>`.
		const listing = await page.request.get(
			`/api/v1/storage/list?volume=${VOLUME}`,
		);
		const items = (await listing.json()).data.list as {
			key: string;
			metadata: { name?: string };
		}[];
		const key = items.find(
			(item) => item.metadata.name === "test-upload.txt",
		)?.key;
		expect(key).toBeTruthy();

		const raw = await page.request.get(
			`/api/v1/storage/file/${encodeURIComponent(key as string)}?raw=true&volume=${VOLUME}`,
		);
		expect(raw.status()).toBe(200);
		expect((await raw.text()).length).toBeGreaterThan(0);

		// Without the volume the same key means nothing: that 404 is what the
		// whole page used to do.
		const personal = await page.request.get(
			`/api/v1/storage/file/${encodeURIComponent(key as string)}?raw=true`,
		);
		expect(personal.status()).toBe(404);
	});

	test("a folder on a volume opens inside the volume", async ({ page }) => {
		const folderName = `volume-folder-${Date.now()}`;
		const folder = await page.request.post(
			`/api/v1/storage/folder?volume=${VOLUME}`,
			{ data: { name: folderName } },
		);
		expect(folder.ok()).toBeTruthy();
		const folderPath = (await folder.json()).data.path as string;

		const inside = `inside-${Date.now()}.txt`;
		const file = await page.request.post(
			`/api/v1/storage/file?volume=${VOLUME}&folder=${encodeURIComponent(folderPath)}`,
			{ data: { name: inside, size: 12 } },
		);
		expect(file.ok()).toBeTruthy();

		await goToVolume(page);
		await expectItemVisible(page, folderName);

		// Clicking the row must stay on the volume, not land on /browse.
		await page.getByText(folderName).first().click();
		await page.waitForURL(`**/volumes/${VOLUME}/${folderPath}`);
		await expectItemVisible(page, inside);
	});

	test("trashing on a volume lands in the volume's trash", async ({ page }) => {
		const name = `volume-trash-${Date.now()}.txt`;
		const id = await createOnVolume(page, name);

		const resp = await page.request.put(
			`/api/v1/storage/file/${id}?volume=${VOLUME}`,
			{ data: { isTrashed: true } },
		);
		expect(resp.ok()).toBeTruthy();

		await goToVolume(page);
		await expectItemAbsent(page, name);

		await goToVolume(page, "/trash");
		await expectItemVisible(page, name);

		await page.goto("/trash");
		await expectItemAbsent(page, name);
	});

	test("an unknown volume is not found", async ({ page }) => {
		const resp = await page.request.get(
			"/api/v1/storage/list?volume=nope-not-a-volume",
		);
		expect(resp.status()).toBe(404);
	});

	test("Rescan starts a pass the event stream reports", async ({ page }) => {
		await goToVolume(page);
		// Enabled means the pass this visit may have started is over, so the
		// one the stream sees next is ours.
		const rescan = page.getByRole("button", { name: "Rescan" });
		await expect(rescan).toBeEnabled({ timeout: 15_000 });

		// Read in the page: the stream never ends, so only its first events.
		const events = page.evaluate(async (volume) => {
			const response = await fetch(`/api/v1/volumes/${volume}/scan/events`);
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let text = "";
			const deadline = Date.now() + 10_000;
			while (reader && Date.now() < deadline) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}
				text += decoder.decode(value);
				if (
					text.includes('"scanning":true') &&
					text.includes('"scanning":false')
				) {
					break;
				}
			}
			await reader?.cancel();
			return { type: response.headers.get("content-type"), text };
		}, VOLUME);

		await rescan.click();

		const { type, text } = await events;
		expect(type).toContain("text/event-stream");
		expect(text).toContain("data: ");
		expect(text).toContain('"scanning":true');
	});
});
