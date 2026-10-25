import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { MemoryCacheBackend } from "./memory";

const start = new Date("2026-01-01T00:00:00Z");

afterEach(() => {
	setSystemTime();
});

describe("MemoryCacheBackend", () => {
	test("returns what was set, and nothing for an unknown key", async () => {
		const cache = new MemoryCacheBackend();
		await cache.set("listing", { files: ["a.wav"] });
		expect(await cache.get<{ files: string[] }>("listing")).toEqual({
			files: ["a.wav"],
		});
		expect(await cache.get("missing")).toBeUndefined();
	});

	test("an entry expires after its own TTL and is dropped on read", async () => {
		setSystemTime(start);
		const cache = new MemoryCacheBackend();
		await cache.set("short", 1, 5);
		setSystemTime(new Date(start.getTime() + 5000));
		expect(await cache.get<number>("short")).toBe(1);
		setSystemTime(new Date(start.getTime() + 5001));
		expect(await cache.get("short")).toBeUndefined();
		expect(await cache.getSize()).toBe(0);
	});

	test("without a TTL the constructor's default applies", async () => {
		setSystemTime(start);
		const cache = new MemoryCacheBackend(2);
		await cache.set("key", "value");
		setSystemTime(new Date(start.getTime() + 2000));
		expect(await cache.get<string>("key")).toBe("value");
		setSystemTime(new Date(start.getTime() + 2001));
		expect(await cache.get("key")).toBeUndefined();
	});

	test("delete reports whether the key was there", async () => {
		const cache = new MemoryCacheBackend();
		await cache.set("key", 1);
		expect(await cache.delete("key")).toBe(true);
		expect(await cache.delete("key")).toBe(false);
		expect(await cache.get("key")).toBeUndefined();
	});

	test("deleteByPrefix removes only the matching keys and counts them", async () => {
		const cache = new MemoryCacheBackend();
		await cache.set("user:1:a", 1);
		await cache.set("user:1:b", 2);
		await cache.set("user:2:a", 3);
		expect(await cache.deleteByPrefix("user:1:")).toBe(2);
		expect(await cache.get<number>("user:2:a")).toBe(3);
		expect(await cache.getSize()).toBe(1);
		expect(await cache.deleteByPrefix("none:")).toBe(0);
	});

	test("clear empties the cache", async () => {
		const cache = new MemoryCacheBackend();
		await cache.set("a", 1);
		await cache.set("b", 2);
		expect(await cache.getSize()).toBe(2);
		await cache.clear();
		expect(await cache.getSize()).toBe(0);
	});

	// Keys that are never read again would otherwise grow the map forever.
	test("a full cache sweeps expired entries before adding another", async () => {
		setSystemTime(start);
		const cache = new MemoryCacheBackend();
		for (let index = 0; index < 9999; index++) {
			await cache.set(`stale:${index}`, index, 1);
		}
		await cache.set("live", "kept", 60);
		setSystemTime(new Date(start.getTime() + 2000));
		await cache.set("fresh", "added", 60);
		expect(await cache.getSize()).toBe(2);
		expect(await cache.get<string>("live")).toBe("kept");
		expect(await cache.get<string>("fresh")).toBe("added");
	});

	test("below the threshold expired entries are left for their own read", async () => {
		setSystemTime(start);
		const cache = new MemoryCacheBackend();
		await cache.set("stale", 1, 1);
		setSystemTime(new Date(start.getTime() + 2000));
		await cache.set("fresh", 2, 60);
		expect(await cache.getSize()).toBe(2);
	});
});
