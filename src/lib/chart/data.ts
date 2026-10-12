import {
	columnName,
	parseParts,
	quoteSheet,
	tokenize,
} from "../sheet/references";
import type { Value } from "../sheet/values";
import type { Chart, ChartSeries, ChartType } from "./model";

/**
 * A chart's references read against the live workbook, and the guesses
 * Insert → Chart makes from a selection. A reference that cannot be read
 * here (another workbook, a defined name, several areas) falls back to what
 * the file recorded for it.
 */

/** What a chart reads cells through: the formula engine, or a test's grid. */
export interface CellSource {
	/** Sheet names, in workbook order. */
	names: string[];
	value(sheet: number, row: number, col: number): Value;
	shown(sheet: number, row: number, col: number): string;
	/** How many rows a sheet has, for whole-column references. */
	height(sheet: number): number;
	width(sheet: number): number;
}

export interface Area {
	sheet: number;
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export interface SeriesData {
	name: string;
	color?: string;
	points?: (string | null)[];
	values: (number | null)[];
	/** A scatter series' x values. */
	xs?: (number | null)[];
}

export interface ChartData {
	categories: string[];
	series: SeriesData[];
}

/** Areas larger than this are cut: no chart plots a million points. */
const MAX_CELLS = 10_000;

/** A single-area reference, as a rectangle on a sheet, or null. */
export function areaOf(
	ref: string | undefined,
	source: CellSource,
	own: number,
): Area | null {
	if (!ref) {
		return null;
	}
	let tokens: ReturnType<typeof tokenize>;
	try {
		tokens = tokenize(ref.trim());
	} catch {
		return null;
	}
	if (tokens.length !== 1 || tokens[0]?.kind !== "ref") {
		return null;
	}
	const parts = parseParts(tokens[0].text);
	const sheet =
		parts.sheet === null
			? own
			: source.names.findIndex(
					(name) => name.toLowerCase() === parts.sheet?.toLowerCase(),
				);
	if (sheet < 0) {
		return null;
	}
	const end = parts.end ?? parts.start;
	const whole = (a: number | null, b: number | null, size: number) =>
		a === null || b === null
			? [0, Math.max(0, size - 1)]
			: [Math.min(a, b), Math.max(a, b)];
	const [r1 = 0, r2 = 0] = whole(
		parts.start.row,
		end.row,
		source.height(sheet),
	);
	const [c1 = 0, c2 = 0] = whole(parts.start.col, end.col, source.width(sheet));
	return {
		sheet,
		top: Math.min(r1, r2),
		left: Math.min(c1, c2),
		bottom: Math.max(r1, r2),
		right: Math.max(c1, c2),
	};
}

function cellsOf(area: Area): [number, number][] {
	const out: [number, number][] = [];
	for (let r = area.top; r <= area.bottom; r++) {
		for (let c = area.left; c <= area.right; c++) {
			out.push([r, c]);
			if (out.length >= MAX_CELLS) {
				return out;
			}
		}
	}
	return out;
}

const asNumber = (value: Value): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

function numbersAt(
	ref: string | undefined,
	source: CellSource,
	own: number,
): (number | null)[] | null {
	const area = areaOf(ref, source, own);
	return area
		? cellsOf(area).map(([r, c]) => asNumber(source.value(area.sheet, r, c)))
		: null;
}

function textsAt(
	ref: string | undefined,
	source: CellSource,
	own: number,
): string[] | null {
	const area = areaOf(ref, source, own);
	return area
		? cellsOf(area).map(([r, c]) => source.shown(area.sheet, r, c))
		: null;
}

interface Reading {
	source: CellSource;
	own: number;
	label: (n: number) => string;
}

function nameOf(
	series: ChartSeries,
	index: number,
	{ source, own, label }: Reading,
): string {
	if (series.name !== undefined) {
		return series.name;
	}
	const texts = textsAt(series.nameRef, source, own);
	if (texts) {
		return texts.filter(Boolean).join(" ");
	}
	return series.cache?.name ?? label(index + 1);
}

/** Every series' numbers and the category labels, as the grid has them now. */
export function chartData(
	chart: Chart,
	source: CellSource,
	own: number,
	label: (n: number) => string = (n) => `Series ${n}`,
): ChartData {
	let categories: string[] = [];
	const series = chart.series.map((item, index): SeriesData => {
		const values =
			numbersAt(item.values, source, own) ?? item.cache?.values ?? [];
		const labels =
			textsAt(item.categories, source, own) ?? item.cache?.categories;
		if (labels && labels.length > categories.length) {
			categories = labels;
		}
		const data: SeriesData = {
			name: nameOf(item, index, { source, own, label }),
			values,
			...(item.color ? { color: item.color } : {}),
			...(item.points ? { points: item.points } : {}),
		};
		if (chart.type === "scatter") {
			const xs =
				numbersAt(item.categories, source, own) ??
				item.cache?.categories?.map((text) => {
					const n = Number(text);
					return text !== "" && Number.isFinite(n) ? n : null;
				});
			// Text x values plot as 1, 2, 3…, as Excel plots them.
			data.xs = xs?.some((x) => x !== null) ? xs : values.map((_, i) => i + 1);
		}
		return data;
	});
	const longest = series.reduce((n, s) => Math.max(n, s.values.length), 0);
	while (categories.length < longest) {
		categories.push(String(categories.length + 1));
	}
	return { categories: categories.slice(0, Math.max(longest, 1)), series };
}

// =========================================================================
// Building references
// =========================================================================

const cellRef = (row: number, col: number) => `$${columnName(col)}$${row + 1}`;

/** `Sheet1!$A$1:$A$9`; one cell is written as one. */
export function areaRef(sheet: string, area: Omit<Area, "sheet">): string {
	const start = cellRef(area.top, area.left);
	const end = cellRef(area.bottom, area.right);
	return `${quoteSheet(sheet)}!${start}${start === end ? "" : `:${end}`}`;
}

/** The range a dialog shows: `A1:C9`, with the sheet only when it is another. */
export function areaName(area: Area, names: string[], own: number): string {
	const name = names[area.sheet] ?? "";
	const ref = areaRef(name, area).replace(/\$/g, "");
	return area.sheet === own ? ref.slice(ref.indexOf("!") + 1) : ref;
}

/** Every series' references rewritten; `rewrite` takes and gives formulas. */
export function mapRefs(
	chart: Chart,
	rewrite: (formula: string) => string,
): Chart {
	const through = (ref: string | undefined) =>
		ref === undefined ? undefined : rewrite(`=${ref}`).slice(1);
	let changed = false;
	const series = chart.series.map((item) => {
		const next: ChartSeries = { ...item, values: through(item.values) ?? "" };
		if (item.nameRef !== undefined) {
			next.nameRef = through(item.nameRef);
		}
		if (item.categories !== undefined) {
			next.categories = through(item.categories);
		}
		if (
			next.values !== item.values ||
			next.nameRef !== item.nameRef ||
			next.categories !== item.categories
		) {
			changed = true;
			return next;
		}
		return item;
	});
	return changed ? { ...chart, series } : chart;
}

// =========================================================================
// Insert → Chart: what a selection most likely means
// =========================================================================

/** How a block of cells splits into labels, names and numbers. */
export interface Layout {
	area: Area;
	/** The first row names the series (or the categories, by rows). */
	headerRow: boolean;
	/** The first column labels the categories. */
	labelCol: boolean;
	/** Each column is a series; otherwise each row is. */
	byColumn: boolean;
}

const isNumeric = (value: Value) =>
	typeof value === "number" && Number.isFinite(value);

/**
 * The block of filled cells around one cell, as a single click before
 * Insert → Chart means: grown until a blank row and column surround it.
 */
export function regionAround(
	source: CellSource,
	sheet: number,
	row: number,
	col: number,
): Area {
	const filled = (r: number, c: number) =>
		r >= 0 && c >= 0 && source.shown(sheet, r, c) !== "";
	const area = { sheet, top: row, left: col, bottom: row, right: col };
	const rowFilled = (r: number) => {
		for (let c = area.left - 1; c <= area.right + 1; c++) {
			if (filled(r, c)) {
				return true;
			}
		}
		return false;
	};
	const colFilled = (c: number) => {
		for (let r = area.top - 1; r <= area.bottom + 1; r++) {
			if (filled(r, c)) {
				return true;
			}
		}
		return false;
	};
	for (let grew = true, guard = 0; grew && guard < 2000; guard++) {
		grew = false;
		if (area.top > 0 && rowFilled(area.top - 1)) {
			area.top--;
			grew = true;
		}
		if (area.bottom < source.height(sheet) - 1 && rowFilled(area.bottom + 1)) {
			area.bottom++;
			grew = true;
		}
		if (area.left > 0 && colFilled(area.left - 1)) {
			area.left--;
			grew = true;
		}
		if (area.right < source.width(sheet) - 1 && colFilled(area.right + 1)) {
			area.right++;
			grew = true;
		}
	}
	return area;
}

/** Headers and orientation guessed the way Excel and Google Sheets guess. */
export function guessLayout(
	source: CellSource,
	area: Area,
	byColumn?: boolean,
): Layout {
	const { sheet, top, left, bottom, right } = area;
	const value = (r: number, c: number) => source.value(sheet, r, c);
	const blank = (r: number, c: number) => source.shown(sheet, r, c) === "";
	const height = bottom - top + 1;
	const width = right - left + 1;

	let headerRow = false;
	if (height > 1) {
		let text = false;
		for (let c = left; c <= right; c++) {
			if (!(blank(top, c) || isNumeric(value(top, c)))) {
				text = true;
			}
		}
		headerRow = text || blank(top, left);
	}
	let labelCol = false;
	if (width > 1) {
		let numbers = 0;
		let filled = 0;
		for (let r = top + (headerRow ? 1 : 0); r <= bottom; r++) {
			if (!blank(r, left)) {
				filled++;
				if (
					isNumeric(value(r, left)) &&
					!/[-/:]/.test(source.shown(sheet, r, left))
				) {
					numbers++;
				}
			}
		}
		labelCol =
			(filled > 0 && numbers < filled) || (headerRow && blank(top, left));
	}
	const rows = height - (headerRow ? 1 : 0);
	const cols = width - (labelCol ? 1 : 0);
	return {
		area,
		headerRow,
		labelCol,
		byColumn: byColumn ?? rows >= cols,
	};
}

/** The series a layout makes, references absolute. */
export function seriesOf(layout: Layout, names: string[]): ChartSeries[] {
	const { area, headerRow, labelCol, byColumn } = layout;
	const sheet = names[area.sheet] ?? "";
	const top = area.top + (headerRow ? 1 : 0);
	const left = area.left + (labelCol ? 1 : 0);
	const ref = (a: Omit<Area, "sheet">) => areaRef(sheet, a);
	const out: ChartSeries[] = [];
	if (byColumn) {
		for (let c = left; c <= area.right; c++) {
			out.push({
				values: ref({ top, left: c, bottom: area.bottom, right: c }),
				...(headerRow
					? {
							nameRef: ref({
								top: area.top,
								left: c,
								bottom: area.top,
								right: c,
							}),
						}
					: {}),
				...(labelCol
					? {
							categories: ref({
								top,
								left: area.left,
								bottom: area.bottom,
								right: area.left,
							}),
						}
					: {}),
			});
		}
	} else {
		for (let r = top; r <= area.bottom; r++) {
			out.push({
				values: ref({ top: r, left, bottom: r, right: area.right }),
				...(labelCol
					? {
							nameRef: ref({
								top: r,
								left: area.left,
								bottom: r,
								right: area.left,
							}),
						}
					: {}),
				...(headerRow
					? {
							categories: ref({
								top: area.top,
								left,
								bottom: area.top,
								right: area.right,
							}),
						}
					: {}),
			});
		}
	}
	return out.length > 0 ? out : [{ values: ref(area) }];
}

/** A line for a run of dates, columns for everything else. */
export function guessType(layout: Layout, source: CellSource): ChartType {
	const { area, headerRow, labelCol, byColumn } = layout;
	if (!(labelCol && byColumn)) {
		return "column";
	}
	let dates = 0;
	let count = 0;
	for (let r = area.top + (headerRow ? 1 : 0); r <= area.bottom; r++) {
		count++;
		if (/^\d{4}-\d{2}-\d{2}/.test(source.shown(area.sheet, r, area.left))) {
			dates++;
		}
	}
	return count > 6 && dates === count ? "line" : "column";
}

/**
 * The rectangle a chart's series cover, when they all sit on one sheet: what
 * the editor shows as its data range.
 */
export function chartArea(
	chart: Chart,
	source: CellSource,
	own: number,
): Area | null {
	let out: Area | null = null;
	for (const item of chart.series) {
		for (const ref of [item.values, item.categories, item.nameRef]) {
			if (ref === undefined) {
				continue;
			}
			const area = areaOf(ref, source, own);
			if (!area || (out && out.sheet !== area.sheet)) {
				return null;
			}
			out = out
				? {
						sheet: out.sheet,
						top: Math.min(out.top, area.top),
						left: Math.min(out.left, area.left),
						bottom: Math.max(out.bottom, area.bottom),
						right: Math.max(out.right, area.right),
					}
				: area;
		}
	}
	return out;
}

/** The formula engine's view of a workbook, as charts read it. */
export function sourceOf(
	engine: {
		value(sheet: number, row: number, col: number): Value;
		shown(sheet: number, row: number, col: number): string;
	},
	sheets: { name: string; rows: string[][] }[],
): CellSource {
	return {
		names: sheets.map((sheet) => sheet.name),
		value: (sheet, row, col) => engine.value(sheet, row, col),
		shown: (sheet, row, col) => engine.shown(sheet, row, col),
		height: (sheet) => sheets[sheet]?.rows.length ?? 0,
		width: (sheet) =>
			(sheets[sheet]?.rows ?? []).reduce(
				(n, row) => Math.max(n, row.length),
				0,
			),
	};
}
