import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	type Mock,
	mock,
	spyOn,
	test,
} from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";

import type { StorageDriver } from "./driver";

// ---------------------------------------------------------------------------
// Mock driver – must be defined before mock.module() calls
// ---------------------------------------------------------------------------
const mockDriver: { [K in keyof StorageDriver]: ReturnType<typeof mock> } = {
	readObject: mock(async () => new ArrayBuffer(0)),
	writeObject: mock(async () => {}),
	deleteObject: mock(async () => {}),
	deleteObjectsByPrefix: mock(async () => {}),
	copyObject: mock(async () => {}),
	linkObject: mock(async () => {}),
	objectExists: mock(async () => false),
	listObjectKeys: mock(async () => [] as string[]),
	ensureRootExists: mock(async () => {}),
	getObjectStream: mock(async () => new ReadableStream<Uint8Array>()),
	getObjectSize: mock(async () => 0),
};

// ActivityService mock
const mockRegister = mock(async (_opts: unknown) => {});

// ---------------------------------------------------------------------------
// wire mocks before any module import
// ---------------------------------------------------------------------------

/** The `(volumePath, userFolder)` the last volume-bound service asked for. */
const volumeDriverArgs: { path?: string; userFolder?: string } = {};

// `mock.module` is permanent: the real driver goes back in `afterAll`, or the
// signatures PDF store, which runs later, writes into this mock.
const realDriver = { ...(await import("./driver")) };
afterAll(() => {
	void mock.module("./driver", () => realDriver);
});

mock.module("./driver", () => ({
	createUserStorageDriver: () => mockDriver,
	createVolumeStorageDriver: (path: string, userFolder: string) => {
		volumeDriverArgs.path = path;
		volumeDriverArgs.userFolder = userFolder;
		return mockDriver;
	},
}));

/** Where `getStoragePath()` points; the cleanup tests aim it at a temp dir. */
const storageBase = { path: "/tmp/penombre-test-storage" };

mock.module("#lib/server/config.js", () => ({
	getConfig: mock(() => ({
		smtp: undefined,
		appName: "Penombre",
		origin: "http://localhost:5173",
		auth: {
			secret: "test-secret",
			enableEmailSignIn: true,
			minPasswordLength: 8,
		},
		worker: { mode: "embedded", concurrency: 4 },
	})),
	getStoragePath: mock(() => storageBase.path),
	envProvided: mock(() => ({
		emailSignIn: true,
		oauthSignIn: true,
		passkeySignIn: false,
		minPasswordLength: true,
		smtp: true,
		versionCheck: false,
		releaseChannel: false,
		dataRetention: false,
	})),
	isSimpleMode: mock(() => false),
	isAuthBypassed: mock(() => false),
	getVolume: mock(() => undefined),
	getVolumes: mock(() => []),
}));

mock.module("#lib/server/services/activity.js", () => ({
	ActivityService: class {
		register = mockRegister;
	},
}));

// ---------------------------------------------------------------------------
// Extend the shared mockDb with update + delete chains
// ---------------------------------------------------------------------------
import { getDb } from "#lib/server/db/index.js";

const rawDb = getDb() as unknown as Record<string, unknown>;

/** Infinite proxy chain that resolves to `value` when awaited. */
function makeChain(value: unknown[] = []): unknown {
	const c = (): unknown =>
		new Proxy({} as Record<string | symbol, unknown>, {
			get(_, prop) {
				if (prop === "then") {
					return (
						onFulfilled: (v: unknown) => void,
						onRejected: (e: unknown) => void,
					) => Promise.resolve(value).then(onFulfilled, onRejected);
				}
				return mock(() => c());
			},
		});
	return c();
}

const mockUpdate = mock(() => makeChain([]));
const mockDelete = mock(() => makeChain([]));
rawDb.update = mockUpdate;
rawDb.delete = mockDelete;

// The Go worker: transfer/trash byte work goes through a job. Default to an
// immediate, failure-free success so unrelated tests never have to know.
const mockEnqueueJob = mock(async () => "job-1");
const mockAwaitJob = mock(async () => ({
	status: "succeeded",
	result: JSON.stringify({ failed: [], failedFiles: [], failedDirs: [] }),
}));
mock.module("#lib/server/services/jobs.js", () => ({
	enqueueJob: mockEnqueueJob,
	awaitJob: mockAwaitJob,
	finishJob: mock(async () => true),
	disownJob: mock(async () => {}),
}));

const mockSelect = rawDb.select as Mock<() => unknown>;
const mockInsert = rawDb.insert as Mock<() => unknown>;

// ---------------------------------------------------------------------------
// Dynamic import AFTER all mocks are wired
// ---------------------------------------------------------------------------
const { StorageService } = await import("./service");
const { DriveAccessError, FileOrFolderNotFoundError, ReadOnlyVolumeError } =
	await import("#lib/server/errors.js");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const testUser = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
	image: null,
	role: "user",
	banned: false,
	banReason: null,
	banExpires: null,
};

const baseFile: DbFile = {
	id: "file-1",
	name: "document.txt",
	ownerId: "user-1",
	path: "abc-uuid.txt",
	folderId: null,
	contentType: "text/plain",
	category: "DOCUMENTS",
	size: 2048,
	isTrashed: false,
	isStarred: false,
	tags: [],
	musicDuration: null,
	videoDuration: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-02"),
};

const baseFolder: DbFolder = {
	id: "folder-1",
	name: "My Folder",
	ownerId: "user-1",
	path: "folder-uuid-1",
	parentId: null,
	isTrashed: false,
	isStarred: false,
	tags: [],
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-02"),
};

// ---------------------------------------------------------------------------
// Per-test mock helpers
// ---------------------------------------------------------------------------

/**
 * Make the next `db.select()` call resolve its entire chain to `result`.
 */
function mockNextSelect(result: unknown[]) {
	mockSelect.mockReturnValueOnce(makeChain(result) as never);
}

/**
 * Make the next `db.insert()` call support `.values().returning()` → `result`.
 */
function mockNextInsertReturning(result: unknown[]) {
	const returning = mock(() => Promise.resolve(result));
	const values = mock(() => ({ returning }));
	mockInsert.mockReturnValueOnce({ values } as never);
}

// ---------------------------------------------------------------------------
// Reset shared call-history mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
	mockRegister.mockClear();
	for (const fn of Object.values(mockDriver)) {
		fn.mockClear();
		// Re-apply default no-op implementations
	}
	mockDriver.writeObject.mockResolvedValue(undefined);
	mockDriver.deleteObject.mockResolvedValue(undefined);
	mockDriver.deleteObjectsByPrefix.mockResolvedValue(undefined);
	mockDriver.copyObject.mockResolvedValue(undefined);
	mockDriver.ensureRootExists.mockResolvedValue(undefined);
	mockDriver.listObjectKeys.mockResolvedValue([]);
	mockDriver.objectExists.mockResolvedValue(false);
	mockDriver.readObject.mockResolvedValue(new ArrayBuffer(0));
	mockDriver.getObjectSize.mockResolvedValue(0);
	mockDriver.getObjectStream.mockResolvedValue(
		new ReadableStream<Uint8Array>(),
	);

	mockUpdate.mockClear();
	mockDelete.mockClear();
	mockUpdate.mockImplementation(() => makeChain([]));
	mockDelete.mockImplementation(() => makeChain([]));

	mockEnqueueJob.mockClear();
	mockAwaitJob.mockClear();
	mockEnqueueJob.mockImplementation(async () => "job-1");
	mockAwaitJob.mockImplementation(async () => ({
		status: "succeeded",
		result: JSON.stringify({ failed: [], failedFiles: [], failedDirs: [] }),
	}));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("StorageService", () => {
	// =========================================================================
	// Constructor / accessors
	// =========================================================================
	describe("constructor and accessors", () => {
		test("getStoragePath() returns path under the configured storage path", () => {
			const service = new StorageService(testUser);
			expect(service.getStoragePath()).toBe(
				"/tmp/penombre-test-storage/user-user-1",
			);
		});

		test("getUserFolder() returns user-prefixed folder name", () => {
			const service = new StorageService(testUser);
			expect(service.getUserFolder()).toBe("user-user-1");
		});
	});

	// =========================================================================
	// ensureUserDirectory
	// =========================================================================
	describe("ensureUserDirectory", () => {
		test("delegates to driver.ensureRootExists()", async () => {
			const service = new StorageService(testUser);
			await service.ensureUserDirectory();
			expect(mockDriver.ensureRootExists).toHaveBeenCalledTimes(1);
		});
	});

	// =========================================================================
	// getFile
	// =========================================================================
	describe("getFile", () => {
		test("returns ObjectItem when file found", async () => {
			mockNextSelect([baseFile]);

			const service = new StorageService(testUser);
			const result = await service.getFile("abc-uuid.txt");

			expect(result.type).toBe("file");
			expect(result.key).toBe("abc-uuid.txt");
			expect(result.metadata.name).toBe("document.txt");
			expect(result.metadata.owner).toBe("user-1");
			expect(result.size).toBe(2048);
		});

		test("throws FileOrFolderNotFoundError when file not found", async () => {
			// default mockSelect returns [] — no override needed

			const service = new StorageService(testUser);
			await expect(service.getFile("nonexistent.txt")).rejects.toThrow(
				FileOrFolderNotFoundError,
			);
		});
	});

	// =========================================================================
	// fileExists
	// =========================================================================
	describe("fileExists", () => {
		test("returns true when file record found in DB", async () => {
			mockNextSelect([{ id: "file-1" }]);

			const service = new StorageService(testUser);
			expect(await service.fileExists("abc-uuid.txt")).toBe(true);
		});

		test("returns false when no file record in DB", async () => {
			const service = new StorageService(testUser);
			expect(await service.fileExists("missing.txt")).toBe(false);
		});
	});

	// =========================================================================
	// folderExists
	// =========================================================================
	describe("folderExists", () => {
		test("returns true when folder record found in DB", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			expect(await service.folderExists("folder-uuid-1")).toBe(true);
		});

		test("returns false when no folder record in DB", async () => {
			const service = new StorageService(testUser);
			expect(await service.folderExists("missing-folder")).toBe(false);
		});

		test("normalises trailing slash before querying", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			// Both with and without slash should work
			expect(await service.folderExists("folder-uuid-1/")).toBe(true);
		});
	});

	// =========================================================================
	// createFile
	// =========================================================================
	describe("createFile", () => {
		test("inserts file into DB and writes to driver, returns UploadResult", async () => {
			// getUniqueDisplayName → select existing names → [] (default, no override needed)
			mockNextInsertReturning([baseFile]);

			const service = new StorageService(testUser);
			const result = await service.createFile({
				name: "document.txt",
				size: 2048,
			});

			expect(result.id).toBe("file-1");
			expect(result.metadata.name).toBe("document.txt");
			expect(result.metadata.owner).toBe("user-1");
			expect(result.metadata.isTrashed).toBe(false);
			expect(result.finalName).toMatch(/\.txt$/);
			expect(mockDriver.writeObject).toHaveBeenCalledTimes(1);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "create", userId: "user-1" }),
			);
		});

		test("strips path separators from file name to use only the basename", async () => {
			const fileWithPath = { ...baseFile, name: "notes.md" };
			mockNextInsertReturning([fileWithPath]);

			const service = new StorageService(testUser);
			const result = await service.createFile({
				name: "folder/subfolder/notes.md",
				size: 50,
			});

			expect(result.metadata.name).toBe("notes.md");
		});

		test("returns unique name when display name collides with existing file", async () => {
			// First select (getUniqueDisplayName) returns existing name
			mockNextSelect([{ name: "document.txt" }]);
			const renamedFile = { ...baseFile, name: "document (1).txt" };
			mockNextInsertReturning([renamedFile]);

			const service = new StorageService(testUser);
			const result = await service.createFile({
				name: "document.txt",
				size: 100,
			});

			expect(result.metadata.name).toBe("document (1).txt");
		});

		test("files the row under the folder it was given", async () => {
			mockNextSelect([{ id: "folder-1" }]); // destination lookup
			mockNextSelect([{ id: "folder-1" }]); // unique-name lookup
			const inFolder = {
				...baseFile,
				path: "folder-uuid-1/abc-uuid.txt",
				folderId: "folder-1",
			};
			const inserted: Record<string, unknown>[] = [];
			const returning = mock(() => Promise.resolve([inFolder]));
			const values = mock((row: Record<string, unknown>) => {
				inserted.push(row);
				return { returning };
			});
			mockInsert.mockReturnValueOnce({ values } as never);

			const service = new StorageService(testUser);
			const result = await service.createFile(
				{ name: "document.txt", size: 10 },
				"folder-uuid-1",
			);

			expect(inserted[0]?.folderId).toBe("folder-1");
			expect(result.finalName).toStartWith("folder-uuid-1/");
		});

		test("refuses a folder path that resolves to nothing", async () => {
			mockNextSelect([]);

			const service = new StorageService(testUser);
			await expect(
				service.createFile({ name: "document.txt", size: 10 }, "not-a-folder"),
			).rejects.toBeInstanceOf(FileOrFolderNotFoundError);
			expect(mockDriver.writeObject).not.toHaveBeenCalled();
		});

		test("throws when DB insert returns empty result", async () => {
			// insert returning [] → newFile is undefined
			const returning = mock(() => Promise.resolve([]));
			const values = mock(() => ({ returning }));
			mockInsert.mockReturnValueOnce({ values } as never);

			const service = new StorageService(testUser);
			await expect(
				service.createFile({ name: "fail.txt", size: 0 }),
			).rejects.toThrow("Failed to insert file into database");
		});
	});

	// =========================================================================
	// createFolder
	// =========================================================================
	describe("createFolder", () => {
		test("inserts folder into DB and returns { id, name }", async () => {
			// getUniqueDisplayName → select existing folder names → [] (default)
			// db.insert(folders).values({...}) → default chain works (no .returning())

			const service = new StorageService(testUser);
			const result = await service.createFolder("Photos");

			expect(result.name).toBe("Photos");
			expect(typeof result.id).toBe("string");
			expect(result.id).toHaveLength(36); // UUID
			// The scan drops a folder row with no directory.
			expect(existsSync(join(service.getStoragePath(), result.id))).toBeTrue();
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "create", userId: "user-1" }),
			);
		});

		test("returns unique name when folder name already exists", async () => {
			// getUniqueDisplayName → select existing folder names → collision
			mockNextSelect([{ name: "Photos" }]);

			const service = new StorageService(testUser);
			const result = await service.createFolder("Photos");

			expect(result.name).toBe("Photos (1)");
		});

		test("wraps DB errors in a generic message", async () => {
			// Make insert throw
			mockInsert.mockReturnValueOnce({
				values: mock(() => {
					throw new Error("unique constraint violation");
				}),
			} as never);

			const service = new StorageService(testUser);
			await expect(service.createFolder("Dup")).rejects.toThrow(
				"Failed to create folder",
			);
		});
	});

	// =========================================================================
	// deleteFile
	// =========================================================================
	describe("deleteFile", () => {
		test("deletes DB record and calls driver.deleteObject when file found", async () => {
			mockNextSelect([baseFile]);

			const service = new StorageService(testUser);
			await service.deleteFile("abc-uuid.txt");

			// One for the file row, two more for purgeGrantsFor's shares/sharings
			// cleanup.
			expect(mockDelete).toHaveBeenCalledTimes(3);
			expect(mockDriver.deleteObject).toHaveBeenCalledWith("abc-uuid.txt");
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "delete", userId: "user-1" }),
			);
		});

		test("still calls driver.deleteObject even when file not in DB", async () => {
			// default select returns [] → file not found in DB
			const service = new StorageService(testUser);
			await service.deleteFile("ghost.txt");

			// delete() should NOT be called (no DB record)
			expect(mockDelete).not.toHaveBeenCalled();
			// but driver.deleteObject should still run
			expect(mockDriver.deleteObject).toHaveBeenCalledWith("ghost.txt");
		});

		test("wraps driver errors in a descriptive Error", async () => {
			mockNextSelect([baseFile]);
			mockDriver.deleteObject.mockRejectedValueOnce(new Error("disk full"));

			const service = new StorageService(testUser);
			await expect(service.deleteFile("abc-uuid.txt")).rejects.toThrow(
				"Error deleting file with key: abc-uuid.txt",
			);
		});
	});

	describe("uploadFileBody", () => {
		// The probe used to be awaited here, holding every media upload open
		// for as long as the worker's queue was.
		test("answers without waiting for the duration probe", async () => {
			mockNextSelect([{ ...baseFile, name: "song.mp3", path: "song.mp3" }]);
			let finishProbe = (_: undefined) => {};
			mockAwaitJob.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishProbe = resolve;
					}) as never,
			);
			const sets: unknown[] = [];
			mockUpdate.mockImplementation(() => ({
				set: (values: unknown) => {
					sets.push(values);
					return makeChain([]);
				},
			}));

			const service = new StorageService(testUser);
			await service.uploadFileBody("file-1", new Uint8Array([1, 2]));

			expect(sets[0]).toMatchObject({ size: 2, musicDuration: null });
			expect(mockEnqueueJob).toHaveBeenCalledWith(
				expect.objectContaining({ type: "media-probe" }),
			);
			finishProbe(undefined);
		});
	});

	// =========================================================================
	// deleteFolder
	// =========================================================================
	describe("deleteFolder", () => {
		test("deletes all files and folders from DB and removes from driver", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			await service.deleteFolder("folder-uuid-1");

			expect(mockDriver.deleteObjectsByPrefix).toHaveBeenCalledWith(
				"folder-uuid-1/",
			);
			// Called once for files, once for folders
			expect(mockDelete).toHaveBeenCalledTimes(2);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "delete", userId: "user-1" }),
			);
		});

		test("normalises trailing slash in key", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			await service.deleteFolder("folder-uuid-1/");

			expect(mockDriver.deleteObjectsByPrefix).toHaveBeenCalledWith(
				"folder-uuid-1/",
			);
		});

		test("refuses a folder that does not exist instead of reporting success", async () => {
			const service = new StorageService(testUser);
			await expect(service.deleteFolder("folder-uuid-1")).rejects.toThrow(
				"Folder not found: folder-uuid-1",
			);
			expect(mockDriver.deleteObjectsByPrefix).not.toHaveBeenCalled();
			expect(mockDelete).not.toHaveBeenCalled();
		});

		test("wraps driver errors in a descriptive Error", async () => {
			mockNextSelect([{ id: "folder-1" }]);
			mockDriver.deleteObjectsByPrefix.mockRejectedValueOnce(
				new Error("storage error"),
			);

			const service = new StorageService(testUser);
			await expect(service.deleteFolder("folder-uuid-1")).rejects.toThrow(
				"Error deleting folder with key: folder-uuid-1",
			);
		});
	});

	// =========================================================================
	// trashFolder
	// =========================================================================
	describe("trashFolder", () => {
		test("marks folder and contained files as isTrashed=true", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			await service.trashFolder("folder-uuid-1");

			// update for files + update for folders
			expect(mockUpdate).toHaveBeenCalledTimes(2);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "update", userId: "user-1" }),
			);
		});

		test("throws when folder not found", async () => {
			// default select returns []

			const service = new StorageService(testUser);
			await expect(service.trashFolder("missing-folder")).rejects.toThrow(
				"Folder not found",
			);
		});

		test("normalises trailing slash before looking up folder", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			await service.trashFolder("folder-uuid-1/");

			expect(mockUpdate).toHaveBeenCalledTimes(2);
		});
	});

	// =========================================================================
	// restoreFolder
	// =========================================================================
	describe("restoreFolder", () => {
		test("marks folder and contained files as isTrashed=false", async () => {
			mockNextSelect([{ id: "folder-1" }]);

			const service = new StorageService(testUser);
			await service.restoreFolder("folder-uuid-1");

			expect(mockUpdate).toHaveBeenCalledTimes(2);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "update", userId: "user-1" }),
			);
		});

		test("throws when folder not found", async () => {
			const service = new StorageService(testUser);
			await expect(service.restoreFolder("missing-folder")).rejects.toThrow(
				"Folder not found",
			);
		});
	});

	// =========================================================================
	// updateFile
	// =========================================================================
	describe("updateFile", () => {
		test("updates metadata fields in the DB", async () => {
			mockNextSelect([baseFile]);

			const service = new StorageService(testUser);
			await service.updateFile("abc-uuid.txt", {
				tags: ["important"],
				isStarred: true,
			});

			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "update", userId: "user-1" }),
			);
		});

		test("updates display name and re-derives contentType / category from key", async () => {
			mockNextSelect([baseFile]);

			const service = new StorageService(testUser);
			await service.updateFile("abc-uuid.txt", { key: "report.pdf" });

			expect(mockUpdate).toHaveBeenCalledTimes(1);
		});

		test("throws FileOrFolderNotFoundError when file not found", async () => {
			const service = new StorageService(testUser);
			await expect(
				service.updateFile("no-such-file.txt", { tags: [] }),
			).rejects.toThrow(FileOrFolderNotFoundError);
		});
	});

	// =========================================================================
	// updateFolderMeta
	// =========================================================================
	describe("updateFolderMeta", () => {
		test("updates folder metadata fields in the DB", async () => {
			mockNextSelect([baseFolder]);

			const service = new StorageService(testUser);
			await service.updateFolderMeta("folder-uuid-1", {
				isStarred: true,
				tags: ["work"],
			});

			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "update", userId: "user-1" }),
			);
		});

		test("throws when folder not found", async () => {
			const service = new StorageService(testUser);
			await expect(
				service.updateFolderMeta("missing-folder", { name: "New Name" }),
			).rejects.toThrow("Folder not found");
		});

		test("trashing a folder takes its contents with it", async () => {
			mockNextSelect([baseFolder]);

			const service = new StorageService(testUser);
			await service.updateFolderMeta("folder-uuid-1", { isTrashed: true });

			// The folder row, then the descendant files and folders
			expect(mockUpdate).toHaveBeenCalledTimes(3);
		});
	});

	// =========================================================================
	// moveFile
	// =========================================================================
	describe("moveFile", () => {
		test("copies to new path in driver and updates DB record", async () => {
			// 1. select to find source file
			mockNextSelect([baseFile]);
			// 2. getUniqueDisplayName: select existing file names in dest (root) → no conflict
			// (default returns [])

			const service = new StorageService(testUser);
			await service.moveFile("abc-uuid.txt", "");

			expect(mockDriver.copyObject).toHaveBeenCalledTimes(1);
			expect(mockDriver.deleteObject).toHaveBeenCalledWith("abc-uuid.txt");
			expect(mockUpdate).toHaveBeenCalledTimes(1);
			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ action: "update", userId: "user-1" }),
			);
		});

		test("throws FileOrFolderNotFoundError when source file not found", async () => {
			// default select returns []

			const service = new StorageService(testUser);
			await expect(service.moveFile("ghost.txt", "")).rejects.toThrow(
				FileOrFolderNotFoundError,
			);
		});
	});

	// =========================================================================
	// searchFiles
	// =========================================================================
	describe("searchFiles", () => {
		test("returns empty list for empty query string", async () => {
			const service = new StorageService(testUser);
			const result = await service.searchFiles("");

			expect(result).toEqual({ list: [], count: 0, total: 0 });
		});

		test("returns empty list for whitespace-only query", async () => {
			const service = new StorageService(testUser);
			const result = await service.searchFiles("   ");

			expect(result).toEqual({ list: [], count: 0, total: 0 });
		});

		test("returns matched files and folders sorted by relevance", async () => {
			const matchingFile: DbFile = { ...baseFile, name: "report.txt" };
			const matchingFolder: DbFolder = { ...baseFolder, name: "reports" };

			// Promise.all fires two selects: files first, folders second
			mockNextSelect([matchingFile]);
			mockNextSelect([matchingFolder]);

			const service = new StorageService(testUser);
			const result = await service.searchFiles("report");

			expect(result.total).toBe(2);
			expect(result.count).toBe(2);
			// Folders are preferred when name matches
			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[0].type).toBe("folder");
			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[0].metadata.name).toBe("reports");
			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[1].type).toBe("file");
		});

		test("exact name match is ranked above partial match", async () => {
			const exactFile: DbFile = { ...baseFile, id: "exact", name: "doc" };
			const partialFile: DbFile = {
				...baseFile,
				id: "partial",
				name: "documentation.txt",
			};

			mockNextSelect([exactFile, partialFile]);
			mockNextSelect([]); // no folder matches

			const service = new StorageService(testUser);
			const result = await service.searchFiles("doc");

			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[0].metadata.name).toBe("doc");
		});

		test("limits results to the provided limit argument", async () => {
			const manyFiles: DbFile[] = Array.from({ length: 10 }, (_, i) => ({
				...baseFile,
				id: `file-${i}`,
				name: `file-${i}.txt`,
			}));
			mockNextSelect(manyFiles);
			mockNextSelect([]);

			const service = new StorageService(testUser);
			const result = await service.searchFiles("file", 3);

			expect(result.count).toBe(3);
			expect(result.total).toBe(10);
		});
	});

	// =========================================================================
	// emptyTrash
	// =========================================================================
	describe("emptyTrash", () => {
		test("removes trashed rows and reports the bytes freed", async () => {
			const trashedFile: DbFile = { ...baseFile, isTrashed: true };
			const trashedFolder: DbFolder = { ...baseFolder, isTrashed: true };

			mockNextSelect([trashedFile]);
			mockNextSelect([trashedFolder]);

			const service = new StorageService(testUser);
			const result = await service.emptyTrash();

			expect(result).toEqual({ deleted: 2, freed: 2048, failed: 0 });
			expect(mockEnqueueJob.mock.calls[0]?.[0]).toMatchObject({
				type: "delete",
				spec: {
					files: ["/tmp/penombre-test-storage/user-user-1/abc-uuid.txt"],
					dirs: ["/tmp/penombre-test-storage/user-user-1/folder-uuid-1"],
				},
			});
			// One delete for the files, one for the folders, plus
			// purgeGrantsFor's shares/sharings cleanup called once per
			// resource type (2 deletes each).
			expect(mockDelete).toHaveBeenCalledTimes(6);
		});

		test("keeps the row of a file the job reports it could not delete", async () => {
			const trashedFile: DbFile = { ...baseFile, isTrashed: true };

			mockNextSelect([trashedFile]);
			mockNextSelect([]);
			mockAwaitJob.mockImplementationOnce(async () => ({
				status: "succeeded",
				result: JSON.stringify({
					failedFiles: ["/tmp/penombre-test-storage/user-user-1/abc-uuid.txt"],
					failedDirs: [],
				}),
			}));

			const service = new StorageService(testUser);
			const result = await service.emptyTrash();

			expect(result).toEqual({ deleted: 0, freed: 0, failed: 1 });
			expect(mockDelete).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// listFiles / abstractListFiles
	// =========================================================================
	describe("listFiles", () => {
		test("returns root-level items (files + folders) for undefined prefix", async () => {
			// Promise.all: files first, folders second
			mockNextSelect([baseFile]);
			mockNextSelect([baseFolder]);

			const service = new StorageService(testUser);
			const result = await service.listFiles();

			expect(result.count).toBe(2);
			expect(result.total).toBe(2);
			const types = result.list.map((i) => i.type);
			expect(types).toContain("file");
			expect(types).toContain("folder");
		});

		test("returns empty list when specified folder prefix does not exist", async () => {
			// getFolderIdByPath("missing-folder") → select returns [] → folderId=null
			// Since prefix is given and folderId is null → early empty return

			const service = new StorageService(testUser);
			const result = await service.listFiles("missing-folder");

			expect(result).toEqual({ list: [], count: 0, total: 0 });
		});

		test("applies limit and offset pagination", async () => {
			const files: DbFile[] = Array.from({ length: 5 }, (_, i) => ({
				...baseFile,
				id: `file-${i}`,
				name: `file-${i}.txt`,
			}));
			mockNextSelect(files);
			mockNextSelect([]); // no folders

			const service = new StorageService(testUser);
			const result = await service.listFiles(undefined, {
				limit: 2,
				offset: 1,
			});

			expect(result.count).toBe(2);
			expect(result.total).toBe(5);
		});
	});

	// =========================================================================
	// getFolder
	// =========================================================================
	describe("getFolder", () => {
		test("returns path with trailing slash when folder found", async () => {
			mockNextSelect([baseFolder]);

			const service = new StorageService(testUser);
			const result = await service.getFolder("folder-uuid-1");

			expect(result).toBe("folder-uuid-1/");
		});

		test("throws FileOrFolderNotFoundError when folder not found", async () => {
			const service = new StorageService(testUser);
			await expect(service.getFolder("no-such-folder")).rejects.toThrow(
				FileOrFolderNotFoundError,
			);
		});
	});

	// =========================================================================
	// getFolderMeta
	// =========================================================================
	describe("getFolderMeta", () => {
		test("returns FileMetadata when folder found", async () => {
			mockNextSelect([baseFolder]);

			const service = new StorageService(testUser);
			const meta = await service.getFolderMeta("folder-uuid-1");

			expect(meta).not.toBeNull();
			expect(meta?.name).toBe("My Folder");
			expect(meta?.owner).toBe("user-1");
		});

		test("returns null when folder not found", async () => {
			const service = new StorageService(testUser);
			const meta = await service.getFolderMeta("missing");

			expect(meta).toBeNull();
		});
	});

	// =========================================================================
	// getFullFolderPath
	// =========================================================================
	describe("getFullFolderPath", () => {
		test("returns folderId with trailing slash when no parent", () => {
			const service = new StorageService(testUser);
			expect(service.getFullFolderPath("folder-1")).toBe("folder-1/");
		});

		test("prepends parentId when provided", () => {
			const service = new StorageService(testUser);
			expect(service.getFullFolderPath("child", "parent")).toBe(
				"parent/child/",
			);
		});
	});

	// =========================================================================
	// getUniqueDisplayName (tested via createFile & createFolder)
	// =========================================================================
	describe("getUniqueDisplayName (via createFile)", () => {
		test("increments counter until no collision (e.g. (2) when (1) also taken)", async () => {
			// Simulate both "doc.txt" and "doc (1).txt" already exist
			mockNextSelect([{ name: "doc.txt" }, { name: "doc (1).txt" }]);
			const renamedFile = { ...baseFile, name: "doc (2).txt" };
			mockNextInsertReturning([renamedFile]);

			const service = new StorageService(testUser);
			const result = await service.createFile({ name: "doc.txt", size: 0 });

			expect(result.metadata.name).toBe("doc (2).txt");
		});
	});

	// =========================================================================
	// Volumes
	// =========================================================================
	describe("volume roots", () => {
		const volume = {
			name: "media",
			label: "Media",
			path: "/mnt/media",
			readOnly: false,
		};

		// A volume is one tree for everybody. Rooting it at a per-user
		// subdirectory showed an empty mount and created a `user-<id>` folder
		// inside somebody's media library.
		test("a volume is rooted at the mount itself, never per user", () => {
			const service = new StorageService(testUser, volume);
			expect(service).toBeInstanceOf(StorageService);
			expect(volumeDriverArgs).toEqual({
				path: "/mnt/media",
				userFolder: "",
			});
		});
	});

	// =========================================================================
	// Share scopes
	// =========================================================================
	describe("share scopes", () => {
		const folderShare = {
			scope: { kind: "folder" as const, path: "shared" },
		};

		// The scope hides rows, but a create names a path without reading a row
		// there, so without the guard a recipient could write anywhere.
		test("a shared folder refuses creates outside it", () => {
			const service = new StorageService(
				testUser,
				undefined,
				testUser,
				folderShare,
			);
			expect(() => service.createFile({ name: "x.txt", size: 0 })).toThrow(
				DriveAccessError,
			);
			expect(() => service.createFolder("x", "elsewhere")).toThrow(
				DriveAccessError,
			);
			expect(() => service.createFolder("x", "shared-sibling")).toThrow(
				DriveAccessError,
			);
		});

		test("a recipient may not move or trash the shared folder itself", () => {
			const service = new StorageService(
				testUser,
				undefined,
				testUser,
				folderShare,
			);
			expect(() => service.moveFolder("shared", "")).toThrow(DriveAccessError);
			expect(() => service.trashFolder("shared")).toThrow(DriveAccessError);
			expect(() => service.emptyTrash()).toThrow(DriveAccessError);
		});

		test("a shared file allows no creates at all", () => {
			const service = new StorageService(testUser, undefined, testUser, {
				scope: { kind: "file", fileId: "file-1", folderId: "folder-1" },
			});
			expect(() => service.createFolder("x", "folder-uuid-1")).toThrow(
				DriveAccessError,
			);
			expect(() => service.duplicateFile("folder-uuid-1/a.txt")).toThrow(
				DriveAccessError,
			);
		});

		test("a read share refuses writes", () => {
			const service = new StorageService(testUser, undefined, testUser, {
				...folderShare,
				readOnly: true,
			});
			expect(() =>
				service.createFile({ name: "x.txt", size: 0 }, "shared"),
			).toThrow(ReadOnlyVolumeError);
		});

		// `deleteFile` removes bytes by key even when no row matched.
		test("deleting outside the scope never reaches the driver", async () => {
			mockNextSelect([]);
			const service = new StorageService(
				testUser,
				undefined,
				testUser,
				folderShare,
			);
			await expect(service.deleteFile("elsewhere.txt")).rejects.toThrow(
				FileOrFolderNotFoundError,
			);
			expect(mockDriver.deleteObject).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// Transfer
	// =========================================================================
	describe("transfer", () => {
		test("a file is copied into the target with a fresh row", async () => {
			const source = new StorageService(testUser);
			// A volume names what it writes, so the name is claimed on disk.
			const mount = await mkdtemp(join(tmpdir(), "penombre-media-"));
			const target = new StorageService(testUser, {
				name: "media",
				label: "Media",
				path: mount,
				readOnly: false,
			});
			mockNextSelect([]); // no name collision in the target
			const values = mock((_row: Record<string, unknown>) => Promise.resolve());
			mockInsert.mockReturnValueOnce({ values } as never);

			const result = await target.importTree(
				{ type: "file", folders: [], files: [baseFile] },
				"",
				source,
			);

			expect(result).toEqual({ copied: 1, failed: 0 });
			const pair = mockEnqueueJob.mock.calls[0]?.[0]?.spec?.pairs?.[0];
			expect(pair?.source).toBe(
				"/tmp/penombre-test-storage/user-user-1/abc-uuid.txt",
			);
			expect(pair?.dest).toBe(join(mount, baseFile.name));
			await rm(mount, { recursive: true, force: true });
			const batch = values.mock.calls[0]?.[0] as unknown as
				Record<string, unknown>[] | undefined;
			const row = batch?.[0];
			expect(row?.name).toBe(baseFile.name);
			expect(row?.volumeId).toBe("media");
			expect(row?.id).not.toBe(baseFile.id);
		});

		test("a read-only target refuses the import", () => {
			const target = new StorageService(testUser, undefined, undefined, {
				readOnly: true,
			});
			expect(() =>
				target.importTree(
					{ type: "file", folders: [], files: [baseFile] },
					"",
					new StorageService(testUser),
				),
			).toThrow(ReadOnlyVolumeError);
		});
	});
});

// ---------------------------------------------------------------------------
// The facade over a real tree: SQLite with the app's migrations, bytes in a
// temp directory, behind a volume so names on disk read as written.
// ---------------------------------------------------------------------------
const { migratedSqlite } = await import("#lib/server/db/test-utils.js");
const { files, fileVersions, folders, user } =
	await import("#lib/server/db/schema.js");
const { LocalStorageDriver } = await import("./drivers/local");
const appSettings = await import("#lib/server/services/app-settings.js");
const { eq } = await import("drizzle-orm");

type Service = InstanceType<typeof StorageService>;
type Internals = Record<string, Record<string, unknown>>;

describe("StorageService over a real tree", () => {
	let database: ReturnType<typeof migratedSqlite>;
	let root: string;
	let service: Service;

	const volumeAt = (path: string, readOnly = false) => ({
		name: "media",
		label: "Media",
		path,
		readOnly,
	});

	/** A service on the temp tree, reading and writing the real database. */
	function onTree(
		options: ConstructorParameters<typeof StorageService>[3] = {},
		readOnly = false,
	): Service {
		const built = new StorageService(
			testUser,
			volumeAt(root, readOnly),
			undefined,
			options,
		);
		Object.assign((built as unknown as Internals).ctx ?? {}, {
			db: database,
			driver: new LocalStorageDriver(root),
		});
		return built;
	}

	/** Stubs one method of one of the service's private helpers. */
	function stub(target: Service, helper: string, method: string) {
		const fake = mock(async (..._args: unknown[]) => "stubbed" as unknown);
		const internals = (target as unknown as Internals)[helper];
		if (internals) {
			internals[method] = fake;
		}
		return fake;
	}

	async function rowOf(id: string) {
		const [row] = await database.select().from(files).where(eq(files.id, id));
		return row;
	}

	async function upload(name: string, body: string, folder?: string) {
		const created = await service.createFile({ name, size: 0 }, folder);
		await service.uploadFileBody(created.id, new TextEncoder().encode(body), {
			snapshot: false,
		});
		return created;
	}

	const text = (path: string) => readFile(join(root, path), "utf8");

	beforeEach(async () => {
		database = migratedSqlite();
		await database.insert(user).values({
			id: testUser.id,
			name: testUser.name,
			email: testUser.email,
		});
		root = await mkdtemp(join(tmpdir(), "penombre-facade-"));
		service = onTree();
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	describe("identity", () => {
		test("names its tree and its mount", () => {
			expect(service.locationKey).toBe("user-1:media");
			expect(service.getVolume()?.path).toBe(root);
			expect(service.getStoragePath()).toBe(root);
			expect(service.readOnly).toBe(false);
			expect(onTree({}, true).readOnly).toBe(true);
		});

		test("the admin view reads the configured storage path", () => {
			expect(StorageService.getAdminStoragePath()).toBe(storageBase.path);
			expect(StorageService.getAvailableStorageSize()).toBeGreaterThanOrEqual(
				0,
			);
		});
	});

	describe("files", () => {
		test("a created file is found every way it can be addressed", async () => {
			const created = await upload("note.txt", "hello");

			expect(created.finalName).toBe("note.txt");
			expect(await service.findFileById(created.id)).toBe("note.txt");
			expect(await service.findFileOwner(created.id)).toEqual({
				ownerId: testUser.id,
				name: "note.txt",
				volumeId: "media",
			});
			expect(await service.fileExists("note.txt")).toBe(true);
			expect(await service.fileExistsById(created.id)).toBe(true);
			expect((await service.getFile("note.txt")).size).toBe(5);
			const raw = await service.getRawFileData("note.txt");
			expect(new TextDecoder().decode(raw?.buffer)).toBe("hello");
			const opened = await service.openRawFile("note.txt");
			expect(await new Response(await opened?.stream()).text()).toBe("hello");
		});

		test("a batch lands in its folder with unique names", async () => {
			const folder = await service.createFolder("Takes");

			const results = await service.createBatchFiles(
				[
					{ name: "a.txt", size: 1 },
					{ name: "a.txt", size: 1 },
				],
				folder.path,
			);

			expect(results.map((result) => result.finalName)).toEqual([
				"Takes/a.txt",
				"Takes/a (1).txt",
			]);
		});

		test("rename, move, duplicate and delete keep rows and bytes together", async () => {
			const created = await upload("note.txt", "body");
			const folder = await service.createFolder("Notes");

			await service.updateFile("note.txt", { key: "Renamed.txt" });
			expect(await text("Renamed.txt")).toBe("body");

			await service.moveFile("Renamed.txt", folder.path);
			expect((await rowOf(created.id))?.path).toBe("Notes/Renamed.txt");

			const copy = await service.duplicateFile("Notes/Renamed.txt");
			expect((await rowOf(copy.metadata.id))?.path).toBe(
				"Notes/Renamed (1).txt",
			);
			expect(await text("Notes/Renamed (1).txt")).toBe("body");

			await service.deleteFile("Notes/Renamed (1).txt");
			expect(await rowOf(copy.metadata.id)).toBeUndefined();
			expect(existsSync(join(root, "Notes/Renamed (1).txt"))).toBe(false);
		});

		test("writeFile replaces the bytes in place", async () => {
			await upload("note.txt", "old");

			await service.writeFile("note.txt", new TextEncoder().encode("new"));

			expect(await text("note.txt")).toBe("new");
		});
	});

	describe("folders", () => {
		test("create, star, trash, restore and delete a subtree", async () => {
			const band = await service.createFolder("Band");
			const demos = await service.createFolder("Demos", band.path);
			await upload("take.txt", "123", demos.path);

			expect(await service.getFolder(band.path)).toBe("Band/");
			expect(await service.folderExists("Band/Demos")).toBe(true);
			expect(await service.resolveListedFolder("Demos", "Band")).toBe(
				"Band/Demos/",
			);
			expect(service.getFullFolderPath("Demos", "Band")).toBe("Band/Demos/");
			expect(await service.listFolders("Band")).toEqual([demos.id]);
			expect(
				(await service.listFoldersWithMetadata("")).map((row) => row.path),
			).toEqual(["Band", "Band/Demos"]);
			expect(await service.calculateFolderSize("Band")).toBe(3);
			expect(await service.calculateFolderSizes("")).toEqual(
				new Map([[band.id, 0]]),
			);
			expect(await service.folderNames(["Band/Demos"])).toEqual(
				new Map([
					["Band", "Band"],
					["Band/Demos", "Demos"],
				]),
			);

			await service.updateFolderMeta("Band", { isStarred: true });
			expect((await service.getFolderMeta("Band"))?.isStarred).toBe(true);

			await service.trashFolder("Band");
			expect(await service.countTrashedItems()).toBeGreaterThan(0);
			await service.restoreFolder("Band");
			expect(await service.countTrashedItems()).toBe(0);

			await service.deleteFolder("Band");
			expect(await database.select().from(folders)).toHaveLength(0);
			expect(await database.select().from(files)).toHaveLength(0);
		});

		test("a moved folder takes its files", async () => {
			const band = await service.createFolder("Band");
			const archive = await service.createFolder("Archive");
			const take = await upload("take.txt", "x", band.path);

			await service.moveFolder(band.path, archive.path);

			expect((await rowOf(take.id))?.path).toBe("Archive/Band/take.txt");
			expect(await text("Archive/Band/take.txt")).toBe("x");
		});
	});

	describe("listings", () => {
		test("every listing reads the same rows", async () => {
			const folder = await service.createFolder("Band");
			const take = await upload("take.txt", "x", folder.path);
			await upload("loose.txt", "y");
			await service.updateFile("loose.txt", { isStarred: true });

			const page = await service.listFolderPage("Band");
			expect(page.list.map((item) => item.metadata.id)).toEqual([take.id]);
			const listed = await service.listFiles();
			expect(listed.list.map((item) => item.key).toSorted()).toEqual([
				"Band/",
				"loose.txt",
			]);
			const everything = await service.abstractListFiles({ recursive: true });
			expect(everything.list.length).toBeGreaterThanOrEqual(2);
			const documents = await service.listFilesPerCategory("DOCUMENTS");
			expect(documents.total).toBe(2);
			expect((await service.listRecentFiles()).list).toHaveLength(2);
			const starred = await service.listStarredFiles();
			expect(starred.list.map((item) => item.key)).toEqual(["loose.txt"]);
			expect(await service.countStarredItems()).toBe(1);
			const found = await service.searchFiles("take");
			expect(found.list.map((item) => item.metadata.id)).toEqual([take.id]);

			const entries = await service.treeEntries("Band");
			expect(entries?.map((entry) => entry.name)).toEqual(["take.txt"]);
			expect((await service.treeEntry("", "Band"))?.type).toBe("folder");
			expect((await service.treeEntryById("file", take.id))?.path).toBe(
				"Band/take.txt",
			);
		});

		test("the trash lists what was trashed, and emptying it removes the rows", async () => {
			await upload("gone.txt", "12345");
			await service.updateFile("gone.txt", { isTrashed: true });

			const trash = await service.listTrashFiles();
			expect(trash.list.map((item) => item.key)).toEqual(["gone.txt"]);

			const result = await service.emptyTrash();

			expect(result).toEqual({ deleted: 1, freed: 5, failed: 0 });
			expect(await database.select().from(files)).toHaveLength(0);
			expect(mockEnqueueJob.mock.calls[0]?.[0]?.type).toBe("delete");
		});
	});

	describe("versions", () => {
		const settings = spyOn(appSettings, "getAppSettings");

		beforeAll(() => {
			settings.mockResolvedValue({
				versioningEnabled: true,
				maxVersionsPerFile: 3,
			} as never);
		});

		afterAll(() => settings.mockRestore());

		test("snapshot, restore, reorder and delete a file's versions", async () => {
			const { id } = await upload("note.txt", "first");

			const first = await service.snapshotFile(id);
			await service.uploadFileBody(id, new TextEncoder().encode("second"), {
				snapshot: false,
			});
			expect(first).not.toBeNull();
			const opened = await service.openVersion(id, first?.id ?? "");
			expect(await new Response(await opened?.stream()).text()).toBe("first");

			expect(await service.restoreVersion(id, first?.id ?? "")).toBe(true);
			expect(await text("note.txt")).toBe("first");
			const listed = await service.listFileVersions(id);
			expect(listed?.versions).toHaveLength(2);

			const ids = listed?.versions.map((version) => version.id) ?? [];
			expect(await service.reorderFileVersions(id, ids.toReversed())).toBe(
				true,
			);
			expect(await service.reorderFileVersions("missing", ids)).toBe(false);
			expect((await service.latestVersionSeqs([id])).get(id)).toBe(2);
			expect(await service.fileVersioning(id)).toEqual({
				enabled: true,
				max: 3,
			});
			expect(
				await service.versionThumbnail(id, first?.id ?? "", 200),
			).toBeNull();

			expect(await service.deleteFileVersion(id, ids[0] ?? "")).toBe(true);
			expect((await service.listFileVersions(id))?.versions).toHaveLength(1);
		});

		test("a history is zipped oldest first, and none is no archive", async () => {
			const kept = await upload("kept.txt", "a");
			const bare = await upload("bare.txt", "b");
			await service.snapshotFile(kept.id);
			const zip = stub(service, "zip", "createVersionsZip");

			expect(await service.versionsZip(bare.id)).toBeNull();
			expect(await service.versionsZip(kept.id)).toBe("stubbed");
			expect(zip.mock.calls[0]?.[0]).toMatchObject({ id: kept.id });
		});

		test("versions come back out as files beside their file", async () => {
			const { id } = await upload("note.txt", "first");
			await service.snapshotFile(id);

			const extracted = await service.extractVersions(id);

			expect(extracted).toHaveLength(1);
			expect((await service.listFileVersions(id))?.versions).toHaveLength(0);
			expect((await rowOf(extracted?.[0] ?? ""))?.name.startsWith("note")).toBe(
				true,
			);
		});

		test("a merge keeps the last file and makes the others its versions", async () => {
			const older = await upload("take 1.txt", "one");
			const newer = await upload("take 2.txt", "two");

			const kept = await service.mergeAsVersions([older.id, newer.id], "Take");

			expect(kept).toBe(newer.id);
			expect(await rowOf(older.id)).toBeUndefined();
			expect((await rowOf(newer.id))?.name).toBe("Take");
			const history = await database
				.select()
				.from(fileVersions)
				.where(eq(fileVersions.fileId, newer.id));
			expect(history).toHaveLength(1);
		});

		test("a save by rename keeps the target's row with the new bytes", async () => {
			const target = await upload("doc.txt", "old");
			const source = await upload("doc.tmp.txt", "new");

			expect(await service.replaceFile(target.id, source.id)).toBe(true);

			expect(await rowOf(source.id)).toBeUndefined();
			expect(await text("doc.txt")).toBe("new");
		});

		test("folder settings are read and written by id", async () => {
			const folder = await service.createFolder("Takes");

			expect(
				await service.setFolderSettings(folder.id, { maxVersions: 2 }),
			).toBe(true);
			const versioning = await service.getFolderVersioning(folder.id);
			expect(versioning?.effective).toEqual({ enabled: true, max: 2 });
			expect(await service.setFolderSettings("missing", {})).toBe(false);
		});

		test("a share recipient may not change the shared folder's own settings", async () => {
			const folder = await service.createFolder("Shared");
			const recipient = onTree({ scope: { kind: "folder", path: "Shared" } });

			await expect(recipient.setFolderSettings(folder.id, {})).rejects.toThrow(
				DriveAccessError,
			);
		});
	});

	describe("proxy", () => {
		test("serves bytes, metadata and no render for a text file", async () => {
			await upload("note.txt", "hello");

			const raw = (await service.handleProxyRequest({
				itemName: "note.txt",
				raw: true,
			})) as Response;
			expect(await raw.text()).toBe("hello");
			const ranged = await service.handleRawFile(
				"note.txt",
				undefined,
				"bytes=1-2",
			);
			expect(await ranged.text()).toBe("el");
			expect((await service.handleMetadata("note.txt")).key).toBe("note.txt");
			expect(await service.handleThumbnailRequest("note.txt")).toBeNull();
		});
	});

	describe("work handed to other helpers", () => {
		test("a scan passes its reporter and options through", async () => {
			const scan = stub(service, "scanOperations", "scan");
			const report = () => {};

			expect(await service.scanStorage(report, { full: true })).toBe(
				"stubbed" as never,
			);
			expect(scan.mock.calls[0]).toEqual([report, { full: true }]);
		});

		test("a share recipient may not scan", () => {
			const recipient = onTree({ scope: { kind: "folder", path: "Shared" } });

			expect(() => recipient.scanStorage()).toThrow(DriveAccessError);
		});

		test("archives are built by the zip helper", async () => {
			const fromPaths = stub(service, "zip", "createZipFromPaths");
			const fromFolder = stub(service, "zip", "createZipFromFolder");
			const account = stub(service, "zip", "createAccountExport");

			await service.createZipFromPaths(["a.txt"]);
			await service.createZipFromFolder("Band");
			await service.createAccountExport();

			expect(fromPaths.mock.calls[0]).toEqual([["a.txt"]]);
			expect(fromFolder.mock.calls[0]).toEqual(["Band"]);
			expect(account).toHaveBeenCalledTimes(1);
			expect(service.generateZipFilename(["a.txt"])).toBe(
				"penombre-download.zip",
			);
		});

		test("a tree exports with every file under it", async () => {
			const folder = await service.createFolder("Band");
			await upload("take.txt", "x", folder.path);

			const tree = await service.exportTree("Band/", "folder");

			expect(tree.files.map((file) => file.name)).toEqual(["take.txt"]);
		});

		test("an orphaned copy loses the bytes no row points at", async () => {
			await upload("kept.txt", "row");
			await writeFile(join(root, "stray.txt"), "no row");

			const removed = await service.reconcileOrphanedJob("copy", {
				copied: [join(root, "stray.txt"), join(root, "kept.txt")],
				failed: [],
			} as never);

			expect(removed).toBe(1);
			expect(existsSync(join(root, "stray.txt"))).toBe(false);
			expect(existsSync(join(root, "kept.txt"))).toBe(true);
		});

		test("an orphaned delete drops the trash rows whose bytes are gone", async () => {
			const gone = await upload("gone.txt", "x");
			await service.updateFile("gone.txt", { isTrashed: true });
			await rm(join(root, "gone.txt"));

			const removed = await service.reconcileOrphanedJob("delete", {
				deleted: [join(root, "gone.txt")],
				deletedDirs: [],
			} as never);

			expect(removed).toBe(1);
			expect(await rowOf(gone.id)).toBeUndefined();
		});

		test("probing durations with nothing missing enqueues nothing", async () => {
			await upload("note.txt", "x");

			await service.probeMissingDurations();

			expect(mockEnqueueJob).not.toHaveBeenCalled();
		});
	});

	describe("guards", () => {
		test("a read-only volume refuses every write before touching anything", async () => {
			const created = await upload("note.txt", "x");
			const folder = await service.createFolder("Band");
			const frozen = onTree({}, true);
			const writes: (() => unknown)[] = [
				() => frozen.writeFile("note.txt"),
				() => frozen.updateFile("note.txt", { isStarred: true }),
				() => frozen.moveFile("note.txt", "Band"),
				() => frozen.duplicateFile("note.txt"),
				() => frozen.createBatchFiles([{ name: "b.txt", size: 0 }]),
				() => frozen.uploadFileBody(created.id, Buffer.from("y")),
				() => frozen.deleteFile("note.txt"),
				() => frozen.snapshotFile(created.id),
				() => frozen.restoreVersion(created.id, "v"),
				() => frozen.deleteFileVersion(created.id, "v"),
				() => frozen.mergeAsVersions([created.id]),
				() => frozen.replaceFile(created.id, created.id),
				() => frozen.extractVersions(created.id),
				() => frozen.reorderFileVersions(created.id, []),
				() => frozen.setFolderSettings(folder.id, {}),
				() => frozen.moveFolder("Band", ""),
				() => frozen.createFolder("New"),
				() => frozen.deleteFolder("Band"),
				() => frozen.trashFolder("Band"),
				() => frozen.restoreFolder("Band"),
				() => frozen.updateFolderMeta("Band", { isStarred: true }),
				() => frozen.emptyTrash(),
			];

			for (const write of writes) {
				await expect(
					(async () => {
						await write();
					})(),
				).rejects.toThrow(ReadOnlyVolumeError);
			}
			expect(await text("note.txt")).toBe("x");
			expect(await database.select().from(folders)).toHaveLength(1);
		});

		test("a scoped write by key must find its row inside the scope", async () => {
			const folder = await service.createFolder("Shared");
			await upload("inside.txt", "in", folder.path);
			await upload("outside.txt", "out");
			const recipient = onTree({ scope: { kind: "folder", path: "Shared" } });

			await recipient.writeFile(
				"Shared/inside.txt",
				new TextEncoder().encode("edited"),
			);
			expect(await text("Shared/inside.txt")).toBe("edited");
			await expect(
				recipient.writeFile("outside.txt", new TextEncoder().encode("no")),
			).rejects.toThrow(FileOrFolderNotFoundError);
			expect(await text("outside.txt")).toBe("out");
		});
	});
});

describe("cleanupDeletedUserStorage", () => {
	let base: string;

	beforeEach(async () => {
		base = await mkdtemp(join(tmpdir(), "penombre-cleanup-"));
		storageBase.path = base;
	});

	afterEach(async () => {
		storageBase.path = "/tmp/penombre-test-storage";
		await rm(base, { recursive: true, force: true });
	});

	test("removes the trees of users and drives that no longer exist", async () => {
		await mkdir(join(base, "user-alive"), { recursive: true });
		await mkdir(join(base, "user-ghost"), { recursive: true });
		await mkdir(join(base, "drives/kept"), { recursive: true });
		await mkdir(join(base, "drives/gone"), { recursive: true });
		await mkdir(join(base, "volumes"), { recursive: true });
		mockNextSelect([{ id: "alive" }]);
		mockNextSelect([{ id: "kept" }]);

		await StorageService.cleanupDeletedUserStorage();

		expect(existsSync(join(base, "user-alive"))).toBe(true);
		expect(existsSync(join(base, "user-ghost"))).toBe(false);
		expect(existsSync(join(base, "drives/kept"))).toBe(true);
		expect(existsSync(join(base, "drives/gone"))).toBe(false);
		expect(existsSync(join(base, "volumes"))).toBe(true);
	});

	test("with no users at all, nothing is touched", async () => {
		await mkdir(join(base, "user-ghost"), { recursive: true });
		mockNextSelect([]);
		mockNextSelect([]);

		await StorageService.cleanupDeletedUserStorage();

		expect(existsSync(join(base, "user-ghost"))).toBe(true);
	});

	test("a storage path that does not exist is skipped", async () => {
		storageBase.path = join(base, "missing");
		mockNextSelect([{ id: "alive" }]);
		mockNextSelect([]);

		await StorageService.cleanupDeletedUserStorage();

		expect(existsSync(join(base, "missing"))).toBe(false);
	});
});
