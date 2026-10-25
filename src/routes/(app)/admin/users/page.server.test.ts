import type { Mock } from "bun:test";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { eq } from "drizzle-orm";

import { auth } from "#lib/server/auth/index.js";
import { envProvided } from "#lib/server/config.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import {
	account,
	appSettings,
	invites,
	user as userTable,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { Email } from "#lib/server/email.js";

const mockListUsers = auth.api.listUsers as unknown as Mock<
	typeof auth.api.listUsers
>;
const mockSetRole = auth.api.setRole as unknown as Mock<
	(...args: unknown[]) => Promise<unknown>
>;
const mockBanUser = auth.api.banUser as unknown as Mock<
	(...args: unknown[]) => Promise<unknown>
>;
const mockUnbanUser = auth.api.unbanUser as unknown as Mock<
	(...args: unknown[]) => Promise<unknown>
>;
const mockRemoveUser = auth.api.removeUser as unknown as Mock<
	(...args: unknown[]) => Promise<unknown>
>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;

const { actions, load } = await import("./+page.server");

const QUERIES = ["select", "insert", "update", "delete"] as const;
const sharedDb = getDb() as unknown as Record<string, unknown>;
const originalQueries = { ...sharedDb };
const api = auth.api as unknown as Record<string, unknown>;
const sendTemplate = Email.sendTemplate;

let database: Database;
let mailed: { to: string; subject: string; url?: string }[];

beforeEach(async () => {
	database = migratedSqlite();
	for (const query of QUERIES) {
		sharedDb[query] = (...args: unknown[]) =>
			(database[query] as (...inner: unknown[]) => unknown)(...args);
	}
	await database.insert(userTable).values([
		{ id: "admin", name: "Admin", email: "admin@x.test", role: "admin" },
		{ id: "member", name: "Member", email: "member@x.test", role: "user" },
		{
			id: "invited",
			name: "Invited",
			email: "invited@x.test",
			role: "user",
			driveOnly: true,
		},
	]);
	await database.insert(account).values({
		id: "acc-member",
		accountId: "member",
		providerId: "credential",
		userId: "member",
		password: "hash",
	});
	mailed = [];
	Email.sendTemplate = async (to, content) => {
		mailed.push({ to, subject: content.subject, url: content.action?.url });
	};
});

afterEach(() => {
	for (const query of QUERIES) {
		if (query in originalQueries) {
			sharedDb[query] = originalQueries[query];
		} else {
			delete sharedDb[query];
		}
	}
	delete api.createUser;
	Email.sendTemplate = sendTemplate;
});

/** Stored SMTP settings, read once: the env mock claims SMTP otherwise. */
async function mailConfigured() {
	await database.insert(appSettings).values({
		id: "instance",
		settings: {
			smtp: { enabled: true, host: "smtp.example", from: "drive@example" },
		} as never,
	});
	mockEnvProvided.mockReturnValueOnce({ ...envProvided(), smtp: false });
}

const admin = { id: "admin", role: "admin" };

function submit(data: Record<string, string>, sessionUser: unknown = admin) {
	const body = new FormData();
	for (const [key, value] of Object.entries(data)) {
		body.append(key, value);
	}
	return {
		request: new Request("http://localhost/admin/users", {
			method: "POST",
			body,
		}),
		locals: { user: sessionUser },
	} as never;
}

const tokenOf = (url: string | undefined) =>
	new URL(url ?? "http://x").searchParams.get("token");

describe("load", () => {
	test("returns users list", async () => {
		const users = {
			users: [
				{ id: "user-1", name: "Alice", email: "alice@example.com" },
				{ id: "user-2", name: "Bob", email: "bob@example.com" },
			],
		};
		mockListUsers.mockResolvedValueOnce(users as never);

		const result = await load({
			request: new Request("http://localhost"),
		} as never);

		expect(result).toMatchObject({ users });
	});

	test("passes empty query and request headers to listUsers", async () => {
		mockListUsers.mockResolvedValueOnce({ users: [] } as never);

		const request = new Request("http://localhost", {
			headers: { Authorization: "Bearer admin-token" },
		});
		await load({ request } as never);

		expect(mockListUsers).toHaveBeenLastCalledWith({
			query: {},
			headers: request.headers,
		});
	});

	test("throws 500 when listUsers fails", async () => {
		mockListUsers.mockRejectedValueOnce(new Error("Forbidden"));

		expect(
			load({ request: new Request("http://localhost") } as never),
		).rejects.toThrow();
	});

	test("marks who can be invited again and who is drive-only", async () => {
		mockListUsers.mockResolvedValueOnce({
			users: [{ id: "admin" }, { id: "member" }, { id: "invited" }],
		} as never);

		expect(
			await load({ request: new Request("http://localhost") } as never),
		).toMatchObject({
			invitable: ["admin", "invited"],
			driveOnlyUsers: ["invited"],
			smtpEnabled: false,
			origin: "http://localhost:5173",
		});
	});

	test("an empty list needs no lookups", async () => {
		mockListUsers.mockResolvedValueOnce({ users: [] } as never);
		expect(
			await load({ request: new Request("http://localhost") } as never),
		).toMatchObject({ invitable: [], driveOnlyUsers: [] });
	});
});

describe("every action", () => {
	test("refuses anyone but an admin", async () => {
		for (const [name, action] of Object.entries(actions)) {
			for (const sessionUser of [null, { id: "member", role: "user" }]) {
				const refused = await (action as (event: never) => Promise<unknown>)(
					submit({ userId: "member" }, sessionUser),
				).catch((error: unknown) => error);
				expect([name, refused]).toMatchObject([name, { status: 403 }]);
			}
		}
	});
});

describe("inviteUser", () => {
	/** Creates the user and its credential row, as better-auth would. */
	function createUserStub() {
		const calls: { body: Record<string, unknown> }[] = [];
		api.createUser = async (input: { body: Record<string, unknown> }) => {
			calls.push(input);
			const id = `user-${calls.length}`;
			await database.insert(userTable).values({
				id,
				name: String(input.body.name),
				email: String(input.body.email),
			});
			await database.insert(account).values({
				id: `acc-${id}`,
				accountId: id,
				providerId: "credential",
				userId: id,
				password: "random",
			});
			return { user: { id } };
		};
		return calls;
	}

	test("refuses an invalid address", async () => {
		createUserStub();
		for (const email of ["", "   ", "not-an-address", "a@b"]) {
			expect(await actions.inviteUser(submit({ email }))).toMatchObject({
				status: 400,
			});
		}
	});

	test("creates an account with no credential and hands back its link", async () => {
		const calls = createUserStub();
		const result = await actions.inviteUser(
			submit({ email: "  New@Example.COM ", driveOnly: "on" }),
		);

		expect(calls[0]?.body).toMatchObject({
			email: "new@example.com",
			name: "new",
			role: "user",
			data: { driveOnly: true },
		});
		expect(result).toMatchObject({
			success: true,
			invited: "new@example.com",
		});
		const url = (result as { onboardingUrl?: string }).onboardingUrl;
		expect(url).toStartWith("http://localhost:5173/auth/onboarding?token=");

		expect(
			await database.select().from(account).where(eq(account.userId, "user-1")),
		).toEqual([]);
		const [invite] = await database
			.select()
			.from(invites)
			.where(eq(invites.userId, "user-1"));
		expect(invite).toMatchObject({ token: tokenOf(url), createdBy: "admin" });
		expect(mailed).toEqual([]);
	});

	test("keeps a given name and mails the link when asked", async () => {
		const calls = createUserStub();
		await mailConfigured();
		const result = await actions.inviteUser(
			submit({ email: "new@example.com", name: " Nina ", sendEmail: "on" }),
		);

		expect(calls[0]?.body).toMatchObject({ name: "Nina" });
		expect(result).toEqual({
			success: true,
			invited: "new@example.com",
			onboardingUrl: undefined,
		});
		expect(mailed).toMatchObject([
			{ to: "new@example.com", subject: "You have been added to Penombre" },
		]);
		expect(tokenOf(mailed[0]?.url)).toMatch(/^[0-9a-f]{32}$/);
	});

	test("asked to mail with no mail server, it sends nothing", async () => {
		createUserStub();
		const result = await actions.inviteUser(
			submit({ email: "new@example.com", sendEmail: "on" }),
		);
		expect(result).toMatchObject({ success: true, onboardingUrl: undefined });
		expect(mailed).toEqual([]);
	});

	test("a failed mail still reports the account and its link", async () => {
		createUserStub();
		await mailConfigured();
		Email.sendTemplate = () => Promise.reject(new Error("relay refused"));

		const result = await actions.inviteUser(
			submit({ email: "new@example.com", sendEmail: "on" }),
		);
		expect(result).toMatchObject({
			success: true,
			invited: "new@example.com",
			mailFailed: "relay refused",
		});
		expect((result as { onboardingUrl?: string }).onboardingUrl).toStartWith(
			"http://localhost:5173/auth/onboarding?token=",
		);
	});

	test("a refused creation is a 500", async () => {
		api.createUser = () => Promise.reject(new Error("User already exists"));
		expect(
			await actions.inviteUser(submit({ email: "member@x.test" })),
		).toMatchObject({
			status: 500,
			data: { error: "Failed to create the invite." },
		});
	});
});

describe("resendInvite", () => {
	test("needs a known account that never set a password", async () => {
		expect(await actions.resendInvite(submit({}))).toMatchObject({
			status: 400,
		});
		expect(
			await actions.resendInvite(submit({ userId: "nobody" })),
		).toMatchObject({ status: 404 });
		expect(
			await actions.resendInvite(submit({ userId: "member" })),
		).toMatchObject({
			status: 400,
			data: { error: "This account already has a password set." },
		});
	});

	test("issues a fresh link and retires the old one", async () => {
		const first = await actions.resendInvite(submit({ userId: "invited" }));
		const second = await actions.resendInvite(submit({ userId: "invited" }));
		const firstToken = tokenOf(
			(first as { onboardingUrl?: string }).onboardingUrl,
		);
		const secondToken = tokenOf(
			(second as { onboardingUrl?: string }).onboardingUrl,
		);

		expect(second).toMatchObject({ success: true, invited: "invited@x.test" });
		expect(firstToken).not.toBe(secondToken);
		const [retired] = await database
			.select()
			.from(invites)
			.where(eq(invites.token, firstToken ?? ""));
		expect(retired?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
	});

	test("mails the link when asked", async () => {
		await mailConfigured();
		const result = await actions.resendInvite(
			submit({ userId: "invited", sendEmail: "on" }),
		);
		expect(result).toEqual({
			success: true,
			invited: "invited@x.test",
			onboardingUrl: undefined,
		});
		expect(mailed).toMatchObject([{ to: "invited@x.test" }]);
	});

	test("a failed mail hands the link back", async () => {
		await mailConfigured();
		Email.sendTemplate = () => Promise.reject(new Error("relay refused"));
		expect(
			await actions.resendInvite(
				submit({ userId: "invited", sendEmail: "on" }),
			),
		).toMatchObject({ success: true, mailFailed: "relay refused" });
	});

	test("a failure to mint the link is a 500", async () => {
		sharedDb.update = () => {
			throw new Error("database is locked");
		};
		expect(
			await actions.resendInvite(submit({ userId: "invited" })),
		).toMatchObject({ status: 500 });
	});
});

describe("setRole", () => {
	test("needs a user and a known role", async () => {
		for (const data of [
			{ role: "admin" },
			{ userId: "member", role: "root" },
		]) {
			expect(await actions.setRole(submit(data))).toMatchObject({
				status: 400,
			});
		}
	});

	test("promoting an account gives it back a drive of its own", async () => {
		mockSetRole.mockResolvedValueOnce({});
		expect(
			await actions.setRole(submit({ userId: "invited", role: "admin" })),
		).toEqual({ success: true });
		expect(mockSetRole).toHaveBeenLastCalledWith(
			expect.objectContaining({ body: { userId: "invited", role: "admin" } }),
		);
		const [row] = await database
			.select()
			.from(userTable)
			.where(eq(userTable.id, "invited"));
		expect(row?.driveOnly).toBe(false);
	});

	test("demoting leaves the drive setting alone", async () => {
		mockSetRole.mockResolvedValueOnce({});
		await actions.setRole(submit({ userId: "invited", role: "user" }));
		const [row] = await database
			.select()
			.from(userTable)
			.where(eq(userTable.id, "invited"));
		expect(row?.driveOnly).toBe(true);
	});

	test("a refusal from better-auth is a 500 with its reason", async () => {
		mockSetRole.mockRejectedValueOnce(new Error("Cannot demote"));
		expect(
			await actions.setRole(submit({ userId: "member", role: "user" })),
		).toMatchObject({ status: 500, data: { error: "Cannot demote" } });
	});
});

describe("setBanned", () => {
	test("needs a user", async () => {
		expect(await actions.setBanned(submit({}))).toMatchObject({ status: 400 });
	});

	test("bans with a reason, and unbans", async () => {
		mockBanUser.mockResolvedValueOnce({});
		mockUnbanUser.mockResolvedValueOnce({});

		expect(
			await actions.setBanned(
				submit({ userId: "member", banned: "true", reason: "Spam" }),
			),
		).toEqual({ success: true });
		expect(mockBanUser).toHaveBeenLastCalledWith(
			expect.objectContaining({
				body: { userId: "member", banReason: "Spam" },
			}),
		);

		expect(
			await actions.setBanned(submit({ userId: "member", banned: "false" })),
		).toEqual({ success: true });
		expect(mockUnbanUser).toHaveBeenLastCalledWith(
			expect.objectContaining({ body: { userId: "member" } }),
		);
	});

	test("a ban with no reason sends none", async () => {
		mockBanUser.mockResolvedValueOnce({});
		await actions.setBanned(submit({ userId: "member", banned: "true" }));
		expect(mockBanUser).toHaveBeenLastCalledWith(
			expect.objectContaining({
				body: { userId: "member", banReason: undefined },
			}),
		);
	});

	test("a failure is a 500 with its reason", async () => {
		mockUnbanUser.mockRejectedValueOnce(new Error("No such user"));
		expect(
			await actions.setBanned(submit({ userId: "member", banned: "false" })),
		).toMatchObject({ status: 500, data: { error: "No such user" } });
	});
});

describe("setDriveOnly", () => {
	const driveOnlyOf = async (id: string) =>
		(
			await database
				.select({ driveOnly: userTable.driveOnly })
				.from(userTable)
				.where(eq(userTable.id, id))
		)[0]?.driveOnly;

	test("needs a known user", async () => {
		expect(await actions.setDriveOnly(submit({}))).toMatchObject({
			status: 400,
		});
		expect(
			await actions.setDriveOnly(
				submit({ userId: "nobody", driveOnly: "true" }),
			),
		).toMatchObject({ status: 404 });
	});

	test("never takes an administrator's drive", async () => {
		expect(
			await actions.setDriveOnly(
				submit({ userId: "admin", driveOnly: "true" }),
			),
		).toMatchObject({ status: 400 });
		expect(await driveOnlyOf("admin")).toBe(false);
	});

	test("sets the wanted state", async () => {
		expect(
			await actions.setDriveOnly(
				submit({ userId: "member", driveOnly: "true" }),
			),
		).toEqual({ success: true });
		expect(await driveOnlyOf("member")).toBe(true);

		await actions.setDriveOnly(
			submit({ userId: "member", driveOnly: "false" }),
		);
		expect(await driveOnlyOf("member")).toBe(false);
	});
});

describe("removeUser", () => {
	test("needs a user, and never the caller", async () => {
		expect(await actions.removeUser(submit({}))).toMatchObject({
			status: 400,
		});
		expect(await actions.removeUser(submit({ userId: "admin" }))).toMatchObject(
			{
				status: 400,
				data: { error: "You cannot delete your own account." },
			},
		);
	});

	test("removes someone else", async () => {
		mockRemoveUser.mockResolvedValueOnce({});
		expect(await actions.removeUser(submit({ userId: "member" }))).toEqual({
			success: true,
		});
		expect(mockRemoveUser).toHaveBeenLastCalledWith(
			expect.objectContaining({ body: { userId: "member" } }),
		);
	});

	test("a failure is a 500 with its reason", async () => {
		mockRemoveUser.mockRejectedValueOnce(new Error("Last admin"));
		expect(
			await actions.removeUser(submit({ userId: "member" })),
		).toMatchObject({ status: 500, data: { error: "Last admin" } });
	});
});
