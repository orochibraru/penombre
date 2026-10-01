import {
	type Align,
	type Box,
	type Color,
	EMU_PER_PT,
	type Fill,
	type Geometry,
	type LevelStyle,
	type Line,
	type ShapeElement,
	type SlideElement,
	type TextBody,
} from "../model";
import { BODY_FONT, HEADING_FONT } from "../text";

/**
 * The pieces a template is made of, authored in points on a 960 × 540 slide
 * and stored in EMU like everything else.
 */

export type LayoutKind =
	| "title"
	| "section"
	| "content"
	| "two"
	| "comparison"
	| "picture"
	| "quote"
	| "number"
	| "agenda"
	| "closing"
	| "blank";

export const LAYOUT_KINDS: { kind: LayoutKind; type: string; name: string }[] =
	[
		{ kind: "title", type: "title", name: "Title Slide" },
		{ kind: "section", type: "secHead", name: "Section Header" },
		{ kind: "content", type: "obj", name: "Title and Content" },
		{ kind: "two", type: "twoObj", name: "Two Content" },
		{ kind: "comparison", type: "twoTxTwoObj", name: "Comparison" },
		{ kind: "picture", type: "picTx", name: "Picture with Caption" },
		{ kind: "quote", type: "cust", name: "Quote" },
		{ kind: "number", type: "cust", name: "Big Number" },
		{ kind: "agenda", type: "cust", name: "Agenda" },
		{ kind: "closing", type: "cust", name: "Closing" },
		{ kind: "blank", type: "blank", name: "Blank" },
	];

export function layoutPart(kind: LayoutKind): string {
	const index = LAYOUT_KINDS.findIndex((entry) => entry.kind === kind);
	return `ppt/slideLayouts/slideLayout${index + 1}.xml`;
}

export function kindOfLayoutName(name: string): LayoutKind | undefined {
	return LAYOUT_KINDS.find((entry) => entry.name === name)?.kind;
}

export const pt = (value: number) => Math.round(value * EMU_PER_PT);

export function box(x: number, y: number, w: number, h: number): Box {
	return { x: pt(x), y: pt(y), w: pt(w), h: pt(h) };
}

export const scheme = (
	name: string,
	alpha?: number,
	...mods: [string, number][]
): Color => {
	const all: [string, number][] = [...mods];
	if (alpha !== undefined && alpha < 1) {
		all.push(["alpha", Math.round(alpha * 100_000)]);
	}
	return all.length > 0 ? { scheme: name, mods: all } : { scheme: name };
};

export const solid = (name: string, alpha?: number): Fill => ({
	type: "solid",
	color: scheme(name, alpha),
});

export const NO_LINE: Line = { fill: { type: "none" }, width: 0 };

export function stroke(name: string, width: number, alpha?: number): Line {
	return { fill: solid(name, alpha), width: pt(width) };
}

let decorationId = 50;

interface DecorationOptions {
	line?: Line;
	rot?: number;
	adj?: Record<string, number>;
	text?: TextBody;
	name?: string;
}

/** A background shape: never a placeholder, never selectable on a slide. */
export function shape(
	preset: string,
	[x, y, w, h]: [number, number, number, number],
	fill: Fill,
	options: DecorationOptions = {},
): ShapeElement {
	const geometry: Geometry = options.adj
		? { preset, adj: options.adj }
		: { preset };
	return {
		kind: "shape",
		id: String(decorationId++),
		name: options.name ?? `Decoration ${decorationId}`,
		...box(x, y, w, h),
		rot: options.rot,
		geometry,
		fill,
		line: options.line ?? NO_LINE,
		text: options.text,
	};
}

/** A decorative line from (x1, y1) to (x2, y2). */
export function rule(
	[x1, y1, x2, y2]: [number, number, number, number],
	line: Line,
): ShapeElement {
	return {
		...shape(
			"line",
			[
				Math.min(x1, x2),
				Math.min(y1, y2),
				Math.abs(x2 - x1),
				Math.abs(y2 - y1),
			],
			{ type: "none" },
			{ line },
		),
		flipH: x2 < x1 ? true : undefined,
		flipV: y2 < y1 ? true : undefined,
	};
}

/** A single glyph as decoration: the big quote mark. */
export function glyph(
	char: string,
	where: [number, number, number, number],
	style: LevelStyle,
): ShapeElement {
	return shape(
		"rect",
		where,
		{ type: "none" },
		{
			text: {
				paragraphs: [{ runs: [{ text: char, ...style }] }],
				anchor: "t",
				inset: [0, 0, 0, 0],
				wrap: false,
				autofit: "none",
				levels: [],
			},
		},
	);
}

// =========================================================================
// Placeholders
// =========================================================================

export interface PlaceholderSpec {
	type?: string;
	idx?: string;
	at: [number, number, number, number];
	anchor?: "t" | "ctr" | "b";
	/** Overrides on the master's text style, level by level. */
	levels?: LevelStyle[];
	shrink?: boolean;
}

export function placeholder(spec: PlaceholderSpec, id: number): ShapeElement {
	const name =
		spec.type === "title" || spec.type === "ctrTitle"
			? "Title"
			: spec.type === "pic"
				? "Picture Placeholder"
				: "Text Placeholder";
	return {
		kind: "shape",
		id: String(id),
		name: `${name} ${id}`,
		...box(...spec.at),
		placeholder: {
			type: spec.type,
			idx: spec.idx,
		},
		geometry: { preset: "rect" },
		fill: { type: "none" },
		line: NO_LINE,
		text: {
			paragraphs: [{ runs: [] }],
			anchor: spec.anchor ?? "t",
			inset: [91_440, 45_720, 91_440, 45_720],
			wrap: true,
			autofit: spec.shrink ? "shrink" : "none",
			levels: spec.levels ?? [],
		},
	};
}

// =========================================================================
// Themes
// =========================================================================

export interface ThemeStyle {
	id: string;
	name: string;
	/** Light text on a dark ground: the colour map swaps bg1 and tx1. */
	dark: boolean;
	colors: Record<string, string>;
	fonts: { heading: string; body: string };
	background: Fill;
	title: {
		size: number;
		align: Align;
		bold?: boolean;
		italic?: boolean;
		caps?: boolean;
		spacing?: number;
		color?: Color;
	};
	body: {
		size: number;
		bullet: string;
		bulletFont?: string;
		bulletColor: Color;
		lineSpacing?: number;
		color?: Color;
	};
	/** What the subtitle, captions and attributions are set in. */
	quiet: Color;
	/** Title, section and closing slides. */
	feature?: {
		background: Fill;
		title?: Color;
		text?: Color;
	};
	/** Width of the title and subtitle on feature slides, to clear their art. */
	featureWidth?: number;
	/** Decoration every layout shows, drawn once on the master. */
	master?: () => SlideElement[];
	decorate: (kind: LayoutKind) => SlideElement[];
}

export const HEADING = HEADING_FONT;
export const BODY = BODY_FONT;
