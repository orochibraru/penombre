import {
	bodyBlocks,
	bodyOf,
	bulletLists,
	CODE_STYLES,
	codeLanguage,
	cssColor,
	documentXml,
	embeddedId,
	HIGHLIGHT_COLORS,
	imageSources,
	type ListInfo,
	listInfo,
	type NumberingReference,
	type Relationship,
	relationships,
	styleNumbering,
	styleOf,
} from "./docx-package";
import {
	childNamed,
	childrenNamed,
	encodeXml,
	findElements,
	isElement,
	parseXml,
	textContent,
	type XmlElement,
} from "./xml";
import type { ZipEntry } from "./zip";

/** A Word document's body, as HTML the rich-text editor can parse. */

/** Heading level from a paragraph style id, or 0 when it is not a heading. */
function headingLevel(paragraph: XmlElement): number {
	const style = styleOf(paragraph);
	if (!style) {
		return 0;
	}
	if (/^Title$/i.test(style)) {
		return 1;
	}
	const match = /^Heading(\d)$/i.exec(style);
	return match ? Math.min(6, Number(match[1])) : 0;
}

/** A toggle property that is on: `<w:b/>`, but not `<w:b w:val="0"/>`. */
function isOn(properties: XmlElement, name: string): boolean {
	const node = childNamed(properties, name);
	const value = node?.attrs["w:val"];
	return node !== undefined && value !== "0" && value !== "false";
}

const VERTICAL: Record<string, string> = {
	superscript: "sup",
	subscript: "sub",
};

/** Character styles that mean inline code: ours, pandoc's, Word's `<code>`. */
const CODE_CHARACTER_STYLES = /^(CodeChar|VerbatimChar|HTMLCode)$/i;

/** The HTML tags a run's properties turn into, outermost first. */
function runTags(properties: XmlElement): string[] {
	const underline = childNamed(properties, "w:u");
	const vertical = childNamed(properties, "w:vertAlign")?.attrs["w:val"];
	const style = childNamed(properties, "w:rStyle")?.attrs["w:val"] ?? "";
	return [
		isOn(properties, "w:b") ? "strong" : "",
		isOn(properties, "w:i") ? "em" : "",
		underline && underline.attrs["w:val"] !== "none" ? "u" : "",
		isOn(properties, "w:strike") || isOn(properties, "w:dstrike") ? "s" : "",
		VERTICAL[vertical ?? ""] ?? "",
		CODE_CHARACTER_STYLES.test(style) ? "code" : "",
	].filter((tag) => tag !== "");
}

/** A font named on the run, unless it defers to the theme's. */
function runFont(properties: XmlElement): string | undefined {
	const fonts = childNamed(properties, "w:rFonts");
	if (!fonts || fonts.attrs["w:asciiTheme"] || fonts.attrs["w:hAnsiTheme"]) {
		return undefined;
	}
	return fonts.attrs["w:ascii"] ?? fonts.attrs["w:hAnsi"];
}

function runBackground(properties: XmlElement): string | undefined {
	const highlight = childNamed(properties, "w:highlight")?.attrs["w:val"];
	const fill = childNamed(properties, "w:shd")?.attrs["w:fill"];
	return cssColor(HIGHLIGHT_COLORS[highlight ?? ""] ?? fill);
}

const attribute = (value: string): string =>
	encodeXml(value).replace(/"/g, "&quot;");

/**
 * Font, size and colours as one span carrying both the style and the data
 * attributes the editor's marks read, so each value comes back exactly.
 *
 * Black reads as automatic: Google Docs writes `000000` on every run, and
 * taken literally that is invisible text on a dark theme, while Word draws
 * automatic as black on its white page anyway.
 */
function runSpan(properties: XmlElement): string {
	const size = Number(childNamed(properties, "w:sz")?.attrs["w:val"]);
	const color = cssColor(childNamed(properties, "w:color")?.attrs["w:val"]);
	const values: [string, string, string | undefined][] = [
		["font-family", "data-font-family", runFont(properties)],
		["font-size", "data-font-size", size > 0 ? `${size / 2}pt` : undefined],
		["color", "data-text-color", color === "#000000" ? undefined : color],
		["background-color", "data-background-color", runBackground(properties)],
	];
	const set = values.filter(
		(entry): entry is [string, string, string] => entry[2] !== undefined,
	);
	if (set.length === 0) {
		return "";
	}
	const style = set.map(([name, , value]) => `${name}: ${value};`).join(" ");
	const data = set.map(([, attr, value]) => ` ${attr}="${attribute(value)}"`);
	return `<span style="${attribute(style)}"${data.join("")}>`;
}

interface ReadContext {
	images: Map<string, string>;
	rels: Map<string, Relationship>;
	bullets: Map<string, boolean>;
	numbered: Map<string, NumberingReference>;
}

/** One child of a run as the HTML it contributes. */
function runChildHtml(child: XmlElement, images: Map<string, string>): string {
	switch (child.name) {
		case "w:t":
			return encodeXml(textContent(child));
		case "w:br":
			return "<br>";
		case "w:tab":
			return "\t";
		case "w:drawing":
		case "w:pict": {
			const source = images.get(embeddedId(child) ?? "");
			return source ? `<img src="${source}">` : "";
		}
		default:
			return "";
	}
}

function runHtml(run: XmlElement, images: Map<string, string>): string {
	const inner = run.children
		.filter((child): child is XmlElement => isElement(child))
		.map((child) => runChildHtml(child, images))
		.join("");
	if (inner === "") {
		return "";
	}
	const properties = childNamed(run, "w:rPr");
	if (!properties) {
		return inner;
	}
	const tags = runTags(properties);
	const span = runSpan(properties);
	const close = [...tags].reverse().map((tag) => `</${tag}>`);
	return (
		span +
		tags.map((tag) => `<${tag}>`).join("") +
		inner +
		close.join("") +
		(span ? "</span>" : "")
	);
}

/** Runs, hyperlinks and tracked insertions of a paragraph, as inline HTML. */
function inlineHtml(parent: XmlElement, context: ReadContext): string {
	let html = "";
	for (const child of parent.children) {
		if (!isElement(child)) {
			continue;
		}
		if (child.name === "w:r") {
			html += runHtml(child, context.images);
		} else if (child.name === "w:hyperlink") {
			const target = context.rels.get(child.attrs["r:id"] ?? "")?.target;
			const inner = inlineHtml(child, context);
			const href = encodeXml(target ?? "").replace(/"/g, "&quot;");
			html += target ? `<a href="${href}">${inner}</a>` : inner;
		} else if (child.name === "w:ins" || child.name === "w:smartTag") {
			html += inlineHtml(child, context);
		}
	}
	return html;
}

interface GridCell {
	cell: XmlElement;
	column: number;
	span: number;
}

/** Each row's cells with the grid column they start at. */
function gridOf(rows: XmlElement[]): GridCell[][] {
	return rows.map((row) => {
		let column = 0;
		return childrenNamed(row, "w:tc").map((cell) => {
			const properties = childNamed(cell, "w:tcPr");
			const span = Number(
				(properties && childNamed(properties, "w:gridSpan")?.attrs["w:val"]) ??
					1,
			);
			const entry = { cell, column, span: span > 1 ? span : 1 };
			column += entry.span;
			return entry;
		});
	});
}

/** `restart` opens a vertical merge, `continue` is a cell swallowed by one. */
function verticalMerge(cell: XmlElement): "restart" | "continue" | undefined {
	const properties = childNamed(cell, "w:tcPr");
	const merge = properties && childNamed(properties, "w:vMerge");
	if (!merge) {
		return undefined;
	}
	return merge.attrs["w:val"] === "restart" ? "restart" : "continue";
}

function rowSpan(grid: GridCell[][], row: number, column: number): number {
	let span = 1;
	while (
		grid[row + span]?.some(
			(entry) =>
				entry.column === column && verticalMerge(entry.cell) === "continue",
		)
	) {
		span++;
	}
	return span;
}

function cellHtml(
	entry: GridCell,
	rowspan: number,
	tag: string,
	context: ReadContext,
): string {
	const blocks = blocksHtml(entry.cell, context, "");
	const attrs =
		(entry.span > 1 ? ` colspan="${entry.span}"` : "") +
		(rowspan > 1 ? ` rowspan="${rowspan}"` : "");
	return `<${tag}${attrs}>${blocks || "<p></p>"}</${tag}>`;
}

/** A repeated header row is `th`; merged cells keep their spans. */
function tableHtml(table: XmlElement, context: ReadContext): string {
	const rows = childrenNamed(table, "w:tr");
	const grid = gridOf(rows);
	const html = rows.map((row, index) => {
		const properties = childNamed(row, "w:trPr");
		const tag = properties && isOn(properties, "w:tblHeader") ? "th" : "td";
		const cells = (grid[index] ?? []).map((entry) => {
			const merge = verticalMerge(entry.cell);
			if (merge === "continue") {
				return "";
			}
			const span = merge ? rowSpan(grid, index, entry.column) : 1;
			return cellHtml(entry, span, tag, context);
		});
		return `<tr>${cells.join("")}</tr>`;
	});
	return `<table><tbody>${html.join("")}</tbody></table>`;
}

const ALIGNMENT: Record<string, string> = {
	center: "center",
	right: "right",
	end: "right",
	both: "justify",
	distribute: "justify",
};

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Alignment, line spacing and left indent as a `style` attribute. A list
 * item's indent belongs to its list, so it is only read on other paragraphs.
 */
function paragraphStyle(paragraph: XmlElement, indent = true): string {
	const properties = childNamed(paragraph, "w:pPr");
	if (!properties) {
		return "";
	}
	const rules: string[] = [];
	const align = ALIGNMENT[childNamed(properties, "w:jc")?.attrs["w:val"] ?? ""];
	if (align) {
		rules.push(`text-align:${align};`);
	}
	const spacing = childNamed(properties, "w:spacing");
	const line = Number(spacing?.attrs["w:line"]);
	if ((spacing?.attrs["w:lineRule"] ?? "auto") === "auto" && line > 0) {
		rules.push(`line-height:${round(line / 240)};`);
	}
	const ind = childNamed(properties, "w:ind");
	const left = Number(ind?.attrs["w:left"] ?? ind?.attrs["w:start"]);
	if (indent && left > 0) {
		rules.push(`margin-left:${round(left / 20)}pt;`);
	}
	return rules.length > 0 ? ` style="${rules.join("")}"` : "";
}

function paragraphHtml(paragraph: XmlElement, context: ReadContext): string {
	const inner = inlineHtml(paragraph, context);
	const style = paragraphStyle(paragraph);
	const level = headingLevel(paragraph);
	if (level > 0) {
		return `<h${level}${style}>${inner}</h${level}>`;
	}
	if (/^(Intense)?Quote$/.test(styleOf(paragraph) ?? "")) {
		return `<blockquote><p${style}>${inner}</p></blockquote>`;
	}
	return `<p${style}>${inner}</p>`;
}

/**
 * Word has no list element — a list is a run of paragraphs that happen to
 * share a numbering reference — so the nesting has to be rebuilt as we go.
 */
class ListBuilder {
	private readonly open: boolean[] = [];

	constructor(private readonly html: string[]) {}

	item(list: ListInfo, content: string): void {
		const depth = list.level + 1;
		if (this.open.length > depth) {
			this.closeTo(depth);
		}
		if (this.open.length === depth && this.open.at(-1) !== list.ordered) {
			this.closeTo(depth - 1);
		}
		if (this.open.length === depth) {
			this.html.push("</li><li>");
		}
		while (this.open.length < depth) {
			this.html.push(list.ordered ? "<ol><li>" : "<ul><li>");
			this.open.push(list.ordered);
		}
		this.html.push(content);
	}

	closeTo(depth: number): void {
		while (this.open.length > depth) {
			this.html.push(this.open.pop() === true ? "</li></ol>" : "</li></ul>");
		}
	}
}

/** A paragraph's text as code: tabs and breaks kept, formatting dropped. */
function codeText(paragraph: XmlElement): string {
	return findElements(paragraph, "w:r")
		.flatMap((run) => run.children.filter(isElement))
		.map((child) => {
			if (child.name === "w:t") {
				return textContent(child);
			}
			return { "w:tab": "\t", "w:br": "\n" }[child.name] ?? "";
		})
		.join("");
}

function codeHtml(lines: string[], language: string): string {
	const name = attribute(language);
	const [pre, code] = language
		? [` data-language="${name}"`, ` class="language-${name}"`]
		: ["", ""];
	return `<pre${pre}><code${code}>${encodeXml(lines.join("\n"))}</code></pre>`;
}

/** An empty paragraph with a bottom border is how Word draws a rule. */
function isRule(paragraph: XmlElement, context: ReadContext): boolean {
	const properties = childNamed(paragraph, "w:pPr");
	const border = properties && childNamed(properties, "w:pBdr");
	return (
		border !== undefined &&
		childNamed(border, "w:bottom") !== undefined &&
		inlineHtml(paragraph, context) === ""
	);
}

const isCodeParagraph = (node: XmlElement): boolean =>
	node.name === "w:p" && CODE_STYLES.test(styleOf(node) ?? "");

/**
 * One block as HTML, or null for what is not one. A code block is our
 * content control; Word's own code is a run of paragraphs in a code style,
 * which the caller gathers first.
 */
function blockHtml(
	node: XmlElement,
	context: ReadContext,
	lists: ListBuilder,
): string | null {
	if (node.name === "w:sdt") {
		const content = childNamed(node, "w:sdtContent");
		const lines = content ? childrenNamed(content, "w:p").map(codeText) : [];
		return codeHtml(lines, codeLanguage(node) ?? "");
	}
	if (node.name === "w:tbl") {
		return tableHtml(node, context);
	}
	if (node.name !== "w:p") {
		return null;
	}
	const list = listInfo(node, context.bullets, context.numbered);
	if (list) {
		const style = paragraphStyle(node, false);
		const inline = inlineHtml(node, context);
		// A check list item, as our writer and Word's users both spell one.
		const box = /^([☐☒☑]) /.exec(inline)?.[1];
		if (box) {
			const checked = box === "☐" ? "" : ' checked=""';
			const content = `<p${style}>${inline.slice(2)}</p>`;
			lists.item(
				{ ...list, ordered: false },
				`<input type="checkbox"${checked}>${content}`,
			);
		} else {
			lists.item(list, `<p${style}>${inline}</p>`);
		}
		return "";
	}
	return isRule(node, context) ? "<hr>" : paragraphHtml(node, context);
}

/** The blocks of a body or a table cell, lists and code gathered. */
function blocksHtml(
	parent: XmlElement,
	context: ReadContext,
	empty: string,
): string {
	const html: string[] = [];
	const lists = new ListBuilder(html);
	let code: string[] = [];
	const push = (block: string) => {
		lists.closeTo(0);
		html.push(block);
	};
	for (const node of bodyBlocks(parent)) {
		if (isCodeParagraph(node)) {
			code.push(codeText(node));
			continue;
		}
		if (code.length > 0) {
			push(codeHtml(code, ""));
			code = [];
		}
		const block = blockHtml(node, context, lists);
		if (block) {
			push(block);
		}
	}
	if (code.length > 0) {
		push(codeHtml(code, ""));
	}
	lists.closeTo(0);
	return html.join("") || empty;
}

export function docxToHtml(entries: ZipEntry[]): string {
	const body = bodyOf(parseXml(documentXml(entries)).root);
	const context: ReadContext = {
		images: imageSources(entries),
		rels: relationships(entries),
		bullets: bulletLists(entries),
		numbered: styleNumbering(entries),
	};
	return blocksHtml(body, context, "<p></p>");
}
