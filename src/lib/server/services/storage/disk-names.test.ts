import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { folders, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import { FolderOperations } from "./folders";
import { diskName, safeSegment } from "./lookups";
import type { ThumbnailService } from "./thumbnails";

let db: Database;
let root: string;

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-folders-"));
	await db.insert(user).values({
		id: "u",
		name: "u",
		email: "u@x",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

function context(namedPaths: boolean) {
	return {
		user: { id: "u" },
		actor: { id: "u" },
		volumeId: null,
		namedPaths,
		storagePath: root,
		db,
		driver: new LocalStorageDriver(root),
		activityService: { register: () => Promise.resolve() },
		invalidateListingCaches: () => Promise.resolve(),
	} as unknown as StorageContext;
}

const ops = (namedPaths: boolean) =>
	new FolderOperations(context(namedPaths), {} as ThumbnailService);

async function pathOf(id: string) {
	const [row] = await db
		.select({ path: folders.path })
		.from(folders)
		.where(eq(folders.id, id));
	return row?.path;
}

describe("folder names on disk", () => {
	test("a named tree gets the folder's own name", async () => {
		const { id } = await ops(true).createFolder("riff kivavit");
		expect(await pathOf(id)).toBe("riff kivavit");
		expect(existsSync(join(root, "riff kivavit"))).toBeTrue();
	});

	test("the personal drive keeps UUIDs", async () => {
		const { id } = await ops(false).createFolder("riff kivavit");
		expect(await pathOf(id)).toBe(id);
	});

	test("never reuses a trashed folder's directory", async () => {
		const first = await ops(true).createFolder("Riff");
		await db
			.update(folders)
			.set({ isTrashed: true })
			.where(eq(folders.id, first.id));
		const second = await ops(true).createFolder("riff");
		expect(await pathOf(second.id)).toBe("riff (1)");
	});

	test("never lands in a directory the scan has not seen yet", async () => {
		await mkdir(join(root, "Riff"));
		const { id } = await ops(true).createFolder("Riff");
		expect(await pathOf(id)).toBe("Riff (1)");
	});

	test("a name cannot nest or hide", () => {
		expect(safeSegment("a/b\\c")).toBe("a_b_c");
		expect(safeSegment(" .versions")).toBe("_versions");
		expect(safeSegment("..")).toBe("__");
	});

	test("two files racing for one name each get their own", async () => {
		const ctx = context(true);
		const claim = () =>
			diskName(ctx, "takes", "Song.wav", { fallback: "x", file: true });
		const names = await Promise.all([claim(), claim()]);
		expect(names.toSorted()).toEqual(["Song (1).wav", "Song.wav"]);
		expect(existsSync(join(root, "takes", "Song (1).wav"))).toBeTrue();
	});
});
