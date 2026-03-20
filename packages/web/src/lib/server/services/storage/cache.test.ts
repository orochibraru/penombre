import { describe, expect, test } from "bun:test";
import { CacheKeys, CacheManager, type MemoryCache } from "./cache";

describe("MemoryCache", () => {
	function createCache(): MemoryCache {
		const manager = new CacheManager();
		return manager.getUserCache("test-user");
	}

	test("returns undefined for missing key", () => {
		const cache = createCache();
		expect(cache.get("nonexistent")).toBeUndefined();
	});

	test("stores and retrieves a value", () => {
		const cache = createCache();
		cache.set("key1", { name: "hello" });
		expect(cache.get("key1")).toEqual({ name: "hello" });
	});

	test("returns undefined for expired entries", async () => {
		const cache = createCache();
		cache.set("key1", "value", 0.001); // 1ms TTL
		await new Promise((r) => setTimeout(r, 10));
		expect(cache.get("key1")).toBeUndefined();
	});

	test("deletes a specific key", () => {
		const cache = createCache();
		cache.set("key1", "value1");
		cache.set("key2", "value2");
		const deleted = cache.delete("key1");
		expect(deleted).toBe(true);
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key2")).toBe("value2");
	});

	test("delete returns false for nonexistent key", () => {
		const cache = createCache();
		expect(cache.delete("nope")).toBe(false);
	});

	test("deletes entries by prefix", () => {
		const cache = createCache();
		cache.set("list:root", "a");
		cache.set("list:sub", "b");
		cache.set("meta:file1", "c");
		const count = cache.deleteByPrefix("list:");
		expect(count).toBe(2);
		expect(cache.get("list:root")).toBeUndefined();
		expect(cache.get("list:sub")).toBeUndefined();
		expect(cache.get("meta:file1")).toBe("c");
	});

	test("clears all entries", () => {
		const cache = createCache();
		cache.set("a", 1);
		cache.set("b", 2);
		cache.clear();
		expect(cache.size).toBe(0);
	});

	test("reports correct size", () => {
		const cache = createCache();
		expect(cache.size).toBe(0);
		cache.set("a", 1);
		cache.set("b", 2);
		expect(cache.size).toBe(2);
	});
});

describe("CacheManager", () => {
	test("creates and returns the same cache for a user", () => {
		const manager = new CacheManager();
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-1");
		expect(cache1).toBe(cache2);
	});

	test("creates separate caches for different users", () => {
		const manager = new CacheManager();
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-2");
		cache1.set("key", "value-1");
		expect(cache2.get("key")).toBeUndefined();
	});

	test("clears cache for a specific user", () => {
		const manager = new CacheManager();
		const cache = manager.getUserCache("user-1");
		cache.set("key", "value");
		manager.clearUserCache("user-1");
		expect(cache.size).toBe(0);
	});

	test("clearUserCache is no-op for unknown user", () => {
		const manager = new CacheManager();
		// Should not throw
		manager.clearUserCache("nonexistent");
	});

	test("clears all user caches", () => {
		const manager = new CacheManager();
		const c1 = manager.getUserCache("user-1");
		const c2 = manager.getUserCache("user-2");
		c1.set("a", 1);
		c2.set("b", 2);
		manager.clearAllCaches();
		// After clearAll, getting a cache creates a new empty one
		const c3 = manager.getUserCache("user-1");
		expect(c3.size).toBe(0);
	});
});

describe("CacheKeys", () => {
	test("listing with root prefix", () => {
		expect(CacheKeys.listing("")).toBe("list:root");
	});

	test("listing with prefix", () => {
		expect(CacheKeys.listing("my-folder")).toBe("list:my-folder");
	});

	test("listing with options", () => {
		expect(CacheKeys.listing("folder", "sort=name")).toBe(
			"list:folder:sort=name",
		);
	});

	test("folders normal", () => {
		expect(CacheKeys.folders("prefix")).toBe("folders:prefix:normal");
	});

	test("folders trashed", () => {
		expect(CacheKeys.folders("prefix", true)).toBe("folders:prefix:trashed");
	});

	test("folders root", () => {
		expect(CacheKeys.folders("")).toBe("folders:root:normal");
	});

	test("fileMeta", () => {
		expect(CacheKeys.fileMeta("file-key")).toBe("meta:file-key");
	});

	test("folderMeta", () => {
		expect(CacheKeys.folderMeta("folder-key")).toBe("folder-meta:folder-key");
	});

	test("folderSize", () => {
		expect(CacheKeys.folderSize("folder-key")).toBe("folder-size:folder-key");
	});

	test("starred", () => {
		expect(CacheKeys.starred()).toBe("starred");
	});

	test("trashed", () => {
		expect(CacheKeys.trashed()).toBe("trashed");
	});

	test("recent", () => {
		expect(CacheKeys.recent()).toBe("recent");
	});

	test("category", () => {
		expect(CacheKeys.category("IMAGES")).toBe("category:IMAGES");
	});

	test("counts", () => {
		expect(CacheKeys.counts()).toBe("counts");
	});
});
