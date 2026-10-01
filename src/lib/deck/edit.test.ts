import { describe, expect, test } from "bun:test";
import {
	bullets,
	code,
	cycleHeading,
	type Edit,
	image,
	insertBlock,
	link,
	numbers,
	quotes,
	TABLE,
	table,
	wrap,
} from "./edit";

/** The text after an edit, with `[` `]` marking the selection. */
function apply(value: string, edit: Edit): string {
	const next = `${value.slice(0, edit.from)}${edit.insert}${value.slice(edit.to)}`;
	const [start, end] = edit.selection;
	return `${next.slice(0, start)}[${next.slice(start, end)}]${next.slice(end)}`;
}

describe("wrap", () => {
	test("wraps the selection and keeps it selected", () => {
		expect(apply("a word", wrap("a word", [2, 6], "**", "bold"))).toBe(
			"a **[word]**",
		);
	});

	test("inserts a placeholder at a caret", () => {
		expect(apply("", wrap("", [0, 0], "*", "text"))).toBe("*[text]*");
	});

	test("unwraps when already wrapped", () => {
		expect(apply("**word**", wrap("**word**", [2, 6], "**", "x"))).toBe(
			"[word]",
		);
		expect(apply("**word**", wrap("**word**", [0, 8], "**", "x"))).toBe(
			"[word]",
		);
	});

	test("italic inside bold adds italic rather than eating a star", () => {
		expect(apply("**word**", wrap("**word**", [2, 6], "*", "x"))).toBe(
			"***[word]***",
		);
		expect(apply("***word***", wrap("***word***", [3, 7], "*", "x"))).toBe(
			"**[word]**",
		);
	});
});

describe("line prefixes", () => {
	test("bullets every selected line, skipping blanks", () => {
		expect(apply("a\n\nb", bullets("a\n\nb", [0, 4]))).toBe("[- a\n\n- b]");
	});

	test("toggles off, keeping indentation", () => {
		expect(apply("  - a", bullets("  - a", [4, 4]))).toBe("  a[]");
	});

	test("numbers replace bullets", () => {
		expect(apply("- a\n- b", numbers("- a\n- b", [0, 7]))).toBe("[1. a\n2. b]");
	});

	test("quotes", () => {
		expect(apply("a", quotes("a", [0, 0]))).toBe("> a[]");
		expect(apply("> a", quotes("> a", [0, 0]))).toBe("a[]");
	});

	test("a selection ending at a newline leaves the next line alone", () => {
		expect(apply("a\nb", bullets("a\nb", [0, 2]))).toBe("[- a]\nb");
	});
});

test("headings cycle through three levels", () => {
	let value = "Title";
	const levels: string[] = [];
	for (let step = 0; step < 4; step++) {
		const edit = cycleHeading(value, [0, 0]);
		value = `${value.slice(0, edit.from)}${edit.insert}${value.slice(edit.to)}`;
		levels.push(value);
	}
	expect(levels).toEqual(["# Title", "## Title", "### Title", "Title"]);
});

describe("blocks", () => {
	test("sit on lines of their own", () => {
		expect(apply("a b", insertBlock("a b", [1, 2], "X"))).toBe("a\n\nX[]\n\nb");
		expect(apply("a\n\n", insertBlock("a\n\n", [3, 3], "X"))).toBe("a\n\nX[]");
	});

	test("a table leaves the caret in its first cell", () => {
		const edit = table("", [0, 0]);
		expect(edit.insert).toBe(TABLE);
		expect(edit.selection).toEqual([2, 2]);
	});

	test("an image without a source selects a URL to type", () => {
		expect(apply("", image("", [0, 0]))).toBe("![]([https://])");
		expect(apply("", image("", [0, 0], "data:image/png;base64,AA"))).toBe(
			"![](data:image/png;base64,AA)[]",
		);
	});

	test("code is inline for a word, fenced for lines", () => {
		expect(apply("x", code("x", [0, 1], "code"))).toBe("`[x]`");
		expect(apply("a\nb", code("a\nb", [0, 3], "code"))).toBe(
			"```\n[a\nb]\n```",
		);
	});
});

test("links select the URL", () => {
	const edit = link("see this", [4, 8], "link");
	expect(edit.insert).toBe("[this](https://)");
	expect(edit.selection).toEqual([11, 19]);
	expect(link("", [0, 0], "link").insert).toBe("[link](https://)");
});
