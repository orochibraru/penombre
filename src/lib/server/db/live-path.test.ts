import { Database } from "bun:sqlite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	cpSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const MIGRATIONS = join(import.meta.dir, "../../../../drizzle/sqlite");
const TAG = "0020_blushing_black_queen";

/** The migrations up to, not including, the one that adds the index. */
function before(): string {
	const dir = mkdtempSync(join(tmpdir(), "penombre-migrations-"));
	cpSync(MIGRATIONS, dir, { recursive: true });
	const journalPath = join(dir, "meta/_journal.json");
	const journal = JSON.parse(readFileSync(journalPath, "utf8"));
	const cut = journal.entries.findIndex(
		(entry: { tag: string }) => entry.tag === TAG,
	);
	journal.entries = journal.entries.slice(0, cut);
	writeFileSync(journalPath, JSON.stringify(journal));
	return dir;
}

describe("the live-path migration", () => {
	let sqlite: Database;
	let oldMigrations: string;

	beforeAll(() => {
		sqlite = new Database(":memory:");
		oldMigrations = before();
		migrate(drizzle(sqlite), { migrationsFolder: oldMigrations });

		const run = (query: string, ...params: (string | number)[]) =>
			sqlite.query(query).run(...params);
		run(
			"insert into user (id, name, email, created_at, updated_at) values ('u', 'u', 'u@x', 0, 0)",
		);
		// The same folder and file, scanned twice 58ms apart.
		for (const [id, at] of [
			["dir-old", 100],
			["dir-new", 158],
		] as const) {
			run(
				"insert into folders (id, name, owner_id, path, volume_id, created_at, updated_at) values (?, 'Music', 'u', 'Music', 'docs', ?, ?)",
				id,
				at,
				at,
			);
		}
		for (const [id, at, starred] of [
			["file-old", 100, 0],
			["file-new", 158, 1],
		] as const) {
			run(
				"insert into files (id, name, owner_id, path, volume_id, folder_id, is_starred, created_at, updated_at) values (?, 'a.wav', 'u', 'Music/a.wav', 'docs', 'dir-new', ?, ?, ?)",
				id,
				starred,
				at,
				at,
			);
		}
		// Same path on another volume, and a trashed copy: neither is a duplicate.
		run(
			"insert into files (id, name, owner_id, path, volume_id, created_at, updated_at) values ('other-volume', 'a.wav', 'u', 'Music/a.wav', 'nas', 0, 0)",
		);
		run(
			"insert into files (id, name, owner_id, path, volume_id, is_trashed, created_at, updated_at) values ('trashed', 'a.wav', 'u', 'Music/a.wav', 'docs', 1, 0, 0)",
		);
		run(
			"insert into file_notes (id, file_id, user_id, body, created_at, updated_at) values ('n', 'file-new', 'u', 'hi', 0, 0)",
		);
		run(
			"insert into shares (id, token, owner_id, resource_type, resource_id, resource_name, created_at) values ('s', 't', 'u', 'folder', 'dir-new', 'Music', 0)",
		);
		run(
			"insert into sharings (id, owner_id, resource_type, resource_id, permission, created_at, updated_at) values ('g', 'u', 'file', 'file-new', 'read', 0, 0)",
		);

		migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS });
	});

	afterAll(() => {
		rmSync(oldMigrations, { recursive: true, force: true });
	});

	const one = <T>(query: string) => sqlite.query(query).get() as T;
	const ids = (query: string) =>
		(sqlite.query(query).all() as { id: string }[]).map((row) => row.id);

	test("keeps the oldest row of each duplicate", () => {
		expect(ids("select id from folders order by id")).toEqual(["dir-old"]);
		expect(ids("select id from files order by id")).toEqual([
			"file-old",
			"other-volume",
			"trashed",
		]);
	});

	test("moves what pointed at a duplicate onto the kept row", () => {
		expect(one<{ f: string }>("select file_id f from file_notes").f).toBe(
			"file-old",
		);
		expect(one<{ r: string }>("select resource_id r from shares").r).toBe(
			"dir-old",
		);
		expect(one<{ r: string }>("select resource_id r from sharings").r).toBe(
			"file-old",
		);
		expect(
			one<{ f: string }>("select folder_id f from files where id = 'file-old'")
				.f,
		).toBe("dir-old");
		expect(
			one<{ s: number }>("select is_starred s from files where id = 'file-old'")
				.s,
		).toBe(1);
	});

	test("refuses a second live row for a path afterwards", () => {
		const insert = () =>
			sqlite
				.query(
					"insert into files (id, name, owner_id, path, volume_id, created_at, updated_at) values ('again', 'a.wav', 'u', 'Music/a.wav', 'docs', 0, 0)",
				)
				.run();
		expect(insert).toThrow(/UNIQUE constraint failed/);
	});

	test("the main drive's NULL volume is covered too", () => {
		const insert = (id: string) =>
			sqlite
				.query(
					"insert into files (id, name, owner_id, path, created_at, updated_at) values (?, 'b', 'u', 'b', 0, 0)",
				)
				.run(id);
		insert("main-1");
		expect(() => insert("main-2")).toThrow(/UNIQUE constraint failed/);
	});
});
