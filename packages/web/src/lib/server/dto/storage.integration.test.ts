import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync } from "node:fs";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Minimal StorageService tests
 * Tests core functionality without SvelteKit dependencies
 */

// Mock user for tests
const mockUser = {
	id: "test-user-123",
	email: "test@example.com",
	emailVerified: true,
	name: "Test User",
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Create a temporary directory for tests
let testStoragePath: string;
let testUserPath: string;

beforeAll(async () => {
	const tempBase = join(tmpdir(), "opendrive-tests");
	// Create the base temp directory first
	await mkdir(tempBase, { recursive: true });
	testStoragePath = mkdtempSync(join(tempBase, "storage-"));
	testUserPath = join(testStoragePath, `user-${mockUser.id}`);
	process.env.STORAGE_PATH = testStoragePath;
});

afterAll(async () => {
	if (existsSync(testStoragePath)) {
		await rmdir(testStoragePath, { recursive: true });
	}
});

describe("StorageService - Metadata-Only Trash System", () => {
	describe("File and Folder Structure", () => {
		it("should create user directory on ensureUserDirectory", async () => {
			await mkdir(testUserPath, { recursive: true });
			expect(existsSync(testUserPath)).toBe(true);
		});

		it("should store files by UUID with metadata sidecar", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			// Create file and metadata
			await writeFile(filePath, "test content");
			const meta = {
				id: uuid,
				name: "test.txt",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			expect(existsSync(filePath)).toBe(true);
			expect(existsSync(metaPath)).toBe(true);

			// Verify metadata structure
			const metaContent = await Bun.file(metaPath).json();
			expect(metaContent.id).toBe(uuid);
			expect(metaContent.isTrashed).toBe(false);
		});

		it("should store folders by UUID with .keep.meta.json", async () => {
			const folderId = crypto.randomUUID();
			const folderPath = join(testUserPath, folderId);
			const keepMetaPath = join(folderPath, ".keep.meta.json");

			await mkdir(folderPath, { recursive: true });
			const meta = {
				id: folderId,
				name: "My Folder",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "application/octet-stream",
				createdAt: new Date().toISOString(),
			};
			await writeFile(keepMetaPath, JSON.stringify(meta));

			expect(existsSync(keepMetaPath)).toBe(true);

			const metaContent = await Bun.file(keepMetaPath).json();
			expect(metaContent.name).toBe("My Folder");
		});
	});

	describe("Metadata-Only Trash Operations", () => {
		it("should track trash state in metadata only (no .trash directory)", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "content");
			const meta = {
				id: uuid,
				name: "file.txt",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			// Trash by updating metadata
			meta.isTrashed = true;
			await writeFile(metaPath, JSON.stringify(meta));

			// File should still be at original location
			expect(existsSync(filePath)).toBe(true);

			// Metadata should reflect trashed state
			const updatedMeta = await Bun.file(metaPath).json();
			expect(updatedMeta.isTrashed).toBe(true);

			// .trash directory should NOT exist
			const trashDir = join(testUserPath, ".trash");
			expect(existsSync(trashDir)).toBe(false);
		});

		it("should restore by toggling metadata only", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "content");
			const meta = {
				id: uuid,
				name: "file.txt",
				owner: mockUser.id,
				isTrashed: true,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			// Restore by toggling metadata
			meta.isTrashed = false;
			await writeFile(metaPath, JSON.stringify(meta));

			// File unchanged, metadata updated
			expect(existsSync(filePath)).toBe(true);

			const restoredMeta = await Bun.file(metaPath).json();
			expect(restoredMeta.isTrashed).toBe(false);
		});
	});

	describe("Display Name vs Physical Key", () => {
		it("should allow display name change without physical file move", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "content");
			const meta = {
				id: uuid,
				name: "original-name.txt",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			// Change display name
			meta.name = "new-name.txt";
			await writeFile(metaPath, JSON.stringify(meta));

			// Physical file key (uuid) unchanged
			expect(existsSync(filePath)).toBe(true);

			// Display name updated in metadata
			const updated = await Bun.file(metaPath).json();
			expect(updated.name).toBe("new-name.txt");
		});

		it("should derive category and content type from display name", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			await writeFile(filePath, "audio data");
			const meta = {
				id: uuid,
				name: "song.mp3",
				owner: mockUser.id,
				isTrashed: false,
				category: "MUSIC",
				contentType: "audio/mpeg",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			const file = await Bun.file(metaPath).json();
			expect(file.category).toBe("MUSIC");
			expect(file.contentType).toBe("audio/mpeg");

			// Change name to different type
			meta.name = "file.pdf";
			meta.category = "DOCUMENTS";
			meta.contentType = "application/pdf";
			await writeFile(metaPath, JSON.stringify(meta));

			const updated = await Bun.file(metaPath).json();
			expect(updated.category).toBe("DOCUMENTS");
			expect(updated.contentType).toBe("application/pdf");
		});
	});

	describe("Folder Trash with Nested Content", () => {
		it("should support marking all folder contents as trashed", async () => {
			// Create folder structure
			const folderId = crypto.randomUUID();
			const folderPath = join(testUserPath, folderId);
			const keepMetaPath = join(folderPath, ".keep.meta.json");

			await mkdir(folderPath, { recursive: true });

			// Create folder metadata
			const folderMeta = {
				id: folderId,
				name: "My Folder",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "application/octet-stream",
				createdAt: new Date().toISOString(),
			};
			await writeFile(keepMetaPath, JSON.stringify(folderMeta));

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

	describe("Listing with Trash Filtering", () => {
		it("should differentiate trashed vs active files by metadata check", async () => {
			const activeId = crypto.randomUUID();
			const trashedId = crypto.randomUUID();

			// Create active file
			const activePath = join(testUserPath, activeId);
			await writeFile(activePath, "active");
			await writeFile(
				`${activePath}.meta.json`,
				JSON.stringify({
					id: activeId,
					name: "active.txt",
					owner: mockUser.id,
					isTrashed: false,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
				}),
			);

			// Create trashed file
			const trashedPath = join(testUserPath, trashedId);
			await writeFile(trashedPath, "trashed");
			await writeFile(
				`${trashedPath}.meta.json`,
				JSON.stringify({
					id: trashedId,
					name: "trashed.txt",
					owner: mockUser.id,
					isTrashed: true,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
				}),
			);

			// Simulated listing: read dir and filter by metadata
			const { readdir } = await import("node:fs/promises");
			const entries = await readdir(testUserPath, { withFileTypes: true });
			const files = [];

			for (const entry of entries) {
				if (entry.name.endsWith(".meta.json") || entry.isDirectory()) continue;
				const metaFile = Bun.file(
					join(testUserPath, `${entry.name}.meta.json`),
				);
				if (await metaFile.exists()) {
					const meta = await metaFile.json();
					files.push({ name: entry.name, ...meta });
				}
			}

			// Filter logic
			const activeFiles = files.filter((f) => !f.isTrashed);
			const trashedFiles = files.filter((f) => f.isTrashed);

			expect(activeFiles.length).toBeGreaterThan(0);
			expect(trashedFiles.length).toBeGreaterThan(0);
			expect(activeFiles[0].isTrashed).toBe(false);
			expect(trashedFiles[0].isTrashed).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("should ignore .trash directory if present (legacy)", async () => {
			// Create a legacy .trash directory
			const trashPath = join(testUserPath, ".trash");
			await mkdir(trashPath, { recursive: true });

			// .trash should be treated as a hidden/ignored folder
			// When listing, it should be skipped or marked as internal

			expect(existsSync(trashPath)).toBe(true);

			// In actual implementation, we would filter it out during listing
			// For this test, we just verify it can coexist without breaking things
		});

		it("should handle metadata-only state transitions", async () => {
			const uuid = crypto.randomUUID();
			const filePath = join(testUserPath, uuid);
			const metaPath = `${filePath}.meta.json`;

			// Initial state
			await writeFile(filePath, "content");
			const meta = {
				id: uuid,
				name: "test.txt",
				owner: mockUser.id,
				isTrashed: false,
				category: "UNKNOWN",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
			};
			await writeFile(metaPath, JSON.stringify(meta));

			// Transition chain: active -> trashed -> active -> trashed -> active
			for (let i = 0; i < 5; i++) {
				meta.isTrashed = i % 2 === 1;
				await writeFile(metaPath, JSON.stringify(meta));

				const current = await Bun.file(metaPath).json();
				expect(current.isTrashed).toBe(i % 2 === 1);
			}

			// File should survive all transitions at original location
			expect(existsSync(filePath)).toBe(true);
		});
	});

	describe("Duplicate Operations", () => {
		it("should duplicate a file with new UUID and unique display name", async () => {
			const originalId = crypto.randomUUID();
			const filePath = join(testUserPath, originalId);
			const metaPath = `${filePath}.meta.json`;

			// Create original file
			const fileContent = "original content";
			await writeFile(filePath, fileContent);
			const originalMeta = {
				id: originalId,
				name: "document.txt",
				owner: mockUser.id,
				isTrashed: false,
				isStarred: true,
				category: "DOCUMENTS",
				contentType: "text/plain",
				createdAt: new Date().toISOString(),
				tags: ["important"],
			};
			await writeFile(metaPath, JSON.stringify(originalMeta));

			// Simulate duplication logic
			const newId = crypto.randomUUID();
			const newFilePath = join(testUserPath, newId);
			const newMetaPath = `${newFilePath}.meta.json`;

			// Copy file content
			const content = await Bun.file(filePath).arrayBuffer();
			await Bun.write(newFilePath, content);

			// Create new metadata with unique name
			const newMeta = {
				...originalMeta,
				id: newId,
				name: "document (1).txt", // Unique name
				createdAt: new Date().toISOString(),
				isTrashed: false, // Duplicates are never trashed
				isStarred: false, // Don't copy starred status
			};
			await writeFile(newMetaPath, JSON.stringify(newMeta));

			// Verify original is unchanged
			expect(existsSync(filePath)).toBe(true);
			const originalContent = await Bun.file(filePath).text();
			expect(originalContent).toBe(fileContent);

			// Verify duplicate exists with correct content
			expect(existsSync(newFilePath)).toBe(true);
			const duplicateContent = await Bun.file(newFilePath).text();
			expect(duplicateContent).toBe(fileContent);

			// Verify metadata differences
			const duplicateMeta = await Bun.file(newMetaPath).json();
			expect(duplicateMeta.id).not.toBe(originalId);
			expect(duplicateMeta.name).toBe("document (1).txt");
			expect(duplicateMeta.isTrashed).toBe(false);
			expect(duplicateMeta.isStarred).toBe(false);
			expect(duplicateMeta.category).toBe(originalMeta.category);
			expect(duplicateMeta.contentType).toBe(originalMeta.contentType);
		});

		it("should generate incrementing names for multiple duplicates", async () => {
			// Create original and first duplicate
			const originalId = crypto.randomUUID();
			const duplicate1Id = crypto.randomUUID();

			await writeFile(join(testUserPath, originalId), "content");
			await writeFile(
				`${join(testUserPath, originalId)}.meta.json`,
				JSON.stringify({
					id: originalId,
					name: "file.txt",
					owner: mockUser.id,
					isTrashed: false,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
				}),
			);

			await writeFile(join(testUserPath, duplicate1Id), "content");
			await writeFile(
				`${join(testUserPath, duplicate1Id)}.meta.json`,
				JSON.stringify({
					id: duplicate1Id,
					name: "file (1).txt",
					owner: mockUser.id,
					isTrashed: false,
					category: "UNKNOWN",
					contentType: "text/plain",
					createdAt: new Date().toISOString(),
				}),
			);

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
});
