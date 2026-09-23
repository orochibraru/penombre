import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { seal } from "#lib/server/crypto/envelope.js";
import { files, folders } from "#lib/server/db/schema.js";

// `getStoragePath` is mocked (test.setup.ts) to this fixed path.
const STORAGE_ROOT = "/tmp/penombre-test-storage";
const ZIP_DIR = join(STORAGE_ROOT, ".tmp", "zips");

const enqueueJob = mock(async (_input: unknown) => "job-1");
const awaitJob = mock(
	async (): Promise<{ status: string; error?: string } | undefined> => ({
		status: "succeeded",
	}),
);
const finishJob = mock(async (_id: string) => true);
const disownJob = mock(async (_id: string) => {});
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob,
	awaitJob,
	finishJob,
	disownJob,
}));

const { ZipService, sweepStaleZips, streamAndCleanUp } = await import("./zip");

/** Resolve once the predicate holds, or once the timeout elapses regardless. */
async function waitUntil(
	predicate: () => boolean,
	timeoutMs = 500,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline && !predicate()) {
		await Bun.sleep(5);
	}
}

/**
 * Walk a drizzle-orm SQL condition tree for `<columnName> = <value>`, so a
 * test can prove a query really carries a filter rather than trusting that
 * the fake DB below happened to return the right rows.
 */
function conditionEquals(
	condition: unknown,
	columnName: string,
	value: unknown,
): boolean {
	const node = condition as { queryChunks?: unknown[] } | undefined;
	const chunks = node?.queryChunks;
	if (!Array.isArray(chunks)) {
		return false;
	}
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i] as { name?: string };
		if (chunk?.name === columnName) {
			const param = chunks[i + 2] as { value?: unknown } | undefined;
			if (param && "value" in param && param.value === value) {
				return true;
			}
		}
		if (conditionEquals(chunk, columnName, value)) {
			return true;
		}
	}
	return false;
}

/** A table-aware `db.select().from(table).where()` stub, one queue per table. */
function fakeDb(
	responses: { folders?: unknown[][]; files?: unknown[][] },
	captured?: { fileWhere?: unknown[] },
) {
	const foldersQueue = [...(responses.folders ?? [])];
	const filesQueue = [...(responses.files ?? [])];
	return {
		select: () => ({
			from: (table: unknown) => ({
				where: async (condition: unknown) => {
					if (table === folders) {
						return foldersQueue.shift() ?? [];
					}
					if (table === files) {
						captured?.fileWhere?.push(condition);
						return filesQueue.shift() ?? [];
					}
					throw new Error("fakeDb: unexpected table");
				},
			}),
		}),
	} as never;
}

function fakeCtx(db: unknown, storagePath = "/vol") {
	return {
		user: { id: "u1" },
		volumeId: null,
		scope: undefined,
		storagePath,
		db,
	} as never;
}

/** The output path the last `enqueueJob` call was given, for the mock to write into. */
function lastJobOutput(): string {
	const call = enqueueJob.mock.calls.at(-1)?.[0] as {
		spec: { output: string };
	};
	return call.spec.output;
}

describe("ZipService", () => {
	beforeEach(() => {
		enqueueJob.mockClear();
		awaitJob.mockClear();
		awaitJob.mockImplementation(async () => ({ status: "succeeded" }));
	});

	test("resolves a bare file path to one entry named after itself", async () => {
		const db = fakeDb({ files: [[{ path: "notes.txt", name: "notes.txt" }]] });
		awaitJob.mockImplementationOnce(async () => {
			await writeFile(lastJobOutput(), "abc");
			return { status: "succeeded" };
		});

		const stream = await new ZipService(fakeCtx(db)).createZipFromPaths([
			"notes.txt",
		]);
		expect(await new Response(stream).text()).toBe("abc");

		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "zip",
			priority: "interactive",
		});
		expect(awaitJob.mock.calls[0]?.[1]).toMatchObject({ consume: true });
		const spec = enqueueJob.mock.calls[0]?.[0] as {
			spec: { entries: unknown[] };
		};
		expect(spec.spec.entries).toEqual([
			{ source: join("/vol", "notes.txt"), name: "notes.txt" },
		]);
	});

	test("skips a path that matches neither a file nor a folder", async () => {
		const db = fakeDb({ files: [[]], folders: [[]] });
		const service = new ZipService(fakeCtx(db));
		awaitJob.mockImplementationOnce(async () => {
			await writeFile(lastJobOutput(), "empty-zip");
			return { status: "succeeded" };
		});

		const stream = await service.createZipFromPaths(["ghost"]);
		await new Response(stream).text();

		const spec = enqueueJob.mock.calls[0]?.[0] as {
			spec: { entries: unknown[] };
		};
		expect(spec.spec.entries).toEqual([]);
	});

	test("builds display paths for a folder and excludes trashed files", async () => {
		const fileWhere: unknown[] = [];
		const db = fakeDb(
			{
				folders: [
					[{ path: "f1", name: "Photos" }], // the folder itself
					[], // no subfolders
				],
				files: [[{ path: "f1/a.png", name: "a.png" }]],
			},
			{ fileWhere },
		);
		awaitJob.mockImplementationOnce(async () => {
			await writeFile(lastJobOutput(), "zip-bytes");
			return { status: "succeeded" };
		});

		const stream = await new ZipService(fakeCtx(db)).createZipFromFolder("f1");
		expect(await new Response(stream).text()).toBe("zip-bytes");

		const spec = enqueueJob.mock.calls[0]?.[0] as {
			spec: { entries: unknown[] };
		};
		expect(spec.spec.entries).toEqual([
			{ source: join("/vol", "f1/a.png"), name: "Photos/a.png" },
		]);

		// The bug this fixes: a folder zip used to include everything under the
		// path with no isTrashed filter, so trashing one file inside an
		// untrashed folder never removed it from that folder's downloads.
		expect(fileWhere).toHaveLength(1);
		expect(conditionEquals(fileWhere[0], "is_trashed", false)).toBe(true);
	});

	test("throws when the folder does not exist, without enqueuing a job", async () => {
		const db = fakeDb({ folders: [[]] });
		await expect(
			new ZipService(fakeCtx(db)).createZipFromFolder("missing"),
		).rejects.toThrow("Folder not found");
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("throws when the zip job fails, never resolving an empty archive", async () => {
		const db = fakeDb({ folders: [[{ path: "f1", name: "Photos" }], []] });
		awaitJob.mockImplementationOnce(async () => ({
			status: "failed",
			error: "disk full",
		}));
		await expect(
			new ZipService(fakeCtx(db)).createZipFromFolder("f1"),
		).rejects.toThrow(/disk full/);
	});

	test("throws when the zip job times out", async () => {
		const db = fakeDb({ folders: [[{ path: "f1", name: "Photos" }], []] });
		awaitJob.mockImplementationOnce(async () => undefined);
		await expect(
			new ZipService(fakeCtx(db)).createZipFromFolder("f1"),
		).rejects.toThrow(/timed out/);
	});

	test("an account export is one query per table, deduped per user", async () => {
		const db = fakeDb({
			folders: [
				[
					{ path: "f1", name: "Photos", isTrashed: false },
					{ path: "f1/f2", name: "2024", isTrashed: false },
					{ path: "gone", name: "Old", isTrashed: true },
				],
			],
			files: [
				[
					{ path: "root.txt", name: "root.txt" },
					{ path: "f1/f2/k1", name: "a.png" },
					{ path: "gone/k2", name: "left.txt" },
				],
			],
		});
		const shared = join(ZIP_DIR, "shared.zip");
		awaitJob.mockImplementationOnce(async () => {
			await writeFile(shared, "export");
			return {
				status: "succeeded",
				result: JSON.stringify({ output: shared }),
			} as never;
		});

		const stream = await new ZipService(fakeCtx(db)).createAccountExport();
		expect(await new Response(stream).text()).toBe("export");

		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			dedupeKey: "export:u1",
			spec: {
				entries: [
					{ source: join("/vol", "root.txt"), name: "root.txt" },
					{ source: join("/vol", "f1/f2/k1"), name: "Photos/2024/a.png" },
				],
			},
		});
		// Another waiter may still need the shared archive.
		expect(awaitJob.mock.calls[0]?.[1]).toMatchObject({
			consume: false,
			cancelOnTimeout: false,
		});
		expect(existsSync(shared)).toBe(true);
		await rm(shared);
	});

	test("an empty account exports nothing", async () => {
		const db = fakeDb({ folders: [[]], files: [[]] });
		expect(await new ZipService(fakeCtx(db)).createAccountExport()).toBeNull();
		expect(enqueueJob).not.toHaveBeenCalled();
	});
});

describe("streamAndCleanUp", () => {
	beforeEach(async () => {
		await mkdir(ZIP_DIR, { recursive: true });
	});
	afterAll(async () => {
		await rm(join(STORAGE_ROOT, ".tmp"), { recursive: true, force: true });
	});

	test("deletes the file once it has been fully read", async () => {
		const path = join(ZIP_DIR, "end.zip");
		await writeFile(path, "hello world");

		const text = await new Response(await streamAndCleanUp(path)).text();
		expect(text).toBe("hello world");

		await waitUntil(() => !existsSync(path));
		expect(existsSync(path)).toBe(false);
	});

	test("deletes the file when the stream is cancelled mid-read", async () => {
		const path = join(ZIP_DIR, "cancel.zip");
		await writeFile(path, "x".repeat(1024 * 1024));

		const reader = (await streamAndCleanUp(path)).getReader();
		await reader.read();
		await reader.cancel();

		await waitUntil(() => !existsSync(path));
		expect(existsSync(path)).toBe(false);
	});

	test("opens a sealed archive and deletes it once read", async () => {
		const path = join(ZIP_DIR, "sealed.zip");
		const keys = { current: Buffer.alloc(32, 5), previous: [] };
		await writeFile(path, seal(keys.current, Buffer.from("zipped bytes")));

		const text = await new Response(await streamAndCleanUp(path, keys)).text();
		expect(text).toBe("zipped bytes");

		await waitUntil(() => !existsSync(path));
		expect(existsSync(path)).toBe(false);
	});

	test("surfaces the error instead of a silent empty stream when the file is gone", async () => {
		const path = join(ZIP_DIR, "missing.zip");
		await expect(streamAndCleanUp(path)).rejects.toThrow();
	});
});

describe("sweepStaleZips", () => {
	afterAll(async () => {
		await rm(join(STORAGE_ROOT, ".tmp"), { recursive: true, force: true });
	});

	test("deletes files older than an hour and keeps fresh ones", async () => {
		await mkdir(ZIP_DIR, { recursive: true });
		const stale = join(ZIP_DIR, "old.zip");
		const fresh = join(ZIP_DIR, "new.zip");
		await writeFile(stale, "x");
		await writeFile(fresh, "y");
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
		await utimes(stale, twoHoursAgo, twoHoursAgo);

		await sweepStaleZips();

		expect(existsSync(stale)).toBe(false);
		expect(existsSync(fresh)).toBe(true);
	});

	test("never throws when the zip directory does not exist", async () => {
		await rm(ZIP_DIR, { recursive: true, force: true });
		await expect(sweepStaleZips()).resolves.toBeUndefined();
	});
});
