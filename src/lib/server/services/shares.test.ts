import { beforeEach, describe, expect, test } from "bun:test";

import { eq } from "drizzle-orm";

import {
	driveMembers,
	drives,
	files,
	shares,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const { ShareService, unlockCookieName, unlockToken } =
	await import("./shares");

/**
 * The lookup is stubbed on the instance rather than by mocking the db module:
 * a module mock here would leak into every suite that runs after this one.
 * These cases are about the access gates, not about Drizzle.
 */
let currentShare: Record<string, unknown> | null = null;

const service = new ShareService();
service.findByToken = async () => currentShare as never;

const owner = { id: "owner-1" } as never;
const stranger = { id: "someone-else" } as never;

function share(overrides: Record<string, unknown> = {}) {
	return {
		id: "share-1",
		token: "tok",
		ownerId: "owner-1",
		resourceType: "file",
		resourceId: "file-1",
		resourceName: "notes.txt",
		passwordHash: null,
		requiresAuth: false,
		expiresAt: null,
		downloadCount: 0,
		createdAt: new Date(),
		...overrides,
	};
}

beforeEach(() => {
	currentShare = share();
});

describe("access", () => {
	test("an open link resolves for an anonymous visitor", async () => {
		const result = await service.access("tok");
		expect(result.ok).toBe(true);
	});

	test("an unknown token is not-found", async () => {
		currentShare = null;
		expect(await service.access("nope")).toEqual({
			ok: false,
			reason: "not-found",
		});
	});

	test("a past expiry is refused", async () => {
		currentShare = share({ expiresAt: new Date(Date.now() - 1000) });
		expect(await service.access("tok")).toEqual({
			ok: false,
			reason: "expired",
		});
	});

	test("a future expiry still resolves", async () => {
		currentShare = share({ expiresAt: new Date(Date.now() + 60_000) });
		expect((await service.access("tok")).ok).toBe(true);
	});

	test("requiresAuth refuses an anonymous visitor but allows a signed-in one", async () => {
		currentShare = share({ requiresAuth: true });

		expect(await service.access("tok")).toEqual({ ok: false, reason: "auth" });
		expect((await service.access("tok", { viewer: stranger })).ok).toBe(true);
	});

	test("a password gate refuses with no password and with a wrong one", async () => {
		currentShare = share({
			passwordHash: await Bun.password.hash("correct-horse"),
		});

		expect(await service.access("tok")).toEqual({
			ok: false,
			reason: "password",
		});
		expect(await service.access("tok", { password: "wrong" })).toEqual({
			ok: false,
			reason: "password",
		});
	});

	test("the right password opens a gated link", async () => {
		currentShare = share({
			passwordHash: await Bun.password.hash("correct-horse"),
		});

		expect(
			(await service.access("tok", { password: "correct-horse" })).ok,
		).toBe(true);
	});

	test("the owner skips the password gate", async () => {
		currentShare = share({
			passwordHash: await Bun.password.hash("correct-horse"),
		});

		expect((await service.access("tok", { viewer: owner })).ok).toBe(true);
	});

	test("a valid unlock proof opens the gate, a foreign one does not", async () => {
		const gated = share({
			passwordHash: await Bun.password.hash("correct-horse"),
		});
		currentShare = gated;

		const proof = await unlockToken(gated as never);
		expect((await service.access("tok", { unlock: proof })).ok).toBe(true);
		expect(await service.access("tok", { unlock: "forged" })).toEqual({
			ok: false,
			reason: "password",
		});
	});

	test("changing the password invalidates an outstanding unlock proof", async () => {
		const before = share({ passwordHash: await Bun.password.hash("old") });
		const staleProof = await unlockToken(before as never);

		currentShare = share({ passwordHash: await Bun.password.hash("new") });

		expect(await service.access("tok", { unlock: staleProof })).toEqual({
			ok: false,
			reason: "password",
		});
	});

	test("expiry is checked before the password, so an expired link never prompts", async () => {
		currentShare = share({
			passwordHash: await Bun.password.hash("correct-horse"),
			expiresAt: new Date(Date.now() - 1000),
		});

		expect(await service.access("tok", { password: "correct-horse" })).toEqual({
			ok: false,
			reason: "expired",
		});
	});
});

describe("fileIsInFolder", () => {
	/**
	 * `fileIsInFolder` runs two identical-shaped selects — folder first, then
	 * file. Answer them in order so the test is about the prefix rule, which
	 * is what stops a folder share becoming a read-anything capability.
	 */
	function serviceReturning(
		folder: { path: string } | null,
		file: { path: string } | null,
	) {
		const answers = [folder ? [folder] : [], file ? [file] : []];
		const svc = new ShareService();
		// Reaching past `private db` is the point of the stub.
		(svc as any).db = {
			select: () => ({
				from: () => ({ where: () => Promise.resolve(answers.shift() ?? []) }),
			}),
		};
		return svc;
	}

	const check = (
		folder: { path: string } | null,
		file: { path: string } | null,
	) => serviceReturning(folder, file).fileIsInFolder("f", "x");

	test("a file directly inside the folder is allowed", async () => {
		expect(
			await check({ path: "folder-1" }, { path: "folder-1/notes.txt" }),
		).toBe(true);
	});

	test("a nested file is allowed", async () => {
		expect(
			await check({ path: "folder-1" }, { path: "folder-1/sub/deep.txt" }),
		).toBe(true);
	});

	test("a file outside the folder is refused", async () => {
		expect(await check({ path: "folder-1" }, { path: "other/notes.txt" })).toBe(
			false,
		);
	});

	test("a sibling folder sharing a name prefix is refused", async () => {
		// "folder-1" must not match "folder-10/..." — hence the trailing slash.
		expect(
			await check({ path: "folder-1" }, { path: "folder-10/secret.txt" }),
		).toBe(false);
	});

	test("the folder itself is not a file inside it", async () => {
		expect(await check({ path: "folder-1" }, { path: "folder-1" })).toBe(false);
	});

	test("a missing folder or file is refused", async () => {
		expect(await check(null, { path: "folder-1/notes.txt" })).toBe(false);
		expect(await check({ path: "folder-1" }, null)).toBe(false);
	});
});

describe("resolveShareable", () => {
	// Real SQLite: a drive's rows belong to its creator, so only the drive
	// role can let anyone else link to them.
	async function drive() {
		const database = migratedSqlite();
		await database.insert(user).values(
			["creator", "manager", "editor", "stranger"].map((id) => ({
				id,
				name: id,
				email: `${id}@x.test`,
			})),
		);
		await database
			.insert(drives)
			.values({ id: "d1", name: "Team", ownerId: "creator" });
		await database.insert(driveMembers).values([
			{ id: "m1", driveId: "d1", userId: "manager", role: "manager" },
			{ id: "m2", driveId: "d1", userId: "editor", role: "editor" },
		]);
		await database.insert(files).values([
			{
				id: "f1",
				name: "a.wav",
				ownerId: "creator",
				path: "a.wav",
				volumeId: "drive:d1",
			},
			{ id: "f2", name: "b.wav", ownerId: "creator", path: "b.wav" },
		]);
		const svc = new ShareService();
		(svc as any).db = database;
		return (userId: string, fileId = "f1") =>
			svc.resolveShareable(userId, "file", fileId);
	}

	test("the row owner and a drive manager may; an editor or stranger may not", async () => {
		const check = await drive();
		expect(await check("creator")).toMatchObject({
			ownerId: "creator",
			volumeId: "drive:d1",
		});
		expect(await check("manager")).toMatchObject({ ownerId: "creator" });
		expect(await check("editor")).toBe("forbidden");
		expect(await check("stranger")).toBe("forbidden");
		expect(await check("manager", "missing")).toBe("not-found");
	});

	test("managing a drive grants nothing on the creator's personal files", async () => {
		const check = await drive();
		expect(await check("manager", "f2")).toBe("forbidden");
	});
});

describe("link lifecycle", () => {
	async function linkable() {
		const database = migratedSqlite();
		await database.insert(user).values(
			["alice", "bob"].map((id) => ({
				id,
				name: id,
				email: `${id}@x.test`,
			})),
		);
		await database.insert(files).values([
			{ id: "f1", name: "a.wav", ownerId: "alice", path: "a.wav" },
			{ id: "f2", name: "b.wav", ownerId: "alice", path: "b.wav" },
		]);
		const links = new ShareService();
		(links as any).db = database;
		return links;
	}

	const input = (overrides: Record<string, unknown> = {}) =>
		({
			ownerId: "alice",
			resourceType: "file",
			resourceId: "f1",
			...overrides,
		}) as never;

	test("create stores the row's name, a hashed password and no expiry by default", async () => {
		const links = await linkable();
		const created = await links.create(input({ password: "correct-horse" }));
		if (typeof created === "string") {
			throw new Error(created);
		}

		expect(created.token).toMatch(/^[0-9a-f]{32}$/);
		expect(created.resourceName).toBe("a.wav");
		expect(created.requiresAuth).toBe(false);
		expect(created.expiresAt).toBeNull();
		expect(created.passwordHash).not.toBe("correct-horse");
		expect(
			await Bun.password.verify("correct-horse", created.passwordHash ?? ""),
		).toBe(true);
		expect(await links.findByToken(created.token)).toMatchObject({
			id: created.id,
		});
	});

	test("create sets an expiry in days and keeps requiresAuth", async () => {
		const links = await linkable();
		const created = await links.create(
			input({ expiresInDays: 2, requiresAuth: true }),
		);
		if (typeof created === "string") {
			throw new Error(created);
		}

		const remaining = (created.expiresAt?.getTime() ?? 0) - Date.now();
		expect(remaining).toBeGreaterThan(86_400_000);
		expect(remaining).toBeLessThanOrEqual(2 * 86_400_000);
		expect(created.requiresAuth).toBe(true);
		expect(created.passwordHash).toBeNull();
	});

	test("create refuses a missing resource and someone else's", async () => {
		const links = await linkable();
		expect(await links.create(input({ resourceId: "missing" }))).toBe(
			"not-found",
		);
		expect(await links.create(input({ ownerId: "bob" }))).toBe("forbidden");
		expect(await links.list("bob")).toEqual([]);
	});

	test("list returns only the caller's links, newest first", async () => {
		const links = await linkable();
		const first = await links.create(input());
		const second = await links.create(input({ resourceId: "f2" }));
		if (typeof first === "string" || typeof second === "string") {
			throw new Error("create refused");
		}
		await (links as any).db
			.update(shares)
			.set({ createdAt: new Date(Date.now() - 60_000) })
			.where(eq(shares.id, first.id));

		expect((await links.list("alice")).map((link) => link.id)).toEqual([
			second.id,
			first.id,
		]);
		expect(await links.list("bob")).toEqual([]);
	});

	test("revoke is scoped to the link's owner", async () => {
		const links = await linkable();
		const created = await links.create(input());
		if (typeof created === "string") {
			throw new Error(created);
		}

		expect(await links.revoke("bob", created.id)).toBe(false);
		expect(await links.findByToken(created.token)).not.toBeNull();
		expect(await links.revoke("alice", created.id)).toBe(true);
		expect(await links.findByToken(created.token)).toBeNull();
		expect(await links.revoke("alice", created.id)).toBe(false);
	});

	test("recordDownload counts each download", async () => {
		const links = await linkable();
		const created = await links.create(input());
		if (typeof created === "string") {
			throw new Error(created);
		}

		await links.recordDownload(created.id);
		await links.recordDownload(created.id);
		expect((await links.findByToken(created.token))?.downloadCount).toBe(2);
	});

	test("purgeExpired drops past links only", async () => {
		const links = await linkable();
		const expired = await links.create(input({ expiresInDays: 1 }));
		const lasting = await links.create(input({ expiresInDays: 1 }));
		const forever = await links.create(input());
		if (
			typeof expired === "string" ||
			typeof lasting === "string" ||
			typeof forever === "string"
		) {
			throw new Error("create refused");
		}
		await (links as any).db
			.update(shares)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(shares.id, expired.id));

		expect(await links.purgeExpired()).toBe(1);
		expect(await links.findByToken(expired.token)).toBeNull();
		expect(await links.findByToken(lasting.token)).not.toBeNull();
		expect(await links.findByToken(forever.token)).not.toBeNull();
	});
});

describe("unlockCookieName", () => {
	test("names one cookie per token", () => {
		expect(unlockCookieName("abc")).toBe("share_unlock_abc");
		expect(unlockCookieName("abc")).not.toBe(unlockCookieName("xyz"));
	});
});
