import {
	bodyOf,
	bulletLists,
	DOCUMENT_PART,
	documentXml,
	embeddedId,
	HYPERLINK_TYPE,
	imageSources,
	listInfo,
	NotADocumentError,
	RELS_PART,
	relationships,
	styleIds,
	styleNumbering,
} from "./docx-package";
import {
	childNamed,
	childrenNamed,
	element,
	findElements,
	isElement,
	parseHtmlFragment,
	parseXml,
	serializeXml,
	text,
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
 * shape they hang on does.
 */

interface Marks {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
}

const NO_MARKS: Marks = {
	bold: false,
	italic: false,
	underline: false,
	strike: false,
};

const MARK_TAGS: Record<string, keyof Marks> = {
	strong: "bold",
	b: "bold",
	em: "italic",
	i: "italic",
	u: "underline",
	s: "strike",
	strike: "strike",
	del: "strike",
};

function markFor(tag: string, marks: Marks): Marks {
	const mark = MARK_TAGS[tag];
	return mark ? { ...marks, [mark]: true } : marks;
}

function runProperties(marks: Marks): XmlElement | null {
	const children: XmlNode[] = [];
	if (marks.bold) {
		children.push(element("w:b"));
	}
	if (marks.italic) {
		children.push(element("w:i"));
	}
	if (marks.underline) {
		children.push(element("w:u", { "w:val": "single" }));
	}
	if (marks.strike) {
		children.push(element("w:strike"));
	}
	return children.length > 0 ? element("w:rPr", {}, children) : null;
}

function textRun(value: string, marks: Marks): XmlElement {
	const properties = runProperties(marks);
	// Without xml:space a run's leading and trailing spaces are dropped, and
	// a sentence split across runs is mostly leading and trailing spaces.
	const node = element("w:t", { "xml:space": "preserve" }, [text(value)]);
	return element("w:r", {}, properties ? [properties, node] : [node]);
}

interface WriteContext {
	/** The `src` handed out → the run that already draws that image. */
	images: Map<string, XmlElement>;
	/** External targets already in the package, so a link stays one id. */
	links: Map<string, string>;
	/** Relationships to append for links the editor added. */
	added: { id: string; target: string }[];
	nextId: number;
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
	context.added.push({ id, target: href });
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

/** One inline child as the runs it becomes. */
function inlineChildRuns(
	child: XmlNode,
	marks: Marks,
	context: WriteContext,
): XmlElement[] {
	if (child.type === "text") {
		return child.text === "" ? [] : [textRun(child.text, marks)];
	}
	if (!isElement(child)) {
		return [];
	}
	if (child.name === "br") {
		return [element("w:r", {}, [element("w:br")])];
	}
	if (child.name === "img") {
		// Only an image the document already had can be written back: a new
		// one would need its bytes, a media part and a content-type override,
		// and nothing in the editor offers a way to add one.
		const run = context.images.get(child.attrs.src ?? "");
		return run ? [run] : [];
	}
	if (child.name === "a" && child.attrs.href) {
		return [
			hyperlink(child.attrs.href, inlineRuns(child, marks, context), context),
		];
	}
	return inlineRuns(child, markFor(child.name, marks), context);
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

function paragraph(
	properties: XmlElement | null,
	runs: XmlElement[],
): XmlElement {
	return element("w:p", {}, properties ? [properties, ...runs] : runs);
}

function styledParagraph(
	style: string | null,
	node: XmlElement,
	context: WriteContext,
): XmlElement {
	const properties =
		style !== null && context.styles.has(style)
			? element("w:pPr", {}, [element("w:pStyle", { "w:val": style })])
			: null;
	return paragraph(properties, inlineRuns(node, NO_MARKS, context));
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

function hasClass(node: XmlElement, name: string): boolean {
	const classes: string | undefined = node.attrs.class;
	return (classes ?? "").split(/\s+/).includes(name);
}

function isListNode(node: XmlElement): boolean {
	return hasClass(node, LIST_CLASS) || node.name === "ul" || node.name === "ol";
}

/** The table's rows, reusing the original's layout properties by position. */
function tableElement(node: XmlElement, context: WriteContext): XmlElement {
	const original = context.tables[context.tableIndex++];
	const rows = findElements(node, "tr").map((row) => {
		const cells = row.children
			.filter(
				(cell): cell is XmlElement =>
					isElement(cell) && (cell.name === "td" || cell.name === "th"),
			)
			.map((cell) => {
				const blocks = blockElements(cell, context, 0);
				return element(
					"w:tc",
					{},
					blocks.length > 0 ? blocks : [element("w:p")],
				);
			});
		return element("w:tr", {}, cells);
	});

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
			];
	return element("w:tbl", {}, [...layout, ...rows]);
}

/** A rule, drawn the way Word draws one: an empty paragraph with a border. */
function horizontalRule(): XmlElement {
	return paragraph(
		element("w:pPr", {}, [
			element("w:pBdr", {}, [
				element("w:bottom", {
					"w:val": "single",
					"w:sz": "6",
					"w:space": "1",
					"w:color": "auto",
				}),
			]),
		]),
		[],
	);
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
	"u",
]);

function quoted(blocks: XmlElement[], context: WriteContext): XmlElement[] {
	if (!context.styles.has("Quote")) {
		return blocks;
	}
	for (const block of blocks) {
		if (block.name !== "w:p") {
			continue;
		}
		let properties = childNamed(block, "w:pPr");
		if (!properties) {
			properties = element("w:pPr");
			block.children.unshift(properties);
		}
		properties.children.unshift(element("w:pStyle", { "w:val": "Quote" }));
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
			listItem(item, node.name === "ol", level, context),
		);
	}
	if (hasClass(node, LIST_CLASS)) {
		const content = node.children.find(
			(child): child is XmlElement =>
				isElement(child) && hasClass(child, "list-content"),
		);
		return listItem(
			content ?? node,
			node.attrs["data-list-kind"] === "ordered",
			level,
			context,
		);
	}
	if (TRANSPARENT.has(node.name)) {
		return blockElements(node, context, level);
	}
	if (node.name === "pre") {
		return [styledParagraph("Code", node, context)];
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
	ordered: boolean,
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
				if (block.name === "w:p" && properties) {
					block.children.unshift(structuredClone(properties));
				}
				return block;
			})
		: [
				paragraph(
					properties,
					inlineRuns(element("li", {}, own), NO_MARKS, context),
				),
			];

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
	for (const node of childrenNamed(body, "w:p")) {
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
		images: imageRuns(entries, body),
		links,
		added: [],
		nextId: highest + 1,
		styles: styleIds(entries),
		listProperties: listExemplars(entries, body),
		tables: childrenNamed(body, "w:tbl"),
		tableIndex: 0,
	};
}

/** Append the relationships created for links the editor added. */
function appendRelationships(
	entries: ZipEntry[],
	added: { id: string; target: string }[],
): void {
	if (added.length === 0) {
		return;
	}
	const source = partText(entries, RELS_PART);
	if (!source) {
		throw new NotADocumentError("Package has no document relationships");
	}
	const document = parseXml(source);
	for (const { id, target } of added) {
		document.root.children.push(
			element("Relationship", {
				Id: id,
				Type: HYPERLINK_TYPE,
				Target: target,
				TargetMode: "External",
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
	appendRelationships(entries, context.added);
}
