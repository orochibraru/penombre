/**
 * The choices the document editor offers, and the arithmetic behind them.
 *
 * Colours here are content, not chrome: they end up in the file, so they are
 * fixed values rather than theme tokens. Each is picked to stay readable on
 * both the light and the dark page.
 */

export interface FontChoice {
	label: string;
	/** A CSS stack; the first family is what a `.docx` records. */
	value: string;
}

export const FONT_FAMILIES: FontChoice[] = [
	{ label: "Arial", value: "Arial, Helvetica, sans-serif" },
	{ label: "Calibri", value: "Calibri, Carlito, sans-serif" },
	{ label: "Georgia", value: "Georgia, serif" },
	{ label: "Times New Roman", value: '"Times New Roman", Times, serif' },
	{ label: "Verdana", value: "Verdana, sans-serif" },
	{ label: "Courier New", value: '"Courier New", Courier, monospace' },
];

/** Points, Google Docs' list. */
export const FONT_SIZES = [
	8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72,
] as const;

export const LINE_HEIGHTS = ["1", "1.15", "1.5", "2"] as const;

export const HUES = [
	"gray",
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
	"pink",
] as const;

export type Hue = (typeof HUES)[number];

export const TEXT_COLORS: Record<Hue, string> = {
	gray: "#6b7280",
	red: "#dc2626",
	orange: "#ea580c",
	yellow: "#ca8a04",
	green: "#16a34a",
	blue: "#2563eb",
	purple: "#9333ea",
	pink: "#db2777",
};

export const HIGHLIGHT_COLORS: Record<Hue, string> = {
	gray: "#e5e7eb",
	red: "#fecaca",
	orange: "#fed7aa",
	yellow: "#fef08a",
	green: "#bbf7d0",
	blue: "#bfdbfe",
	purple: "#e9d5ff",
	pink: "#fbcfe8",
};

/** The first family of a CSS font stack, unquoted: what two stacks share. */
export function firstFamily(stack: string): string {
	return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

/** `12pt`, or `16px` as `12pt`; anything relative is not a size we keep. */
export function points(css: string | null | undefined): string | null {
	const match = /^([\d.]+)(pt|px)$/.exec((css ?? "").trim());
	if (!match) {
		return null;
	}
	const value = Number(match[1]) * (match[2] === "px" ? 0.75 : 1);
	const rounded = Math.round(value * 2) / 2;
	return rounded > 0 ? `${rounded}pt` : null;
}

/** Half an inch, Word's and Google Docs' indent step. */
export const INDENT_STEP = 36;
const MAX_INDENT = INDENT_STEP * 10;

/** The next indent stop in `direction`, in points, or null at the margin. */
export function nextIndent(
	current: string | null,
	direction: 1 | -1,
): string | null {
	const now = Number.parseFloat(current ?? "") || 0;
	const stop =
		direction > 0
			? Math.floor(now / INDENT_STEP) * INDENT_STEP + INDENT_STEP
			: Math.ceil(now / INDENT_STEP) * INDENT_STEP - INDENT_STEP;
	const clamped = Math.min(MAX_INDENT, stop);
	return clamped > 0 ? `${clamped}pt` : null;
}

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * What a typed link may point at. A bare `example.com` becomes https; a
 * `javascript:` URL is refused, since opening it would run on this origin.
 */
export function linkTarget(input: string): string | null {
	const value = input.trim();
	if (!value) {
		return null;
	}
	const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value)
		? value
		: `https://${value}`;
	try {
		return LINK_PROTOCOLS.has(new URL(withScheme).protocol) ? withScheme : null;
	} catch {
		return null;
	}
}

/** `Mod-Shift-s` as the platform writes it: `⌘⇧S`, or `Ctrl+Shift+S`. */
export function keyLabel(binding: string, apple: boolean): string {
	const names: Record<string, [string, string]> = {
		Mod: ["⌘", "Ctrl"],
		Ctrl: ["⌃", "Ctrl"],
		Shift: ["⇧", "Shift"],
		Alt: ["⌥", "Alt"],
	};
	const parts = binding.split(/-(?!$)/).map((part) => {
		const name = names[part];
		if (name) {
			return apple ? name[0] : name[1];
		}
		return part.length === 1 ? part.toUpperCase() : part;
	});
	return parts.join(apple ? "" : "+");
}
