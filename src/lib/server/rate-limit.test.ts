import { describe, expect, test } from "bun:test";
import { closeRedis } from "./cache/index.js";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
	test("allows up to the max, then refuses", async () => {
		const key = `test:${crypto.randomUUID()}`;
		for (let i = 0; i < 3; i++) {
			expect(await isRateLimited(key, { max: 3, windowSeconds: 60 })).toBe(
				false,
			);
		}
		expect(await isRateLimited(key, { max: 3, windowSeconds: 60 })).toBe(true);
	});

	test("different keys have independent budgets", async () => {
		const a = `test:${crypto.randomUUID()}`;
		const b = `test:${crypto.randomUUID()}`;
		await isRateLimited(a, { max: 1, windowSeconds: 60 });
		expect(await isRateLimited(a, { max: 1, windowSeconds: 60 })).toBe(true);
		expect(await isRateLimited(b, { max: 1, windowSeconds: 60 })).toBe(false);
	});

	// `redis.test.ts` closes the shared client; a store cached around it
	// answered "Connection is closed." for every later caller.
	test("survives the shared redis client being closed", async () => {
		const key = `test:${crypto.randomUUID()}`;
		expect(await isRateLimited(key, { max: 2, windowSeconds: 60 })).toBe(false);
		await closeRedis();
		expect(await isRateLimited(key, { max: 2, windowSeconds: 60 })).toBe(false);
	});
});
