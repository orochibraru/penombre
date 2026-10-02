import { expect, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	chooseMenuItem,
	expectItemVisible,
	goToBrowse,
	rightClickItem,
	sameOrigin,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

// A browse URL is the viewer's own drive; `/go/folder/<id>` names the folder
// and sends each viewer to wherever they can reach it.
test.describe("folder links", () => {
	test("copy link hands out /go/folder, which opens the folder", async ({
		page,
		context,
	}) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		const name = `e2e-link-${Date.now()}`;
		const created = await page.request.post("/api/v1/storage/folder", {
			data: { name },
		});
		expect(created.ok()).toBeTruthy();
		const id = (await created.json()).data.id as string;

		await goToBrowse(page);
		await page.waitForLoadState("networkidle");
		await expectItemVisible(page, name);
		await rightClickItem(page, name);
		await chooseMenuItem(page, name, /copy link/i, () =>
			expect
				.poll(() => page.evaluate(() => navigator.clipboard.readText()), {
					timeout: 5000,
				})
				.toContain(`/go/folder/${id}`),
		);

		await page.goto(`/go/folder/${id}`);
		await expect(page).toHaveURL(new RegExp(`/browse/${id}$`));
	});

	test("a shared drive's folder resolves into the drive", async ({ page }) => {
		const drive = await page.request.post("/api/v1/drives", {
			data: { name: `e2e-drive link ${Date.now()}` },
		});
		const driveId = (await drive.json()).data.id as string;
		try {
			const folder = await page.request.post(
				`/api/v1/storage/folder?drive=${driveId}`,
				{ data: { name: "inside" } },
			);
			const { id, path } = (await folder.json()).data as {
				id: string;
				path: string;
			};

			await page.goto(`/go/folder/${id}`);
			await expect(page).toHaveURL(new RegExp(`/drives/${driveId}/${path}$`));
		} finally {
			await page.request.delete(`/api/v1/drives/${driveId}`, {
				headers: sameOrigin(),
			});
		}
	});

	test("an unknown folder is a 404, not a hint", async ({ page }) => {
		const response = await page.request.get(
			`/go/folder/${crypto.randomUUID()}`,
			{ maxRedirects: 0 },
		);
		expect(response.status()).toBe(404);
	});
});
