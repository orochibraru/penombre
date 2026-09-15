import {
	childNamed,
	childrenNamed,
	element,
	findElement,
	findElements,
	parseXml,
	serializeXml,
	type XmlElement,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * The slide list of a presentation, and the four places a slide has to be
 * registered for PowerPoint to open the file: the part itself, its own
 * relationships, the content-type override, the presentation's relationships
 * and the slide id list. Miss one and the deck opens as "needs repair".
 */

const PRESENTATION_PART = "ppt/presentation.xml";
const PRESENTATION_RELS = "ppt/_rels/presentation.xml.rels";
const CONTENT_TYPES = "[Content_Types].xml";
const SLIDE_TYPE =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide";
const SLIDE_CONTENT_TYPE =
	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml";

export class NotAPresentationError extends Error {}

export interface SlideRef {
	/** The `ppt/slides/slideN.xml` part. */
	part: string;
	/** Its relationship id in the presentation. */
	relationship: string;
}

function presentationXml(entries: ZipEntry[]): string {
	const source = partText(entries, PRESENTATION_PART);
	if (!source) {
		throw new NotAPresentationError("Package has no ppt/presentation.xml");
	}
	return source;
}

function relationshipTargets(entries: ZipEntry[]): Map<string, string> {
	const source = partText(entries, PRESENTATION_RELS);
	const targets = new Map<string, string>();
	if (!source) {
		return targets;
	}
	for (const node of findElements(parseXml(source).root, "Relationship")) {
		const id = node.attrs.Id;
		if (id) {
			targets.set(id, node.attrs.Target ?? "");
		}
	}
	return targets;
}

/** A target in the presentation's relationships, resolved against `ppt/`. */
function resolvePart(target: string): string {
	return `ppt/${target.replace(/^\/?ppt\//, "").replace(/^\//, "")}`;
}

/** The slides, in the order the deck presents them. */
export function slideRefs(entries: ZipEntry[]): SlideRef[] {
	const list = findElement(
		parseXml(presentationXml(entries)).root,
		"p:sldIdLst",
	);
	const targets = relationshipTargets(entries);
	if (!list) {
		return [];
	}
	return childrenNamed(list, "p:sldId")
		.map((slide) => slide.attrs["r:id"] ?? "")
		.filter((id) => targets.has(id))
		.map((id) => ({
			part: resolvePart(targets.get(id) as string),
			relationship: id,
		}));
}

/** The next free `slideN.xml` number and the next free relationship id. */
function freeNames(entries: ZipEntry[]): {
	slide: number;
	relationship: string;
} {
	let slide = 0;
	for (const entry of entries) {
		const number = Number(
			/^ppt\/slides\/slide(\d+)\.xml$/.exec(entry.name)?.[1],
		);
		if (Number.isFinite(number)) {
			slide = Math.max(slide, number);
		}
	}
	let highest = 0;
	for (const id of relationshipTargets(entries).keys()) {
		highest = Math.max(highest, Number(/^rId(\d+)$/.exec(id)?.[1] ?? 0));
	}
	return { slide: slide + 1, relationship: `rId${highest + 1}` };
}

function appendRelationship(
	entries: ZipEntry[],
	id: string,
	target: string,
): void {
	const source = partText(entries, PRESENTATION_RELS);
	if (!source) {
		throw new NotAPresentationError(
			"Package has no presentation relationships",
		);
	}
	const document = parseXml(source);
	document.root.children.push(
		element("Relationship", { Id: id, Type: SLIDE_TYPE, Target: target }),
	);
	setPartText(entries, PRESENTATION_RELS, serializeXml(document));
}

function declareContentType(entries: ZipEntry[], part: string): void {
	const source = partText(entries, CONTENT_TYPES);
	if (!source) {
		throw new NotAPresentationError("Package has no content types");
	}
	const document = parseXml(source);
	const name = `/${part}`;
	const declared = childrenNamed(document.root, "Override").some(
		(override) => override.attrs.PartName === name,
	);
	if (!declared) {
		document.root.children.push(
			element("Override", { PartName: name, ContentType: SLIDE_CONTENT_TYPE }),
		);
		setPartText(entries, CONTENT_TYPES, serializeXml(document));
	}
}

/** Put the slide id list back in the order given, keeping each entry's id. */
function rewriteSlideList(entries: ZipEntry[], order: string[]): void {
	const document = parseXml(presentationXml(entries));
	const list = findElement(document.root, "p:sldIdLst");
	if (!list) {
		throw new NotAPresentationError("Presentation has no slide id list");
	}
	const existing = new Map(
		childrenNamed(list, "p:sldId").map((slide) => [
			slide.attrs["r:id"] ?? "",
			slide,
		]),
	);
	let nextId = 256;
	for (const slide of existing.values()) {
		nextId = Math.max(nextId, Number(slide.attrs.id ?? 0) + 1);
	}
	list.children = order.map((id) => {
		const slide = existing.get(id);
		if (slide) {
			return slide;
		}
		return element("p:sldId", { id: String(nextId++), "r:id": id });
	});
	setPartText(entries, PRESENTATION_PART, serializeXml(document));
}

/**
 * The slide's own content stripped out, leaving its placeholders.
 *
 * A new slide is a copy of an existing one so that it inherits the deck's
 * layout rather than PowerPoint's defaults — but a copy that also inherited
 * the original's picture put last slide's photograph on every slide the user
 * added after it.
 */
function blankCopy(source: string): string {
	const document = parseXml(source);
	const tree = findElement(document.root, "p:spTree");
	if (tree) {
		tree.children = tree.children.filter((child) => {
			if (child.type !== "element") {
				return true;
			}
			// Pictures, charts, tables and free-standing text boxes are the
			// old slide's content. A placeholder is its layout.
			if (child.name === "p:sp") {
				return isPlaceholder(child);
			}
			return !["p:pic", "p:graphicFrame", "p:grpSp"].includes(child.name);
		});
	}
	return serializeXml(document);
}

/**
 * Copy a slide's layout as a new last slide. The copy shares the original's
 * relationships file, so it keeps the same slide layout without any part
 * having to be created for it.
 */
export function addSlide(entries: ZipEntry[], template: SlideRef): SlideRef {
	const source = entries.find((entry) => entry.name === template.part);
	if (!source) {
		throw new NotAPresentationError(`Missing slide part ${template.part}`);
	}
	const { slide, relationship } = freeNames(entries);
	const part = `ppt/slides/slide${slide}.xml`;

	entries.push({
		name: part,
		data: new TextEncoder().encode(
			blankCopy(new TextDecoder().decode(source.data)),
		),
		stored: false,
	});
	const templateRels = entries.find(
		(entry) => entry.name === relsPartFor(template.part),
	);
	if (templateRels) {
		entries.push({
			name: relsPartFor(part),
			data: new Uint8Array(templateRels.data),
			stored: false,
		});
	}

	appendRelationship(entries, relationship, `slides/slide${slide}.xml`);
	declareContentType(entries, part);
	return { part, relationship };
}

/** The `_rels` sidecar of a part. */
export function relsPartFor(part: string): string {
	const cut = part.lastIndexOf("/");
	return `${part.slice(0, cut)}/_rels/${part.slice(cut + 1)}.rels`;
}

/** Drop a slide from the deck and remove its parts from the package. */
export function removeSlide(entries: ZipEntry[], slide: SlideRef): void {
	for (const name of [slide.part, relsPartFor(slide.part)]) {
		const at = entries.findIndex((entry) => entry.name === name);
		if (at !== -1) {
			entries.splice(at, 1);
		}
	}

	const relsSource = partText(entries, PRESENTATION_RELS);
	if (relsSource) {
		const document = parseXml(relsSource);
		document.root.children = document.root.children.filter(
			(child) =>
				child.type !== "element" || child.attrs.Id !== slide.relationship,
		);
		setPartText(entries, PRESENTATION_RELS, serializeXml(document));
	}

	const typesSource = partText(entries, CONTENT_TYPES);
	if (typesSource) {
		const document = parseXml(typesSource);
		document.root.children = document.root.children.filter(
			(child) =>
				child.type !== "element" || child.attrs.PartName !== `/${slide.part}`,
		);
		setPartText(entries, CONTENT_TYPES, serializeXml(document));
	}
}

/** Match the deck's slide count to `wanted`, cloning or dropping at the end. */
export function resizeDeck(entries: ZipEntry[], wanted: number): SlideRef[] {
	const slides = slideRefs(entries);
	if (slides.length === 0) {
		throw new NotAPresentationError("Presentation has no slides");
	}
	while (slides.length > wanted && slides.length > 1) {
		const last = slides.pop() as SlideRef;
		removeSlide(entries, last);
	}
	while (slides.length < wanted) {
		slides.push(addSlide(entries, slides.at(-1) as SlideRef));
	}
	rewriteSlideList(
		entries,
		slides.map((slide) => slide.relationship),
	);
	return slides;
}

/** The shape tree of a slide part. */
export function shapeTree(entries: ZipEntry[], part: string): XmlElement {
	const source = partText(entries, part);
	if (!source) {
		throw new NotAPresentationError(`Missing slide part ${part}`);
	}
	const tree = findElement(parseXml(source).root, "p:spTree");
	if (!tree) {
		throw new NotAPresentationError(`Slide ${part} has no shape tree`);
	}
	return tree;
}

function placeholder(shape: XmlElement): XmlElement | undefined {
	const properties = childNamed(shape, "p:nvSpPr");
	const nvPr = properties && childNamed(properties, "p:nvPr");
	return nvPr && childNamed(nvPr, "p:ph");
}

/**
 * Whether a shape is one of the layout's placeholders.
 *
 * Not the same question as having a placeholder *type*: a content
 * placeholder is usually written `<p:ph idx="1"/>` with no type at all, and
 * treating that as content meant every slide copied for a new one lost its
 * body and got a free-floating text box instead.
 */
export function isPlaceholder(shape: XmlElement): boolean {
	return placeholder(shape) !== undefined;
}

/** The placeholder type of a shape — `title`, `subTitle`, `body`, or none. */
export function placeholderType(shape: XmlElement): string | undefined {
	return placeholder(shape)?.attrs.type;
}

export function isTitle(shape: XmlElement): boolean {
	const type = placeholderType(shape);
	return type === "title" || type === "ctrTitle";
}

/** Shapes with text in them, in the order they appear on the slide. */
export function textShapes(tree: XmlElement): XmlElement[] {
	return findElements(tree, "p:sp").filter(
		(shape) => childNamed(shape, "p:txBody") !== undefined,
	);
}
