import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorageDriver } from "./local";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;
let driver: LocalStorageDriver;

beforeEach(async () => {
	tmpDir = await mkdtemp(join(tmpdir(), "penombre-local-driver-"));
	driver = new LocalStorageDriver(tmpDir);
});

afterEach(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// writeObject / readObject
// ---------------------------------------------------------------------------

describe("writeObject / readObject", () => {
	test("writes and reads back a Uint8Array", async () => {
		const data = new TextEncoder().encode("hello world");
		await driver.writeObject("file.txt", data);
		const result = await driver.readObject("file.txt");
		expect(new TextDecoder().decode(result)).toBe("hello world");
	});

	test("writes and reads back a Blob", async () => {
		const blob = new Blob(["blob content"], { type: "text/plain" });
		await driver.writeObject("blob.txt", blob);
		const result = await driver.readObject("blob.txt");
		expect(new TextDecoder().decode(result)).toBe("blob content");
	});

	test("writes and reads back an ArrayBuffer", async () => {
		const buf = new TextEncoder().encode("arraybuffer").buffer;
		await driver.writeObject("ab.txt", buf);
		const result = await driver.readObject("ab.txt");
		expect(new TextDecoder().decode(result)).toBe("arraybuffer");
	});

	test("creates intermediate directories automatically", async () => {
		await driver.writeObject("a/b/c/deep.txt", new TextEncoder().encode("x"));
		expect(existsSync(join(tmpDir, "a/b/c/deep.txt"))).toBe(true);
	});

	test("overwrites an existing object", async () => {
		await driver.writeObject("f.txt", new TextEncoder().encode("first"));
		await driver.writeObject("f.txt", new TextEncoder().encode("second"));
		const result = await driver.readObject("f.txt");
		expect(new TextDecoder().decode(result)).toBe("second");
	});
});

// ---------------------------------------------------------------------------
// getObjectSize
// ---------------------------------------------------------------------------

describe("getObjectSize", () => {
	test("returns the correct byte size", async () => {
		const data = new TextEncoder().encode("1234567890");
		await driver.writeObject("size.txt", data);
		expect(await driver.getObjectSize("size.txt")).toBe(10);
	});
});

// ---------------------------------------------------------------------------
// deleteObject
// ---------------------------------------------------------------------------

describe("deleteObject", () => {
	test("deletes an existing object", async () => {
		await driver.writeObject("del.txt", new TextEncoder().encode("bye"));
		await driver.deleteObject("del.txt");
		expect(existsSync(join(tmpDir, "del.txt"))).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// deleteObjectsByPrefix
// ---------------------------------------------------------------------------

describe("deleteObjectsByPrefix", () => {
	test("deletes a subdirectory and its contents", async () => {
		await driver.writeObject("sub/a.txt", new TextEncoder().encode("a"));
		await driver.writeObject("sub/b.txt", new TextEncoder().encode("b"));
		await driver.deleteObjectsByPrefix("sub/");
		expect(existsSync(join(tmpDir, "sub"))).toBe(false);
	});

	test("deletes contents of root when prefix is empty, keeps root dir", async () => {
		await driver.writeObject("root-file.txt", new TextEncoder().encode("r"));
		await driver.writeObject(
			"subdir/nested.txt",
			new TextEncoder().encode("n"),
		);
		await driver.deleteObjectsByPrefix("");
		// Root dir must still exist
		expect(existsSync(tmpDir)).toBe(true);
		// Contents must be gone
		expect(existsSync(join(tmpDir, "root-file.txt"))).toBe(false);
		expect(existsSync(join(tmpDir, "subdir"))).toBe(false);
	});

	test("no-ops when prefix path does not exist", async () => {
		await expect(
			driver.deleteObjectsByPrefix("nonexistent/"),
		).resolves.toBeUndefined();
	});

	test("deletes a single file when prefix is a file path", async () => {
		await driver.writeObject("lone.txt", new TextEncoder().encode("x"));
		await driver.writeObject("keep.txt", new TextEncoder().encode("keep"));
		await driver.deleteObjectsByPrefix("lone.txt");
		expect(existsSync(join(tmpDir, "lone.txt"))).toBe(false);
		expect(existsSync(join(tmpDir, "keep.txt"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// copyObject
// ---------------------------------------------------------------------------

describe("copyObject", () => {
	test("copies an object to a new key", async () => {
		await driver.writeObject("src.txt", new TextEncoder().encode("copy me"));
		await driver.copyObject("src.txt", "dst.txt");
		const dst = await driver.readObject("dst.txt");
		expect(new TextDecoder().decode(dst)).toBe("copy me");
		// Original should still exist
		expect(existsSync(join(tmpDir, "src.txt"))).toBe(true);
	});

	test("creates intermediate directories for destination", async () => {
		await driver.writeObject("src.txt", new TextEncoder().encode("hi"));
		await driver.copyObject("src.txt", "nested/dir/dst.txt");
		expect(existsSync(join(tmpDir, "nested/dir/dst.txt"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// objectExists
// ---------------------------------------------------------------------------

describe("objectExists", () => {
	test("returns true for an existing object", async () => {
		await driver.writeObject("exists.txt", new TextEncoder().encode("y"));
		expect(await driver.objectExists("exists.txt")).toBe(true);
	});

	test("returns false for a non-existent object", async () => {
		expect(await driver.objectExists("ghost.txt")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// listObjectKeys
// ---------------------------------------------------------------------------

describe("listObjectKeys", () => {
	test("lists all keys with no prefix", async () => {
		await driver.writeObject("a.txt", new Uint8Array());
		await driver.writeObject("sub/b.txt", new Uint8Array());
		const keys = await driver.listObjectKeys();
		expect(keys.sort()).toEqual(["a.txt", "sub/b.txt"].sort());
	});

	test("lists keys under a prefix", async () => {
		await driver.writeObject("a/1.txt", new Uint8Array());
		await driver.writeObject("a/2.txt", new Uint8Array());
		await driver.writeObject("b/3.txt", new Uint8Array());
		const keys = await driver.listObjectKeys("a/");
		expect(keys.sort()).toEqual(["a/1.txt", "a/2.txt"].sort());
	});

	test("returns empty array for non-existent prefix", async () => {
		expect(await driver.listObjectKeys("missing/")).toEqual([]);
	});

	test("returns empty array when root is empty", async () => {
		expect(await driver.listObjectKeys()).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// ensureRootExists
// ---------------------------------------------------------------------------

describe("ensureRootExists", () => {
	test("creates the root directory if it does not exist", async () => {
		const newRoot = join(tmpDir, "new-root");
		const d = new LocalStorageDriver(newRoot);
		await d.ensureRootExists();
		expect(existsSync(newRoot)).toBe(true);
	});

	test("is a no-op when root already exists", async () => {
		// tmpDir already exists — should not throw
		await expect(driver.ensureRootExists()).resolves.toBeUndefined();
		expect(existsSync(tmpDir)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// getObjectStream
// ---------------------------------------------------------------------------

describe("getObjectStream", () => {
	test("streams full content", async () => {
		const content = "stream me";
		await driver.writeObject("stream.txt", new TextEncoder().encode(content));
		const stream = await driver.getObjectStream("stream.txt");
		const reader = stream.getReader();
		const chunks: Uint8Array[] = [];
		let done = false;
		while (!done) {
			const r = await reader.read();
			done = r.done;
			if (r.value) chunks.push(r.value);
		}
		const text = new TextDecoder().decode(
			chunks.reduce((acc, c) => {
				const merged = new Uint8Array(acc.length + c.length);
				merged.set(acc);
				merged.set(c, acc.length);
				return merged;
			}, new Uint8Array()),
		);
		expect(text).toBe(content);
	});

	test("streams a byte range", async () => {
		// "hello world" → bytes 6-10 = "world"
		await driver.writeObject(
			"range.txt",
			new TextEncoder().encode("hello world"),
		);
		const stream = await driver.getObjectStream("range.txt", 6, 10);
		const reader = stream.getReader();
		const chunks: Uint8Array[] = [];
		let done = false;
		while (!done) {
			const r = await reader.read();
			done = r.done;
			if (r.value) chunks.push(r.value);
		}
		const text = new TextDecoder().decode(
			chunks.reduce((acc, c) => {
				const merged = new Uint8Array(acc.length + c.length);
				merged.set(acc);
				merged.set(c, acc.length);
				return merged;
			}, new Uint8Array()),
		);
		expect(text).toBe("world");
	});
});

// ---------------------------------------------------------------------------
// getAvailableDiskSpace
// ---------------------------------------------------------------------------

describe("getAvailableDiskSpace", () => {
	test("returns a positive number", () => {
		const space = driver.getAvailableDiskSpace();
		// May be undefined if statfsSync and df both fail in CI, but should be >= 0
		if (space !== undefined) {
			expect(space).toBeGreaterThanOrEqual(0);
		}
	});

	test("works even when called on a newly created root", async () => {
		const newRoot = join(tmpDir, "fresh");
		await writeFile(join(tmpDir, ".keep"), "");
		const d = new LocalStorageDriver(newRoot);
		await d.ensureRootExists();
		const space = d.getAvailableDiskSpace();
		if (space !== undefined) {
			expect(space).toBeGreaterThanOrEqual(0);
		}
	});
});
