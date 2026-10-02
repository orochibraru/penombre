import { expect, type Page, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, expectItemVisible } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** better-auth refuses a mutating call with no `Origin` as a CSRF guard. */
const origin = (page: Page) => ({ origin: new URL(page.url()).origin });

/**
 * A share addressed to a person opens in the ordinary file UI, scoped to what
 * was shared: the recipient browses into the folder, and sees nothing of the
 * owner's drive around it.
 */
test.describe("shared with me", () => {
	test.setTimeout(60_000);

	test("a shared folder is browsable by its recipient", async ({
		page,
		browser,
	}) => {
		await page.goto("/browse");
		const stamp = Date.now();
		const email = `e2e-recipient-${stamp}@example.com`;
		const password = "Recipient1234!";

		const created = await page.request.post("/api/v1/auth/admin/create-user", {
			data: { email, password, name: `Recipient ${stamp}`, role: "user" },
			headers: origin(page),
		});
		expect(created.ok()).toBeTruthy();
		const recipientId = (await created.json()).user.id as string;

		const folderName = `e2e-shared-folder-${stamp}`;
		const folder = await page.request.post("/api/v1/storage/folder", {
			data: { name: folderName },
		});
		const folderId = (await folder.json()).data.id as string;
		const inside = `inside-${stamp}.txt`;
		await page.request.post(`/api/v1/storage/file?folder=${folderId}`, {
			data: { name: inside, size: 8 },
		});
		const outside = `outside-${stamp}.txt`;
		await page.request.post("/api/v1/storage/file", {
			data: { name: outside, size: 8 },
		});

		const shared = await page.request.post("/api/v1/sharings", {
			data: {
				resourceType: "folder",
				resourceId: folderId,
				userIds: [recipientId],
				permission: "read",
			},
		});
		expect(shared.ok()).toBeTruthy();

		const context = await browser.newContext({ storageState: undefined });
		const recipient = await context.newPage();
		await recipient.goto("/auth/sign-in");
		const signIn = await recipient.request.post("/api/v1/auth/sign-in/email", {
			data: { email, password },
			headers: origin(recipient),
		});
		expect(signIn.ok()).toBeTruthy();

		await recipient.goto("/shared-with-me");
		await recipient.waitForLoadState("networkidle");
		const sidebarLink = recipient
			.locator("[data-slot=sidebar]")
			.getByRole("link", { name: folderName });
		await expect(sidebarLink).toBeVisible();

		// Followed rather than clicked: a new account's onboarding dialog
		// covers the page on its first visit.
		const href = await sidebarLink.getAttribute("href");
		expect(href).toBeTruthy();
		await recipient.goto(href as string);
		await recipient.waitForURL(`**/shared-with-me/**/${folderId}`);
		await recipient.waitForLoadState("networkidle");
		await expectItemVisible(recipient, inside);
		await expect(recipient.getByText(outside)).toHaveCount(0);

		// Nothing outside the share answers, even by a guessed path.
		const shareId = new URL(recipient.url()).pathname.split("/")[2];
		const outsideScope = await recipient.request.get(
			`/api/v1/storage/list?share=${shareId}`,
		);
		const body = await outsideScope.json();
		expect(JSON.stringify(body)).not.toContain(outside);

		await context.close();
	});
});
