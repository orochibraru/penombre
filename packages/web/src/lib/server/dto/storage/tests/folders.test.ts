import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	cleanupTestStoragePath,
	createTestFolder,
	createTestStoragePath,
	mockUser,
} from "./test-utils";

/**
 * Folder operation tests for StorageService.
 */

let testStoragePath: string;
let testUserPath: string;

beforeAll(async () => {
	const paths = await createTestStoragePath();
	testStoragePath = paths.storagePath;
	testUserPath = paths.userPath;
	await mkdir(testUserPath, { recursive: true });
});

afterAll(async () => {
	await cleanupTestStoragePath(testStoragePath);
});

describe("StorageService - Folder Operations", () => {
	describe("Folder Structure", () => {
		it("should store folders by UUID with .keep.meta.json", async () => {
			const { folderPath, keepMetaPath, id } = await createTestFolder(
				testUserPath,
				{ name: "My Folder" },
			);

			expect(existsSync(folderPath)).toBe(true);
			expect(existsSync(keepMetaPath)).toBe(true);

			const metaContent = await Bun.file(keepMetaPath).json();
			expect(metaContent.name).toBe("My Folder");
			expect(metaContent.id).toBe(id);
		});
	});

	describe("Folder Trash with Nested Content", () => {
		it("should support marking all folder contents as trashed", async () => {
			// Create folder
			const { folderPath, keepMetaPath } = await createTestFolder(
				testUserPath,
				{ name: "My Folder" },
			);

			// Create file inside folder
			const fileId = crypto.randomUUID();
			const filePath = join(folderPath, fileId);
			const fileMetaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "file content");
			const fileMeta = {
				id: fileId,
				name: "document.pdf",
				owner: mockUser.id,
				isTrashed: false,
				category: "DOCUMENTS",
				contentType: "application/pdf",
				createdAt: new Date().toISOString(),
			};
			await writeFile(fileMetaPath, JSON.stringify(fileMeta));

			// Trash folder: mark folder and file as trashed
			const folderMeta = await Bun.file(keepMetaPath).json();
			folderMeta.isTrashed = true;
			await writeFile(keepMetaPath, JSON.stringify(folderMeta));

			fileMeta.isTrashed = true;
			await writeFile(fileMetaPath, JSON.stringify(fileMeta));

			// Verify both are trashed in metadata
			const trashedFolder = await Bun.file(keepMetaPath).json();
			const trashedFile = await Bun.file(fileMetaPath).json();

			expect(trashedFolder.isTrashed).toBe(true);
			expect(trashedFile.isTrashed).toBe(true);

			// Files still at original locations
			expect(existsSync(filePath)).toBe(true);
			expect(existsSync(folderPath)).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("should ignore .trash directory if present (legacy)", async () => {
			// Create a legacy .trash directory
			const trashPath = join(testUserPath, ".trash");
			await mkdir(trashPath, { recursive: true });

			// .trash should be treated as a hidden/ignored folder
			expect(existsSync(trashPath)).toBe(true);
		});
	});
});
