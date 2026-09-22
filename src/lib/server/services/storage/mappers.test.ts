import { describe, expect, test } from "bun:test";
import {
	isActiveContentType,
	parseRange,
	rawFileSecurityHeaders,
} from "./mappers.js";

describe("raw file security", () => {
	test("script-capable types are active", () => {
		for (const type of [
			"text/html",
			"application/xhtml+xml",
			"image/svg+xml",
			"application/xml",
			"text/xml",
		]) {
			expect(isActiveContentType(type)).toBe(true);
		}
		expect(isActiveContentType("image/png")).toBe(false);
		expect(isActiveContentType("application/pdf")).toBe(false);
	});

	test("everything but PDF is sandboxed, everything is nosniff", () => {
		expect(rawFileSecurityHeaders("image/png")).toEqual({
			"Content-Security-Policy": "sandbox",
			"X-Content-Type-Options": "nosniff",
		});
		expect(rawFileSecurityHeaders("application/PDF")).toEqual({
			"X-Content-Type-Options": "nosniff",
		});
	});
});

describe("parseRange", () => {
	test("reads closed, open and suffix ranges, and refuses the rest", () => {
		expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
		expect(parseRange("bytes=90-", 100)).toEqual({ start: 90, end: 99 });
		expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
		expect(parseRange("bytes=50-100", 100)).toBeNull();
		expect(parseRange("bytes=9-0", 100)).toBeNull();
		expect(parseRange(null, 100)).toBeNull();
	});
});
