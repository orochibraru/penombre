import { describe, expect, test } from "bun:test";
import { verification } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const { createMobileCode, redeemMobileCode, verifierMatches } = await import(
	"./mobile"
);

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
