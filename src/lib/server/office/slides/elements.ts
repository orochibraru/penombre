import type {
	Box,
	Color,
	Fill,
	GroupElement,
	ImageElement,
	LevelStyle,
	Line,
	Master,
	Placeholder,
	RawElement,
	ShapeElement,
	SlideElement,
} from "#lib/slides/model.js";
import { BODY_FONT, HEADING_FONT, mergeLevels } from "#lib/slides/text.js";
import {
	childNamed,
	childrenNamed,
	findElement,
	findElements,
	isElement,
	type XmlElement,
} from "../xml";
import {
	colorChild,
	fillChild,
	readColor,
	readFill,
	readGeometry,
	readLevels,
	readLine,
	readParagraph,
	readTextBody,
	readXfrm,
} from "./drawingml";
import type { Relationship, ThemeInfo } from "./parts";

/**
 * Slide elements read into the model, placeholders resolved against what
 * their layout and master say.
 */

// =========================================================================
// Inheritance
// =========================================================================

export interface PlaceholderInfo {
	type?: string;
	idx?: string;
	box?: Box;
	bodyPrs: (XmlElement | undefined)[];
	levels: LevelStyle[];
	fill?: Fill;
	line?: Partial<Line>;
}

export interface MasterInfo {
	part: string;
	model: Master;
	theme: ThemeInfo;
	placeholders: PlaceholderInfo[];
	styles: { title: LevelStyle[]; body: LevelStyle[]; other: LevelStyle[] };
}

export interface LayoutInfo {
	part: string;
	master: MasterInfo;
	placeholders: PlaceholderInfo[];
}

/** What a placeholder type is filled from on the master. */
function masterRole(type: string | undefined): string {
	if (type === "title" || type === "ctrTitle") {
		return "title";
	}
	if (type === "dt" || type === "ftr" || type === "sldNum" || type === "hdr") {
		return type;
	}
	return "body";
}

export function stylesFor(
	type: string | undefined,
	master: MasterInfo,
): LevelStyle[] {
	const role = masterRole(type);
	if (role === "title") {
		return master.styles.title;
	}
	return role === "body" ? master.styles.body : master.styles.other;
}

export function matchMaster(
	master: MasterInfo,
	ph: Placeholder,
): PlaceholderInfo | undefined {
	const role = masterRole(ph.type);
	return master.placeholders.find(
		(candidate) => masterRole(candidate.type ?? "body") === role,
	);
}

export function matchLayout(
	layout: LayoutInfo | undefined,
	ph: Placeholder,
): PlaceholderInfo | undefined {
	if (!layout) {
		return undefined;
	}
	const titled = (type?: string) => type === "title" || type === "ctrTitle";
	const byIdx =
		ph.idx && !titled(ph.type)
			? layout.placeholders.find((p) => p.idx === ph.idx)
			: undefined;
	const byType = layout.placeholders.find((p) =>
		titled(ph.type)
			? titled(p.type)
			: (p.type ?? "obj") === (ph.type ?? "obj") && !ph.idx,
	);
	return byIdx ?? byType ?? matchMaster(layout.master, ph);
}

/** A placeholder as the layer below leaves it, with this layer's own XML laid over. */
export function inheritPlaceholder(
	node: XmlElement,
	below: PlaceholderInfo | undefined,
	base: LevelStyle[],
	media: (id: string) => string | undefined,
): PlaceholderInfo {
	const ph = placeholderOf(node) ?? {};
	const spPr = childNamed(node, "p:spPr");
	const body = childNamed(node, "p:txBody");
	const own = readLine(spPr && childNamed(spPr, "a:ln"));
	return {
		type: ph.type,
		idx: ph.idx,
		box: readXfrm(spPr && childNamed(spPr, "a:xfrm")) ?? below?.box,
		bodyPrs: [...(below?.bodyPrs ?? []), body && childNamed(body, "a:bodyPr")],
		levels: mergeLevels(
			below?.levels ?? base,
			readLevels(body && childNamed(body, "a:lstStyle")),
		),
		fill: readFill(fillChild(spPr), media) ?? below?.fill,
		line: own ? { ...below?.line, ...own } : below?.line,
	};
}

export function placeholderOf(node: XmlElement): Placeholder | undefined {
	const nv = node.children.find(
		(child): child is XmlElement =>
			isElement(child) && child.name.startsWith("p:nv"),
	);
	const nvPr = nv && childNamed(nv, "p:nvPr");
	const ph = nvPr && childNamed(nvPr, "p:ph");
	if (!ph) {
		return undefined;
	}
	const out: Placeholder = {};
	if (ph.attrs.type) {
		out.type = ph.attrs.type;
	}
	if (ph.attrs.idx) {
		out.idx = ph.attrs.idx;
	}
	return out;
}

// =========================================================================
// Elements
// =========================================================================

export type Mapping = (box: Box) => Box;
export const IDENTITY: Mapping = (box) => box;

export interface Scope {
	part: string;
	rels: Map<string, Relationship>;
	theme: ThemeInfo;
	inherited: (ph: Placeholder) => PlaceholderInfo | undefined;
	defaults: LevelStyle[];
	nodes?: Map<string, XmlElement>;
	groups?: Map<string, Mapping>;
}

export function media(scope: Scope): (id: string) => string | undefined {
	return (id) => {
		const relationship = scope.rels.get(id);
		return relationship && !relationship.external
			? relationship.target
			: undefined;
	};
}

function styleFill(
	style: XmlElement | undefined,
	scope: Scope,
): Fill | undefined {
	const ref = style && childNamed(style, "a:fillRef");
	const idx = Number(ref?.attrs.idx ?? 0);
	if (!ref || !idx) {
		return undefined;
	}
	const color = readColor(colorChild(ref));
	const source =
		idx >= 1001
			? scope.theme.backgrounds[idx - 1001]
			: scope.theme.fills[idx - 1];
	return (
		readFill(source, media(scope), color) ??
		(color ? { type: "solid", color } : undefined)
	);
}

function styleLine(
	style: XmlElement | undefined,
	scope: Scope,
): Partial<Line> | undefined {
	const ref = style && childNamed(style, "a:lnRef");
	const idx = Number(ref?.attrs.idx ?? 0);
	if (!ref || !idx) {
		return undefined;
	}
	return readLine(scope.theme.lines[idx - 1], readColor(colorChild(ref)));
}

function styleText(style: XmlElement | undefined): LevelStyle[] {
	const ref = style && childNamed(style, "a:fontRef");
	if (!ref) {
		return [];
	}
	const level: LevelStyle = {
		font: ref.attrs.idx === "major" ? HEADING_FONT : BODY_FONT,
	};
	const color = readColor(colorChild(ref));
	if (color) {
		level.color = color;
	}
	return Array.from({ length: 9 }, () => ({ ...level }));
}

function common(
	node: XmlElement,
	scope: Scope,
): Omit<ShapeElement, "kind" | "geometry" | "fill" | "line" | keyof Box> {
	const nv = node.children.find(
		(child): child is XmlElement =>
			isElement(child) && child.name.startsWith("p:nv"),
	);
	const properties = nv && childNamed(nv, "p:cNvPr");
	const id = properties?.attrs.id ?? "0";
	const out: Omit<
		ShapeElement,
		"kind" | "geometry" | "fill" | "line" | keyof Box
	> = {
		id,
		origin: `${scope.part}#${id}`,
	};
	if (properties?.attrs.name) {
		out.name = properties.attrs.name;
	}
	if (properties?.attrs.descr) {
		out.descr = properties.attrs.descr;
	}
	const ph = placeholderOf(node);
	if (ph) {
		out.placeholder = ph;
	}
	scope.nodes?.set(out.origin ?? "", node);
	return out;
}

const ZERO: Box = { x: 0, y: 0, w: 0, h: 0 };

function fullLine(...layers: (Partial<Line> | undefined)[]): Line {
	const merged = Object.assign({}, ...layers.filter(Boolean)) as Partial<Line>;
	return {
		...merged,
		fill: merged.fill ?? { type: "none" },
		width: merged.width ?? 9525,
	};
}

export function readShape(
	node: XmlElement,
	scope: Scope,
	map: Mapping,
): ShapeElement {
	const base = common(node, scope);
	const spPr = childNamed(node, "p:spPr");
	const style = childNamed(node, "p:style");
	const inherited = base.placeholder
		? scope.inherited(base.placeholder)
		: undefined;
	const box =
		readXfrm(spPr && childNamed(spPr, "a:xfrm")) ?? inherited?.box ?? ZERO;
	const element: ShapeElement = {
		...base,
		kind: "shape",
		...map(box),
		geometry: readGeometry(spPr) ?? { preset: "rect" },
		fill: readFill(fillChild(spPr), media(scope)) ??
			inherited?.fill ??
			styleFill(style, scope) ?? { type: "none" },
		line: fullLine(
			styleLine(style, scope),
			inherited?.line,
			readLine(spPr && childNamed(spPr, "a:ln")),
		),
	};
	const txBody = childNamed(node, "p:txBody");
	if (txBody) {
		const own = readLevels(childNamed(txBody, "a:lstStyle"));
		const levels = inherited
			? mergeLevels(inherited.levels, own)
			: mergeLevels(mergeLevels(scope.defaults, styleText(style)), own);
		element.text = readTextBody(
			txBody,
			[...(inherited?.bodyPrs ?? []), childNamed(txBody, "a:bodyPr")],
			levels,
		);
	}
	return element;
}

function isMedia(node: XmlElement): boolean {
	const nvPr = findElement(node, "p:nvPr");
	return (
		!!nvPr &&
		!!(
			childNamed(nvPr, "a:videoFile") ??
			childNamed(nvPr, "a:audioFile") ??
			findElement(nvPr, "p14:media")
		)
	);
}

function readCrop(blipFill: XmlElement | undefined): ImageElement["crop"] {
	const rect = blipFill && childNamed(blipFill, "a:srcRect");
	if (!rect || !["l", "t", "r", "b"].some((side) => rect.attrs[side])) {
		return undefined;
	}
	return {
		l: Number(rect.attrs.l ?? 0),
		t: Number(rect.attrs.t ?? 0),
		r: Number(rect.attrs.r ?? 0),
		b: Number(rect.attrs.b ?? 0),
	};
}

function readPicture(
	node: XmlElement,
	scope: Scope,
	map: Mapping,
): ImageElement | RawElement {
	const base = common(node, scope);
	const spPr = childNamed(node, "p:spPr");
	const inherited = base.placeholder
		? scope.inherited(base.placeholder)
		: undefined;
	const box = map(
		readXfrm(spPr && childNamed(spPr, "a:xfrm")) ?? inherited?.box ?? ZERO,
	);
	if (isMedia(node)) {
		return { ...base, kind: "raw", label: "media", ...box };
	}
	const blipFill = childNamed(node, "p:blipFill");
	const id = blipFill && childNamed(blipFill, "a:blip")?.attrs["r:embed"];
	const image: ImageElement = {
		...base,
		kind: "image",
		...box,
		src: (id && media(scope)(id)) || "",
	};
	const crop = readCrop(blipFill);
	if (crop) {
		image.crop = crop;
	}
	const geometry = readGeometry(spPr);
	if (geometry && !("preset" in geometry && geometry.preset === "rect")) {
		image.geometry = geometry;
	}
	const line = readLine(spPr && childNamed(spPr, "a:ln"));
	if (line?.fill && line.fill.type !== "none") {
		image.line = fullLine(line);
	}
	return image;
}

function readGroup(node: XmlElement, scope: Scope, map: Mapping): GroupElement {
	const base = common(node, scope);
	const xfrm = findElement(childNamed(node, "p:grpSpPr") ?? node, "a:xfrm");
	const own = readXfrm(xfrm) ?? ZERO;
	const chOff = xfrm && childNamed(xfrm, "a:chOff");
	const chExt = xfrm && childNamed(xfrm, "a:chExt");
	const cx = Number(chOff?.attrs.x ?? own.x);
	const cy = Number(chOff?.attrs.y ?? own.y);
	const sx =
		Number(chExt?.attrs.cx ?? 0) > 0 ? own.w / Number(chExt?.attrs.cx) : 1;
	const sy =
		Number(chExt?.attrs.cy ?? 0) > 0 ? own.h / Number(chExt?.attrs.cy) : 1;
	const inner: Mapping = (box) =>
		map({
			...box,
			x: own.x + (box.x - cx) * sx,
			y: own.y + (box.y - cy) * sy,
			w: box.w * sx,
			h: box.h * sy,
		});
	scope.groups?.set(base.origin ?? "", inner);
	return {
		...base,
		kind: "group",
		...map(own),
		children: readElements(node, scope, inner),
	};
}

function readFrame(node: XmlElement, scope: Scope, map: Mapping): RawElement {
	const base = common(node, scope);
	const box = map(readXfrm(childNamed(node, "p:xfrm")) ?? ZERO);
	const uri = findElement(node, "a:graphicData")?.attrs.uri ?? "";
	const label = uri.endsWith("/table")
		? "table"
		: uri.endsWith("/chart")
			? "chart"
			: uri.includes("diagram")
				? "diagram"
				: "object";
	const raw: RawElement = { ...base, kind: "raw", label, ...box };
	const table = findElement(node, "a:tbl");
	if (table) {
		raw.table = {
			columns: findElements(table, "a:gridCol").map((column) =>
				Number(column.attrs.w ?? 0),
			),
			rows: childrenNamed(table, "a:tr").map((row) => ({
				h: Number(row.attrs.h ?? 0),
				cells: childrenNamed(row, "a:tc").map((cell) => ({
					text: findElements(cell, "a:p")
						.map((p) =>
							readParagraph(p)
								.runs.map((run) => run.text)
								.join(""),
						)
						.join(" "),
				})),
			})),
		};
	}
	return raw;
}

/** An `mc:AlternateContent` kept whole, shown by the fallback it carries. */
function readAlternate(
	node: XmlElement,
	scope: Scope,
	map: Mapping,
): RawElement | null {
	const branch =
		childNamed(node, "mc:Fallback") ?? childNamed(node, "mc:Choice");
	const inner = branch?.children.find((child): child is XmlElement =>
		isElement(child),
	);
	if (!inner) {
		return null;
	}
	const preview = readElement(
		inner,
		{ ...scope, nodes: undefined, groups: undefined },
		map,
	);
	const id = preview?.id ?? "0";
	const origin = `${scope.part}#${id}`;
	scope.nodes?.set(origin, node);
	const box = preview
		? {
				x: preview.x,
				y: preview.y,
				w: preview.w,
				h: preview.h,
				rot: preview.rot,
			}
		: ZERO;
	return {
		kind: "raw",
		id,
		origin,
		label: findElement(node, "p:contentPart") ? "ink" : "object",
		...box,
		preview:
			preview && preview.kind !== "raw"
				? { ...preview, origin: undefined }
				: undefined,
	};
}

function readElement(
	node: XmlElement,
	scope: Scope,
	map: Mapping = IDENTITY,
): SlideElement | null {
	switch (node.name) {
		case "p:sp":
		case "p:cxnSp":
			return readShape(node, scope, map);
		case "p:pic":
			return readPicture(node, scope, map);
		case "p:grpSp":
			return readGroup(node, scope, map);
		case "p:graphicFrame":
			return readFrame(node, scope, map);
		case "mc:AlternateContent":
			return readAlternate(node, scope, map);
		default:
			return readUnknown(node, scope, map);
	}
}

/** Anything else in a shape tree — PowerPoint's own ink, a content part. */
function readUnknown(node: XmlElement, scope: Scope, map: Mapping): RawElement {
	const id =
		findElement(node, "p:cNvPr")?.attrs.id ?? `x${scope.nodes?.size ?? 0}`;
	const origin = `${scope.part}#${id}`;
	scope.nodes?.set(origin, node);
	const xfrm = ["p:xfrm", "p14:xfrm", "a:xfrm"]
		.map((name) => findElement(node, name))
		.find(Boolean);
	return {
		kind: "raw",
		id,
		origin,
		label: node.name === "p:contentPart" ? "ink" : "object",
		...map(readXfrm(xfrm) ?? ZERO),
	};
}

/** Children of a shape tree that are the tree's own properties, not shapes. */
export const TREE_PROPERTIES = new Set([
	"p:nvGrpSpPr",
	"p:grpSpPr",
	"p:extLst",
]);

export function readElements(
	tree: XmlElement,
	scope: Scope,
	map: Mapping = IDENTITY,
): SlideElement[] {
	return tree.children
		.filter(
			(child): child is XmlElement =>
				isElement(child) && !TREE_PROPERTIES.has(child.name),
		)
		.map((child) => readElement(child, scope, map))
		.filter((element): element is SlideElement => element !== null);
}

export function background(root: XmlElement, scope: Scope): Fill | undefined {
	const bg = findElement(root, "p:bg");
	if (!bg) {
		return undefined;
	}
	const properties = childNamed(bg, "p:bgPr");
	if (properties) {
		return readFill(fillChild(properties), media(scope));
	}
	const ref = childNamed(bg, "p:bgRef");
	if (ref) {
		const idx = Number(ref.attrs.idx ?? 0);
		const color: Color | undefined = readColor(colorChild(ref));
		const source =
			idx >= 1001
				? scope.theme.backgrounds[idx - 1001]
				: scope.theme.fills[idx - 1];
		return (
			readFill(source, media(scope), color) ??
			(color ? { type: "solid", color } : undefined)
		);
	}
	return undefined;
}
