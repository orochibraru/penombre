import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	CacheKeys,
	clearAllCaches,
	clearUserCache,
	getUserCache,
} from "./cache";

/**
 * Cache tests
 *
 * Tests the in-memory cache implementation including:
 * - Basic get/set/delete operations
 * - TTL expiration
 * - Prefix-based deletion
 * - Per-user cache isolation
 * - Cache key generators
 */

describe("MemoryCache", () => {
	const userId = "test-user-cache";
	let cache: ReturnType<typeof getUserCache>;

	beforeEach(() => {
		clearAllCaches();
		cache = getUserCache(userId);
	});

	afterEach(() => {
		clearAllCaches();
	});

	describe("Basic Operations", () => {
		it("should set and get a value", () => {
			cache.set("key1", "value1");
			expect(cache.get<string>("key1")).toBe("value1");
		});

		it("should return undefined for non-existent key", () => {
			expect(cache.get("nonexistent")).toBeUndefined();
		});

		it("should store different types", () => {
			cache.set("string", "hello");
			cache.set("number", 42);
			cache.set("boolean", true);
			cache.set("object", { foo: "bar" });
			cache.set("array", [1, 2, 3]);

			expect(cache.get<string>("string")).toBe("hello");
			expect(cache.get<number>("number")).toBe(42);
			expect(cache.get<boolean>("boolean")).toBe(true);
			expect(cache.get<{ foo: string }>("object")).toEqual({ foo: "bar" });
			expect(cache.get<number[]>("array")).toEqual([1, 2, 3]);
		});

		it("should overwrite existing values", () => {
			cache.set("key1", "value1");
			cache.set("key1", "value2");
			expect(cache.get<string>("key1")).toBe("value2");
		});

		it("should report correct size", () => {
			expect(cache.size).toBe(0);
			cache.set("key1", "value1");
			expect(cache.size).toBe(1);
			cache.set("key2", "value2");
			expect(cache.size).toBe(2);
		});
	});

	describe("TTL and Expiration", () => {
		it("should expire entries after TTL", async () => {
			// Set with 0.1 second TTL
			cache.set("key1", "value1", 0.1);
			expect(cache.get<string>("key1")).toBe("value1");

			// Wait for expiration
			await Bun.sleep(150);

			expect(cache.get<string>("key1")).toBeUndefined();
		});

		it("should use default TTL when not specified", async () => {
			// Default is 30 seconds, but we're testing it exists before expiry
			cache.set("key1", "value1");
			expect(cache.get<string>("key1")).toBe("value1");

			// Should still exist after a short time
			await Bun.sleep(100);
			expect(cache.get<string>("key1")).toBe("value1");
		});

		it("should allow custom TTL per entry", async () => {
			cache.set("key1", "value1", 0.1); // 100ms
			cache.set("key2", "value2", 0.3); // 300ms

			await Bun.sleep(150);

			// key1 should be expired, key2 still valid
			expect(cache.get<string>("key1")).toBeUndefined();
			expect(cache.get<string>("key2")).toBe("value2");

			await Bun.sleep(200);

			// Now key2 should also be expired
			expect(cache.get<string>("key2")).toBeUndefined();
		});

		it("should remove expired entry from cache on access", async () => {
			cache.set("key1", "value1", 0.1);
			expect(cache.size).toBe(1);

			await Bun.sleep(150);

			// Access triggers cleanup
			expect(cache.get<string>("key1")).toBeUndefined();
			expect(cache.size).toBe(0);
		});
	});

	describe("Deletion Operations", () => {
		it("should delete a single key", () => {
			cache.set("key1", "value1");
			cache.set("key2", "value2");

			expect(cache.delete("key1")).toBe(true);
			expect(cache.get<string>("key1")).toBeUndefined();
			expect(cache.get<string>("key2")).toBe("value2");
			expect(cache.size).toBe(1);
		});

		it("should return false when deleting non-existent key", () => {
			expect(cache.delete("nonexistent")).toBe(false);
		});

		it("should delete all keys matching prefix", () => {
			cache.set("prefix:key1", "value1");
			cache.set("prefix:key2", "value2");
			cache.set("prefix:key3", "value3");
			cache.set("other:key", "value4");

			const deleted = cache.deleteByPrefix("prefix:");

			expect(deleted).toBe(3);
			expect(cache.get<string>("prefix:key1")).toBeUndefined();
			expect(cache.get<string>("prefix:key2")).toBeUndefined();
			expect(cache.get<string>("prefix:key3")).toBeUndefined();
			expect(cache.get<string>("other:key")).toBe("value4");
			expect(cache.size).toBe(1);
		});

		it("should handle empty prefix deletion", () => {
			cache.set("key1", "value1");
			cache.set("key2", "value2");

			// Empty prefix matches nothing specifically, but since all keys start with something...
			const deleted = cache.deleteByPrefix("nonexistent:");

			expect(deleted).toBe(0);
			expect(cache.size).toBe(2);
		});

		it("should clear all entries", () => {
			cache.set("key1", "value1");
			cache.set("key2", "value2");
			cache.set("key3", "value3");

			cache.clear();

			expect(cache.size).toBe(0);
			expect(cache.get<string>("key1")).toBeUndefined();
			expect(cache.get<string>("key2")).toBeUndefined();
			expect(cache.get<string>("key3")).toBeUndefined();
		});
	});

	describe("Per-User Cache Isolation", () => {
		it("should create separate caches for different users", () => {
			const user1Cache = getUserCache("user1");
			const user2Cache = getUserCache("user2");

			user1Cache.set("key", "value1");
			user2Cache.set("key", "value2");

			expect(user1Cache.get<string>("key")).toBe("value1");
			expect(user2Cache.get<string>("key")).toBe("value2");
		});

		it("should return same cache instance for same user", () => {
			const cache1 = getUserCache("user1");
			const cache2 = getUserCache("user1");

			cache1.set("key", "value");

			expect(cache2.get<string>("key")).toBe("value");
			expect(cache1).toBe(cache2); // Same instance
		});

		it("should clear specific user cache", () => {
			const user1Cache = getUserCache("user1");
			const user2Cache = getUserCache("user2");

			user1Cache.set("key", "value1");
			user2Cache.set("key", "value2");

			clearUserCache("user1");

			expect(user1Cache.get<string>("key")).toBeUndefined();
			expect(user2Cache.get<string>("key")).toBe("value2");
		});

		it("should handle clearing non-existent user cache", () => {
			// Should not throw
			clearUserCache("nonexistent-user");
			expect(true).toBe(true);
		});

		it("should clear all user caches", () => {
			const user1Cache = getUserCache("user1");
			const user2Cache = getUserCache("user2");
			const user3Cache = getUserCache("user3");

			user1Cache.set("key", "value1");
			user2Cache.set("key", "value2");
			user3Cache.set("key", "value3");

			clearAllCaches();

			// After clearAllCaches, getting the cache again creates a new instance
			const newUser1Cache = getUserCache("user1");
			const newUser2Cache = getUserCache("user2");
			const newUser3Cache = getUserCache("user3");

			expect(newUser1Cache.get<string>("key")).toBeUndefined();
			expect(newUser2Cache.get<string>("key")).toBeUndefined();
			expect(newUser3Cache.get<string>("key")).toBeUndefined();
		});

		it("should isolate cache operations between users", () => {
			const user1Cache = getUserCache("user1");
			const user2Cache = getUserCache("user2");

			user1Cache.set("list:root", ["file1", "file2"]);
			user2Cache.set("list:root", ["file3", "file4"]);

			user1Cache.deleteByPrefix("list:");

			expect(user1Cache.get<string[]>("list:root")).toBeUndefined();
			expect(user2Cache.get<string[]>("list:root")).toEqual(["file3", "file4"]);
		});
	});

	describe("Cache Key Generators", () => {
		it("should generate listing keys", () => {
			expect(CacheKeys.listing("")).toBe("list:root");
			expect(CacheKeys.listing("Documents")).toBe("list:Documents");
			expect(CacheKeys.listing("", "options")).toBe("list:root:options");
			expect(CacheKeys.listing("Documents", "starred")).toBe(
				"list:Documents:starred",
			);
		});

		it("should generate folder keys", () => {
			expect(CacheKeys.folders("")).toBe("folders:root:normal");
			expect(CacheKeys.folders("Documents")).toBe("folders:Documents:normal");
			expect(CacheKeys.folders("", true)).toBe("folders:root:trashed");
			expect(CacheKeys.folders("Documents", true)).toBe(
				"folders:Documents:trashed",
			);
		});

		it("should generate file metadata keys", () => {
			expect(CacheKeys.fileMeta("file-id")).toBe("meta:file-id");
			expect(CacheKeys.fileMeta("path/to/file")).toBe("meta:path/to/file");
		});

		it("should generate folder metadata keys", () => {
			expect(CacheKeys.folderMeta("folder-id")).toBe("folder-meta:folder-id");
			expect(CacheKeys.folderMeta("path/to/folder")).toBe(
				"folder-meta:path/to/folder",
			);
		});

		it("should generate starred key", () => {
			expect(CacheKeys.starred()).toBe("starred");
		});

		it("should generate trashed key", () => {
			expect(CacheKeys.trashed()).toBe("trashed");
		});

		it("should generate recent key", () => {
			expect(CacheKeys.recent()).toBe("recent");
		});

		it("should generate category keys", () => {
			expect(CacheKeys.category("DOCUMENTS")).toBe("category:DOCUMENTS");
			expect(CacheKeys.category("IMAGES")).toBe("category:IMAGES");
			expect(CacheKeys.category("MUSIC")).toBe("category:MUSIC");
		});

		it("should generate counts key", () => {
			expect(CacheKeys.counts()).toBe("counts");
		});
	});

	describe("Real-World Usage Scenarios", () => {
		it("should cache file listings with proper invalidation", () => {
			const user1Cache = getUserCache("user1");

			// Cache a file listing
			const files = [
				{ id: "1", name: "file1.txt" },
				{ id: "2", name: "file2.txt" },
			];
			const listKey = CacheKeys.listing("Documents");
			user1Cache.set(listKey, files);

			// Retrieve cached listing
			expect(user1Cache.get<typeof files>(listKey)).toEqual(files);

			// Invalidate after upload
			user1Cache.deleteByPrefix("list:");

			expect(user1Cache.get<typeof files>(listKey)).toBeUndefined();
		});

		it("should cache folder metadata separately from file metadata", () => {
			const userCache = getUserCache("user1");

			const fileMetaKey = CacheKeys.fileMeta("file-123");
			const folderMetaKey = CacheKeys.folderMeta("folder-456");

			userCache.set(fileMetaKey, { name: "document.pdf", size: 1024 });
			userCache.set(folderMetaKey, { name: "Documents", itemCount: 10 });

			// Delete file metadata shouldn't affect folder metadata
			userCache.deleteByPrefix("meta:");

			expect(
				userCache.get<{ name: string; size: number }>(fileMetaKey),
			).toBeUndefined();
			expect(
				userCache.get<{ name: string; itemCount: number }>(folderMetaKey),
			).toEqual({
				name: "Documents",
				itemCount: 10,
			});
		});

		it("should handle starred and trashed file caching", () => {
			const userCache = getUserCache("user1");

			const starredFiles = [{ id: "1" }, { id: "2" }];
			const trashedFiles = [{ id: "3" }];

			userCache.set(CacheKeys.starred(), starredFiles);
			userCache.set(CacheKeys.trashed(), trashedFiles);

			expect(userCache.get<typeof starredFiles>(CacheKeys.starred())).toEqual(
				starredFiles,
			);
			expect(userCache.get<typeof trashedFiles>(CacheKeys.trashed())).toEqual(
				trashedFiles,
			);

			// Clear all listings
			userCache.deleteByPrefix("list:");

			// Starred and trashed should still be cached (different prefix)
			expect(userCache.get<typeof starredFiles>(CacheKeys.starred())).toEqual(
				starredFiles,
			);
			expect(userCache.get<typeof trashedFiles>(CacheKeys.trashed())).toEqual(
				trashedFiles,
			);
		});

		it("should cache category listings independently", () => {
			const userCache = getUserCache("user1");

			const documents = [{ id: "1", name: "doc.pdf" }];
			const images = [{ id: "2", name: "pic.jpg" }];

			userCache.set(CacheKeys.category("DOCUMENTS"), documents);
			userCache.set(CacheKeys.category("IMAGES"), images);

			// Invalidate document category only
			userCache.delete(CacheKeys.category("DOCUMENTS"));

			expect(
				userCache.get<typeof documents>(CacheKeys.category("DOCUMENTS")),
			).toBeUndefined();
			expect(
				userCache.get<typeof images>(CacheKeys.category("IMAGES")),
			).toEqual(images);
		});

		it("should handle counts caching", () => {
			const userCache = getUserCache("user1");

			const counts = { starred: 5, trashed: 2, total: 100 };
			userCache.set(CacheKeys.counts(), counts);

			expect(userCache.get<typeof counts>(CacheKeys.counts())).toEqual(counts);

			// After file operation, invalidate counts
			userCache.delete(CacheKeys.counts());

			expect(userCache.get<typeof counts>(CacheKeys.counts())).toBeUndefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle storing null and undefined", () => {
			cache.set("null-key", null);
			cache.set("undefined-key", undefined);

			expect(cache.get<null>("null-key")).toBe(null);
			expect(cache.get<undefined>("undefined-key")).toBe(undefined);
		});

		it("should handle storing empty strings and zero", () => {
			cache.set("empty-string", "");
			cache.set("zero", 0);

			expect(cache.get<string>("empty-string")).toBe("");
			expect(cache.get<number>("zero")).toBe(0);
		});

		it("should handle keys with special characters", () => {
			cache.set("key:with:colons", "value1");
			cache.set("key/with/slashes", "value2");
			cache.set("key-with-dashes", "value3");

			expect(cache.get<string>("key:with:colons")).toBe("value1");
			expect(cache.get<string>("key/with/slashes")).toBe("value2");
			expect(cache.get<string>("key-with-dashes")).toBe("value3");
		});

		it("should handle very long TTL", () => {
			// Set with 1 hour TTL
			cache.set("key", "value", 3600);
			expect(cache.get<string>("key")).toBe("value");
		});

		it("should handle very short TTL", async () => {
			// Very short TTL (10ms)
			cache.set("key", "value", 0.01);

			// Should expire after 20ms
			await Bun.sleep(20);
			expect(cache.get<string>("key")).toBeUndefined();
		});
	});
});
