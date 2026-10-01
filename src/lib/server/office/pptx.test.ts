import { describe, expect, it } from "bun:test";
import type { Deck, ShapeElement } from "#lib/slides/model.js";
import { officeToText, textToOffice } from "./index";
import { pptxToText, textToPptx } from "./pptx";
import { NotAPresentationError, slideRefs } from "./pptx-package";
import { presentation, slideXml } from "./test-utils";
import { partText, readZip } from "./zip";

const deck = (...slides: string[]) => readZip(presentation(slides));
const parse = (text: string) => JSON.parse(text) as Deck;

describe("a deck with no master, layout or theme", () => {
	it("still reads its titles and bullets", () => {
		const read = parse(
			pptxToText(deck(slideXml("Penombre", ["Own your files"]))),
		);
		const [title, body] = (read.slides[0]?.elements ?? []) as ShapeElement[];
		expect(title?.placeholder?.type).toBe("title");
		expect(title?.text?.paragraphs[0]?.runs[0]?.text).toBe("Penombre");
		expect(body?.text?.paragraphs[0]?.runs[0]?.text).toBe("Own your files");
	});

	it("writes an edit back into the shape that was there", () => {
		const entries = deck(slideXml("Old", ["a"]));
		const read = parse(pptxToText(entries));
		const title = read.slides[0]?.elements[0] as ShapeElement;
		const run = title.text?.paragraphs[0]?.runs[0];
		if (run) {
			run.text = "New";
		}
		textToPptx(entries, JSON.stringify(read));
		expect(partText(entries, "ppt/slides/slide1.xml")).toContain(
			"<a:t>New</a:t>",
		);
		expect(slideRefs(entries)).toHaveLength(1);
	});
});

describe("the editor's JSON", () => {
	it("is refused when it is not JSON", () => {
		expect(() => textToPptx(deck(slideXml("T")), "# T")).toThrow(
			NotAPresentationError,
		);
	});

	it("is refused when an element has no geometry", () => {
		const entries = deck(slideXml("T"));
		const read = parse(pptxToText(entries));
		const bad = {
			...read,
			slides: [{ ...read.slides[0], elements: [{ kind: "shape", id: "2" }] }],
		};
		expect(() => textToPptx(entries, JSON.stringify(bad))).toThrow(
			NotAPresentationError,
		);
		// Nothing was written.
		expect(partText(entries, "ppt/slides/slide1.xml")).toContain(
			"<a:t>T</a:t>",
		);
	});

	it("round-trips through the office entry points", () => {
		const bytes = presentation([slideXml("One", ["a", "b"]), slideXml("Two")]);
		const buffer = bytes.buffer.slice(
			bytes.byteOffset,
			bytes.byteOffset + bytes.byteLength,
		) as ArrayBuffer;
		const text = officeToText("deck.pptx", buffer);
		const written = textToOffice("deck.pptx", buffer, text);
		const again = written.buffer.slice(
			written.byteOffset,
			written.byteOffset + written.byteLength,
		) as ArrayBuffer;
		const strip = (value: string) =>
			parse(value).slides.map((slide) => slide.elements.length);
		expect(strip(officeToText("deck.pptx", again))).toEqual(strip(text));
	});
});
