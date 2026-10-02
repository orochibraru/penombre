import process from "node:process";
import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "Admin1234!";

/**
 * A remembered account that prefers a passkey is prompted on arrival.
 *
 * Its own context, signed out: the remembered address is only written by a
 * sign-in through the page. Chromium's virtual authenticator answers the
 * ceremony, so the modal prompt completes without a human.
 */
test.describe("Preferred passkey sign-in", () => {
	test("the passkey prompt opens on its own", async ({ browser }) => {
		const context = await browser.newContext({ storageState: undefined });
		const page = await context.newPage();
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));

		const cdp = await context.newCDPSession(page);
		await cdp.send("WebAuthn.enable");
		await cdp.send("WebAuthn.addVirtualAuthenticator", {
			options: {
				protocol: "ctap2",
				transport: "internal",
				hasResidentKey: true,
				hasUserVerification: true,
				isUserVerified: true,
				automaticPresenceSimulation: true,
			},
		});

		await page.goto("/auth/sign-in");
		await page.locator("#email").fill(EMAIL);
		await page.getByRole("button", { name: "Continue", exact: true }).click();
		await page.locator("#password").fill(PASSWORD);
		await page.getByRole("button", { name: "Sign in", exact: true }).click();
		await page.waitForURL("**/browse**", { timeout: 15_000 });

		await page.goto("/account/security");
		await page.waitForLoadState("networkidle");
		const passkeys = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Passkeys" });
		await passkeys
			.getByRole("button", { name: "Register a new Passkey" })
			.click();
		await expect(passkeys.getByRole("button", { name: "Delete" })).toBeVisible({
			timeout: 15_000,
		});

		const preferred = page
			.locator('[data-slot="card"]')
			.filter({ hasText: "Preferred sign-in method" });
		try {
			await preferred
				.getByRole("radio", { name: "Passkey", exact: true })
				.click();
			await expect(page.getByText("Settings saved")).toBeVisible();

			await context.clearCookies();
			await page.goto("/auth/sign-in");
			// Nothing is clicked: the remembered address is looked up and the
			// ceremony starts by itself.
			await page.waitForURL("**/browse**", { timeout: 15_000 });
		} finally {
			await page.goto("/account/security");
			await page.waitForLoadState("networkidle");
			await preferred
				.getByRole("radio", { name: "No preference", exact: true })
				.click();
			await passkeys.getByRole("button", { name: "Delete" }).click();
			await page
				.getByRole("dialog")
				.getByRole("button", { name: "Delete" })
				.click();
			await expect(passkeys.getByRole("button", { name: "Delete" })).toBeHidden(
				{
					timeout: 15_000,
				},
			);
			await context.close();
		}

		expect(errors).toEqual([]);
	});
});
