import { afterAll, describe, expect, type Mock, mock, test } from "bun:test";
import { envProvided, getConfig } from "#lib/server/config.js";
import { db } from "#lib/server/db/index.js";

const mockSelect = db.select as Mock<typeof db.select>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;
const mockGetConfig = getConfig as Mock<typeof getConfig>;

const { isOAuthSignInEnabled } = await import("./app-settings");

/**
 * `mock.module` is global, so a `mockReturnValue` here would reconfigure every
 * suite that runs after this one. Restore test.setup's defaults when done.
 */
const defaultProvided = {
	emailSignIn: true,
	oauthSignIn: true,
	minPasswordLength: true,
	smtp: true,
};

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
	mockEnvProvided.mockReturnValue(defaultProvided);
	mockGetConfig.mockReturnValue(defaultConfig as never);
});

/**
 * Queue one `app_settings` read, or none.
 *
 * `...Once`, never `mockReturnValue`: the db mock is shared by every suite, so
 * a standing return value here breaks whatever runs next.
 */
function settingsRow(settings: unknown) {
	const limit = mock(() =>
		Promise.resolve(settings ? [{ id: "instance", settings }] : []),
	);
	const where = mock(() => ({ limit }));
	const from = mock(() => ({ where }));
	mockSelect.mockReturnValueOnce({ from } as never);
}

function config(auth: Record<string, unknown>) {
	mockGetConfig.mockReturnValue({
		...defaultConfig,
		auth: { ...defaultConfig.auth, oauthProviders: [], ...auth },
	} as never);
}

const stored = {
	name: "authentik",
	clientId: "id",
	clientSecret: "secret",
	discoveryUrl: "https://id.example.com/.well-known/openid-configuration",
};

describe("isOAuthSignInEnabled", () => {
	test("the environment wins when it declares the setting", async () => {
		mockEnvProvided.mockReturnValue({ ...defaultProvided, oauthSignIn: true });
		config({ enableOAuthSignIn: false });
		// No row is queued: the environment answers without reading the
		// database at all.

		expect(await isOAuthSignInEnabled()).toBe(false);
	});

	test("a stored provider is itself the switch", async () => {
		mockEnvProvided.mockReturnValue({ ...defaultProvided, oauthSignIn: false });
		config({ enableOAuthSignIn: false });
		settingsRow({ oauthProviders: [stored] });

		expect(await isOAuthSignInEnabled()).toBe(true);
	});

	test("a disabled stored provider is not", async () => {
		mockEnvProvided.mockReturnValue({ ...defaultProvided, oauthSignIn: false });
		config({ enableOAuthSignIn: false });
		settingsRow({ oauthProviders: [{ ...stored, enabled: false }] });

		expect(await isOAuthSignInEnabled()).toBe(false);
	});

	test("no provider anywhere means off", async () => {
		mockEnvProvided.mockReturnValue({ ...defaultProvided, oauthSignIn: false });
		config({ enableOAuthSignIn: false });
		settingsRow(null);

		expect(await isOAuthSignInEnabled()).toBe(false);
	});

	test("an env-declared provider counts too", async () => {
		mockEnvProvided.mockReturnValue({ ...defaultProvided, oauthSignIn: false });
		config({ oauthProviders: [{ ...stored, enabled: true }] });
		settingsRow(null);

		expect(await isOAuthSignInEnabled()).toBe(true);
	});
});
