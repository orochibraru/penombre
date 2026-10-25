import type { Mock } from "bun:test";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import { appSettings, invites, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { createInvite } from "#lib/server/services/invites.js";

const mockMethods = instanceSignInMethods as Mock<typeof instanceSignInMethods>;

const { actions, load } = await import("./+page.server");

const QUERIES = ["select", "insert", "update", "delete"] as const;
const sharedDb = getDb() as unknown as Record<string, unknown>;
const originalQueries = { ...sharedDb };
const authContext = auth as unknown as Record<string, unknown>;

let database: Database;
let created: Record<string, unknown>[];

beforeEach(async () => {
	database = migratedSqlite();
	for (const query of QUERIES) {
		sharedDb[query] = (...args: unknown[]) =>
			(database[query] as (...inner: unknown[]) => unknown)(...args);
	}
	await database
		.insert(user)
		.values({ id: "invited", name: "Invited", email: "in+vited@x.test" });
	created = [];
	authContext.$context = Promise.resolve({
		password: { hash: async (password: string) => `hashed:${password}` },
		internalAdapter: {
			createAccount: async (row: Record<string, unknown>) => {
				created.push(row);
			},
		},
	});
});

afterEach(() => {
	for (const query of QUERIES) {
		if (query in originalQueries) {
			sharedDb[query] = originalQueries[query];
		} else {
			delete sharedDb[query];
		}
	}
	delete authContext.$context;
});

const methods = (password: boolean) => ({
	password,
	passkey: false,
	magicLink: false,
	emailOtp: false,
});

function visit(search: string) {
	return { url: new URL(`http://localhost/auth/onboarding${search}`) } as never;
}

async function redirected(promise: Promise<unknown>) {
	return promise.then(
		() => undefined,
		(error: unknown) => error,
	);
}

function createRequest(data: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(data)) {
		formData.append(key, value);
	}
	return {
		request: new Request("http://localhost", {
			method: "POST",
			body: formData,
		}),
	};
}

/**
 * These assert the stable *codes* `setPassword` fails with, never English
 * prose, which used to reach every locale verbatim (see `#lib/form-errors.ts`,
 * which maps them back to a translated message client-side).
 */
describe("actions.setPassword", () => {
	test("an empty token fails with a code, not a sentence", async () => {
		const result = await actions.setPassword(createRequest({}) as never);
		expect(result).toEqual(fail(400, { error: "INVITE_INVALID" }));
	});

	test("mismatched passwords", async () => {
		const result = await actions.setPassword(
			createRequest({
				token: "tok",
				password: "hunter2hunter2",
				confirm: "something-else",
			}) as never,
		);
		expect(result).toEqual(fail(400, { error: "PASSWORD_MISMATCH" }));
	});

	test("a password shorter than the configured minimum carries its count", async () => {
		const result = await actions.setPassword(
			createRequest({
				token: "tok",
				password: "short",
				confirm: "short",
			}) as never,
		);
		expect(result).toEqual(
			fail(400, {
				error: "PASSWORD_TOO_SHORT",
				errorParams: { count: "8" },
			}),
		);
	});
});

describe("load", () => {
	test("sends anyone without a live invite to sign-in", async () => {
		for (const search of ["", "?token=", "?token=unknown"]) {
			expect(await redirected(load(visit(search)))).toMatchObject({
				status: 307,
				location: expect.stringContaining("auth/sign-in"),
			});
		}
	});

	test("sends an invite whose account is gone to sign-in", async () => {
		const token = await createInvite("deleted", null, database);
		expect(await redirected(load(visit(`?token=${token}`)))).toMatchObject({
			status: 307,
		});
	});

	test("shows the invited address and the password rules", async () => {
		await database.insert(appSettings).values({
			id: "instance",
			settings: { minPasswordLength: 12, requireStrongPassword: true } as never,
		});
		const token = await createInvite("invited", null, database);

		expect(await load(visit(`?token=${token}`))).toEqual({
			token,
			email: "in+vited@x.test",
			passwordEnabled: true,
			minLength: 12,
			requireStrong: true,
		});
	});
});

describe("actions.setPassword, against a real invite", () => {
	const submit = (token: string, password = "correct-horse-battery") => {
		const formData = new FormData();
		formData.set("token", token);
		formData.set("password", password);
		formData.set("confirm", password);
		return {
			request: new Request("http://localhost", {
				method: "POST",
				body: formData,
			}),
		} as never;
	};

	test("refuses while password sign-in is off", async () => {
		mockMethods.mockResolvedValueOnce(methods(false));
		expect(await actions.setPassword(submit("tok"))).toEqual(
			fail(403, { error: "EMAIL_SIGNIN_DISABLED" }),
		);
	});

	test("writes the credential once, then sends the account to sign in", async () => {
		const token = await createInvite("invited", null, database);

		expect(await redirected(actions.setPassword(submit(token)))).toMatchObject({
			status: 303,
			location: expect.stringContaining(
				`auth/sign-in?email=${encodeURIComponent("in+vited@x.test")}`,
			),
		});
		expect(created).toEqual([
			{
				userId: "invited",
				providerId: "credential",
				accountId: "invited",
				password: "hashed:correct-horse-battery",
			},
		]);

		expect(await actions.setPassword(submit(token))).toEqual(
			fail(400, { error: "INVITE_EXPIRED" }),
		);
		expect(created).toHaveLength(1);
	});

	test("the admin's strength rule applies before the invite is spent", async () => {
		await database.insert(appSettings).values({
			id: "instance",
			settings: { requireStrongPassword: true } as never,
		});
		const token = await createInvite("invited", null, database);

		expect(await actions.setPassword(submit(token))).toEqual(
			fail(400, { error: "PASSWORD_NOT_STRONG" }),
		);
		expect(
			await redirected(actions.setPassword(submit(token, "Correct-horse-9"))),
		).toMatchObject({ status: 303 });
	});

	test("an unknown or expired token sets nothing", async () => {
		const token = await createInvite("invited", null, database);
		await database
			.update(invites)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(invites.token, token));

		for (const attempt of [token, "unknown"]) {
			expect(await actions.setPassword(submit(attempt))).toEqual(
				fail(400, { error: "INVITE_EXPIRED" }),
			);
		}
		expect(created).toEqual([]);
	});

	test("an invite whose account is gone is not found", async () => {
		const token = await createInvite("deleted", null, database);
		expect(await actions.setPassword(submit(token))).toEqual(
			fail(404, { error: "INVITE_NO_ACCOUNT" }),
		);
	});

	test("a failed write is reported, not swallowed", async () => {
		authContext.$context = Promise.resolve({
			password: { hash: async () => "hash" },
			internalAdapter: {
				createAccount: () => Promise.reject(new Error("constraint failed")),
			},
		});
		const token = await createInvite("invited", null, database);
		expect(await actions.setPassword(submit(token))).toEqual(
			fail(500, { error: "ONBOARDING_FAILED" }),
		);
	});
});
