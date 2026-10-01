import { describe, expect, it } from "bun:test";
import type { ContentTable, ContentText } from "pdfmake/interfaces";
import { TEMPLATE_IDS } from "#lib/slides/templates/index.js";
import { blankFile } from "../blank";
import { docxToHtml } from "../docx-read";
import { slidesPdfPages, templatePackage } from "../slides";
import { PIXEL_PNG } from "../test-utils";
import { readWorkbook, workbookToText } from "../xlsx";
import { readZip } from "../zip";
import { ExportFormatError, ExportUnavailableError, exportFile } from "./index";
import { readHtml } from "./model";
import { documentPdf, pdfFont, TEXT_WIDTH, tableBody } from "./pdf-document";
import { SheetTooLargeError, sheetsPdf, usedArea } from "./sheet-pdf";
import { toHtmlPage, toMarkdown, toText } from "./text";

const PNG = `data:image/png;base64,${PIXEL_PNG.toString("base64")}`;
const bytes = (text: string) => new TextEncoder().encode(text).buffer;
const text = (data: Uint8Array) => new TextDecoder().decode(data);

/** What the editor writes: ProseKit's flat lists, a task item, code, a table. */
const EDITOR_HTML =
	'<div><h1 style="text-align:center;">Plan</h1>' +
	'<p>Say <strong>hi</strong> to <a href="https://a.example">them</a> <em> now </em></p>' +
	'<div class="prosemirror-flat-list" data-list-kind="bullet"><div class="list-marker"></div><div class="list-content"><p>one</p>' +
	'<div class="prosemirror-flat-list" data-list-kind="ordered"><div class="list-content"><p>deep</p></div></div></div></div>' +
	'<div class="prosemirror-flat-list" data-list-kind="bullet"><div class="list-content"><p>two</p></div></div>' +
	'<div class="prosemirror-flat-list" data-list-kind="task" data-list-checked=""><div class="list-marker"><input type="checkbox" checked=""></div><div class="list-content"><p>done</p></div></div>' +
	'<pre data-language="rust"><code class="language-rust">fn main() {\n\tprintln!("hi");\n}</code></pre>' +
	'<table><tbody><tr><th colspan="2"><p>h</p></th></tr><tr><td rowspan="2"><p>a</p></td><td><p>b | c</p></td></tr><tr><td><p>d</p></td></tr></tbody></table>' +
	`<p>before</p><img src="${PNG}"><hr></div>`;

describe("readHtml", () => {
	const blocks = readHtml(EDITOR_HTML);

	it("keeps the structure every format needs", () => {
		expect(blocks.map((block) => block.type)).toEqual([
			"heading",
			"paragraph",
			"list",
			"list",
			"code",
			"table",
			"paragraph",
			"image",
			"rule",
		]);
		expect(blocks[0]).toMatchObject({ level: 1, align: "center" });
		expect(blocks[4]).toEqual({
			type: "code",
			language: "rust",
			text: 'fn main() {\n\tprintln!("hi");\n}',
		});
	});

	it("gathers consecutive flat-list items of one kind into one list", () => {
		const [bullets, tasks] = blocks.filter((block) => block.type === "list");
		expect(bullets).toMatchObject({ kind: "bullet" });
		expect(bullets?.type === "list" && bullets.items).toHaveLength(2);
		expect(tasks).toMatchObject({ kind: "task", items: [{ checked: true }] });
	});

	it("drops a link that would run script", () => {
		const [paragraph] = readHtml('<p><a href="javascript:alert(1)">x</a></p>');
		expect(paragraph).toEqual({
			type: "paragraph",
			runs: [{ text: "x", marks: {} }],
		});
	});

	it("reads a check list from a Word document", () => {
		expect(
			readHtml(
				'<ul><li><input type="checkbox" checked=""><p>a</p></li><li><input type="checkbox"><p>b</p></li></ul>',
			),
		).toEqual([
			{
				type: "list",
				kind: "task",
				items: [
					{
						checked: true,
						blocks: [{ type: "paragraph", runs: [{ text: "a", marks: {} }] }],
					},
					{
						checked: false,
						blocks: [{ type: "paragraph", runs: [{ text: "b", marks: {} }] }],
					},
				],
			},
		]);
	});

	it("takes a picture out of the paragraph it sits in", () => {
		expect(
			readHtml(`<p>a<img src="${PNG}">b</p>`).map((block) => block.type),
		).toEqual(["paragraph", "image", "paragraph"]);
	});

	it("reads the editor's font, size and colours", () => {
		const [paragraph] = readHtml(
			'<p><span style="font-family: Georgia; font-size: 14pt; color: rgb(220, 38, 38);" data-font-family="Georgia">x</span></p>',
		);
		expect(paragraph).toMatchObject({
			runs: [{ marks: { font: "Georgia", size: 14, color: "#dc2626" } }],
		});
	});
});

describe("documentPdf", () => {
	const definition = documentPdf(readHtml(EDITOR_HTML), "Plan");
	const content = definition.content as Record<string, unknown>[];

	it("is A4 with the title as metadata", () => {
		expect(definition).toMatchObject({
			pageSize: "A4",
			info: { title: "Plan" },
		});
	});

	it("draws headings, links and code in the right faces", () => {
		expect(content[0]).toMatchObject({
			fontSize: 20,
			bold: true,
			alignment: "center",
		});
		const runs = (content[1] as ContentText).text as ContentText[];
		expect(runs).toContainEqual(
			expect.objectContaining({ text: "them", link: "https://a.example" }),
		);
		const code = content[4] as ContentTable;
		expect(code.table.body[0]?.[0]).toMatchObject({
			fillColor: "#f3f4f6",
			stack: [{ font: "Courier", preserveLeadingSpaces: true }],
		});
	});

	it("never picks a standard face for text it cannot encode", () => {
		expect(pdfFont("Courier New", "plain")).toBe("Courier");
		expect(pdfFont("Georgia", "café")).toBe("Times");
		expect(pdfFont("Courier New", "привет")).toBeUndefined();
		expect(pdfFont("Arial", "plain")).toBeUndefined();
	});

	it("makes a table with spans rectangular", () => {
		const table = readHtml(EDITOR_HTML).find((block) => block.type === "table");
		const body = tableBody(table?.type === "table" ? table.rows : []);
		expect(body.map((row) => row.length)).toEqual([2, 2, 2]);
		expect(body[0]?.[0]).toMatchObject({ colSpan: 2, bold: true });
		expect(body[1]?.[0]).toMatchObject({ rowSpan: 2 });
		expect(body[2]?.[0]).toEqual({});
	});

	it("sizes a picture from its header, never wider than the text", () => {
		const image = content.find((item) => "image" in item);
		expect(image).toMatchObject({ image: PNG, width: 0.75 });
		const [wide] = documentPdf([{ type: "image", src: PNG, width: 5000 }], "x")
			.content as { width: number }[];
		expect(wide?.width).toBe(TEXT_WIDTH);
	});
});

describe("text formats", () => {
	const blocks = readHtml(EDITOR_HTML);

	it("writes Markdown", () => {
		expect(toMarkdown(blocks)).toBe(
			[
				"# Plan",
				"Say **hi** to [them](<https://a.example>)  *now* ",
				"- one\n  1. deep\n- two",
				"- [x] done",
				'```rust\nfn main() {\n\tprintln!("hi");\n}\n```',
				"| h |  |\n| --- | --- |\n| a | b \\| c |\n|  | d |",
				"before",
				`![](${PNG})`,
				"---",
			].join("\n\n") + "\n",
		);
	});

	it("fences code that holds a fence", () => {
		expect(
			toMarkdown([{ type: "code", language: "", text: "```\nx\n```" }]),
		).toBe("````\n```\nx\n```\n````\n");
	});

	it("keeps a paragraph that starts like a list from becoming one", () => {
		expect(
			toMarkdown([
				{ type: "paragraph", runs: [{ text: "- not a list", marks: {} }] },
			]),
		).toBe("\\- not a list\n");
	});

	it("writes plain text", () => {
		expect(toText(blocks)).toContain("- one\n  1. deep\n- two");
		expect(toText(blocks)).toContain("[x] done");
		expect(toText(blocks)).toContain("h\t\na\tb | c\n\td");
	});

	it("writes a page that escapes what it quotes", () => {
		const page = toHtmlPage(
			readHtml("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"),
			"<b>t</b>",
		);
		expect(page).toStartWith("<!doctype html>");
		expect(page).toContain("<title>&lt;b&gt;t&lt;/b&gt;</title>");
		expect(page).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
		expect(toHtmlPage(blocks, "x")).toContain(
			'<ul class="tasks"><li><input type="checkbox" disabled checked> <p>done</p></li></ul>',
		);
	});
});

describe("sheetsPdf", () => {
	it("shows a formula's result on landscape pages, one sheet each", () => {
		const definition = sheetsPdf(
			[
				{
					name: "Budget",
					rows: [
						["a", "1"],
						["b", "2"],
						["=SUM(B1:B2)", ""],
						["", ""],
					],
				},
				{ name: "Other", rows: [["=Budget!B1*10"]] },
			],
			"Book",
		);
		expect(definition.pageOrientation).toBe("landscape");
		const [title, table, second, other] = definition.content as ContentTable[];
		expect(title).toMatchObject({ text: "Budget" });
		expect(table?.table.body).toEqual([
			["a", "1"],
			["b", "2"],
			["3", ""],
		]);
		expect(second).toMatchObject({ text: "Other", pageBreak: "before" });
		expect(other?.table.body).toEqual([["10"]]);
	});

	it("measures the used area, not the grid", () => {
		expect(
			usedArea([
				["", "x", ""],
				["", "", ""],
			]),
		).toEqual({ height: 1, width: 2 });
	});

	it("refuses a sheet too big to lay out", () => {
		const rows = Array.from({ length: 1001 }, () => Array(101).fill("x"));
		expect(() => sheetsPdf([{ name: "Big", rows }], "x")).toThrow(
			SheetTooLargeError,
		);
	});
});

describe("exportFile", () => {
	it("hands back a file's own format untouched", async () => {
		const source = bytes("a,b\n");
		const exported = await exportFile("t.csv", source, "csv");
		expect(text(exported.data)).toBe("a,b\n");
		expect(exported.filename).toBe("t.csv");
	});

	it("wraps a legacy document's fragment in a page", async () => {
		const page = await exportFile("Plan.html", bytes("<p>x</p>"), "html");
		expect(text(page.data)).toStartWith("<!doctype html>");
	});

	it("turns a legacy document into Word", async () => {
		const exported = await exportFile(
			"Plan.html",
			bytes("<h1>Plan</h1><p>x</p>"),
			"docx",
		);
		expect(docxToHtml(readZip(exported.data))).toBe("<h1>Plan</h1><p>x</p>");
		expect(exported.filename).toBe("Plan.docx");
	});

	it("turns a CSV into a workbook and a workbook into shown values", async () => {
		const xlsx = await exportFile("t.csv", bytes("a,1\nb,=B1*2\n"), "xlsx");
		expect(readWorkbook(readZip(xlsx.data))[0]?.rows).toEqual([
			["a", "1"],
			["b", "=B1*2"],
		]);
		const csv = await exportFile(
			"t.xlsx",
			new Uint8Array(xlsx.data).buffer,
			"csv",
		);
		expect(text(csv.data)).toBe("a,1\nb,2\n");
	});

	it("renders a real PDF", async () => {
		const pdf = await exportFile("Plan.html", bytes(EDITOR_HTML), "pdf");
		expect(text(pdf.data.slice(0, 5))).toBe("%PDF-");
		expect(pdf.contentType).toBe("application/pdf");
	});

	it("refuses a format the kind has not got", async () => {
		await expect(exportFile("t.csv", bytes(""), "docx")).rejects.toThrow(
			ExportFormatError,
		);
		await expect(exportFile("notes.txt", bytes(""), "pdf")).rejects.toThrow(
			ExportFormatError,
		);
	});

	it("draws each shown slide on its own PDF page", async () => {
		for (const id of TEMPLATE_IDS) {
			const pptx = templatePackage(id, "Deck");
			if (!pptx) {
				throw new Error(`no template ${id}`);
			}
			const pdf = await exportFile(
				"Deck.pptx",
				new Uint8Array(pptx).buffer,
				"pdf",
			);
			const pages = text(pdf.data).match(/\/Type \/Page\b/g) ?? [];
			expect(pages.length).toBe(slidesPdfPages(pptx).length);
		}
	});

	it("does not export a Markdown deck", async () => {
		await expect(exportFile("deck.md", bytes("# a"), "pdf")).rejects.toThrow(
			ExportUnavailableError,
		);
	});
});

describe("blank files", () => {
	it("opens a new document and a new workbook in the readers", () => {
		expect(docxToHtml(readZip(blankFile("document")))).toBe("<h1></h1><p></p>");
		expect(JSON.parse(workbookToText(readZip(blankFile("sheet"))))).toEqual({
			nextId: 2,
			sheets: [{ id: 1, name: "Sheet1", rows: [[""]] }],
		});
	});
});
