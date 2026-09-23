import { describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlannedImport } from "./files";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ failed: [] }),
}));
const finishJob = mock(async (_id: string) => true);
const disownJob = mock(async (_id: string) => {});
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob,
	awaitJob,
	finishJob,
	disownJob,
}));

const { TransferOperations } = await import("./transfer");

function dbFile(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		id: "src-id",
		name: "a.txt",
		path: "a.txt",
		contentType: "text/plain",
		category: "document",
		size: 10,
		tags: [],
		musicDuration: null,
		videoDuration: null,
		...overrides,
	} as never;
}

function plannedImport(filePath: string): PlannedImport {
	return {
		filePath,
		values: { id: "new-id", path: filePath } as never,
	};
}

function setup() {
	const inserted: unknown[] = [];
	const ctx = {
		storagePath: "/target",
		encrypted: true,
		user: { id: "u1" },
		volumeId: null,
		driver: {
			deleteObject: mock(async (_key: string) => {}),
			objectExists: mock(async (_key: string) => true),
		},
		deletedRows: 0,
		db: {
			select: () => ({ from: () => ({ where: async () => [] }) }),
			// One statement per batch: the rows arrive as an array.
			insert: () => ({
				values: (v: unknown[]) => {
					inserted.push(...v);
					return Promise.resolve();
				},
			}),
			delete: () => ({
				where: () => {
					ctx.deletedRows++;
					return Promise.resolve();
				},
			}),
		},
		invalidateListingCaches: mock(async () => {}),
	};
	const fileOps = {
		importFile: mock(async (_file: unknown, folder: string | undefined) =>
			plannedImport(folder ? `${folder}/a.txt` : "a.txt"),
		),
	};
	const folderOps = {
		createFolder: mock(async () => ({ id: "f1", name: "f" })),
	};
	const thumbnails = { warm: mock(async () => {}) };
	const ops = new TransferOperations(
		ctx as never,
		fileOps as never,
		folderOps as never,
		thumbnails as never,
	);
	return { ops, ctx, fileOps, folderOps, thumbnails, inserted };
}

describe("TransferOperations.importTree", () => {
	test("copies a single file and inserts its row", async () => {
		enqueueJob.mockClear();
		awaitJob.mockClear();
		const { ops, inserted, thumbnails } = setup();
		const file = dbFile();

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [file] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 1, failed: 0 });
		expect(inserted).toHaveLength(1);
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "copy",
			spec: {
				pairs: [
					{
						source: "/source/a.txt",
						dest: "/target/dest/a.txt",
						encrypt: true,
					},
				],
			},
			priority: "mutation",
		});
		// Rows are inserted from this outcome: never act on a guess.
		expect(awaitJob.mock.calls[0]?.[1]).toMatchObject({ settle: true });
		// The job row is the record a later process reconciles from, so it
		// goes only once every row above is written, with what maps it back.
		expect(awaitJob.mock.calls[0]?.[1]).not.toHaveProperty("consume");
		expect(finishJob).toHaveBeenCalledWith("job-1");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { context: { root: "/target" } },
		});
		expect(thumbnails.warm).toHaveBeenCalledWith("dest/a.txt", "text/plain");
	});

	test("never enqueues a job when there is nothing to copy", async () => {
		enqueueJob.mockClear();
		const { ops } = setup();

		const result = await ops.importTree(
			{ type: "folder", root: undefined, folders: [], files: [] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 0, failed: 0 });
		expect(enqueueJob).not.toHaveBeenCalled();
	});

	test("keeps the source when a pair the job reports failed", async () => {
		awaitJob.mockImplementationOnce(async () => ({
			status: "succeeded",
			result: JSON.stringify({ failed: [{ index: 0, error: "boom" }] }),
		}));
		const { ops, inserted, ctx } = setup();
		const file = dbFile();

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [file] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 0, failed: 1 });
		expect(inserted).toHaveLength(0);
		// An interrupted attempt may have left bytes there; no row ever will.
		expect(ctx.driver.deleteObject).toHaveBeenCalledWith("dest/a.txt");
	});

	test("a timed-out job fails every planned copy", async () => {
		awaitJob.mockImplementationOnce(async () => undefined);
		const { ops, inserted, ctx } = setup();
		const file = dbFile();

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [file] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 0, failed: 1 });
		expect(inserted).toHaveLength(0);
		// An interrupted attempt may have left bytes there; no row ever will.
		expect(ctx.driver.deleteObject).toHaveBeenCalledWith("dest/a.txt");
	});

	test("a failure while writing rows disowns the job for the reconciler", async () => {
		const { ops, ctx } = setup();
		ctx.db.insert = () => ({
			values: () => Promise.reject(new Error("db down")),
		});
		disownJob.mockClear();
		await expect(
			ops.importTree(
				{ type: "file", folders: [], files: [dbFile()] },
				"dest",
				"/s",
			),
		).rejects.toThrow("db down");
		expect(disownJob).toHaveBeenCalledWith("job-1");
	});

	// A malformed result must disown the job too, not just a failure while
	// applying it, or the id would sit in `applying` forever.
	test("a malformed job result disowns the job for the reconciler", async () => {
		awaitJob.mockImplementationOnce(async () => ({
			status: "succeeded",
			result: "not json",
		}));
		const { ops } = setup();
		disownJob.mockClear();
		await expect(
			ops.importTree(
				{ type: "file", folders: [], files: [dbFile()] },
				"dest",
				"/s",
			),
		).rejects.toThrow();
		expect(disownJob).toHaveBeenCalledWith("job-1");
	});

	// Taken for dead mid-apply (a paused container): a reconciler adopted the
	// job and may have removed bytes before these rows existed. A move must
	// not then delete a source whose copy is gone.
	test("when the job was adopted meanwhile, rows whose bytes are gone are dropped", async () => {
		finishJob.mockImplementationOnce(async () => false);
		const { ops, ctx, inserted } = setup();
		ctx.driver.objectExists.mockImplementationOnce(async () => false);

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [dbFile()] },
			"dest",
			"/s",
		);

		expect(inserted).toHaveLength(1);
		expect(ctx.deletedRows).toBe(1);
		expect(result).toEqual({ copied: 0, failed: 1 });
	});

	// The adopter may still be unlinking what this check just saw: losing
	// ownership never confirms a move, even with every byte present.
	test("when the job was adopted meanwhile, no pair counts as moved", async () => {
		finishJob.mockImplementationOnce(async () => false);
		const { ops, ctx } = setup();
		ctx.storagePath = await mkdtemp(join(tmpdir(), "penombre-transfer-"));
		await mkdir(join(ctx.storagePath, "dest"));
		await writeFile(join(ctx.storagePath, "dest/a.txt"), "x");

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [dbFile()] },
			"dest",
			"/s",
		);

		expect(ctx.deletedRows).toBe(0);
		expect(result).toEqual({ copied: 1, failed: 1 });
	});
});
