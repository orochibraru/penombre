import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { invites, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { consumeInvite, createInvite, findValidInvite } from "./invites";

let database: Database;

beforeEach(async () => {
	database = migratedSqlite();
	await database
		.insert(user)
		.values({ id: "u1", name: "Invitee", email: "invitee@x.test" });
});

describe("createInvite / findValidInvite", () => {
	test("a fresh token is valid", async () => {
		const token = await createInvite("u1", null, database);
		const invite = await findValidInvite(token, database);
		expect(invite?.userId).toBe("u1");
	});

	test("a resend invalidates the account's older unused invite", async () => {
		const first = await createInvite("u1", null, database);
		const second = await createInvite("u1", null, database);
		expect(await findValidInvite(first, database)).toBeNull();
		expect((await findValidInvite(second, database))?.userId).toBe("u1");
	});

	test("a resend never invalidates another account's invite", async () => {
		await database
			.insert(user)
			.values({ id: "u2", name: "Other", email: "other@x.test" });
		const other = await createInvite("u2", null, database);
		await createInvite("u1", null, database);
		expect((await findValidInvite(other, database))?.userId).toBe("u2");
	});

	test("an unknown token is not valid", async () => {
		expect(await findValidInvite("nope", database)).toBeNull();
	});

	test("an expired token is not valid", async () => {
		const token = await createInvite("u1", null, database);
		await database
			.update(invites)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(invites.token, token));
		expect(await findValidInvite(token, database)).toBeNull();
	});
});

describe("consumeInvite", () => {
	test("consumes a fresh token once", async () => {
		const token = await createInvite("u1", null, database);
		const first = await consumeInvite(token, database);
		expect(first?.userId).toBe("u1");
	});

	test("a second consume of the same token fails", async () => {
		const token = await createInvite("u1", null, database);
		await consumeInvite(token, database);
		expect(await consumeInvite(token, database)).toBeNull();
	});

	test("an unknown token fails", async () => {
		expect(await consumeInvite("nope", database)).toBeNull();
	});
});
