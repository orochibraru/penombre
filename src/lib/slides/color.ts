import type { Color, Fill, Master, Theme } from "./model";

/**
 * DrawingML colours as CSS.
 *
 * A scheme colour goes through the master's colour map first (`tx1` is
 * usually `dk1`), then the theme. The transforms PowerPoint writes most —
 * luminance, tint, shade, alpha — are applied; the rarer ones are carried in
 * the model untouched and ignored here.
 */

export interface Palette {
	colors: Record<string, string>;
	colorMap: Record<string, string>;
}

export const DEFAULT_COLOR_MAP: Record<string, string> = {
	bg1: "lt1",
	tx1: "dk1",
	bg2: "lt2",
	tx2: "dk2",
};

export function paletteOf(master: Master | undefined, theme?: Theme): Palette {
	return {
		colors: theme?.colors ?? master?.theme.colors ?? {},
		colorMap: master?.colorMap ?? DEFAULT_COLOR_MAP,
	};
}

const PRESET: Record<string, string> = {
	black: "000000",
	white: "FFFFFF",
	red: "FF0000",
	green: "008000",
	blue: "0000FF",
	yellow: "FFFF00",
	gray: "808080",
	grey: "808080",
	orange: "FFA500",
	purple: "800080",
};

export function presetColor(name: string): string {
	return PRESET[name] ?? "000000";
}

function toRgb(hex: string): [number, number, number] {
	const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
	if (!Number.isFinite(value)) {
		return [0, 0, 0];
	}
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHsl([r, g, b]: [number, number, number]): [
	number,
	number,
	number,
] {
	const [red, green, blue] = [r / 255, g / 255, b / 255];
	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const light = (max + min) / 2;
	if (max === min) {
		return [0, 0, light];
	}
	const delta = max - min;
	const saturation =
		light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
	let hue: number;
	if (max === red) {
		hue = (green - blue) / delta + (green < blue ? 6 : 0);
	} else if (max === green) {
		hue = (blue - red) / delta + 2;
	} else {
		hue = (red - green) / delta + 4;
	}
	return [hue / 6, saturation, light];
}

function hslToRgb([h, s, l]: [number, number, number]): [
	number,
	number,
	number,
] {
	if (s === 0) {
		const grey = Math.round(l * 255);
		return [grey, grey, grey];
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const channel = (t: number) => {
		const k = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
		if (k < 1 / 6) {
			return p + (q - p) * 6 * k;
		}
		if (k < 1 / 2) {
			return q;
		}
		return k < 2 / 3 ? p + (q - p) * (2 / 3 - k) * 6 : p;
	};
	return [
		Math.round(channel(h + 1 / 3) * 255),
		Math.round(channel(h) * 255),
		Math.round(channel(h - 1 / 3) * 255),
	];
}

const clamp = (value: number, low = 0, high = 1) =>
	Math.min(high, Math.max(low, value));

interface Resolved {
	rgb: [number, number, number];
	alpha: number;
}

function applyMod(color: Resolved, [name, raw]: [string, number]): Resolved {
	const value = raw / 100_000;
	const [r, g, b] = color.rgb;
	switch (name) {
		case "alpha":
			return { ...color, alpha: clamp(value) };
		case "alphaMod":
			return { ...color, alpha: clamp(color.alpha * value) };
		case "lumMod":
		case "lumOff": {
			const [h, s, l] = rgbToHsl(color.rgb);
			const lum = name === "lumMod" ? l * value : l + value;
			return { ...color, rgb: hslToRgb([h, s, clamp(lum)]) };
		}
		case "satMod": {
			const [h, s, l] = rgbToHsl(color.rgb);
			return { ...color, rgb: hslToRgb([h, clamp(s * value), l]) };
		}
		case "tint":
			return {
				...color,
				rgb: [r, g, b].map((c) => Math.round(c + (255 - c) * (1 - value))) as [
					number,
					number,
					number,
				],
			};
		case "shade":
			return {
				...color,
				rgb: [r, g, b].map((c) => Math.round(c * value)) as [
					number,
					number,
					number,
				],
			};
		default:
			return color;
	}
}

/** The `RRGGBB` a scheme name stands for. */
export function schemeHex(name: string, palette: Palette): string {
	const mapped = palette.colorMap[name] ?? name;
	return palette.colors[mapped] ?? palette.colors[name] ?? "000000";
}

function resolve(color: Color, palette: Palette): Resolved {
	const base = color.scheme
		? schemeHex(color.scheme, palette)
		: (color.rgb ?? "000000");
	return (color.mods ?? []).reduce(applyMod, {
		rgb: toRgb(base),
		alpha: 1,
	});
}

export function cssColor(color: Color | undefined, palette: Palette): string {
	if (!color) {
		return "transparent";
	}
	const { rgb, alpha } = resolve(color, palette);
	// Comma syntax: the PDF export's SVG reader knows no other.
	return alpha >= 1
		? `rgb(${rgb.join(", ")})`
		: `rgba(${rgb.join(", ")}, ${Math.round(alpha * 1000) / 1000})`;
}

/** `#rrggbb` without alpha, for colour inputs. */
export function hexColor(color: Color | undefined, palette: Palette): string {
	if (!color) {
		return "#000000";
	}
	const { rgb } = resolve(color, palette);
	return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Relative luminance, for picking legible text over a colour. */
export function luminance(color: Color, palette: Palette): number {
	const [r, g, b] = resolve(color, palette).rgb.map((c) => {
		const s = c / 255;
		return s <= 0.039_28 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** A colour with its alpha replaced. */
export function withAlpha(color: Color, alpha: number): Color {
	const mods = (color.mods ?? []).filter(([name]) => name !== "alpha");
	return alpha >= 1
		? { ...color, mods: mods.length > 0 ? mods : undefined }
		: { ...color, mods: [...mods, ["alpha", Math.round(alpha * 100_000)]] };
}

export function rgbColor(hex: string): Color {
	return { rgb: hex.replace("#", "").toUpperCase() };
}

/** A fill as a CSS `background`, for HTML surfaces. */
export function cssBackground(
	fill: Fill | undefined,
	palette: Palette,
	image: (src: string) => string,
): string {
	if (!fill || fill.type === "none") {
		return "transparent";
	}
	if (fill.type === "solid") {
		return cssColor(fill.color, palette);
	}
	if (fill.type === "image") {
		return `center / cover no-repeat url("${image(fill.src)}")`;
	}
	const stops = fill.stops
		.map((stop) => `${cssColor(stop.color, palette)} ${stop.pos / 1000}%`)
		.join(", ");
	return fill.radial
		? `radial-gradient(closest-side, ${stops})`
		: // DrawingML measures from left-to-right, CSS from bottom-to-top.
			`linear-gradient(${fill.angle + 90}deg, ${stops})`;
}
