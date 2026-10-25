import {
	type Box,
	Canvas,
	type ChartTheme,
	cut,
	esc,
	formatter,
	type Frame,
	LABEL_SIZE,
	r1,
	type RenderOptions,
	seriesColor,
	textWidth,
	tip,
} from "./canvas";
import type { ChartData } from "./data";
import type { Chart, LegendPosition } from "./model";
import { axesChart } from "./render-axes";

export type { ChartTheme, RenderOptions } from "./canvas";

/**
 * A chart drawn as an SVG string. Pure and DOM-free, so the sheet editor
 * shows it inline (inline SVG takes the page's colours, which is what lets
 * axes and labels follow the theme), the PDF export embeds it, and the
 * slides editor can draw a pptx chart with it later.
 *
 * Every colour goes into a `style` attribute: `var(--…)` is reliable there
 * and not in presentation attributes, and the PDF's SVG reader parses both.
 * Text is estimated, not measured.
 */

/** The categorical slots, light and dark; `chart-view.svelte` has them as CSS. */
export const CATEGORICAL = {
	light: [
		"#2a78d6",
		"#eb6834",
		"#1baf7a",
		"#eda100",
		"#e87ba4",
		"#008300",
		"#6250d6",
		"#e34948",
	],
	dark: [
		"#3987e5",
		"#d95926",
		"#199e70",
		"#c98500",
		"#d55181",
		"#008300",
		"#9085e9",
		"#e66767",
	],
};

/** In the app: tokens, the accent first. */
export const APP_THEME: ChartTheme = {
	text: "var(--foreground)",
	muted: "var(--muted-foreground)",
	grid: "var(--border)",
	axis: "var(--muted-foreground)",
	background: "none",
	font: "inherit",
	palette: [
		"var(--primary)",
		...CATEGORICAL.light.map((_, i) => `var(--chart-${i + 1})`),
	],
};

/** On paper: plain colours, which is all a PDF knows. */
export const PRINT_THEME: ChartTheme = {
	text: "rgb(32, 33, 36)",
	muted: "rgb(95, 99, 104)",
	grid: "rgb(218, 220, 224)",
	axis: "rgb(95, 99, 104)",
	background: "rgb(255, 255, 255)",
	font: "Roboto",
	palette: CATEGORICAL.light,
};

const TITLE_SIZE = 14;
const PAD = 10;
const SWATCH = 10;
const GAP = 6;
const ROW = 18;

interface Entry {
	label: string;
	color: string;
}

function swatch(
	canvas: Canvas,
	at: { x: number; y: number },
	entry: Entry,
	width: number,
) {
	canvas.push(
		`<rect x="${r1(at.x)}" y="${r1(at.y - SWATCH / 2)}" width="${SWATCH}" height="${SWATCH}" rx="2" style="fill:${entry.color}"/>`,
	);
	canvas.text(
		{ x: at.x + SWATCH + GAP, y: at.y },
		cut(entry.label, width - SWATCH - GAP),
		{
			color: canvas.theme.text,
		},
	);
}

/** A legend above or below the plot, wrapping; returns what is left. */
function rowLegend(
	canvas: Canvas,
	entries: Entry[],
	top: boolean,
	box: Box,
): Box {
	const widths = entries.map(
		(e) => SWATCH + GAP + textWidth(e.label, LABEL_SIZE) + 14,
	);
	const total = widths.reduce((a, b) => a + b, 0);
	const height = Math.max(1, Math.ceil(total / Math.max(1, box.w))) * ROW;
	let x = box.x + Math.max(0, (box.w - Math.min(total, box.w)) / 2);
	let y = (top ? box.y : box.y + box.h - height) + ROW / 2;
	entries.forEach((entry, i) => {
		const w = widths[i] ?? 0;
		if (x + w > box.x + box.w && x > box.x) {
			x = box.x;
			y += ROW;
		}
		swatch(canvas, { x, y }, entry, box.w);
		x += w;
	});
	return {
		x: box.x,
		y: top ? box.y + height + 4 : box.y,
		w: box.w,
		h: box.h - height - 4,
	};
}

/** Draws the legend and returns the box left for the plot. */
function legend(
	canvas: Canvas,
	entries: Entry[],
	position: LegendPosition,
	box: Box,
): Box {
	if (position === "none" || entries.length === 0) {
		return box;
	}
	if (position === "t" || position === "b") {
		return rowLegend(canvas, entries, position === "t", box);
	}
	const widest = entries.reduce(
		(n, e) => Math.max(n, textWidth(e.label, LABEL_SIZE)),
		0,
	);
	const width = Math.min(box.w * 0.4, SWATCH + GAP + widest + 4);
	const shown = entries.slice(0, Math.max(1, Math.floor(box.h / ROW)));
	const x = position === "r" ? box.x + box.w - width : box.x;
	let y = box.y + Math.max(ROW / 2, (box.h - shown.length * ROW) / 2 + ROW / 2);
	for (const entry of shown) {
		swatch(canvas, { x, y }, entry, width);
		y += ROW;
	}
	return {
		x: position === "r" ? box.x : box.x + width + 12,
		y: box.y,
		w: box.w - width - 12,
		h: box.h,
	};
}

const pointColor = (data: ChartData, index: number, theme: ChartTheme) =>
	seriesColor(data.series[0]?.points?.[index], index, theme);

function slicePath(
	center: { x: number; y: number },
	radius: number,
	hole: number,
	angles: [number, number],
): string {
	const [from, to] = angles;
	const at = (a: number, r: number) =>
		`${r1(center.x + r * Math.cos(a))} ${r1(center.y + r * Math.sin(a))}`;
	const arc = (r: number) => `${r1(r)} ${r1(r)}`;
	if (to - from >= Math.PI * 2 - 1e-9) {
		const ring = (r: number, sweep: number) =>
			`M ${at(from, r)} A ${arc(r)} 0 1 ${sweep} ${at(from + Math.PI, r)} A ${arc(r)} 0 1 ${sweep} ${at(from, r)} Z`;
		return hole > 0 ? `${ring(radius, 1)} ${ring(hole, 0)}` : ring(radius, 1);
	}
	const large = to - from > Math.PI ? 1 : 0;
	return hole > 0
		? `M ${at(from, radius)} A ${arc(radius)} 0 ${large} 1 ${at(to, radius)} L ${at(to, hole)} A ${arc(hole)} 0 ${large} 0 ${at(from, hole)} Z`
		: `M ${r1(center.x)} ${r1(center.y)} L ${at(from, radius)} A ${arc(radius)} 0 ${large} 1 ${at(to, radius)} Z`;
}

function pie(frame: Frame, box: Box): void {
	const { canvas, chart, data } = frame;
	const values = (data.series[0]?.values ?? []).map((v) =>
		v !== null && v > 0 ? v : 0,
	);
	const total = values.reduce((a, b) => a + b, 0);
	const radius = Math.max(4, Math.min(box.w, box.h) / 2 - 4);
	const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
	const hole = chart.type === "doughnut" ? radius * 0.5 : 0;
	const format = formatter(frame.options.locale, false);
	if (total <= 0) {
		canvas.push(
			`<circle cx="${r1(center.x)}" cy="${r1(center.y)}" r="${r1(radius)}" style="fill:none;stroke:${canvas.theme.grid}"/>`,
		);
		return;
	}
	const edge =
		canvas.theme.background === "none"
			? "var(--background, #fff)"
			: canvas.theme.background;
	let angle = -Math.PI / 2;
	values.forEach((value, i) => {
		if (value <= 0) {
			return;
		}
		const sweep = (value / total) * Math.PI * 2;
		const label = `${data.categories[i] ?? ""}: ${format(value)} (${Math.round((value / total) * 100)}%)`;
		canvas.push(
			`<path d="${slicePath(center, radius, hole, [angle, angle + sweep])}" fill-rule="evenodd" style="fill:${pointColor(data, i, canvas.theme)};stroke:${edge};stroke-width:1.5"${tip(label)}/>`,
		);
		if (chart.labels && sweep > 0.25) {
			const mid = angle + sweep / 2;
			const r = hole > 0 ? (radius + hole) / 2 : radius * 0.65;
			canvas.text(
				{ x: center.x + r * Math.cos(mid), y: center.y + r * Math.sin(mid) },
				format(value),
				{ anchor: "middle", color: "#ffffff", size: 10 },
			);
		}
		angle += sweep;
	});
}

function entriesOf(frame: Frame, round: boolean): Entry[] {
	const { data, canvas } = frame;
	return round
		? data.categories.map((label, i) => ({
				label,
				color: pointColor(data, i, canvas.theme),
			}))
		: data.series.map((s, i) => ({
				label: s.name,
				color: seriesColor(s.color, i, canvas.theme),
			}));
}

export function renderChart(
	chart: Chart,
	data: ChartData,
	options: RenderOptions,
): string {
	const { width, height, theme } = options;
	const canvas = new Canvas(theme);
	const frame: Frame = { canvas, chart, data, options };
	if (theme.background !== "none") {
		canvas.push(
			`<rect width="${width}" height="${height}" style="fill:${theme.background}"/>`,
		);
	}
	let box: Box = { x: PAD, y: PAD, w: width - 2 * PAD, h: height - 2 * PAD };
	if (chart.title) {
		canvas.text(
			{ x: width / 2, y: PAD + TITLE_SIZE / 2 },
			cut(chart.title, box.w, TITLE_SIZE),
			{
				size: TITLE_SIZE,
				anchor: "middle",
				color: theme.text,
				weight: 600,
			},
		);
		box = { ...box, y: box.y + TITLE_SIZE + 10, h: box.h - TITLE_SIZE - 10 };
	}
	if (options.note) {
		canvas.text(
			{ x: width - PAD, y: height - PAD / 2 - 2 },
			cut(options.note, box.w, 10),
			{
				size: 10,
				anchor: "end",
			},
		);
		box = { ...box, h: box.h - 12 };
	}
	if (!data.series.some((s) => s.values.length > 0)) {
		canvas.text({ x: width / 2, y: box.y + box.h / 2 }, options.empty ?? "", {
			anchor: "middle",
		});
	} else {
		const round = chart.type === "pie" || chart.type === "doughnut";
		// One series is named by the title; a legend would only repeat it.
		const position =
			!round && data.series.length < 2 && chart.title ? "none" : chart.legend;
		const area = legend(canvas, entriesOf(frame, round), position, box);
		if (round) {
			pie(frame, area);
		} else {
			axesChart(frame, area);
		}
	}
	const label = chart.title ? ` aria-label="${esc(chart.title)}"` : "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(width)} ${r1(height)}" width="${r1(width)}" height="${r1(height)}" font-family="${esc(theme.font)}" role="img"${label}>${canvas.parts.join("")}</svg>`;
}
