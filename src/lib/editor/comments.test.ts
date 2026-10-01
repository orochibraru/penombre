import { describe, expect, test } from "bun:test";
import {
	type CommentNote,
	cellKey,
	flatten,
	locateQuote,
	textAnchor,
	threads,
} from "./comments";

const TEXT =
	"The budget is final. Travel is capped. The budget is final unless the board objects.";

function anchorOn(text: string, quote: string, occurrence = 0) {
	let at = -1;
	for (let i = 0; i <= occurrence; i++) {
		at = text.indexOf(quote, at + 1);
	}
	const anchor = textAnchor(text, at, at + quote.length);
	if (!anchor) {
		throw new Error("no anchor");
	}
	return anchor;
}

describe("locateQuote", () => {
	test("finds the quote where it was", () => {
		const anchor = anchorOn(TEXT, "Travel is capped");
		const found = locateQuote(TEXT, anchor);
		expect(found && TEXT.slice(found.start, found.end)).toBe(
			"Travel is capped",
		);
	});

	test("follows the quote when text is inserted before it", () => {
		const anchor = anchorOn(TEXT, "Travel is capped");
		const edited = `Summary first. ${TEXT}`;
		const found = locateQuote(edited, anchor);
		expect(found?.start).toBe(edited.indexOf("Travel is capped"));
	});

	test("picks the repeat whose surroundings still match", () => {
		const anchor = anchorOn(TEXT, "The budget is final", 1);
		// A new paragraph pushes both repeats along; the second still reads
		// "… unless the board objects".
		const edited = `Intro.\n${TEXT.replace("Travel", "Hotel travel")}`;
		const found = locateQuote(edited, anchor);
		expect(found?.start).toBe(edited.lastIndexOf("The budget is final"));
	});

	test("prefers the nearest repeat when the context is gone", () => {
		const text = "alpha beta alpha";
		const anchor = { quote: "alpha", prefix: "", suffix: "", offset: 11 };
		expect(locateQuote(text, anchor)?.start).toBe(11);
	});

	test("is null once the words are gone: the comment is detached", () => {
		const anchor = anchorOn(TEXT, "Travel is capped");
		expect(locateQuote(TEXT.replace("capped", "open"), anchor)).toBeNull();
	});

	test("a blank selection makes no anchor", () => {
		expect(textAnchor("a   b", 1, 4)).toBeNull();
	});
});

describe("flatten", () => {
	const runs = [
		{ text: "Hello ", pos: 1, block: 0 },
		{ text: "world", pos: 7, block: 0 },
		{ text: "Next", pos: 14, block: 1 },
	];

	test("joins paragraphs with a newline", () => {
		expect(flatten(runs).text).toBe("Hello world\nNext");
	});

	test("maps offsets to positions and back", () => {
		const doc = flatten(runs);
		const offset = doc.text.indexOf("Next");
		expect(doc.toPos(offset)).toBe(14);
		expect(doc.toOffset(14)).toBe(offset);
		expect(doc.toPos(doc.text.indexOf("world"))).toBe(7);
		expect(doc.toOffset(9)).toBe(doc.text.indexOf("rld"));
	});

	test("a quote found in the text lands on its document range", () => {
		const doc = flatten(runs);
		const found = locateQuote(doc.text, {
			quote: "world",
			prefix: "Hello ",
			suffix: "",
			offset: 0,
		});
		expect(found && [doc.toPos(found.start), doc.toPos(found.end)]).toEqual([
			7, 12,
		]);
	});
});

describe("threads", () => {
	const note = (
		id: string,
		createdAt: string,
		parentId: string | null = null,
	): CommentNote => ({
		id,
		userId: "u",
		authorName: "U",
		body: id,
		anchor: null,
		parentId,
		resolvedAt: null,
		resolvedByName: null,
		createdAt,
		updatedAt: createdAt,
	});

	test("groups replies under their root, oldest first", () => {
		const list = threads([
			note("r2", "2026-01-02"),
			note("a", "2026-01-03", "r1"),
			note("r1", "2026-01-01"),
			note("b", "2026-01-02T12:00", "r1"),
			note("orphan", "2026-01-04", "gone"),
		]);
		expect(list.map((thread) => thread.root.id)).toEqual(["r1", "r2"]);
		expect(list[0]?.replies.map((reply) => reply.id)).toEqual(["b", "a"]);
	});

	test("a cell key is one spelling per cell", () => {
		expect(cellKey("Sheet1", "b3")).toBe("Sheet1!B3");
	});
});
