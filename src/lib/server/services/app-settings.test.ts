import { afterAll, describe, expect, type Mock, mock, test } from "bun:test";
import { envProvided, getConfig } from "#lib/server/config.js";
import { db } from "#lib/server/db/index.js";

const mockSelect = db.select as Mock<typeof db.select>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;
const mockGetConfig = getConfig as Mock<typeof getConfig>;

const {
	isOAuthSignInEnabled,
	isVersionCheckEnabled,
	effectiveReleaseChannel,
	effectiveRetentionDays,
} = await import("./app-settings");

/**
 * `mock.module` is global, so a `mockReturnValue` here would reconfigure every
 * suite that runs after this one. Restore test.setup's defaults when done.
 */
const defaultProvided = {
	emailSignIn: true,
	oauthSignIn: true,
	passkeySignIn: false,
	minPasswordLength: true,
	smtp: true,
	versionCheck: false,
	releaseChannel: false,
	dataRetention: false,
};

const defaultConfig = {
	smtp: undefined,
	appName: "Penombre",
	appVersion: "1.0.0",
	versionCheck: { enabled: true, releaseChannel: undefined },
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

describe("isVersionCheckEnabled", () => {
	test("the environment wins when it declares the setting", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			versionCheck: true,
		} as never);
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			versionCheck: { enabled: false },
		} as never);

		expect(await isVersionCheckEnabled()).toBe(false);
	});

	test("falls back to the stored setting when the environment is silent", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			versionCheck: false,
		} as never);
		config({});
		settingsRow({ versionCheckEnabled: false });

		expect(await isVersionCheckEnabled()).toBe(false);
	});

	test("defaults to on with nothing set", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			versionCheck: false,
		} as never);
		config({});
		settingsRow(null);

		expect(await isVersionCheckEnabled()).toBe(true);
	});
});

describe("effectiveReleaseChannel", () => {
	test("the environment wins when it declares the channel", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			releaseChannel: true,
		} as never);
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			versionCheck: { enabled: true, releaseChannel: "canary" },
		} as never);

		expect(await effectiveReleaseChannel()).toBe("canary");
	});

	test("falls back to the stored channel", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			releaseChannel: false,
		} as never);
		config({});
		settingsRow({ releaseChannel: "canary" });

		expect(await effectiveReleaseChannel()).toBe("canary");
	});

	test("a canary build defaults to canary with nothing set", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			releaseChannel: false,
		} as never);
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			appVersion: "1.8.51-canary.2",
		} as never);
		settingsRow(null);

		expect(await effectiveReleaseChannel()).toBe("canary");
	});

	test("a stable build defaults to stable with nothing set", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			releaseChannel: false,
		} as never);
		config({});
		settingsRow(null);

		expect(await effectiveReleaseChannel()).toBe("stable");
	});
});

describe("effectiveRetentionDays", () => {
	test("the environment wins when it declares a window", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			dataRetention: true,
		} as never);
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			dataRetentionDays: 30,
		} as never);

		expect(await effectiveRetentionDays()).toBe(30);
	});

	test("an environment window of nothing set means disabled", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			dataRetention: true,
		} as never);
		mockGetConfig.mockReturnValue(defaultConfig as never);

		expect(await effectiveRetentionDays()).toBeNull();
	});

	test("falls back to the stored window", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			dataRetention: false,
		} as never);
		config({});
		settingsRow({ retentionDays: 90 });

		expect(await effectiveRetentionDays()).toBe(90);
	});

	test("nothing set anywhere means disabled", async () => {
		mockEnvProvided.mockReturnValue({
			...defaultProvided,
			dataRetention: false,
		} as never);
		config({});
		settingsRow(null);

		expect(await effectiveRetentionDays()).toBeNull();
	});
});
