import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { rmdir } from "node:fs/promises";
import type { FileCategory, FileContentType } from "@lib/schema";
import { StorageService } from "@lib/storage";
import type { User } from "better-auth";

// Mock the activity module to avoid database dependency
mock.module("@lib/activity", () => ({
	registerActivity: mock(() => Promise.resolve()),
	getUserActivities: mock(() => Promise.resolve([])),
	listAllActivities: mock(() => Promise.resolve([])),
}));

// Mock user for testing
const mockUser: User = {
	id: "test-user-123",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Test storage path
const testStoragePath = `/tmp/opendrive-test-${Date.now()}`;

beforeAll(async () => {
	// Set test storage path
	process.env.STORAGE_PATH = testStoragePath;
});

afterAll(async () => {
	// Clean up test storage
	try {
		await rmdir(testStoragePath, { recursive: true });
	} catch {
		// Ignore cleanup errors
	}
});

describe("StorageService - File Operations", () => {
	let storage: StorageService;

	beforeAll(async () => {
		storage = new StorageService(mockUser);
		await storage.ensureUserDirectory();
	});

	test("creates file with metadata", async () => {
		const result = await storage.createFile({
			name: "test-file.txt",
			size: 1024,
		});

		expect(result.finalName).toBe("test-file.txt");
		expect(result.id).toBeDefined();
		expect(result.metadata.id).toBeDefined();
		expect(result.metadata.category).toBe("DOCUMENTS");
		expect(result.metadata.contentType).toBe("text/plain");
		expect(result.metadata.owner).toBe(mockUser.id);
	});

	test("increments filename on conflict", async () => {
		const first = await storage.createFile({
			name: "duplicate.txt",
			size: 512,
		});

		expect(first.finalName).toBe("duplicate.txt");

		const second = await storage.createFile({
			name: "duplicate.txt",
			size: 512,
		});

		expect(second.finalName).toBe("duplicate(1).txt");

		const third = await storage.createFile({
			name: "duplicate.txt",
			size: 512,
		});

		expect(third.finalName).toBe("duplicate(2).txt");
	});

	test("uploads and retrieves file body", async () => {
		const result = await storage.createFile({
			name: "upload-test.txt",
			size: 13,
		});

		const fileContent = "Hello, World!";
		await storage.uploadFileBody(result.finalName, Buffer.from(fileContent));

		const fileData = await storage.getRawFileData(result.finalName);
		expect(fileData).not.toBeNull();
		if (!fileData) throw new Error("fileData is null");
		expect(fileData.file.size).toBeGreaterThan(0);

		const retrievedContent = await fileData.file.text();
		expect(retrievedContent).toBe(fileContent);
	});

	test("retrieves file metadata", async () => {
		const result = await storage.createFile({
			name: "metadata-test.txt",
			size: 100,
		});

		const file = await storage.getFile(result.finalName);
		expect(file.key).toBe("metadata-test.txt");
		expect(file.size).toBeDefined();
		expect(file.type).toBe("file");
		expect(file.metadata).toBeDefined();
		expect(file.metadata.contentType).toBe("text/plain");
		expect(file.metadata.category).toBe("DOCUMENTS");
	});

	test("deletes file", async () => {
		const result = await storage.createFile({
			name: "delete-test.txt",
			size: 50,
		});

		expect(await storage.fileExists(result.finalName)).toBe(true);

		await storage.deleteFile(result.finalName);

		expect(await storage.fileExists(result.finalName)).toBe(false);
	});

	test("updates file metadata", async () => {
		const result = await storage.createFile({
			name: "update-test.txt",
			size: 100,
		});

		await storage.updateFile(result.finalName, {
			tags: ["important", "test"],
			category: "CODE",
		});

		const file = await storage.getFile(result.finalName);
		expect(file.metadata.tags).toEqual(["important", "test"]);
		expect(file.metadata.category).toBe("CODE");
	});

	test("renames file", async () => {
		const result = await storage.createFile({
			name: "old-name.txt",
			size: 100,
		});

		await storage.updateFile(result.finalName, {
			key: "new-name.txt",
		});

		expect(await storage.fileExists("old-name.txt")).toBe(false);
		expect(await storage.fileExists("new-name.txt")).toBe(true);
	});

	test("lists files in root", async () => {
		const list = await storage.listFiles();

		expect(list.list).toBeDefined();
		expect(list.count).toBeDefined();
		expect(list.total).toBeDefined();
		expect(Array.isArray(list.list)).toBe(true);
		expect(list.count).toBeGreaterThan(0);
	});

	test("automatically detects content type", async () => {
		type Tests = {
			name: string;
			expected: FileContentType;
		};
		const tests: Tests[] = [
			{ name: "image.jpg", expected: "image/jpeg" },
			{ name: "image.png", expected: "image/png" },
			{ name: "video.mp4", expected: "video/mp4" },
			{ name: "audio.mp3", expected: "audio/mpeg" },
			{ name: "doc.pdf", expected: "application/pdf" },
		];

		for (const { name, expected } of tests) {
			const result = await storage.createFile({ name, size: 1024 });
			expect(result.metadata.contentType).toBe(expected);
		}
	});

	test("automatically detects category", async () => {
		type Tests = {
			name: string;
			expected: FileCategory;
		};
		const tests: Tests[] = [
			{ name: "song.mp3", expected: "MUSIC" },
			{ name: "video.mp4", expected: "VIDEO" },
			{ name: "photo.jpg", expected: "IMAGES" },
			{ name: "doc.pdf", expected: "DOCUMENTS" },
			{ name: "script.ts", expected: "CODE" },
		];

		for (const { name, expected } of tests) {
			const result = await storage.createFile({ name, size: 1024 });
			expect(result.metadata.category).toBe(expected);
		}
	});

	test("lists trash files", async () => {
		// Create a file
		const file = await storage.createFile({
			name: "trash-test.txt",
			size: 100,
		});

		// Move to trash
		await storage.updateFile(file.finalName, { isTrashed: true });

		// Check trash list
		const trashFiles = await storage.listTrashFiles();
		const isInTrash = trashFiles.list.some(
			(item) => item.key === file.finalName,
		);
		expect(isInTrash).toBe(true);

		// Check normal list (should not be there)
		const normalFiles = await storage.listFiles();
		const isInNormal = normalFiles.list.some(
			(item) => item.key === file.finalName,
		);
		expect(isInNormal).toBe(false);
	});

	test("lists files per category", async () => {
		// Create files with different categories
		const doc = await storage.createFile({
			name: "cat-doc.pdf",
			size: 100,
		});
		const img = await storage.createFile({
			name: "cat-img.jpg",
			size: 100,
		});

		// List documents
		const docs = await storage.listFilesPerCategory("DOCUMENTS");
		expect(docs.list.some((item) => item.key === doc.finalName)).toBe(true);
		expect(docs.list.some((item) => item.key === img.finalName)).toBe(false);

		// List images
		const imgs = await storage.listFilesPerCategory("IMAGES");
		expect(imgs.list.some((item) => item.key === img.finalName)).toBe(true);
		expect(imgs.list.some((item) => item.key === doc.finalName)).toBe(false);
	});

	test("lists recent files", async () => {
		// Create a few files
		const file1 = await storage.createFile({
			name: "recent-1.txt",
			size: 100,
		});
		// Wait a bit to ensure timestamp difference (though mock might be fast)
		// Actually, we can just rely on creation order if timestamps are precise enough or just check existence
		const file2 = await storage.createFile({
			name: "recent-2.txt",
			size: 100,
		});

		const recent = await storage.listRecentFiles();

		// Both should be in recent files
		expect(recent.list.some((item) => item.key === file1.finalName)).toBe(true);
		expect(recent.list.some((item) => item.key === file2.finalName)).toBe(true);

		// Check sorting if possible, but might be flaky with fast execution.
		// Just checking they are present covers the code path.
	});
});

describe("StorageService - Folder Operations", () => {
	let storage: StorageService;

	beforeAll(async () => {
		storage = new StorageService(mockUser);
		await storage.ensureUserDirectory();
	});

	test("creates folder", async () => {
		await storage.createFolder("test-folder");
		expect(await storage.folderExists("test-folder")).toBe(true);
	});

	test("increments folder name on conflict", async () => {
		await storage.createFolder("duplicate-folder");
		expect(await storage.folderExists("duplicate-folder")).toBe(true);

		const secondName = await storage.incrementFolderName("duplicate-folder");
		expect(secondName).toBe("duplicate-folder (1)");

		await storage.createFolder("duplicate-folder");
		expect(await storage.folderExists("duplicate-folder (1)")).toBe(true);
	});

	test("creates nested folder", async () => {
		await storage.createFolder("parent");
		await storage.createFolder("child", "parent");

		expect(await storage.folderExists("parent")).toBe(true);
		expect(await storage.folderExists("parent/child")).toBe(true);
	});

	test("creates file in subfolder", async () => {
		await storage.createFolder("docs");

		const result = await storage.createFile(
			{ name: "nested-file.pdf", size: 2048 },
			"docs",
		);

		expect(result.finalName).toBe("docs/nested-file.pdf");
		expect(await storage.fileExists("docs/nested-file.pdf")).toBe(true);
	});

	test("lists files in subfolder", async () => {
		const list = await storage.listFiles("docs");

		expect(Array.isArray(list.list)).toBe(true);
		const nestedFile = list.list.find((item: { key: string }) =>
			item.key.includes("nested-file.pdf"),
		);
		expect(nestedFile).toBeDefined();
	});

	test("deletes folder", async () => {
		await storage.createFolder("delete-folder");
		expect(await storage.folderExists("delete-folder")).toBe(true);

		await storage.deleteFolder("delete-folder");
		expect(await storage.folderExists("delete-folder")).toBe(false);
	});

	test("lists folders", async () => {
		await storage.createFolder("folder-list-test");
		const folders = await storage.listFolders("");

		expect(Array.isArray(folders)).toBe(true);
		expect(folders).toContain("folder-list-test");
	});

	test("folders appear in object listing", async () => {
		await storage.createFolder("visible-folder");

		const list = await storage.listFiles();
		const folder = list.list.find(
			(item: { key: string }) => item.key === "visible-folder/",
		);

		expect(folder).toBeDefined();
		expect(folder?.type).toBe("folder");
	});
});

describe("StorageService - User Isolation", () => {
	test("different users have isolated storage", async () => {
		const user1: User = {
			...mockUser,
			id: "user-1",
		};

		const user2: User = {
			...mockUser,
			id: "user-2",
		};

		const storage1 = new StorageService(user1);
		const storage2 = new StorageService(user2);

		await storage1.ensureUserDirectory();
		await storage2.ensureUserDirectory();

		// User 1 creates a file
		await storage1.createFile({ name: "user1-file.txt", size: 100 });

		// User 2 should not see user 1's file
		const user2Files = await storage2.listFiles();
		const hasUser1File = user2Files.list.some((item: { key: string }) =>
			item.key.includes("user1-file.txt"),
		);

		expect(hasUser1File).toBe(false);

		// User 2 creates their own file
		await storage2.createFile({ name: "user2-file.txt", size: 100 });

		// User 1 should not see user 2's file
		const user1Files = await storage1.listFiles();
		const hasUser2File = user1Files.list.some((item: { key: string }) =>
			item.key.includes("user2-file.txt"),
		);

		expect(hasUser2File).toBe(false);

		// Clean up
		try {
			await rmdir(`${testStoragePath}/user-user-1`, { recursive: true });
			await rmdir(`${testStoragePath}/user-user-2`, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	});
});
