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
const RELATIONSHIPS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NOTES_TYPE = `${RELATIONSHIPS}/notesSlide`;
const NOTES_MASTER_TYPE = `${RELATIONSHIPS}/notesMaster`;
const NOTES_CONTENT_TYPE =
	"application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml";
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
export function freeNames(entries: ZipEntry[]): {
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

export function appendRelationship(
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

export function declareContentType(
	entries: ZipEntry[],
	part: string,
	contentType = SLIDE_CONTENT_TYPE,
): void {
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
			element("Override", { PartName: name, ContentType: contentType }),
		);
		setPartText(entries, CONTENT_TYPES, serializeXml(document));
	}
}

/** Put the slide id list back in the order given, keeping each entry's id. */
export function rewriteSlideList(entries: ZipEntry[], order: string[]): void {
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

/** The `_rels` sidecar of a part. */
export function relsPartFor(part: string): string {
	const cut = part.lastIndexOf("/");
	return `${part.slice(0, cut)}/_rels/${part.slice(cut + 1)}.rels`;
}

/** Remove a part, its relationships and its content-type override. */
export function removePart(entries: ZipEntry[], part: string): void {
	for (const name of [part, relsPartFor(part)]) {
		const at = entries.findIndex((entry) => entry.name === name);
		if (at !== -1) {
			entries.splice(at, 1);
		}
	}
	const typesSource = partText(entries, CONTENT_TYPES);
	if (typesSource) {
		const document = parseXml(typesSource);
		document.root.children = document.root.children.filter(
			(child) =>
				child.type !== "element" || child.attrs.PartName !== `/${part}`,
		);
		setPartText(entries, CONTENT_TYPES, serializeXml(document));
	}
}

/** Drop a slide from the deck and remove its parts, notes included. */
export function removeSlide(entries: ZipEntry[], slide: SlideRef): void {
	const notes = notesPartFor(entries, slide.part);
	removePart(entries, slide.part);
	if (notes) {
		removePart(entries, notes);
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
}

function placeholder(shape: XmlElement): XmlElement | undefined {
	const properties = childNamed(shape, "p:nvSpPr");
	const nvPr = properties && childNamed(properties, "p:nvPr");
	return nvPr && childNamed(nvPr, "p:ph");
}

/** The placeholder type of a shape — `title`, `subTitle`, `body`, or none. */
export function placeholderType(shape: XmlElement): string | undefined {
	return placeholder(shape)?.attrs.type;
}

/** Shapes with text in them, in the order they appear on the slide. */
export function textShapes(tree: XmlElement): XmlElement[] {
	return findElements(tree, "p:sp").filter(
		(shape) => childNamed(shape, "p:txBody") !== undefined,
	);
}

// =========================================================================
// Speaker notes
// =========================================================================

/** A relationship target, resolved against the folder of the part it is from. */
function resolveFrom(part: string, target: string): string {
	if (target.startsWith("/")) {
		return target.slice(1);
	}
	const path = part.split("/").slice(0, -1);
	for (const segment of target.split("/")) {
		if (segment === "..") {
			path.pop();
		} else if (segment !== ".") {
			path.push(segment);
		}
	}
	return path.join("/");
}

function relationshipOfType(
	entries: ZipEntry[],
	part: string,
	type: string,
): string | null {
	const source = partText(entries, relsPartFor(part));
	const found =
		source &&
		findElements(parseXml(source).root, "Relationship").find(
			(relationship) => relationship.attrs.Type === type,
		);
	return found ? resolveFrom(part, found.attrs.Target ?? "") : null;
}

/** The notes page of a slide, when it has one. */
export function notesPartFor(
	entries: ZipEntry[],
	slide: string,
): string | null {
	const part = relationshipOfType(entries, slide, NOTES_TYPE);
	return part && partText(entries, part) !== null ? part : null;
}

/** Relative path from one part's folder to another part. */
function relativeTarget(from: string, to: string): string {
	const up = from.split("/").length - 2;
	return `${"../".repeat(up)}${to.split("/").slice(1).join("/")}`;
}

function appendPartRelationship(
	entries: ZipEntry[],
	part: string,
	type: string,
	target: string,
): void {
	const name = relsPartFor(part);
	const document = parseXml(
		partText(entries, name) ??
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
	);
	let highest = 0;
	for (const relationship of childrenNamed(document.root, "Relationship")) {
		highest = Math.max(
			highest,
			Number(/^rId(\d+)$/.exec(relationship.attrs.Id ?? "")?.[1] ?? 0),
		);
	}
	document.root.children.push(
		element("Relationship", {
			Id: `rId${highest + 1}`,
			Type: type,
			Target: relativeTarget(part, target),
		}),
	);
	setPartText(entries, name, serializeXml(document));
}

const NOTES_XML = (body: string) =>
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${RELATIONSHIPS}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${body}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;

/**
 * Give a slide an empty notes page. A notes page needs the deck's notes
 * master, so a deck without one gets nothing and the caller drops the notes.
 */
export function addNotes(entries: ZipEntry[], slide: string): string | null {
	const master = relationshipOfType(
		entries,
		PRESENTATION_PART,
		NOTES_MASTER_TYPE,
	);
	if (!master || partText(entries, master) === null) {
		return null;
	}
	let highest = 0;
	for (const entry of entries) {
		const number = Number(
			/^ppt\/notesSlides\/notesSlide(\d+)\.xml$/.exec(entry.name)?.[1] ?? 0,
		);
		highest = Math.max(highest, number);
	}
	const part = `ppt/notesSlides/notesSlide${highest + 1}.xml`;
	setPartText(entries, part, NOTES_XML("<a:p/>"));
	appendPartRelationship(entries, part, NOTES_MASTER_TYPE, master);
	appendPartRelationship(entries, part, `${RELATIONSHIPS}/slide`, slide);
	appendPartRelationship(entries, slide, NOTES_TYPE, part);
	declareContentType(entries, part, NOTES_CONTENT_TYPE);
	return part;
}
