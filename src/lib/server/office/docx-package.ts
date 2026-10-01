import {
	childNamed,
	childrenNamed,
	findElement,
	findElements,
	isElement,
	parseXml,
	type XmlElement,
	type XmlNode,
} from "./xml";
import { partText, type ZipEntry } from "./zip";

/**
 * What both halves of the `.docx` conversion need to read out of the package.
 *
 * Every map here is derived from the archive alone, so the one built when a
 * document is opened and the one built when it is saved agree without any
 * state being carried between the two requests.
 */

export const DOCUMENT_PART = "word/document.xml";
export const RELS_PART = "word/_rels/document.xml.rels";
export const HYPERLINK_TYPE =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";

export class NotADocumentError extends Error {}

export function documentXml(entries: ZipEntry[]): string {
	const source = partText(entries, DOCUMENT_PART);
	if (!source) {
		throw new NotADocumentError("Package has no word/document.xml");
	}
	return source;
}

export function bodyOf(root: XmlElement): XmlElement {
	const body = findElement(root, "w:body");
	if (!body) {
		throw new NotADocumentError("Document has no body");
	}
	return body;
}

/** The tag a code block's content control carries: `penombre-code:rust`. */
export const CODE_TAG = "penombre-code";

/** Paragraph styles that mean code: ours, pandoc's and Word's pasted `<pre>`. */
export const CODE_STYLES = /^(Code|SourceCode|HTMLPreformatted)$/i;

/** A code block's language, or null when the content control is not one. */
export function codeLanguage(sdt: XmlElement): string | null {
	const properties = childNamed(sdt, "w:sdtPr");
	const tag = properties && childNamed(properties, "w:tag")?.attrs["w:val"];
	if (tag !== CODE_TAG && !tag?.startsWith(`${CODE_TAG}:`)) {
		return null;
	}
	return tag.slice(CODE_TAG.length + 1);
}

/**
 * The body's blocks, with content controls opened up: Word wraps a table of
 * contents or a form field in one, and skipping them dropped the text inside.
 * A code block's control is kept whole, since it is the block.
 */
export function bodyBlocks(parent: XmlElement): XmlElement[] {
	return parent.children.filter(isElement).flatMap((child) => {
		if (child.name !== "w:sdt" || codeLanguage(child) !== null) {
			return [child];
		}
		const content = childNamed(child, "w:sdtContent");
		return content ? bodyBlocks(content) : [];
	});
}

// =========================================================================
// Relationships and media
// =========================================================================

export interface Relationship {
	target: string;
	external: boolean;
}

export function relationships(entries: ZipEntry[]): Map<string, Relationship> {
	const source = partText(entries, RELS_PART);
	const map = new Map<string, Relationship>();
	if (!source) {
		return map;
	}
	for (const node of findElements(parseXml(source).root, "Relationship")) {
		const id = node.attrs.Id;
		if (id) {
			map.set(id, {
				target: node.attrs.Target ?? "",
				external: node.attrs.TargetMode === "External",
			});
		}
	}
	return map;
}

const MEDIA_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	bmp: "image/bmp",
	tif: "image/tiff",
	tiff: "image/tiff",
	svg: "image/svg+xml",
	webp: "image/webp",
};

/** A part reference resolved against `word/`, the document part's folder. */
export function resolvePart(target: string): string {
	return `word/${target.replace(/^\/?word\//, "").replace(/^\//, "")}`;
}

/** The relationship id a drawing or VML picture embeds, if it has one. */
export function embeddedId(run: XmlElement): string | undefined {
	for (const name of ["a:blip", "v:imagedata"]) {
		const node = findElement(run, name);
		const id = node?.attrs["r:embed"] ?? node?.attrs["r:id"];
		if (id) {
			return id;
		}
	}
	return undefined;
}

/**
 * Relationship id → the `src` handed to the editor for that image.
 *
 * A data URL rather than a link to a part: the src is then the image itself,
 * so the map rebuilt at save time keys on exactly the strings the editor was
 * given, with nothing to remember in between.
 */
export function imageSources(entries: ZipEntry[]): Map<string, string> {
	const sources = new Map<string, string>();
	for (const [id, relationship] of relationships(entries)) {
		if (relationship.external || !relationship.target.includes("media/")) {
			continue;
		}
		const entry = entries.find(
			(part) => part.name === resolvePart(relationship.target),
		);
		if (!entry) {
			continue;
		}
		const extension = relationship.target.split(".").pop()?.toLowerCase() ?? "";
		const type = MEDIA_TYPES[extension] ?? "application/octet-stream";
		sources.set(
			id,
			`data:${type};base64,${Buffer.from(entry.data).toString("base64")}`,
		);
	}
	return sources;
}

// =========================================================================
// Numbering
// =========================================================================

/** numId → whether level 0 of that list is a bullet rather than a number. */
export function bulletLists(entries: ZipEntry[]): Map<string, boolean> {
	const source = partText(entries, "word/numbering.xml");
	const kinds = new Map<string, boolean>();
	if (!source) {
		return kinds;
	}
	const root = parseXml(source).root;

	const abstractFormat = new Map<string, boolean>();
	for (const abstract of childrenNamed(root, "w:abstractNum")) {
		const id = abstract.attrs["w:abstractNumId"];
		const level =
			childrenNamed(abstract, "w:lvl").find(
				(lvl) => (lvl.attrs["w:ilvl"] ?? "0") === "0",
			) ?? abstract;
		const format = childNamed(level, "w:numFmt")?.attrs["w:val"];
		if (id) {
			abstractFormat.set(id, format === "bullet");
		}
	}
	for (const num of childrenNamed(root, "w:num")) {
		const id = num.attrs["w:numId"];
		const abstract = childNamed(num, "w:abstractNumId")?.attrs["w:val"];
		if (id && abstract) {
			kinds.set(id, abstractFormat.get(abstract) ?? false);
		}
	}
	return kinds;
}

export interface ListInfo {
	ordered: boolean;
	level: number;
}

export interface NumberingReference {
	numId: string;
	level: number;
}

/**
 * Style id → the numbering that style carries.
 *
 * Word puts a list in one of two places and a document may use either: on the
 * paragraph, or on the style the paragraph names. python-docx's `List Bullet`
 * is the second kind, and reading only the first turned every bullet in a
 * document written that way into a plain paragraph.
 */
export function styleNumbering(
	entries: ZipEntry[],
): Map<string, NumberingReference> {
	const source = partText(entries, "word/styles.xml");
	const numbering = new Map<string, NumberingReference>();
	if (!source) {
		return numbering;
	}
	for (const style of findElements(parseXml(source).root, "w:style")) {
		const id = style.attrs["w:styleId"];
		const reference = childNamed(
			childNamed(style, "w:pPr") ?? style,
			"w:numPr",
		);
		const numId = reference && childNamed(reference, "w:numId")?.attrs["w:val"];
		if (!(id && numId)) {
			continue;
		}
		// `ListBullet3` is level three of the same list; only the style id
		// says so, since its own `w:ilvl` is usually absent.
		const fromId = Number(/(\d)$/.exec(id)?.[1] ?? 1) - 1;
		const ilvl = childNamed(reference, "w:ilvl")?.attrs["w:val"];
		numbering.set(id, {
			numId,
			level: ilvl === undefined ? Math.max(0, fromId) : Number(ilvl),
		});
	}
	return numbering;
}

/** Whether a paragraph is a list item, and where in the list it sits. */
export function listInfo(
	paragraph: XmlElement,
	bullets: Map<string, boolean>,
	styles: Map<string, NumberingReference> = new Map(),
): ListInfo | null {
	const direct = childNamed(
		childNamed(paragraph, "w:pPr") ?? paragraph,
		"w:numPr",
	);
	const reference: NumberingReference | undefined = direct
		? {
				numId: childNamed(direct, "w:numId")?.attrs["w:val"] ?? "",
				level: Number(childNamed(direct, "w:ilvl")?.attrs["w:val"] ?? "0"),
			}
		: styles.get(styleOf(paragraph) ?? "");
	if (!reference || reference.numId === "") {
		return null;
	}
	return {
		ordered: bullets.get(reference.numId) === false,
		level: Number.isFinite(reference.level) ? reference.level : 0,
	};
}

/** A paragraph's style id, from its properties. */
export function styleOf(paragraph: XmlElement): string | undefined {
	return childNamed(childNamed(paragraph, "w:pPr") ?? paragraph, "w:pStyle")
		?.attrs["w:val"];
}

/** Style ids the document actually defines, so we never name a missing one. */
export function styleIds(entries: ZipEntry[]): Set<string> {
	const source = partText(entries, "word/styles.xml");
	const ids = new Set<string>();
	if (!source) {
		return ids;
	}
	for (const style of findElements(parseXml(source).root, "w:style")) {
		const id = style.attrs["w:styleId"];
		if (id) {
			ids.add(id);
		}
	}
	return ids;
}

// =========================================================================
// Run formatting
// =========================================================================

/** Word's sixteen highlight colours, by the name `w:highlight` stores. */
export const HIGHLIGHT_COLORS: Record<string, string> = {
	black: "000000",
	blue: "0000FF",
	cyan: "00FFFF",
	darkBlue: "000080",
	darkCyan: "008080",
	darkGray: "808080",
	darkGreen: "008000",
	darkMagenta: "800080",
	darkRed: "800000",
	darkYellow: "808000",
	green: "00FF00",
	lightGray: "C0C0C0",
	magenta: "FF00FF",
	red: "FF0000",
	white: "FFFFFF",
	yellow: "FFFF00",
};

const channel = (value: string): string =>
	Math.min(255, Math.round(Number(value)))
		.toString(16)
		.padStart(2, "0");

/**
 * A CSS colour as the six hex digits Word stores, or undefined for anything
 * that is not an opaque hex or `rgb()` colour. The browser hands a pasted
 * colour to the editor as `rgb(…)`, and a pasted background is often
 * `rgba(0, 0, 0, 0)`, which is no background at all.
 */
export function wordColor(css: string | undefined): string | undefined {
	const value = (css ?? "").trim().toLowerCase();
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value)?.[1];
	if (hex) {
		const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
		return full.toUpperCase();
	}
	const rgb =
		/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/.exec(
			value,
		);
	const [, red = "", green = "", blue = "", alpha] = rgb ?? [];
	if (!rgb || (alpha !== undefined && Number(alpha) === 0)) {
		return undefined;
	}
	return `${channel(red)}${channel(green)}${channel(blue)}`.toUpperCase();
}

/** Word's hex back to the CSS colour the editor writes, or undefined for `auto`. */
export function cssColor(word: string | undefined): string | undefined {
	return word && /^[0-9a-f]{6}$/i.test(word)
		? `#${word.toLowerCase()}`
		: undefined;
}

// =========================================================================
// The editor's CSS, as Word values
// =========================================================================

/** `font-size: 12pt;` → `{ "font-size": "12pt" }`. */
export function declarations(style: string | undefined): Map<string, string> {
	const map = new Map<string, string>();
	for (const part of (style ?? "").split(";")) {
		const colon = part.indexOf(":");
		if (colon > 0) {
			map.set(
				part.slice(0, colon).trim().toLowerCase(),
				part.slice(colon + 1).trim(),
			);
		}
	}
	return map;
}

/** The first family of a CSS font stack, unquoted. */
export function firstFamily(stack: string): string | undefined {
	const first = stack
		.split(",")[0]
		?.trim()
		.replace(/^["']|["']$/g, "");
	return first || undefined;
}

/** `12pt` or `16px` as half-points, which is what `w:sz` counts in. */
export function halfPoints(size: string): number | undefined {
	const match = /^([\d.]+)(pt|px)$/.exec(size.trim());
	if (!match) {
		return undefined;
	}
	const points = Number(match[1]) * (match[2] === "px" ? 0.75 : 1);
	const half = Math.round(points * 2);
	return half >= 2 && half <= 3276 ? half : undefined;
}

/** `CT_PPr`'s sequence: Word refuses a paragraph whose properties are not in it. */
const PARAGRAPH_ORDER = [
	"w:pStyle",
	"w:keepNext",
	"w:keepLines",
	"w:pageBreakBefore",
	"w:framePr",
	"w:widowControl",
	"w:numPr",
	"w:suppressLineNumbers",
	"w:pBdr",
	"w:shd",
	"w:tabs",
	"w:suppressAutoHyphens",
	"w:kinsoku",
	"w:wordWrap",
	"w:overflowPunct",
	"w:topLinePunct",
	"w:autoSpaceDE",
	"w:autoSpaceDN",
	"w:bidi",
	"w:adjustRightInd",
	"w:snapToGrid",
	"w:spacing",
	"w:ind",
	"w:contextualSpacing",
	"w:mirrorIndents",
	"w:suppressOverlap",
	"w:jc",
	"w:textDirection",
	"w:textAlignment",
	"w:textboxTightWrap",
	"w:outlineLvl",
	"w:divId",
	"w:cnfStyle",
	"w:rPr",
	"w:sectPr",
	"w:pPrChange",
];

/** Insert where the schema wants it, leaving what is already there in place. */
export function insertOrdered(children: XmlNode[], node: XmlElement): void {
	const rank = PARAGRAPH_ORDER.indexOf(node.name);
	const at = children.findIndex(
		(child) => isElement(child) && PARAGRAPH_ORDER.indexOf(child.name) > rank,
	);
	children.splice(at === -1 ? children.length : at, 0, node);
}

// =========================================================================
// A new document
// =========================================================================

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const W =
	'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const REL =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const MAIN = "application/vnd.openxmlformats-officedocument.wordprocessingml";

const heading = (level: number, half: number) =>
	`<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr></w:style>`;

/** `ListBullet`, `ListBullet2`… — the names the writer looks for, per depth. */
const listStyle = (family: string, numId: number, level: number) =>
	`<w:style w:type="paragraph" w:styleId="${family}${level ? level + 1 : ""}"><w:name w:val="${family.replace("List", "List ")}${level ? ` ${level + 1}` : ""}"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="${numId}"/></w:numPr></w:pPr></w:style>`;

const STYLES = `${XML}<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>${[40, 32, 28, 24, 22, 22].map((half, index) => heading(index + 1, half)).join("")}<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720"/></w:pPr><w:rPr><w:i/><w:color w:val="595959"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>${[0, 1, 2].map((level) => listStyle("ListBullet", 1, level) + listStyle("ListNumber", 2, level)).join("")}<w:style w:type="character" w:styleId="CodeChar"><w:name w:val="Code Char"/><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:rPr></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="auto"/>`).join("")}</w:tblBorders></w:tblPr></w:style></w:styles>`;

const level = (index: number, format: string, text: string) =>
	`<w:lvl w:ilvl="${index}"><w:start w:val="1"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (index + 1)}" w:hanging="360"/></w:pPr></w:lvl>`;

const NUMBERING = `${XML}<w:numbering ${W}><w:abstractNum w:abstractNumId="0">${["•", "◦", "▪"].map((bullet, index) => level(index, "bullet", bullet)).join("")}</w:abstractNum><w:abstractNum w:abstractNumId="1">${[
	["decimal", "%1."],
	["lowerLetter", "%2."],
	["lowerRoman", "%3."],
]
	.map(([format = "", text = ""], index) => level(index, format, text))
	.join(
		"",
	)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;

/**
 * An empty Word document with the styles the writer names — title, headings,
 * quote, code, lists, links, table grid — so `htmlToDocx` can fill it like
 * any other.
 * A4 with inch margins.
 */
export function blankDocument(): ZipEntry[] {
	const parts: Record<string, string> = {
		"[Content_Types].xml": `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="${MAIN}.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="${MAIN}.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="${MAIN}.numbering+xml"/></Types>`,
		"_rels/.rels": `${XML}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/></Relationships>`,
		[DOCUMENT_PART]: `${XML}<w:document ${W} xmlns:r="${REL}"><w:body><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`,
		[RELS_PART]: `${XML}<Relationships xmlns="${RELS}"><Relationship Id="rId1" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rId2" Type="${REL}/numbering" Target="numbering.xml"/></Relationships>`,
		"word/styles.xml": STYLES,
		"word/numbering.xml": NUMBERING,
	};
	return Object.entries(parts).map(([name, source]) => ({
		name,
		data: new TextEncoder().encode(source),
		stored: false,
	}));
}
