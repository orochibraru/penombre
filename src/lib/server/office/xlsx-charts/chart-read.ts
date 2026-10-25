import type {
	Chart,
	ChartAxis,
	ChartSeries,
	ChartType,
	Grouping,
	LegendPosition,
} from "#lib/chart/model.js";
import { hexColor, type Palette } from "#lib/slides/color.js";

import { colorChild, readColor } from "../slides/drawingml";
import { element, parseXml, textContent, type XmlElement } from "../xml";
import { all, flag, kid, kids, local, val } from "./package";

/**
 * A chart part (`c:chartSpace`) read into the model. What the model cannot
 * hold is listed in `unsupported`, which keeps the chart from being edited
 * and so from being rewritten.
 */

export const GROUPS: Record<string, { type: ChartType; note?: string }> = {
	barChart: { type: "column" },
	bar3DChart: { type: "column", note: "3d" },
	lineChart: { type: "line" },
	line3DChart: { type: "line", note: "3d" },
	areaChart: { type: "area" },
	area3DChart: { type: "area", note: "3d" },
	pieChart: { type: "pie" },
	pie3DChart: { type: "pie", note: "3d" },
	doughnutChart: { type: "doughnut" },
	ofPieChart: { type: "pie", note: "pie-of-pie" },
	scatterChart: { type: "scatter" },
	bubbleChart: { type: "scatter", note: "bubble" },
	radarChart: { type: "line", note: "radar" },
	stockChart: { type: "line", note: "stock" },
	surfaceChart: { type: "area", note: "surface" },
	surface3DChart: { type: "area", note: "surface" },
};

const GROUPING: Record<string, Grouping | undefined> = {
	stacked: "stacked",
	percentStacked: "percent",
};

const LEGEND: Record<string, LegendPosition> = {
	tr: "r",
	r: "r",
	l: "l",
	t: "t",
	b: "b",
};

const AXES = new Set(["catAx", "valAx", "dateAx", "serAx"]);

function cachedPoints(cache: XmlElement | undefined): string[] {
	if (!cache) {
		return [];
	}
	const count = Number(val(cache, "ptCount") ?? 0);
	const out: string[] = Array.from(
		{ length: Math.min(Number.isFinite(count) ? count : 0, 10_000) },
		() => "",
	);
	for (const pt of kids(cache, "pt")) {
		const idx = Number(pt.attrs.idx);
		if (Number.isInteger(idx) && idx >= 0 && idx < 10_000) {
			out[idx] = textContent(kid(pt, "v") ?? element("v"));
		}
	}
	return out;
}

function cachedStrings(ref: XmlElement | undefined): string[] {
	if (!ref) {
		return [];
	}
	const cache =
		kid(ref, "strCache") ??
		kid(ref, "numCache") ??
		(local(ref).endsWith("Lit") ? ref : undefined);
	if (cache) {
		return cachedPoints(cache);
	}
	// Multi-level categories: the innermost level is the label.
	return cachedPoints(kids(kid(ref, "multiLvlStrCache"), "lvl")[0]);
}

function richText(node: XmlElement | undefined): string | undefined {
	const tx = kid(node, "tx");
	const rich = kid(tx, "rich");
	if (rich) {
		return all(rich, "p")
			.map((p) =>
				all(p, "t")
					.map((t) => textContent(t))
					.join(""),
			)
			.join("\n");
	}
	const ref = kid(tx, "strRef");
	if (ref) {
		return cachedStrings(ref).join(" ");
	}
	const literal = kid(tx, "v");
	return literal ? textContent(literal) : undefined;
}

/** A data source (`c:cat`, `c:val`, …): its reference and cached points. */
function dataSource(node: XmlElement | undefined) {
	const inner = kids(node)[0];
	const f = kid(inner, "f");
	return {
		ref: f ? textContent(f) : undefined,
		texts: cachedStrings(inner),
	};
}

const toNumbers = (texts: string[]) =>
	texts.map((t) => {
		const n = Number(t);
		return t !== "" && Number.isFinite(n) ? n : null;
	});

function fillOf(spPr: XmlElement | undefined, palette: Palette) {
	const solid = kid(spPr, "solidFill");
	const color = solid ? readColor(colorChild(solid)) : undefined;
	return color ? hexColor(color, palette) : undefined;
}

/** Excel's automatic colours: the theme's six accents, in turn. */
const accent = (index: number, palette: Palette) =>
	`#${(palette.colors[`accent${(index % 6) + 1}`] ?? "4472C4").toLowerCase()}`;

/** A series' own colour: a line's stroke, a marker's fill, a bar's fill. */
function seriesFill(ser: XmlElement, type: ChartType, palette: Palette) {
	const spPr = kid(ser, "spPr");
	const line = () => fillOf(kid(spPr, "ln"), palette);
	const marker = () => fillOf(kid(kid(ser, "marker"), "spPr"), palette);
	if (type === "line") {
		return line() ?? marker();
	}
	return type === "scatter" ? (marker() ?? line()) : fillOf(spPr, palette);
}

interface SeriesContext {
	type: ChartType;
	palette: Palette;
	varyColors: boolean;
}

/** A pie's slices: the theme's accents when it varies them, then each `c:dPt`. */
function slices(
	ser: XmlElement,
	count: number,
	{ palette, varyColors }: SeriesContext,
	color: string,
) {
	const colors = Array.from({ length: Math.max(count, 1) }, (_, i) =>
		varyColors ? accent(i, palette) : color,
	);
	for (const dPt of kids(ser, "dPt")) {
		const at = Number(val(dPt, "idx"));
		const own = fillOf(kid(dPt, "spPr"), palette);
		if (Number.isInteger(at) && at >= 0 && at < colors.length && own) {
			colors[at] = own;
		}
	}
	return colors;
}

function readSeries(
	ser: XmlElement,
	index: number,
	context: SeriesContext,
): ChartSeries {
	const { type, palette } = context;
	const scatter = type === "scatter";
	const cat = dataSource(kid(ser, scatter ? "xVal" : "cat"));
	const values = dataSource(kid(ser, scatter ? "yVal" : "val"));
	const tx = kid(ser, "tx");
	const nameRef = kid(tx, "strRef");
	const idx = Number(val(ser, "idx") ?? index);
	const color =
		seriesFill(ser, type, palette) ??
		accent(Number.isFinite(idx) ? idx : index, palette);
	const series: ChartSeries = {
		values: values.ref ?? "",
		cache: { values: toNumbers(values.texts) },
	};
	const cache = series.cache ?? {};
	if (cat.texts.length > 0) {
		cache.categories = cat.texts;
	}
	if (cat.ref) {
		series.categories = cat.ref;
	}
	const f = kid(nameRef, "f");
	if (f) {
		series.nameRef = textContent(f);
	}
	const name = cachedStrings(nameRef).join(" ");
	if (name) {
		cache.name = name;
	}
	const literal = kid(tx, "v");
	if (literal && !nameRef) {
		series.name = textContent(literal);
	}
	if (type === "pie" || type === "doughnut") {
		series.points = slices(ser, values.texts.length, context, color);
	} else {
		series.color = color;
	}
	return series;
}

function readAxis(node: XmlElement | undefined): ChartAxis {
	const scaling = kid(node, "scaling");
	const number = (name: string) => {
		const raw = val(scaling, name);
		return raw !== undefined && Number.isFinite(Number(raw))
			? Number(raw)
			: undefined;
	};
	const axis: ChartAxis = {};
	const title = kid(node, "title") ? richText(kid(node, "title")) : undefined;
	const min = number("min");
	const max = number("max");
	if (title) {
		axis.title = title;
	}
	if (min !== undefined) {
		axis.min = min;
	}
	if (max !== undefined) {
		axis.max = max;
	}
	if (kid(node, "majorGridlines")) {
		axis.gridlines = true;
	}
	return axis;
}

/** The category (x) and value (y) axes; a scatter's x is its bottom one. */
export function axesOf(plot: XmlElement | undefined, type: ChartType) {
	const axes = kids(plot).filter((node) => AXES.has(local(node)));
	const values = axes.filter((node) => local(node) === "valAx");
	if (type === "scatter") {
		const x =
			values.find((node) => ["b", "t"].includes(val(node, "axPos") ?? "")) ??
			values[0];
		return { count: axes.length, x, y: values.find((node) => node !== x) };
	}
	return {
		count: axes.length,
		x: axes.find((node) => local(node) !== "valAx"),
		y: values[0],
	};
}

/** Things the model leaves out, which make the chart view-only. */
function notes(groups: XmlElement[], axisCount: number): Set<string> {
	const out = new Set<string>();
	const head = groups[0];
	const note = head ? GROUPS[local(head)]?.note : "unknown";
	if (note) {
		out.add(note);
	}
	if (groups.length > 1) {
		out.add("combo");
	}
	if (axisCount > 2) {
		out.add("secondary axis");
	}
	for (const ser of groups.flatMap((group) => kids(group, "ser"))) {
		if (kid(ser, "trendline")) {
			out.add("trendline");
		}
		if (kid(ser, "errBars")) {
			out.add("error bars");
		}
	}
	return out;
}

/** Markers on a line chart: each series' symbol, else the chart's default. */
function hasMarkers(group: XmlElement | undefined): boolean {
	const automatic = flag(group, "marker");
	return kids(group, "ser").some((ser) => {
		const symbol = val(kid(ser, "marker"), "symbol");
		return symbol ? symbol !== "none" : automatic;
	});
}

function titleOf(
	chart: XmlElement | undefined,
	series: ChartSeries[],
): string | undefined {
	const node = kid(chart, "title");
	if (!node) {
		return undefined;
	}
	const title = richText(node);
	if (title !== undefined || flag(chart, "autoTitleDeleted")) {
		return title;
	}
	// An automatic title: one series is named after itself.
	const only = series.length === 1 ? series[0] : undefined;
	return only?.name ?? only?.cache?.name;
}

const showsValues = (group: XmlElement | undefined) =>
	[group, ...kids(group, "ser")].some((node) => {
		const labels = kid(node, "dLbls");
		return (
			labels !== undefined && !flag(labels, "delete") && flag(labels, "showVal")
		);
	});

/** A chart part as the model, everything but its id and anchor. */
export function readChartXml(
	source: string,
	palette: Palette,
): Omit<Chart, "id" | "anchor"> {
	const chart = kid(parseXml(source).root, "chart");
	const plot = kid(chart, "plotArea");
	const groups = kids(plot).filter((node) => GROUPS[local(node)]);
	const head = groups[0];
	const base = (head && GROUPS[local(head)]?.type) || "column";
	const type: ChartType = val(head, "barDir") === "bar" ? "bar" : base;
	const context = { type, palette, varyColors: flag(head, "varyColors") };
	const series = groups.flatMap((group) =>
		kids(group, "ser").map((ser, i) => readSeries(ser, i, context)),
	);
	const axes = axesOf(plot, type);
	const legendNode = kid(chart, "legend");
	const out: Omit<Chart, "id" | "anchor"> = {
		type,
		legend: legendNode
			? (LEGEND[val(legendNode, "legendPos") ?? "r"] ?? "r")
			: "none",
		x: readAxis(axes.x),
		y: readAxis(axes.y),
		series,
	};
	const grouping = GROUPING[val(head, "grouping") ?? ""];
	if (grouping && !["pie", "doughnut", "scatter"].includes(type)) {
		out.grouping = grouping;
	}
	if (type === "line" && hasMarkers(head)) {
		out.markers = true;
	}
	const title = titleOf(chart, series);
	if (title) {
		out.title = title;
	}
	if (showsValues(head)) {
		out.labels = true;
	}
	const unsupported = notes(groups, axes.count);
	if (unsupported.size > 0) {
		out.unsupported = [...unsupported];
	}
	return out;
}
