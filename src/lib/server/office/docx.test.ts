import { describe, expect, it } from "bun:test";
import { docxToHtml } from "./docx-read";
import { htmlToDocx } from "./docx-write";
import { DRAWING_RUN, wordDocument } from "./test-utils";
import { partText, readZip } from "./zip";

const paragraph = (runs: string, properties = ""): string =>
	`<w:p>${properties}${runs}</w:p>`;
const run = (value: string, properties = ""): string =>
	`<w:r>${properties}<w:t>${value}</w:t></w:r>`;
const style = (id: string): string =>
	`<w:pPr><w:pStyle w:val="${id}"/></w:pPr>`;

const open = (body: string) => readZip(wordDocument({ body }));
const documentXml = (entries: ReturnType<typeof readZip>): string =>
	partText(entries, "word/document.xml") ?? "";

describe("docxToHtml", () => {
	it("maps headings, marks and plain text", () => {
		const html = docxToHtml(
			open(
				paragraph(run("Title"), style("Heading1")) +
					paragraph(
						`${run("plain ")}${run("bold", "<w:rPr><w:b/></w:rPr>")}${run(
							"italic",
							"<w:rPr><w:i/></w:rPr>",
						)}${run("under", '<w:rPr><w:u w:val="single"/></w:rPr>')}${run(
							"struck",
							"<w:rPr><w:strike/></w:rPr>",
						)}`,
					),
			),
		);
		expect(html).toBe(
			"<h1>Title</h1><p>plain <strong>bold</strong><em>italic</em><u>under</u><s>struck</s></p>",
		);
	});

	it("does not treat a disabled mark as on", () => {
		const html = docxToHtml(
			open(paragraph(run("x", '<w:rPr><w:b w:val="0"/></w:rPr>'))),
		);
		expect(html).toBe("<p>x</p>");
	});

	it("escapes text that would otherwise be markup", () => {
		expect(docxToHtml(open(paragraph(run("a &amp; b &lt;c&gt;"))))).toBe(
			"<p>a &amp; b &lt;c&gt;</p>",
		);
	});

	it("rebuilds a list from paragraphs that share a numbering reference", () => {
		const html = docxToHtml(
			open(
				paragraph(run("one"), style("ListBullet")) +
					paragraph(run("two"), style("ListBullet")) +
					paragraph(run("first"), style("ListNumber")) +
					paragraph(run("after")),
			),
		);
		expect(html).toBe(
			"<ul><li><p>one</p></li><li><p>two</p></li></ul><ol><li><p>first</p></li></ol><p>after</p>",
		);
	});

	it("reads numbering written on the paragraph as well as on its style", () => {
		const html = docxToHtml(
			open(
				paragraph(
					run("direct"),
					'<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>',
				),
			),
		);
		expect(html).toBe("<ul><li><p>direct</p></li></ul>");
	});

	it("nests a deeper list level inside the one above it", () => {
		const html = docxToHtml(
			open(
				paragraph(
					run("top"),
					'<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>',
				) +
					paragraph(
						run("under"),
						'<w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr>',
					),
			),
		);
		expect(html).toBe(
			"<ul><li><p>top</p><ul><li><p>under</p></li></ul></li></ul>",
		);
	});

	it("maps a table and a quote", () => {
		const html = docxToHtml(
			open(
				`<w:tbl><w:tr><w:tc>${paragraph(run("a"))}</w:tc><w:tc>${paragraph(
					run("b"),
				)}</w:tc></w:tr></w:tbl>${paragraph(run("said"), style("Quote"))}`,
			),
		);
		expect(html).toBe(
			"<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table><blockquote><p>said</p></blockquote>",
		);
	});

	it("resolves a hyperlink to its target", () => {
		const entries = readZip(
			wordDocument({
				body: paragraph(
					`<w:hyperlink r:id="rId5">${run("here")}</w:hyperlink>`,
				),
				rels: '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>',
			}),
		);
		expect(docxToHtml(entries)).toBe(
			'<p><a href="https://example.com">here</a></p>',
		);
	});

	it("hands an embedded image to the editor as a data URL", () => {
		const html = docxToHtml(open(paragraph(DRAWING_RUN)));
		expect(html).toStartWith('<p><img src="data:image/png;base64,');
	});

	it("maps a line break", () => {
		expect(docxToHtml(open(paragraph("<w:r><w:br/><w:t>x</w:t></w:r>")))).toBe(
			"<p><br>x</p>",
		);
	});

	it("gives an empty document something to type into", () => {
		expect(docxToHtml(open(""))).toBe("<p></p>");
	});
});

describe("htmlToDocx", () => {
	it("round-trips its own output", () => {
		const entries = open(
			paragraph(run("Title"), style("Heading1")) +
				paragraph(`${run("a ")}${run("b", "<w:rPr><w:b/></w:rPr>")}`) +
				paragraph(run("one"), style("ListBullet")),
		);
		const html = docxToHtml(entries);
		htmlToDocx(entries, html);
		expect(docxToHtml(entries)).toBe(html);
	});

	it("keeps the section properties, which are the page itself", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, "<p>y</p>");
		expect(documentXml(entries)).toContain("<w:sectPr>");
	});

	it("writes an image back as the run that already drew it", () => {
		const entries = open(paragraph(DRAWING_RUN));
		htmlToDocx(entries, docxToHtml(entries));
		expect(documentXml(entries)).toContain('r:embed="rId9"');
	});

	it("keeps an image that the editor serialised as its own block", () => {
		// ProseKit puts the `<img>` beside the paragraphs rather than inside
		// one. Treating that as an unknown block dropped every picture.
		const entries = open(paragraph(DRAWING_RUN));
		const source = /<img src="([^"]+)"/.exec(docxToHtml(entries))?.[1] ?? "";
		htmlToDocx(entries, `<div><p></p><img src="${source}"><p>after</p></div>`);
		expect(documentXml(entries)).toContain('r:embed="rId9"');
	});

	it("reads ProseKit's flat lists, marker divs and all", () => {
		const entries = open(paragraph(run("x"), style("ListBullet")));
		htmlToDocx(
			entries,
			'<div><div class="prosemirror-flat-list" data-list-kind="bullet">' +
				'<div class="list-marker" contenteditable="false"></div>' +
				'<div class="list-content"><p>one</p></div></div>' +
				'<div class="prosemirror-flat-list" data-list-kind="ordered">' +
				'<div class="list-content"><p>two</p></div></div></div>',
		);
		expect(docxToHtml(entries)).toBe(
			"<ul><li><p>one</p></li></ul><ol><li><p>two</p></li></ol>",
		);
	});

	it("names a list style the document actually defines", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, "<ul><li><p>one</p></li></ul>");
		expect(documentXml(entries)).toContain('w:val="ListBullet"');
	});

	it("preserves the spaces at the edges of a run", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, "<p>a <strong>b</strong> c</p>");
		expect(documentXml(entries)).toContain('xml:space="preserve"');
		expect(docxToHtml(entries)).toBe("<p>a <strong>b</strong> c</p>");
	});

	it("adds a relationship for a link the editor introduced", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, '<p><a href="https://new.example">go</a></p>');
		const rels = partText(entries, "word/_rels/document.xml.rels") ?? "";

		expect(rels).toContain('Target="https://new.example"');
		expect(rels).toContain('TargetMode="External"');
		expect(docxToHtml(entries)).toBe(
			'<p><a href="https://new.example">go</a></p>',
		);
	});

	it("reuses the relationship of a link that was already there", () => {
		const entries = readZip(
			wordDocument({
				body: paragraph(
					`<w:hyperlink r:id="rId5">${run("here")}</w:hyperlink>`,
				),
				rels: '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>',
			}),
		);
		htmlToDocx(entries, docxToHtml(entries));
		const rels = partText(entries, "word/_rels/document.xml.rels") ?? "";
		expect(rels.match(/https:\/\/example\.com/g)).toHaveLength(1);
	});

	it("keeps a table's layout properties", () => {
		const entries = open(
			`<w:tbl><w:tblPr><w:tblStyle w:val="Fancy"/></w:tblPr><w:tblGrid><w:gridCol w:w="100"/></w:tblGrid><w:tr><w:tc>${paragraph(
				run("a"),
			)}</w:tc></w:tr></w:tbl>`,
		);
		htmlToDocx(entries, docxToHtml(entries));
		expect(documentXml(entries)).toContain('<w:tblStyle w:val="Fancy"/>');
		expect(documentXml(entries)).toContain('<w:gridCol w:w="100"/>');
	});

	it("never rewrites styles or numbering", () => {
		const entries = open(paragraph(run("x")));
		const styles = partText(entries, "word/styles.xml");
		const numbering = partText(entries, "word/numbering.xml");
		htmlToDocx(entries, "<h1>new</h1><ul><li><p>a</p></li></ul>");

		expect(partText(entries, "word/styles.xml")).toBe(styles);
		expect(partText(entries, "word/numbering.xml")).toBe(numbering);
	});

	it("drops an image it has never seen rather than writing a broken one", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, '<p><img src="https://elsewhere.example/a.png"></p>');
		expect(documentXml(entries)).not.toContain("r:embed");
	});
});
