/**
 * The interface languages, as `project.inlang/settings.json` declares them.
 * Plain data, so the preferences contract and the schema can name them
 * without loading paraglide's generated runtime.
 */
export const LANGUAGES = [
	"en",
	"fr",
	"es",
	"de",
	"it",
	"nl",
	"sv",
	"fi",
	"pl",
	"ru",
	"ja",
	"ko",
	"zh",
] as const;
export type Language = (typeof LANGUAGES)[number];
