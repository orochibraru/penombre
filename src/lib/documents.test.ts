import { describe, expect, test } from "bun:test";
import { parseCsv, parseSlides, toCsv, toDeck } from "./documents";

describe("parseCsv", () => {
	test("splits plain rows and columns", () => {
		expect(parseCsv("a,b\nc,d\n")).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	test("keeps commas inside quoted fields", () => {
		expect(parseCsv('"Doe, Jane",42\n')).toEqual([["Doe, Jane", "42"]]);
	});

	test("keeps newlines inside quoted fields", () => {
		expect(parseCsv('"line one\nline two",x\n')).toEqual([
			["line one\nline two", "x"],
		]);
	});

	test("unescapes doubled quotes", () => {
		expect(parseCsv('"she said ""hi""",b\n')).toEqual([['she said "hi"', "b"]]);
	});

	test("ignores carriage returns", () => {
		expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	test("never returns an empty grid", () => {
		expect(parseCsv("")).toEqual([[""]]);
	});
});

describe("toCsv", () => {
	test("quotes only what needs it", () => {
		expect(toCsv([["plain", "with,comma"]])).toBe('plain,"with,comma"\n');
	});

	test("round-trips the awkward cases", () => {
		const grid = [
			['say "hi"', "a,b"],
			["multi\nline", "plain"],
		];
		expect(parseCsv(toCsv(grid))).toEqual(grid);
	});
});

describe("slides", () => {
	test("splits on a horizontal rule", () => {
		expect(parseSlides("# One\n\n---\n\n# Two")).toEqual(["# One", "# Two"]);
	});

	test("a deck with no separator is one slide", () => {
		expect(parseSlides("# Only")).toEqual(["# Only"]);
	});

	test("empty input still yields an editable slide", () => {
		expect(parseSlides("")).toEqual([""]);
	});

	test("round-trips", () => {
		const slides = ["# One", "## Two\n\nbody"];
		expect(parseSlides(toDeck(slides))).toEqual(slides);
	});
});
