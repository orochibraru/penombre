import { describe, expect, test } from "bun:test";
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
});
