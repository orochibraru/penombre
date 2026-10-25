import { describe, expect, test } from "bun:test";

import { twoFactor } from "better-auth/plugins";

import {
	challengeCodeSignIn,
	challengePage,
	magicLinkChallenge,
} from "./two-factor";

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

describe("magicLinkChallenge", () => {
	const [hook] = magicLinkChallenge.hooks.after;

	function run(returned: unknown, query: Record<string, unknown>) {
		return hook.handler({ context: { returned }, query } as never);
	}

	test("runs on the magic link only", () => {
		expect(hook.matcher({ path: "/magic-link/verify" } as never)).toBe(true);
		expect(hook.matcher({ path: "/sign-in/email-otp" } as never)).toBe(false);
	});

	test("redirects a challenged link to the two-factor page", async () => {
		const redirect = await run(
			{ twoFactorRedirect: true },
			{ callbackURL: "/browse" },
		).then(
			() => undefined,
			(error: { status: string; headers: Headers }) => error,
		);
		expect(redirect?.status).toBe("FOUND");
		expect(redirect?.headers.get("location")).toBe(
			`/auth/two-factor?next=${encodeURIComponent("/browse")}`,
		);
	});

	test("a callback that is not a string is treated as none", async () => {
		const redirect = await run(
			{ twoFactorRedirect: true },
			{ callbackURL: ["/a", "/b"] },
		).then(
			() => undefined,
			(error: { headers: Headers }) => error,
		);
		expect(redirect?.headers.get("location")).toBe(
			`/auth/two-factor?next=${encodeURIComponent("/")}`,
		);
	});

	test("leaves the link's own answer alone without a challenge", async () => {
		expect(await run({ status: 302 }, { callbackURL: "/browse" })).toBe(
			undefined,
		);
	});
});
