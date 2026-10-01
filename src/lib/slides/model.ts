/**
 * A presentation as the slide editor holds it: what a `.pptx` says, in the
 * units it says it in.
 *
 * Geometry is in EMU (914400 to the inch, 12700 to the point), angles in
 * degrees, font sizes in points. Colours stay references to the theme where
 * the file made them so, which is what lets a theme switch recolour a deck.
 *
 * Text runs carry only what was set on them; `TextBody.levels` holds what
 * they inherit from the layout, master and theme, so rendering is faithful
 * and writing back never bakes the inheritance into the file.
 *
 * `origin` names the XML an element was read from, `slide.xml#id`. The server
 * patches that XML rather than regenerating it, so whatever the model does
 * not describe survives an edit.
 */

export const EMU_PER_PT = 12_700;
/** 13.333 × 7.5 in, PowerPoint's and Google Slides' 16:9. */
export const SLIDE_WIDTH = 12_192_000;
export const SLIDE_HEIGHT = 6_858_000;

export interface Color {
	/** `accent1`, `tx1`, `bg2`, … resolved through the theme and colour map. */
	scheme?: string;
	/** `RRGGBB`. */
	rgb?: string;
	/** DrawingML colour transforms in file order: `lumMod`, `alpha`, … */
	mods?: [string, number][];
}

export interface GradientStop {
	/** 0–100000 along the gradient. */
	pos: number;
	color: Color;
}

export type Fill =
	| { type: "none" }
	| { type: "solid"; color: Color }
	| {
			type: "gradient";
			stops: GradientStop[];
			/** Degrees, clockwise from left-to-right. */
			angle: number;
			radial?: boolean;
	  }
	| { type: "image"; src: string };

export interface Line {
	fill: Fill;
	/** EMU. */
	width: number;
	dash?: string;
	head?: string;
	tail?: string;
	cap?: "rnd" | "sq" | "flat";
}

export interface PathCommand {
	op: "M" | "L" | "C" | "Q" | "A" | "Z";
	/** Points as x,y pairs; for `A`: wR, hR, start and swing in degrees. */
	v: number[];
}

export interface PathDef {
	w: number;
	h: number;
	fill?: boolean;
	stroke?: boolean;
	commands: PathCommand[];
}

export type Geometry =
	| { preset: string; adj?: Record<string, number> }
	| { paths: PathDef[] };

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
	rot?: number;
	flipH?: boolean;
	flipV?: boolean;
}

export interface Placeholder {
	type?: string;
	idx?: string;
}

interface Common extends Box {
	id: string;
	name?: string;
	descr?: string;
	origin?: string;
	placeholder?: Placeholder;
}

export type Align = "l" | "ctr" | "r" | "just";

export type Bullet =
	| { type: "none" }
	| { type: "char"; char: string; font?: string; color?: Color }
	| { type: "number"; scheme: string; start?: number };

export interface RunStyle {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strike?: boolean;
	/** Points. */
	size?: number;
	color?: Color;
	/** A typeface, or `+mj-lt` / `+mn-lt` for the theme's heading and body. */
	font?: string;
	/** Percent: 30 superscript, -25 subscript. */
	baseline?: number;
	caps?: "all" | "small";
	/** Letter spacing, in hundredths of a point. */
	spacing?: number;
}

export interface Run extends RunStyle {
	/** `\n` is a line break inside the paragraph. */
	text: string;
	field?: { type: string; id: string };
}

export interface ParagraphStyle {
	align?: Align;
	bullet?: Bullet;
	/** Percent of single spacing. */
	lineSpacing?: number;
	/** Points. */
	spaceBefore?: number;
	spaceAfter?: number;
	/** EMU. */
	marL?: number;
	indent?: number;
}

export interface Paragraph extends ParagraphStyle {
	runs: Run[];
	level?: number;
	/** The size an empty paragraph keeps its height at. */
	endSize?: number;
}

export type LevelStyle = ParagraphStyle & RunStyle;

export interface TextBody {
	paragraphs: Paragraph[];
	anchor: "t" | "ctr" | "b";
	/** Left, top, right, bottom, in EMU. */
	inset: [number, number, number, number];
	wrap: boolean;
	autofit: "none" | "shrink" | "resize";
	/** 0–1, from `normAutofit`. */
	fontScale?: number;
	/** 0–1, from `normAutofit`. */
	lineReduction?: number;
	/** Inherited, per level. Rendering reads it; writing never does. */
	levels: LevelStyle[];
}

export interface ShapeElement extends Common {
	kind: "shape";
	geometry: Geometry;
	fill: Fill;
	line: Line;
	text?: TextBody;
}

export interface ImageElement extends Common {
	kind: "image";
	/** A package part (`ppt/media/image1.png`) or a `data:` URL. */
	src: string;
	/** Thousandths of a percent cut from each side. */
	crop?: { l: number; t: number; r: number; b: number };
	line?: Line;
	geometry?: Geometry;
}

export interface GroupElement extends Common {
	kind: "group";
	children: SlideElement[];
}

export interface TableCell {
	text: string;
}

/** Something the editor shows and moves but leaves exactly as it was. */
export interface RawElement extends Common {
	kind: "raw";
	label: "table" | "chart" | "diagram" | "media" | "ink" | "object";
	/** What to draw for it: the fallback picture a file carries, when it does. */
	preview?: SlideElement;
	table?: { columns: number[]; rows: { h: number; cells: TableCell[] }[] };
}

export type SlideElement =
	| ShapeElement
	| ImageElement
	| GroupElement
	| RawElement;

export interface Slide {
	/** A key for the editor; the file does not have one. */
	id: string;
	/** The slide part it was read from. */
	source?: string;
	/** Its layout's part. */
	layout: string;
	background?: Fill;
	hidden?: boolean;
	notes: string;
	elements: SlideElement[];
}

export interface Theme {
	name: string;
	/** `dk1`, `lt1`, `dk2`, `lt2`, `accent1`–`accent6`, `hlink`, `folHlink`. */
	colors: Record<string, string>;
	fonts: { heading: string; body: string };
}

export interface Master {
	part: string;
	theme: Theme;
	/** `bg1` → `lt1` and so on. */
	colorMap: Record<string, string>;
	background: Fill;
	/** Its decoration: every shape that is not a placeholder. */
	elements: SlideElement[];
	placeholders: SlideElement[];
	/** Text boxes that are not placeholders start from these. */
	textLevels: LevelStyle[];
}

export interface Layout {
	part: string;
	name: string;
	/** PowerPoint's layout type: `title`, `obj`, `secHead`, … or `cust`. */
	type: string;
	master: string;
	background?: Fill;
	/** Whether the master's decoration shows through. */
	showMaster: boolean;
	elements: SlideElement[];
	placeholders: SlideElement[];
}

export interface Deck {
	width: number;
	height: number;
	/** The Penombre template the deck's theme came from, when it did. */
	template?: string;
	masters: Master[];
	layouts: Layout[];
	slides: Slide[];
}

// =========================================================================
// Helpers
// =========================================================================

export function layoutOf(deck: Deck, slide: Slide): Layout | undefined {
	return deck.layouts.find((layout) => layout.part === slide.layout);
}

export function masterOf(deck: Deck, slide: Slide): Master | undefined {
	const layout = layoutOf(deck, slide);
	return (
		deck.masters.find((master) => master.part === layout?.master) ??
		deck.masters[0]
	);
}

/** Every element of a slide, group members included, depth first. */
export function flatten(elements: SlideElement[]): SlideElement[] {
	return elements.flatMap((element) =>
		element.kind === "group"
			? [element, ...flatten(element.children)]
			: [element],
	);
}

/** One more than the largest shape id on the slide, as a string. */
export function nextElementId(elements: SlideElement[]): string {
	let highest = 1;
	for (const element of flatten(elements)) {
		const id = Number(element.id);
		if (Number.isFinite(id)) {
			highest = Math.max(highest, id);
		}
	}
	return String(highest + 1);
}

/** Every element with a fresh id, for a copy that lands on a slide. */
export function withFreshIds(
	elements: SlideElement[],
	taken: SlideElement[],
): SlideElement[] {
	let next = Number(nextElementId(taken));
	const renumber = (element: SlideElement): SlideElement => {
		const copy = { ...structuredClone(element), id: String(next++) };
		if (copy.kind === "group") {
			copy.children = copy.children.map(renumber);
		}
		return copy;
	};
	return elements.map(renumber);
}

export function emptyText(levels: LevelStyle[] = []): TextBody {
	return {
		paragraphs: [{ runs: [] }],
		anchor: "t",
		inset: [91_440, 45_720, 91_440, 45_720],
		wrap: true,
		autofit: "none",
		levels,
	};
}

/** Structural equality for plain model values. */
export function sameValue(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}
	if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
		return false;
	}
	if (Array.isArray(a) !== Array.isArray(b)) {
		return false;
	}
	const left = a as Record<string, unknown>;
	const right = b as Record<string, unknown>;
	const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
	for (const key of keys) {
		if (!sameValue(left[key], right[key])) {
			return false;
		}
	}
	return true;
}

export function randomKey(): string {
	return Math.random().toString(36).slice(2, 10);
}
