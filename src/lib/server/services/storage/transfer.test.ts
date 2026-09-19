import { describe, expect, mock, test } from "bun:test";
import type { PlannedImport } from "./files";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ failed: [] }),
}));
mock.module("#lib/server/services/jobs.js", () => ({ enqueueJob, awaitJob }));

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
		db: {
			insert: () => ({
				values: (v: unknown) => {
					inserted.push(v);
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
				pairs: [{ source: "/source/a.txt", dest: "/target/dest/a.txt" }],
			},
			priority: "mutation",
		});
		// Rows are inserted from this outcome: never act on a guess.
		expect(awaitJob.mock.calls[0]?.[1]).toMatchObject({ settle: true });
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
		const { ops, inserted } = setup();
		const file = dbFile();

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [file] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 0, failed: 1 });
		expect(inserted).toHaveLength(0);
	});

	test("a timed-out job fails every planned copy", async () => {
		awaitJob.mockImplementationOnce(async () => undefined);
		const { ops, inserted } = setup();
		const file = dbFile();

		const result = await ops.importTree(
			{ type: "file", folders: [], files: [file] },
			"dest",
			"/source",
		);

		expect(result).toEqual({ copied: 0, failed: 1 });
		expect(inserted).toHaveLength(0);
	});
});
