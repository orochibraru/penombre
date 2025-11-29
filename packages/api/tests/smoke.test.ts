import { describe, expect, test } from "bun:test";

describe("Test Suite Smoke Test", () => {
	test("Bun test runner works", () => {
		expect(1 + 1).toBe(2);
	});

	test("fetch is available", () => {
		expect(fetch).toBeDefined();
		expect(typeof fetch).toBe("function");
	});

	test("Bun environment is available", () => {
		expect(Bun).toBeDefined();
		expect(typeof Bun.version).toBe("string");
	});

	test("async/await works", async () => {
		const result = await Promise.resolve(42);
		expect(result).toBe(42);
	});
});
