import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, goToBrowse, sameOrigin } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

const DRIVE = "e2e-drive search";

// Search is not scoped to the page: a file on a shared drive is found from My
// Drive, says where it lives, and opens there.
test("search finds a file on a shared drive and opens it there", async ({
	page,
}) => {
	const created = await page.request.post("/api/v1/drives", {
		data: { name: DRIVE },
	});
	expect(created.ok()).toBeTruthy();
	const drive = (await created.json()).data.id as string;
	try {
		const name = `setlist-${Date.now()}.txt`;
		const file = await page.request.post(
			`/api/v1/storage/file?drive=${drive}`,
			{ data: { name, size: 64 } },
		);
		expect(file.ok()).toBeTruthy();

		await goToBrowse(page);
		const box = page.getByRole("searchbox").filter({ visible: true });
		await box.fill(name);
		// The search runs from `keyup`, which `fill` never sends.
		await box.press("End");
		const hit = page.getByRole("button", { name: new RegExp(name) });
		await expect(hit).toBeVisible();
		await expect(hit).toContainText(DRIVE);

		await hit.click();
		await expect(page).toHaveURL(new RegExp(`/drives/${drive}`));
		await expect(page.getByRole("dialog")).toContainText(name);
	} finally {
		await page.request.delete(`/api/v1/drives/${drive}`, {
			headers: sameOrigin(),
		});
	}
});
