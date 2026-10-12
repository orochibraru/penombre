import { isElement, parseXml, type XmlElement, type XmlNode } from "../xml";
import { v } from "./chart-write";
import { A_NS, CHART_NS, kid, kids, local } from "./package";

/**
 * Small edits on a parsed chart part, each in the place the schema puts it,
 * so a patched part keeps every node nobody asked to change.
 */

/** Elements written with the usual `c:` and `a:` prefixes. */
export function nodes(markup: string): XmlElement[] {
	const root = parseXml(
		`<root xmlns:c="${CHART_NS}" xmlns:a="${A_NS}">${markup}</root>`,
	).root;
	return kids(root);
}

export const node = (markup: string): XmlElement => {
	const [first] = nodes(markup);
	if (!first) {
		throw new Error("Empty fragment");
	}
	return first;
};

export const clone = <T extends XmlNode>(value: T): T => structuredClone(value);

/** `added` placed before the first child named in `followers`, else last. */
export function insertBefore(
	parent: XmlElement,
	added: XmlElement[],
	followers: readonly string[],
): void {
	const at = parent.children.findIndex(
		(child) => isElement(child) && followers.includes(local(child)),
	);
	parent.children.splice(at < 0 ? parent.children.length : at, 0, ...added);
}

export function remove(parent: XmlElement, names: readonly string[]): void {
	parent.children = parent.children.filter(
		(child) => !(isElement(child) && names.includes(local(child))),
	);
}

export function replace(
	parent: XmlElement,
	old: XmlElement,
	added: XmlElement[],
): void {
	const at = parent.children.indexOf(old);
	parent.children.splice(at, 1, ...added);
}

/** A `val`-carrying child set, or created before `followers`. */
export function setVal(
	parent: XmlElement,
	name: string,
	value: string | number,
	followers: readonly string[],
): void {
	const existing = kid(parent, name);
	if (existing) {
		existing.attrs.val = String(value);
	} else {
		insertBefore(parent, [node(v(name, value))], followers);
	}
}

/** What may follow each element, by the schema, for insertion. */
export const AFTER = {
	chartTitle: [
		"autoTitleDeleted",
		"pivotFmts",
		"view3D",
		"floor",
		"sideWall",
		"backWall",
		"plotArea",
	],
	autoTitleDeleted: [
		"pivotFmts",
		"view3D",
		"floor",
		"sideWall",
		"backWall",
		"plotArea",
	],
	legend: ["plotVisOnly", "dispBlanksAs", "showDLblsOverMax", "extLst"],
	legendPos: ["legendEntry", "layout", "overlay", "spPr", "txPr", "extLst"],
	axisTitle: [
		"numFmt",
		"majorTickMark",
		"minorTickMark",
		"tickLblPos",
		"spPr",
		"txPr",
		"crossAx",
	],
	gridlines: [
		"minorGridlines",
		"title",
		"numFmt",
		"majorTickMark",
		"minorTickMark",
		"tickLblPos",
		"spPr",
		"txPr",
		"crossAx",
	],
	max: ["min", "extLst"],
	min: ["extLst"],
	groupLabels: [
		"gapWidth",
		"overlap",
		"serLines",
		"dropLines",
		"hiLowLines",
		"upDownBars",
		"marker",
		"smooth",
		"firstSliceAng",
		"holeSize",
		"axId",
		"extLst",
	],
	overlap: ["serLines", "axId", "extLst"],
	groupMarker: ["smooth", "axId", "extLst"],
	serSpPr: [
		"invertIfNegative",
		"pictureOptions",
		"marker",
		"explosion",
		"dPt",
		"dLbls",
		"trendline",
		"errBars",
		"cat",
		"val",
		"xVal",
		"yVal",
		"smooth",
		"shape",
		"extLst",
	],
	serMarker: [
		"dPt",
		"dLbls",
		"trendline",
		"errBars",
		"cat",
		"val",
		"xVal",
		"yVal",
		"smooth",
		"extLst",
	],
	serData: ["smooth", "shape", "bubbleSize", "bubble3D", "extLst"],
	dPt: ["dLbls", "trendline", "errBars", "cat", "val", "extLst"],
	symbol: ["size", "spPr", "extLst"],
	markerSpPr: ["extLst"],
	spPrFill: ["ln", "effectLst", "effectDag", "scene3d", "sp3d", "extLst"],
	lnFill: [
		"prstDash",
		"custDash",
		"round",
		"bevel",
		"miter",
		"headEnd",
		"tailEnd",
		"extLst",
	],
} as const;

export const FILLS = [
	"noFill",
	"solidFill",
	"gradFill",
	"blipFill",
	"pattFill",
	"grpFill",
] as const;
