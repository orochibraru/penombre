import { describe, expect, test } from "bun:test";
import type Redis from "ioredis";
import { RedisCacheBackend } from "./redis";

/**
 * Minimal in-memory mock of ioredis that satisfies the methods
 * used by RedisCacheBackend: get, setex, del, scan.
 */
function createMockRedis(): Redis {
	const store = new Map<string, { value: string; expireAt: number }>();

	return {
		get: async (key: string) => {
			const entry = store.get(key);
			if (!entry) return null;
			if (Date.now() > entry.expireAt) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},
		setex: async (key: string, ttl: number, value: string) => {
			store.set(key, { value, expireAt: Date.now() + ttl * 1000 });
		},
		del: async (...keys: string[]) => {
			let count = 0;
			for (const k of keys) {
				if (store.delete(k)) count++;
			}
			return count;
		},
		scan: async (...args: unknown[]) => {
			const pattern = args[2] as string;
			const matched: string[] = [];
			const regex = new RegExp(
				`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*")}$`,
			);
			for (const key of store.keys()) {
				if (regex.test(key)) matched.push(key);
			}
			return ["0", matched];
		},
	} as unknown as Redis;
}

describe("RedisCacheBackend", () => {
	function createCache() {
		const client = createMockRedis();
		return new RedisCacheBackend(client, "penombre:cache:user1", 60);
	}

	test("returns undefined for missing key", async () => {
		const cache = createCache();
		expect(await cache.get("nonexistent")).toBeUndefined();
	});

	test("stores and retrieves a value", async () => {
		const cache = createCache();
		await cache.set("key1", { name: "hello" });
		expect(await cache.get("key1")).toEqual({ name: "hello" });
	});

	test("stores and retrieves a Map value", async () => {
		const cache = createCache();
		const map = new Map([
			["a", 1],
			["b", 2],
		]);
		await cache.set("myMap", map);
		const result = await cache.get<Map<string, number>>("myMap");
		expect(result).toBeInstanceOf(Map);
		expect(result?.get("a")).toBe(1);
		expect(result?.get("b")).toBe(2);
	});

	test("deletes a specific key", async () => {
		const cache = createCache();
		await cache.set("key1", "value1");
		await cache.set("key2", "value2");
		const deleted = await cache.delete("key1");
		expect(deleted).toBe(true);
		expect(await cache.get("key1")).toBeUndefined();
		expect(await cache.get("key2")).toBe("value2");
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
		expect(await cache.get("meta:file1")).toBe("c");
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

	test("uses default TTL when none specified", async () => {
		const client = createMockRedis();
		const cache = new RedisCacheBackend(client, "ns", 30);
		await cache.set("key", "val");
		expect(await cache.get("key")).toBe("val");
	});

	test("uses custom TTL when specified", async () => {
		const cache = createCache();
		await cache.set("key", "val", 120);
		expect(await cache.get("key")).toBe("val");
	});
});
