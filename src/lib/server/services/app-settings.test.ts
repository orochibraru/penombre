import { afterAll, describe, expect, type Mock, mock, test } from "bun:test";

import { envProvided, getConfig } from "#lib/server/config.js";
import { db } from "#lib/server/db/index.js";

const mockSelect = db.select as Mock<typeof db.select>;
const mockInsert = db.insert as Mock<typeof db.insert>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;
const mockGetConfig = getConfig as Mock<typeof getConfig>;

const {
	isOAuthSignInEnabled,
	isVersionCheckEnabled,
	effectiveReleaseChannel,
	effectiveRetentionDays,
	updateAppSettings,
	signupAllowed,
	getStoredOAuthProviders,
	isEmailSignInEnabled,
	isPasskeySignInEnabled,
	getPasswordlessSettings,
	isTwoFactorRequired,
	getSmtpSettings,
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

/** The next `app_settings` read fails, as before the table exists. */
function unreadable() {
	mockSelect.mockImplementationOnce(() => {
		throw new Error("no such table: app_settings");
	});
}

function environment(provided: Partial<typeof defaultProvided>) {
	mockEnvProvided.mockReturnValue({ ...defaultProvided, ...provided });
}

describe("updateAppSettings", () => {
	test("merges the change over what is stored and writes the whole row", async () => {
		settingsRow({ allowSignups: true, minPasswordLength: 12 });
		const written: unknown[] = [];
		mockInsert.mockImplementationOnce(
			() =>
				({
					values: (row: unknown) => {
						written.push(row);
						return { onConflictDoUpdate: () => Promise.resolve([]) };
					},
				}) as never,
		);

		const merged = await updateAppSettings({ requireTwoFactor: true });

		expect(merged).toMatchObject({
			allowSignups: true,
			minPasswordLength: 12,
			requireTwoFactor: true,
			emailSignInEnabled: true,
		});
		expect(written).toEqual([{ id: "instance", settings: merged }]);
	});
});

describe("signupAllowed", () => {
	const open = { allowSignups: true, allowedEmailDomains: [] };

	test("closed signups refuse everyone", () => {
		expect(signupAllowed({ allowSignups: false }, "a@x.test")).toBe(false);
	});

	test("an empty allow-list lets any domain in", () => {
		expect(signupAllowed(open, "a@anything.test")).toBe(true);
		expect(signupAllowed({ allowSignups: true }, "a@anything.test")).toBe(true);
	});

	test("an allow-list narrows by domain, ignoring case", () => {
		const narrow = { ...open, allowedEmailDomains: ["Band.test"] };
		expect(signupAllowed(narrow, "ada@BAND.test")).toBe(true);
		expect(signupAllowed(narrow, "ada@other.test")).toBe(false);
		expect(signupAllowed(narrow, "no-domain")).toBe(false);
	});
});

describe("getStoredOAuthProviders", () => {
	test("keeps only providers with both halves of their credentials", async () => {
		settingsRow({
			oauthProviders: [stored, { ...stored, name: "half", clientSecret: "" }],
		});
		expect(await getStoredOAuthProviders()).toEqual([stored]);
	});

	test("a table that does not exist yet means none", async () => {
		unreadable();
		expect(await getStoredOAuthProviders()).toEqual([]);
	});
});

describe("isEmailSignInEnabled", () => {
	test("the environment wins when it declares the setting", async () => {
		environment({ emailSignIn: true });
		config({ enableEmailSignIn: false });
		expect(await isEmailSignInEnabled()).toBe(false);
	});

	test("the stored setting governs when the environment is silent", async () => {
		environment({ emailSignIn: false });
		config({ enableEmailSignIn: true });
		settingsRow({ emailSignInEnabled: false });
		expect(await isEmailSignInEnabled()).toBe(false);
	});

	test("an unreadable table falls back to the environment's default", async () => {
		environment({ emailSignIn: false });
		config({ enableEmailSignIn: true });
		unreadable();
		expect(await isEmailSignInEnabled()).toBe(true);
	});
});

describe("isPasskeySignInEnabled", () => {
	test("the environment wins when it declares the setting", async () => {
		environment({ passkeySignIn: true });
		config({ enablePasskeySignIn: false });
		expect(await isPasskeySignInEnabled()).toBe(false);
	});

	test("the stored setting governs when the environment is silent", async () => {
		environment({ passkeySignIn: false });
		settingsRow({ passkeySignInEnabled: false });
		expect(await isPasskeySignInEnabled()).toBe(false);
	});

	test("an unreadable table leaves passkeys on", async () => {
		environment({ passkeySignIn: false });
		unreadable();
		expect(await isPasskeySignInEnabled()).toBe(true);
	});
});

describe("getSmtpSettings", () => {
	const envSmtp = {
		enabled: true,
		host: "smtp.env.test",
		port: 465,
		user: "env",
		password: "secret",
		from: "env@x.test",
		secure: true,
	};

	test("the environment's mail server wins when it declares one", async () => {
		environment({ smtp: true });
		mockGetConfig.mockReturnValue({ ...defaultConfig, smtp: envSmtp } as never);
		expect(await getSmtpSettings()).toEqual(envSmtp);
	});

	test("an environment that turns mail off means no mail", async () => {
		environment({ smtp: true });
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			smtp: { ...envSmtp, enabled: false },
		} as never);
		expect(await getSmtpSettings()).toBeNull();
	});

	test("a stored server fills in the usual defaults", async () => {
		environment({ smtp: false });
		settingsRow({
			smtp: { enabled: true, host: "smtp.db.test", from: "db@x.test" },
		});
		expect(await getSmtpSettings()).toEqual({
			enabled: true,
			host: "smtp.db.test",
			port: 587,
			user: "",
			password: "",
			from: "db@x.test",
			secure: false,
		});
	});

	test("a stored server with no sender, or switched off, is no server", async () => {
		environment({ smtp: false });
		settingsRow({ smtp: { enabled: true, host: "smtp.db.test" } });
		expect(await getSmtpSettings()).toBeNull();
		settingsRow({
			smtp: { enabled: false, host: "smtp.db.test", from: "db@x.test" },
		});
		expect(await getSmtpSettings()).toBeNull();
	});

	test("an unreadable table means no mail", async () => {
		environment({ smtp: false });
		unreadable();
		expect(await getSmtpSettings()).toBeNull();
	});
});

describe("getPasswordlessSettings", () => {
	test("both are on only when enabled and mail can be sent", async () => {
		environment({ smtp: false });
		const settings = {
			magicLinkEnabled: true,
			emailOtpEnabled: false,
			smtp: { enabled: true, host: "smtp.db.test", from: "db@x.test" },
		};
		settingsRow(settings);
		settingsRow(settings);
		expect(await getPasswordlessSettings()).toEqual({
			magicLink: true,
			emailOtp: false,
		});
	});

	// Removing mail after enabling them must not leave a method that
	// silently never sends.
	test("without mail, neither is offered", async () => {
		environment({ smtp: false });
		const settings = { magicLinkEnabled: true, emailOtpEnabled: true };
		settingsRow(settings);
		settingsRow(settings);
		expect(await getPasswordlessSettings()).toEqual({
			magicLink: false,
			emailOtp: false,
		});
	});

	test("an unreadable table offers neither", async () => {
		unreadable();
		expect(await getPasswordlessSettings()).toEqual({
			magicLink: false,
			emailOtp: false,
		});
	});
});

describe("isTwoFactorRequired", () => {
	test("reads the stored setting, off by default", async () => {
		settingsRow({ requireTwoFactor: true });
		expect(await isTwoFactorRequired()).toBe(true);
		settingsRow(null);
		expect(await isTwoFactorRequired()).toBe(false);
	});

	test("an unreadable table requires nothing", async () => {
		unreadable();
		expect(await isTwoFactorRequired()).toBe(false);
	});
});

describe("the stored-setting fallbacks", () => {
	test("an unreadable table keeps the version check on", async () => {
		environment({ versionCheck: false });
		unreadable();
		expect(await isVersionCheckEnabled()).toBe(true);
	});

	test("an unreadable table watches the channel the build is on", async () => {
		environment({ releaseChannel: false });
		mockGetConfig.mockReturnValue({
			...defaultConfig,
			appVersion: "2.0.0-canary.4",
		} as never);
		unreadable();
		expect(await effectiveReleaseChannel()).toBe("canary");
	});

	test("an unreadable table keeps everything", async () => {
		environment({ dataRetention: false });
		unreadable();
		expect(await effectiveRetentionDays()).toBeNull();
	});
});
