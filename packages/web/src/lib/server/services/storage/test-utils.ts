import { mkdtempSync } from "node:fs";
import { mkdir, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Shared test utilities for storage integration tests.
 */

// Mock user for tests
export const mockUser = {
	id: "test-user-123",
	email: "test@example.com",
	emailVerified: true,
	name: "Test User",
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

/**
 * Creates a temporary storage path for tests.
 */
export async function createTestStoragePath(): Promise<{
	storagePath: string;
	userPath: string;
}> {
	const tempBase = join(tmpdir(), "opendrive-tests");
	await mkdir(tempBase, { recursive: true });
	const storagePath = mkdtempSync(join(tempBase, "storage-"));
	const userPath = join(storagePath, `user-${mockUser.id}`);
	process.env.STORAGE_PATH = storagePath;
	return { storagePath, userPath };
}

/**
 * Cleans up temporary storage path.
 */
export async function cleanupTestStoragePath(
	storagePath: string,
): Promise<void> {
	const { existsSync } = await import("node:fs");
	if (existsSync(storagePath)) {
		await rmdir(storagePath, { recursive: true });
	}
}

/**
 * Creates a test file with metadata.
 */
export async function createTestFile(
	userPath: string,
	options: {
		id?: string;
		name?: string;
		content?: string;
		isTrashed?: boolean;
		isStarred?: boolean;
		category?: string;
		contentType?: string;
	} = {},
): Promise<{ id: string; filePath: string; metaPath: string }> {
	const { writeFile: fsWriteFile } = await import("node:fs/promises");

	const id = options.id || crypto.randomUUID();
	const filePath = join(userPath, id);
	const metaPath = `${filePath}.meta.json`;

	await fsWriteFile(filePath, options.content || "test content");

	const meta = {
		id,
		name: options.name || "test.txt",
		owner: mockUser.id,
		isTrashed: options.isTrashed ?? false,
		isStarred: options.isStarred ?? false,
		category: options.category || "UNKNOWN",
		contentType: options.contentType || "text/plain",
		createdAt: new Date().toISOString(),
	};

	await fsWriteFile(metaPath, JSON.stringify(meta));

	return { id, filePath, metaPath };
}

/**
 * Creates a test folder with metadata.
 */
export async function createTestFolder(
	userPath: string,
	options: {
		id?: string;
		name?: string;
		isTrashed?: boolean;
	} = {},
): Promise<{ id: string; folderPath: string; keepMetaPath: string }> {
	const { mkdir: fsMkdir, writeFile: fsWriteFile } = await import(
		"node:fs/promises"
	);

	const id = options.id || crypto.randomUUID();
	const folderPath = join(userPath, id);
	const keepMetaPath = join(folderPath, ".keep.meta.json");

	await fsMkdir(folderPath, { recursive: true });

	const meta = {
		id,
		name: options.name || "Test Folder",
		owner: mockUser.id,
		isTrashed: options.isTrashed ?? false,
		category: "UNKNOWN",
		contentType: "application/octet-stream",
		createdAt: new Date().toISOString(),
	};

	await fsWriteFile(keepMetaPath, JSON.stringify(meta));

	return { id, folderPath, keepMetaPath };
}
