import {
	childNamed,
	childrenNamed,
	findElement,
	findElements,
	parseXml,
	type XmlElement,
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
function resolvePart(target: string): string {
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
