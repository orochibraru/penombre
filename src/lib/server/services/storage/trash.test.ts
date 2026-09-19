import { describe, expect, mock, test } from "bun:test";
import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { files } from "#lib/server/db/schema.js";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ failedFiles: [], failedDirs: [] }),
}));
const finishJob = mock(async (_id: string) => true);
const disownJob = mock(async (_id: string) => {});
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob,
	awaitJob,
	finishJob,
	disownJob,
}));

const { TrashOperations } = await import("./trash");

interface FileRow {
	id: string;
	path: string;
	size: number;
}
interface FolderRow {
	id: string;
	path: string;
}

function setup(
	trashedFiles: FileRow[],
	trashedFolders: FolderRow[],
	root = "/root",
) {
	const deleted: { table: unknown; ids: string[] }[] = [];
	const ctx = {
		storagePath: root,
		user: { id: "user-1" },
		volumeId: null,
		db: {
			select: () => ({
				from: (table: unknown) => ({
					where: () =>
						Promise.resolve(table === files ? trashedFiles : trashedFolders),
				}),
			}),
			delete: (table: unknown) => ({
				where: () => {
					deleted.push({ table, ids: [] });
					return Promise.resolve();
				},
			}),
		},
		activityService: { register: mock(async () => {}) },
		actor: { id: "user-1" },
		invalidateListingCaches: mock(async () => {}),
	};
	const thumbnails = { deleteThumbnails: mock(async () => {}) };
	const ops = new TrashOperations(ctx as never, thumbnails as never);
	return { ops, ctx, thumbnails, deleted };
}

describe("TrashOperations.emptyTrash", () => {
	test("removes rows for every file and folder the job confirms deleted", async () => {
		enqueueJob.mockClear();
		awaitJob.mockClear();
		const trashedFiles: FileRow[] = [{ id: "f1", path: "a.txt", size: 10 }];
		const trashedFolders: FolderRow[] = [{ id: "d1", path: "d1" }];
		const { ops, thumbnails } = setup(trashedFiles, trashedFolders);

		const result = await ops.emptyTrash();

		expect(result).toEqual({ deleted: 2, freed: 10, failed: 0 });
		expect(thumbnails.deleteThumbnails).toHaveBeenCalledWith("a.txt");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			type: "delete",
			spec: { files: ["/root/a.txt"], dirs: ["/root/d1"] },
			priority: "mutation",
		});
		// Rows are deleted from this outcome: never act on a guess.
		expect(awaitJob.mock.calls[0]?.[1]).toMatchObject({ settle: true });
		// The job row is the record a later process reconciles from, so it
		// goes only once every row above is applied, with what maps it back.
		expect(awaitJob.mock.calls[0]?.[1]).not.toHaveProperty("consume");
		expect(finishJob).toHaveBeenCalledWith("job-1");
		expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
			spec: { context: { root: "/root" } },
		});
	});

	test("keeps a file the job could not delete and its ancestor folder", async () => {
		awaitJob.mockImplementationOnce(async () => ({
			status: "succeeded",
			result: JSON.stringify({
				failedFiles: ["/root/d1/a.txt"],
				failedDirs: [],
			}),
		}));
		const trashedFiles: FileRow[] = [{ id: "f1", path: "d1/a.txt", size: 10 }];
		const trashedFolders: FolderRow[] = [{ id: "d1", path: "d1" }];
		const { ops, thumbnails } = setup(trashedFiles, trashedFolders);

		const result = await ops.emptyTrash();

		expect(result).toEqual({ deleted: 0, freed: 0, failed: 1 });
		expect(thumbnails.deleteThumbnails).not.toHaveBeenCalled();
	});

	test("a timed-out job keeps every row whose bytes are still there", async () => {
		awaitJob.mockImplementationOnce(async () => undefined);
		const root = await disk({ "d1/a.txt": "x" });
		const trashedFiles: FileRow[] = [{ id: "f1", path: "d1/a.txt", size: 10 }];
		const trashedFolders: FolderRow[] = [{ id: "d1", path: "d1" }];
		const { ops, deleted } = setup(trashedFiles, trashedFolders, root);

		const result = await ops.emptyTrash();

		expect(result).toEqual({ deleted: 0, freed: 0, failed: 1 });
		expect(deleted).toHaveLength(0);
	});

	// The worker can vanish part-way: with no outcome, the disk is the record.
	// Keeping the row of a file already gone only restores a broken file.
	test("with no outcome, a file whose bytes are gone loses its row", async () => {
		awaitJob.mockImplementationOnce(async () => ({
			status: "failed",
			result: null,
		}));
		const trashedFiles: FileRow[] = [
			{ id: "gone", path: "a.txt", size: 10 },
			{ id: "here", path: "b.txt", size: 5 },
		];
		const { ops } = setup(trashedFiles, [], await disk({ "b.txt": "x" }));

		const result = await ops.emptyTrash();

		expect(result).toEqual({ deleted: 1, freed: 10, failed: 1 });
	});

	test("a failure while applying disowns the job for the reconciler", async () => {
		const { ops, ctx } = setup([{ id: "f1", path: "a.txt", size: 1 }], []);
		ctx.db.delete = () => ({
			where: () => Promise.reject(new Error("db down")),
		});
		disownJob.mockClear();

		await expect(ops.emptyTrash()).rejects.toThrow("db down");
		expect(disownJob).toHaveBeenCalledWith("job-1");
	});

	// A malformed result must disown the job too, not just a failure while
	// applying it, or the id would sit in `applying` forever.
	test("a malformed job result disowns the job for the reconciler", async () => {
		awaitJob.mockImplementationOnce(async () => ({
			status: "succeeded",
			result: "not json",
		}));
		const { ops } = setup([{ id: "f1", path: "a.txt", size: 1 }], []);
		disownJob.mockClear();

		await expect(ops.emptyTrash()).rejects.toThrow();
		expect(disownJob).toHaveBeenCalledWith("job-1");
	});

	// `exists()` answers false on EACCES too; a row deleted for bytes the app
	// merely cannot read is resurrected untrashed by the next scan.
	test("with no outcome, an unreadable file keeps its row", async () => {
		awaitJob.mockImplementationOnce(async () => undefined);
		const root = await disk({ "locked/a.txt": "x" });
		await chmod(join(root, "locked"), 0o000);
		try {
			const { ops } = setup(
				[{ id: "f", path: "locked/a.txt", size: 1 }],
				[],
				root,
			);
			expect(await ops.emptyTrash()).toEqual({
				deleted: 0,
				freed: 0,
				failed: 1,
			});
		} finally {
			await chmod(join(root, "locked"), 0o755);
		}
	});
});

async function disk(entries: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "penombre-trash-"));
	for (const [key, content] of Object.entries(entries)) {
		await mkdir(join(root, key, ".."), { recursive: true });
		await writeFile(join(root, key), content);
	}
	return root;
}
