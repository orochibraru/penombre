import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
	AUTH_STORAGE_STATE,
	expectItemAbsent,
	expectItemVisible,
	goToBrowse,
	openUploadDialog,
} from "../helpers";

const FIXTURE_DIR = path.resolve("e2e/fixtures");

/**
 * Every drive these tests make is named with this prefix and removed at the
 * end, failures included. A drive lingering on the instance is not just
 * clutter: it shows up in the sidebar of every screenshot `bun run
 * screenshots` takes afterwards.
 */
const PREFIX = "e2e-drive";

test.use({ storageState: AUTH_STORAGE_STATE });

// A shared drive is its own volume: the same storage API serves it, addressed
// with `?drive=<id>`. These tests go through that API and assert what the
// pages then show, which is also the isolation guarantee — a drive's files
// must never appear in My Drive.

async function createDrive(page: Page, name: string): Promise<string> {
	const resp = await page.request.post("/api/v1/drives", { data: { name } });
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.id as string;
}

async function deleteDrive(page: Page, id: string) {
	const resp = await page.request.delete(`/api/v1/drives/${id}`);
	expect(resp.ok()).toBeTruthy();
}

async function createFolderIn(page: Page, drive: string, name: string) {
	const resp = await page.request.post(
		`/api/v1/storage/folder?drive=${drive}`,
		{ data: { name } },
	);
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.id as string;
}

async function createFileIn(page: Page, drive: string, name: string) {
	const resp = await page.request.post(`/api/v1/storage/file?drive=${drive}`, {
		data: { name, size: 64 },
	});
	expect(resp.ok()).toBeTruthy();
	return (await resp.json()).data.metadata.id as string;
}

async function goToDrive(page: Page, drive: string, sub = "") {
	await page.goto(`/drives/${drive}${sub}`);
	await page.waitForLoadState("networkidle");
}

test.describe("shared drives", () => {
	// `afterEach`, not `afterAll`: the request fixture is test-scoped.
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

	test("a drive lists its own files, and My Drive never does", async ({
		page,
	}) => {
		const drive = await createDrive(page, `${PREFIX} team ${Date.now()}`);
		const fileName = `drive-only-${Date.now()}.txt`;
		await createFileIn(page, drive, fileName);

		await goToDrive(page, drive);
		await expectItemVisible(page, fileName);

		await goToBrowse(page);
		await expectItemAbsent(page, fileName);

		await deleteDrive(page, drive);
	});

	test("the drive appears in the sidebar and on the drives page", async ({
		page,
	}) => {
		const name = `${PREFIX} sidebar ${Date.now()}`;
		const drive = await createDrive(page, name);

		await page.goto("/drives");
		await page.waitForLoadState("networkidle");
		await expect(page.getByRole("link", { name }).first()).toBeVisible();

		await deleteDrive(page, drive);
		await page.goto("/drives");
		await page.waitForLoadState("networkidle");
		await expect(page.getByRole("link", { name })).toHaveCount(0);
	});

	test("a folder created in a drive is browsable inside it", async ({
		page,
	}) => {
		const drive = await createDrive(page, `${PREFIX} folders ${Date.now()}`);
		const folderName = `drive-folder-${Date.now()}`;
		const folderId = await createFolderIn(page, drive, folderName);
		const inside = `inside-${Date.now()}.txt`;

		const resp = await page.request.post(
			`/api/v1/storage/file?drive=${drive}&folder=${folderId}`,
			{ data: { name: inside, size: 32 } },
		);
		expect(resp.ok()).toBeTruthy();

		await goToDrive(page, drive, `/${folderId}`);
		await expectItemVisible(page, inside);

		await deleteDrive(page, drive);
	});

	// A trashed file has to land in the drive's own trash: the personal one
	// lists the caller's rows, and a drive's belong to the drive.
	test("trashing in a drive shows up in the drive's trash", async ({
		page,
	}) => {
		const drive = await createDrive(page, `${PREFIX} trash ${Date.now()}`);
		const fileName = `trashed-${Date.now()}.txt`;
		const fileId = await createFileIn(page, drive, fileName);

		const resp = await page.request.put(
			`/api/v1/storage/file/${fileId}?drive=${drive}`,
			{ data: { isTrashed: true } },
		);
		expect(resp.ok()).toBeTruthy();

		await goToDrive(page, drive);
		await expectItemAbsent(page, fileName);

		await goToDrive(page, drive, "/trash");
		await expectItemVisible(page, fileName);

		await page.goto("/trash");
		await page.waitForLoadState("networkidle");
		await expectItemAbsent(page, fileName);

		await deleteDrive(page, drive);
	});

	test("a drive is created from the page, and uploads land in it", async ({
		page,
	}) => {
		const name = `${PREFIX} created ${Date.now()}`;
		await page.goto("/drives");
		await page.waitForLoadState("networkidle");

		await page.getByRole("button", { name: /new shared drive/i }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await dialog.getByRole("textbox").fill(name);
		await dialog.getByRole("button", { name: /create drive/i }).click();

		const link = page.getByRole("link", { name }).first();
		await expect(link).toBeVisible();
		await link.click();
		await page.waitForLoadState("networkidle");

		// The upload dialog is the shared one: the job carries the drive from
		// the route, so the bytes must land here and not in My Drive.
		await openUploadDialog(page);
		const upload = page.getByRole("dialog");
		await upload
			.locator("input[type=file]")
			.first()
			.setInputFiles(path.join(FIXTURE_DIR, "test-upload.txt"));
		await upload.getByRole("button", { name: /upload/i }).click();
		await expectItemVisible(page, "test-upload.txt");

		// The members dialog opens on the drive and shows its owner.
		await page.getByRole("button", { name: /members/i }).click();
		const members = page.getByRole("dialog");
		await expect(members).toBeVisible();
		await expect(members.getByText(/owner/i).first()).toBeVisible();
		await page.keyboard.press("Escape");
	});
	// No "and not in My Drive" here: the fixture's name is the one the upload
	// suite puts there, so the assertion would read another test's file. The
	// isolation check is the first test, with a name nothing else uses.

	// A load runs *during* the navigation, so the API client must key the
	// drive off where it is going, not off the page it is leaving — otherwise
	// My Drive lists the shared drive's files until a full reload.
	test("leaving a drive by link shows My Drive's own files", async ({
		page,
	}) => {
		const drive = await createDrive(page, `${PREFIX} leaving ${Date.now()}`);
		const fileName = `left-behind-${Date.now()}.txt`;
		await createFileIn(page, drive, fileName);

		await goToDrive(page, drive);
		await expectItemVisible(page, fileName);

		// A client-side navigation, not a fresh document: that is the bug.
		await page.getByRole("link", { name: "My Drive" }).first().click();
		await page.waitForURL("**/browse");
		await expectItemAbsent(page, fileName);
	});

	// A guessed id must not tell anyone that the drive exists.
	test("a drive the caller is not on is not found", async ({ page }) => {
		const resp = await page.request.get(
			"/api/v1/storage/list?drive=00000000-0000-0000-0000-000000000000",
		);
		expect(resp.status()).toBe(404);
	});
});
