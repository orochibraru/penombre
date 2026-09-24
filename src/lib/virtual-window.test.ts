import { describe, expect, test } from "bun:test";
import { rowAtOffset } from "./virtual-window.svelte";

describe("rowAtOffset", () => {
	// Rows of 57, 40, 40, 57: a file, its two versions, the next file.
	const offsets = [0, 57, 97, 137, 194];

	test("finds the row a position falls in", () => {
		expect(rowAtOffset(offsets, 0)).toBe(0);
		expect(rowAtOffset(offsets, 56)).toBe(0);
		expect(rowAtOffset(offsets, 57)).toBe(1);
		expect(rowAtOffset(offsets, 100)).toBe(2);
		expect(rowAtOffset(offsets, 150)).toBe(3);
	});

	test("past the end is the end", () => {
		expect(rowAtOffset(offsets, 10_000)).toBe(4);
	});
});
