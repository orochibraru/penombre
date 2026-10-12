/**
 * A chart as the sheet editor, the `.xlsx` reader and writer and the SVG
 * renderer share it. Nothing here knows about DrawingML or the DOM: a chart
 * is its type, its look, and references to the cells it plots.
 *
 * References are formula text without the `=` (`Sheet1!$B$2:$B$9`), so the
 * same rewrites as formulas apply when rows move or a sheet is renamed.
 */

export const CHART_TYPES = [
	"column",
	"bar",
	"line",
	"area",
	"pie",
	"doughnut",
	"scatter",
] as const;

export type ChartType = (typeof CHART_TYPES)[number];

/** Side by side, stacked, or stacked to 100%. Pie and scatter have none. */
export type Grouping = "clustered" | "stacked" | "percent";

export type LegendPosition = "r" | "l" | "t" | "b" | "none";

export interface ChartAxis {
	title?: string;
	min?: number;
	max?: number;
	gridlines?: boolean;
}

/** What the file recorded for a series, for references that cannot be read here. */
export interface SeriesCache {
	name?: string;
	categories?: string[];
	values?: (number | null)[];
}

export interface ChartSeries {
	/** A name written out, when it is not a reference. */
	name?: string;
	nameRef?: string;
	/** The category labels; a scatter chart's x values. */
	categories?: string;
	values: string;
	/** `#rrggbb`; unset is automatic, the palette's next colour. */
	color?: string;
	/** A pie's slices, one colour each, in order. */
	points?: (string | null)[];
	cache?: SeriesCache;
}

/**
 * Where the chart floats: its top-left cell, an offset into it, and its size,
 * all in CSS pixels.
 */
export interface ChartAnchor {
	row: number;
	col: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Chart {
	/** Unique within the workbook while it is open. */
	id: string;
	/** The chart part it was read from, so a save finds it again. */
	origin?: string;
	anchor: ChartAnchor;
	type: ChartType;
	grouping?: Grouping;
	/** A line chart's points drawn as dots. */
	markers?: boolean;
	title?: string;
	legend: LegendPosition;
	/** Values written on the marks. */
	labels?: boolean;
	/** The category axis (a scatter's x values). */
	x: ChartAxis;
	/** The value axis. */
	y: ChartAxis;
	series: ChartSeries[];
	/**
	 * What the file holds that this editor cannot edit (`combo`, `3d`,
	 * `trendline`, `radar`, …). Such a chart is shown as best it can be, can
	 * be moved, resized and deleted, and is otherwise saved as it was.
	 */
	unsupported?: string[];
}

export const MIN_CHART_SIZE = 80;
export const MAX_CHARTS = 200;
const MAX_SERIES = 255;
const MAX_TEXT = 1000;
const MAX_POINTS = 10_000;

export const isEditable = (chart: Chart): boolean =>
	(chart.unsupported?.length ?? 0) === 0;

/** Stacking applies to these; pie and scatter ignore it. */
export const isGroupable = (type: ChartType): boolean =>
	type === "column" || type === "bar" || type === "line" || type === "area";

// =========================================================================
// Checking a chart that crossed the network
// =========================================================================

const HEX = /^#[0-9a-f]{6}$/i;
const LEGENDS = new Set<string>(["r", "l", "t", "b", "none"]);
const GROUPINGS = new Set<string>(["clustered", "stacked", "percent"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown, max = MAX_TEXT): string | undefined =>
	typeof value === "string" && value.length <= max ? value : undefined;

const finite = (value: unknown): number | undefined =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined;

const color = (value: unknown): string | undefined =>
	typeof value === "string" && HEX.test(value)
		? value.toLowerCase()
		: undefined;

/** Keeps only the fields that are set, so two equal charts compare equal. */
function compact<T extends object>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, v]) => v !== undefined),
	) as T;
}

function axis(value: unknown): ChartAxis {
	const raw = isRecord(value) ? value : {};
	return compact({
		title: str(raw.title),
		min: finite(raw.min),
		max: finite(raw.max),
		gridlines: raw.gridlines === true ? true : undefined,
	});
}

function cache(value: unknown): SeriesCache | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const categories = Array.isArray(value.categories)
		? value.categories
				.slice(0, MAX_POINTS)
				.map((item) => (typeof item === "string" ? item : ""))
		: undefined;
	const values = Array.isArray(value.values)
		? value.values.slice(0, MAX_POINTS).map((item) => finite(item) ?? null)
		: undefined;
	return compact({ name: str(value.name), categories, values });
}

function series(value: unknown): ChartSeries | null {
	if (!isRecord(value)) {
		return null;
	}
	const values = str(value.values);
	if (values === undefined) {
		return null;
	}
	const points = Array.isArray(value.points)
		? value.points.slice(0, MAX_POINTS).map((item) => color(item) ?? null)
		: undefined;
	return compact({
		name: str(value.name),
		nameRef: str(value.nameRef),
		categories: str(value.categories),
		values,
		color: color(value.color),
		points,
		cache: cache(value.cache),
	});
}

function anchor(value: unknown): ChartAnchor | null {
	if (!isRecord(value)) {
		return null;
	}
	const index = (n: unknown) => {
		const v = finite(n);
		return v !== undefined && Number.isInteger(v) && v >= 0 && v <= 1_048_575
			? v
			: undefined;
	};
	const size = (n: unknown) => {
		const v = finite(n);
		return v !== undefined && v > 0 && v <= 100_000 ? v : undefined;
	};
	const offset = (n: unknown) => {
		const v = finite(n);
		return v !== undefined && Math.abs(v) <= 100_000 ? v : undefined;
	};
	const row = index(value.row);
	const col = index(value.col);
	const x = offset(value.x);
	const y = offset(value.y);
	const width = size(value.width);
	const height = size(value.height);
	if (
		row === undefined ||
		col === undefined ||
		x === undefined ||
		y === undefined ||
		width === undefined ||
		height === undefined
	) {
		return null;
	}
	return { row, col, x, y, width, height };
}

/** One chart from untrusted JSON, or null when it is not one. */
export function checkChart(value: unknown): Chart | null {
	if (!isRecord(value)) {
		return null;
	}
	const id = str(value.id, 200);
	const where = anchor(value.anchor);
	const type = CHART_TYPES.find((t) => t === value.type);
	if (!(id && where && type) || !Array.isArray(value.series)) {
		return null;
	}
	const list = value.series.slice(0, MAX_SERIES).map(series);
	if (list.some((item) => item === null)) {
		return null;
	}
	const unsupported = Array.isArray(value.unsupported)
		? value.unsupported.flatMap((item) => str(item, 40) ?? []).slice(0, 20)
		: [];
	return compact({
		id,
		origin: str(value.origin, 300),
		anchor: where,
		type,
		grouping:
			typeof value.grouping === "string" && GROUPINGS.has(value.grouping)
				? (value.grouping as Grouping)
				: undefined,
		markers: value.markers === true ? true : undefined,
		title: str(value.title),
		legend:
			typeof value.legend === "string" && LEGENDS.has(value.legend)
				? (value.legend as LegendPosition)
				: "r",
		labels: value.labels === true ? true : undefined,
		x: axis(value.x),
		y: axis(value.y),
		series: list as ChartSeries[],
		unsupported: unsupported.length > 0 ? unsupported : undefined,
	});
}

/** A sheet's charts from untrusted JSON; malformed ones are dropped. */
export function checkCharts(value: unknown): Chart[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	return value
		.slice(0, MAX_CHARTS)
		.map(checkChart)
		.filter((chart): chart is Chart => chart !== null);
}

/** JSON with sorted keys: two charts are the same when these are. */
export function canonical(value: unknown): string {
	return JSON.stringify(value, (_key, inner: unknown) =>
		isRecord(inner)
			? Object.fromEntries(
					Object.keys(inner)
						.sort()
						.map((key) => [key, inner[key]]),
				)
			: inner,
	);
}
