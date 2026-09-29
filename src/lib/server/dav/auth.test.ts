import { describe, expect, test } from "bun:test";
import { basicPassword, cachedKeyUser, keyHint } from "./auth";

const basic = (value: string) =>
	`Basic ${Buffer.from(value).toString("base64")}`;

describe("basicPassword", () => {
	test("takes everything after the first colon", () => {
		expect(basicPassword(basic("me@x.test:key:with:colons"))).toBe(
			"key:with:colons",
		);
	});

	test("nothing usable is null", () => {
		expect(basicPassword(null)).toBeNull();
		expect(basicPassword("Bearer abc")).toBeNull();
		expect(basicPassword(basic("no-colon"))).toBeNull();
		expect(basicPassword(basic("user:"))).toBeNull();
	});
});

describe("cachedKeyUser", () => {
	test("verifies once per minute per key, and never caches a refusal", async () => {
		// Fresh keys: the cache is module state and rerunEach runs this 3x.
		const key = crypto.randomUUID();
		let calls = 0;
		const verify = async () => {
			calls++;
			return { id: "u" };
		};
		await cachedKeyUser(key, verify, 0);
		await cachedKeyUser(key, verify, 59_000);
		expect(calls).toBe(1);
		await cachedKeyUser(key, verify, 61_000);
		expect(calls).toBe(2);

		const bad = crypto.randomUUID();
		let refusals = 0;
		const refuse = async () => {
			refusals++;
			return null;
		};
		expect(await cachedKeyUser(bad, refuse, 0)).toBeNull();
		expect(await cachedKeyUser(bad, refuse, 1)).toBeNull();
		expect(refusals).toBe(2);
	});

	test("concurrent misses share one verification", async () => {
		const key = crypto.randomUUID();
		let calls = 0;
		const verify = async () => {
			calls++;
			await Bun.sleep(5);
			return { id: "u" };
		};
		await Promise.all(
			Array.from({ length: 8 }, () => cachedKeyUser(key, verify, 0)),
		);
		expect(calls).toBe(1);
	});
});

describe("keyHint", () => {
	test("a Basic password is never logged, even in part", () => {
		// Finder autofills the account password here.
		expect(keyHint("Correct-Horse-9", true)).toBeUndefined();
		expect(keyHint("jNBsabcdefgh", false)).toBe("jNBsabcd");
	});
});
