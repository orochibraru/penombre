import { describe, expect, test } from "bun:test";
import {
	baseName,
	editorKindForName,
	kindForName,
	officeKindForName,
	parseCsv,
	parseSlides,
	titleFromContent,
	toCsv,
	toDeck,
} from "./documents";

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

describe("titleFromContent", () => {
	test("takes a document's first h1", () => {
		expect(titleFromContent("document", "<h1>Quarter plan</h1><p>x</p>")).toBe(
			"Quarter plan",
		);
	});

	test("unwraps marks and entities inside the heading", () => {
		expect(
			titleFromContent("document", "<h1><strong>Q1 &amp; Q2</strong></h1>"),
		).toBe("Q1 & Q2");
	});

	test("a document with no heading has no title", () => {
		expect(titleFromContent("document", "<p>body only</p>")).toBeNull();
	});

	test("takes a deck's first slide heading, not a later one", () => {
		expect(titleFromContent("presentation", "# Intro\n\n---\n\n# Later")).toBe(
			"Intro",
		);
	});

	test("a grid has no title", () => {
		expect(titleFromContent("sheet", "name,value\n")).toBeNull();
	});

	test("strips what a file name may not contain", () => {
		expect(titleFromContent("document", "<h1>Q1/Q2: plan?</h1>")).toBe(
			"Q1 Q2 plan",
		);
	});

	test("a nested angle bracket cannot reopen a tag", () => {
		// A single tag-shaped pass would leave `<script>` behind here.
		expect(titleFromContent("document", "<h1><<a>script>alert</h1>")).toBe(
			"script alert",
		);
	});

	test("escaped angle brackets never decode back into one", () => {
		expect(titleFromContent("document", "<h1>a &lt;script&gt; b</h1>")).toBe(
			"a script b",
		);
	});

	test("a heading of only separators yields no title", () => {
		expect(titleFromContent("document", "<h1>///</h1>")).toBeNull();
	});

	test("caps a runaway heading", () => {
		const title = titleFromContent("document", `<h1>${"a".repeat(400)}</h1>`);
		expect(title).toHaveLength(120);
	});
});

describe("baseName", () => {
	test("drops the extension", () => {
		expect(baseName("Quarter plan.html")).toBe("Quarter plan");
	});

	test("keeps a name that has none", () => {
		expect(baseName("README")).toBe("README");
	});

	test("keeps a leading dot", () => {
		expect(baseName(".env")).toBe(".env");
	});
});

describe("kind for a file name", () => {
	test("recognises the three native kinds", () => {
		expect(kindForName("a.html")).toBe("document");
		expect(kindForName("a.HTM")).toBe("document");
		expect(kindForName("a.csv")).toBe("sheet");
		expect(kindForName("a.md")).toBe("presentation");
		expect(kindForName("a.markdown")).toBe("presentation");
	});

	test("does not call an Office file one of ours", () => {
		// The listing icon hangs off this: a .docx keeps the Word icon.
		expect(kindForName("a.docx")).toBeNull();
		expect(kindForName("a.xlsx")).toBeNull();
		expect(kindForName("a.pptx")).toBeNull();
	});

	test("maps each Office format to the editor that opens it", () => {
		expect(officeKindForName("report.docx")).toBe("document");
		expect(officeKindForName("BUDGET.XLSX")).toBe("sheet");
		expect(officeKindForName("deck.pptx")).toBe("presentation");
		expect(officeKindForName("notes.txt")).toBeNull();
	});

	test("opens native and Office files alike in an editor", () => {
		expect(editorKindForName("a.csv")).toBe("sheet");
		expect(editorKindForName("a.xlsx")).toBe("sheet");
		expect(editorKindForName("a.pdf")).toBeNull();
	});

	test("ignores a dot that is not an extension", () => {
		expect(kindForName(".csv")).toBeNull();
		expect(kindForName("no-extension")).toBeNull();
	});
});
