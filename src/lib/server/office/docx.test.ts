import { describe, expect, it } from "bun:test";
import { pixelSize, UnsupportedPictureError } from "./docx-media";
import { blankDocument } from "./docx-package";
import { docxToHtml } from "./docx-read";
import { htmlToDocx } from "./docx-write";
import { DRAWING_RUN, PIXEL_PNG, wordDocument } from "./test-utils";
import { partText, readZip, writeZip } from "./zip";

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

	it("reads font, size, colours and vertical alignment", () => {
		const html = docxToHtml(
			open(
				paragraph(
					run(
						"x",
						'<w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:color w:val="DC2626"/><w:sz w:val="28"/><w:highlight w:val="yellow"/><w:vertAlign w:val="superscript"/></w:rPr>',
					),
				),
			),
		);
		expect(html).toBe(
			'<p><span style="font-family: Georgia; font-size: 14pt; color: #dc2626; background-color: #ffff00;" data-font-family="Georgia" data-font-size="14pt" data-text-color="#dc2626" data-background-color="#ffff00"><strong><sup>x</sup></strong></span></p>',
		);
	});

	it("leaves black, automatic colour and theme fonts to the defaults", () => {
		const html = docxToHtml(
			open(
				paragraph(
					run(
						"x",
						'<w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:ascii="Calibri"/><w:color w:val="000000"/><w:shd w:val="clear" w:fill="auto"/></w:rPr>',
					) + run("y", '<w:rPr><w:color w:val="auto"/></w:rPr>'),
				),
			),
		);
		expect(html).toBe("<p>xy</p>");
	});

	it("reads line spacing and a left indent", () => {
		const html = docxToHtml(
			open(
				paragraph(
					run("x"),
					'<w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/><w:ind w:left="720"/><w:jc w:val="right"/></w:pPr>',
				) +
					paragraph(
						run("exact"),
						'<w:pPr><w:spacing w:line="300" w:lineRule="exact"/></w:pPr>',
					),
			),
		);
		expect(html).toBe(
			'<p style="text-align:right;line-height:1.15;margin-left:36pt;">x</p><p>exact</p>',
		);
	});

	it("reads a header row and merged cells", () => {
		const cell = (value: string, properties = "") =>
			`<w:tc>${properties}${paragraph(run(value))}</w:tc>`;
		const html = docxToHtml(
			open(
				`<w:tbl><w:tr><w:trPr><w:tblHeader/></w:trPr>${cell(
					"h",
					'<w:tcPr><w:gridSpan w:val="2"/></w:tcPr>',
				)}</w:tr><w:tr>${cell(
					"a",
					'<w:tcPr><w:vMerge w:val="restart"/></w:tcPr>',
				)}${cell("b")}</w:tr><w:tr>${cell(
					"",
					"<w:tcPr><w:vMerge/></w:tcPr>",
				)}${cell("c")}</w:tr></w:tbl>`,
			),
		);
		expect(html).toBe(
			'<table><tbody><tr><th colspan="2"><p>h</p></th></tr><tr><td rowspan="2"><p>a</p></td><td><p>b</p></td></tr><tr><td><p>c</p></td></tr></tbody></table>',
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

	it("round-trips alignment as w:jc", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(
			entries,
			'<h1 style="text-align:center;">T</h1><p style="text-align:justify;">x</p><p>y</p>',
		);
		expect(documentXml(entries)).toContain('<w:jc w:val="both"/>');
		expect(docxToHtml(entries)).toBe(
			'<h1 style="text-align:center;">T</h1><p style="text-align:justify;">x</p><p>y</p>',
		);
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

	it("writes the editor's character formatting as run properties", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(
			entries,
			'<p><span style="font-family: &quot;Times New Roman&quot;, Times, serif;" data-font-family="&quot;Times New Roman&quot;, Times, serif">a</span>' +
				'<span style="font-size: 14pt;" data-font-size="14pt">b</span>' +
				'<span style="color: #dc2626;" data-text-color="#dc2626">c</span>' +
				'<span style="background-color: #fef08a;" data-background-color="#fef08a">d</span>' +
				"<sup>e</sup><sub>f</sub></p>",
		);
		const xml = documentXml(entries);
		expect(xml).toContain(
			'<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>',
		);
		expect(xml).toContain('<w:sz w:val="28"/><w:szCs w:val="28"/>');
		expect(xml).toContain('<w:color w:val="DC2626"/>');
		expect(xml).toContain(
			'<w:shd w:val="clear" w:color="auto" w:fill="FEF08A"/>',
		);
		expect(xml).toContain('<w:vertAlign w:val="superscript"/>');
		expect(xml).toContain('<w:vertAlign w:val="subscript"/>');
	});

	it("round-trips character formatting", () => {
		const html =
			'<p><span style="font-family: Georgia; font-size: 10.5pt; color: #2563eb; background-color: #ffff00;" data-font-family="Georgia" data-font-size="10.5pt" data-text-color="#2563eb" data-background-color="#ffff00"><strong><u>x</u></strong></span><sub>2</sub></p>';
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, html);
		expect(documentXml(entries)).toContain('<w:highlight w:val="yellow"/>');
		expect(docxToHtml(entries)).toBe(html);
	});

	it("orders run properties the way Word validates them", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(
			entries,
			'<p><u><strong><span style="color: #dc2626; font-family: Arial;">x</span></strong></u></p>',
		);
		expect(documentXml(entries)).toContain(
			'<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:b/><w:color w:val="DC2626"/><w:u w:val="single"/></w:rPr>',
		);
	});

	it("reads pasted rgb() colours and ignores a transparent background", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(
			entries,
			'<p><span style="color: rgb(37, 99, 235); background-color: rgba(0, 0, 0, 0);">x</span></p>',
		);
		expect(documentXml(entries)).toContain('<w:color w:val="2563EB"/>');
		expect(documentXml(entries)).not.toContain("w:shd");
	});

	it("round-trips line spacing and indent in schema order", () => {
		const html =
			'<p style="text-align:center;line-height:1.5;margin-left:36pt;">x</p><h2 style="line-height:2;">T</h2>';
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, html);
		expect(documentXml(entries)).toContain(
			'<w:pPr><w:spacing w:line="360" w:lineRule="auto"/><w:ind w:left="720"/><w:jc w:val="center"/></w:pPr>',
		);
		expect(docxToHtml(entries)).toBe(html);
	});

	it("gives a list item one set of properties, its list's indent included", () => {
		const entries = open(
			paragraph(
				run("x"),
				'<w:pPr><w:pStyle w:val="ListBullet"/><w:ind w:left="360"/></w:pPr>',
			),
		);
		htmlToDocx(
			entries,
			'<ul><li><p style="text-align:center;margin-left:72pt;">one</p></li></ul>',
		);
		const xml = documentXml(entries);
		expect(xml.match(/<w:pPr>/g)).toHaveLength(1);
		expect(xml).toContain(
			'<w:pPr><w:pStyle w:val="ListBullet"/><w:ind w:left="360"/><w:jc w:val="center"/></w:pPr>',
		);
		expect(docxToHtml(entries)).toBe(
			'<ul><li><p style="text-align:center;">one</p></li></ul>',
		);
	});

	it("round-trips a header row and merged cells", () => {
		const html =
			'<table><tbody><tr><th colspan="2"><p>h</p></th></tr><tr><td rowspan="2"><p>a</p></td><td><p>b</p></td></tr><tr><td><p>c</p></td></tr></tbody></table>';
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, html);
		const xml = documentXml(entries);
		expect(xml).toContain("<w:trPr><w:tblHeader/></w:trPr>");
		expect(xml).toContain('<w:gridSpan w:val="2"/>');
		expect(xml).toContain('<w:vMerge w:val="restart"/>');
		expect(xml).toContain("<w:tcPr><w:vMerge/></w:tcPr>");
		expect(docxToHtml(entries)).toBe(html);
	});

	it("keeps a nested table's rows out of the table around it", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(
			entries,
			"<table><tbody><tr><td><table><tbody><tr><td><p>in</p></td></tr></tbody></table></td></tr></tbody></table>",
		);
		expect(documentXml(entries).match(/<w:tr>/g)).toHaveLength(2);
	});
});

describe("blankDocument", () => {
	it("is a package the reader opens, with every style the writer names", () => {
		const entries = readZip(writeZip(blankDocument()));
		const html =
			'<h1>Title</h1><h3>Small</h3><p>Plain <a href="https://a.example">link</a></p>' +
			"<blockquote><p>said</p></blockquote>" +
			"<ul><li><p>one</p><ul><li><p>deeper</p></li></ul></li></ul><ol><li><p>first</p></li></ol>" +
			"<table><tbody><tr><th><p>h</p></th></tr><tr><td><p>c</p></td></tr></tbody></table>";
		htmlToDocx(entries, html);
		const xml = documentXml(entries);

		expect(xml).toContain('<w:pStyle w:val="ListBullet2"/>');
		expect(xml).toContain('<w:rStyle w:val="Hyperlink"/>');
		expect(xml).toContain('<w:tblStyle w:val="TableGrid"/>');
		expect(docxToHtml(entries)).toBe(html);
	});
});

describe("code", () => {
	const blank = () => readZip(writeZip(blankDocument()));

	it("round-trips a code block with its language and indentation", () => {
		const html =
			'<pre data-language="ts"><code class="language-ts">if (a) {\n\treturn &lt;b&gt;;\n}\n</code></pre><p>after</p>';
		const entries = blank();
		htmlToDocx(entries, html);
		const xml = documentXml(entries);
		expect(xml).toContain('<w:tag w:val="penombre-code:ts"/>');
		expect(xml).toContain('<w:pStyle w:val="Code"/>');
		expect(xml).toContain("<w:tab/>");
		expect(docxToHtml(entries)).toBe(html);
	});

	it("keeps two code blocks in a row apart", () => {
		const html = "<pre><code>a</code></pre><pre><code>b</code></pre>";
		const entries = blank();
		htmlToDocx(entries, html);
		expect(docxToHtml(entries)).toBe(html);
	});

	it("reads Word's own code paragraphs as one block", () => {
		const html = docxToHtml(
			open(
				paragraph(run("one"), style("HTMLPreformatted")) +
					paragraph(run("two"), style("HTMLPreformatted")) +
					paragraph(run("prose")),
			),
		);
		expect(html).toBe("<pre><code>one\ntwo</code></pre><p>prose</p>");
	});

	it("draws code without a Code style where the document has none", () => {
		const entries = open(paragraph(run("x")));
		htmlToDocx(entries, "<pre><code>x</code></pre><p><code>y</code></p>");
		const xml = documentXml(entries);
		expect(xml).not.toContain("w:pStyle");
		expect(xml).toContain('w:ascii="Courier New"');
		expect(docxToHtml(entries)).toStartWith("<pre><code>x</code></pre>");
	});

	it("round-trips inline code through its character style", () => {
		const html = "<p>run <code>npm i</code> first</p>";
		const entries = blank();
		htmlToDocx(entries, html);
		expect(documentXml(entries)).toContain('<w:rStyle w:val="CodeChar"/>');
		expect(docxToHtml(entries)).toBe(html);
	});

	it("reads the text inside a content control Word added", () => {
		const html = docxToHtml(
			open(
				`<w:sdt><w:sdtPr><w:alias w:val="Contents"/></w:sdtPr><w:sdtContent>${paragraph(run("inside"))}</w:sdtContent></w:sdt>`,
			),
		);
		expect(html).toBe("<p>inside</p>");
	});

	it("ends a table cell with a paragraph, as Word requires", () => {
		const entries = blank();
		htmlToDocx(
			entries,
			"<table><tbody><tr><td><pre><code>x</code></pre></td></tr></tbody></table>",
		);
		expect(documentXml(entries)).toContain("</w:sdt><w:p/></w:tc>");
		expect(docxToHtml(entries)).toContain("<td><pre><code>x</code></pre>");
	});
});

describe("pictures", () => {
	const png = `data:image/png;base64,${PIXEL_PNG.toString("base64")}`;
	const media = (entries: ReturnType<typeof readZip>) =>
		entries.filter((entry) => entry.name.startsWith("word/media/penombre-"));

	it("adds a new picture as a media part, drawn at its own size", () => {
		const entries = readZip(writeZip(blankDocument()));
		htmlToDocx(entries, `<p>a</p><img src="${png}"><p>b</p>`);

		expect(media(entries).map((entry) => entry.name)).toEqual([
			"word/media/penombre-1.png",
		]);
		const rels = partText(entries, "word/_rels/document.xml.rels") ?? "";
		expect(rels).toContain('Target="media/penombre-1.png"');
		expect(partText(entries, "[Content_Types].xml")).toContain(
			'<Default Extension="png" ContentType="image/png"/>',
		);
		// One pixel at 96 dpi.
		expect(documentXml(entries)).toContain('<wp:extent cx="9525" cy="9525"/>');
		expect(docxToHtml(entries)).toBe(
			`<p>a</p><p><img src="${png}"></p><p>b</p>`,
		);
	});

	it("reuses the part on the next save and drops it once deleted", () => {
		const entries = readZip(writeZip(blankDocument()));
		htmlToDocx(entries, `<img src="${png}"><img src="${png}">`);
		expect(media(entries)).toHaveLength(1);
		htmlToDocx(entries, docxToHtml(entries));
		expect(media(entries)).toHaveLength(1);

		htmlToDocx(entries, "<p>gone</p>");
		expect(media(entries)).toHaveLength(0);
		expect(partText(entries, "word/_rels/document.xml.rels")).not.toContain(
			"penombre-",
		);
	});

	it("never deletes a picture Word put there", () => {
		const entries = open(paragraph(DRAWING_RUN));
		htmlToDocx(entries, "<p>no pictures</p>");
		expect(entries.some((entry) => entry.name === "word/media/pic.png")).toBe(
			true,
		);
	});

	it("shrinks a picture wider than the text to the text's width", () => {
		const wide = Buffer.from(PIXEL_PNG);
		wide.writeUInt32BE(4000, 16);
		wide.writeUInt32BE(1000, 20);
		const entries = readZip(writeZip(blankDocument()));
		htmlToDocx(
			entries,
			`<img src="data:image/png;base64,${wide.toString("base64")}">`,
		);
		// A4 less two inches: 9026 twips.
		expect(documentXml(entries)).toContain(
			'<wp:extent cx="5731510" cy="1432878"/>',
		);
	});

	it("refuses a format Word cannot draw", () => {
		const entries = readZip(writeZip(blankDocument()));
		expect(() =>
			htmlToDocx(entries, '<img src="data:image/webp;base64,UklGRg==">'),
		).toThrow(UnsupportedPictureError);
	});
});

describe("pixelSize", () => {
	it("reads PNG, GIF and JPEG headers", () => {
		expect(pixelSize(new Uint8Array(PIXEL_PNG))).toEqual({
			width: 1,
			height: 1,
		});
		const gif = Buffer.from("GIF89a\x02\x00\x03\x00", "latin1");
		expect(pixelSize(new Uint8Array(gif))).toEqual({ width: 2, height: 3 });
		const jpeg = Buffer.from([
			0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11,
			0x08, 0x00, 0x20, 0x00, 0x40, 0x03,
		]);
		expect(pixelSize(new Uint8Array(jpeg))).toEqual({ width: 64, height: 32 });
		expect(pixelSize(new Uint8Array([1, 2, 3]))).toBeNull();
	});
});

describe("what else the editor offers", () => {
	const blank = () => readZip(writeZip(blankDocument()));

	it("round-trips a check list through a box glyph", () => {
		const entries = blank();
		htmlToDocx(
			entries,
			'<div class="prosemirror-flat-list" data-list-kind="task" data-list-checked=""><div class="list-marker"><input type="checkbox" checked=""></div><div class="list-content"><p>done</p></div></div>' +
				'<div class="prosemirror-flat-list" data-list-kind="task"><div class="list-content"><p>to do</p></div></div>',
		);
		expect(documentXml(entries)).toContain("☒ </w:t>");
		expect(docxToHtml(entries)).toBe(
			'<ul><li><input type="checkbox" checked=""><p>done</p></li><li><input type="checkbox"><p>to do</p></li></ul>',
		);
	});

	it("round-trips a divider", () => {
		const entries = blank();
		htmlToDocx(entries, "<p>a</p><hr><p>b</p>");
		expect(docxToHtml(entries)).toBe("<p>a</p><hr><p>b</p>");
	});

	it("gives a new table the column grid Word expects", () => {
		const entries = blank();
		htmlToDocx(
			entries,
			'<table><tbody><tr><td colspan="2"><p>a</p></td><td><p>b</p></td></tr></tbody></table>',
		);
		expect(documentXml(entries)).toContain(
			'<w:tblGrid><w:gridCol w:w="3008"/><w:gridCol w:w="3008"/><w:gridCol w:w="3008"/></w:tblGrid>',
		);
	});
});
