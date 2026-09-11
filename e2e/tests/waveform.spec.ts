import { join } from "node:path";
import process from "node:process";
import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, openUploadDialog } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** Peaks, not a bitmap — a baked-in colour never follows the accent. */
test.describe("Waveforms", () => {
	test("a waveform tile fetches peaks and draws them as SVG", async ({
		page,
	}) => {
		await goToBrowse(page);
		await openUploadDialog(page);

		const dialog = page.getByRole("dialog");
		await dialog
			.locator("input[type=file]")
			.first()
			.setInputFiles(join(process.cwd(), "e2e", "fixtures", "test-audio.wav"));
		await dialog.getByRole("button", { name: /upload/i }).click();
		await expect(page.getByText("test-audio.wav").first()).toBeVisible({
			timeout: 20_000,
		});

		// Waveform tiles only exist in grid mode. Set it through the
		// preferences API rather than the toggle: the control reflects a saved
		// preference, so clicking it is only correct from a known state.
		await page.request.put("/api/v1/preferences", {
			data: { layout: "grid" },
		});

		// Armed before the reload that triggers it: the tile requests its
		// peaks as soon as it renders, which can be before a listener added
		// afterwards would see it.
		// Matched on content type, not just the path: every tile in the drive
		// requests a thumbnail, and the image ones answer first.
		const peaksResponse = page.waitForResponse(
			(res) =>
				res.url().includes("thumbnail=true") &&
				res.status() === 200 &&
				(res.headers()["content-type"] ?? "").includes("application/json"),
			{ timeout: 30_000 },
		);
		await page.reload();
		const response = await peaksResponse;

		expect(response.headers()["content-type"]).toContain("application/json");
		const peaks = (await response.json()) as number[];
		expect(Array.isArray(peaks)).toBe(true);
		expect(peaks.length).toBeGreaterThan(50);
		expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0);
		expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
		// The fixture is a quiet second followed by a loud one (measured range
		// ~0.86), so a flat result means the peaks were never read from the
		// audio at all. Asserted well under the real value to stay robust to
		// ffmpeg's resampling.
		expect(Math.max(...peaks) - Math.min(...peaks)).toBeGreaterThan(0.5);

		// `currentColor` is what lets the theme recolour it; an <img> could not.
		// Scoped by data-slot: plenty of icons on the page are also SVG.
		const waveform = page.locator('[data-slot="waveform"]').first();
		await expect(waveform).toBeVisible({ timeout: 15_000 });
		await expect(waveform).toHaveAttribute("fill", "currentColor");
		await expect(waveform.locator("rect").first()).toBeVisible();
	});

	/**
	 * The scrubber in the notes panel drives the global player through a
	 * store, and the player used to answer by reading that store and writing
	 * it back inside the same effect — `effect_update_depth_exceeded`, and a
	 * tab that hung the moment anyone clicked the waveform. Asserting on
	 * `pageerror` is the point: everything below it still "worked" visually
	 * while the page was busy-looping itself to death.
	 */
	test("scrubbing the notes waveform seeks, pauses and does not loop", async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		await goToBrowse(page);
		await openUploadDialog(page);
		const upload = page.getByRole("dialog");
		await upload
			.locator("input[type=file]")
			.first()
			.setInputFiles(join(process.cwd(), "e2e", "fixtures", "test-audio.wav"));
		await upload.getByRole("button", { name: /upload/i }).click();
		const row = page.getByText("test-audio.wav").first();
		await expect(row).toBeVisible({ timeout: 20_000 });

		// Loads it into the global player, which is where the playhead lives.
		await row.click();
		await expect(page.locator('[data-slot="waveform"]').first()).toBeVisible({
			timeout: 20_000,
		});

		await row.click({ button: "right" });
		await page.getByRole("menuitem", { name: /notes/i }).click();

		const notes = page.getByRole("dialog");
		const scrubber = notes.locator('button[aria-label="Seek"]').first();
		await expect(scrubber).toBeVisible({ timeout: 15_000 });

		const box = await scrubber.boundingBox();
		expect(box).not.toBeNull();
		await page.mouse.click(
			(box?.x ?? 0) + (box?.width ?? 0) * 0.6,
			(box?.y ?? 0) + (box?.height ?? 0) / 2,
		);

		// Clicking a moment means "I want to say something about here": the
		// playhead moves, playback stops, and the caret lands in the box.
		await expect
			.poll(
				() =>
					page.evaluate(
						() =>
							(document.getElementById("music-player") as HTMLAudioElement)
								?.currentTime ?? 0,
					),
				{ timeout: 10_000 },
			)
			.toBeGreaterThan(0);
		expect(
			await page.evaluate(
				() =>
					(document.getElementById("music-player") as HTMLAudioElement)?.paused,
			),
		).toBe(true);
		await expect(notes.getByRole("textbox")).toBeFocused();

		expect(errors).toEqual([]);
	});
});
