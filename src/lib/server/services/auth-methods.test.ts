import { describe, expect, type Mock, test } from "bun:test";
import { db } from "#lib/server/db/index.js";
import {
	type CurrentMethods,
	effectivePreferred,
	type InstanceMethods,
	methodsFor,
	type ProposedMethods,
	strandedAccounts,
	validateSignInMethods,
} from "./auth-methods";

const mockSelect = db.select as Mock<typeof db.select>;

/** Nobody is stranded unless a case says otherwise. */
const noneStranded = () => Promise.resolve(0);

const proposed = (over: Partial<ProposedMethods> = {}): ProposedMethods => ({
	emailSignIn: true,
	passkey: false,
	magicLink: false,
	emailOtp: false,
	oauthProviders: [],
	smtpAvailable: false,
	...over,
});

const current = (over: Partial<CurrentMethods> = {}): CurrentMethods => ({
	emailSignIn: true,
	passkey: false,
	oauthProviders: [],
	...over,
});

describe("validateSignInMethods", () => {
	test("accepts a change that leaves a method enabled", async () => {
		expect(
			await validateSignInMethods(proposed(), current(), noneStranded),
		).toBeNull();
	});

	test("refuses turning off the only method", async () => {
		const result = await validateSignInMethods(
			proposed({ emailSignIn: false }),
			current(),
			noneStranded,
		);
		expect(result).toMatch(/at least one sign-in method/i);
	});

	test("an OAuth provider is enough to keep email sign-in optional", async () => {
		expect(
			await validateSignInMethods(
				proposed({ emailSignIn: false, oauthProviders: ["authentik"] }),
				current({ oauthProviders: ["authentik"] }),
				noneStranded,
			),
		).toBeNull();
	});

	test("refuses disabling email sign-in while accounts depend on it", async () => {
		const result = await validateSignInMethods(
			proposed({ emailSignIn: false, oauthProviders: ["authentik"] }),
			current({ oauthProviders: ["authentik"] }),
			() => Promise.resolve(3),
		);
		expect(result).toMatch(/3 accounts have no sign-in method other than/i);
	});

	test("names a single stranded account in the singular", async () => {
		const result = await validateSignInMethods(
			proposed({ emailSignIn: false, oauthProviders: ["authentik"] }),
			current({ oauthProviders: ["authentik"] }),
			() => Promise.resolve(1),
		);
		expect(result).toMatch(/1 account has/i);
	});

	test("refuses removing an OAuth provider that is someone's only way in", async () => {
		const result = await validateSignInMethods(
			proposed({ oauthProviders: [] }),
			current({ oauthProviders: ["authentik"] }),
			(providerId) => Promise.resolve(providerId === "authentik" ? 2 : 0),
		);
		expect(result).toMatch(/2 accounts sign in only with authentik/i);
	});

	test("keeping a provider does not trigger the in-use check", async () => {
		expect(
			await validateSignInMethods(
				proposed({ oauthProviders: ["authentik"] }),
				current({ oauthProviders: ["authentik"] }),
				() => Promise.resolve(5),
			),
		).toBeNull();
	});

	test("a passwordless method without SMTP is refused", async () => {
		const result = await validateSignInMethods(
			proposed({ magicLink: true, smtpAvailable: false }),
			current(),
			noneStranded,
		);
		expect(result).toMatch(/configure smtp/i);
	});

	test("magic link with SMTP counts as a remaining method", async () => {
		expect(
			await validateSignInMethods(
				proposed({ emailSignIn: false, magicLink: true, smtpAvailable: true }),
				current(),
				noneStranded,
			),
		).toBeNull();
	});

	test("an emailed code alone also counts", async () => {
		expect(
			await validateSignInMethods(
				proposed({ emailSignIn: false, emailOtp: true, smtpAvailable: true }),
				current(),
				noneStranded,
			),
		).toBeNull();
	});

	test("passwordless methods are exempt from the in-use rule", async () => {
		// Turning magic link off strands nobody: it authenticates an address,
		// so no account row depends on it.
		expect(
			await validateSignInMethods(
				proposed({ magicLink: false, smtpAvailable: true }),
				current(),
				() => Promise.resolve(9),
			),
		).toBeNull();
	});

	test("email sign-in already off is not re-checked", async () => {
		// Nothing is being removed, so the stranded lookup must not veto it.
		expect(
			await validateSignInMethods(
				proposed({ emailSignIn: false, oauthProviders: ["authentik"] }),
				current({ emailSignIn: false, oauthProviders: ["authentik"] }),
				() => Promise.resolve(4),
			),
		).toBeNull();
	});

	test("a passkey alone keeps a method enabled", async () => {
		expect(
			await validateSignInMethods(
				proposed({ emailSignIn: false, passkey: true }),
				current({ passkey: true }),
				noneStranded,
			),
		).toBeNull();
	});

	test("passkey-only is refused while someone has no passkey", async () => {
		const surviving: (readonly string[])[] = [];
		const result = await validateSignInMethods(
			proposed({ emailSignIn: false, passkey: true }),
			current({ passkey: true }),
			(providerId, alive) => {
				surviving.push(alive);
				return Promise.resolve(providerId === "credential" ? 2 : 0);
			},
		);
		expect(result).toMatch(/2 accounts have no sign-in method other than/i);
		expect(surviving[0]).toEqual(["passkey"]);
	});

	test("refuses disabling passkeys while accounts sign in only with one", async () => {
		const result = await validateSignInMethods(
			proposed({ passkey: false }),
			current({ passkey: true }),
			(providerId) => Promise.resolve(providerId === "passkey" ? 1 : 0),
		);
		expect(result).toMatch(/1 account signs in only with a passkey/i);
	});

	test("turning passkeys off is fine when nobody depends on them", async () => {
		expect(
			await validateSignInMethods(
				proposed({ passkey: false }),
				current({ passkey: true }),
				noneStranded,
			),
		).toBeNull();
	});

	test("turning the last two methods off together is refused", async () => {
		const result = await validateSignInMethods(
			proposed({ emailSignIn: false, passkey: false }),
			current({ passkey: true }),
			noneStranded,
		);
		expect(result).toMatch(/at least one sign-in method/i);
	});
});

/** Queue one `select().from()` result on the shared db mock. */
function rows(result: unknown[]) {
	const from = () => Promise.resolve(result);
	mockSelect.mockReturnValueOnce({ from } as never);
}

describe("strandedAccounts", () => {
	test("a passkey is a way in, read from the passkey table", async () => {
		rows([
			{ userId: "a", providerId: "credential" },
			{ userId: "b", providerId: "credential" },
			{ userId: "c", providerId: "credential" },
		]);
		rows([{ userId: "a" }, { userId: "a" }, { userId: "b" }]);

		expect(await strandedAccounts("credential", ["passkey"])).toBe(1);
	});

	test("counts passkey-only users when passkeys go", async () => {
		rows([{ userId: "b", providerId: "credential" }]);
		rows([{ userId: "a" }, { userId: "b" }]);

		expect(await strandedAccounts("passkey", ["credential"])).toBe(1);
	});
});

const everything: InstanceMethods = {
	password: true,
	passkey: true,
	magicLink: true,
	emailOtp: true,
};

describe("methodsFor", () => {
	test("password and passkey need the account to hold one", () => {
		expect(
			methodsFor(everything, { hasPassword: false, hasPasskey: false }),
		).toEqual(["magicLink", "emailOtp"]);
		expect(
			methodsFor(everything, { hasPassword: true, hasPasskey: true }),
		).toEqual(["password", "passkey", "magicLink", "emailOtp"]);
	});

	test("an instance-disabled method is never offered", () => {
		expect(
			methodsFor(
				{ ...everything, passkey: false, magicLink: false },
				{ hasPassword: true, hasPasskey: true },
			),
		).toEqual(["password", "emailOtp"]);
	});
});

describe("effectivePreferred", () => {
	test("keeps an available preference", () => {
		expect(effectivePreferred("passkey", ["password", "passkey"])).toBe(
			"passkey",
		);
	});

	test("an unavailable preference falls back to none", () => {
		expect(effectivePreferred("passkey", ["password"])).toBeNull();
		expect(effectivePreferred(null, ["password"])).toBeNull();
		expect(effectivePreferred(undefined, [])).toBeNull();
	});
});
