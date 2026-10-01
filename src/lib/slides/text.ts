import type {
	Bullet,
	Color,
	LevelStyle,
	Paragraph,
	Run,
	RunStyle,
	TextBody,
	Theme,
} from "./model";

/**
 * What a paragraph and a run actually look like once their level's inherited
 * style is folded in, and the fonts they name as CSS.
 */

export const DEFAULT_SIZE = 18;
export const DEFAULT_TEXT_COLOR: Color = { scheme: "tx1" };
export const HEADING_FONT = "+mj-lt";
export const BODY_FONT = "+mn-lt";

/**
 * Typefaces the templates use, and what a machine without them should reach
 * for. PowerPoint does its own substitution; this is the browser's.
 */
const STACKS: Record<string, string> = {
	arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
	"arial black": "'Arial Black', 'Arial Bold', Gadget, sans-serif",
	helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
	"helvetica neue": "'Helvetica Neue', Helvetica, Arial, sans-serif",
	verdana: "Verdana, Geneva, sans-serif",
	tahoma: "Tahoma, Verdana, Geneva, sans-serif",
	"trebuchet ms": "'Trebuchet MS', 'Lucida Grande', 'Segoe UI', sans-serif",
	"century gothic":
		"'Century Gothic', 'Avenir Next', Avenir, Futura, 'Trebuchet MS', sans-serif",
	"gill sans mt":
		"'Gill Sans MT', 'Gill Sans', Calibri, 'Trebuchet MS', sans-serif",
	"gill sans":
		"'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif",
	calibri: "Calibri, Carlito, 'Segoe UI', 'Helvetica Neue', sans-serif",
	"segoe ui": "'Segoe UI', system-ui, 'Helvetica Neue', sans-serif",
	"franklin gothic medium":
		"'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
	impact: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
	georgia: "Georgia, Cambria, 'Times New Roman', serif",
	cambria: "Cambria, Georgia, 'Times New Roman', serif",
	"times new roman": "'Times New Roman', Times, serif",
	"palatino linotype":
		"'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
	palatino: "Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
	"book antiqua": "'Book Antiqua', Palatino, 'Palatino Linotype', serif",
	garamond: "Garamond, 'EB Garamond', Baskerville, Georgia, serif",
	baskerville: "Baskerville, 'Baskerville Old Face', Garamond, Georgia, serif",
	rockwell: "Rockwell, 'Rockwell Nova', 'Courier New', Georgia, serif",
	"courier new": "'Courier New', Courier, monospace",
	consolas: "Consolas, Menlo, 'Courier New', monospace",
};

/** Resolve `+mj-lt` / `+mn-lt` to the theme's typeface. */
export function typeface(font: string | undefined, theme: Theme): string {
	if (!font || font === BODY_FONT || font.startsWith("+mn")) {
		return theme.fonts.body;
	}
	if (font === HEADING_FONT || font.startsWith("+mj")) {
		return theme.fonts.heading;
	}
	return font;
}

export function fontStack(font: string | undefined, theme: Theme): string {
	const face = typeface(font, theme);
	return (
		STACKS[face.toLowerCase()] ?? `'${face.replace(/'/g, "")}', sans-serif`
	);
}

/** The typefaces the font menu offers, beside the theme's two. */
export const FONT_CHOICES = [
	"Arial",
	"Arial Black",
	"Verdana",
	"Tahoma",
	"Trebuchet MS",
	"Century Gothic",
	"Gill Sans MT",
	"Calibri",
	"Franklin Gothic Medium",
	"Impact",
	"Georgia",
	"Cambria",
	"Times New Roman",
	"Palatino Linotype",
	"Garamond",
	"Rockwell",
	"Courier New",
] as const;

// =========================================================================
// Effective style
// =========================================================================

export interface EffectiveParagraph extends LevelStyle {
	level: number;
}

function levelStyle(body: TextBody | undefined, level: number): LevelStyle {
	return body?.levels[level] ?? body?.levels[0] ?? {};
}

function defined<T extends object>(value: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== undefined),
	) as Partial<T>;
}

export function effectiveParagraph(
	paragraph: Paragraph,
	body: TextBody | undefined,
): EffectiveParagraph {
	const level = paragraph.level ?? 0;
	const { runs: _runs, endSize: _end, level: _level, ...own } = paragraph;
	return { ...levelStyle(body, level), ...defined(own), level };
}

export interface EffectiveRun extends RunStyle {
	size: number;
	color: Color;
}

export function effectiveRun(
	run: Partial<Run>,
	paragraph: EffectiveParagraph,
	body: TextBody | undefined,
): EffectiveRun {
	const { text: _text, field: _field, ...own } = run;
	const merged = {
		bold: paragraph.bold,
		italic: paragraph.italic,
		underline: paragraph.underline,
		strike: paragraph.strike,
		size: paragraph.size,
		color: paragraph.color,
		font: paragraph.font,
		caps: paragraph.caps,
		spacing: paragraph.spacing,
		...defined(own),
	};
	const scale = body?.fontScale ?? 1;
	return {
		...merged,
		size: (merged.size ?? DEFAULT_SIZE) * scale,
		color: merged.color ?? DEFAULT_TEXT_COLOR,
	};
}

// =========================================================================
// Bullets
// =========================================================================

const ROMAN: [number, string][] = [
	[1000, "m"],
	[900, "cm"],
	[500, "d"],
	[400, "cd"],
	[100, "c"],
	[90, "xc"],
	[50, "l"],
	[40, "xl"],
	[10, "x"],
	[9, "ix"],
	[5, "v"],
	[4, "iv"],
	[1, "i"],
];

function roman(value: number): string {
	let rest = value;
	let out = "";
	for (const [amount, letters] of ROMAN) {
		while (rest >= amount) {
			out += letters;
			rest -= amount;
		}
	}
	return out;
}

function alpha(value: number): string {
	let rest = value;
	let out = "";
	while (rest > 0) {
		const digit = (rest - 1) % 26;
		out = String.fromCodePoint(97 + digit) + out;
		rest = Math.floor((rest - 1) / 26);
	}
	return out;
}

/** The label of the `n`th item in a DrawingML auto-numbering scheme. */
export function autoNumber(scheme: string, n: number): string {
	const body = scheme.startsWith("alphaLc")
		? alpha(n)
		: scheme.startsWith("alphaUc")
			? alpha(n).toUpperCase()
			: scheme.startsWith("romanLc")
				? roman(n)
				: scheme.startsWith("romanUc")
					? roman(n).toUpperCase()
					: String(n);
	if (scheme.endsWith("ParenBoth")) {
		return `(${body})`;
	}
	if (scheme.endsWith("ParenR")) {
		return `${body})`;
	}
	return scheme.endsWith("Plain") ? body : `${body}.`;
}

/** Wingdings code points PowerPoint's bullet menu uses, as the glyphs they draw. */
const WINGDINGS: Record<number, string> = {
	0x6c: "\u25CF",
	0x6e: "\u25A0",
	0x71: "\u2751",
	0x76: "\u2756",
	0x9f: "\u2022",
	0xa7: "\u25AA",
	0xa8: "\u25FB",
	0xd8: "\u27A2",
	0xe0: "\u2794",
	0xfc: "\u2713",
};

const SYMBOL_FONT = /wingdings|webdings|symbol|opensymbol|starsymbol/i;

/**
 * A bullet character as Unicode. Office writes bullets in symbol fonts as
 * the font's own code points (Symbol's bullet is U+F0B7), which draw as
 * boxes anywhere the font is missing — that is, in every browser.
 */
export function bulletGlyph(char: string, font: string | undefined): string {
	const raw = char.codePointAt(0) ?? 0x2022;
	const code = raw >= 0xf000 && raw <= 0xf0ff ? raw - 0xf000 : raw;
	if (font && /wingdings/i.test(font)) {
		return WINGDINGS[code] ?? "\u2022";
	}
	if ((font && SYMBOL_FONT.test(font)) || (raw >= 0xe000 && raw <= 0xf8ff)) {
		return code === 0xb7 || code >= 0xe000
			? "\u2022"
			: String.fromCodePoint(code);
	}
	return char;
}

/** The face a bullet is drawn in: its own, unless that is a symbol font. */
export function bulletFont(font: string | undefined): string | undefined {
	return font && SYMBOL_FONT.test(font) ? undefined : font;
}

/** Each paragraph's bullet label, counting numbered runs per level. */
export function bulletLabels(body: TextBody | undefined): (string | null)[] {
	const counters: number[] = [];
	return (body?.paragraphs ?? []).map((paragraph) => {
		const style = effectiveParagraph(paragraph, body);
		counters.length = style.level + 1;
		const bullet: Bullet | undefined = style.bullet;
		const empty = paragraph.runs.every((run) => run.text === "");
		if (!bullet || bullet.type === "none") {
			counters[style.level] = 0;
			return null;
		}
		if (empty) {
			return null;
		}
		if (bullet.type === "char") {
			return bulletGlyph(bullet.char, bullet.font);
		}
		const next =
			(counters[style.level] ?? 0) === 0
				? (bullet.start ?? 1)
				: (counters[style.level] ?? 0) + 1;
		counters[style.level] = next;
		return autoNumber(bullet.scheme, next);
	});
}

// =========================================================================
// Measuring, for renderers with no layout engine
// =========================================================================

// Helvetica's and Times' advance widths for ASCII 32–126, in 1/1000 em.
const SANS_WIDTHS =
	"278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584"
		.split(",")
		.map(Number);
const SERIF_WIDTHS =
	"250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541"
		.split(",")
		.map(Number);

/** How much wider than Helvetica or Times a face sets. */
const WIDTH_FACTOR: Record<string, number> = {
	verdana: 1.14,
	tahoma: 1.02,
	"century gothic": 1.12,
	"arial black": 1.2,
	impact: 0.86,
	georgia: 1.1,
	"palatino linotype": 1.04,
	palatino: 1.04,
	garamond: 0.94,
	rockwell: 1.06,
	"trebuchet ms": 0.98,
	calibri: 0.92,
	"gill sans mt": 0.92,
	"gill sans": 0.92,
	"franklin gothic medium": 0.95,
};

/** Punctuation bullets and quotes are set in, beyond ASCII. */
const WIDE: Record<string, number> = {
	"\u2014": 1000,
	"\u2013": 556,
	"\u2022": 350,
	"\u203A": 333,
	"\u25A0": 604,
	"\u2026": 1000,
	"\u201C": 444,
	"\u201D": 444,
	"\u2019": 222,
};

const SERIF =
	/georgia|times|cambria|palatino|garamond|baskerville|antiqua|rockwell|serif/i;
const MONO = /courier|consolas|mono|menlo/i;

function isSerif(face: string): boolean {
	return SERIF.test(face) && !/sans/i.test(face);
}

/** A run's width in points: exact enough to wrap text for a PDF page. */
export function textWidth(
	text: string,
	face: string,
	size: number,
	bold = false,
): number {
	if (MONO.test(face)) {
		return text.length * size * 0.6;
	}
	const table = isSerif(face) ? SERIF_WIDTHS : SANS_WIDTHS;
	let units = 0;
	for (const char of text) {
		const code = char.codePointAt(0) ?? 32;
		if (code >= 32 && code <= 126) {
			units += table[code - 32] ?? 556;
		} else if (WIDE[char] !== undefined) {
			units += WIDE[char] ?? 0;
		} else {
			// CJK is square; everything else is about an average letter.
			units += code >= 0x2e_80 ? 1000 : 560;
		}
	}
	const factor = WIDTH_FACTOR[face.toLowerCase()] ?? 1;
	return (units / 1000) * size * factor * (bold ? 1.06 : 1);
}

/** Inherited levels with a more specific list's settings laid over them. */
export function mergeLevels(
	base: LevelStyle[],
	over: LevelStyle[] | undefined,
): LevelStyle[] {
	const length = Math.max(base.length, over?.length ?? 0);
	return Array.from({ length }, (_, level) => ({
		...base[level],
		...defined(over?.[level] ?? {}),
	}));
}
