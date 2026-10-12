import type { ChartData } from "#lib/chart/data.js";
import type { Chart, ChartAxis, ChartSeries } from "#lib/chart/model.js";
import { parseXml, serializeXml, text, type XmlElement } from "../xml";
import { axesOf, GROUPS } from "./chart-read";
import { dataXml, nameXml, solid, titleXml, v } from "./chart-write";
import {
	AFTER,
	clone,
	FILLS,
	insertBefore,
	node,
	nodes,
	remove,
	replace,
	setVal,
} from "./nodes";
import { A_NS, kid, kids, local } from "./package";

/**
 * A chart edited in the chart editor, applied to the part it came from: only
 * the nodes for what changed are touched, so the file's fonts, effects,
 * number formats and layout survive, as `slides/write.ts` does for shapes.
 *
 * Changing between column and bar is a patch (`barDir` and the axis sides).
 * Any other change of type, say pie to line, changes which elements a series
 * may hold, so it returns null and the caller writes the chart anew.
 */

const BARS = new Set(["column", "bar"]);
const ROUND = new Set(["pie", "doughnut"]);

const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);

// =========================================================================
// Text
// =========================================================================

/** A rich text's paragraphs set to `value`, each keeping the first run's look. */
function setRichText(rich: XmlElement, value: string): void {
	const paragraphs = kids(rich, "p");
	const template = paragraphs[0] ?? node("<a:p/>");
	const written = value.split("\n").map((line, i) => {
		const p = paragraphs[i] ?? clone(template);
		const [run, ...others] = kids(p, "r");
		remove(p, ["fld", "br"]);
		p.children = p.children.filter(
			(child) => !others.includes(child as XmlElement),
		);
		if (run) {
			const t = kid(run, "t") ?? node("<a:t/>");
			t.children = [text(line)];
			if (!kid(run, "t")) {
				run.children.push(t);
			}
		} else {
			insertBefore(p, nodes(`<a:r><a:t>${escape(line)}</a:t></a:r>`), [
				"endParaRPr",
			]);
		}
		return p;
	});
	rich.children = [
		...rich.children.filter(
			(child) => !paragraphs.includes(child as XmlElement),
		),
		...written,
	];
}

const escape = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A `c:title` under `holder` set to `value`, created or removed. */
function setTitle(
	holder: XmlElement,
	value: string | undefined,
	where: { followers: readonly string[]; size: number },
): void {
	const existing = kid(holder, "title");
	if (value === undefined) {
		remove(holder, ["title"]);
		return;
	}
	if (!existing) {
		insertBefore(holder, nodes(titleXml(value, where.size)), where.followers);
		return;
	}
	const tx = kid(existing, "tx");
	const rich = kid(tx, "rich");
	if (rich) {
		setRichText(rich, value);
		return;
	}
	const fresh = kid(node(titleXml(value, where.size)), "tx") as XmlElement;
	if (tx) {
		replace(existing, tx, [fresh]);
	} else {
		existing.children.unshift(fresh);
	}
}

// =========================================================================
// Colours
// =========================================================================

/** The fill of an `spPr` (or `a:ln`) set to `color`, or cleared to automatic. */
function setFill(
	holder: XmlElement,
	color: string | null | undefined,
	followers: readonly string[],
): void {
	const old = kids(holder).find((child) =>
		(FILLS as readonly string[]).includes(local(child)),
	);
	const fresh = color ? nodes(solid(color)) : [];
	if (old) {
		replace(holder, old, fresh);
	} else {
		insertBefore(holder, fresh, followers);
	}
}

function child(
	parent: XmlElement,
	name: string,
	followers: readonly string[],
): XmlElement {
	const existing = kid(parent, name);
	if (existing) {
		return existing;
	}
	const made = node(`<${name.includes(":") ? name : `c:${name}`}/>`);
	insertBefore(parent, [made], followers);
	return made;
}

function setSeriesColor(
	ser: XmlElement,
	type: Chart["type"],
	color: string | undefined,
): void {
	if (type === "line") {
		const spPr = child(ser, "spPr", AFTER.serSpPr);
		const ln = kid(spPr, "ln") ?? node("<a:ln/>");
		if (!kid(spPr, "ln")) {
			insertBefore(
				spPr,
				[ln],
				["effectLst", "effectDag", "scene3d", "sp3d", "extLst"],
			);
		}
		setFill(ln, color, AFTER.lnFill);
	} else if (type !== "scatter") {
		setFill(child(ser, "spPr", AFTER.serSpPr), color, AFTER.spPrFill);
	}
	// A line's markers carry the colour too; a scatter's are all it has.
	let marker = kid(ser, "marker");
	if (!marker && type === "scatter") {
		marker = node(`<c:marker>${v("symbol", "circle")}</c:marker>`);
		insertBefore(ser, [marker], AFTER.serMarker);
	}
	if (marker && (kid(marker, "spPr") || type === "scatter")) {
		setFill(child(marker, "spPr", AFTER.markerSpPr), color, AFTER.spPrFill);
	}
}

function setPoint(ser: XmlElement, index: number, color: string | null): void {
	const points = kids(ser, "dPt");
	const existing = points.find(
		(dPt) => kid(dPt, "idx")?.attrs.val === String(index),
	);
	if (existing) {
		setFill(
			child(existing, "spPr", ["pictureOptions", "extLst"]),
			color,
			AFTER.spPrFill,
		);
		return;
	}
	if (!color) {
		return;
	}
	const added = node(
		`<c:dPt>${v("idx", index)}${v("bubble3D", 0)}<c:spPr>${solid(color)}</c:spPr></c:dPt>`,
	);
	const after = points.find(
		(dPt) => Number(kid(dPt, "idx")?.attrs.val) > index,
	);
	if (after) {
		ser.children.splice(ser.children.indexOf(after), 0, added);
	} else {
		insertBefore(ser, [added], AFTER.dPt);
	}
}

// =========================================================================
// Series
// =========================================================================

/** The series elements made to match the model's count, new ones cloned. */
function matchCount(group: XmlElement, count: number): XmlElement[] {
	const sers = kids(group, "ser");
	const last = sers.at(-1);
	if (!last) {
		return sers;
	}
	let top = sers.reduce(
		(n, ser) => Math.max(n, Number(kid(ser, "idx")?.attrs.val) || 0),
		0,
	);
	while (sers.length < count) {
		const copy = clone(last);
		// A clone of Excel's `c16:uniqueId` would no longer be unique.
		remove(copy, ["extLst"]);
		top++;
		setVal(copy, "idx", top, []);
		setVal(copy, "order", top, []);
		group.children.splice(
			group.children.indexOf(sers.at(-1) as XmlElement) + 1,
			0,
			copy,
		);
		sers.push(copy);
	}
	for (const extra of sers.splice(count)) {
		group.children = group.children.filter((c) => c !== extra);
	}
	return sers;
}

interface SeriesEdit {
	chart: Chart;
	data: ChartData;
	index: number;
}

/** Name and data written anew when their references or values changed. */
function setData(
	ser: XmlElement,
	before: ChartSeries | undefined,
	{ chart, data, index }: SeriesEdit,
): void {
	const next = chart.series[index] as ChartSeries;
	const name = data.series[index]?.name ?? "";
	if (
		!(before && before.name === next.name && before.nameRef === next.nameRef)
	) {
		remove(ser, ["tx"]);
		insertBefore(ser, nodes(nameXml(next, name)), ["spPr", ...AFTER.serSpPr]);
	}
	if (
		!(
			before &&
			before.values === next.values &&
			before.categories === next.categories
		)
	) {
		remove(ser, ["cat", "val", "xVal", "yVal"]);
		insertBefore(ser, nodes(dataXml(chart, next, data, index)), AFTER.serData);
	}
}

function setMarker(ser: XmlElement, shown: boolean): void {
	const marker = kid(ser, "marker");
	if (shown) {
		if (marker && kid(marker, "symbol")?.attrs.val === "none") {
			setVal(marker, "symbol", "circle", AFTER.symbol);
		}
		return;
	}
	if (marker) {
		setVal(marker, "symbol", "none", AFTER.symbol);
	} else {
		insertBefore(
			ser,
			[node(`<c:marker>${v("symbol", "none")}</c:marker>`)],
			AFTER.serMarker,
		);
	}
}

function patchSeries(
	group: XmlElement,
	prev: Chart,
	edit: Omit<SeriesEdit, "index">,
): void {
	const { chart } = edit;
	matchCount(group, chart.series.length).forEach((ser, index) => {
		const before = prev.series[index];
		const next = chart.series[index] as ChartSeries;
		setData(ser, before, { ...edit, index });
		if (before?.color !== next.color || !before) {
			setSeriesColor(ser, chart.type, next.color);
		}
		(next.points ?? []).forEach((color, i) => {
			if (before?.points?.[i] !== color) {
				setPoint(ser, i, color);
			}
		});
		if (chart.type === "line" && prev.markers !== chart.markers) {
			setMarker(ser, chart.markers === true);
		}
	});
}

// =========================================================================
// The chart
// =========================================================================

function setLabels(group: XmlElement, shown: boolean): void {
	const labels = kid(group, "dLbls");
	if (!labels || kid(labels, "delete")) {
		if (labels) {
			remove(group, ["dLbls"]);
		}
		insertBefore(
			group,
			[
				node(
					`<c:dLbls>${v("showLegendKey", 0)}${v("showVal", shown ? 1 : 0)}${v("showCatName", 0)}${v("showSerName", 0)}${v("showPercent", 0)}${v("showBubbleSize", 0)}</c:dLbls>`,
				),
			],
			AFTER.groupLabels,
		);
	} else {
		setVal(labels, "showVal", shown ? 1 : 0, [
			"showCatName",
			"showSerName",
			"showPercent",
			"showBubbleSize",
			"separator",
			"showLeaderLines",
			"extLst",
		]);
	}
	for (const ser of kids(group, "ser")) {
		const own = kid(ser, "dLbls");
		if (own && !kid(own, "delete")) {
			setVal(own, "showVal", shown ? 1 : 0, [
				"showCatName",
				"showSerName",
				"showPercent",
				"showBubbleSize",
				"separator",
				"showLeaderLines",
				"extLst",
			]);
		}
	}
}

function setGrouping(group: XmlElement, chart: Chart): void {
	const grouping = chart.grouping ?? "clustered";
	const file =
		grouping === "percent"
			? "percentStacked"
			: grouping === "stacked"
				? "stacked"
				: BARS.has(chart.type)
					? "clustered"
					: "standard";
	setVal(group, "grouping", file, ["varyColors", "ser"]);
	if (BARS.has(chart.type)) {
		if (grouping === "clustered") {
			remove(group, ["overlap"]);
		} else {
			setVal(group, "overlap", 100, AFTER.overlap);
		}
	}
}

function patchAxis(
	axis: XmlElement | undefined,
	before: ChartAxis,
	after: ChartAxis,
): void {
	if (!axis || same(before, after)) {
		return;
	}
	if (before.title !== after.title) {
		setTitle(axis, after.title, { followers: AFTER.axisTitle, size: 1000 });
	}
	const scaling = kid(axis, "scaling");
	for (const end of ["max", "min"] as const) {
		if (scaling && before[end] !== after[end]) {
			const value = after[end];
			if (value === undefined) {
				remove(scaling, [end]);
			} else {
				setVal(scaling, end, value, AFTER[end]);
			}
		}
	}
	if (before.gridlines !== after.gridlines) {
		if (after.gridlines) {
			insertBefore(axis, [node("<c:majorGridlines/>")], AFTER.gridlines);
		} else {
			remove(axis, ["majorGridlines"]);
		}
	}
}

function setLegend(chart: XmlElement, position: Chart["legend"]): void {
	const legend = kid(chart, "legend");
	if (position === "none") {
		remove(chart, ["legend"]);
	} else if (legend) {
		setVal(legend, "legendPos", position, AFTER.legendPos);
	} else {
		insertBefore(
			chart,
			[
				node(
					`<c:legend>${v("legendPos", position)}<c:overlay val="0"/></c:legend>`,
				),
			],
			AFTER.legend,
		);
	}
}

/** Column and bar trade sides: categories go left, values go to the bottom. */
function setDirection(group: XmlElement, plot: XmlElement, next: Chart): void {
	const horizontal = next.type === "bar";
	setVal(group, "barDir", horizontal ? "bar" : "col", ["grouping"]);
	const axes = axesOf(plot, next.type);
	for (const [axis, side] of [
		[axes.x, horizontal ? "l" : "b"],
		[axes.y, horizontal ? "b" : "l"],
	] as const) {
		if (axis) {
			setVal(axis, "axPos", side, []);
		}
	}
}

/**
 * The original part with `prev` → `next` applied, or null when it cannot be
 * patched (another type family, a part not written with `c:`/`a:` prefixes).
 */
export function patchChart(
	source: string,
	prev: Chart,
	next: Chart,
	data: ChartData,
): string | null {
	const doc = parseXml(source);
	const chart = kid(doc.root, "chart");
	const plot = kid(chart, "plotArea");
	const groups = kids(plot).filter((n) => GROUPS[local(n)]);
	const group = groups[0];
	const typeChange =
		prev.type !== next.type && !(BARS.has(prev.type) && BARS.has(next.type));
	if (
		!(chart && plot && group) ||
		groups.length > 1 ||
		typeChange ||
		doc.root.name !== "c:chartSpace" ||
		doc.root.attrs["xmlns:a"] !== A_NS
	) {
		return null;
	}
	if (prev.type !== next.type) {
		setDirection(group, plot, next);
	}
	if (
		(prev.grouping ?? "clustered") !== (next.grouping ?? "clustered") &&
		!ROUND.has(next.type) &&
		next.type !== "scatter"
	) {
		setGrouping(group, next);
	}
	if (prev.title !== next.title) {
		setTitle(chart, next.title, { followers: AFTER.chartTitle, size: 1400 });
		setVal(
			chart,
			"autoTitleDeleted",
			next.title ? 0 : 1,
			AFTER.autoTitleDeleted,
		);
	}
	if (prev.legend !== next.legend) {
		setLegend(chart, next.legend);
	}
	const axes = axesOf(plot, next.type);
	patchAxis(axes.x, prev.x, next.x);
	patchAxis(axes.y, prev.y, next.y);
	if ((prev.labels ?? false) !== (next.labels ?? false)) {
		setLabels(group, next.labels === true);
	}
	if (next.type === "line" && prev.markers !== next.markers) {
		setVal(group, "marker", 1, AFTER.groupMarker);
	}
	patchSeries(group, prev, { chart: next, data });
	return serializeXml(doc);
}
