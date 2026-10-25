import type { Chart } from "#lib/chart/model.js";
import { relsPartFor } from "../pptx-package";
import {
	element,
	isElement,
	parseXml,
	serializeXml,
	type XmlDocument,
	type XmlElement,
} from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";
import {
	A_NS,
	addRel,
	all,
	CHART_NS,
	CONTENT,
	DRAWING_NS,
	EMU,
	freePart,
	kids,
	local,
	openRels,
	prefixOf,
	PROLOG,
	REL,
	REL_NS,
	relList,
	relTarget,
	removeEntry,
	removeOverride,
	setOverride,
} from "./package";
import { type Drawing, idOf, type Placed, sheetDrawingPart } from "./read";

/**
 * The drawing part's side of a save: anchors written and replaced, charts
 * removed with the parts only they used, a drawing created for a sheet that
 * had none and removed once it holds nothing.
 */

/** The package being written and its content types, written back by the caller. */
export interface Edit {
	entries: ZipEntry[];
	types: XmlDocument;
}

export function nextShapeId(doc: XmlDocument): number {
	return (
		all(doc.root, "cNvPr").reduce(
			(n, node) => Math.max(n, Number(node.attrs.id) || 0),
			1,
		) + 1
	);
}

function markerXml(p: string, tag: string, anchor: Chart["anchor"]): string {
	return `<${p}${tag}><${p}col>${anchor.col}</${p}col><${p}colOff>${Math.round(anchor.x * EMU)}</${p}colOff><${p}row>${anchor.row}</${p}row><${p}rowOff>${Math.round(anchor.y * EMU)}</${p}rowOff></${p}${tag}>`;
}

/** A `oneCellAnchor` around `frame` (serialised), in the drawing's prefix. */
export function anchorXml(
	p: string,
	anchor: Chart["anchor"],
	frame: string,
): string {
	const ext = `<${p}ext cx="${Math.round(anchor.width * EMU)}" cy="${Math.round(anchor.height * EMU)}"/>`;
	return `<${p}oneCellAnchor>${markerXml(p, "from", anchor)}${ext}${frame}<${p}clientData/></${p}oneCellAnchor>`;
}

export function frameXml(p: string, id: number, relId: string): string {
	return `<${p}graphicFrame macro=""><${p}nvGraphicFramePr><${p}cNvPr id="${id}" name="Chart ${id - 1}"/><${p}cNvGraphicFramePr/></${p}nvGraphicFramePr><${p}xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></${p}xfrm><a:graphic><a:graphicData uri="${CHART_NS}"><c:chart xmlns:c="${CHART_NS}" xmlns:r="${REL_NS}" r:id="${relId}"/></a:graphicData></a:graphic></${p}graphicFrame>`;
}

/** Parses a fragment written with the drawing's prefixes. */
export function fragment(markup: string): XmlElement {
	const root = parseXml(
		`<root xmlns:xdr="${DRAWING_NS}" xmlns:a="${A_NS}">${markup}</root>`,
	).root;
	const node = kids(root)[0];
	if (!node) {
		throw new Error("Empty fragment");
	}
	return node;
}

/** The drawing's root declares the prefixes new anchors are written with. */
export function drawingPrefix(doc: XmlDocument): string {
	const root = doc.root;
	const p = prefixOf(root);
	if (!p) {
		root.attrs["xmlns:xdr"] ??= DRAWING_NS;
	}
	if (
		!Object.entries(root.attrs).some(
			([k, value]) => k === "xmlns:a" && value === A_NS,
		)
	) {
		root.attrs["xmlns:a"] ??= A_NS;
	}
	return p || "xdr:";
}

const EMPTY_DRAWING = `${PROLOG}<xdr:wsDr xmlns:xdr="${DRAWING_NS}" xmlns:a="${A_NS}"></xdr:wsDr>`;

/** Where `<drawing>` goes in a worksheet: before these, by the schema. */
const AFTER_DRAWING = new Set([
	"legacyDrawing",
	"legacyDrawingHF",
	"drawingHF",
	"picture",
	"oleObjects",
	"controls",
	"webPublishItems",
	"tableParts",
	"extLst",
]);

/** A placed chart's anchor rewritten as a one-cell anchor, its frame kept. */
export function moveAnchor(placed: Placed, anchor: Chart["anchor"]): void {
	const p = prefixOf(placed.anchor) || "xdr:";
	const frame = kids(placed.anchor, "graphicFrame")[0];
	const replacement = fragment(anchorXml(p, anchor, frame ? "<frame/>" : ""));
	if (frame) {
		replacement.children = replacement.children.map((child) =>
			isElement(child) && child.name === "frame" ? frame : child,
		);
	}
	const at = placed.holder.children.indexOf(placed.anchor);
	placed.holder.children[at] = replacement;
	placed.anchor = replacement;
}

/** A new chart part, anchored in the drawing. */
export function addChart(
	edit: Edit,
	drawing: Drawing,
	chart: { anchor: Chart["anchor"]; xml: string },
): void {
	const part = freePart(edit.entries, (n) => `xl/charts/chart${n}.xml`);
	setPartText(edit.entries, part, chart.xml);
	setOverride(edit.types, part, CONTENT.chart);
	const relId = addRel(drawing.rels, REL.chart, drawing.part, part);
	const p = drawingPrefix(drawing.doc);
	drawing.doc.root.children.push(
		fragment(
			anchorXml(p, chart.anchor, frameXml(p, nextShapeId(drawing.doc), relId)),
		),
	);
}

/** Chart parts the removed chart pointed at that nothing else will need. */
export function removeChart(
	{ entries, types }: Edit,
	drawing: Drawing,
	placed: Placed,
): void {
	placed.holder.children = placed.holder.children.filter(
		(child) => child !== placed.anchor,
	);
	// An anchor inside `mc:Choice` leaves its fallback behind; drop the pair.
	const wrapper = drawing.doc.root.children.find(
		(child) =>
			isElement(child) &&
			local(child) === "AlternateContent" &&
			kids(child, "Choice").includes(placed.holder),
	);
	if (wrapper && kids(placed.holder).length === 0) {
		drawing.doc.root.children = drawing.doc.root.children.filter(
			(child) => child !== wrapper,
		);
	}
	drawing.rels.doc.root.children = drawing.rels.doc.root.children.filter(
		(child) => !(isElement(child) && child.attrs.Id === placed.relId),
	);
	const chartRels = openRels(entries, placed.part);
	for (const rel of relList(chartRels)) {
		const target = relTarget(chartRels, placed.part, rel.attrs.Id);
		// Style, colours and the embedded workbook belong to this chart alone.
		if (target && /\/(charts|embeddings)\//.test(`/${target}`)) {
			removeEntry(entries, target);
			removeEntry(entries, relsPartFor(target));
			removeOverride(types, target);
		}
	}
	removeEntry(entries, placed.part);
	removeEntry(entries, chartRels.path);
	removeOverride(types, placed.part);
}

export function createDrawing(
	{ entries, types }: Edit,
	sheetPath: string,
): Drawing {
	const part = freePart(entries, (n) => `xl/drawings/drawing${n}.xml`);
	setPartText(entries, part, EMPTY_DRAWING);
	setOverride(types, part, CONTENT.drawing);
	const sheetRels = openRels(entries, sheetPath);
	const relId = addRel(sheetRels, REL.drawing, sheetPath, part);
	setPartText(entries, sheetRels.path, serializeXml(sheetRels.doc));

	const sheet = parseXml(partText(entries, sheetPath) ?? "");
	const root = sheet.root;
	const declared = Object.entries(root.attrs).find(
		([key, value]) => key.startsWith("xmlns:") && value === REL_NS,
	)?.[0];
	const r = declared ? declared.slice(6) : "r";
	if (!declared) {
		root.attrs["xmlns:r"] = REL_NS;
	}
	const node = element(`${prefixOf(root)}drawing`, { [`${r}:id`]: relId });
	const before = root.children.findIndex(
		(child) => isElement(child) && AFTER_DRAWING.has(local(child)),
	);
	if (before >= 0) {
		root.children.splice(before, 0, node);
	} else {
		root.children.push(node);
	}
	setPartText(entries, sheetPath, serializeXml(sheet));
	return {
		part,
		doc: parseXml(EMPTY_DRAWING),
		rels: openRels(entries, part),
		charts: [],
	};
}

export function removeDrawing(
	{ entries, types }: Edit,
	sheetPath: string,
	drawing: Drawing,
): void {
	const found = sheetDrawingPart(entries, sheetPath);
	removeEntry(entries, drawing.part);
	removeEntry(entries, drawing.rels.path);
	removeOverride(types, drawing.part);
	if (!found) {
		return;
	}
	const id = idOf(found.element);
	found.sheet.root.children = found.sheet.root.children.filter(
		(child) => child !== found.element,
	);
	found.rels.doc.root.children = found.rels.doc.root.children.filter(
		(child) => !(isElement(child) && child.attrs.Id === id),
	);
	setPartText(entries, sheetPath, serializeXml(found.sheet));
	if (relList(found.rels).length > 0) {
		setPartText(entries, found.rels.path, serializeXml(found.rels.doc));
	} else {
		removeEntry(entries, found.rels.path);
	}
}
