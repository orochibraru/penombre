/**
 * Applies the user's appearance preferences to the document.
 *
 * The whole theme hangs off three `data-*` attributes on <html>; `app.css`
 * redefines `--radius`, `--app-font` and the accent ramp from them, so nothing
 * downstream needs to know a preference exists.
 */

export interface ThemePreferences {
	fontFamily?: "mono" | "sans" | null;
	corners?: "boxy" | "rounded" | null;
	accent?: string | null;
}

export const ACCENTS = [
	"purple",
	"blue",
	"teal",
	"green",
	"amber",
	"rose",
] as const;

export type Accent = (typeof ACCENTS)[number];

/** The swatch shown in the picker, kept in step with `app.css`. */
export const ACCENT_SWATCH: Record<Accent, string> = {
	purple: "oklch(0.54 0.25 293)",
	blue: "oklch(0.52 0.2 262)",
	teal: "oklch(0.5 0.13 195)",
	green: "oklch(0.5 0.15 150)",
	amber: "oklch(0.55 0.16 65)",
	rose: "oklch(0.53 0.21 12)",
};

export function applyTheme(prefs: ThemePreferences | null | undefined): void {
	if (typeof document === "undefined") {
		return;
	}
	const root = document.documentElement;
	root.dataset.font = prefs?.fontFamily ?? "sans";
	root.dataset.corners = prefs?.corners ?? "rounded";
	root.dataset.accent = prefs?.accent ?? "purple";
}
