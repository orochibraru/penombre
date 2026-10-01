import { describe, expect, test } from "bun:test";
import { session, verification } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const {
	createMobileCode,
	createPairCode,
	labelMobileSession,
	pairingUrl,
	redeemMobileCode,
	redeemPairCode,
	verifierMatches,
} = await import("./mobile");

// Challenge computed with `openssl dgst -sha256 -binary | base64url`.
const VERIFIER = "dBjftJeZ4CVP-mJ92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "ngF5GsXcbwljx6u133FFr3Xht9xooA_DuaX_3QwODtc";

describe("mobile sign-in codes", () => {
	test("S256 matches an independently computed challenge", async () => {
		expect(await verifierMatches(VERIFIER, CHALLENGE)).toBe(true);
		expect(await verifierMatches(`${VERIFIER}x`, CHALLENGE)).toBe(false);
	});

	test("a code redeems once, with the right verifier", async () => {
		const database = migratedSqlite();
		const pending = { userId: "u1", challenge: CHALLENGE, device: "Pixel" };
		const code = await createMobileCode(pending, database);

		expect(await redeemMobileCode(code, VERIFIER, database)).toEqual({
			userId: "u1",
			device: "Pixel",
		});
		expect(await redeemMobileCode(code, VERIFIER, database)).toBeNull();
	});

	test("a wrong verifier burns the code", async () => {
		const database = migratedSqlite();
		const pending = { userId: "u1", challenge: CHALLENGE, device: "Pixel" };
		const code = await createMobileCode(pending, database);

		expect(await redeemMobileCode(code, "nope", database)).toBeNull();
		expect(await redeemMobileCode(code, VERIFIER, database)).toBeNull();
	});

	test("an expired code is refused", async () => {
		const database = migratedSqlite();
		const pending = { userId: "u1", challenge: CHALLENGE, device: "Pixel" };
		const code = await createMobileCode(pending, database);
		await database
			.update(verification)
			.set({ expiresAt: new Date(Date.now() - 1000) });

		expect(await redeemMobileCode(code, VERIFIER, database)).toBeNull();
	});
});

describe("mobile pairing codes", () => {
	test("a code signs in the account that showed it, once", async () => {
		const database = migratedSqlite();
		const { code, expiresAt } = await createPairCode("u1", database);

		expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
		expect(await redeemPairCode(code, database)).toBe("u1");
		expect(await redeemPairCode(code, database)).toBeNull();
	});

	test("an expired code is refused", async () => {
		const database = migratedSqlite();
		const { code } = await createPairCode("u1", database);
		await database
			.update(verification)
			.set({ expiresAt: new Date(Date.now() - 1000) });

		expect(await redeemPairCode(code, database)).toBeNull();
	});

	test("neither kind of code redeems as the other", async () => {
		const database = migratedSqlite();
		const pending = { userId: "u1", challenge: CHALLENGE, device: "Pixel" };
		const signIn = await createMobileCode(pending, database);
		const { code: pair } = await createPairCode("u1", database);

		expect(await redeemPairCode(signIn, database)).toBeNull();
		expect(await redeemMobileCode(pair, VERIFIER, database)).toBeNull();
	});

	test("the link carries the server, escaped, and the code", () => {
		expect(pairingUrl("https://files.example.com:8443", "abc")).toBe(
			"penombre://pair?server=https%3A%2F%2Ffiles.example.com%3A8443&code=abc",
		);
	});
});

describe("mobile session labels", () => {
	test("names the calling session as the app's, and no other", async () => {
		const database = migratedSqlite();
		const row = (id: string) => ({
			id,
			token: `t-${id}`,
			userId: "u1",
			userAgent: "Ktor client",
			expiresAt: new Date(Date.now() + 60_000),
			updatedAt: new Date(),
		});
		await database.insert(session).values([row("s1"), row("s2")]);

		expect(await labelMobileSession("s1", "Pixel 9", database)).toBe(
			"Penombre mobile · Pixel 9",
		);
		const labels = await database
			.select({ id: session.id, userAgent: session.userAgent })
			.from(session)
			.orderBy(session.id);
		expect(labels).toEqual([
			{ id: "s1", userAgent: "Penombre mobile · Pixel 9" },
			{ id: "s2", userAgent: "Ktor client" },
		]);
	});
});
