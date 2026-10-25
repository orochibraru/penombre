import { beforeEach, describe, expect, spyOn, test } from "bun:test";

import type { Database } from "#lib/server/db/index.js";
import * as dbModule from "#lib/server/db/index.js";
import {
	driveMembers,
	drives,
	files,
	folders,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { DriveAccessError } from "#lib/server/errors.js";
import * as storageIndex from "#lib/server/services/storage/index.js";

const {
	DrivesService,
	drivePath,
	driveStorage,
	driveVolume,
	driveVolumeId,
	rethrowRefusal,
} = await import("./drives");

/**
 * The db is stubbed per-call rather than by mocking `#lib/server/db/index.js` — a
 * module mock would leak into every suite that runs after this one. Each entry
 * in `answers` satisfies one query, in order.
 *
 * `db` is a getter on the service, so it is shadowed rather than assigned.
 */
function serviceWith(answers: unknown[][]) {
	const queue = [...answers];
	const inserted: unknown[] = [];
	const updated: unknown[] = [];
	const deleted: unknown[] = [];
	const next = () => Promise.resolve(queue.shift() ?? []);
	const svc = new DrivesService();
	Object.defineProperty(svc, "db", {
		value: {
			select: () => ({
				from: () => ({
					where: next,
					leftJoin: () => ({ where: next }),
					innerJoin: () => ({ where: next }),
				}),
			}),
			insert: () => ({
				values: (rows: unknown) => {
					inserted.push(rows);
					return Promise.resolve([]);
				},
			}),
			update: () => ({
				set: (values: unknown) => {
					updated.push(values);
					return { where: () => Promise.resolve([]) };
				},
			}),
			delete: () => ({
				where: (clause: unknown) => {
					deleted.push(clause);
					return Promise.resolve([]);
				},
			}),
		},
		configurable: true,
	});
	return { svc, inserted, updated, deleted };
}

const drive = { id: "d1", name: "Team", ownerId: "owner" };

describe("access", () => {
	test("the owner is always a manager", async () => {
		const { svc } = serviceWith([[drive]]);
		expect(await svc.access("d1", "owner")).toEqual({
			drive: drive as never,
			role: "manager",
		});
	});

	test("a member gets the role on their row", async () => {
		const { svc } = serviceWith([[drive], [{ role: "viewer" }]]);
		expect((await svc.access("d1", "u2"))?.role).toBe("viewer");
	});

	test("a stranger gets nothing", async () => {
		const { svc } = serviceWith([[drive], []]);
		expect(await svc.access("d1", "u3")).toBeNull();
	});
});

describe("requireAccess", () => {
	// A guessed id must not tell a stranger that the drive exists.
	test("reports a drive the caller cannot open as missing", async () => {
		const { svc } = serviceWith([[drive], []]);
		await expect(svc.requireAccess("d1", "u3")).rejects.toMatchObject({
			status: 404,
		});
	});

	test("refuses a non-manager with 403", async () => {
		const { svc } = serviceWith([[drive], [{ role: "editor" }]]);
		await expect(svc.requireManager("d1", "u2")).rejects.toMatchObject({
			status: 403,
		});
	});
});

describe("addMembers", () => {
	test("never writes a row for the owner", async () => {
		// access → drive, owner is the caller; then the candidate lookup.
		const { svc, inserted } = serviceWith([[drive], [{ id: "owner" }]]);
		expect(await svc.addMembers("d1", "owner", ["owner"], "editor")).toEqual(
			[],
		);
		expect(inserted).toHaveLength(0);
	});

	test("returns only the people newly granted access", async () => {
		const { svc, inserted, updated } = serviceWith([
			[drive],
			[{ id: "u2" }, { id: "u3" }],
			[{ userId: "u2" }],
		]);
		expect(await svc.addMembers("d1", "owner", ["u2", "u3"], "editor")).toEqual(
			["u3"],
		);
		expect(inserted).toHaveLength(1);
		// The one who was already on the drive is moved to the new role.
		expect(updated).toEqual([{ role: "editor" }]);
	});
});

describe("removeMember", () => {
	test("anyone may remove themselves", async () => {
		const { svc, deleted } = serviceWith([[drive], [{ role: "viewer" }]]);
		await svc.removeMember("d1", "u2", "u2");
		expect(deleted).toHaveLength(1);
	});

	test("a member may not remove someone else", async () => {
		const { svc } = serviceWith([[drive], [{ role: "editor" }]]);
		await expect(svc.removeMember("d1", "u2", "u3")).rejects.toMatchObject({
			status: 403,
		});
	});
});

describe("remove", () => {
	test("a manager who is not the owner may not delete the drive", async () => {
		const { svc, deleted } = serviceWith([[drive], [{ role: "manager" }]]);
		await expect(svc.remove("d1", "u2")).rejects.toMatchObject({ status: 403 });
		expect(deleted).toHaveLength(0);
	});
});

describe("driveVolume", () => {
	test("is read-only for a viewer", () => {
		expect(driveVolume(drive as never, "viewer")).toMatchObject({
			name: driveVolumeId("d1"),
			label: "Team",
			readOnly: true,
		});
		expect(driveVolume(drive as never, "editor").readOnly).toBe(false);
	});

	// The prefix is what keeps a drive from colliding with an env-declared
	// volume, whose name can only ever be `[a-z0-9-]`.
	test("volume ids are namespaced", () => {
		expect(driveVolumeId("d1")).toBe("drive:d1");
	});
});

describe("rethrowRefusal", () => {
	test("lets a drive refusal through and swallows anything else", () => {
		const refusal = new DriveAccessError(403, "no");
		expect(() => rethrowRefusal(refusal)).toThrow(refusal);
		expect(() => rethrowRefusal(new Error("disk full"))).not.toThrow();
	});
});

describe("drivePath", () => {
	test("each drive has its own root under the storage path", () => {
		expect(drivePath("d1")).toBe("/tmp/penombre-test-storage/drives/d1");
	});
});

describe("drives over the real migrations", () => {
	let database: Database;
	let svc: InstanceType<typeof DrivesService>;

	beforeEach(async () => {
		database = migratedSqlite();
		await database.insert(user).values([
			{ id: "owner", name: "Owner", email: "owner@x.test" },
			{ id: "ada", name: "Ada", email: "ada@x.test" },
			{ id: "bob", name: "Bob", email: "bob@x.test" },
		]);
		await database.insert(drives).values([
			{ id: "d1", name: "Zebra", ownerId: "owner" },
			{ id: "d2", name: "Alpha", ownerId: "ada" },
			{ id: "d3", name: "Nobody's", ownerId: "bob" },
		]);
		await database.insert(driveMembers).values([
			{ id: "m1", driveId: "d1", userId: "ada", role: "editor" },
			{ id: "m2", driveId: "d1", userId: "bob", role: "viewer" },
		]);
		svc = new DrivesService();
		Object.defineProperty(svc, "db", { value: database, configurable: true });
	});

	test("lists the drives a user owns or belongs to, by name", async () => {
		expect(await svc.listForUser("ada")).toEqual([
			{ id: "d2", name: "Alpha", owner: true, role: "manager" },
			{ id: "d1", name: "Zebra", owner: false, role: "editor" },
		]);
		expect(await svc.listForUser("nobody")).toEqual([]);
	});

	test("a created drive belongs to its creator, who manages it", async () => {
		const created = await svc.create("bob", "Band");
		expect(created).toMatchObject({
			name: "Band",
			owner: true,
			role: "manager",
		});
		expect(await svc.access(created.id, "bob")).toMatchObject({
			role: "manager",
		});
	});

	test("a manager renames a drive, an editor may not", async () => {
		await svc.rename("d1", "owner", "Renamed");
		await expect(svc.rename("d1", "bob", "Mine")).rejects.toMatchObject({
			status: 403,
		});
		const names = await database.select({ name: drives.name }).from(drives);
		expect(names.map((row) => row.name)).toContain("Renamed");
		expect(names.map((row) => row.name)).not.toContain("Mine");
	});

	test("the owner deletes the drive with its rows, and nothing else", async () => {
		await database.insert(folders).values([
			{
				id: "folder-1",
				name: "Mix",
				ownerId: "owner",
				path: "Mix",
				volumeId: "drive:d1",
			},
			{ id: "folder-2", name: "Mine", ownerId: "owner", path: "Mine" },
		]);
		await database.insert(files).values([
			{
				id: "fi1",
				name: "a.wav",
				ownerId: "owner",
				path: "Mix/a.wav",
				volumeId: "drive:d1",
			},
			{ id: "fi2", name: "b.wav", ownerId: "owner", path: "b.wav" },
			{
				id: "fi3",
				name: "c.wav",
				ownerId: "ada",
				path: "c.wav",
				volumeId: "drive:d2",
			},
		]);

		await svc.remove("d1", "owner");

		const fileIds = await database.select({ id: files.id }).from(files);
		const folderIds = await database.select({ id: folders.id }).from(folders);
		const driveIds = await database.select({ id: drives.id }).from(drives);
		expect(fileIds.map((row) => row.id).toSorted()).toEqual(["fi2", "fi3"]);
		expect(folderIds.map((row) => row.id)).toEqual(["folder-2"]);
		expect(driveIds.map((row) => row.id).toSorted()).toEqual(["d2", "d3"]);
	});

	test("lists the owner first, as a manager, then the members", async () => {
		expect(await svc.members("d1", "bob")).toEqual([
			{
				userId: "owner",
				name: "Owner",
				email: "owner@x.test",
				image: null,
				role: "manager",
				owner: true,
			},
			{
				userId: "ada",
				name: "Ada",
				email: "ada@x.test",
				image: null,
				role: "editor",
				owner: false,
			},
			{
				userId: "bob",
				name: "Bob",
				email: "bob@x.test",
				image: null,
				role: "viewer",
				owner: false,
			},
		]);
		await expect(svc.members("d2", "bob")).rejects.toMatchObject({
			status: 404,
		});
	});
});

describe("driveStorage", () => {
	const drive = { id: "d1", name: "Team", ownerId: "owner" } as never;
	const actor = { id: "ada", name: "Ada" } as never;

	test("a drive whose owner is gone is reported missing", async () => {
		await expect(driveStorage(drive, "editor", actor)).rejects.toMatchObject({
			status: 404,
		});
	});

	test("opens the owner's rows as the actor and makes the drive's directory", async () => {
		const database = migratedSqlite();
		await database
			.insert(user)
			.values({ id: "owner", name: "Owner", email: "owner@x.test" });
		const made: unknown[][] = [];
		const getDb = spyOn(dbModule, "getDb").mockReturnValue(database);
		const constructed = spyOn(
			storageIndex,
			"StorageService",
		).mockImplementation(function (...args: unknown[]) {
			made.push(args);
			return { ensureUserDirectory: async () => made.push(["mkdir"]) };
		} as never);
		try {
			await driveStorage(drive, "viewer", actor);
			const [owner, volume, by] = made[0] ?? [];
			expect(owner).toMatchObject({ id: "owner" });
			expect(volume).toMatchObject({ name: "drive:d1", readOnly: true });
			expect(by).toBe(actor);
			expect(made[1]).toEqual(["mkdir"]);
		} finally {
			getDb.mockRestore();
			constructed.mockRestore();
		}
	});
});
