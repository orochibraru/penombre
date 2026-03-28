import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	mock,
	test,
} from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb } from "$lib/server/db";

// ---------------------------------------------------------------------------
// Mock constants (static values are fine — storage path is injected via parameter)
// ---------------------------------------------------------------------------

mock.module("./constants", () => ({
	DEFAULT_STORAGE_PATH: "/does-not-exist",
	createUserStorageDriver: () => ({}),
	logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} },
}));

// ---------------------------------------------------------------------------
// DB mock — use the shared mock from test.setup.ts (same pattern as service.test.ts)
// ---------------------------------------------------------------------------

const rawDb = getDb() as Record<string, unknown>;
const mockDbInsert = rawDb.insert as Mock<() => unknown>;
const mockDbSelect = rawDb.select as Mock<() => unknown>;

/**
 * Stub `db.select().from().where()` to resolve to `rows`.
 * Used to return the list of existing user IDs in migrateStorageMeta.
 */
function mockNextSelect(rows: unknown[]) {
	const where = mock(() => Promise.resolve(rows));
	const from = mock(() => ({ where }));
	mockDbSelect.mockReturnValueOnce({ from } as never);
}

/**
 * Set up the next db.insert() call to use a captured `values` spy and
 * return `result` when `.values().onConflictDoNothing().returning()` is awaited.
 * Returns the `values` spy so tests can inspect what was passed to it.
 */
function mockNextInsert(result: unknown[] = []) {
	const returning = mock(() => Promise.resolve(result));
	const onConflictDoNothing = mock(() => ({ returning }));
	const values = mock((..._args: unknown[]) => ({ onConflictDoNothing }));
	mockDbInsert.mockReturnValueOnce({ values } as never);
	return { values, onConflictDoNothing, returning };
}

// ---------------------------------------------------------------------------
// Dynamic import AFTER mocks
// ---------------------------------------------------------------------------

const { migrateStorageMeta } = await import("./migrate-meta");

// ---------------------------------------------------------------------------
// Test filesystem helpers
// ---------------------------------------------------------------------------

async function writeMeta(path: string, meta: object) {
	await writeFile(path, JSON.stringify(meta), "utf8");
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "penombre-migrate-test-"));
	mockDbInsert.mockClear();
	mockDbSelect.mockClear();
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

/** Returns the number of times db.insert() was called. */
function insertCount() {
	return mockDbInsert.mock.calls.length;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("migrateStorageMeta — no storage", () => {
	test("returns early when storage path does not exist", async () => {
		await expect(
			migrateStorageMeta("/tmp/this-path-definitely-does-not-exist-xyz"),
		).resolves.toBeUndefined();
		expect(mockDbInsert).not.toHaveBeenCalled();
	});

	test("returns early when there are no user directories", async () => {
		// storagePath exists but has no user-* subdirs
		await migrateStorageMeta(tmpDir);
		expect(mockDbInsert).not.toHaveBeenCalled();
	});
});

describe("migrateStorageMeta — files", () => {
	test("inserts a root-level file with meta", async () => {
		const userDir = join(tmpDir, "user-abc");
		await mkdir(userDir, { recursive: true });

		await writeMeta(join(userDir, "file-uuid.meta.json"), {
			id: "file-id-1",
			name: "document.pdf",
			contentType: "application/pdf",
			category: "DOCUMENTS",
			isTrashed: false,
			isStarred: false,
			tags: [],
		});
		await writeFile(join(userDir, "file-uuid"), "content");

		mockNextSelect([{ id: "abc" }]);
		const { values } = mockNextInsert([{ id: "file-id-1" }]);

		await migrateStorageMeta(tmpDir);
		expect(insertCount()).toBeGreaterThanOrEqual(1);

		const fileRow = values.mock.calls[0]?.[0] as
			| Record<string, unknown>
			| undefined;
		expect(fileRow).toBeDefined();
		expect(fileRow?.id).toBe("file-id-1");
		expect(fileRow?.name).toBe("document.pdf");
		expect(fileRow?.ownerId).toBe("abc");
	});

	test("skips meta files with no id", async () => {
		const userDir = join(tmpDir, "user-xyz");
		await mkdir(userDir, { recursive: true });

		await writeMeta(join(userDir, "bad.meta.json"), { name: "no-id.txt" });

		mockNextSelect([{ id: "xyz" }]);
		await migrateStorageMeta(tmpDir);
		expect(insertCount()).toBe(0);
	});

	test("skips .keep.meta.json files in user root", async () => {
		const userDir = join(tmpDir, "user-xyz");
		await mkdir(userDir, { recursive: true });

		await writeMeta(join(userDir, ".keep.meta.json"), {
			id: "should-be-ignored",
		});

		mockNextSelect([{ id: "xyz" }]);
		await migrateStorageMeta(tmpDir);
		expect(insertCount()).toBe(0);
	});
});

describe("migrateStorageMeta — folders", () => {
	test("inserts a folder that has a .keep.meta.json", async () => {
		const userDir = join(tmpDir, "user-u1");
		const folderDir = join(userDir, "folder-uuid-1");
		await mkdir(folderDir, { recursive: true });

		await writeMeta(join(folderDir, ".keep.meta.json"), {
			id: "folder-id-1",
			name: "My Documents",
			isTrashed: false,
			isStarred: true,
			tags: ["work"],
		});

		mockNextSelect([{ id: "u1" }]);
		const { values } = mockNextInsert([{ id: "folder-id-1" }]);

		await migrateStorageMeta(tmpDir);

		const folderRow = values.mock.calls[0]?.[0] as
			| Record<string, unknown>
			| undefined;
		expect(folderRow).toBeDefined();
		expect(folderRow?.id).toBe("folder-id-1");
		expect(folderRow?.name).toBe("My Documents");
		expect(folderRow?.ownerId).toBe("u1");
		expect(folderRow?.parentId).toBeNull();
		expect(folderRow?.isStarred).toBe(true);
	});

	test("uses directory name as id/name when .keep.meta.json is absent", async () => {
		const userDir = join(tmpDir, "user-u2");
		const folderDir = join(userDir, "my-dir");
		await mkdir(folderDir, { recursive: true });

		mockNextSelect([{ id: "u2" }]);
		const { values } = mockNextInsert([{ id: "my-dir" }]);

		await migrateStorageMeta(tmpDir);

		const folderRow = values.mock.calls[0]?.[0] as
			| Record<string, unknown>
			| undefined;
		expect(folderRow).toBeDefined();
		expect(folderRow?.id).toBe("my-dir");
		expect(folderRow?.name).toBe("my-dir");
	});

	test("resolves parentId for nested folders", async () => {
		const userDir = join(tmpDir, "user-u3");
		const parentDir = join(userDir, "parent-uuid");
		const childDir = join(parentDir, "child-uuid");
		await mkdir(childDir, { recursive: true });

		await writeMeta(join(parentDir, ".keep.meta.json"), {
			id: "parent-id",
			name: "Parent",
		});
		await writeMeta(join(childDir, ".keep.meta.json"), {
			id: "child-id",
			name: "Child",
		});

		mockNextSelect([{ id: "u3" }]);
		mockNextInsert([{ id: "parent-id" }]);
		const childSetup = mockNextInsert([{ id: "child-id" }]);

		await migrateStorageMeta(tmpDir);

		const childRow = childSetup.values.mock.calls[0]?.[0] as
			| { parentId: string | null }
			| undefined;
		expect(childRow?.parentId).toBe("parent-id");
	});

	test("ignores .thumbnails directories", async () => {
		const userDir = join(tmpDir, "user-u4");
		const thumbDir = join(userDir, ".thumbnails");
		await mkdir(thumbDir, { recursive: true });

		mockNextSelect([{ id: "u4" }]);
		await migrateStorageMeta(tmpDir);
		expect(insertCount()).toBe(0);
	});
});

describe("migrateStorageMeta — idempotency", () => {
	test("does not increment counter when row already exists (conflict)", async () => {
		const userDir = join(tmpDir, "user-idem");
		await mkdir(userDir, { recursive: true });

		await writeMeta(join(userDir, "f.meta.json"), {
			id: "existing-id",
			name: "existing.txt",
		});
		await writeFile(join(userDir, "f"), "x");

		// Simulate conflict: returning returns []
		mockNextSelect([{ id: "idem" }]);
		mockNextInsert([]);

		await migrateStorageMeta(tmpDir);

		// insert was still called (we attempt upsert), but outcome is 0 real inserts
		expect(insertCount()).toBeGreaterThanOrEqual(1);
	});
});
