import { firstFamily, FONT_FAMILIES } from "../editor/document-format";
import { moveMerges } from "./merges";
import type { Rect } from "./selection";

/**
 * Cell formatting as the sheet editor and the `.xlsx` reader and writer share
 * it. A workbook carries one table of styles (`styles`); each sheet a grid
 * of indices into it (`styleIds`), parallel to its rows. Index `i` below the
 * file's count is the file's own `cellXfs` entry `i`; the editor appends new
 * combinations and never changes an entry, so undo needs no copy of the
 * table.
 *
 * Every property is relative to the workbook's default font: absent means
 * "as the workbook's Normal style", which is also how the grid draws it.
 */

export const SIDES = ["top", "right", "bottom", "left"] as const;
export type Side = (typeof SIDES)[number];

/** Excel's border styles, all of which a file may hold. */
export const BORDER_STYLES = [
	"thin",
	"medium",
	"thick",
	"dashed",
	"dotted",
	"double",
	"hair",
	"mediumDashed",
	"dashDot",
	"mediumDashDot",
	"dashDotDot",
	"mediumDashDotDot",
	"slantDashDot",
] as const;
export type BorderStyle = (typeof BORDER_STYLES)[number];

export interface BorderEdge {
	style: BorderStyle;
	/** `#RRGGBB`; absent is automatic. */
	color?: string;
}

export type HorizontalAlign = "left" | "center" | "right" | "justify";
export type VerticalAlign = "top" | "middle" | "bottom";

export interface CellStyle {
	bold?: true;
	italic?: true;
	underline?: true;
	strike?: true;
	/** Text colour, `#RRGGBB`; absent is automatic. */
	color?: string;
	/** Fill colour, `#RRGGBB`. */
	fill?: string;
	/** Points. */
	size?: number;
	font?: string;
	align?: HorizontalAlign;
	valign?: VerticalAlign;
	wrap?: true;
	borders?: Partial<Record<Side, BorderEdge>>;
	/** A number format code; absent is General. */
	format?: string;
	/**
	 * The file's style this one was made from, so a save keeps what the
	 * editor does not model (protection, indent, a theme colour it left
	 * alone).
	 */
	base?: number;
}

const HEX = /^#[0-9A-F]{6}$/;

function colour(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const upper = value.toUpperCase();
	return HEX.test(upper) ? upper : undefined;
}

/** Black reads as automatic: on the dark theme it would be invisible. */
const textColour = (value: unknown) => {
	const hex = colour(value);
	return hex === "#000000" ? undefined : hex;
};

/** What a font name may hold: it ends up in a `style` attribute. */
export function safeFontName(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const name = value
		.replace(/[^\p{L}\p{N} _.'-]/gu, "")
		.trim()
		.slice(0, 64);
	return name || undefined;
}

function edge(value: unknown): BorderEdge | undefined {
	const raw = value as Partial<BorderEdge> | null;
	if (!(raw && BORDER_STYLES.includes(raw.style as BorderStyle))) {
		return undefined;
	}
	const hex = textColour(raw.color);
	return { style: raw.style as BorderStyle, ...(hex ? { color: hex } : {}) };
}

const ALIGNS = new Set<unknown>(["left", "center", "right", "justify"]);
const VALIGNS = new Set<unknown>(["top", "middle", "bottom"]);

export interface StyleDefaults {
	font?: string;
	size?: number;
}

/** Size, font, alignment, format: what a default or a bad value drops. */
function layout(
	raw: Record<string, unknown>,
	defaults: StyleDefaults,
): CellStyle {
	const style: CellStyle = {};
	const size = Number(raw.size);
	const points = Math.round(size * 2) / 2;
	if (
		raw.size !== undefined &&
		size >= 1 &&
		size <= 409 &&
		points !== defaults.size
	) {
		style.size = points;
	}
	const font = safeFontName(raw.font);
	if (font && font.toLowerCase() !== defaults.font?.toLowerCase()) {
		style.font = font;
	}
	if (ALIGNS.has(raw.align)) {
		style.align = raw.align as HorizontalAlign;
	}
	if (VALIGNS.has(raw.valign)) {
		style.valign = raw.valign as VerticalAlign;
	}
	const format = typeof raw.format === "string" ? raw.format : "";
	if (
		format.trim() !== "" &&
		format.length <= 255 &&
		!/^general$/i.test(format.trim())
	) {
		style.format = format;
	}
	return style;
}

/**
 * A style as it may be trusted: unknown fields dropped, colours checked,
 * and anything equal to the workbook's default left out, so two spellings of
 * one look are the same style.
 */
export function normalizeStyle(
	input: unknown,
	defaults: StyleDefaults = {},
): CellStyle {
	const raw = (input ?? {}) as Record<string, unknown>;
	const style: CellStyle = {};
	for (const flag of ["bold", "italic", "underline", "strike", "wrap"]) {
		if (raw[flag] === true) {
			(style as Record<string, unknown>)[flag] = true;
		}
	}
	const color = textColour(raw.color);
	if (color) {
		style.color = color;
	}
	const fill = colour(raw.fill);
	if (fill) {
		style.fill = fill;
	}
	Object.assign(style, layout(raw, defaults));
	const borders: CellStyle["borders"] = {};
	for (const side of SIDES) {
		const value = edge(
			(raw.borders as Record<string, unknown> | undefined)?.[side],
		);
		if (value) {
			borders[side] = value;
		}
	}
	if (Object.keys(borders).length > 0) {
		style.borders = borders;
	}
	if (Number.isSafeInteger(raw.base) && (raw.base as number) >= 0) {
		style.base = raw.base as number;
	}
	return style;
}

/** One string per look, `base` aside: equal keys draw and save the same. */
export function styleKey(style: CellStyle): string {
	const { base: _base, borders, ...rest } = style;
	const ordered = Object.keys(rest)
		.sort()
		.map((key) => [key, rest[key as keyof typeof rest]]);
	const sides = SIDES.flatMap((side) =>
		borders?.[side]
			? [[side, borders[side]?.style, borders[side]?.color ?? ""]]
			: [],
	);
	return JSON.stringify([ordered, sides]);
}

// =========================================================================
// Drawing
// =========================================================================

/** How one style draws, worked out once per style rather than per cell. */
export interface Look {
	/**
	 * Inline CSS for the cell. Its right and bottom borders replace the grid
	 * lines; top and left are shadows over the neighbours' grid lines, so no
	 * border changes a row's height or a column's offset.
	 */
	cell: string;
	/** All four borders as one box's CSS, for a merge drawn over its cells. */
	frame: string;
	/** The text's own CSS (colour, font, decoration), for a merge's box. */
	text: string;
	/** Text wrapped, or a size that could push the row taller: boxed text. */
	boxed: boolean;
	wrap: boolean;
	/** Explicit horizontal alignment, which overflow and numbers defer to. */
	align?: HorizontalAlign;
}

export const PLAIN_LOOK: Look = {
	cell: "",
	frame: "",
	text: "",
	boxed: false,
	wrap: false,
};

const BORDER_CSS: Record<BorderStyle, string> = {
	thin: "1px solid",
	hair: "1px dotted",
	dotted: "1px dotted",
	dashed: "1px dashed",
	dashDot: "1px dashed",
	dashDotDot: "1px dashed",
	slantDashDot: "2px dashed",
	medium: "2px solid",
	mediumDashed: "2px dashed",
	mediumDashDot: "2px dashed",
	mediumDashDotDot: "2px dashed",
	thick: "3px solid",
	double: "3px double",
};

/** A font name as a CSS stack: the editor's own stack when it has one. */
function fontStack(name: string): string {
	const known = FONT_FAMILIES.find(
		(choice) => firstFamily(choice.value).toLowerCase() === name.toLowerCase(),
	);
	// Only fonts the browser already has: none is ever downloaded.
	return known?.value ?? `"${name}", var(--app-font, sans-serif)`;
}

/** Black or white, whichever reads on `fill`: a dark fill gets white. */
function inkOn(fill: string): string {
	const [r, g, b] = [1, 3, 5].map((at) =>
		Number.parseInt(fill.slice(at, at + 2), 16),
	) as [number, number, number];
	return 0.299 * r + 0.587 * g + 0.114 * b < 140 ? "#FFFFFF" : "#000000";
}

export function lookOf(style: CellStyle | undefined): Look {
	if (!style || styleKey(style) === styleKey({})) {
		return PLAIN_LOOK;
	}
	const css: string[] = [];
	if (style.fill) {
		css.push(`background-color: ${style.fill}`);
	}
	// Automatic text on a fill reads against the fill, not the app's theme.
	const ink = style.color ?? (style.fill ? inkOn(style.fill) : undefined);
	if (ink) {
		css.push(`color: ${ink}`);
	}
	if (style.bold) {
		css.push("font-weight: 700");
	}
	if (style.italic) {
		css.push("font-style: italic");
	}
	const lines = [
		style.underline ? "underline" : "",
		style.strike ? "line-through" : "",
	].filter(Boolean);
	if (lines.length > 0) {
		css.push(`text-decoration-line: ${lines.join(" ")}`);
	}
	if (style.size) {
		css.push(`font-size: ${style.size}pt`);
	}
	if (style.font) {
		css.push(`font-family: ${fontStack(style.font)}`);
	}
	const text = css.filter((rule) => !rule.startsWith("background")).join("; ");
	if (style.align) {
		css.push(`text-align: ${style.align}`);
	}
	if (style.valign) {
		css.push(`vertical-align: ${style.valign}`);
	}
	const line = (side: Side) => {
		const value = style.borders?.[side];
		return value
			? `${BORDER_CSS[value.style]} ${value.color ?? "var(--foreground)"}`
			: null;
	};
	const shadows: string[] = [];
	for (const side of SIDES) {
		const value = style.borders?.[side];
		if (!value) {
			continue;
		}
		if (side === "right" || side === "bottom") {
			css.push(`border-${side}: ${line(side)}`);
		} else {
			const width = Number.parseInt(BORDER_CSS[value.style], 10);
			const colour = value.color ?? "var(--foreground)";
			shadows.push(
				side === "top"
					? `0 -${width}px 0 0 ${colour}`
					: `-${width}px 0 0 0 ${colour}`,
			);
		}
	}
	if (shadows.length > 0) {
		css.push(`box-shadow: ${shadows.join(", ")}`);
	}
	const frame = SIDES.flatMap((side) =>
		line(side) ? [`border-${side}: ${line(side)}`] : [],
	).join("; ");
	return {
		cell: css.join("; "),
		frame,
		text,
		boxed: Boolean(style.wrap || style.size),
		wrap: Boolean(style.wrap),
		align: style.align,
	};
}

// =========================================================================
// Style grids: the same moves as the text, for the indices beside it
// =========================================================================

export type StyleGrid = number[][];

export function styleBlock(grid: StyleGrid, rect: Rect): StyleGrid {
	const block: StyleGrid = [];
	for (let r = rect.top; r <= rect.bottom; r++) {
		const line: number[] = [];
		for (let c = rect.left; c <= rect.right; c++) {
			line.push(grid[r]?.[c] ?? 0);
		}
		block.push(line);
	}
	return block;
}

/** `block` written at `top`, `left`; only the rows it touches are copied. */
export function writeStyles(
	grid: StyleGrid,
	top: number,
	left: number,
	block: StyleGrid,
): StyleGrid {
	const next = grid.slice();
	while (next.length < top + block.length) {
		next.push([]);
	}
	block.forEach((values, offset) => {
		const row = (next[top + offset] ?? []).slice();
		while (row.length < left + values.length) {
			row.push(0);
		}
		row.splice(left, values.length, ...values);
		next[top + offset] = row;
	});
	return next;
}

/** Each cell of `rect` given `pick(current, row, col)`. */
export function mapStyles(
	grid: StyleGrid,
	rect: Rect,
	pick: (current: number, row: number, col: number) => number,
): StyleGrid {
	const block = styleBlock(grid, rect).map((line, r) =>
		line.map((id, c) => pick(id, rect.top + r, rect.left + c)),
	);
	return writeStyles(grid, rect.top, rect.left, block);
}

/** `block` repeated over `rect` when it fits a whole number of times. */
export function tileStyles(block: StyleGrid, rect: Rect): StyleGrid {
	const height = block.length;
	const width = block[0]?.length ?? 1;
	const rectHeight = rect.bottom - rect.top + 1;
	const rectWidth = rect.right - rect.left + 1;
	if (rectHeight % height !== 0 || rectWidth % width !== 0) {
		return block;
	}
	return Array.from({ length: rectHeight }, (_, r) =>
		Array.from(
			{ length: rectWidth },
			(_, c) => block[r % height]?.[c % width] ?? 0,
		),
	);
}

/** Fill down or right, as `fill` in `book.ts` does for the text. */
export function fillStyles(
	grid: StyleGrid,
	rect: Rect,
	direction: "down" | "right",
): StyleGrid {
	const down = direction === "down";
	const source = { ...rect };
	if (down && rect.top === rect.bottom) {
		source.top = rect.top - 1;
	} else if (!down && rect.left === rect.right) {
		source.left = rect.left - 1;
	}
	if (source.top < 0 || source.left < 0) {
		return grid;
	}
	const block: StyleGrid = [];
	for (let r = source.top; r <= rect.bottom; r++) {
		const line: number[] = [];
		for (let c = source.left; c <= rect.right; c++) {
			line.push((down ? grid[source.top]?.[c] : grid[r]?.[source.left]) ?? 0);
		}
		block.push(line);
	}
	return writeStyles(grid, source.top, source.left, block);
}

/** Rows or columns inserted (`count` > 0) or deleted, unformatted. */
export function moveStyleLines(
	grid: StyleGrid,
	axis: "row" | "col",
	at: number,
	count: number,
): StyleGrid {
	if (axis === "row") {
		if (at >= grid.length) {
			return grid;
		}
		const next = grid.slice();
		if (count > 0) {
			next.splice(at, 0, ...Array.from({ length: count }, () => []));
		} else {
			next.splice(at, -count);
		}
		return next;
	}
	return grid.map((row) => {
		if (row.length <= at) {
			return row;
		}
		const next = row.slice();
		if (count > 0) {
			next.splice(at, 0, ...Array.from({ length: count }, () => 0));
		} else {
			next.splice(at, -count);
		}
		return next;
	});
}

/** A grid as it travels: trailing zeros and empty trailing rows dropped. */
export function compactStyles(grid: StyleGrid): StyleGrid {
	const rows = grid.map((row) => {
		let end = row.length;
		while (end > 0 && !row[end - 1]) {
			end--;
		}
		return end === row.length ? row : row.slice(0, end);
	});
	let height = rows.length;
	while (height > 0 && (rows[height - 1]?.length ?? 0) === 0) {
		height--;
	}
	return rows.slice(0, height);
}

/** Whether a value crossing the network is a grid of style indices. */
export function isStyleGrid(value: unknown): value is StyleGrid {
	return (
		Array.isArray(value) &&
		value.every(
			(row) =>
				Array.isArray(row) &&
				row.every((cell) => Number.isSafeInteger(cell) && cell >= 0),
		)
	);
}

/** A sheet's formatting after rows or columns moved. */
export function moveFormats(
	sheet: { styleIds?: StyleGrid; merges?: string[] },
	change: { axis: "row" | "col"; at: number; count: number },
): { styleIds?: StyleGrid; merges?: string[] } {
	const { axis, at, count } = change;
	return {
		...(sheet.styleIds
			? { styleIds: moveStyleLines(sheet.styleIds, axis, at, count) }
			: {}),
		...(sheet.merges
			? { merges: moveMerges(sheet.merges, axis, at, count) }
			: {}),
	};
}

/** One sheet of a book changed by `patch`, every other field kept. */
export function patchSheet<B extends { sheets: object[] }>(
	book: B,
	index: number,
	patch: Partial<B["sheets"][number]>,
): B {
	return {
		...book,
		sheets: book.sheets.map((sheet, i) =>
			i === index ? { ...sheet, ...patch } : sheet,
		),
	};
}

/** The editor's style table from a workbook's JSON; entry 0 always exists. */
export function styleTableFrom(content: string): CellStyle[] {
	try {
		const styles = (JSON.parse(content) as { styles?: unknown }).styles;
		if (Array.isArray(styles) && styles.length > 0) {
			return styles.map((style) => normalizeStyle(style));
		}
	} catch {
		// A CSV, or a workbook from before styles: no table.
	}
	return [{}];
}
