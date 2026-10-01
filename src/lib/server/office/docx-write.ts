import {
	addMediaPart,
	declareMediaTypes,
	drawingRun,
	highestDrawingId,
	IMAGE_TYPE,
	pictureFromSource,
	pruneOwnMedia,
	textWidth,
} from "./docx-media";
import {
	bodyBlocks,
	bodyOf,
	bulletLists,
	DOCUMENT_PART,
	declarations,
	documentXml,
	embeddedId,
	HYPERLINK_TYPE,
	imageSources,
	insertOrdered,
	listInfo,
	NotADocumentError,
	RELS_PART,
	relationships,
	styleIds,
	styleNumbering,
} from "./docx-package";
import {
	codeBlock,
	horizontalRule,
	type Marks,
	markFor,
	NO_MARKS,
	paragraph,
	textRun,
} from "./docx-runs";
import {
	childNamed,
	childrenNamed,
	element,
	findElements,
	isElement,
	parseHtmlFragment,
	parseXml,
	serializeXml,
	type XmlElement,
	type XmlNode,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * Edited HTML applied back to a Word document.
 *
 * The body is rebuilt, everything else is left alone: section properties,
 * styles.xml, numbering.xml, headers, footers, themes and every media part
 * are never rewritten. Within the body, an image is written back as the run
 * that already drew it, a table keeps the original's borders and column
 * widths, and a list item reuses the numbering reference of a list item the
 * document already had — so the parts we cannot model survive as long as the
 * shape they hang on does. A picture the editor added becomes a media part
 * of its own.
 */

interface AddedRelationship {
	id: string;
	type: string;
	target: string;
	external: boolean;
}

interface WriteContext {
	entries: ZipEntry[];
	/** The `src` handed out → the run that already draws that image. */
	images: Map<string, XmlElement>;
	/** External targets already in the package, so a link stays one id. */
	links: Map<string, string>;
	/** Relationships to append for links and pictures the editor added. */
	added: AddedRelationship[];
	/** Extension → content type of every picture added. */
	mediaTypes: Map<string, string>;
	nextId: number;
	nextDrawing: number;
	/** The text column's width in EMU, which no picture exceeds. */
	textWidth: number;
	styles: Set<string>;
	/** `ordered:level` → the paragraph properties of a list item like it. */
	listProperties: Map<string, XmlElement>;
	/** The original tables, reused for their borders and column widths. */
	tables: XmlElement[];
	tableIndex: number;
}

function relationshipFor(href: string, context: WriteContext): string {
	const existing = context.links.get(href);
	if (existing) {
		return existing;
	}
	const id = `rId${context.nextId++}`;
	context.links.set(href, id);
	context.added.push({
		id,
		type: HYPERLINK_TYPE,
		target: href,
		external: true,
	});
	return id;
}

function hyperlink(
	href: string,
	runs: XmlElement[],
	context: WriteContext,
): XmlElement {
	for (const run of runs) {
		if (!context.styles.has("Hyperlink")) {
			continue;
		}
		let properties = childNamed(run, "w:rPr");
		if (!properties) {
			properties = element("w:rPr");
			run.children.unshift(properties);
		}
		if (!childNamed(properties, "w:rStyle")) {
			properties.children.unshift(
				element("w:rStyle", { "w:val": "Hyperlink" }),
			);
		}
	}
	return element(
		"w:hyperlink",
		{ "r:id": relationshipFor(href, context) },
		runs,
	);
}

/**
 * A picture the document did not have: its bytes become a media part. Kept
 * by `src`, so the same picture twice is one part, and the next save finds
 * it among the document's own.
 */
function newPictureRun(src: string, context: WriteContext): XmlElement | null {
	const picture = pictureFromSource(src);
	if (!picture) {
		return null;
	}
	const target = addMediaPart(context.entries, picture);
	const id = `rId${context.nextId++}`;
	context.added.push({ id, type: IMAGE_TYPE, target, external: false });
	context.mediaTypes.set(picture.extension, picture.contentType);
	const run = drawingRun(picture, id, context.nextDrawing++, context.textWidth);
	context.images.set(src, run);
	return run;
}

/** One inline child as the runs it becomes. */
function inlineChildRuns(
	child: XmlNode,
	marks: Marks,
	context: WriteContext,
): XmlElement[] {
	if (child.type === "text") {
		return child.text === ""
			? []
			: [textRun(child.text, marks, context.styles)];
	}
	if (!isElement(child)) {
		return [];
	}
	if (child.name === "br") {
		return [element("w:r", {}, [element("w:br")])];
	}
	if (child.name === "img") {
		// A link to a picture elsewhere is dropped: nothing on the server
		// should fetch what a document points at.
		const src = child.attrs.src ?? "";
		const run = context.images.get(src) ?? newPictureRun(src, context);
		return run ? [run] : [];
	}
	if (child.name === "a" && child.attrs.href) {
		return [
			hyperlink(child.attrs.href, inlineRuns(child, marks, context), context),
		];
	}
	return inlineRuns(child, markFor(child, marks), context);
}

function inlineRuns(
	node: XmlElement,
	marks: Marks,
	context: WriteContext,
): XmlElement[] {
	return node.children.flatMap((child) =>
		inlineChildRuns(child, marks, context),
	);
}

const JUSTIFICATION: Record<string, string> = {
	left: "left",
	center: "center",
	right: "right",
	justify: "both",
};

/** What the editor writes on a paragraph itself: alignment, spacing, indent. */
function ownProperties(node: XmlElement): XmlElement[] {
	const css = declarations(node.attrs.style);
	const children: XmlElement[] = [];
	const line = Number(css.get("line-height"));
	if (line > 0) {
		children.push(
			element("w:spacing", {
				"w:line": String(Math.round(line * 240)),
				"w:lineRule": "auto",
			}),
		);
	}
	const indent = /^([\d.]+)pt$/.exec(css.get("margin-left") ?? "")?.[1];
	if (indent && Number(indent) > 0) {
		children.push(
			element("w:ind", { "w:left": String(Math.round(Number(indent) * 20)) }),
		);
	}
	const jc = JUSTIFICATION[css.get("text-align") ?? ""];
	if (jc) {
		children.push(element("w:jc", { "w:val": jc }));
	}
	return children;
}

/** The editor decides these even on a paragraph whose other properties it copied. */
const EDITOR_OWNED = new Set(["w:jc", "w:spacing"]);

/**
 * `extra` merged into `base`. On a clash `base` wins, except for what the
 * editor controls: a list item keeps its list's indent and numbering but
 * takes its own alignment, and spacing keeps what it did not set.
 */
function mergeProperties(
	base: XmlElement | null,
	extra: XmlElement[],
): XmlElement | null {
	const properties = base ?? element("w:pPr");
	for (const node of extra) {
		const existing = childNamed(properties, node.name);
		if (!existing) {
			insertOrdered(properties.children, node);
		} else if (EDITOR_OWNED.has(node.name)) {
			Object.assign(existing.attrs, node.attrs);
		}
	}
	return properties.children.length > 0 ? properties : null;
}

/** Give a paragraph `base`'s properties on top of any it already has. */
function applyProperties(block: XmlElement, base: XmlElement | null): void {
	const current = childNamed(block, "w:pPr");
	const own = (current?.children ?? []).filter(isElement);
	const merged = mergeProperties(base && structuredClone(base), own);
	block.children = [
		...(merged ? [merged] : []),
		...block.children.filter((child) => child !== current),
	];
}

function styledParagraph(
	style: string | null,
	node: XmlElement,
	context: WriteContext,
): XmlElement {
	const base =
		style !== null && context.styles.has(style)
			? element("w:pPr", {}, [element("w:pStyle", { "w:val": style })])
			: null;
	return paragraph(
		mergeProperties(base, ownProperties(node)),
		inlineRuns(node, NO_MARKS, context),
	);
}

/** Properties that put a paragraph in a list of this kind and depth. */
function listParagraphProperties(
	ordered: boolean,
	level: number,
	context: WriteContext,
): XmlElement | null {
	const exact = context.listProperties.get(`${ordered}:${level}`);
	if (exact) {
		return structuredClone(exact);
	}
	const base = context.listProperties.get(`${ordered}:0`);
	if (base) {
		const clone = structuredClone(base);
		const ilvl = childNamed(childNamed(clone, "w:numPr") ?? clone, "w:ilvl");
		if (ilvl) {
			ilvl.attrs["w:val"] = String(level);
		}
		return clone;
	}
	// Nothing to copy: name a list style, if the document defines one.
	// Word's own carry the depth in the id — ListBullet2, ListNumber3 — and
	// each one references a different numbering definition.
	const family = ordered ? "ListNumber" : "ListBullet";
	const style = [`${family}${level + 1}`, family].find((candidate) =>
		context.styles.has(candidate),
	);
	return style
		? element("w:pPr", {}, [element("w:pStyle", { "w:val": style })])
		: null;
}

const LIST_CLASS = "prosemirror-flat-list";

/** A list item's kind; `checked` is set for a check list's items only. */
interface ListKind {
	ordered: boolean;
	checked?: boolean;
}

function hasClass(node: XmlElement, name: string): boolean {
	const classes: string | undefined = node.attrs.class;
	return (classes ?? "").split(/\s+/).includes(name);
}

function isListNode(node: XmlElement): boolean {
	return hasClass(node, LIST_CLASS) || node.name === "ul" || node.name === "ol";
}

/** A table's own rows, not those of a table nested in one of its cells. */
function rowsOf(table: XmlElement): XmlElement[] {
	return table.children.filter(isElement).flatMap((child) => {
		if (child.name === "tr") {
			return [child];
		}
		return ["thead", "tbody", "tfoot"].includes(child.name)
			? childrenNamed(child, "tr")
			: [];
	});
}

function spanOf(cell: XmlElement, name: string): number {
	const span = Math.floor(Number(cell.attrs[name]));
	return span > 1 ? span : 1;
}

function cellElement(
	cell: XmlElement | null,
	span: number,
	merge: "restart" | "continue" | undefined,
	context: WriteContext,
): XmlElement {
	const properties = [
		...(span > 1 ? [element("w:gridSpan", { "w:val": String(span) })] : []),
		...(merge
			? [element("w:vMerge", merge === "restart" ? { "w:val": merge } : {})]
			: []),
	];
	const blocks = cell ? blockElements(cell, context, 0) : [];
	// Word refuses a cell that does not end in a paragraph.
	if (blocks.at(-1)?.name !== "w:p") {
		blocks.push(element("w:p"));
	}
	return element("w:tc", {}, [
		...(properties.length > 0 ? [element("w:tcPr", {}, properties)] : []),
		...blocks,
	]);
}

/**
 * Word has no rowspan: a merged cell is the first of a column of cells, and
 * every row it covers carries an empty `continue` cell in its place.
 */
function tableRows(node: XmlElement, context: WriteContext): XmlElement[] {
	const owed = new Map<number, { rows: number; span: number }>();
	return rowsOf(node).map((row) => {
		const cells = row.children.filter(
			(cell): cell is XmlElement =>
				isElement(cell) && (cell.name === "td" || cell.name === "th"),
		);
		const out: XmlElement[] = [];
		let column = 0;
		const settle = () => {
			for (let due = owed.get(column); due; due = owed.get(column)) {
				out.push(cellElement(null, due.span, "continue", context));
				due.rows -= 1;
				if (due.rows === 0) {
					owed.delete(column);
				}
				column += due.span;
			}
		};
		for (const cell of cells) {
			settle();
			const span = spanOf(cell, "colspan");
			const rows = spanOf(cell, "rowspan");
			out.push(
				cellElement(cell, span, rows > 1 ? "restart" : undefined, context),
			);
			if (rows > 1) {
				owed.set(column, { rows: rows - 1, span });
			}
			column += span;
		}
		settle();
		const header =
			cells.length > 0 && cells.every((cell) => cell.name === "th");
		const properties = header
			? [element("w:trPr", {}, [element("w:tblHeader")])]
			: [];
		return element("w:tr", {}, [...properties, ...out]);
	});
}

/** Equal columns across the text: Word wants a grid on every table. */
function tableGrid(rows: XmlElement[], context: WriteContext): XmlElement {
	const span = (cell: XmlElement) =>
		Number(
			childNamed(childNamed(cell, "w:tcPr") ?? cell, "w:gridSpan")?.attrs[
				"w:val"
			],
		) || 1;
	const columns = Math.max(
		1,
		...rows.map((row) =>
			childrenNamed(row, "w:tc").reduce((sum, cell) => sum + span(cell), 0),
		),
	);
	const width = String(Math.floor(context.textWidth / 635 / columns));
	return element(
		"w:tblGrid",
		{},
		Array.from({ length: columns }, () =>
			element("w:gridCol", { "w:w": width }),
		),
	);
}

/** The table's rows, reusing the original's layout properties by position. */
function tableElement(node: XmlElement, context: WriteContext): XmlElement {
	const original = context.tables[context.tableIndex++];
	const rows = tableRows(node, context);
	const layout = original
		? [
				...childrenNamed(original, "w:tblPr"),
				...childrenNamed(original, "w:tblGrid"),
			].map((part) => structuredClone(part))
		: [
				element("w:tblPr", {}, [
					element("w:tblStyle", { "w:val": "TableGrid" }),
					element("w:tblW", { "w:w": "0", "w:type": "auto" }),
				]),
				tableGrid(rows, context),
			];
	return element("w:tbl", {}, [...layout, ...rows]);
}

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const TRANSPARENT = new Set(["div", "body", "section", "article"]);
/**
 * Inline elements that can turn up where a block is expected. ProseKit
 * serialises an image as a sibling of the paragraphs rather than inside one,
 * and treating that as an unknown block wrapped *its children* in a
 * paragraph — of which an `<img>` has none, so every picture in a document
 * was dropped on the first save.
 */
const INLINE = new Set([
	"a",
	"b",
	"br",
	"code",
	"del",
	"em",
	"i",
	"img",
	"s",
	"span",
	"strike",
	"strong",
	"sub",
	"sup",
	"u",
]);

function quoted(blocks: XmlElement[], context: WriteContext): XmlElement[] {
	if (!context.styles.has("Quote")) {
		return blocks;
	}
	const quote = element("w:pPr", {}, [
		element("w:pStyle", { "w:val": "Quote" }),
	]);
	for (const block of blocks) {
		const current = childNamed(block, "w:pPr");
		if (block.name === "w:p" && !(current && childNamed(current, "w:pStyle"))) {
			applyProperties(block, quote);
		}
	}
	return blocks;
}

/** One HTML block element as the Word block elements it becomes. */
function blockElement(
	node: XmlElement,
	context: WriteContext,
	level: number,
): XmlElement[] {
	if (HEADINGS.has(node.name)) {
		return [styledParagraph(`Heading${node.name[1]}`, node, context)];
	}
	if (node.name === "table") {
		return [tableElement(node, context)];
	}
	if (node.name === "hr") {
		return [horizontalRule()];
	}
	if (node.name === "blockquote") {
		return quoted(blockElements(node, context, level), context);
	}
	if (node.name === "ul" || node.name === "ol") {
		return childrenNamed(node, "li").flatMap((item) =>
			listItem(item, { ordered: node.name === "ol" }, level, context),
		);
	}
	if (hasClass(node, LIST_CLASS)) {
		const content = node.children.find(
			(child): child is XmlElement =>
				isElement(child) && hasClass(child, "list-content"),
		);
		const kind = node.attrs["data-list-kind"];
		return listItem(
			content ?? node,
			{
				ordered: kind === "ordered",
				checked:
					kind === "task"
						? node.attrs["data-list-checked"] !== undefined
						: undefined,
			},
			level,
			context,
		);
	}
	if (TRANSPARENT.has(node.name)) {
		return blockElements(node, context, level);
	}
	if (node.name === "pre") {
		return [codeBlock(node, context.styles)];
	}
	if (INLINE.has(node.name)) {
		return [paragraph(null, inlineChildRuns(node, NO_MARKS, context))];
	}
	return [styledParagraph(null, node, context)];
}

/**
 * A list item: its own paragraph, then anything nested under it one level
 * deeper. Word stores the depth on each paragraph rather than by nesting, so
 * a nested list is flattened into more paragraphs rather than more elements.
 */
function listItem(
	node: XmlElement,
	{ ordered, checked }: ListKind,
	level: number,
	context: WriteContext,
): XmlElement[] {
	const properties = listParagraphProperties(ordered, level, context);
	const own: XmlNode[] = [];
	const nested: XmlElement[] = [];

	for (const child of node.children) {
		if (isElement(child) && isListNode(child)) {
			nested.push(...blockElement(child, context, level + 1));
		} else {
			own.push(child);
		}
	}

	const wrapped = own.some((child) => isElement(child) && child.name === "p");
	const paragraphs = wrapped
		? blockElements(element("li", {}, own), context, level).map((block) => {
				if (block.name === "w:p") {
					applyProperties(block, properties);
				}
				return block;
			})
		: [
				paragraph(
					properties,
					inlineRuns(element("li", {}, own), NO_MARKS, context),
				),
			];

	// Word has no check list: a box glyph leads the item, and reads back.
	const first = paragraphs.find((block) => block.name === "w:p");
	if (first && checked !== undefined) {
		const box = textRun(checked ? "☒ " : "☐ ", NO_MARKS, context.styles);
		const at = childNamed(first, "w:pPr") ? 1 : 0;
		first.children.splice(at, 0, box);
	}
	return [...paragraphs, ...nested];
}

function blockElements(
	parent: XmlElement,
	context: WriteContext,
	level: number,
): XmlElement[] {
	return parent.children
		.filter((child): child is XmlElement => isElement(child))
		.flatMap((child) => blockElement(child, context, level));
}

/** Images in the original body, keyed by the src the editor was handed. */
function imageRuns(
	entries: ZipEntry[],
	body: XmlElement,
): Map<string, XmlElement> {
	const sources = imageSources(entries);
	const runs = new Map<string, XmlElement>();
	for (const run of findElements(body, "w:r")) {
		const id = embeddedId(run);
		const source = id === undefined ? undefined : sources.get(id);
		if (source !== undefined) {
			runs.set(source, run);
		}
	}
	return runs;
}

/** Exemplar paragraph properties per list kind and depth. */
function listExemplars(
	entries: ZipEntry[],
	body: XmlElement,
): Map<string, XmlElement> {
	const bullets = bulletLists(entries);
	const numbered = styleNumbering(entries);
	const exemplars = new Map<string, XmlElement>();
	const paragraphs = bodyBlocks(body).filter((node) => node.name === "w:p");
	for (const node of paragraphs) {
		const list = listInfo(node, bullets, numbered);
		const properties = childNamed(node, "w:pPr");
		if (!(list && properties)) {
			continue;
		}
		const key = `${list.ordered}:${list.level}`;
		if (!exemplars.has(key)) {
			exemplars.set(key, properties);
		}
	}
	return exemplars;
}

function writeContext(entries: ZipEntry[], body: XmlElement): WriteContext {
	const links = new Map<string, string>();
	let highest = 0;
	for (const [id, relationship] of relationships(entries)) {
		highest = Math.max(highest, Number(/^rId(\d+)$/.exec(id)?.[1] ?? 0));
		if (relationship.external) {
			links.set(relationship.target, id);
		}
	}

	return {
		entries,
		images: imageRuns(entries, body),
		links,
		added: [],
		mediaTypes: new Map(),
		nextId: highest + 1,
		nextDrawing: highestDrawingId(body) + 1,
		textWidth: textWidth(body),
		styles: styleIds(entries),
		listProperties: listExemplars(entries, body),
		// Every table, nested ones included, in the order the writer meets
		// them: a nested table used to take the next top-level one's layout.
		tables: findElements(body, "w:tbl"),
		tableIndex: 0,
	};
}

/**
 * Append the relationships for links and pictures the editor added, and
 * drop those of pictures we added that the body no longer draws.
 */
function writeRelationships(
	entries: ZipEntry[],
	added: AddedRelationship[],
	body: XmlElement,
): void {
	const source = partText(entries, RELS_PART);
	if (!source) {
		if (added.length === 0) {
			return;
		}
		throw new NotADocumentError("Package has no document relationships");
	}
	const document = parseXml(source);
	const pruned = pruneOwnMedia(entries, document, body);
	if (added.length === 0 && !pruned) {
		return;
	}
	for (const { id, type, target, external } of added) {
		document.root.children.push(
			element("Relationship", {
				Id: id,
				Type: type,
				Target: target,
				TargetMode: external ? "External" : undefined,
			}),
		);
	}
	setPartText(entries, RELS_PART, serializeXml(document));
}

/** Apply edited HTML to the document, in place on `entries`. */
export function htmlToDocx(entries: ZipEntry[], html: string): void {
	const document = parseXml(documentXml(entries));
	const body = bodyOf(document.root);
	const context = writeContext(entries, body);

	const blocks = blockElements(parseHtmlFragment(html), context, 0);

	// Section properties are the page itself — size, margins, which header
	// and footer apply — and they live as the body's last child. Dropping
	// them resets the document to Word's defaults.
	const section = childrenNamed(body, "w:sectPr");
	body.children = [...blocks, ...section];

	setPartText(entries, DOCUMENT_PART, serializeXml(document));
	writeRelationships(entries, context.added, body);
	declareMediaTypes(entries, context.mediaTypes);
}
