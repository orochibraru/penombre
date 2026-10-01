import { linkTarget } from "#lib/editor/document-format.js";
import {
	declarations,
	firstFamily,
	halfPoints,
	wordColor,
} from "../docx-package";
import {
	childNamed,
	isElement,
	parseHtmlFragment,
	textContent,
	type XmlElement,
	type XmlNode,
} from "../xml";

/**
 * A document as the exports read it: the editor's HTML (or a `.docx` read
 * into the same HTML) reduced to the blocks and marks every export format
 * can express. Each format then renders this, rather than each walking the
 * HTML with its own idea of what a list is.
 */

export interface Marks {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strike?: boolean;
	code?: boolean;
	sup?: boolean;
	sub?: boolean;
	link?: string;
	/** `#rrggbb`. */
	color?: string;
	background?: string;
	font?: string;
	/** Points. */
	size?: number;
}

export interface Run {
	text: string;
	marks: Marks;
}

export interface Paragraph {
	type: "paragraph";
	runs: Run[];
	align?: "left" | "center" | "right" | "justify";
	lineHeight?: number;
	/** Points. */
	indent?: number;
}

export interface Heading {
	type: "heading";
	level: number;
	runs: Run[];
	align?: Paragraph["align"];
}

export interface ListItem {
	checked?: boolean;
	blocks: Block[];
}

export interface List {
	type: "list";
	kind: "bullet" | "ordered" | "task";
	items: ListItem[];
}

export interface Cell {
	header: boolean;
	colspan: number;
	rowspan: number;
	blocks: Block[];
}

export type Block =
	| Paragraph
	| Heading
	| List
	| { type: "quote"; blocks: Block[] }
	| { type: "code"; language: string; text: string }
	| { type: "table"; rows: Cell[][] }
	| { type: "image"; src: string; width?: number }
	| { type: "rule" };

const HEADINGS = /^h([1-6])$/;
const MARK_TAGS: Record<string, Marks> = {
	strong: { bold: true },
	b: { bold: true },
	em: { italic: true },
	i: { italic: true },
	u: { underline: true },
	s: { strike: true },
	strike: { strike: true },
	del: { strike: true },
	sup: { sup: true },
	sub: { sub: true },
	code: { code: true },
};
const BLOCK_TAGS = new Set([
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"ul",
	"ol",
	"li",
	"blockquote",
	"pre",
	"table",
	"hr",
	"div",
	"section",
	"article",
	"body",
]);
const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
const LIST_CLASS = "prosemirror-flat-list";

const hasClass = (node: XmlElement, name: string): boolean =>
	(node.attrs.class ?? "").split(/\s+/).includes(name);

/** Only pictures a PDF, a page and a Word file can all carry. */
const isPicture = (src: string): boolean =>
	/^data:image\/(png|jpeg|gif);base64,/i.test(src);

/** What a styled element adds; the editor's `data-` attribute is exact. */
function styleMarks(node: XmlElement): Marks {
	const css = declarations(node.attrs.style);
	const value = (data: string, property: string) =>
		node.attrs[data] ?? css.get(property);
	const marks: Marks = {};
	const font = firstFamily(value("data-font-family", "font-family") ?? "");
	const size = halfPoints(value("data-font-size", "font-size") ?? "");
	const color = wordColor(value("data-text-color", "color"));
	const background = wordColor(
		value("data-background-color", "background-color"),
	);
	if (font) {
		marks.font = font;
	}
	if (size) {
		marks.size = size / 2;
	}
	if (color) {
		marks.color = `#${color.toLowerCase()}`;
	}
	if (background) {
		marks.background = `#${background.toLowerCase()}`;
	}
	return marks;
}

function markFor(node: XmlElement, marks: Marks): Marks {
	const link =
		node.name === "a"
			? (linkTarget(node.attrs.href ?? "") ?? undefined)
			: undefined;
	return {
		...marks,
		...MARK_TAGS[node.name],
		...styleMarks(node),
		...(link ? { link } : {}),
	};
}

type Inline = Run | { image: string; width?: number };

const sameMarks = (a: Marks, b: Marks): boolean =>
	JSON.stringify(a) === JSON.stringify(b);

function pushRun(out: Inline[], text: string, marks: Marks): void {
	const last = out.at(-1);
	if (last && "text" in last && sameMarks(last.marks, marks)) {
		last.text += text;
	} else if (text !== "") {
		out.push({ text, marks });
	}
}

function inlines(node: XmlNode, marks: Marks, out: Inline[]): Inline[] {
	if (node.type === "text") {
		pushRun(out, node.text, marks);
	} else if (isElement(node)) {
		if (node.name === "br") {
			pushRun(out, "\n", marks);
		} else if (node.name === "img") {
			const src = node.attrs.src ?? "";
			if (isPicture(src)) {
				const width = Number(node.attrs.width);
				out.push({ image: src, ...(width > 0 ? { width } : {}) });
			}
		} else if (node.name !== "input") {
			const inner = markFor(node, marks);
			for (const child of node.children) {
				inlines(child, inner, out);
			}
		}
	}
	return out;
}

function paragraphProperties(
	node: XmlElement,
): Omit<Paragraph, "type" | "runs"> {
	const css = declarations(node.attrs.style);
	const align = css.get("text-align");
	const lineHeight = Number(css.get("line-height"));
	const indent = /^([\d.]+)pt$/.exec(css.get("margin-left") ?? "")?.[1];
	return {
		...(align && ALIGNMENTS.has(align)
			? { align: align as Paragraph["align"] }
			: {}),
		...(lineHeight > 0 ? { lineHeight } : {}),
		...(indent && Number(indent) > 0 ? { indent: Number(indent) } : {}),
	};
}

/**
 * A paragraph, split where a picture sits in it: pictures are blocks in
 * every format we write, and the editor keeps them between paragraphs too.
 */
function paragraphBlocks(
	nodes: XmlNode[],
	properties: Omit<Paragraph, "type" | "runs">,
): Block[] {
	const out: Block[] = [];
	let runs: Run[] = [];
	const flush = (force: boolean) => {
		if (runs.length > 0 || force) {
			out.push({ type: "paragraph", runs, ...properties });
		}
		runs = [];
	};
	const all: Inline[] = [];
	for (const node of nodes) {
		inlines(node, {}, all);
	}
	for (const inline of all) {
		if ("image" in inline) {
			flush(false);
			out.push({ type: "image", src: inline.image, width: inline.width });
		} else {
			runs.push(inline);
		}
	}
	flush(out.length === 0);
	return out;
}

function codeBlock(node: XmlElement): Block {
	const code = childNamed(node, "code");
	const language =
		node.attrs["data-language"] ??
		/(?:^|\s)language-(\S+)/.exec(code?.attrs.class ?? "")?.[1] ??
		"";
	return { type: "code", language, text: textContent(node) };
}

/** Consecutive flat-list items of one kind are one list. */
function flatListItem(node: XmlElement, out: Block[]): void {
	const kind = node.attrs["data-list-kind"];
	const listKind: List["kind"] =
		kind === "ordered" || kind === "task" ? kind : "bullet";
	const content =
		node.children.find(
			(child): child is XmlElement =>
				isElement(child) && hasClass(child, "list-content"),
		) ?? node;
	const item: ListItem = {
		blocks: blocks(content),
		...(listKind === "task"
			? { checked: node.attrs["data-list-checked"] !== undefined }
			: {}),
	};
	const last = out.at(-1);
	if (last?.type === "list" && last.kind === listKind) {
		last.items.push(item);
	} else {
		out.push({ type: "list", kind: listKind, items: [item] });
	}
}

function tableBlock(node: XmlElement): Block {
	const rows = node.children.filter(isElement).flatMap((child) => {
		if (child.name === "tr") {
			return [child];
		}
		return ["thead", "tbody", "tfoot"].includes(child.name)
			? child.children.filter(
					(row): row is XmlElement => isElement(row) && row.name === "tr",
				)
			: [];
	});
	const span = (cell: XmlElement, name: string) =>
		Math.max(1, Math.floor(Number(cell.attrs[name])) || 1);
	return {
		type: "table",
		rows: rows.map((row) =>
			row.children
				.filter(
					(cell): cell is XmlElement =>
						isElement(cell) && (cell.name === "td" || cell.name === "th"),
				)
				.map((cell) => ({
					header: cell.name === "th",
					colspan: span(cell, "colspan"),
					rowspan: span(cell, "rowspan"),
					blocks: blocks(cell),
				})),
		),
	};
}

/** A `ul` whose items lead with a checkbox is a check list. */
function htmlList(node: XmlElement): List {
	const items = node.children.filter(
		(child): child is XmlElement => isElement(child) && child.name === "li",
	);
	const box = (item: XmlElement) =>
		childNamed(item, "input")?.attrs.type === "checkbox"
			? childNamed(item, "input")
			: undefined;
	const task = node.name === "ul" && items.some((item) => box(item));
	return {
		type: "list",
		kind: task ? "task" : node.name === "ol" ? "ordered" : "bullet",
		items: items.map((item) => ({
			blocks: blocks(item),
			...(task ? { checked: box(item)?.attrs.checked !== undefined } : {}),
		})),
	};
}

const isBlockElement = (node: XmlNode): boolean =>
	isElement(node) && (BLOCK_TAGS.has(node.name) || hasClass(node, LIST_CLASS));

/** One block element, appended to `out`. */
function block(node: XmlElement, out: Block[]): void {
	const heading = HEADINGS.exec(node.name)?.[1];
	if (heading) {
		const [first] = paragraphBlocks(node.children, {});
		const runs = first?.type === "paragraph" ? first.runs : [];
		const { align } = paragraphProperties(node);
		out.push({
			type: "heading",
			level: Number(heading),
			runs,
			...(align ? { align } : {}),
		});
	} else if (hasClass(node, LIST_CLASS)) {
		flatListItem(node, out);
	} else if (node.name === "ul" || node.name === "ol") {
		out.push(htmlList(node));
	} else if (node.name === "blockquote") {
		out.push({ type: "quote", blocks: blocks(node) });
	} else if (node.name === "pre") {
		out.push(codeBlock(node));
	} else if (node.name === "table") {
		out.push(tableBlock(node));
	} else if (node.name === "hr") {
		out.push({ type: "rule" });
	} else if (node.children.some(isBlockElement)) {
		out.push(...blocks(node));
	} else {
		out.push(...paragraphBlocks(node.children, paragraphProperties(node)));
	}
}

/** The blocks of a container; stray inline content becomes a paragraph. */
export function blocks(parent: XmlElement): Block[] {
	const out: Block[] = [];
	let loose: XmlNode[] = [];
	const settle = () => {
		const meaningful = loose.some(
			(node) => !(node.type === "text" && node.text.trim() === ""),
		);
		if (meaningful) {
			out.push(...paragraphBlocks(loose, {}));
		}
		loose = [];
	};
	for (const child of parent.children) {
		if (isElement(child) && isBlockElement(child)) {
			settle();
			block(child, out);
		} else if (
			child.type !== "raw" &&
			!(isElement(child) && child.name === "input")
		) {
			loose.push(child);
		}
	}
	settle();
	return out;
}

/** The editor's HTML as blocks. */
export function readHtml(html: string): Block[] {
	return blocks(parseHtmlFragment(html));
}

/** A block's runs as plain text, for the title and the text export. */
export function runsText(runs: Run[]): string {
	return runs.map((run) => run.text).join("");
}
