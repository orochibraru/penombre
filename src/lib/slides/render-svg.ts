import { cssColor, type Palette, paletteOf } from "./color";
import { arrowHead, isLine, outlines } from "./geometry";
import {
	type Deck,
	EMU_PER_PT,
	type Fill,
	type ImageElement,
	type Line,
	layoutOf,
	masterOf,
	type RawElement,
	type ShapeElement,
	type Slide,
	type SlideElement,
	type TextBody,
	type Theme,
} from "./model";
import {
	bulletFont,
	bulletLabels,
	effectiveParagraph,
	effectiveRun,
	fontStack,
	textWidth,
	typeface,
} from "./text";

/**
 * A slide as a standalone SVG string: the PDF export's page and anything
 * else that needs a picture of a slide without a browser. Text is wrapped
 * here with approximate font metrics, since SVG has no line breaking.
 */

export interface SvgOptions {
	/** Output width in pixels; the height follows the slide's ratio. */
	width?: number;
	/** Turns an image `src` (a package part or a data URL) into an href. */
	image?: (src: string) => string | null;
}

const esc = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const u = (emu: number) => Math.round((emu / EMU_PER_PT) * 100) / 100;

interface Context {
	palette: Palette;
	theme: Theme;
	defs: string[];
	next: number;
	image: (src: string) => string | null;
}

function paint(fill: Fill, context: Context): string {
	if (fill.type === "none" || fill.type === "image") {
		return 'fill="none"';
	}
	if (fill.type === "solid") {
		return `fill="${cssColor(fill.color, context.palette)}"`;
	}
	const id = `g${context.next++}`;
	const stops = fill.stops
		.map(
			(stop) =>
				`<stop offset="${stop.pos / 1000}%" stop-color="${cssColor(stop.color, context.palette)}"/>`,
		)
		.join("");
	if (fill.radial) {
		context.defs.push(
			`<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`,
		);
	} else {
		const angle = (fill.angle * Math.PI) / 180;
		const [dx, dy] = [Math.cos(angle) / 2, Math.sin(angle) / 2];
		context.defs.push(
			`<linearGradient id="${id}" x1="${0.5 - dx}" y1="${0.5 - dy}" x2="${0.5 + dx}" y2="${0.5 + dy}">${stops}</linearGradient>`,
		);
	}
	return `fill="url(#${id})"`;
}

const DASHES: Record<string, number[]> = {
	dash: [4, 3],
	sysDash: [3, 1],
	dot: [1, 2],
	sysDot: [1, 1],
	lgDash: [8, 3],
	dashDot: [4, 3, 1, 3],
};

function strokeOf(line: Line | undefined, context: Context): string {
	if (!line || line.fill.type !== "solid" || line.width <= 0) {
		return 'stroke="none"';
	}
	const width = Math.max(0.25, u(line.width));
	const dash = line.dash ? DASHES[line.dash] : undefined;
	return [
		`stroke="${cssColor(line.fill.color, context.palette)}"`,
		`stroke-width="${width}"`,
		`stroke-linecap="${line.cap === "rnd" ? "round" : line.cap === "sq" ? "square" : "butt"}"`,
		'stroke-linejoin="round"',
		dash ? `stroke-dasharray="${dash.map((d) => d * width).join(" ")}"` : "",
	].join(" ");
}

function transform(element: SlideElement): string {
	const [w, h] = [u(element.w), u(element.h)];
	const [cx, cy] = [u(element.x) + w / 2, u(element.y) + h / 2];
	const parts: string[] = [];
	if (element.rot) {
		parts.push(`rotate(${element.rot} ${cx} ${cy})`);
	}
	if (element.flipH || element.flipV) {
		parts.push(
			`translate(${cx} ${cy}) scale(${element.flipH ? -1 : 1} ${element.flipV ? -1 : 1}) translate(${-cx} ${-cy})`,
		);
	}
	return parts.join(" ");
}

// =========================================================================
// Text
// =========================================================================

interface Piece {
	text: string;
	attrs: string;
	width: number;
	size: number;
}

interface TextLine {
	pieces: Piece[];
	width: number;
	height: number;
	indent: number;
	align: string;
	bullet?: Piece;
	gapBefore: number;
}

function pieceAttrs(
	run: ReturnType<typeof effectiveRun>,
	context: Context,
): string {
	return [
		`font-family="${esc(fontStack(run.font, context.theme))}"`,
		`font-size="${Math.round(run.size * 100) / 100}"`,
		run.bold ? 'font-weight="bold"' : "",
		run.italic ? 'font-style="italic"' : "",
		run.underline || run.strike
			? `text-decoration="${[run.underline ? "underline" : "", run.strike ? "line-through" : ""].join(" ").trim()}"`
			: "",
		`fill="${cssColor(run.color, context.palette)}"`,
	]
		.filter(Boolean)
		.join(" ");
}

/** Break a paragraph's runs into lines no wider than `width` points. */
function wrapParagraph(
	body: TextBody,
	index: number,
	context: Context,
	{ width, bullet }: { width: number; bullet: string | null },
): TextLine[] {
	const paragraph = body.paragraphs[index];
	if (!paragraph) {
		return [];
	}
	const style = effectiveParagraph(paragraph, body);
	const marL = u(style.marL ?? 0);
	const indent = u(style.indent ?? 0);
	const spacing =
		((style.lineSpacing ?? 100) / 100) * (1 - (body.lineReduction ?? 0));
	const lines: TextLine[] = [];
	const endRun = effectiveRun({ size: paragraph.endSize }, style, body);
	const fresh = (first: boolean): TextLine => ({
		pieces: [],
		width: 0,
		height: endRun.size * 1.2 * spacing,
		indent: first ? marL + indent : marL,
		align: style.align ?? "l",
		gapBefore: first ? (style.spaceBefore ?? 0) : 0,
	});
	let line = fresh(true);
	if (bullet) {
		const run = effectiveRun({}, style, body);
		const bulletRun = {
			...run,
			font:
				(style.bullet?.type === "char" && bulletFont(style.bullet.font)) ||
				run.font,
		};
		const color =
			style.bullet?.type === "char" && style.bullet.color
				? style.bullet.color
				: run.color;
		// PowerPoint hangs the bullet at marL + indent; the text starts at
		// marL, or just after the bullet when it would not fit there.
		const at = Math.max(0, marL + indent);
		const width = textWidth(
			`${bullet} `,
			typeface(bulletRun.font, context.theme),
			run.size,
		);
		line.bullet = {
			text: bullet,
			attrs: pieceAttrs(
				{ ...bulletRun, color, underline: false, strike: false },
				context,
			),
			width: at,
			size: run.size,
		};
		line.indent = Math.max(marL, at + width);
	}
	lines.push(line);
	for (const run of paragraph.runs) {
		const look = effectiveRun(run, style, body);
		const face = typeface(look.font, context.theme);
		const attrs = pieceAttrs(look, context);
		const text = look.caps === "all" ? run.text.toUpperCase() : run.text;
		for (const [n, segment] of text.split("\n").entries()) {
			if (n > 0) {
				line = fresh(false);
				lines.push(line);
			}
			for (const word of segment.match(/\S+\s*|\s+/g) ?? []) {
				const measured = textWidth(word, face, look.size, look.bold);
				const room = width - line.indent;
				if (
					line.pieces.length > 0 &&
					line.width + textWidth(word.trimEnd(), face, look.size, look.bold) >
						room
				) {
					line = fresh(false);
					lines.push(line);
				}
				line.pieces.push({
					text: word,
					attrs,
					width: measured,
					size: look.size,
				});
				line.width += measured;
				line.height = Math.max(line.height, look.size * 1.2 * spacing);
			}
		}
	}
	const last = lines.at(-1);
	if (last) {
		last.height += style.spaceAfter ?? 0;
	}
	return lines;
}

function renderText(element: ShapeElement, context: Context): string {
	const body = element.text;
	if (
		!body ||
		body.paragraphs.every((paragraph) =>
			paragraph.runs.every((run) => run.text === ""),
		)
	) {
		return "";
	}
	const [l, t, r, b] = body.inset.map(u) as [number, number, number, number];
	const width = Math.max(1, u(element.w) - l - r);
	const labels = bulletLabels(body);
	const lines = body.paragraphs.flatMap((_p, index) =>
		wrapParagraph(body, index, context, {
			width: body.wrap ? width : Number.POSITIVE_INFINITY,
			bullet: labels[index] ?? null,
		}),
	);
	const total = lines.reduce(
		(sum, line) => sum + line.gapBefore + line.height,
		0,
	);
	const inner = u(element.h) - t - b;
	let y =
		u(element.y) +
		t +
		(body.anchor === "b"
			? inner - total
			: body.anchor === "ctr"
				? (inner - total) / 2
				: 0);
	const left = u(element.x) + l;
	const out: string[] = [];
	for (const line of lines) {
		y += line.gapBefore;
		const baseline = y + line.height * 0.78;
		const room = width - line.indent;
		const trimmed =
			line.width -
			(line.pieces.at(-1)?.text.match(/\s+$/)
				? (line.pieces.at(-1)?.width ?? 0) * 0.15
				: 0);
		const x =
			left +
			line.indent +
			(line.align === "ctr"
				? (room - trimmed) / 2
				: line.align === "r"
					? room - trimmed
					: 0);
		if (line.bullet) {
			out.push(
				`<text x="${left + line.bullet.width}" y="${baseline}" ${line.bullet.attrs}>${esc(line.bullet.text)}</text>`,
			);
		}
		if (line.pieces.length > 0) {
			const spans = line.pieces
				.map((piece) => `<tspan ${piece.attrs}>${esc(piece.text)}</tspan>`)
				.join("");
			out.push(
				`<text x="${Math.round(x * 100) / 100}" y="${Math.round(baseline * 100) / 100}" xml:space="preserve">${spans}</text>`,
			);
		}
		y += line.height;
	}
	return out.join("");
}

// =========================================================================
// Elements
// =========================================================================

function renderShape(element: ShapeElement, context: Context): string {
	const [w, h] = [u(element.w), u(element.h)];
	const at = `translate(${u(element.x)} ${u(element.y)})`;
	const paths = outlines(element.geometry, w, h)
		.map(
			(outline) =>
				`<path d="${outline.d}" ${outline.fill ? paint(element.fill, context) : 'fill="none"'} ${outline.stroke ? strokeOf(element.line, context) : 'stroke="none"'}/>`,
		)
		.join("");
	let ends = "";
	if (isLine(element.geometry) && element.line.fill.type === "solid") {
		const color = cssColor(element.line.fill.color, context.palette);
		const width = u(element.line.width);
		if (element.line.tail && element.line.tail !== "none") {
			ends += `<path d="${arrowHead([w, h], [0, 0], width, element.line.tail)}" fill="${color}" stroke="${color}" stroke-width="${width / 2}"/>`;
		}
		if (element.line.head && element.line.head !== "none") {
			ends += `<path d="${arrowHead([0, 0], [w, h], width, element.line.head)}" fill="${color}" stroke="${color}" stroke-width="${width / 2}"/>`;
		}
	}
	return `<g transform="${transform(element)}"><g transform="${at}">${paths}${ends}</g></g>${element.text ? `<g transform="${element.rot ? `rotate(${element.rot} ${u(element.x) + w / 2} ${u(element.y) + h / 2})` : ""}">${renderText(element, context)}</g>` : ""}`;
}

function renderImage(element: ImageElement, context: Context): string {
	const href = context.image(element.src);
	const [x, y, w, h] = [u(element.x), u(element.y), u(element.w), u(element.h)];
	if (!href) {
		return `<g transform="${transform(element)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8883"/></g>`;
	}
	const crop = element.crop ?? { l: 0, t: 0, r: 0, b: 0 };
	const fullW = w / Math.max(0.01, 1 - (crop.l + crop.r) / 100_000);
	const fullH = h / Math.max(0.01, 1 - (crop.t + crop.b) / 100_000);
	const id = `c${context.next++}`;
	const clip = element.geometry
		? outlines(element.geometry, w, h)[0]?.d
		: undefined;
	context.defs.push(
		`<clipPath id="${id}">${clip ? `<path transform="translate(${x} ${y})" d="${clip}"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`}</clipPath>`,
	);
	return `<g transform="${transform(element)}"><g clip-path="url(#${id})"><image href="${esc(href)}" x="${x - (fullW * crop.l) / 100_000}" y="${y - (fullH * crop.t) / 100_000}" width="${fullW}" height="${fullH}" preserveAspectRatio="none"/></g>${element.line ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${strokeOf(element.line, context)}/>` : ""}</g>`;
}

function renderRaw(element: RawElement, context: Context): string {
	const [x, y, w, h] = [u(element.x), u(element.y), u(element.w), u(element.h)];
	const table = element.table;
	if (!table) {
		return "";
	}
	const ink = cssColor({ scheme: "tx1" }, context.palette);
	const out: string[] = [];
	let top = y;
	const total = table.columns.reduce((sum, c) => sum + c, 0) || 1;
	for (const row of table.rows) {
		const rowH = Math.max(u(row.h), 14);
		let left = x;
		row.cells.forEach((cell, index) => {
			const cw = (w * (table.columns[index] ?? 0)) / total;
			out.push(
				`<rect x="${left}" y="${top}" width="${cw}" height="${rowH}" fill="none" stroke="${ink}" stroke-opacity="0.3" stroke-width="0.75"/>`,
				`<text x="${left + 5}" y="${top + rowH / 2 + 4}" font-size="11" font-family="${esc(fontStack(undefined, context.theme))}" fill="${ink}">${esc(cell.text.slice(0, 80))}</text>`,
			);
			left += cw;
		});
		top += rowH;
	}
	return `<g transform="${transform(element)}"><svg x="${x}" y="${y}" width="${w}" height="${h}" overflow="hidden" viewBox="${x} ${y} ${w} ${h}">${out.join("")}</svg></g>`;
}

function renderElement(element: SlideElement, context: Context): string {
	switch (element.kind) {
		case "shape":
			return renderShape(element, context);
		case "image":
			return renderImage(element, context);
		case "group":
			return `<g transform="${transform(element)}">${element.children.map((child) => renderElement(child, context)).join("")}</g>`;
		default:
			return renderRaw(element, context);
	}
}

function isEmptyPlaceholder(element: SlideElement): boolean {
	return (
		!!element.placeholder &&
		element.kind === "shape" &&
		element.fill.type === "none" &&
		!element.text?.paragraphs.some((p) => p.runs.some((r) => r.text !== ""))
	);
}

/** One slide as an SVG document. */
export function renderSlideSvg(
	deck: Deck,
	slide: Slide,
	options: SvgOptions = {},
): string {
	const layout = layoutOf(deck, slide);
	const master = masterOf(deck, slide);
	const theme = master?.theme ?? {
		name: "",
		colors: {},
		fonts: { heading: "Arial", body: "Arial" },
	};
	const context: Context = {
		palette: paletteOf(master),
		theme,
		defs: [],
		next: 0,
		image: options.image ?? ((src) => (src.startsWith("data:") ? src : null)),
	};
	const [w, h] = [u(deck.width), u(deck.height)];
	const background = slide.background ??
		layout?.background ??
		master?.background ?? { type: "solid", color: { scheme: "bg1" } };
	const behind = [
		...(layout?.showMaster === false ? [] : (master?.elements ?? [])),
		...(layout?.elements ?? []),
	];
	const body = [
		`<rect width="${w}" height="${h}" ${paint(background, context)}/>`,
		...(background.type === "image" && context.image(background.src)
			? [
					`<image href="${esc(context.image(background.src) ?? "")}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`,
				]
			: []),
		...behind.map((element) => renderElement(element, context)),
		...slide.elements
			.filter((element) => !isEmptyPlaceholder(element))
			.map((element) => renderElement(element, context)),
	].join("");
	const width = options.width ?? w;
	const height = Math.round((width * h) / w);
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${width}" height="${height}"><defs>${context.defs.join("")}</defs>${body}</svg>`;
}
