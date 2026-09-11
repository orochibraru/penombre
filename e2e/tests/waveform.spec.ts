import { join } from "node:path";
import process from "node:process";
import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, openUploadDialog } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/**
 * Waveforms are peak data, not a picture.
 *
 * The old implementation baked an orange bitmap at generation time, so a
 * waveform never followed a later accent change. This watches the request the
 * tile actually makes, rather than guessing at an endpoint, and then checks
 * the tile draws themeable SVG from it.
 */
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
});
