import { describe, expect, test } from "bun:test";
import { twoFactor } from "better-auth/plugins";
import { challengeCodeSignIn, challengePage } from "./two-factor";

describe("challengeCodeSignIn", () => {
	test("the two-factor challenge also follows an emailed code or link", () => {
		const plugin = challengeCodeSignIn(twoFactor({ issuer: "Test" }));
		const matches = (path: string) =>
			(plugin.hooks?.after ?? []).some((hook) =>
				hook.matcher({ path } as never),
			);
		expect(matches("/sign-in/email")).toBe(true);
		expect(matches("/sign-in/email-otp")).toBe(true);
		expect(matches("/magic-link/verify")).toBe(true);
		expect(matches("/email-otp/verify-email")).toBe(false);
	});
});

describe("challengePage", () => {
	const challenged = { twoFactorRedirect: true, twoFactorMethods: ["totp"] };

	test("sends a challenged link to the two-factor page, keeping next", () => {
		expect(challengePage(challenged, "%2Fbrowse%2Fa%3Fx%3D1")).toBe(
			`/auth/two-factor?next=${encodeURIComponent("/browse/a?x=1")}`,
		);
		expect(challengePage({ _flag: "json", body: challenged }, undefined)).toBe(
			`/auth/two-factor?next=${encodeURIComponent("/")}`,
		);
	});

	test("never carries another site along", () => {
		expect(challengePage(challenged, "https://evil.example/x")).toBe(
			"/auth/two-factor",
		);
	});

	test("leaves an unchallenged answer alone", () => {
		expect(challengePage(undefined, "/")).toBeNull();
		expect(challengePage({ status: 302 }, "/")).toBeNull();
	});
});
