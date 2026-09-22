import type { Mock } from "bun:test";
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { getConfig, isAuthBypassed } from "#lib/server/config.js";
import { db } from "#lib/server/db/index.js";

const mockGetConfig = getConfig as Mock<typeof getConfig>;
const mockIsAuthBypassed = isAuthBypassed as Mock<typeof isAuthBypassed>;
const mockSignInSocial = auth.api.signInSocial as Mock<
	(...args: unknown[]) => Promise<{ url?: string }>
>;

const mockSelect = db.select as Mock<typeof db.select>;
const mockInstanceMethods = instanceSignInMethods as Mock<
	typeof instanceSignInMethods
>;

const { load, actions } = await import("./+page.server");

const authConfig = {
	enableEmailSignIn: true,
	enablePasskeySignIn: true,
	enableOAuthSignIn: false,
};

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

/** Queue one drizzle query result on the shared db mock, whatever the chain. */
function queue(result: unknown[]) {
	const chain: unknown = new Proxy(
		{},
		{
			get: (_target, prop) =>
				prop === "then"
					? (resolve: (v: unknown) => void) => resolve(result)
					: () => chain,
		},
	);
	mockSelect.mockReturnValueOnce(chain as never);
}

/**
 * In query order: user row, then `hasAnyIdentity`'s two queries (any account
 * row, passkey row), then `accountCredentials`'s two (credential row, passkey
 * row again), then the preferences row.
 */
function account({
	password = true,
	passkey = false,
	preferred,
}: {
	password?: boolean;
	passkey?: boolean;
	preferred?: string | null;
}) {
	queue([{ id: "u1" }]);
	queue(password ? [{ id: "acc" }] : []);
	queue(passkey ? [{ id: "pk" }] : []);
	queue(password ? [{ id: "acc" }] : []);
	queue(passkey ? [{ id: "pk" }] : []);
	queue(
		preferred === undefined
			? []
			: [{ userId: "u1", preferences: { preferredSignInMethod: preferred } }],
	);
}

async function lookup(email = "a@example.com") {
	const body = new FormData();
	body.set("email", email);
	const request = new Request("http://localhost/auth/sign-in?/lookup", {
		method: "POST",
		body,
	});
	return actions.lookup({
		request,
		// Unique per call: the rate limiter's counter is a real, process-wide
		// singleton, not mocked, so a fixed address would make later calls in
		// a long test run start tripping it.
		getClientAddress: () => crypto.randomUUID(),
	} as never);
}

const allMethods = {
	password: true,
	passkey: true,
	magicLink: true,
	emailOtp: true,
};

describe("lookup", () => {
	test("returns the account's methods with no preference by default", async () => {
		account({});
		expect(await lookup()).toEqual({
			step: "password",
			email: "a@example.com",
			methods: ["password"],
			preferred: null,
		});
	});

	test("returns a usable preferred method", async () => {
		mockInstanceMethods.mockResolvedValueOnce(allMethods);
		account({ passkey: true, preferred: "passkey" });
		expect(await lookup()).toMatchObject({
			methods: ["password", "passkey", "magicLink", "emailOtp"],
			preferred: "passkey",
		});
	});

	test("a preferred passkey with none registered falls back to none", async () => {
		mockInstanceMethods.mockResolvedValueOnce(allMethods);
		account({ passkey: false, preferred: "passkey" });
		expect(await lookup()).toMatchObject({ preferred: null });
	});

	test("a preferred method the admin disabled falls back to none", async () => {
		mockInstanceMethods.mockResolvedValueOnce({
			...allMethods,
			magicLink: false,
		});
		account({ preferred: "magicLink" });
		expect(await lookup()).toMatchObject({
			methods: ["password", "emailOtp"],
			preferred: null,
		});
	});

	test("a passkey-only account is not sent to onboarding", async () => {
		account({ password: false, passkey: true, preferred: "passkey" });
		expect(await lookup()).toMatchObject({
			step: "password",
			methods: ["passkey"],
			preferred: "passkey",
		});
	});

	test("an account with neither is an invitation", async () => {
		// No preferences read: a leftover queued result would leak into
		// whichever suite runs next.
		queue([{ id: "u1" }]);
		queue([]);
		queue([]);
		expect(await lookup()).toEqual({
			step: "onboarding",
			email: "a@example.com",
		});
	});

	test("an unknown address is a 404", async () => {
		queue([]);
		expect(await lookup()).toMatchObject({ status: 404 });
	});
});
