import type { ChartData } from "#lib/chart/data.js";
import type { Chart, ChartAxis, ChartSeries } from "#lib/chart/model.js";
import { A_NS, CHART_NS, PROLOG, REL_NS } from "./package";

/**
 * A chart part written from the model, every element in the order the
 * schema demands (Excel refuses a file whose `c:ser` children are out of
 * order). Values are cached from the grid so a reader that does not
 * recalculate charts (Google Sheets' importer, a viewer) shows them.
 */

const esc = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

export const v = (name: string, value: string | number) =>
	`<c:${name} val="${esc(String(value))}"/>`;

const X_AXIS = 500_000_001;
const Y_AXIS = 500_000_002;

function richXml(value: string, size: number): string {
	const paragraphs = value
		.split("\n")
		.map(
			(line) =>
				`<a:p><a:pPr><a:defRPr sz="${size}" b="0"/></a:pPr><a:r><a:rPr lang="en-US" sz="${size}" b="0"/><a:t>${esc(line)}</a:t></a:r></a:p>`,
		)
		.join("");
	return `<c:tx><c:rich><a:bodyPr/><a:lstStyle/>${paragraphs}</c:rich></c:tx>`;
}

export const titleXml = (value: string, size: number) =>
	`<c:title>${richXml(value, size)}<c:overlay val="0"/></c:title>`;

const strCache = (values: string[]) =>
	`<c:strCache><c:ptCount val="${values.length}"/>${values
		.map((value, i) => `<c:pt idx="${i}"><c:v>${esc(value)}</c:v></c:pt>`)
		.join("")}</c:strCache>`;

const numCache = (values: (number | null)[]) =>
	`<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${values.length}"/>${values
		.map((value, i) =>
			value === null ? "" : `<c:pt idx="${i}"><c:v>${value}</c:v></c:pt>`,
		)
		.join("")}</c:numCache>`;

export const solid = (color: string) =>
	`<a:solidFill><a:srgbClr val="${color.replace("#", "").toUpperCase()}"/></a:solidFill>`;

function spPrXml(chart: Chart, color: string | undefined): string {
	if (chart.type === "line") {
		return `<c:spPr><a:ln w="28575" cap="rnd">${color ? solid(color) : ""}<a:round/></a:ln></c:spPr>`;
	}
	if (chart.type === "scatter") {
		return '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>';
	}
	return color ? `<c:spPr>${solid(color)}</c:spPr>` : "";
}

function markerXml(chart: Chart, color: string | undefined): string {
	if (chart.type === "scatter") {
		const fill = color
			? `<c:spPr>${solid(color)}<a:ln><a:noFill/></a:ln></c:spPr>`
			: "";
		return `<c:marker>${v("symbol", "circle")}${v("size", 6)}${fill}</c:marker>`;
	}
	if (!chart.markers) {
		return `<c:marker>${v("symbol", "none")}</c:marker>`;
	}
	const fill = color ? `<c:spPr>${solid(color)}</c:spPr>` : "";
	return `<c:marker>${v("symbol", "circle")}${v("size", 5)}${fill}</c:marker>`;
}

const pointsXml = (points: (string | null)[] | undefined) =>
	(points ?? [])
		.map((color, i) =>
			color
				? `<c:dPt>${v("idx", i)}${v("bubble3D", 0)}<c:spPr>${solid(color)}<a:ln w="12700"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`
				: "",
		)
		.join("");

export function nameXml(series: ChartSeries, name: string): string {
	if (series.nameRef) {
		return `<c:tx><c:strRef><c:f>${esc(series.nameRef)}</c:f>${strCache([name])}</c:strRef></c:tx>`;
	}
	return series.name === undefined
		? ""
		: `<c:tx><c:v>${esc(series.name)}</c:v></c:tx>`;
}

/** The categories and values, as `cat`/`val` or a scatter's `xVal`/`yVal`. */
export function dataXml(
	chart: Chart,
	series: ChartSeries,
	data: ChartData,
	index: number,
) {
	const resolved = data.series[index];
	const values = resolved?.values ?? [];
	const scatter = chart.type === "scatter";
	let categories = "";
	if (series.categories && scatter) {
		categories = `<c:xVal><c:numRef><c:f>${esc(series.categories)}</c:f>${numCache(resolved?.xs ?? [])}</c:numRef></c:xVal>`;
	} else if (series.categories) {
		categories = `<c:cat><c:strRef><c:f>${esc(series.categories)}</c:f>${strCache(data.categories.slice(0, values.length))}</c:strRef></c:cat>`;
	}
	const tag = scatter ? "yVal" : "val";
	return `${categories}<c:${tag}><c:numRef><c:f>${esc(series.values)}</c:f>${numCache(values)}</c:numRef></c:${tag}>`;
}

function seriesXml(chart: Chart, data: ChartData, index: number): string {
	const series = chart.series[index] as ChartSeries;
	const name = data.series[index]?.name ?? series.name ?? `Series ${index + 1}`;
	const head = `${v("idx", index)}${v("order", index)}${nameXml(series, name)}${spPrXml(chart, series.color)}`;
	const body = dataXml(chart, series, data, index);
	switch (chart.type) {
		case "column":
		case "bar":
			return `<c:ser>${head}${v("invertIfNegative", 0)}${body}</c:ser>`;
		case "line":
		case "scatter":
			return `<c:ser>${head}${markerXml(chart, series.color)}${body}${v("smooth", 0)}</c:ser>`;
		case "area":
			return `<c:ser>${head}${body}</c:ser>`;
		default:
			return `<c:ser>${head}${pointsXml(series.points)}${body}</c:ser>`;
	}
}

interface AxisSpec {
	kind: "catAx" | "valAx";
	id: number;
	cross: number;
	position: string;
	percent?: boolean;
	/** Categories sit between ticks; a scatter's x values on them. */
	between?: boolean;
}

function axisXml(spec: AxisSpec, axis: ChartAxis): string {
	const { kind, percent } = spec;
	const max = axis.max === undefined ? "" : v("max", axis.max);
	const min = axis.min === undefined ? "" : v("min", axis.min);
	const scaling = `<c:scaling>${v("orientation", "minMax")}${max}${min}</c:scaling>`;
	const grid = axis.gridlines ? "<c:majorGridlines/>" : "";
	const title = axis.title ? titleXml(axis.title, 1000) : "";
	const format =
		kind === "valAx"
			? `<c:numFmt formatCode="${percent ? "0%" : "General"}" sourceLinked="${percent ? 0 : 1}"/>`
			: "";
	const ticks = `${v("majorTickMark", "out")}${v("minorTickMark", "none")}${v("tickLblPos", "nextTo")}`;
	const tail =
		kind === "catAx"
			? `${v("auto", 1)}${v("lblAlgn", "ctr")}${v("lblOffset", 100)}${v("noMultiLvlLbl", 0)}`
			: v("crossBetween", spec.between ? "between" : "midCat");
	return `<c:${kind}>${v("axId", spec.id)}${scaling}${v("delete", 0)}${v("axPos", spec.position)}${grid}${title}${format}${ticks}${v("crossAx", spec.cross)}${v("crosses", "autoZero")}${tail}</c:${kind}>`;
}

function axesXml(chart: Chart): string {
	if (chart.type === "pie" || chart.type === "doughnut") {
		return "";
	}
	if (chart.type === "scatter") {
		return (
			axisXml(
				{ kind: "valAx", id: X_AXIS, cross: Y_AXIS, position: "b" },
				chart.x,
			) +
			axisXml(
				{ kind: "valAx", id: Y_AXIS, cross: X_AXIS, position: "l" },
				chart.y,
			)
		);
	}
	const horizontal = chart.type === "bar";
	return (
		axisXml(
			{
				kind: "catAx",
				id: X_AXIS,
				cross: Y_AXIS,
				position: horizontal ? "l" : "b",
			},
			chart.x,
		) +
		axisXml(
			{
				kind: "valAx",
				id: Y_AXIS,
				cross: X_AXIS,
				position: horizontal ? "b" : "l",
				percent: chart.grouping === "percent",
				between: true,
			},
			chart.y,
		)
	);
}

const FILE_GROUPING = { percent: "percentStacked", stacked: "stacked" };

/** The plot's chart group: `c:barChart`, `c:lineChart`, … */
function groupXml(chart: Chart, series: string): string {
	const labels = chart.labels
		? `<c:dLbls>${v("showLegendKey", 0)}${v("showVal", 1)}${v("showCatName", 0)}${v("showSerName", 0)}${v("showPercent", 0)}${v("showBubbleSize", 0)}</c:dLbls>`
		: "";
	const grouping = chart.grouping ?? "clustered";
	const bars = chart.type === "column" || chart.type === "bar";
	const fileGrouping =
		grouping === "clustered"
			? bars
				? "clustered"
				: "standard"
			: FILE_GROUPING[grouping];
	const axes = `${v("axId", X_AXIS)}${v("axId", Y_AXIS)}`;
	const flat = `${v("varyColors", 0)}${series}${labels}`;
	switch (chart.type) {
		case "column":
		case "bar":
			return `<c:barChart>${v("barDir", chart.type === "bar" ? "bar" : "col")}${v("grouping", fileGrouping)}${flat}${v("gapWidth", 150)}${grouping === "clustered" ? "" : v("overlap", 100)}${axes}</c:barChart>`;
		case "line":
			return `<c:lineChart>${v("grouping", fileGrouping)}${flat}${v("marker", 1)}${axes}</c:lineChart>`;
		case "area":
			return `<c:areaChart>${v("grouping", fileGrouping)}${flat}${axes}</c:areaChart>`;
		case "scatter":
			return `<c:scatterChart>${v("scatterStyle", "lineMarker")}${flat}${axes}</c:scatterChart>`;
		case "doughnut":
			return `<c:doughnutChart>${v("varyColors", 1)}${series}${labels}${v("firstSliceAng", 0)}${v("holeSize", 50)}</c:doughnutChart>`;
		default:
			return `<c:pieChart>${v("varyColors", 1)}${series}${labels}${v("firstSliceAng", 0)}</c:pieChart>`;
	}
}

/** A chart part written from the model, values cached from `data`. */
export function chartXml(chart: Chart, data: ChartData): string {
	const series = chart.series.map((_, i) => seriesXml(chart, data, i)).join("");
	const title = chart.title
		? titleXml(chart.title, 1400) + v("autoTitleDeleted", 0)
		: v("autoTitleDeleted", 1);
	const legend =
		chart.legend === "none"
			? ""
			: `<c:legend>${v("legendPos", chart.legend)}<c:overlay val="0"/></c:legend>`;
	return `${PROLOG}<c:chartSpace xmlns:c="${CHART_NS}" xmlns:a="${A_NS}" xmlns:r="${REL_NS}">${v("roundedCorners", 0)}<c:chart>${title}<c:plotArea><c:layout/>${groupXml(chart, series)}${axesXml(chart)}</c:plotArea>${legend}${v("plotVisOnly", 1)}${v("dispBlanksAs", "gap")}</c:chart><c:spPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr></c:chartSpace>`;
}
