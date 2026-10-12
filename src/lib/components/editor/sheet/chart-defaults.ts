import { CATEGORICAL } from "#lib/chart/render.js";
import { m } from "#lib/paraglide/messages.js";

/** A series with no name, as the legend calls it. */
export const seriesLabel = (n: number): string =>
	m.chart_series_default({ n: String(n) });

/** Any CSS colour as `#rrggbb`, by painting it: `--primary` may be oklch. */
function toHex(css: string, context: CanvasRenderingContext2D): string | null {
	context.clearRect(0, 0, 1, 1);
	context.fillStyle = "#000000";
	context.fillStyle = css;
	context.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
	return a === 0
		? null
		: `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The colours on screen for new series, as hex: the accent, then the
 * categorical slots for the current mode. Written into the file, so Excel,
 * Google Sheets and LibreOffice show what was seen here.
 */
export function chartPalette(): string[] {
	if (typeof document === "undefined") {
		return CATEGORICAL.light;
	}
	const root = document.documentElement;
	const slots = root.classList.contains("dark")
		? CATEGORICAL.dark
		: CATEGORICAL.light;
	const context = document
		.createElement("canvas")
		.getContext("2d", { willReadFrequently: true });
	const accent = getComputedStyle(root).getPropertyValue("--primary").trim();
	const hex = context && accent ? toHex(accent, context) : null;
	return hex ? [hex, ...slots] : slots;
}
