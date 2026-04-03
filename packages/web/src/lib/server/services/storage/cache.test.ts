import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	jest,
	test,
} from "bun:test";
import {
	type CacheBackend,
	closeRedis,
	MemoryCacheBackend,
	NullCacheBackend,
} from "$lib/server/cache";
import { isRedisAvailable } from "$lib/server/cache/test-helpers";
import { CacheKeys, CacheManager } from "$lib/server/services/storage/cache";

const redisUrl = process.env.REDIS_URL;
const redisRunning = await isRedisAvailable(redisUrl);

// Fixed origin so all time-based tests are fully deterministic.
const BASE_TIME = 1_000_000;

describe("MemoryCacheBackend", () => {
	function createCache(): CacheBackend {
		return new MemoryCacheBackend(30);
	}

	beforeEach(() => {
		jest.setSystemTime(BASE_TIME);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("returns undefined for missing key", async () => {
		const cache = createCache();
		expect(await cache.get("nonexistent")).toBeUndefined();
	});

	test("stores and retrieves a value", async () => {
		const cache = createCache();
		await cache.set("key1", { name: "hello" });
		expect(await cache.get<{ name: string }>("key1")).toEqual({
			name: "hello",
		});
	});

	test("returns value before TTL elapses", async () => {
		const cache = createCache();
		await cache.set("key1", "value", 1); // 1 second TTL
		jest.setSystemTime(BASE_TIME + 999); // 1 ms before expiry
		expect(await cache.get<string>("key1")).toBe("value");
	});

	test("returns undefined for expired entries", async () => {
		const cache = createCache();
		await cache.set("key1", "value", 1); // 1 second TTL
		jest.setSystemTime(BASE_TIME + 1_001); // 1 ms past expiry
		expect(await cache.get("key1")).toBeUndefined();
	});

	test("deletes a specific key", async () => {
		const cache = createCache();
		await cache.set("key1", "value1");
		await cache.set("key2", "value2");
		const deleted = await cache.delete("key1");
		expect(deleted).toBe(true);
		expect(await cache.get("key1")).toBeUndefined();
		expect(await cache.get<string>("key2")).toBe("value2");
	});

	test("delete returns false for nonexistent key", async () => {
		const cache = createCache();
		expect(await cache.delete("nope")).toBe(false);
	});

	test("deletes entries by prefix", async () => {
		const cache = createCache();
		await cache.set("list:root", "a");
		await cache.set("list:sub", "b");
		await cache.set("meta:file1", "c");
		const count = await cache.deleteByPrefix("list:");
		expect(count).toBe(2);
		expect(await cache.get("list:root")).toBeUndefined();
		expect(await cache.get("list:sub")).toBeUndefined();
		expect(await cache.get<string>("meta:file1")).toBe("c");
	});

	test("clears all entries", async () => {
		const cache = createCache();
		await cache.set("a", 1);
		await cache.set("b", 2);
		await cache.clear();
		expect(await cache.getSize()).toBe(0);
	});

	test("reports correct size", async () => {
		const cache = createCache();
		expect(await cache.getSize()).toBe(0);
		await cache.set("a", 1);
		await cache.set("b", 2);
		expect(await cache.getSize()).toBe(2);
	});
});

describe("NullCacheBackend", () => {
	function createCache(): CacheBackend {
		return new NullCacheBackend();
	}

	test("get always returns undefined", async () => {
		const cache = createCache();
		await cache.set("key", "value");
		expect(await cache.get("key")).toBeUndefined();
	});

	test("set is a no-op", async () => {
		const cache = createCache();
		await cache.set("key", "value");
		expect(await cache.getSize()).toBe(0);
	});

	test("delete always returns false", async () => {
		const cache = createCache();
		expect(await cache.delete("key")).toBe(false);
	});

	test("deleteByPrefix always returns 0", async () => {
		const cache = createCache();
		expect(await cache.deleteByPrefix("prefix")).toBe(0);
	});

	test("clear is a no-op", async () => {
		const cache = createCache();
		await cache.clear();
		expect(await cache.getSize()).toBe(0);
	});

	test("getSize always returns 0", async () => {
		const cache = createCache();
		expect(await cache.getSize()).toBe(0);
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

describe.if(redisRunning)("CacheManager (redis)", () => {
	let manager: CacheManager;

	beforeAll(() => {
		manager = new CacheManager();
	});

	afterAll(async () => {
		await closeRedis();
	});

	test("creates and returns the same cache for a user", () => {
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-1");
		expect(cache1).toBe(cache2);
	});

	test("creates separate caches for different users", async () => {
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-2");
		await cache1.set("key", "value-1");
		expect(await cache2.get("key")).toBeUndefined();
	});

	test("clears cache for a specific user", async () => {
		const cache = manager.getUserCache("user-1");
		await cache.set("key", "value");
		await manager.clearUserCache("user-1");
		expect(await cache.getSize()).toBe(0);
	});

	test("clearUserCache is no-op for unknown user", async () => {
		await manager.clearUserCache("nonexistent");
	});

	test("clears all user caches", async () => {
		const c1 = manager.getUserCache("user-1");
		const c2 = manager.getUserCache("user-2");
		await c1.set("a", 1);
		await c2.set("b", 2);
		await manager.clearAllCaches();
		const c3 = manager.getUserCache("user-1");
		expect(await c3.getSize()).toBe(0);
	});
});
