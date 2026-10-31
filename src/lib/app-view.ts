/**
 * The web app inside the mobile app's in-app browser: `?app=light|dark` on
 * any page. The query only reaches the first page, so the server keeps the
 * choice in a session cookie for every page navigated to from there; `?app=0`
 * clears it.
 */
export const APP_VIEW_COOKIE = "penombre-app";

export type AppView = "light" | "dark";

interface CookieReader {
	get(name: string): string | undefined;
}

const parse = (value: string | null | undefined): AppView | null =>
	value === "light" || value === "dark" ? value : null;

/** What the query asks for: a theme, `off`, or nothing. */
export function appViewQuery(url: URL): AppView | "off" | null {
	const value = url.searchParams.get("app");
	if (value === null) {
		return null;
	}
	if (value === "0" || value === "off") {
		return "off";
	}
	return (
		parse(value) ??
		(url.searchParams.get("theme") === "dark" ? "dark" : "light")
	);
}

/** The app view this request renders in, if any. */
export function appView(url: URL, cookies: CookieReader): AppView | null {
	const asked = appViewQuery(url);
	if (asked === "off") {
		return null;
	}
	return asked ?? parse(cookies.get(APP_VIEW_COOKIE));
}
