import { beforeEach, describe, expect, type Mock, mock, test } from "bun:test";
import type { File as DbFile, Folder as DbFolder } from "$lib/server/db/schema";
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

mock.module("./constants", () => ({
	createUserStorageDriver: () => mockDriver,
	DEFAULT_STORAGE_PATH: "/tmp/penombre-test-storage",
	logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} },
}));

mock.module("$lib/server/services/activity", () => ({
	ActivityService: class {
		register = mockRegister;
	},
}));

mock.module("./cache", () => {
	function makeUserCache() {
		return {
			get: async () => undefined,
			set: async () => {},
			delete: async () => false as const,
			deleteByPrefix: async () => 0 as const,
			clear: async () => {},
			getSize: async () => 0 as const,
		};
	}
	return {
		CacheKeys: {
			starred: () => "starred",
			trashed: () => "trashed",
			recent: () => "recent",
			counts: () => "counts",
			fileIdIndex: () => "file-id-index",
			listing: (p: string, o?: string) =>
				`list:${p || "root"}${o ? `:${o}` : ""}`,
			folders: (p: string, trashedOnly = false) =>
				`folders:${p || "root"}:${trashedOnly ? "trashed" : "normal"}`,
			fileMeta: (k: string) => `meta:${k}`,
			folderMeta: (k: string) => `folder-meta:${k}`,
			folderSize: (k: string) => `folder-size:${k}`,
			category: (c: string) => `category:${c}`,
		},
		CacheManager: class {
			_caches = new Map<string, ReturnType<typeof makeUserCache>>();
			getUserCache(userId: string) {
				if (!this._caches.has(userId)) {
					this._caches.set(userId, makeUserCache());
				}
				return this._caches.get(userId)!;
			}
			async clearUserCache(userId: string): Promise<void> {
				this._caches.delete(userId);
			}
			async clearAllCaches(): Promise<void> {
				this._caches.clear();
			}
		},
	};
});

// ---------------------------------------------------------------------------
// Extend the shared mockDb with update + delete chains
// ---------------------------------------------------------------------------
import { getDb } from "$lib/server/db";

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

const mockSelect = rawDb.select as Mock<() => unknown>;
const mockInsert = rawDb.insert as Mock<() => unknown>;

// ---------------------------------------------------------------------------
// Dynamic import AFTER all mocks are wired
// ---------------------------------------------------------------------------
const { StorageService } = await import("./service");
const { FileOrFolderNotFoundError } = await import("$lib/server/errors");

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
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("StorageService", () => {
	// =========================================================================
	// Constructor / accessors
	// =========================================================================
	describe("constructor and accessors", () => {
		test("getStoragePath() returns path under DEFAULT_STORAGE_PATH", () => {
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

			expect(mockDelete).toHaveBeenCalledTimes(1);
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

	// =========================================================================
	// deleteFolder
	// =========================================================================
	describe("deleteFolder", () => {
		test("deletes all files and folders from DB and removes from driver", async () => {
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
			const service = new StorageService(testUser);
			await service.deleteFolder("folder-uuid-1/");

			expect(mockDriver.deleteObjectsByPrefix).toHaveBeenCalledWith(
				"folder-uuid-1/",
			);
		});

		test("wraps driver errors in a descriptive Error", async () => {
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
	// listTrashFiles
	// =========================================================================
	describe("listTrashFiles", () => {
		test("returns combined trashed files and folders as ObjectList", async () => {
			const trashedFile: DbFile = { ...baseFile, isTrashed: true };
			const trashedFolder: DbFolder = { ...baseFolder, isTrashed: true };

			// Promise.all: files first, folders second
			mockNextSelect([trashedFile]);
			mockNextSelect([trashedFolder]);

			const service = new StorageService(testUser);
			const result = await service.listTrashFiles();

			expect(result.count).toBe(2);
			expect(result.total).toBe(2);
			// Folders come first in the result (folders are prepended)
			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[0].type).toBe("folder");
			// @ts-expect-error - type is ObjectItem[] but we know the order here
			expect(result.list[1].type).toBe("file");
		});

		test("returns empty list when nothing is trashed", async () => {
			// both selects return [] by default

			const service = new StorageService(testUser);
			const result = await service.listTrashFiles();

			expect(result).toEqual({ list: [], count: 0, total: 0 });
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
});
