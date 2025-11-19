import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { mkdir, rmdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { cleanupDeletedUserStorage } from "@lib/storage";
import { MockDrizzle } from "../mocks/db";

// Mock logger
const mockLogger = {
	info: mock(),
	error: mock(),
};
mock.module("@lib/logger", () => ({
	logger: mockLogger,
}));

describe("Storage Cleanup", () => {
	const testStoragePath = `tmp/opendrive-cleanup-test-${Date.now()}`;
	const mockDb = new MockDrizzle();

	beforeEach(async () => {
		process.env.STORAGE_PATH = testStoragePath;
		await mkdir(testStoragePath, { recursive: true });
		mockDb.reset();
		global.db = mockDb.getDb();
	});

	afterEach(async () => {
		try {
			await rmdir(testStoragePath, { recursive: true });
		} catch {}
	});

	it("should delete storage for users that do not exist in DB", async () => {
		// Mock global db
		mockDb.setResolvedValue([{ id: "user-1" }, { id: "user-2" }]);

		// Create folders
		await mkdir(join(testStoragePath, "user-user-1"), { recursive: true }); // Exists in DB
		await mkdir(join(testStoragePath, "user-user-2"), { recursive: true }); // Exists in DB
		await mkdir(join(testStoragePath, "user-deleted-user"), {
			recursive: true,
		}); // Should be deleted
		await mkdir(join(testStoragePath, "other-folder"), { recursive: true }); // Should be ignored

		await cleanupDeletedUserStorage();

		// Check if folders exist
		const checkExists = async (path: string) => {
			try {
				await stat(path);
				return true;
			} catch {
				return false;
			}
		};

		expect(await checkExists(join(testStoragePath, "user-user-1"))).toBe(true);
		expect(await checkExists(join(testStoragePath, "user-user-2"))).toBe(true);
		expect(await checkExists(join(testStoragePath, "user-deleted-user"))).toBe(
			false,
		);
		expect(await checkExists(join(testStoragePath, "other-folder"))).toBe(true);

		expect(mockLogger.info).toHaveBeenCalledWith(
			expect.stringContaining(
				"Deleted storage for non-existent user ID: deleted-user",
			),
		);
	});

	it("should do nothing if no users in DB", async () => {
		mockDb.setResolvedValue([]);

		await cleanupDeletedUserStorage();
		expect(mockLogger.info).toHaveBeenCalledWith(
			"No users found in database. Skipping storage cleanup.",
		);
	});
});
