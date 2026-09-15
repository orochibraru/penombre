import { describe, expect, it } from "bun:test";
import { markdownToPptx, pptxToMarkdown } from "./pptx";
import { slideRefs } from "./pptx-package";
import { presentation, slideXml } from "./test-utils";
import { partText, readZip } from "./zip";

const deck = (...slides: string[]) => readZip(presentation(slides));

describe("pptxToMarkdown", () => {
	it("reads a title as a heading and body paragraphs as bullets", () => {
		const entries = deck(
			slideXml("Penombre", ["Own your files", "No private formats"]),
		);
		expect(pptxToMarkdown(entries)).toBe(
			"# Penombre\n- Own your files\n- No private formats\n",
		);
	});

	it("separates slides the way every Markdown deck tool does", () => {
		const entries = deck(slideXml("One"), slideXml("Two"));
		expect(pptxToMarkdown(entries)).toBe("# One\n\n---\n\n# Two\n");
	});

	it("marks a bold run with asterisks", () => {
		const entries = deck(
			slideXml("T").replace(
				"<a:r><a:t>T</a:t></a:r>",
				'<a:r><a:rPr b="1"/><a:t>T</a:t></a:r>',
			),
		);
		expect(pptxToMarkdown(entries)).toBe("# **T**\n");
	});

	it("indents a nested bullet by its level", () => {
		const entries = deck(
			slideXml("T", ["top"]).replace(
				"<a:p><a:r><a:t>top</a:t></a:r></a:p>",
				'<a:p><a:r><a:t>top</a:t></a:r></a:p><a:p><a:pPr lvl="1"/><a:r><a:t>under</a:t></a:r></a:p>',
			),
		);
		expect(pptxToMarkdown(entries)).toBe("# T\n- top\n  - under\n");
	});
});

describe("markdownToPptx", () => {
	it("writes the title and the bullets into the shapes already there", () => {
		const entries = deck(slideXml("Old", ["a"]));
		markdownToPptx(entries, "# New\n- one\n- two\n");
		expect(pptxToMarkdown(entries)).toBe("# New\n- one\n- two\n");
	});

	it("round-trips its own output", () => {
		const entries = deck(slideXml("One", ["a", "b"]), slideXml("Two", ["c"]));
		const markdown = pptxToMarkdown(entries);
		markdownToPptx(entries, markdown);
		expect(pptxToMarkdown(entries)).toBe(markdown);
	});

	it("keeps the shape's own run formatting on text it rewrites", () => {
		const entries = deck(
			slideXml("T", ["a"]).replace(
				"<a:r><a:t>a</a:t></a:r>",
				'<a:r><a:rPr sz="2400" dirty="0"/><a:t>a</a:t></a:r>',
			),
		);
		markdownToPptx(entries, "# T\n- different text\n");
		expect(partText(entries, "ppt/slides/slide1.xml")).toContain('sz="2400"');
	});

	it("writes emphasis back as a bold run", () => {
		const entries = deck(slideXml("T", ["a"]));
		markdownToPptx(entries, "# T\n- very **loud**\n");
		const xml = partText(entries, "ppt/slides/slide1.xml") ?? "";

		expect(xml).toContain('b="1"');
		expect(pptxToMarkdown(entries)).toBe("# T\n- very **loud**\n");
	});

	it("keeps the bodyPr and lstStyle of a shape it rewrites", () => {
		const entries = deck(slideXml("T", ["a"]));
		markdownToPptx(entries, "# T\n- b\n");
		expect(partText(entries, "ppt/slides/slide1.xml")).toContain(
			"<a:bodyPr/><a:lstStyle/>",
		);
	});

	it("adds a slide, registering it in all four places", () => {
		const entries = deck(slideXml("One", ["a"]));
		markdownToPptx(entries, "# One\n- a\n\n---\n\n# Two\n- new\n");

		expect(slideRefs(entries)).toHaveLength(2);
		expect(partText(entries, "ppt/slides/slide2.xml")).toBeTruthy();
		expect(partText(entries, "ppt/slides/_rels/slide2.xml.rels")).toBeTruthy();
		expect(partText(entries, "[Content_Types].xml")).toContain(
			"/ppt/slides/slide2.xml",
		);
		expect(partText(entries, "ppt/_rels/presentation.xml.rels")).toContain(
			"slides/slide2.xml",
		);
		expect(pptxToMarkdown(entries)).toBe("# One\n- a\n\n---\n\n# Two\n- new\n");
	});

	it("gives the added slide a unique id in the slide list", () => {
		const entries = deck(slideXml("One"));
		markdownToPptx(entries, "# One\n\n---\n\n# Two\n");
		const xml = partText(entries, "ppt/presentation.xml") ?? "";
		const ids = [...xml.matchAll(/<p:sldId id="(\d+)"/g)].map(
			(match) => match[1],
		);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("removes a slide's parts and every reference to it", () => {
		const entries = deck(slideXml("One"), slideXml("Two"));
		markdownToPptx(entries, "# One\n");

		expect(slideRefs(entries)).toHaveLength(1);
		expect(partText(entries, "ppt/slides/slide2.xml")).toBeNull();
		expect(partText(entries, "ppt/slides/_rels/slide2.xml.rels")).toBeNull();
		expect(partText(entries, "[Content_Types].xml")).not.toContain(
			"/ppt/slides/slide2.xml",
		);
		expect(partText(entries, "ppt/_rels/presentation.xml.rels")).not.toContain(
			"slides/slide2.xml",
		);
	});

	it("never leaves a deck with no slides at all", () => {
		const entries = deck(slideXml("One"));
		markdownToPptx(entries, "");
		expect(slideRefs(entries)).toHaveLength(1);
	});

	it("does not copy the template slide's own content onto a new one", () => {
		// A new slide inherits the layout, not last slide's photograph.
		const entries = deck(slideXml("One", ["keep me"]));
		markdownToPptx(entries, "# One\n- keep me\n\n---\n\n# Two\n");
		expect(pptxToMarkdown(entries)).toBe("# One\n- keep me\n\n---\n\n# Two\n");
	});

	it("gives a layout with nowhere for the text a text box of its own", () => {
		const entries = deck(slideXml("Title only"));
		markdownToPptx(entries, "# Title only\n- but now with a point\n");
		expect(pptxToMarkdown(entries)).toBe(
			"# Title only\n- but now with a point\n",
		);
	});
});
