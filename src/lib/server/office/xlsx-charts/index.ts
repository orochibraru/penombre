import { type CellSource, type ChartData, chartData } from "#lib/chart/data.js";
import { canonical, type Chart, isEditable } from "#lib/chart/model.js";
import type { Palette } from "#lib/slides/color.js";
import { parseXml, serializeXml, text, type XmlElement } from "../xml";
import { partText, setPartText } from "../zip";
import {
	addChart,
	createDrawing,
	type Edit,
	moveAnchor,
	removeChart,
	removeDrawing,
} from "./anchors";
import { patchChart } from "./chart-patch";
import { GROUPS } from "./chart-read";
import { chartXml } from "./chart-write";
import { kid, kids, local } from "./package";
import { ANCHORS, type Drawing, readDrawing } from "./read";

export { readChartXml } from "./chart-read";
export { chartXml } from "./chart-write";
export { readSheetCharts, workbookPalette } from "./read";

/**
 * A worksheet's charts: read from its drawing part into `#lib/chart`'s model,
 * and written back.
 *
 * Writing changes as little as it can. A chart the editor did not change
 * keeps its part byte for byte; one that only moved keeps its part and gets
 * a new anchor; one whose references shifted (rows inserted above its data)
 * has just its `c:f` texts patched; one edited in the chart editor has only
 * the edited nodes patched (`chart-patch.ts`), and is written anew from the
 * model only when its type changes family. Pictures and shapes sharing the
 * drawing are never touched.
 *
 * Producers disagree on prefixes, so elements are matched by local name.
 * Excel anchors with `twoCellAnchor`, Google Sheets with `oneCellAnchor`,
 * LibreOffice with `twoCellAnchor editAs="oneCell"`; new anchors are written
 * as `oneCellAnchor`, which all three read.
 */

/** What a chart says, apart from where it is and what it is called. */
function body(chart: Chart) {
	const { id: _id, origin: _origin, anchor: _anchor, ...rest } = chart;
	return rest;
}

/** The body with references blanked: equal means only references changed. */
function shape(chart: Chart) {
	const rest = body(chart);
	return {
		...rest,
		series: rest.series.map((s) => ({
			...s,
			values: "ref",
			...(s.nameRef !== undefined ? { nameRef: "ref" } : {}),
			...(s.categories !== undefined ? { categories: "ref" } : {}),
		})),
	};
}

/** A data source's (or a name's) `c:f`, when it has one. */
function setRef(holder: XmlElement | undefined, ref: string | undefined) {
	const f = kid(kids(holder)[0], "f");
	if (f && ref !== undefined) {
		f.children = [text(ref)];
	}
}

/** Every series' `c:f` texts rewritten in place, in document order. */
function patchRefs(source: string, chart: Chart): string {
	const doc = parseXml(source);
	const plot = kid(kid(doc.root, "chart"), "plotArea");
	const sers = kids(plot)
		.filter((node) => GROUPS[local(node)])
		.flatMap((group) => kids(group, "ser"));
	sers.forEach((ser, i) => {
		const model = chart.series[i];
		if (!model) {
			return;
		}
		setRef(kid(ser, "tx"), model.nameRef);
		setRef(kid(ser, "cat") ?? kid(ser, "xVal"), model.categories);
		setRef(kid(ser, "val") ?? kid(ser, "yVal"), model.values);
	});
	return serializeXml(doc);
}

const sameAnchor = (a: Chart["anchor"], b: Chart["anchor"]) =>
	canonical(a) === canonical(b);

interface SheetCharts {
	path: string;
	/** The sheet's position among the sheets `source` reads. */
	index: number;
	charts: Chart[] | undefined;
}

interface Context {
	source: CellSource;
	palette: Palette;
}

/** One existing chart brought in line with the editor's; whether it moved. */
function update(
	edit: Edit,
	placed: Drawing["charts"][number],
	next: Chart,
	data: (chart: Chart) => ChartData,
): boolean {
	const moved = !sameAnchor(placed.chart.anchor, next.anchor);
	if (moved) {
		moveAnchor(placed, next.anchor);
	}
	if (canonical(body(placed.chart)) === canonical(body(next))) {
		return moved;
	}
	const original = partText(edit.entries, placed.part) ?? "";
	if (canonical(shape(placed.chart)) === canonical(shape(next))) {
		setPartText(edit.entries, placed.part, patchRefs(original, next));
	} else if (isEditable(placed.chart) && isEditable(next)) {
		const values = data(next);
		setPartText(
			edit.entries,
			placed.part,
			patchChart(original, placed.chart, next, values) ??
				chartXml(next, values),
		);
	}
	return moved;
}

/**
 * The editor's charts for one worksheet applied to the package: kept,
 * moved, patched, rewritten, added or removed. A sheet whose charts the
 * editor did not send (`charts` undefined) is left alone.
 */
export function writeSheetCharts(
	edit: Edit,
	sheet: SheetCharts,
	context: Context,
): void {
	const wanted = sheet.charts;
	if (wanted === undefined) {
		return;
	}
	let drawing: Drawing | null;
	try {
		drawing = readDrawing(
			{ entries: edit.entries, palette: context.palette },
			sheet.path,
		);
	} catch {
		// Unreadable here means unreadable at open too: the editor had no
		// charts to send, and nothing it sent may delete the ones there.
		return;
	}
	const data = (chart: Chart) => chartData(chart, context.source, sheet.index);
	let dirty = false;
	const kept = new Set<string>();
	for (const placed of drawing?.charts ?? []) {
		const next = wanted.find((chart) => chart.origin === placed.part);
		if (next) {
			kept.add(placed.part);
			dirty = update(edit, placed, next, data) || dirty;
		} else if (drawing) {
			removeChart(edit, drawing, placed);
			dirty = true;
		}
	}
	const added = wanted.filter(
		(chart) => isEditable(chart) && !(chart.origin && kept.has(chart.origin)),
	);
	if (added.length > 0) {
		drawing ??= createDrawing(edit, sheet.path);
		for (const chart of added) {
			addChart(edit, drawing, {
				anchor: chart.anchor,
				xml: chartXml(chart, data(chart)),
			});
		}
		dirty = true;
	}
	if (drawing && dirty) {
		settle(edit, sheet.path, drawing);
	}
}

/** The drawing written back, or removed once it holds nothing at all. */
function settle(edit: Edit, sheetPath: string, drawing: Drawing): void {
	const left = kids(drawing.doc.root).some(
		(node) => ANCHORS.has(local(node)) || local(node) === "AlternateContent",
	);
	if (left) {
		setPartText(edit.entries, drawing.part, serializeXml(drawing.doc));
		setPartText(
			edit.entries,
			drawing.rels.path,
			serializeXml(drawing.rels.doc),
		);
	} else {
		removeDrawing(edit, sheetPath, drawing);
	}
}
