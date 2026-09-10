import type { Mock } from "bun:test";
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { auth } from "$lib/server/auth";
import { getConfig, isAuthBypassed } from "$lib/server/config";

const mockGetConfig = getConfig as Mock<typeof getConfig>;
const mockIsAuthBypassed = isAuthBypassed as Mock<typeof isAuthBypassed>;
const mockSignInSocial = auth.api.signInSocial as Mock<
	(...args: unknown[]) => Promise<{ url?: string }>
>;

const { load } = await import("./+page.server");

const authConfig = { enableEmailSignIn: true, enableOAuthSignIn: false };

/**
 * The config mock is module-level and shared across test files, so a value
 * set here with `mockReturnValue` would reconfigure every suite that runs
 * after this one. Restore test.setup's default when the file is done.
 */
const defaultConfig = {
	smtp: undefined,
	appName: "Penombre",
	origin: "http://localhost:5173",
	auth: {
		secret: "test-secret",
		enableEmailSignIn: true,
		minPasswordLength: 8,
	},
};

afterAll(() => {
	mockGetConfig.mockReturnValue(defaultConfig as never);
});

function event(search = "") {
	const url = new URL(`http://localhost/auth/sign-in${search}`);
	return { url, request: new Request(url) } as never;
}

function config(overrides: Record<string, unknown> = {}) {
	mockGetConfig.mockReturnValue({
		auth: authConfig,
		autoRedirectProvider: "",
		...overrides,
	} as never);
}

describe("load", () => {
	beforeEach(() => {
		mockIsAuthBypassed.mockReturnValue(false);
		mockSignInSocial.mockClear();
		mockSignInSocial.mockResolvedValue({ url: undefined });
		config();
	});

	test("returns authConfig from config", async () => {
		expect(await load(event())).toMatchObject({ authConfig } as never);
	});

	test("redirects home when auth is bypassed", async () => {
		mockIsAuthBypassed.mockReturnValue(true);

		expect(load(event())).rejects.toMatchObject({
			status: 302,
			location: "/",
		});
	});

	test("redirects to the provider when auto-redirect is configured", async () => {
		config({ autoRedirectProvider: "default" });
		mockSignInSocial.mockResolvedValue({
			url: "https://idp.example/authorize",
		});

		expect(load(event())).rejects.toMatchObject({
			status: 302,
			location: "https://idp.example/authorize",
		});
	});

	test("?form skips both redirects so nobody gets locked out", async () => {
		mockIsAuthBypassed.mockReturnValue(true);
		config({ autoRedirectProvider: "default" });

		expect(await load(event("?form"))).toMatchObject({ authConfig } as never);
		expect(mockSignInSocial).not.toHaveBeenCalled();
	});
});
