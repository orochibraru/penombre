import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, expectItemVisible, sameOrigin } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

const IMAGE = readFileSync(path.resolve("e2e/fixtures/test-image.png"));

test.describe("categories", () => {
	// A category has no folder in its URL and a listing key is only the last
	// path segment, so a file inside a folder used to be addressed by a path
	// that matched nothing: every image in Images 404'd.
	test("opens an image that lives inside a folder", async ({ page }) => {
		const stamp = Date.now();
		const folder = await page.request.post("/api/v1/storage/folder", {
			data: { name: `e2e-category-${stamp}` },
		});
		expect(folder.ok()).toBeTruthy();
		const folderId = (await folder.json()).data.id as string;

		const name = `nested-${stamp}.png`;
		const created = await page.request.post(
			`/api/v1/storage/file?folder=${folderId}`,
			{ data: { name, size: IMAGE.length } },
		);
		expect(created.ok()).toBeTruthy();
		const fileId = (await created.json()).data.metadata.id as string;

		const uploaded = await page.request.post(
			`/api/v1/storage/file/${fileId}/upload`,
			{
				headers: sameOrigin(),
				multipart: {
					file: { name, mimeType: "image/png", buffer: IMAGE },
				},
			},
		);
		expect(uploaded.ok()).toBeTruthy();

		await page.goto("/categories/IMAGES");
		await page.waitForLoadState("networkidle");
		await expectItemVisible(page, name);

		const raw = page.waitForResponse(
			(r) =>
				r.url().includes("/api/v1/storage/file/") &&
				r.url().includes("raw=true"),
		);
		await page.getByText(name, { exact: true }).first().click();
		expect((await raw).status()).toBe(200);
	});
});
