import type { ChartData } from "./data";
import type { Chart } from "./model";

/** The drawing primitives the renderers share: an SVG string being built. */

export interface ChartTheme {
	text: string;
	muted: string;
	grid: string;
	axis: string;
	/** Behind the chart; `none` lets the page show through. */
	background: string;
	font: string;
	/** Automatic series colours, in order. */
	palette: string[];
}

export interface RenderOptions {
	width: number;
	height: number;
	theme: ChartTheme;
	/** Shown when there is nothing to plot. */
	empty?: string;
	/** Written over a chart that is only partly understood. */
	note?: string;
	locale?: string;
}

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface TextOptions {
	size?: number;
	anchor?: "start" | "middle" | "end";
	color?: string;
	weight?: number;
	rotate?: number;
}

export const LABEL_SIZE = 11;
export const HEX = /^#[0-9a-f]{6}$/i;

export const esc = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

export const r1 = (n: number): number => Math.round(n * 10) / 10;

export const textWidth = (text: string, size: number): number =>
	text.length * size * 0.56;

export function cut(text: string, width: number, size = LABEL_SIZE): string {
	if (textWidth(text, size) <= width) {
		return text;
	}
	const fit = Math.max(1, Math.floor(width / (size * 0.56)) - 1);
	return `${text.slice(0, fit)}…`;
}

/** A tooltip's text, read by the view under the pointer. */
export const tip = (text: string): string => ` data-tip="${esc(text)}"`;

export class Canvas {
	readonly parts: string[] = [];
	constructor(readonly theme: ChartTheme) {}

	text(at: Point, value: string, options: TextOptions = {}): void {
		const size = options.size ?? LABEL_SIZE;
		const rotate = options.rotate
			? ` transform="rotate(${options.rotate} ${r1(at.x)} ${r1(at.y)})"`
			: "";
		const weight = options.weight ? ` font-weight="${options.weight}"` : "";
		this.parts.push(
			`<text x="${r1(at.x)}" y="${r1(at.y)}" text-anchor="${options.anchor ?? "start"}" dominant-baseline="middle" font-size="${size}"${weight}${rotate} style="fill:${options.color ?? this.theme.muted}">${esc(value)}</text>`,
		);
	}

	line(from: Point, to: Point, color: string): void {
		this.parts.push(
			`<line x1="${r1(from.x)}" y1="${r1(from.y)}" x2="${r1(to.x)}" y2="${r1(to.y)}" style="stroke:${color};stroke-width:1"/>`,
		);
	}

	push(markup: string): void {
		this.parts.push(markup);
	}
}

/** One chart being drawn: what every renderer below takes first. */
export interface Frame {
	canvas: Canvas;
	chart: Chart;
	data: ChartData;
	options: RenderOptions;
}

/** A data colour from the file, or the palette's next one. */
export function seriesColor(
	color: string | null | undefined,
	index: number,
	theme: ChartTheme,
): string {
	if (color && HEX.test(color)) {
		return color;
	}
	return theme.palette[index % theme.palette.length] ?? "currentColor";
}

export function formatter(
	locale: string | undefined,
	percent: boolean,
): (n: number) => string {
	const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
	const compact = new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: 1,
	});
	return (n: number) => {
		if (percent) {
			return `${plain.format(n)}%`;
		}
		return Math.abs(n) >= 100_000 ? compact.format(n) : plain.format(n);
	};
}

// =========================================================================
// Scales
// =========================================================================

export interface Scale {
	min: number;
	max: number;
	ticks: number[];
}

function niceStep(span: number, count: number): number {
	const raw = span / Math.max(1, count);
	const power = 10 ** Math.floor(Math.log10(raw));
	const unit = raw / power;
	const steps = [1, 2, 2.5, 5, 10];
	return (steps.find((step) => unit <= step) ?? 10) * power;
}

/** Round ticks over `low`…`high`, zero included, fixed ends honoured. */
export function scaleOf(
	range: { low: number; high: number },
	fixed: { min?: number; max?: number },
	count: number,
): Scale {
	let min = fixed.min ?? Math.min(0, range.low);
	let max = fixed.max ?? Math.max(0, range.high);
	if (!(Number.isFinite(min) && Number.isFinite(max))) {
		min = 0;
		max = 1;
	}
	if (max <= min) {
		max = min + 1;
	}
	const step = niceStep(max - min, count);
	if (fixed.min === undefined) {
		min = Math.floor(min / step) * step;
	}
	if (fixed.max === undefined) {
		max = Math.ceil(max / step) * step;
	}
	const ticks: number[] = [];
	for (let t = Math.ceil(min / step) * step; t <= max + step / 1e6; t += step) {
		ticks.push(Math.abs(t) < step / 1e6 ? 0 : t);
		if (ticks.length > 50) {
			break;
		}
	}
	return { min, max, ticks };
}
