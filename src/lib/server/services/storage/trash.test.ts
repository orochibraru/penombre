import { describe, expect, mock, test } from "bun:test";
import { files } from "#lib/server/db/schema.js";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ failedFiles: [], failedDirs: [] }),
}));
mock.module("#lib/server/services/jobs.js", () => ({ enqueueJob, awaitJob }));

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

function setup(trashedFiles: FileRow[], trashedFolders: FolderRow[]) {
	const deleted: { table: unknown; ids: string[] }[] = [];
	const ctx = {
		storagePath: "/root",
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

	test("a timed-out job keeps every row", async () => {
		awaitJob.mockImplementationOnce(async () => undefined);
		const trashedFiles: FileRow[] = [{ id: "f1", path: "d1/a.txt", size: 10 }];
		const trashedFolders: FolderRow[] = [{ id: "d1", path: "d1" }];
		const { ops, deleted } = setup(trashedFiles, trashedFolders);

		const result = await ops.emptyTrash();

		expect(result).toEqual({ deleted: 0, freed: 0, failed: 1 });
		expect(deleted).toHaveLength(0);
	});
});
