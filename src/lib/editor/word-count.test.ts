import { describe, expect, it } from "bun:test";
import { countCharacters, countWords } from "./word-count";

describe("word count", () => {
	it("counts words, not punctuation or spaces", () => {
		expect(countWords("Hello, world — it's 2026.")).toBe(4);
		expect(countWords("   ")).toBe(0);
	});

	it("counts words in a language without spaces", () => {
		expect(countWords("私は猫が好きです")).toBeGreaterThan(1);
	});

	it("counts characters with spaces, but not paragraph breaks", () => {
		expect(countCharacters("a b\nc")).toBe(4);
		expect(countCharacters("😀")).toBe(1);
	});
});
