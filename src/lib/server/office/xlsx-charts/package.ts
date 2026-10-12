import { relsPartFor } from "../pptx-package";
import { resolveTarget } from "../slides/parts";
import {
	element,
	isElement,
	parseXml,
	type XmlDocument,
	type XmlElement,
} from "../xml";
import { partText, type ZipEntry } from "../zip";

/**
 * Package plumbing for charts: elements matched by local name (producers
 * disagree on prefixes), relationships, parts and content types.
 */

export const REL_NS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export const PKG_REL_NS =
	"http://schemas.openxmlformats.org/package/2006/relationships";
export const CHART_NS =
	"http://schemas.openxmlformats.org/drawingml/2006/chart";
export const DRAWING_NS =
	"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
export const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
export const REL = {
	drawing: `${REL_NS}/drawing`,
	chart: `${REL_NS}/chart`,
	theme: `${REL_NS}/theme`,
};
export const CONTENT = {
	chart: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
	drawing: "application/vnd.openxmlformats-officedocument.drawing+xml",
};
export const PROLOG =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
/** EMU per CSS pixel. */
export const EMU = 9525;

// =========================================================================
// Walking by local name
// =========================================================================

export const local = (node: XmlElement) =>
	node.name.slice(node.name.indexOf(":") + 1);

export const kids = (
	parent: XmlElement | undefined,
	name?: string,
): XmlElement[] =>
	(parent?.children ?? []).filter(
		(child): child is XmlElement =>
			isElement(child) && (name === undefined || local(child) === name),
	);

export const kid = (parent: XmlElement | undefined, name: string) =>
	kids(parent, name)[0];

export function all(
	parent: XmlElement | undefined,
	name: string,
): XmlElement[] {
	const out: XmlElement[] = [];
	for (const child of kids(parent)) {
		if (local(child) === name) {
			out.push(child);
		}
		out.push(...all(child, name));
	}
	return out;
}

export const first = (parent: XmlElement | undefined, name: string) =>
	all(parent, name)[0];

export const val = (parent: XmlElement | undefined, name: string) =>
	kid(parent, name)?.attrs.val;

/** `val="1"` and a bare element both mean true; only `0`/`false` is false. */
export const flag = (parent: XmlElement | undefined, name: string) => {
	const node = kid(parent, name);
	return node !== undefined && !["0", "false"].includes(node.attrs.val ?? "1");
};

export const prefixOf = (node: XmlElement) =>
	node.name.includes(":") ? node.name.slice(0, node.name.indexOf(":") + 1) : "";

// =========================================================================
// Relationships
// =========================================================================

export interface Rels {
	path: string;
	doc: XmlDocument;
}

export function openRels(entries: ZipEntry[], part: string): Rels {
	const path = relsPartFor(part);
	const source = partText(entries, path);
	return {
		path,
		doc: parseXml(
			source ??
				`${PROLOG}<Relationships xmlns="${PKG_REL_NS}"></Relationships>`,
		),
	};
}

export const relList = (rels: Rels) => kids(rels.doc.root, "Relationship");

export function relTarget(rels: Rels, part: string, id: string | undefined) {
	const rel = relList(rels).find((r) => r.attrs.Id === id);
	if (!rel || rel.attrs.TargetMode === "External") {
		return undefined;
	}
	return resolveTarget(part, rel.attrs.Target ?? "");
}

export function addRel(
	rels: Rels,
	type: string,
	from: string,
	to: string,
): string {
	const taken = new Set(relList(rels).map((r) => r.attrs.Id));
	let n = 1;
	while (taken.has(`rId${n}`)) {
		n++;
	}
	rels.doc.root.children.push(
		element("Relationship", {
			Id: `rId${n}`,
			Type: type,
			Target: relativeTarget(from, to),
		}),
	);
	return `rId${n}`;
}

/** `xl/charts/chart1.xml` as seen from `xl/drawings/drawing1.xml`. */
export function relativeTarget(from: string, to: string): string {
	const base = from.split("/").slice(0, -1);
	const target = to.split("/");
	let common = 0;
	while (
		common < base.length &&
		common < target.length - 1 &&
		base[common] === target[common]
	) {
		common++;
	}
	return [...base.slice(common).map(() => ".."), ...target.slice(common)].join(
		"/",
	);
}

export function freePart(
	entries: ZipEntry[],
	make: (n: number) => string,
): string {
	for (let n = 1; ; n++) {
		const name = make(n);
		if (!entries.some((entry) => entry.name === name)) {
			return name;
		}
	}
}

export function removeEntry(entries: ZipEntry[], name: string): void {
	const at = entries.findIndex((entry) => entry.name === name);
	if (at >= 0) {
		entries.splice(at, 1);
	}
}

export function setOverride(
	types: XmlDocument,
	part: string,
	type: string,
): void {
	types.root.children.push(
		element("Override", { PartName: `/${part}`, ContentType: type }),
	);
}

export function removeOverride(types: XmlDocument, part: string): void {
	types.root.children = types.root.children.filter(
		(child) =>
			!(
				isElement(child) &&
				local(child) === "Override" &&
				child.attrs.PartName === `/${part}`
			),
	);
}
