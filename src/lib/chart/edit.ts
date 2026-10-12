import {
	adjustFormula,
	type LineChange,
	renameSheetRefs,
} from "../sheet/references";
import {
	type Area,
	type CellSource,
	guessLayout,
	guessType,
	mapRefs,
	seriesOf,
} from "./data";
import type { Chart, ChartAnchor } from "./model";

/**
 * What the sheet editor does to charts: rows and columns moving under them,
 * sheets renamed, a new chart from a selection, and snapping a drag to the
 * grid. Pure, so `chart.test.ts` covers it.
 */

/** A line index after an insert or delete; a deleted one lands at `at`. */
function shift(index: number, { at, count }: LineChange): number {
	if (index < at) {
		return index;
	}
	if (count > 0) {
		return index + count;
	}
	return index >= at - count ? index + count : at;
}

/**
 * A sheet's charts after rows or columns changed on sheet `target`: their
 * references follow as formulas do, and on that sheet the charts move with
 * their top-left cell.
 */
export function moveCharts(
	charts: Chart[] | undefined,
	change: LineChange,
	target: string,
	own: string,
): Chart[] | undefined {
	if (!charts) {
		return charts;
	}
	let changed = false;
	const next = charts.map((chart) => {
		let out = mapRefs(chart, (formula) =>
			adjustFormula(formula, change, target, own),
		);
		if (target.toLowerCase() === own.toLowerCase()) {
			const field = change.axis === "row" ? "row" : "col";
			const moved = shift(chart.anchor[field], change);
			if (moved !== chart.anchor[field]) {
				out = { ...out, anchor: { ...chart.anchor, [field]: moved } };
			}
		}
		if (out !== chart) {
			changed = true;
		}
		return out;
	});
	return changed ? next : charts;
}

/** Every chart's references after sheet `from` became `to` (null: deleted). */
export function renameChartRefs<T extends { sheets: { charts?: Chart[] }[] }>(
	book: T,
	from: string,
	to: string | null,
): T {
	let changed = false;
	const sheets = book.sheets.map((sheet) => {
		if (!sheet.charts?.length) {
			return sheet;
		}
		const charts = sheet.charts.map((chart) =>
			mapRefs(chart, (formula) => renameSheetRefs(formula, from, to)),
		);
		if (charts.every((chart, i) => chart === sheet.charts?.[i])) {
			return sheet;
		}
		changed = true;
		return { ...sheet, charts };
	});
	return changed ? { ...book, sheets } : book;
}

/** A fresh id, unique enough within one open workbook. */
export const newChartId = (): string =>
	`new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** A chart over `area`, typed and laid out as Excel and Google Sheets guess. */
export function chartFor(
	source: CellSource,
	area: Area,
	palette: string[] = [],
	anchor: ChartAnchor = {
		row: area.top,
		col: area.right + 2,
		x: 0,
		y: 0,
		width: 480,
		height: 300,
	},
): Chart {
	const layout = guessLayout(source, area);
	const type = guessType(layout, source);
	const series = seriesOf(layout, source.names);
	return withColors(
		{
			id: newChartId(),
			anchor,
			type,
			...(type === "line" ? { markers: true } : {}),
			legend: series.length > 1 ? "b" : "none",
			x: {},
			y: { gridlines: true },
			series,
		},
		palette,
	);
}

/**
 * Every series without a colour given the palette's colour for its slot (a
 * pie, each of its `points` slices), so the file says what was on screen.
 */
export function withColors(chart: Chart, palette: string[], points = 0): Chart {
	if (palette.length === 0) {
		return chart;
	}
	const pick = (i: number) => palette[i % palette.length] ?? null;
	const round = chart.type === "pie" || chart.type === "doughnut";
	return {
		...chart,
		series: chart.series.map((series, i) => {
			// A pie is coloured by slice, never by series.
			const next =
				series.color || round
					? series
					: { ...series, color: pick(i) ?? undefined };
			if (!(round && i === 0 && points > 0)) {
				return next;
			}
			const slices = Array.from(
				{ length: Math.max(points, series.points?.length ?? 0) },
				(_, n) => series.points?.[n] ?? pick(n),
			);
			return { ...next, points: slices };
		}),
	};
}

/** A copy one cell down and right, a new chart as far as the file goes. */
export function copyOf(chart: Chart): Chart {
	const { origin: _origin, ...rest } = chart;
	const { row, col } = chart.anchor;
	return {
		...rest,
		id: newChartId(),
		anchor: { ...chart.anchor, row: row + 1, col: col + 1 },
	};
}

/**
 * The chart's series rebuilt over a new range or orientation. Colours stay
 * with their position, so switching rows and columns keeps the palette.
 */
export function withData(
	chart: Chart,
	source: CellSource,
	area: Area,
	byColumn?: boolean,
): Chart {
	const series = seriesOf(guessLayout(source, area, byColumn), source.names);
	return {
		...chart,
		series: series.map((item, i) => {
			const color = chart.series[i]?.color;
			return color ? { ...item, color } : item;
		}),
	};
}

/** Where a pixel lands in a run of cells: the cell and how far into it. */
export function cellAt(
	position: number,
	size: (index: number) => number,
): { index: number; offset: number } {
	let index = 0;
	let start = 0;
	while (index < 1_048_575) {
		const next = start + size(index);
		if (position < next) {
			break;
		}
		start = next;
		index++;
	}
	return { index, offset: Math.max(0, position - start) };
}

/** The nearest cell edge to a pixel, for snapping a drag to the grid. */
export function nearestEdge(
	position: number,
	size: (index: number) => number,
): { index: number; at: number } {
	const { index, offset } = cellAt(Math.max(0, position), size);
	const start = position - offset;
	return offset > size(index) / 2
		? { index: index + 1, at: start + size(index) }
		: { index, at: start };
}
