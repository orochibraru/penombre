import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemVisible,
	goToBrowse,
	openUploadDialog,
	sameOrigin,
	setVersioning,
	unfold,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

async function upload(page: Page, name: string, body: string) {
	await uploadBytes(page, name, "text/plain", Buffer.from(body));
}

async function uploadBytes(
	page: Page,
	name: string,
	mimeType: string,
	buffer: Buffer,
) {
	await openUploadDialog(page);
	const dialog = page.getByRole("dialog");
	await dialog
		.locator("input[type=file]")
		.first()
		.setInputFiles({ name, mimeType, buffer });
	await dialog.getByRole("button", { name: /upload/i }).click();
	await expectItemVisible(page, name);
	await page.waitForLoadState("networkidle");
}

async function setLayout(page: Page, layout: "grid" | "list") {
	const response = await page.request.put("/api/v1/preferences", {
		data: { layout },
		headers: sameOrigin(),
	});
	expect(response.ok()).toBeTruthy();
}

/** A version's row leads with its label and never repeats the file name. */
const versionRow = (page: Page, label: string) =>
	page.getByRole("row").filter({ hasText: new RegExp(`^\\s*${label}\\b`) });

test.describe("file versioning", () => {
	// Four uploads and the admin switch twice; running out of time would skip
	// the `finally` that turns versioning back off for every other spec.
	test.setTimeout(90_000);

	test("versions unfold under the file, play, and restore from their row", async ({
		page,
	}) => {
		await setVersioning(page, true);
		try {
			const created = await page.request.post("/api/v1/storage/folder", {
				data: { name: `e2e-versions-${Date.now()}` },
			});
			const folderId = (await created.json()).data.id as string;
			const name = "draft.txt";

			await goToBrowse(page, folderId);
			await upload(page, name, "first take");
			await upload(page, name, "second take");
			await expect(page.getByText(/draft \(1\)\.txt/)).toHaveCount(0);

			await unfold(page, name);
			const v1 = versionRow(page, "v1");
			await expect(v1).toBeVisible();

			await v1.click({ button: "right" });
			await page
				.getByRole("menuitem", { name: /^restore$/i })
				.dispatchEvent("click");
			await page
				.getByRole("dialog")
				.getByRole("button", { name: /^restore$/i })
				.click();
			await expect(versionRow(page, "v2")).toBeVisible();
			await expect(
				page
					.getByRole("row")
					.filter({ hasText: name })
					.getByTitle("Hide versions")
					.filter({ hasText: "v3" }),
			).toBeVisible();

			const listing = await page.request.get(
				`/api/v1/storage/list/${folderId}`,
			);
			const files = (await listing.json()).data.list as {
				metadata: { id: string; name?: string };
			}[];
			expect(files.filter((f) => f.metadata.name === name)).toHaveLength(1);
			const id = files.find((f) => f.metadata.name === name)?.metadata.id;
			const raw = await page.request.get(`/api/v1/storage/file/${id}?raw=true`);
			expect(await raw.text()).toBe("first take");

			// Folded away, so the take's `v1` below is the only one on screen.
			await page
				.getByRole("row")
				.filter({ hasText: name })
				.getByTitle("Hide versions")
				.click();
			await expect(versionRow(page, "v1")).toHaveCount(0);

			// An earlier take plays in the bottom player under its own title.
			const track = "take.wav";
			const audio = readFileSync(
				path.resolve("tests/e2e/fixtures/test-audio.wav"),
			);
			await uploadBytes(page, track, "audio/wav", audio);
			await uploadBytes(page, track, "audio/wav", audio);
			await unfold(page, track);
			const take = versionRow(page, "v1");
			await expect(async () => {
				await take.getByText("v1").click();
				await expect(
					page.locator(`[title="${track} · v1"]`).first(),
				).toBeAttached({ timeout: 5000 });
			}).toPass({ timeout: 30_000 });

			// The player switches takes in place: back to the current file.
			await page
				.getByRole("combobox", { name: /version/i })
				.selectOption({ index: 0 });
			await expect
				.poll(() =>
					page.evaluate(
						() =>
							(document.getElementById("music-player") as HTMLAudioElement)
								?.src ?? "",
					),
				)
				.not.toContain("/versions/");

			// A tile has nowhere to unfold into: the grid opens the modal.
			await setLayout(page, "grid");
			try {
				await goToBrowse(page, folderId);
				await page
					.getByTitle("Show versions")
					.filter({ hasText: "v3" })
					.click();
				const history = page.getByRole("dialog");
				await expect(history.getByRole("heading")).toContainText(
					/version history/i,
				);
				await expect(history.getByText(/^v2$/)).toBeVisible();
				await expect(history.getByText(/^v1$/)).toBeVisible();
			} finally {
				await setLayout(page, "list");
			}
		} finally {
			await setVersioning(page, false);
		}
	});
});
