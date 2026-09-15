import {
	bodyOf,
	bulletLists,
	documentXml,
	embeddedId,
	imageSources,
	type ListInfo,
	listInfo,
	type Relationship,
	relationships,
	styleNumbering,
	styleOf,
} from "./docx-package";
import {
	childNamed,
	childrenNamed,
	encodeXml,
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

/** The HTML tags a run's properties turn into, outermost first. */
function runTags(run: XmlElement): string[] {
	const properties = childNamed(run, "w:rPr");
	if (!properties) {
		return [];
	}
	const on = (name: string): boolean => {
		const node = childNamed(properties, name);
		const value = node?.attrs["w:val"];
		return node !== undefined && value !== "0" && value !== "false";
	};
	const underline = childNamed(properties, "w:u");
	return [
		on("w:b") ? "strong" : "",
		on("w:i") ? "em" : "",
		underline && underline.attrs["w:val"] !== "none" ? "u" : "",
		on("w:strike") || on("w:dstrike") ? "s" : "",
	].filter((tag) => tag !== "");
}

interface ReadContext {
	images: Map<string, string>;
	rels: Map<string, Relationship>;
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
	const tags = runTags(run);
	const close = [...tags].reverse().map((tag) => `</${tag}>`);
	return tags.map((tag) => `<${tag}>`).join("") + inner + close.join("");
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

function tableHtml(table: XmlElement, context: ReadContext): string {
	const rows = childrenNamed(table, "w:tr").map((row) => {
		const cells = childrenNamed(row, "w:tc").map((cell) => {
			const blocks = childrenNamed(cell, "w:p")
				.map((paragraph) => `<p>${inlineHtml(paragraph, context)}</p>`)
				.join("");
			return `<td>${blocks || "<p></p>"}</td>`;
		});
		return `<tr>${cells.join("")}</tr>`;
	});
	return `<table><tbody>${rows.join("")}</tbody></table>`;
}

function paragraphHtml(paragraph: XmlElement, context: ReadContext): string {
	const inner = inlineHtml(paragraph, context);
	const level = headingLevel(paragraph);
	if (level > 0) {
		return `<h${level}>${inner}</h${level}>`;
	}
	if (/^(Intense)?Quote$/.test(styleOf(paragraph) ?? "")) {
		return `<blockquote><p>${inner}</p></blockquote>`;
	}
	return `<p>${inner}</p>`;
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

export function docxToHtml(entries: ZipEntry[]): string {
	const body = bodyOf(parseXml(documentXml(entries)).root);
	const context: ReadContext = {
		images: imageSources(entries),
		rels: relationships(entries),
	};
	const bullets = bulletLists(entries);
	const numbered = styleNumbering(entries);

	const html: string[] = [];
	const lists = new ListBuilder(html);

	for (const node of body.children) {
		if (!isElement(node)) {
			continue;
		}
		if (node.name === "w:tbl") {
			lists.closeTo(0);
			html.push(tableHtml(node, context));
			continue;
		}
		if (node.name !== "w:p") {
			continue;
		}
		const list = listInfo(node, bullets, numbered);
		if (list) {
			lists.item(list, `<p>${inlineHtml(node, context)}</p>`);
		} else {
			lists.closeTo(0);
			html.push(paragraphHtml(node, context));
		}
	}
	lists.closeTo(0);

	return html.join("") || "<p></p>";
}
