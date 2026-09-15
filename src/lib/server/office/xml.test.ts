import { describe, expect, it } from "bun:test";
import {
	childNamed,
	childrenNamed,
	findElement,
	findElements,
	parseHtmlFragment,
	parseXml,
	serializeXml,
	textContent,
	XmlParseError,
} from "./xml";

const roundTrip = (source: string): string => serializeXml(parseXml(source));

describe("parseXml", () => {
	it("round-trips elements, attributes and text", () => {
		const source = '<w:p w:rsid="00A"><w:r><w:t>hello</w:t></w:r></w:p>';
		expect(roundTrip(source)).toBe(source);
	});

	it("keeps the prolog and any comment verbatim", () => {
		const source =
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!-- a note --><root/>';
		expect(roundTrip(source)).toBe(source);
	});

	it("keeps a CDATA section verbatim", () => {
		const source = "<root><![CDATA[<not> & parsed]]></root>";
		expect(roundTrip(source)).toBe(source);
	});

	it("decodes and re-encodes entities without changing meaning", () => {
		const root = parseXml("<t>a &amp; b &lt;c&gt; &#65;</t>").root;
		expect(textContent(root)).toBe("a & b <c> A");
		expect(serializeXml(parseXml("<t>a &amp; b</t>"))).toBe("<t>a &amp; b</t>");
	});

	it("does not mistake a > inside an attribute for the end of a tag", () => {
		const source = '<c formula="a &gt; b" other="x>y"><v>1</v></c>';
		const root = parseXml(source).root;
		expect(root.attrs.other).toBe("x>y");
		expect(root.attrs.formula).toBe("a > b");
	});

	it("writes a childless element as self-closing", () => {
		expect(roundTrip("<w:br></w:br>")).toBe("<w:br/>");
	});

	it("preserves whitespace inside an element", () => {
		expect(roundTrip('<w:t xml:space="preserve"> lead </w:t>')).toBe(
			'<w:t xml:space="preserve"> lead </w:t>',
		);
	});

	it("rejects mismatched and unclosed tags rather than guessing", () => {
		expect(() => parseXml("<a><b></a></b>")).toThrow(XmlParseError);
		expect(() => parseXml("<a><b></b>")).toThrow(XmlParseError);
		expect(() => parseXml("no elements here")).toThrow(XmlParseError);
	});

	it("handles single-quoted attribute values", () => {
		expect(parseXml("<a b='c'/>").root.attrs.b).toBe("c");
	});
});

describe("walking", () => {
	const root = parseXml(
		"<body><w:p><w:r><w:t>one</w:t></w:r></w:p><w:p><w:r><w:t>two</w:t></w:r></w:p><w:tbl/></body>",
	).root;

	it("finds direct children by name", () => {
		expect(childrenNamed(root, "w:p")).toHaveLength(2);
		expect(childNamed(root, "w:tbl")?.name).toBe("w:tbl");
		expect(childNamed(root, "w:r")).toBeUndefined();
	});

	it("finds descendants by name", () => {
		expect(findElement(root, "w:t")?.name).toBe("w:t");
		expect(findElements(root, "w:t").map(textContent)).toEqual(["one", "two"]);
	});
});

describe("parseHtmlFragment", () => {
	it("accepts void elements written without a closing slash", () => {
		const root = parseHtmlFragment('<p>a<br>b</p><img src="x.png"><hr>');
		expect(root.children).toHaveLength(3);
		expect(findElement(root, "img")?.attrs.src).toBe("x.png");
	});

	it("wraps several top-level blocks in one root", () => {
		const root = parseHtmlFragment("<h1>a</h1><p>b</p>");
		expect(childrenNamed(root, "h1")).toHaveLength(1);
		expect(childrenNamed(root, "p")).toHaveLength(1);
	});

	it("decodes the entities a serialiser emits", () => {
		expect(textContent(parseHtmlFragment("<p>a &amp; b&nbsp;c</p>"))).toBe(
			"a & b c",
		);
	});
});
