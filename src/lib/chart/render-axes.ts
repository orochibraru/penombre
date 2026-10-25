import {
	type Box,
	cut,
	formatter,
	type Frame,
	LABEL_SIZE,
	r1,
	type Scale,
	scaleOf,
	seriesColor,
	textWidth,
	tip,
} from "./canvas";
import type { ChartData } from "./data";
import type { Chart } from "./model";

/** Charts drawn on axes: column, bar, line, area and scatter. */

interface Stack {
	low: number;
	high: number;
}

/** Where everything on the axes goes, once measured. */
interface Axes {
	plot: Box;
	horizontal: boolean;
	scale: Scale;
	/** A value's position along the value axis. */
	at: (value: number) => number;
	format: (n: number) => string;
	plain: (n: number) => string;
	labelWidth: number;
}

/** Each point's bottom and top once series are stacked (or not). */
export function stacks(chart: Chart, data: ChartData): (Stack | null)[][] {
	const grouping = chart.grouping ?? "clustered";
	const count = data.categories.length;
	if (grouping === "clustered") {
		return data.series.map((s) =>
			Array.from({ length: count }, (_, i) => {
				const v = s.values[i];
				return v === null || v === undefined
					? null
					: { low: Math.min(0, v), high: Math.max(0, v) };
			}),
		);
	}
	const totals = Array.from({ length: count }, (_, i) =>
		data.series.reduce((sum, s) => sum + Math.abs(s.values[i] ?? 0), 0),
	);
	const up = Array.from({ length: count }, () => 0);
	const down = Array.from({ length: count }, () => 0);
	return data.series.map((s) =>
		Array.from({ length: count }, (_, i) => {
			const raw = s.values[i];
			if (raw === null || raw === undefined) {
				return null;
			}
			const total = totals[i] ?? 0;
			const v =
				grouping === "percent" ? (total ? (raw / total) * 100 : 0) : raw;
			if (v >= 0) {
				const low = up[i] ?? 0;
				up[i] = low + v;
				return { low, high: low + v };
			}
			const high = down[i] ?? 0;
			down[i] = high + v;
			return { low: high + v, high };
		}),
	);
}

function extent(values: Iterable<number>): { low: number; high: number } {
	let low = Number.POSITIVE_INFINITY;
	let high = Number.NEGATIVE_INFINITY;
	for (const v of values) {
		low = Math.min(low, v);
		high = Math.max(high, v);
	}
	return Number.isFinite(low) ? { low, high } : { low: 0, high: 1 };
}

function* stackEnds(piles: (Stack | null)[][]) {
	for (const pile of piles) {
		for (const p of pile) {
			if (p) {
				yield p.low;
				yield p.high;
			}
		}
	}
}

function* present(lists: (number | null)[][]) {
	for (const list of lists) {
		for (const v of list) {
			if (v !== null) {
				yield v;
			}
		}
	}
}

/** The plot area once axis titles and tick labels have their room. */
function measure(frame: Frame, area: Box, labels: string[]) {
	const { chart } = frame;
	const horizontal = chart.type === "bar";
	const box = { ...area };
	const titled = (title: string | undefined, across: boolean) => {
		if (!title) {
			return;
		}
		if (across) {
			box.h -= 18;
		} else {
			box.x += 18;
			box.w -= 18;
		}
	};
	titled(chart.y.title, horizontal);
	titled(chart.x.title, !horizontal);
	const labelWidth = Math.min(
		box.w * 0.35,
		labels.reduce((n, l) => Math.max(n, textWidth(l, LABEL_SIZE)), 0) + 8,
	);
	return {
		plot: {
			x: box.x + labelWidth,
			y: box.y + 6,
			w: box.w - labelWidth - 8,
			h: box.h - 6 - 18,
		},
		labelWidth,
	};
}

function valueAxis(frame: Frame, axes: Axes): void {
	const { canvas, chart } = frame;
	const { plot, horizontal } = axes;
	const grid = chart.y.gridlines === true;
	for (const t of axes.scale.ticks) {
		const p = axes.at(t);
		const label = axes.format(t);
		if (horizontal) {
			if (grid) {
				canvas.line(
					{ x: p, y: plot.y },
					{ x: p, y: plot.y + plot.h },
					canvas.theme.grid,
				);
			}
			canvas.text({ x: p, y: plot.y + plot.h + 10 }, label, {
				anchor: "middle",
			});
		} else {
			if (grid) {
				canvas.line(
					{ x: plot.x, y: p },
					{ x: plot.x + plot.w, y: p },
					canvas.theme.grid,
				);
			}
			canvas.text({ x: plot.x - 6, y: p }, label, { anchor: "end" });
		}
	}
}

function axisTitles(frame: Frame, area: Box, axes: Axes): void {
	const { canvas, chart } = frame;
	const { plot } = axes;
	const color = canvas.theme.text;
	const below = { x: plot.x + plot.w / 2, y: area.y + area.h - 6 };
	const beside = { x: area.x + 6, y: plot.y + plot.h / 2 };
	const [bottom, side] = axes.horizontal
		? [chart.y.title, chart.x.title]
		: [chart.x.title, chart.y.title];
	if (bottom) {
		canvas.text(below, bottom, { anchor: "middle", color });
	}
	if (side) {
		canvas.text(beside, side, { anchor: "middle", color, rotate: -90 });
	}
}

/** Bands along the category axis, one per category. */
function bands(frame: Frame, axes: Axes) {
	const { plot, horizontal } = axes;
	const count = Math.max(1, frame.data.categories.length);
	const band = (horizontal ? plot.h : plot.w) / count;
	const start = (i: number) => (horizontal ? plot.y : plot.x) + i * band;
	return { band, start, center: (i: number) => start(i) + band / 2 };
}

function categoryAxis(frame: Frame, axes: Axes): void {
	const { canvas, data } = frame;
	const { plot, horizontal } = axes;
	const { band, center } = bands(frame, axes);
	const widest = data.categories.reduce(
		(n, l) => Math.max(n, textWidth(l, LABEL_SIZE)),
		0,
	);
	// Thinned out when they would collide.
	const every = horizontal
		? Math.max(1, Math.ceil(16 / band))
		: Math.max(1, Math.ceil((Math.min(widest, 120) + 6) / Math.max(1, band)));
	data.categories.forEach((label, i) => {
		if (i % every !== 0) {
			return;
		}
		if (horizontal) {
			canvas.text(
				{ x: plot.x - 6, y: center(i) },
				cut(label, axes.labelWidth - 8),
				{
					anchor: "end",
				},
			);
		} else {
			canvas.text(
				{ x: center(i), y: plot.y + plot.h + 10 },
				cut(label, band * every - 4),
				{
					anchor: "middle",
				},
			);
		}
	});
	const zero = axes.at(Math.max(axes.scale.min, Math.min(axes.scale.max, 0)));
	const color = canvas.theme.axis;
	if (horizontal) {
		canvas.line({ x: zero, y: plot.y }, { x: zero, y: plot.y + plot.h }, color);
	} else {
		canvas.line({ x: plot.x, y: zero }, { x: plot.x + plot.w, y: zero }, color);
	}
}

function bars(frame: Frame, axes: Axes, piles: (Stack | null)[][]): void {
	const { canvas, chart, data } = frame;
	const { horizontal } = axes;
	const { band, start } = bands(frame, axes);
	const clamp = (v: number) =>
		Math.max(axes.scale.min, Math.min(axes.scale.max, v));
	const clustered = (chart.grouping ?? "clustered") === "clustered";
	const groups = clustered ? Math.max(1, data.series.length) : 1;
	const inner = band * 0.7;
	const width = inner / groups;
	const thick = Math.max(1, width - (groups > 1 ? 1 : 0));
	data.series.forEach((series, s) => {
		const color = seriesColor(series.color, s, canvas.theme);
		piles[s]?.forEach((pile, i) => {
			if (!pile) {
				return;
			}
			const offset =
				start(i) + (band - inner) / 2 + (groups > 1 ? s * width : 0);
			const a = axes.at(clamp(pile.low));
			const b = axes.at(clamp(pile.high));
			const value = series.values[i] ?? 0;
			const rect = horizontal
				? { x: Math.min(a, b), y: offset, w: Math.abs(b - a), h: thick }
				: { x: offset, y: Math.min(a, b), w: thick, h: Math.abs(b - a) };
			canvas.push(
				`<rect x="${r1(rect.x)}" y="${r1(rect.y)}" width="${r1(rect.w)}" height="${r1(rect.h)}" style="fill:${color}"${tip(`${series.name} · ${data.categories[i] ?? ""}: ${axes.plain(value)}`)}/>`,
			);
			if (chart.labels) {
				const text = axes.format(
					chart.grouping === "percent" ? pile.high - pile.low : value,
				);
				const at = horizontal
					? { x: rect.x + rect.w + 3, y: rect.y + rect.h / 2 }
					: { x: rect.x + rect.w / 2, y: rect.y - 6 };
				canvas.text(at, text, {
					size: 10,
					anchor: horizontal ? "start" : "middle",
					color: canvas.theme.text,
				});
			}
		});
	});
}

interface Spot {
	x: number;
	y: number;
	base: number;
	i: number;
}

/** A series' points split where values are missing: gaps break the line. */
function runs(points: (Spot | null)[]): Spot[][] {
	const out: Spot[][] = [[]];
	for (const p of points) {
		if (p) {
			out.at(-1)?.push(p);
		} else if ((out.at(-1)?.length ?? 0) > 0) {
			out.push([]);
		}
	}
	return out.filter((run) => run.length > 0);
}

function lines(frame: Frame, axes: Axes, piles: (Stack | null)[][]): void {
	const { canvas, chart, data } = frame;
	const { center } = bands(frame, axes);
	const clamp = (v: number) =>
		Math.max(axes.scale.min, Math.min(axes.scale.max, v));
	const stacked = (chart.grouping ?? "clustered") !== "clustered";
	data.series.forEach((series, s) => {
		const color = seriesColor(series.color, s, canvas.theme);
		const points = (piles[s] ?? []).map((pile, i): Spot | null =>
			pile
				? {
						x: center(i),
						y: axes.at(clamp(stacked ? pile.high : (series.values[i] ?? 0))),
						base: axes.at(clamp(stacked ? pile.low : 0)),
						i,
					}
				: null,
		);
		for (const run of runs(points)) {
			const path = run
				.map((p, k) => `${k === 0 ? "M" : "L"} ${r1(p.x)} ${r1(p.y)}`)
				.join(" ");
			if (chart.type === "area") {
				const back = [...run]
					.reverse()
					.map((p) => `L ${r1(p.x)} ${r1(p.base)}`);
				canvas.push(
					`<path d="${path} ${back.join(" ")} Z" style="fill:${color};fill-opacity:0.35;stroke:none"/>`,
				);
			}
			canvas.push(
				`<path d="${path}" style="fill:none;stroke:${color};stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>`,
			);
		}
		// A lone point draws no line, so it needs its dot to be seen at all.
		const lone = points.filter(Boolean).length === 1;
		for (const p of points) {
			if (!p) {
				continue;
			}
			const value = series.values[p.i] ?? 0;
			const shown = chart.markers || lone;
			canvas.push(
				`<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${shown ? 3.5 : 8}" style="fill:${shown ? color : "transparent"}"${tip(`${series.name} · ${data.categories[p.i] ?? ""}: ${axes.plain(value)}`)}/>`,
			);
			if (chart.labels) {
				canvas.text({ x: p.x, y: p.y - 9 }, axes.format(value), {
					size: 10,
					anchor: "middle",
					color: canvas.theme.text,
				});
			}
		}
	});
}

function scatterMarks(frame: Frame, axes: Axes, xs: Scale): void {
	const { canvas, chart, data } = frame;
	const { plot } = axes;
	const xAt = (v: number) =>
		plot.x + ((v - xs.min) / (xs.max - xs.min)) * plot.w;
	for (const t of xs.ticks) {
		if (chart.x.gridlines) {
			canvas.line(
				{ x: xAt(t), y: plot.y },
				{ x: xAt(t), y: plot.y + plot.h },
				canvas.theme.grid,
			);
		}
		canvas.text({ x: xAt(t), y: plot.y + plot.h + 10 }, axes.plain(t), {
			anchor: "middle",
		});
	}
	canvas.line(
		{ x: plot.x, y: plot.y + plot.h },
		{ x: plot.x + plot.w, y: plot.y + plot.h },
		canvas.theme.axis,
	);
	data.series.forEach((series, s) => {
		const color = seriesColor(series.color, s, canvas.theme);
		series.values.forEach((y, i) => {
			const x = series.xs?.[i];
			if (y === null || x === null || x === undefined) {
				return;
			}
			const top = axes.at(y);
			if (x < xs.min || x > xs.max || top < plot.y || top > plot.y + plot.h) {
				return;
			}
			canvas.push(
				`<circle cx="${r1(xAt(x))}" cy="${r1(top)}" r="4" style="fill:${color}"${tip(`${series.name}: (${axes.plain(x)}, ${axes.plain(y)})`)}/>`,
			);
			if (chart.labels) {
				canvas.text({ x: xAt(x), y: top - 9 }, axes.plain(y), {
					size: 10,
					anchor: "middle",
					color: canvas.theme.text,
				});
			}
		});
	});
}

export function axesChart(frame: Frame, area: Box): void {
	const { chart, data, options } = frame;
	const horizontal = chart.type === "bar";
	const scatter = chart.type === "scatter";
	const format = formatter(
		options.locale,
		chart.grouping === "percent" && !scatter,
	);
	const plain = formatter(options.locale, false);
	const piles = scatter ? [] : stacks(chart, data);
	const range = scatter
		? extent(present(data.series.map((s) => s.values)))
		: extent(stackEnds(piles));
	const scale = scaleOf(
		range,
		chart.y,
		Math.max(2, Math.round((horizontal ? area.w : area.h) / 50)),
	);
	const xs = scatter
		? scaleOf(
				extent(present(data.series.map((s) => s.xs ?? []))),
				chart.x,
				Math.max(2, Math.round(area.w / 80)),
			)
		: null;
	const valueLabels = scale.ticks.map(format);
	const { plot, labelWidth } = measure(
		frame,
		area,
		horizontal ? data.categories : valueLabels,
	);
	if (plot.w < 10 || plot.h < 10) {
		return;
	}
	const at = (v: number) => {
		const t = (v - scale.min) / (scale.max - scale.min);
		return horizontal ? plot.x + t * plot.w : plot.y + plot.h - t * plot.h;
	};
	const axes: Axes = { plot, horizontal, scale, at, format, plain, labelWidth };
	valueAxis(frame, axes);
	axisTitles(frame, area, axes);
	if (xs) {
		scatterMarks(frame, axes, xs);
		return;
	}
	categoryAxis(frame, axes);
	if (chart.type === "column" || chart.type === "bar") {
		bars(frame, axes, piles);
	} else {
		lines(frame, axes, piles);
	}
}
