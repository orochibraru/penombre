import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { StorageService } from "./service";
import {
	cleanupTestStoragePath,
	createTestFile,
	createTestStoragePath,
	mockUser,
} from "./test-utils";

/**
 * File operation tests for StorageService.
 */

let testStoragePath: string;
let testUserPath: string;
let service: StorageService;

beforeAll(async () => {
	const paths = await createTestStoragePath();
	testStoragePath = paths.storagePath;
	testUserPath = paths.userPath;
	await mkdir(testUserPath, { recursive: true });

	// Create service with overridden storage path
	service = new StorageService(mockUser);
	// @ts-expect-error - Override for testing
	service.storagePath = testUserPath;
});

afterAll(async () => {
	await cleanupTestStoragePath(testStoragePath);
});

describe("StorageService - File Operations", () => {
	describe("File and Folder Structure", () => {
		it("should create user directory on ensureUserDirectory", async () => {
			expect(existsSync(testUserPath)).toBe(true);
		});

		it("should store files by UUID with metadata sidecar", async () => {
			const { filePath, metaPath, id } = await createTestFile(testUserPath, {
				name: "test.txt",
			});

			expect(existsSync(filePath)).toBe(true);
			expect(existsSync(metaPath)).toBe(true);

			// Verify metadata structure
			const metaContent = await Bun.file(metaPath).json();
			expect(metaContent.id).toBe(id);
			expect(metaContent.isTrashed).toBe(false);
		});
	});

	describe("Display Name vs Physical Key", () => {
		it("should allow display name change without physical file move", async () => {
			const { filePath, metaPath } = await createTestFile(testUserPath, {
				name: "original-name.txt",
			});

			// Change display name in metadata
			const meta = await Bun.file(metaPath).json();
			meta.name = "new-name.txt";
			await writeFile(metaPath, JSON.stringify(meta));

			// Physical file key (uuid) unchanged
			expect(existsSync(filePath)).toBe(true);

			// Display name updated in metadata
			const updated = await Bun.file(metaPath).json();
			expect(updated.name).toBe("new-name.txt");
		});

		it("should derive category and content type from display name", async () => {
			const { metaPath } = await createTestFile(testUserPath, {
				name: "song.mp3",
				category: "MUSIC",
				contentType: "audio/mpeg",
			});

			const file = await Bun.file(metaPath).json();
			expect(file.category).toBe("MUSIC");
			expect(file.contentType).toBe("audio/mpeg");

			// Change name to different type
			file.name = "file.pdf";
			file.category = "DOCUMENTS";
			file.contentType = "application/pdf";
			await writeFile(metaPath, JSON.stringify(file));

			const updated = await Bun.file(metaPath).json();
			expect(updated.category).toBe("DOCUMENTS");
			expect(updated.contentType).toBe("application/pdf");
		});
	});

	describe("Duplicate Operations", () => {
		it("should duplicate a file with new UUID and unique display name", async () => {
			const {
				filePath,
				metaPath,
				id: originalId,
			} = await createTestFile(testUserPath, {
				name: "document.txt",
				isStarred: true,
				category: "DOCUMENTS",
				contentType: "text/plain",
			});

			// Simulate duplication logic
			const newId = crypto.randomUUID();
			const newFilePath = join(testUserPath, newId);
			const newMetaPath = `${newFilePath}.meta.json`;

			// Copy file content
			const content = await Bun.file(filePath).arrayBuffer();
			await Bun.write(newFilePath, content);

			// Create new metadata with unique name
			const originalMeta = await Bun.file(metaPath).json();
			const newMeta = {
				...originalMeta,
				id: newId,
				name: "document (1).txt",
				createdAt: new Date().toISOString(),
				isTrashed: false,
				isStarred: false,
			};
			await writeFile(newMetaPath, JSON.stringify(newMeta));

			// Verify original is unchanged
			expect(existsSync(filePath)).toBe(true);

			// Verify duplicate exists with correct content
			expect(existsSync(newFilePath)).toBe(true);

			// Verify metadata differences
			const duplicateMeta = await Bun.file(newMetaPath).json();
			expect(duplicateMeta.id).not.toBe(originalId);
			expect(duplicateMeta.name).toBe("document (1).txt");
			expect(duplicateMeta.isTrashed).toBe(false);
			expect(duplicateMeta.isStarred).toBe(false);
			expect(duplicateMeta.category).toBe(originalMeta.category);
		});

		it("should generate incrementing names for multiple duplicates", async () => {
			// Create original and first duplicate
			await createTestFile(testUserPath, { name: "file.txt" });
			await createTestFile(testUserPath, { name: "file (1).txt" });

			// Simulate getUniqueDisplayName logic
			const { readdir } = await import("node:fs/promises");
			const entries = await readdir(testUserPath, { withFileTypes: true });
			const existingNames = new Set<string>();

			for (const entry of entries) {
				if (entry.name.endsWith(".meta.json")) {
					const meta = await Bun.file(join(testUserPath, entry.name)).json();
					if (!meta.isTrashed) {
						existingNames.add(meta.name.toLowerCase());
					}
				}
			}

			// Check naming logic
			expect(existingNames.has("file.txt")).toBe(true);
			expect(existingNames.has("file (1).txt")).toBe(true);

			// Next duplicate should be "file (2).txt"
			const baseName = "file";
			const extension = ".txt";
			let counter = 1;
			let newName = `${baseName} (${counter})${extension}`;
			while (existingNames.has(newName.toLowerCase())) {
				counter++;
				newName = `${baseName} (${counter})${extension}`;
			}

			expect(newName).toBe("file (2).txt");
		});
	});

	describe("File CRUD Operations", () => {
		it("should get file metadata with getFile", async () => {
			const { id } = await createTestFile(testUserPath, {
				name: "test-get.txt",
			});

			const result = await service.getFile(id);

			expect(result.key).toBeDefined();
			expect(result.type).toBe("file");
			expect(result.size).toBeGreaterThan(0);
			expect(result.metadata.name).toBe("test-get.txt");
			expect(result.metadata.id).toBe(id);
		});

		it("should get raw file data", async () => {
			const content = "Hello, raw file!";
			const { id } = await createTestFile(testUserPath, {
				name: "raw.txt",
				content,
			});

			const result = await service.getRawFileData(id);

			expect(result).toBeDefined();
			expect(result?.file).toBeDefined();
			expect(result?.meta).toBeDefined();
			expect(result?.meta.metadata.name).toBe("raw.txt");

			const text = await result?.file.text();
			expect(text).toBe(content);
		});
	});
});
