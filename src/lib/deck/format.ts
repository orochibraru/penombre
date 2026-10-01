/**
 * A Markdown deck in Marp's conventions: optional YAML front matter, slides
 * split by rulers, HTML comments as directives or speaker notes. Only what
 * the editor changes is rewritten; front matter is kept verbatim.
 */

export const SLIDE_SEPARATOR = "\n\n---\n\n";

export interface Slide {
	/** Markdown, without the slide's comments. */
	body: string;
	/** Speaker notes: every comment that is not a directive. */
	notes: string;
	/** Directive comments such as `_class: lead`, in file order. */
	directives: Record<string, string>;
}

export interface Deck {
	/** The YAML between the front matter fences, verbatim. */
	frontMatter: string | null;
	slides: Slide[];
}

export const THEMES = ["default", "gaia", "uncover"] as const;
export type ThemeName = (typeof THEMES)[number];

export interface SlideLook {
	className: string;
	/** The class the slide would have without its own `_class`. */
	inheritedClass: string;
	paginate: boolean;
	header: string;
	footer: string;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const RULER = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const COMMENT = /<!--([\s\S]*?)-->/g;
const PAIR = /^\s*(_?)([A-Za-z]+)\s*:\s*(.*?)\s*$/;
const PLAIN = /^[A-Za-z0-9_./][\w ./,()%-]*$/;
const LOCAL = ["class", "paginate", "header", "footer"] as const;

/** Marp's directive names; any other comment is a speaker note. */
const DIRECTIVES = new Set([
	"marp",
	"theme",
	"style",
	"headingDivider",
	"math",
	"title",
	"author",
	"description",
	"image",
	"keywords",
	"url",
	"size",
	"lang",
	"transition",
	"paginate",
	"header",
	"footer",
	"class",
	"backgroundColor",
	"backgroundImage",
	"backgroundPosition",
	"backgroundRepeat",
	"backgroundSize",
	"color",
]);

/** For each line, whether it belongs to a fenced code block. */
export function codeLines(lines: string[]): boolean[] {
	let fence = "";
	return lines.map((line) => {
		const marker = FENCE.exec(line)?.[1];
		if (fence) {
			const closing = line.trim();
			if (
				closing.length >= fence.length &&
				closing === (fence[0] ?? "").repeat(closing.length)
			) {
				fence = "";
			}
			return true;
		}
		if (marker) {
			fence = marker;
			return true;
		}
		return false;
	});
}

/** Pull HTML comments out of Markdown, leaving fenced code alone. */
export function extractComments(markdown: string): {
	text: string;
	comments: string[];
} {
	const comments: string[] = [];
	const lines = markdown.split("\n");
	const code = codeLines(lines);
	const out: string[] = [];
	let run: string[] = [];
	const flush = () => {
		if (run.length > 0) {
			out.push(
				run.join("\n").replace(COMMENT, (match, comment: string) => {
					// Marp's fitting heading, `# <!-- fit --> Title`, is not a note.
					if (comment.trim() === "fit") {
						return match;
					}
					comments.push(comment);
					return "";
				}),
			);
			run = [];
		}
	};
	lines.forEach((line, index) => {
		if (code[index]) {
			flush();
			out.push(line);
		} else {
			run.push(line);
		}
	});
	flush();
	return { text: out.join("\n"), comments };
}

function unquote(value: string): string {
	if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
		try {
			return String(JSON.parse(value));
		} catch {
			return value.slice(1, -1);
		}
	}
	if (value.startsWith("'") && value.endsWith("'") && value.length > 1) {
		return value.slice(1, -1).replace(/''/g, "'");
	}
	return value;
}

/** A YAML scalar; `>` is escaped so the value cannot close its comment. */
function yamlValue(value: string): string {
	return PLAIN.test(value) && value === value.trimEnd()
		? value
		: JSON.stringify(value).replace(/>/g, "\\u003e");
}

function directivesIn(comment: string): Record<string, string> | null {
	const lines = comment.split("\n").filter((line) => line.trim() !== "");
	if (lines.length === 0) {
		return null;
	}
	const found: Record<string, string> = {};
	for (const line of lines) {
		const match = PAIR.exec(line);
		if (!match || !DIRECTIVES.has(match[2] ?? "")) {
			return null;
		}
		found[`${match[1]}${match[2]}`] = unquote(match[3] ?? "");
	}
	return found;
}

/** Leading blank lines and trailing whitespace are the file's, not the slide's. */
function tidy(text: string): string {
	return text.replace(/^(?:[ \t]*\n)+/, "").trimEnd();
}

export function readSlide(raw: string): Slide {
	const { text, comments } = extractComments(raw);
	const notes: string[] = [];
	const directives: Record<string, string> = {};
	for (const comment of comments) {
		const found = directivesIn(comment);
		if (found) {
			Object.assign(directives, found);
		} else if (comment.trim()) {
			notes.push(comment.trim());
		}
	}
	return { body: tidy(text), notes: notes.join("\n\n"), directives };
}

export function writeSlide(slide: Slide): string {
	const parts = Object.entries(slide.directives).map(
		([key, value]) => `<!-- ${key}: ${yamlValue(value)} -->`,
	);
	const body = tidy(slide.body);
	if (body) {
		parts.push(body);
	}
	const notes = slide.notes.trim().replace(/--(!?)>/g, "--$1 >");
	if (notes) {
		parts.push(
			notes.includes("\n") ? `<!--\n${notes}\n-->` : `<!-- ${notes} -->`,
		);
	}
	return parts.join("\n\n");
}

function normalize(text: string): string {
	return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

/** Front matter is `---` on the first line up to the next `---`. */
function splitFrontMatter(text: string): [string | null, string] {
	const lines = text.split("\n");
	if (lines[0]?.trimEnd() !== "---") {
		return [null, text];
	}
	const end = lines.findIndex(
		(line, index) => index > 0 && line.trimEnd() === "---",
	);
	const yaml = lines.slice(1, end).join("\n");
	// A deck that merely opens with a ruler has no `key:` in it.
	if (end === -1 || (yaml.trim() !== "" && !/^[\w-]+\s*:/m.test(yaml))) {
		return [null, text];
	}
	return [yaml, lines.slice(end + 1).join("\n")];
}

/** Rulers outside fenced code split slides, as in Marp. */
function splitRulers(text: string): string[] {
	const lines = text.split("\n");
	const code = codeLines(lines);
	const slides: string[][] = [[]];
	lines.forEach((line, index) => {
		if (!code[index] && RULER.test(line)) {
			slides.push([]);
		} else {
			slides.at(-1)?.push(line);
		}
	});
	return slides.map((slide) => slide.join("\n"));
}

/** Each slide's raw Markdown, comments included, front matter excluded. */
export function slideTexts(text: string): string[] {
	const [, rest] = splitFrontMatter(normalize(text));
	const slides = splitRulers(rest)
		.map((slide) => slide.trim())
		.filter((slide, _index, all) => slide !== "" || all.length === 1);
	return slides.length > 0 ? slides : [""];
}

export function parseDeck(text: string): Deck {
	const [frontMatter] = splitFrontMatter(normalize(text));
	return { frontMatter, slides: slideTexts(text).map(readSlide) };
}

export function writeDeck(deck: Deck): string {
	const slides = deck.slides.map(writeSlide).join(SLIDE_SEPARATOR);
	return deck.frontMatter === null
		? `${slides}\n`
		: `---\n${deck.frontMatter}\n---\n\n${slides}\n`;
}

function keyLine(key: string): RegExp {
	return new RegExp(`^${key}\\s*:`);
}

export function frontMatterValue(
	yaml: string | null,
	key: string,
): string | undefined {
	const line = yaml?.split("\n").find((entry) => keyLine(key).test(entry));
	return line === undefined
		? undefined
		: unquote(line.slice(line.indexOf(":") + 1).trim());
}

/** Set or remove a top-level key, creating Marp front matter if needed. */
export function withFrontMatter(
	yaml: string | null,
	key: string,
	value: string | null,
): string | null {
	if (yaml === null && value === null) {
		return null;
	}
	const lines = yaml === null ? ["marp: true"] : yaml.split("\n");
	const at = lines.findIndex((line) => keyLine(key).test(line));
	if (value === null) {
		if (at !== -1) {
			lines.splice(at, 1);
		}
	} else if (at === -1) {
		lines.push(`${key}: ${yamlValue(value)}`);
	} else {
		lines[at] = `${key}: ${yamlValue(value)}`;
	}
	return lines.join("\n");
}

const TRUE = /^(?:true|yes|on)$/i;

/**
 * Each slide's class, page number, header and footer. A directive without
 * `_` carries on to the slides after it; with `_` it is the slide's own.
 */
export function slideLooks(deck: Deck): SlideLook[] {
	const carried: Record<string, string> = {};
	for (const key of LOCAL) {
		carried[key] = frontMatterValue(deck.frontMatter, key) ?? "";
	}
	return deck.slides.map(({ directives }) => {
		for (const key of LOCAL) {
			if (Object.hasOwn(directives, key)) {
				carried[key] = directives[key] ?? "";
			}
		}
		const own = (key: string) => directives[`_${key}`] ?? carried[key] ?? "";
		return {
			className: own("class"),
			inheritedClass: carried.class ?? "",
			paginate: TRUE.test(own("paginate")),
			header: own("header"),
			footer: own("footer"),
		};
	});
}

export function deckTheme(deck: Deck): ThemeName {
	let name = frontMatterValue(deck.frontMatter, "theme");
	for (const slide of deck.slides) {
		name = slide.directives.theme ?? name;
	}
	return THEMES.find((theme) => theme === name) ?? "default";
}

export function setTheme(deck: Deck, theme: ThemeName): void {
	deck.frontMatter = withFrontMatter(deck.frontMatter, "theme", theme);
	for (const slide of deck.slides) {
		delete slide.directives.theme;
	}
}

export function classTokens(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

function toggled(value: string, token: string, on: boolean): string {
	const rest = classTokens(value).filter((entry) => entry !== token);
	return (on ? [...rest, token] : rest).join(" ");
}

/** Add or remove a class on one slide, as `_class` (Marp replaces, not merges). */
export function setSlideClass(
	deck: Deck,
	index: number,
	token: string,
	on: boolean,
): void {
	const look = slideLooks(deck)[index];
	const slide = deck.slides[index];
	if (!look || !slide) {
		return;
	}
	const value = toggled(look.className, token, on);
	if (value === look.inheritedClass) {
		delete slide.directives._class;
	} else {
		slide.directives._class = value;
	}
}

export function isInverted(deck: Deck): boolean {
	return classTokens(
		frontMatterValue(deck.frontMatter, "class") ?? "",
	).includes("invert");
}

/** Marp's dark variant is the `invert` class, on the deck and every override. */
export function setInverted(deck: Deck, on: boolean): void {
	const current = frontMatterValue(deck.frontMatter, "class") ?? "";
	deck.frontMatter = withFrontMatter(
		deck.frontMatter,
		"class",
		toggled(current, "invert", on) || null,
	);
	for (const slide of deck.slides) {
		for (const key of ["class", "_class"]) {
			const value = slide.directives[key];
			if (value !== undefined) {
				slide.directives[key] = toggled(value, "invert", on);
			}
		}
	}
}

export function isPaginated(deck: Deck): boolean {
	return TRUE.test(frontMatterValue(deck.frontMatter, "paginate") ?? "");
}

export function setPaginated(deck: Deck, on: boolean): void {
	deck.frontMatter = withFrontMatter(
		deck.frontMatter,
		"paginate",
		on ? "true" : null,
	);
}
