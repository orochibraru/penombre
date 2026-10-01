import type {
	Deck,
	Fill,
	ImageElement,
	ShapeElement,
	Slide,
	SlideElement,
	TextBody,
} from "#lib/slides/model.js";
import { sameValue } from "#lib/slides/model.js";
import {
	appendRelationship,
	declareContentType,
	freeNames,
	NotAPresentationError,
	removeSlide,
	rewriteSlideList,
	slideRefs,
} from "../pptx-package";
import {
	childNamed,
	childrenNamed,
	element,
	findElement,
	findElements,
	isElement,
	parseXml,
	serializeXml,
	type XmlElement,
} from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";
import { readTextBody } from "./drawingml";
import {
	fillNode,
	geometryNode,
	groupNode,
	lineNode,
	pictureNode,
	shapeNode,
	xfrmNode,
} from "./generate";
import { writeNotes } from "./notes";
import { installTemplate } from "./package";
import {
	boxOf,
	dropDanglingTiming,
	invert,
	mergeLine,
	nvProperties,
	patchText,
	sameBox,
	setSlot,
	type ToChild,
	withoutIds,
} from "./patch";
import {
	type LayoutInfo,
	matchLayout,
	type PackageModel,
	type PlaceholderInfo,
	REL,
	readPackage,
} from "./read";
import { MediaStore, pruneMedia, Rels, remapRelationships } from "./rels";

/**
 * The editor's model applied to a `.pptx`, in place.
 *
 * Every element that came from the file is written by patching the XML it
 * came from — only the properties that changed are rewritten — so effects,
 * animations, hyperlinks and everything else the model does not describe
 * survive. New elements are generated. Slides keep their parts where they
 * can, so their transitions and timings do too.
 */

const IDENTITY: ToChild = (box) => box;

interface Frame {
	/** The origin of the group being written into, or null at the top. */
	parent: string | null;
	toChild: ToChild;
	/** Rewrite every transform: the coordinate space changed underneath. */
	force: boolean;
}

const SLIDE_SKELETON = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

/** Relationships a slide holds only for its own shapes. */
const DROPPABLE = new Set([REL.image, REL.hyperlink]);

// =========================================================================
// One slide
// =========================================================================

interface WriteContext {
	entries: ZipEntry[];
	pkg: PackageModel;
	baseline: Map<string, SlideElement>;
	parents: Map<string, string | null>;
	media: MediaStore;
}

class SlideWriter {
	private readonly used = new Set<string>(["1"]);
	private readonly rels: Rels;

	constructor(
		private readonly context: WriteContext,
		readonly part: string,
		private readonly layout: LayoutInfo | undefined,
	) {
		this.rels = new Rels(context.entries, part);
	}

	/** Save the relationships, minus pictures and links nothing on `xml` uses. */
	save(xml: string): void {
		this.rels.dropUnused(xml, DROPPABLE);
		this.rels.save();
	}

	setLayout(layout: string): void {
		if (layout) {
			this.rels.retarget(REL.layout, layout);
		}
	}

	embed = (src: string): string | null => {
		const part = this.context.media.part(src);
		return part ? this.rels.ensure(REL.image, part) : null;
	};

	/** A free shape id, or `wanted` when nothing on the slide has it yet. */
	private claim(wanted: string): string {
		let id = wanted;
		if (!/^\d+$/.test(id) || this.used.has(id)) {
			let next = 2;
			while (this.used.has(String(next))) {
				next++;
			}
			id = String(next);
		}
		this.used.add(id);
		return id;
	}

	/** Keep the ids inside a node written as it was, so nothing new takes them. */
	private reserve(node: XmlElement): void {
		for (const properties of findElements(node, "p:cNvPr")) {
			if (properties.attrs.id) {
				this.used.add(properties.attrs.id);
			}
		}
	}

	background(cSld: XmlElement, fill: Fill | undefined): void {
		cSld.children = cSld.children.filter(
			(child) => !isElement(child) || child.name !== "p:bg",
		);
		if (fill) {
			cSld.children.unshift(
				element("p:bg", {}, [
					element("p:bgPr", {}, [
						fillNode(fill, this.embed),
						element("a:effectLst"),
					]),
				]),
			);
		}
	}

	node(el: SlideElement, frame: Frame): XmlElement | null {
		const origin = el.origin;
		const base = origin ? this.context.pkg.nodes.get(origin) : undefined;
		const before = origin ? this.context.baseline.get(origin) : undefined;
		let node: XmlElement | null;
		if (base && before && before.kind === el.kind) {
			node = structuredClone(base) as XmlElement;
			const moved =
				(this.context.parents.get(origin ?? "") ?? null) !== frame.parent;
			const originPart = origin?.split("#")[0] ?? this.part;
			if (
				moved ||
				frame.force ||
				!sameValue(withoutIds(el), withoutIds(before))
			) {
				this.patch(node, before, el, { ...frame, force: frame.force || moved });
			}
			if (originPart !== this.part) {
				remapRelationships(node, this.context.entries, originPart, this.rels);
			}
		} else {
			node = this.generate(el, frame);
		}
		if (!node) {
			return null;
		}
		if (el.kind === "raw") {
			this.reserve(node);
		} else {
			const properties = nvProperties(node);
			if (properties) {
				properties.attrs.id = this.claim(el.id);
			}
		}
		return node;
	}

	private inherited(el: SlideElement): PlaceholderInfo | undefined {
		return el.placeholder
			? matchLayout(this.layout, el.placeholder)
			: undefined;
	}

	private inheritedText(
		info: PlaceholderInfo | undefined,
	): TextBody | undefined {
		return info
			? readTextBody(element("p:txBody"), info.bodyPrs, info.levels)
			: undefined;
	}

	private generate(el: SlideElement, frame: Frame): XmlElement | null {
		const box = frame.toChild(boxOf(el));
		switch (el.kind) {
			case "shape": {
				const info = this.inherited(el);
				const line = {
					fill: { type: "none" as const },
					width: 9525,
					...info?.line,
				};
				return shapeNode(el, {
					box,
					inheritBox:
						!!info?.box &&
						info.type === el.placeholder?.type &&
						sameBox(box, info.box),
					inheritFill:
						!!el.placeholder &&
						sameValue(el.fill, info?.fill ?? { type: "none" }),
					inheritLine: !!el.placeholder && sameValue(el.line, line),
					inheritedText: this.inheritedText(info),
					embed: this.embed,
				});
			}
			case "image": {
				const id = this.embed(el.src);
				return id ? pictureNode(el, box, id) : null;
			}
			case "group": {
				const children = el.children
					.map((child) =>
						this.node(child, {
							parent: el.origin ?? null,
							toChild: frame.toChild,
							force: true,
						}),
					)
					.filter((child): child is XmlElement => child !== null);
				return children.length > 0 ? groupNode(el, box, children) : null;
			}
			default:
				return null;
		}
	}

	private writeBox(node: XmlElement, el: SlideElement, frame: Frame): void {
		const box = frame.toChild(boxOf(el));
		if (node.name === "mc:AlternateContent") {
			for (const branch of [
				...childrenNamed(node, "mc:Choice"),
				...childrenNamed(node, "mc:Fallback"),
			]) {
				const inner = branch.children.find((child): child is XmlElement =>
					isElement(child),
				);
				if (inner) {
					this.writeBox(inner, el, frame);
				}
			}
			return;
		}
		if (node.name === "p:graphicFrame") {
			const at = node.children.findIndex(
				(child) => isElement(child) && child.name === "p:xfrm",
			);
			if (at !== -1) {
				node.children[at] = xfrmNode(box, "p:xfrm");
			}
			return;
		}
		const spPr = childNamed(node, "p:spPr");
		if (!spPr) {
			return;
		}
		const info = this.inherited(el);
		setSlot(
			spPr,
			info?.box && info.type === el.placeholder?.type && sameBox(box, info.box)
				? null
				: xfrmNode(box),
			0,
		);
	}

	private patch(
		node: XmlElement,
		before: SlideElement,
		after: SlideElement,
		frame: Frame,
	): void {
		const properties = nvProperties(node);
		if (properties) {
			properties.attrs.name = after.name ?? properties.attrs.name;
			properties.attrs.descr = after.descr;
		}
		const ph = findElement(node, "p:ph");
		if (
			ph &&
			after.placeholder &&
			!sameValue(before.placeholder, after.placeholder)
		) {
			ph.attrs.type = after.placeholder.type;
			ph.attrs.idx = after.placeholder.idx;
		}
		const boxChanged = frame.force || !sameBox(before, after);
		if (after.kind === "group" && before.kind === "group") {
			this.patchGroup(node, after, frame, boxChanged);
			return;
		}
		if (boxChanged) {
			this.writeBox(node, after, frame);
		}
		const spPr = childNamed(node, "p:spPr");
		if (after.kind === "shape" && before.kind === "shape" && spPr) {
			this.patchShape(node, spPr, before, after);
		} else if (after.kind === "image" && before.kind === "image" && spPr) {
			this.patchImage(node, spPr, before, after);
		}
	}

	private patchGroup(
		node: XmlElement,
		after: SlideElement & { kind: "group" },
		frame: Frame,
		boxChanged: boolean,
	): void {
		const original = this.context.pkg.groups.get(after.origin ?? "");
		const toChild = boxChanged || !original ? frame.toChild : invert(original);
		if (boxChanged) {
			const grpSpPr = childNamed(node, "p:grpSpPr");
			if (grpSpPr) {
				setSlot(
					grpSpPr,
					xfrmNode(frame.toChild(boxOf(after)), "a:xfrm", true),
					0,
				);
			}
		}
		const children = after.children
			.map((child) =>
				this.node(child, {
					parent: after.origin ?? null,
					toChild,
					force: boxChanged,
				}),
			)
			.filter((child): child is XmlElement => child !== null);
		const kept = node.children.filter(
			(child) =>
				!isElement(child) || ["p:nvGrpSpPr", "p:grpSpPr"].includes(child.name),
		);
		const tail = node.children.filter(
			(child) => isElement(child) && child.name === "p:extLst",
		);
		node.children = [...kept, ...children, ...tail];
	}

	private patchShape(
		node: XmlElement,
		spPr: XmlElement,
		before: ShapeElement,
		after: ShapeElement,
	): void {
		if (!sameValue(before.geometry, after.geometry)) {
			setSlot(spPr, geometryNode(after.geometry), 1);
		}
		if (!sameValue(before.fill, after.fill)) {
			setSlot(spPr, fillNode(after.fill, this.embed), 2);
		}
		if (!sameValue(before.line, after.line)) {
			setSlot(
				spPr,
				mergeLine(childNamed(spPr, "a:ln"), lineNode(after.line)),
				3,
			);
		}
		if (!sameValue(before.text, after.text)) {
			patchText(
				node,
				before.text,
				after.text,
				this.inheritedText(this.inherited(after)),
			);
		}
	}

	private patchImage(
		node: XmlElement,
		spPr: XmlElement,
		before: ImageElement,
		after: ImageElement,
	): void {
		const blipFill = childNamed(node, "p:blipFill");
		const blip = blipFill && childNamed(blipFill, "a:blip");
		if (blip && before.src !== after.src) {
			const id = this.embed(after.src);
			if (id) {
				blip.attrs["r:embed"] = id;
			}
		}
		if (blipFill && !sameValue(before.crop, after.crop)) {
			const crop = after.crop;
			setSlot(
				blipFill,
				crop
					? element("a:srcRect", {
							l: String(crop.l),
							t: String(crop.t),
							r: String(crop.r),
							b: String(crop.b),
						})
					: null,
				1,
				[["a:blip"], ["a:srcRect"], ["a:tile", "a:stretch"]],
			);
		}
		if (!sameValue(before.geometry, after.geometry)) {
			setSlot(spPr, geometryNode(after.geometry ?? { preset: "rect" }), 1);
		}
		if (!sameValue(before.line, after.line)) {
			setSlot(spPr, after.line ? lineNode(after.line) : null, 3);
		}
	}
}

// =========================================================================
// The deck
// =========================================================================

/**
 * A new slide part: the name the editor gave it when that is free, so the
 * next save finds the slide where this one put it.
 */
function newSlidePart(
	entries: ZipEntry[],
	wanted: string | undefined,
): { part: string; relationship: string } {
	const { slide, relationship } = freeNames(entries);
	const free =
		!!wanted &&
		/^ppt\/slides\/slide\d+\.xml$/.test(wanted) &&
		!entries.some((entry) => entry.name === wanted);
	const part = free ? wanted : `ppt/slides/slide${slide}.xml`;
	setPartText(entries, part, SLIDE_SKELETON);
	appendRelationship(entries, relationship, part.replace(/^ppt\//, ""));
	declareContentType(entries, part);
	return { part, relationship };
}

function writeSlide(
	context: WriteContext,
	part: string,
	slide: Slide,
	reused: boolean,
): void {
	const document = parseXml(partText(context.entries, part) ?? SLIDE_SKELETON);
	const root = document.root;
	const cSld = childNamed(root, "p:cSld");
	const tree = cSld && findElement(cSld, "p:spTree");
	if (!cSld || !tree) {
		throw new NotAPresentationError(`Slide ${part} has no shape tree`);
	}
	const writer = new SlideWriter(
		context,
		part,
		context.pkg.layouts.get(slide.layout),
	);
	writer.setLayout(slide.layout);
	const baseline = reused
		? context.pkg.deck.slides.find((candidate) => candidate.source === part)
		: undefined;
	if (!reused || !sameValue(baseline?.background, slide.background)) {
		writer.background(cSld, slide.background);
	}
	if (slide.hidden) {
		root.attrs.show = "0";
	} else {
		delete root.attrs.show;
	}
	const own = tree.children.filter(
		(child) =>
			isElement(child) && ["p:nvGrpSpPr", "p:grpSpPr"].includes(child.name),
	);
	const tail = tree.children.filter(
		(child) => isElement(child) && child.name === "p:extLst",
	);
	const nodes = slide.elements
		.map((el) =>
			writer.node(el, { parent: null, toChild: IDENTITY, force: false }),
		)
		.filter((node): node is XmlElement => node !== null);
	tree.children = [...own, ...nodes, ...tail];
	dropDanglingTiming(root);
	const xml = serializeXml(document);
	writer.save(xml);
	setPartText(context.entries, part, xml);
}

/** Apply the editor's deck to the package, in place on `entries`. */
export function writeDeck(entries: ZipEntry[], incoming: Deck): void {
	let pkg = readPackage(entries);
	if (incoming.template && incoming.template !== pkg.deck.template) {
		installTemplate(entries, incoming.template);
		pkg = readPackage(entries);
	}
	const baseline = new Map<string, SlideElement>();
	const parents = new Map<string, string | null>();
	const walk = (elements: SlideElement[], parent: string | null) => {
		for (const el of elements) {
			if (el.origin) {
				baseline.set(el.origin, el);
				parents.set(el.origin, parent);
			}
			if (el.kind === "group") {
				walk(el.children, el.origin ?? null);
			}
		}
	};
	for (const slide of pkg.deck.slides) {
		walk(slide.elements, null);
	}
	const context: WriteContext = {
		entries,
		pkg,
		baseline,
		parents,
		media: new MediaStore(entries),
	};
	const refs = slideRefs(entries);
	const used = new Set<string>();
	const order: string[] = [];
	const slides =
		incoming.slides.length > 0
			? incoming.slides
			: [
					{
						id: "blank",
						layout: pkg.deck.layouts[0]?.part ?? "",
						notes: "",
						elements: [],
					},
				];
	for (const slide of slides) {
		const existing = refs.find(
			(ref) => ref.part === slide.source && !used.has(ref.part),
		);
		const target = existing ?? newSlidePart(entries, slide.source);
		used.add(target.part);
		writeSlide(context, target.part, slide, existing !== undefined);
		writeNotes(entries, target.part, slide.notes);
		order.push(target.relationship);
	}
	for (const ref of refs) {
		if (!used.has(ref.part)) {
			removeSlide(entries, ref);
		}
	}
	rewriteSlideList(entries, order);
	pruneMedia(entries);
}
