import { afterAll, describe, expect, test } from "bun:test";
import { closeRedis } from "$lib/server/cache";
import { isRedisAvailable } from "$lib/server/cache/test-helpers";
import { CacheManager } from "$lib/server/services/storage/cache";

const redisUrl = process.env.REDIS_URL;
const redisRunning = await isRedisAvailable(redisUrl);

describe.if(redisRunning)("CacheManager (redis)", () => {
	afterAll(async () => {
		await closeRedis();
	});

	test("creates and returns the same cache for a user", () => {
		const manager = new CacheManager();
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-1");
		expect(cache1).toBe(cache2);
	});

	test("creates separate caches for different users", async () => {
		const manager = new CacheManager();
		const cache1 = manager.getUserCache("user-1");
		const cache2 = manager.getUserCache("user-2");
		await cache1.set("key", "value-1");
		expect(await cache2.get("key")).toBeUndefined();
	});

	test("clears cache for a specific user", async () => {
		const manager = new CacheManager();
		const cache = manager.getUserCache("user-1");
		await cache.set("key", "value");
		await manager.clearUserCache("user-1");
		expect(await cache.getSize()).toBe(0);
	});

	test("clearUserCache is no-op for unknown user", async () => {
		const manager = new CacheManager();
		await manager.clearUserCache("nonexistent");
	});

	test("clears all user caches", async () => {
		const manager = new CacheManager();
		const c1 = manager.getUserCache("user-1");
		const c2 = manager.getUserCache("user-2");
		await c1.set("a", 1);
		await c2.set("b", 2);
		await manager.clearAllCaches();
		const c3 = manager.getUserCache("user-1");
		expect(await c3.getSize()).toBe(0);
	});
});
