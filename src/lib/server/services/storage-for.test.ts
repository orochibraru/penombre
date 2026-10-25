import type { Mock } from "bun:test";
import { afterEach, describe, expect, test } from "bun:test";

import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { getVolume, isSimpleMode } from "#lib/server/config.js";
import { type Database, getDb } from "#lib/server/db/index.js";
import {
	drives,
	files,
	folders,
	sharedWith,
	sharings,
	user,
} from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { DriveAccessError } from "#lib/server/errors.js";

import { drivesService } from "./drives";
import {
	resolveShare,
	serviceForRoot,
	shareLinkStorage,
	storageServiceFor,
	volumeById,
	volumeStorage,
} from "./storage-for";

const guest = { id: "g", driveOnly: true } as never;

function event(query: string) {
	return {
		url: new URL(`https://penombre.test/?${query}`),
		locals: { user: guest },
	} as never;
}

const requireAccess = drivesService.requireAccess;
afterEach(() => {
	drivesService.requireAccess = requireAccess;
});

describe("a drive-only account", () => {
	test("has no drive, volume or share outside its drives", async () => {
		for (const query of ["", "volume=music", "share=s1"]) {
			const refused = await storageServiceFor(guest, event(query)).catch(
				(error: unknown) => error,
			);
			expect(refused).toBeInstanceOf(DriveAccessError);
			expect((refused as DriveAccessError).status).toBe(404);
		}
	});

	test("still reaches a drive it is a member of", async () => {
		drivesService.requireAccess = (async () => ({
			drive: { id: "d1", name: "Team", ownerId: "owner" },
			role: "editor",
		})) as never;
		// Past the guard, into the drive's own storage (whose owner row this
		// test has no database for).
		const result = await storageServiceFor(guest, event("drive=d1")).catch(
			(error: unknown) => error,
		);
		expect((result as Error).message).not.toBe("No personal drive");
	});

	test("means nothing in simple mode, where everyone shares one drive", () => {
		expect(isDriveOnly(guest)).toBe(true);
		(
			isSimpleMode as unknown as { mockReturnValueOnce: (v: boolean) => void }
		).mockReturnValueOnce(true);
		expect(isDriveOnly(guest)).toBe(false);
		expect(isDriveOnly({ id: "u", driveOnly: false })).toBe(false);
	});
});

const mockGetVolume = getVolume as Mock<typeof getVolume>;
const music = { name: "music", label: "Music", path: "/mnt/music" } as never;

const QUERIES = ["select", "insert", "update", "delete"] as const;
const sharedDb = getDb() as unknown as Record<string, unknown>;
const originalQueries = { ...sharedDb };

/** Points the preloaded db mock at a real database until the test ends. */
function useDatabase(database: Database) {
	for (const query of QUERIES) {
		sharedDb[query] = (...args: unknown[]) =>
			(database[query] as (...inner: unknown[]) => unknown)(...args);
	}
}

afterEach(() => {
	for (const query of QUERIES) {
		if (query in originalQueries) {
			sharedDb[query] = originalQueries[query];
		} else {
			delete sharedDb[query];
		}
	}
});

const member = { id: "u2", name: "Recipient", driveOnly: false } as never;

async function refusal(promise: Promise<unknown>) {
	const refused = await promise.then(
		() => undefined,
		(error: unknown) => error,
	);
	expect(refused).toBeInstanceOf(DriveAccessError);
	return (refused as DriveAccessError).status;
}

function located(query: string, sessionUser: unknown = member) {
	return {
		url: new URL(`https://penombre.test/?${query}`),
		locals: { user: sessionUser },
	} as never;
}

async function seeded() {
	const database = migratedSqlite();
	await database.insert(user).values([
		{ id: "owner", name: "Owner", email: "owner@x.test" },
		{ id: "u2", name: "Recipient", email: "u2@x.test" },
	]);
	await database
		.insert(drives)
		.values({ id: "d1", name: "Team", ownerId: "owner" });
	await database.insert(folders).values([
		{ id: "docs", name: "Docs", ownerId: "owner", path: "docs" },
		{
			id: "binned",
			name: "Binned",
			ownerId: "owner",
			path: "binned",
			isTrashed: true,
		},
	]);
	await database.insert(files).values([
		{ id: "f1", name: "a.txt", ownerId: "owner", path: "docs/a.txt" },
		{
			id: "gone",
			name: "gone.txt",
			ownerId: "owner",
			path: "gone.txt",
			isTrashed: true,
		},
		{
			id: "orphan",
			name: "orphan.txt",
			ownerId: "owner",
			path: "orphan.txt",
			volumeId: "drive:deleted",
		},
	]);
	useDatabase(database);
	return database;
}

async function granted(
	database: Database,
	resourceType: "file" | "folder",
	resourceId: string,
) {
	const [sharing] = await database
		.insert(sharings)
		.values({ ownerId: "owner", resourceType, resourceId, permission: "read" })
		.returning();
	const [row] = await database
		.insert(sharedWith)
		.values({ sharingId: sharing?.id ?? "", userId: "u2" })
		.returning();
	return row?.id ?? "";
}

describe("storageServiceFor", () => {
	test("a drive or a share needs a session", async () => {
		expect(
			await refusal(storageServiceFor(member, located("drive=d1", null))),
		).toBe(403);
		expect(
			await refusal(storageServiceFor(member, located("share=s1", null))),
		).toBe(403);
	});

	test("an unknown volume is not found", async () => {
		expect(
			await refusal(storageServiceFor(member, located("volume=nope"))),
		).toBe(404);
	});

	test("the location also travels as a header", async () => {
		const event = {
			url: new URL("https://penombre.test/"),
			locals: { user: null },
			request: new Request("https://penombre.test/", {
				headers: { "x-share": "s1" },
			}),
		} as never;
		expect(await refusal(storageServiceFor(member, event))).toBe(403);
	});

	test("a share the caller does not hold is not found", async () => {
		await seeded();
		expect(
			await refusal(storageServiceFor(member, located("share=missing"))),
		).toBe(404);
	});
});

describe("resolveShare", () => {
	test("refuses a grant that is not the caller's", async () => {
		const database = await seeded();
		const grant = await granted(database, "folder", "docs");
		expect(await refusal(resolveShare(grant, { id: "owner" } as never))).toBe(
			404,
		);
	});

	test("refuses a shared folder or file the owner has trashed", async () => {
		const database = await seeded();
		const folder = await granted(database, "folder", "binned");
		const file = await granted(database, "file", "gone");
		expect(await refusal(resolveShare(folder, member))).toBe(404);
		expect(await refusal(resolveShare(file, member))).toBe(404);
	});

	test("refuses a file whose drive was deleted", async () => {
		const database = await seeded();
		const grant = await granted(database, "file", "orphan");
		expect(await refusal(resolveShare(grant, member))).toBe(404);
	});

	test("a live share gets past every refusal", async () => {
		const database = await seeded();
		const folder = await granted(database, "folder", "docs");
		const file = await granted(database, "file", "f1");
		// The preload's `StorageService` cannot be constructed: reaching it
		// is the end of what this suite can see.
		for (const grant of [folder, file]) {
			const outcome = await resolveShare(grant, member).catch(
				(error: unknown) => error,
			);
			expect(outcome).not.toBeInstanceOf(DriveAccessError);
		}
	});
});

describe("volumeById", () => {
	test("maps a row's volume id back to its volume", async () => {
		await seeded();
		expect(await volumeById(null)).toBeUndefined();
		expect(await volumeById("drive:d1")).toMatchObject({
			name: "drive:d1",
			label: "Team",
			readOnly: false,
		});
		expect(await volumeById("drive:deleted")).toBeNull();

		mockGetVolume.mockReturnValueOnce(music);
		expect(await volumeById("music")).toBe(music);
		expect(await volumeById("unmounted")).toBeNull();
	});
});

describe("serviceForRoot", () => {
	test("is undefined when the owner or the volume is gone", async () => {
		await seeded();
		expect(
			await serviceForRoot({ ownerId: "deleted", volumeId: null }),
		).toBeUndefined();
		expect(
			await serviceForRoot({ ownerId: "owner", volumeId: "drive:deleted" }),
		).toBeUndefined();
	});
});

describe("shareLinkStorage", () => {
	test("is undefined when the link's creator may no longer share the row", async () => {
		await seeded();
		expect(
			await shareLinkStorage({
				ownerId: "u2",
				resourceType: "file",
				resourceId: "f1",
			}),
		).toBeUndefined();
		expect(
			await shareLinkStorage({
				ownerId: "owner",
				resourceType: "folder",
				resourceId: "missing",
			}),
		).toBeUndefined();
	});

	test("a link on a deleted drive's file has no tree", async () => {
		await seeded();
		expect(
			await shareLinkStorage({
				ownerId: "owner",
				resourceType: "file",
				resourceId: "orphan",
			}),
		).toBeUndefined();
	});
});

describe("volumeStorage", () => {
	test("refuses a drive-only account", async () => {
		expect(await refusal(volumeStorage(music, guest))).toBe(404);
	});

	test("a known volume gets past the volume refusal", async () => {
		mockGetVolume.mockReturnValueOnce(music);
		const outcome = await storageServiceFor(
			member,
			located("volume=music"),
		).catch((error: unknown) => error);
		expect(outcome).not.toBeInstanceOf(DriveAccessError);
	});
});
