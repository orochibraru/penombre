import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	spyOn,
	test,
} from "bun:test";
import {
	mkdtemp,
	readdir,
	rename,
	rm,
	stat,
	utimes,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import type { Database } from "#lib/server/db/index.js";
import { files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import * as appSettings from "#lib/server/services/app-settings.js";
import type { StorageContext } from "./context";
import { LocalStorageDriver } from "./drivers/local";
import { ScanOperations } from "./scan";
import type { ThumbnailService } from "./thumbnails";
import { listVersions, versionKey } from "./versions";

const settings = spyOn(appSettings, "getAppSettings").mockResolvedValue({
	versioningEnabled: true,
	maxVersionsPerFile: 5,
} as never);

afterAll(() => settings.mockRestore());

let db: Database;
let root: string;
let scanner: ScanOperations;
let ctx: StorageContext;

const thumbnails = {
	warm: () => Promise.resolve(),
	adopt: () => Promise.resolve(),
	deleteThumbnails: () => Promise.resolve(),
} as unknown as ThumbnailService;

/** What the Go walk reports, from the real files. */
async function listStorageRoot(dir: string) {
	const out = [];
	for (const name of await readdir(dir)) {
		if (name.startsWith(".")) {
			continue;
		}
		const info = await stat(join(dir, name));
		out.push({
			key: name,
			size: info.size,
			mtime: info.mtimeMs,
			ino: String(info.ino),
		});
	}
	return out;
}

beforeEach(async () => {
	db = migratedSqlite();
	root = await mkdtemp(join(tmpdir(), "penombre-shadow-"));
	await db.insert(user).values({
		id: "u",
		name: "u",
		email: "u@x",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	ctx = {
		user: { id: "u" },
		actor: { id: "u" },
		volumeId: null,
		namedPaths: true,
		readOnly: false,
		storagePath: root,
		db,
		driver: new LocalStorageDriver(root),
	} as unknown as StorageContext;
	scanner = new ScanOperations(ctx, thumbnails, { listStorageRoot });
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

/** Syncthing's way: a temporary file renamed over the old one. */
async function replace(name: string, body: string, at: Date) {
	const staged = join(root, `.${name}.tmp`);
	await writeFile(staged, body);
	await utimes(staged, at, at);
	await rename(staged, join(root, name));
}

const read = async (key: string) =>
	new TextDecoder().decode(await ctx.driver.readObject(key));

describe("files replaced outside Penombre", () => {
	test("a replace keeps the old bytes as a version, dated as they were", async () => {
		const first = new Date(Date.UTC(2026, 8, 20, 12));
		await writeFile(join(root, "take.wav"), "first render");
		await utimes(join(root, "take.wav"), first, first);
		await scanner.scan();
		const [row] = await db.select().from(files);
		expect(row?.inode).toBeTruthy();

		await replace(
			"take.wav",
			"second render",
			new Date(Date.UTC(2026, 8, 20, 13)),
		);
		await scanner.scan();

		const [version] = await listVersions(ctx, row?.id ?? "");
		expect(version?.name).toBe("take.wav");
		expect(version?.createdAt).toEqual(first);
		expect(await read(versionKey(row?.id ?? "", version?.id ?? ""))).toBe(
			"first render",
		);
		expect(await read("take.wav")).toBe("second render");
	});

	test("a file Penombre wrote itself is not versioned twice", async () => {
		const at = new Date(Date.UTC(2026, 8, 20, 12));
		await writeFile(join(root, "take.wav"), "first");
		await utimes(join(root, "take.wav"), at, at);
		await scanner.scan();
		// An upload: new bytes, and a row stamped as late as the file.
		await replace("take.wav", "uploaded", at);
		await scanner.scan();

		const [row] = await db.select().from(files);
		expect(await listVersions(ctx, row?.id ?? "")).toEqual([]);
	});

	test("a file scanned before versioning was on still gets kept", async () => {
		settings.mockResolvedValueOnce({ versioningEnabled: false } as never);
		await writeFile(join(root, "take.wav"), "old");
		await utimes(
			join(root, "take.wav"),
			new Date(1_000_000),
			new Date(1_000_000),
		);
		await scanner.scan();
		await scanner.scan();
		await replace("take.wav", "new", new Date(2_000_000));
		await scanner.scan();

		const [row] = await db.select().from(files);
		const [version] = await listVersions(ctx, row?.id ?? "");
		expect(await read(versionKey(row?.id ?? "", version?.id ?? ""))).toBe(
			"old",
		);
	});

	test("the next replace is caught too", async () => {
		await writeFile(join(root, "take.wav"), "one");
		await utimes(
			join(root, "take.wav"),
			new Date(1_000_000),
			new Date(1_000_000),
		);
		await scanner.scan();
		await replace("take.wav", "two", new Date(2_000_000));
		await scanner.scan();
		await replace("take.wav", "three", new Date(3_000_000));
		await scanner.scan();

		const [row] = await db
			.select()
			.from(files)
			.where(eq(files.name, "take.wav"));
		const versions = await listVersions(ctx, row?.id ?? "");
		expect(
			await Promise.all(
				versions.map((v) => read(versionKey(row?.id ?? "", v.id))),
			),
		).toEqual(["two", "one"]);
	});
});

describe("files renamed on disk", () => {
	test("keep their row and their versions", async () => {
		await writeFile(join(root, "take.wav"), "one");
		await utimes(
			join(root, "take.wav"),
			new Date(1_000_000),
			new Date(1_000_000),
		);
		await scanner.scan();
		await replace("take.wav", "two", new Date(2_000_000));
		await scanner.scan();
		const [before] = await db.select().from(files);

		await rename(join(root, "take.wav"), join(root, "Final mix.wav"));
		await scanner.scan();

		const rows = await db.select().from(files);
		expect(rows.map((r) => [r.id, r.path, r.name])).toEqual([
			[before?.id, "Final mix.wav", "Final mix.wav"],
		]);
		const [version] = await listVersions(ctx, before?.id ?? "");
		expect(await read(versionKey(before?.id ?? "", version?.id ?? ""))).toBe(
			"one",
		);
	});

	test("are matched by size and date when no inode was recorded", async () => {
		settings.mockResolvedValue({ versioningEnabled: false } as never);
		try {
			await writeFile(join(root, "take.wav"), "one");
			await utimes(
				join(root, "take.wav"),
				new Date(1_000_000),
				new Date(1_000_000),
			);
			await scanner.scan();
			const [before] = await db.select().from(files);
			expect(before?.inode).toBeNull();

			await rename(join(root, "take.wav"), join(root, "renamed.wav"));
			await scanner.scan();

			const rows = await db.select().from(files);
			expect(rows.map((r) => [r.id, r.path])).toEqual([
				[before?.id, "renamed.wav"],
			]);
		} finally {
			settings.mockResolvedValue({
				versioningEnabled: true,
				maxVersionsPerFile: 5,
			} as never);
		}
	});

	test("two lookalikes are not guessed between", async () => {
		settings.mockResolvedValue({ versioningEnabled: false } as never);
		try {
			for (const name of ["a.wav", "b.wav"]) {
				await writeFile(join(root, name), "same");
				await utimes(
					join(root, name),
					new Date(1_000_000),
					new Date(1_000_000),
				);
			}
			await scanner.scan();
			const before = new Set((await db.select().from(files)).map((r) => r.id));

			await rename(join(root, "a.wav"), join(root, "c.wav"));
			await rename(join(root, "b.wav"), join(root, "d.wav"));
			await scanner.scan();

			const after = (await db.select().from(files)).map((r) => r.id);
			expect(after.some((id) => before.has(id))).toBeFalse();
		} finally {
			settings.mockResolvedValue({
				versioningEnabled: true,
				maxVersionsPerFile: 5,
			} as never);
		}
	});
});
