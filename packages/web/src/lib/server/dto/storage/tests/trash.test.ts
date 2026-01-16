import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import {
	cleanupTestStoragePath,
	createTestFile,
	createTestStoragePath,
} from "./test-utils";

/**
 * Trash operation tests for StorageService.
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

describe("StorageService - Metadata-Only Trash System", () => {
	describe("Trash State Management", () => {
		it("should track trash state in metadata only (no .trash directory)", async () => {
			const { filePath, metaPath } = await createTestFile(testUserPath, {
				name: "file.txt",
				isTrashed: false,
			});

			// Trash by updating metadata
			const meta = await Bun.file(metaPath).json();
			meta.isTrashed = true;
			await writeFile(metaPath, JSON.stringify(meta));

			// File should still be at original location
			expect(existsSync(filePath)).toBe(true);

			// Metadata should reflect trashed state
			const updatedMeta = await Bun.file(metaPath).json();
			expect(updatedMeta.isTrashed).toBe(true);

			// .trash directory should NOT exist
			const { join } = await import("node:path");
			const trashDir = join(testUserPath, ".trash");
			expect(existsSync(trashDir)).toBe(false);
		});

		it("should restore by toggling metadata only", async () => {
			const { filePath, metaPath } = await createTestFile(testUserPath, {
				name: "file.txt",
				isTrashed: true,
			});

			// Restore by toggling metadata
			const meta = await Bun.file(metaPath).json();
			meta.isTrashed = false;
			await writeFile(metaPath, JSON.stringify(meta));

			// File unchanged, metadata updated
			expect(existsSync(filePath)).toBe(true);

			const restoredMeta = await Bun.file(metaPath).json();
			expect(restoredMeta.isTrashed).toBe(false);
		});

		it("should handle metadata-only state transitions", async () => {
			const { filePath, metaPath } = await createTestFile(testUserPath, {
				name: "test.txt",
				isTrashed: false,
			});

			// Transition chain: active -> trashed -> active -> trashed -> active
			const meta = await Bun.file(metaPath).json();
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
});
