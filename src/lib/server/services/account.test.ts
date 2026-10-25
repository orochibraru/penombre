import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	spyOn,
} from "bun:test";

import * as authModule from "#lib/server/auth/index.js";
import * as sessions from "#lib/server/auth/sessions.js";
import * as config from "#lib/server/config.js";
import * as dbModule from "#lib/server/db/index.js";
import { session, user as userTable } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as appSettings from "#lib/server/services/app-settings.js";
import * as authMethods from "#lib/server/services/auth-methods.js";
import * as preferences from "#lib/server/services/preferences.js";

import {
	accountOverview,
	listSessions,
	type RequirementSources,
	revokeSession,
	savePassword,
	type SessionUser,
	setPreferredSignInMethod,
	unmetRequirements,
	updateProfile,
} from "./account";

const sources = (over: Partial<Record<keyof RequirementSources, boolean>>) =>
	({
		passkeyRequired: () => Promise.resolve(over.passkeyRequired ?? false),
		twoFactorRequired: () => Promise.resolve(over.twoFactorRequired ?? false),
		passkeyEnabled: () => Promise.resolve(over.passkeyEnabled ?? true),
		hasPasskey: () => Promise.resolve(over.hasPasskey ?? false),
	}) satisfies RequirementSources;

describe("unmetRequirements", () => {
	const user = { id: "u1", twoFactorEnabled: false };

	it("asks for nothing when nothing is required", async () => {
		expect(await unmetRequirements(user, sources({}))).toEqual([]);
	});

	it("asks for what is required and missing", async () => {
		const both = sources({ twoFactorRequired: true, passkeyRequired: true });
		expect(await unmetRequirements(user, both)).toEqual([
			"twoFactor",
			"passkey",
		]);
	});

	it("forgets what the account already has", async () => {
		const both = sources({
			twoFactorRequired: true,
			passkeyRequired: true,
			hasPasskey: true,
		});
		expect(
			await unmetRequirements({ id: "u1", twoFactorEnabled: true }, both),
		).toEqual([]);
	});

	it("never asks for a passkey the instance cannot register", async () => {
		const off = sources({ passkeyRequired: true, passkeyEnabled: false });
		expect(await unmetRequirements(user, off)).toEqual([]);
	});
});

const restorers: (() => void)[] = [];

function watch<T extends { mockRestore(): void }>(spy: T): T {
	restorers.push(() => spy.mockRestore());
	return spy;
}

/**
 * test.setup's mocks are shared by every suite, and `mockRestore` on one
 * wipes it: swap its behaviour for this test, then put back what it had.
 */
function override<T extends (...args: never[]) => unknown>(
	fn: T,
	implementation: (...args: Parameters<T>) => unknown,
): Mock<T> {
	const mocked = fn as unknown as Mock<T>;
	const previous = mocked.getMockImplementation();
	// A `mockReturnValue` leaves no implementation behind, only its value.
	const value = previous ? undefined : mocked(...([] as Parameters<T>));
	mocked.mockClear();
	mocked.mockImplementation(implementation as unknown as T);
	restorers.push(() => {
		if (previous) {
			mocked.mockImplementation(previous);
		} else {
			mocked.mockReturnValue(value as ReturnType<T>);
		}
	});
	return mocked;
}

afterEach(() => {
	for (const restore of restorers.splice(0).toReversed()) {
		restore();
	}
});

const ada = {
	id: "ada",
	name: "Ada",
	email: "ada@x.test",
	emailVerified: true,
	createdAt: new Date(1_000),
	twoFactorEnabled: false,
} as SessionUser;

const headers = new Headers({ cookie: "session=1" });

/** What the instance and the account answer, for the defaults to read. */
function instance(
	over: {
		settings?: Record<string, unknown>;
		credentials?: { hasPassword: boolean; hasPasskey: boolean };
		methods?: Partial<Record<string, boolean>>;
		twoFactor?: boolean;
	} = {},
) {
	watch(spyOn(appSettings, "getAppSettings")).mockResolvedValue({
		minPasswordLength: 8,
		...over.settings,
	} as never);
	watch(spyOn(appSettings, "isTwoFactorRequired")).mockResolvedValue(
		over.twoFactor ?? false,
	);
	watch(spyOn(appSettings, "getSmtpSettings")).mockResolvedValue(null);
	watch(spyOn(authMethods, "accountCredentials")).mockResolvedValue(
		over.credentials ?? { hasPassword: true, hasPasskey: false },
	);
	override(authModule.instanceSignInMethods, async () => ({
		password: true,
		passkey: true,
		magicLink: false,
		emailOtp: false,
		...over.methods,
	}));
}

describe("unmetRequirements from the instance itself", () => {
	it("reads the settings, the passkey switch and the account's passkeys", async () => {
		instance({ settings: { requirePasskey: true, requireTwoFactor: true } });
		expect(await unmetRequirements(ada)).toEqual(["twoFactor", "passkey"]);
	});
});

describe("accountOverview", () => {
	it("gathers the account and what the instance offers it", async () => {
		instance({
			credentials: { hasPassword: true, hasPasskey: true },
			settings: { versioningEnabled: true, requireStrongPassword: true },
		});
		watch(spyOn(preferences, "getUserPreferences")).mockResolvedValue({
			preferredSignInMethod: "passkey",
		} as never);

		expect(await accountOverview(ada)).toEqual({
			user: {
				id: "ada",
				name: "Ada",
				email: "ada@x.test",
				image: null,
				role: "user",
				emailVerified: true,
				twoFactorEnabled: false,
				createdAt: new Date(1_000).toISOString(),
			},
			hasPassword: true,
			passwordRules: { minLength: 8, requireStrong: true },
			signInMethods: ["password", "passkey"],
			preferredSignInMethod: "passkey",
			passkeySignInEnabled: true,
			emailSignInEnabled: true,
			twoFactorRequired: false,
			requirements: [],
			smtpAvailable: false,
			simpleMode: false,
			driveOnly: false,
			versioning: true,
		});
	});
});

describe("updateProfile", () => {
	it("an unchanged or blank name saves nothing", async () => {
		const updateUser = override(authModule.auth.api.updateUser, async () => ({
			status: true,
		}));
		expect(await updateProfile(ada, headers, { name: "  Ada " })).toBeNull();
		expect(await updateProfile(ada, headers, { name: "   " })).toBeNull();
		expect(await updateProfile(ada, headers, {})).toBeNull();
		expect(updateUser).not.toHaveBeenCalled();
	});

	it("saves the trimmed name as the caller", async () => {
		const updateUser = override(authModule.auth.api.updateUser, async () => ({
			status: true,
		}));
		expect(await updateProfile(ada, headers, { name: " Ada L. " })).toBeNull();
		expect(updateUser).toHaveBeenCalledWith({
			body: { name: "Ada L." },
			headers,
		});
	});

	it("a refused or failed save is reported, never thrown", async () => {
		const updateUser = override(authModule.auth.api.updateUser, async () => ({
			status: false,
		}));
		const refused = {
			error: "ACCOUNT_UPDATE_FAILED",
			message: "Your name could not be saved.",
			errorParams: undefined,
		};
		expect(await updateProfile(ada, headers, { name: "Bob" })).toEqual(refused);
		updateUser.mockImplementation(async () => {
			throw new Error("network");
		});
		expect(await updateProfile(ada, headers, { name: "Bob" })).toEqual(refused);
	});
});

describe("savePassword", () => {
	beforeEach(() => {
		instance({
			settings: { minPasswordLength: 12, requireStrongPassword: true },
		});
	});

	it("refuses what breaks the instance's rules, saying why", async () => {
		const change = override(
			authModule.auth.api.changePassword,
			async () => ({}),
		);
		expect(
			await savePassword(
				headers,
				{ newPassword: "Aa1!aaaaaaaa", confirm: "other" },
				"change",
			),
		).toEqual({
			error: "PASSWORD_MISMATCH",
			message: "The two passwords are different.",
			errorParams: undefined,
		});
		expect(
			await savePassword(
				headers,
				{ newPassword: "Aa1!", confirm: "Aa1!" },
				"set",
			),
		).toEqual({
			error: "PASSWORD_TOO_SHORT",
			message: "Use at least 12 characters.",
			errorParams: { count: "12" },
		});
		expect(
			await savePassword(
				headers,
				{ newPassword: "aaaaaaaaaaaa", confirm: "aaaaaaaaaaaa" },
				"set",
			),
		).toEqual({
			error: "PASSWORD_NOT_STRONG",
			message: "Mix upper and lower case, a digit and a symbol.",
			errorParams: undefined,
		});
		expect(change).not.toHaveBeenCalled();
	});

	const strong = { newPassword: "Correct1!horse", confirm: "Correct1!horse" };

	it("sets a first password", async () => {
		const set = override(authModule.auth.api.setPassword, async () => ({
			status: true,
		}));
		expect(await savePassword(headers, strong, "set")).toBeNull();
		expect(set).toHaveBeenCalledWith({
			headers,
			body: { newPassword: "Correct1!horse" },
		});
	});

	it("will not set one while password sign-in is off", async () => {
		const set = override(authModule.auth.api.setPassword, async () => ({
			status: true,
		}));
		override(config.getConfig, () => ({
			auth: { enableEmailSignIn: false, minPasswordLength: 8 },
		}));
		expect(await savePassword(headers, strong, "set")).toMatchObject({
			error: "EMAIL_SIGNIN_DISABLED",
		});
		expect(set).not.toHaveBeenCalled();
	});

	it("a password better-auth refuses to set is reported", async () => {
		override(authModule.auth.api.setPassword, async () => {
			throw new Error("already has one");
		});
		expect(await savePassword(headers, strong, "set")).toMatchObject({
			error: "SET_PASSWORD_FAILED",
		});
	});

	it("changes the current one, which must be right", async () => {
		const change = override(
			authModule.auth.api.changePassword,
			async () => ({}),
		);
		expect(
			await savePassword(
				headers,
				{ ...strong, currentPassword: "old" },
				"change",
			),
		).toBeNull();
		expect(change).toHaveBeenCalledWith({
			headers,
			body: { currentPassword: "old", newPassword: "Correct1!horse" },
		});
		change.mockImplementation(async () => {
			throw new Error("INVALID_PASSWORD");
		});
		expect(await savePassword(headers, strong, "change")).toMatchObject({
			error: "CHANGE_PASSWORD_FAILED",
		});
		expect(change.mock.calls[1]?.[0]).toMatchObject({
			body: { currentPassword: "" },
		});
	});
});

describe("setPreferredSignInMethod", () => {
	it("saves a method the account can use, and clears with null", async () => {
		instance({ credentials: { hasPassword: true, hasPasskey: true } });
		const update = watch(
			spyOn(preferences, "updateUserPreferences"),
		).mockResolvedValue({} as never);
		expect(await setPreferredSignInMethod("ada", "passkey")).toBeNull();
		expect(await setPreferredSignInMethod("ada", null)).toBeNull();
		expect(update.mock.calls).toEqual([
			["ada", { preferredSignInMethod: "passkey" }],
			["ada", { preferredSignInMethod: null }],
		]);
	});

	it("refuses a method the account cannot complete", async () => {
		instance({ credentials: { hasPassword: true, hasPasskey: false } });
		const update = watch(spyOn(preferences, "updateUserPreferences"));
		expect(await setPreferredSignInMethod("ada", "passkey")).toMatchObject({
			error: "SIGN_IN_METHOD_UNAVAILABLE",
		});
		expect(update).not.toHaveBeenCalled();
	});
});

describe("sessions", () => {
	const at = (seconds: number) => new Date(1_800_000_000_000 + seconds * 1000);

	it("lists live sessions without their tokens, marking the current one", async () => {
		const row = (id: string) => ({
			id,
			token: `token-${id}`,
			userId: "ada",
			userAgent: "Firefox",
			ipAddress: "10.0.0.1",
			createdAt: at(0),
			updatedAt: at(1),
			expiresAt: at(2),
		});
		const active = watch(spyOn(sessions, "activeSessions")).mockResolvedValue([
			row("s1"),
			row("s2"),
		] as never);

		const listed = await listSessions("ada", "s2");

		expect(active).toHaveBeenCalledWith("ada");
		expect(listed).toEqual([
			{
				id: "s1",
				current: false,
				userAgent: "Firefox",
				ipAddress: "10.0.0.1",
				createdAt: at(0).toISOString(),
				updatedAt: at(1).toISOString(),
				expiresAt: at(2).toISOString(),
			},
			expect.objectContaining({ id: "s2", current: true }),
		]);
		expect(JSON.stringify(listed)).not.toContain("token");
	});

	it("revokes only the caller's own session, by its token", async () => {
		const database = migratedSqlite();
		await database.insert(userTable).values([
			{ id: "ada", name: "Ada", email: "ada@x.test" },
			{ id: "bob", name: "Bob", email: "bob@x.test" },
		]);
		await database.insert(session).values([
			{
				id: "s1",
				token: "t1",
				userId: "ada",
				expiresAt: at(60),
				updatedAt: at(0),
			},
			{
				id: "s2",
				token: "t2",
				userId: "bob",
				expiresAt: at(60),
				updatedAt: at(0),
			},
		]);
		watch(spyOn(dbModule, "getDb")).mockReturnValue(database);
		const revoked: unknown[] = [];
		Object.defineProperty(authModule.auth.api, "revokeSession", {
			value: async (input: unknown) => revoked.push(input),
			configurable: true,
		});
		try {
			expect(await revokeSession("ada", "s2", headers)).toBe(false);
			expect(await revokeSession("ada", "s1", headers)).toBe(true);
			expect(revoked).toEqual([{ body: { token: "t1" }, headers }]);
		} finally {
			Reflect.deleteProperty(authModule.auth.api, "revokeSession");
		}
	});
});
