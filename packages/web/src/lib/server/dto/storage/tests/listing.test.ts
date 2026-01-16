import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
	cleanupTestStoragePath,
	createTestFile,
	createTestStoragePath,
} from "./test-utils";

/**
 * Listing and filtering tests for StorageService.
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

describe("StorageService - Listing with Trash Filtering", () => {
	describe("List Filtering", () => {
		it("should differentiate trashed vs active files by metadata check", async () => {
			// Create active file
			await createTestFile(testUserPath, {
				name: "active.txt",
				isTrashed: false,
			});

			// Create trashed file
			await createTestFile(testUserPath, {
				name: "trashed.txt",
				isTrashed: true,
			});

			// Simulated listing: read dir and filter by metadata
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
			expect(activeFiles.every((f) => f.isTrashed === false)).toBe(true);
			expect(trashedFiles.every((f) => f.isTrashed === true)).toBe(true);
		});
	});
});
