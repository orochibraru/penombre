import { describe, expect, test } from "bun:test";

describe("Test Suite Smoke Test", () => {
	test("Bun test runner works", () => {
		expect(1 + 1).toBe(2);
	});

	test("Happy DOM provides document", () => {
		expect(document).toBeDefined();
		expect(document.body).toBeDefined();
	});

	test("fetch is available", () => {
		expect(fetch).toBeDefined();
		expect(typeof fetch).toBe("function");
	});

	test("can create DOM elements", () => {
		const div = document.createElement("div");
		div.textContent = "test";
		expect(div.textContent).toBe("test");
	});

	test("DOM manipulation works", () => {
		const div = document.createElement("div");
		div.classList.add("test-class");
		expect(div.classList.contains("test-class")).toBe(true);
	});
});
