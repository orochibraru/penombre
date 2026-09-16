import { expect, type Page, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	chooseMenuItem,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	rightClickItem,
	waitForDialog,
} from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** Removed after each test, like `drives.spec.ts`, so screenshots stay clean. */
const PREFIX = "e2e-drive transfer";

async function createDrive(page: Page, name: string): Promise<string> {
	const resp = await page.request.post("/api/v1/drives", { data: { name } });
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.id as string;
}

async function createFolder(page: Page, name: string, query = "") {
	const resp = await page.request.post(`/api/v1/storage/folder${query}`, {
		data: { name },
	});
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.id as string;
}

async function createFile(page: Page, name: string, query = "") {
	const resp = await page.request.post(`/api/v1/storage/file${query}`, {
		data: { name, size: 16 },
	});
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.finalName as string;
}

test.describe("copy and move between drives", () => {
	test.afterEach(async ({ request }) => {
		const resp = await request.get("/api/v1/drives");
		if (!resp.ok()) {
			return;
		}
		const drives = (await resp.json()).data as { id: string; name: string }[];
		for (const drive of drives.filter((d) => d.name.startsWith(PREFIX))) {
			await request.delete(`/api/v1/drives/${drive.id}`);
		}
	});

	test("copying a file into a shared drive keeps the original", async ({
		page,
	}) => {
		await page.goto("/browse");
		const drive = await createDrive(page, `${PREFIX} copy ${Date.now()}`);
		const name = `e2e-copy-${Date.now()}.txt`;
		const path = await createFile(page, name);

		const resp = await page.request.post("/api/v1/storage/transfer", {
			data: {
				items: [{ path, type: "file" }],
				destination: { drive, folder: "" },
				mode: "copy",
			},
		});
		expect(resp.ok()).toBeTruthy();
		expect((await resp.json()).data.successCount).toBe(1);

		await page.goto(`/drives/${drive}`);
		await page.waitForLoadState("networkidle");
		await expectItemVisible(page, name);

		await goToBrowse(page);
		await expectItemVisible(page, name);
	});

	test("moving a folder out of a drive brings its contents along", async ({
		page,
	}) => {
		await page.goto("/browse");
		const drive = await createDrive(page, `${PREFIX} move ${Date.now()}`);
		const folderName = `e2e-moved-${Date.now()}`;
		const folder = await createFolder(page, folderName, `?drive=${drive}`);
		const inside = `inside-${Date.now()}.txt`;
		await createFile(page, inside, `?drive=${drive}&folder=${folder}`);

		const resp = await page.request.post(
			`/api/v1/storage/transfer?drive=${drive}`,
			{
				data: {
					items: [{ path: folder, type: "folder" }],
					destination: { folder: "" },
					mode: "move",
				},
			},
		);
		expect(resp.ok()).toBeTruthy();
		expect((await resp.json()).data.successCount).toBe(1);

		await page.goto(`/drives/${drive}`);
		await page.waitForLoadState("networkidle");
		await expectItemAbsent(page, folderName);

		await goToBrowse(page);
		await expectItemVisible(page, folderName);
		const moved = await page.request.get("/api/v1/storage/folder/tree");
		const folders = (await moved.json()).data as {
			name: string;
			path: string;
		}[];
		const landed = folders.find((f) => f.name === folderName);
		expect(landed).toBeTruthy();
		await goToBrowse(page, landed?.path);
		await expectItemVisible(page, inside);
	});

	test("Copy to… picks another drive from the dialog", async ({ page }) => {
		await page.goto("/browse");
		const driveName = `${PREFIX} dialog ${Date.now()}`;
		const drive = await createDrive(page, driveName);
		const folderName = `e2e-copy-dialog-${Date.now()}`;
		await createFolder(page, folderName);

		await goToBrowse(page);
		await rightClickItem(page, folderName);
		await chooseMenuItem(page, folderName, "Copy to…", () =>
			waitForDialog(page, /copy/i),
		);

		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: "Destination" }).click();
		await page.getByRole("option", { name: driveName }).click();
		const copyHere = dialog.getByRole("button", { name: "Copy here" });
		await expect(copyHere).toBeEnabled();
		await copyHere.click();
		await expect(dialog).toBeHidden({ timeout: 10_000 });

		await page.goto(`/drives/${drive}`);
		await page.waitForLoadState("networkidle");
		await expectItemVisible(page, folderName);
	});
});

test.describe("duplicate", () => {
	test("a folder duplicates in place from the context menu", async ({
		page,
	}) => {
		await page.goto("/browse");
		const folderName = `e2e-dup-${Date.now()}`;
		const folder = await createFolder(page, folderName);
		await createFile(page, "kept.txt", `?folder=${folder}`);

		await goToBrowse(page);
		await rightClickItem(page, folderName);
		await chooseMenuItem(page, folderName, "Duplicate", () =>
			expectItemVisible(page, `${folderName} (1)`),
		);
	});
});
