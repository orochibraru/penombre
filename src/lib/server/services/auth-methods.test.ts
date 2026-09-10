import { describe, expect, test } from "bun:test";
import {
	type CurrentMethods,
	type ProposedMethods,
	validateSignInMethods,
} from "./auth-methods";

/** Nobody is stranded unless a case says otherwise. */
const noneStranded = () => Promise.resolve(0);

const proposed = (over: Partial<ProposedMethods> = {}): ProposedMethods => ({
	emailSignIn: true,
	magicLink: false,
	emailOtp: false,
	oauthProviders: [],
	smtpAvailable: false,
	...over,
});

const current = (over: Partial<CurrentMethods> = {}): CurrentMethods => ({
	emailSignIn: true,
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
});
