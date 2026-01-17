import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FileMetadata } from "$lib/server/schema";
import { StorageServiceBase } from "./base";
import {
	cleanupTestStoragePath,
	createTestStoragePath,
	mockUser,
} from "./test-utils";

/**
 * Tests for StorageServiceBase utility methods.
 */

// Create a concrete test class since StorageServiceBase is abstract
class TestStorageService extends StorageServiceBase {
	constructor(user: typeof mockUser, testStoragePath?: string) {
		super(user);
		// Override the storage path for tests if provided
		if (testStoragePath) {
			this.storagePath = join(testStoragePath, `user-${user.id}`);
		}
	}

	// Expose protected methods for testing
	public testResolveFileLocation(key: string) {
		return this.resolveFileLocation(key);
	}

	public testGenerateMeta(name: string) {
		return this.generateMeta(name);
	}

	public testPermissionsCheck(metadata: FileMetadata) {
		return this.permissionsCheck(metadata);
	}

	public testInvalidateListingCaches() {
		return this.invalidateListingCaches();
	}

	public testInvalidateDirectoryCache(prefix: string) {
		return this.invalidateDirectoryCache(prefix);
	}

	public testWalkFilesRecursively(basePath: string) {
		return this.walkFilesRecursively(basePath);
	}

	public getCache() {
		return this.cache;
	}
}

describe("StorageServiceBase", () => {
	let service: TestStorageService;
	let storagePath: string;
	let userPath: string;

	beforeEach(async () => {
		const paths = await createTestStoragePath();
		storagePath = paths.storagePath;
		userPath = paths.userPath;
		service = new TestStorageService(mockUser, storagePath);
	});

	afterEach(async () => {
		await cleanupTestStoragePath(storagePath);
	});

	describe("ensureUserDirectory", () => {
		it("should create user directory if it doesn't exist", async () => {
			await service.ensureUserDirectory();

			const exists = await service.folderExists("");
			expect(exists).toBe(true);
		});

		it("should not fail if directory already exists", async () => {
			await service.ensureUserDirectory();
			await service.ensureUserDirectory(); // Call twice

			const exists = await service.folderExists("");
			expect(exists).toBe(true);
		});
	});

	describe("getStoragePath", () => {
		it("should return the user's storage path", () => {
			const path = service.getStoragePath();
			expect(path).toContain(`user-${mockUser.id}`);
		});
	});

	describe("getUserFolder", () => {
		it("should return the user folder name", () => {
			const folder = service.getUserFolder();
			expect(folder).toBe(`user-${mockUser.id}`);
		});
	});

	describe("fileExists", () => {
		it("should return true when file exists", async () => {
			await service.ensureUserDirectory();
			const fileId = crypto.randomUUID();
			const filePath = join(userPath, fileId);
			await writeFile(filePath, "test content");

			const exists = await service.fileExists(fileId);
			expect(exists).toBe(true);
		});

		it("should return false when file does not exist", async () => {
			await service.ensureUserDirectory();

			const exists = await service.fileExists("nonexistent-file");
			expect(exists).toBe(false);
		});
	});

	describe("folderExists", () => {
		it("should return true when folder exists", async () => {
			await service.ensureUserDirectory();
			const folderPath = join(userPath, "test-folder");
			await mkdir(folderPath, { recursive: true });

			const exists = await service.folderExists("test-folder/");
			expect(exists).toBe(true);
		});

		it("should return false when folder does not exist", async () => {
			await service.ensureUserDirectory();

			const exists = await service.folderExists("nonexistent-folder/");
			expect(exists).toBe(false);
		});

		it("should handle folder keys without trailing slash", async () => {
			await service.ensureUserDirectory();
			const folderPath = join(userPath, "test-folder");
			await mkdir(folderPath, { recursive: true });

			const exists = await service.folderExists("test-folder");
			expect(exists).toBe(true);
		});
	});

	describe("generateMeta", () => {
		it("should generate metadata with UUID", () => {
			const meta = service.testGenerateMeta("test.txt");

			expect(meta.id).toBeDefined();
			expect(meta.id.length).toBeGreaterThan(0);
		});

		it("should set correct owner", () => {
			const meta = service.testGenerateMeta("test.txt");

			expect(meta.owner).toBe(mockUser.id);
		});

		it("should set default flags", () => {
			const meta = service.testGenerateMeta("test.txt");

			expect(meta.isTrashed).toBe(false);
			expect(meta.isStarred).toBe(false);
		});

		it("should determine category from filename", () => {
			const imageMeta = service.testGenerateMeta("photo.jpg");
			expect(imageMeta.category).toBe("IMAGES");

			const docMeta = service.testGenerateMeta("document.pdf");
			expect(docMeta.category).toBe("DOCUMENTS");
		});

		it("should determine content type from filename", () => {
			const textMeta = service.testGenerateMeta("test.txt");
			expect(textMeta.contentType).toBe("text/plain");

			const imageMeta = service.testGenerateMeta("photo.jpg");
			expect(imageMeta.contentType).toBe("image/jpeg");
		});
	});

	describe("permissionsCheck", () => {
		it("should not throw for owned files", () => {
			const meta: FileMetadata = {
				id: "test-id",
				name: "test.txt",
				owner: mockUser.id,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date(),
				isTrashed: false,
				isStarred: false,
			};

			expect(() => service.testPermissionsCheck(meta)).not.toThrow();
		});

		it("should throw for files owned by others", () => {
			const meta: FileMetadata = {
				id: "test-id",
				name: "test.txt",
				owner: "other-user-id",
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date(),
				isTrashed: false,
				isStarred: false,
			};

			expect(() => service.testPermissionsCheck(meta)).toThrow();
		});
	});

	describe("cache invalidation", () => {
		it("should invalidate all listing caches", () => {
			const cache = service.getCache();

			// Set some cache values
			cache.set("list:root", []);
			cache.set("folders:root", []);
			cache.set("starred", []);
			cache.set("trashed", []);

			service.testInvalidateListingCaches();

			// All listing caches should be cleared
			expect(cache.get("list:root")).toBeUndefined();
			expect(cache.get("folders:root")).toBeUndefined();
			expect(cache.get("starred")).toBeUndefined();
			expect(cache.get("trashed")).toBeUndefined();
		});

		it("should invalidate directory-specific caches", () => {
			const cache = service.getCache();

			// Set some cache values
			cache.set("list:Documents", []);
			cache.set("folders:Documents", []);
			cache.set("list:Photos", []); // Different prefix

			service.testInvalidateDirectoryCache("Documents");

			// Only Documents caches should be cleared
			expect(cache.get("list:Documents")).toBeUndefined();
			expect(cache.get("folders:Documents")).toBeUndefined();
			// Other prefix should remain
			expect(cache.get("list:Photos")).toBeDefined();
		});
	});

	describe("walkFilesRecursively", () => {
		it("should find all files in directory tree", async () => {
			await service.ensureUserDirectory();

			// Create nested structure
			const file1 = join(userPath, "file1.txt");
			const subdir = join(userPath, "subfolder");
			const file2 = join(subdir, "file2.txt");

			await writeFile(file1, "content1");
			await mkdir(subdir, { recursive: true });
			await writeFile(file2, "content2");

			const files = await service.testWalkFilesRecursively(userPath);

			expect(files.length).toBeGreaterThanOrEqual(2);
			expect(files.some((f) => f.endsWith("file1.txt"))).toBe(true);
			expect(files.some((f) => f.endsWith("file2.txt"))).toBe(true);
		});

		it("should exclude .meta.json files", async () => {
			await service.ensureUserDirectory();

			const file = join(userPath, "file.txt");
			const metaFile = join(userPath, "file.txt.meta.json");

			await writeFile(file, "content");
			await writeFile(metaFile, "{}");

			const files = await service.testWalkFilesRecursively(userPath);

			expect(files.some((f) => f.endsWith(".meta.json"))).toBe(false);
		});
	});

	describe("resolveFileLocation", () => {
		it("should resolve file by UUID", async () => {
			await service.ensureUserDirectory();

			const fileId = crypto.randomUUID();
			const filePath = join(userPath, fileId);
			const metaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "content");
			await writeFile(
				metaPath,
				JSON.stringify({
					id: fileId,
					name: "test.txt",
					owner: mockUser.id,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
					isTrashed: false,
					isStarred: false,
				}),
			);

			const result = await service.testResolveFileLocation(fileId);

			expect(result.currentPath).toBe(filePath);
			expect(result.currentMetaPath).toBe(metaPath);
		});

		it("should resolve file by display name as fallback", async () => {
			await service.ensureUserDirectory();

			const fileId = crypto.randomUUID();
			const filePath = join(userPath, fileId);
			const metaPath = `${filePath}.meta.json`;
			const displayName = "my-document.txt";

			await writeFile(filePath, "content");
			await writeFile(
				metaPath,
				JSON.stringify({
					id: fileId,
					name: displayName,
					owner: mockUser.id,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
					isTrashed: false,
					isStarred: false,
				}),
			);

			// Try to resolve by display name
			const result = await service.testResolveFileLocation(displayName);

			expect(result.currentPath).toBe(filePath);
		});

		it("should throw error if file not found", async () => {
			await service.ensureUserDirectory();

			await expect(
				service.testResolveFileLocation("nonexistent-file"),
			).rejects.toThrow("File not found");
		});
	});
});
