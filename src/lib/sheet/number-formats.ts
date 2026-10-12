import { formatValue } from "./format";
import { formatNumber, type Value } from "./values";

/**
 * Number formats: Excel's built-in ids, the presets the editor offers, and
 * the decimal buttons. Display itself is `formatValue`, TEXT's engine.
 */

/** Excel's built-in `numFmtId`s. The locale-dependent ones read as ISO. */
export const BUILTIN_FORMATS: Readonly<Record<number, string>> = {
	1: "0",
	2: "0.00",
	3: "#,##0",
	4: "#,##0.00",
	5: '"$"#,##0_);\\("$"#,##0\\)',
	6: '"$"#,##0_);[Red]\\("$"#,##0\\)',
	7: '"$"#,##0.00_);\\("$"#,##0.00\\)',
	8: '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)',
	9: "0%",
	10: "0.00%",
	11: "0.00E+00",
	12: "# ?/?",
	13: "# ??/??",
	14: "yyyy-mm-dd",
	15: "d-mmm-yy",
	16: "d-mmm",
	17: "mmm-yy",
	18: "h:mm AM/PM",
	19: "h:mm:ss AM/PM",
	20: "h:mm",
	21: "h:mm:ss",
	22: "yyyy-mm-dd h:mm",
	37: "#,##0 ;\\(#,##0\\)",
	38: "#,##0 ;[Red]\\(#,##0\\)",
	39: "#,##0.00;\\(#,##0.00\\)",
	40: "#,##0.00;[Red]\\(#,##0.00\\)",
	41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)',
	42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)',
	43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
	44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)',
	45: "mm:ss",
	46: "[h]:mm:ss",
	47: "mm:ss.0",
	48: "##0.0E+0",
	49: "@",
};

/** Ids whose meaning is the same in every locale, safe to write back. */
const PORTABLE = [1, 2, 3, 4, 9, 10, 11, 12, 13, 20, 21, 45, 46, 47, 48, 49];

/** The built-in id for a code, when one means exactly it. */
export function builtinId(code: string): number | undefined {
	return PORTABLE.find((id) => BUILTIN_FORMATS[id] === code);
}

/** Whether a code shows a date or a time rather than a number. */
export function isDateFormat(code: string | undefined): boolean {
	if (!code) {
		return false;
	}
	const plain = code.replace(/"[^"]*"|\\.|\[\$[^\]]*\]|\[[^\]hms]*\]/g, "");
	return /[ydhs]/i.test(plain) || (/m/i.test(plain) && !/[#0?]/.test(plain));
}

/** A value through a cell's format, or null when the format does not apply. */
export function formatted(
	value: Value,
	code: string | undefined,
): string | null {
	if (!code || typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}
	return formatValue(value, code);
}

// =========================================================================
// Presets
// =========================================================================

export interface Currency {
	symbol: string;
	/** Written after the number, with a space, as French and German do. */
	after: boolean;
	decimals: number;
}

export const CURRENCIES: Record<string, Currency> = {
	USD: { symbol: "$", after: false, decimals: 2 },
	EUR: { symbol: "€", after: true, decimals: 2 },
	GBP: { symbol: "£", after: false, decimals: 2 },
	JPY: { symbol: "¥", after: false, decimals: 0 },
	CNY: { symbol: "¥", after: false, decimals: 2 },
	KRW: { symbol: "₩", after: false, decimals: 0 },
	SEK: { symbol: "kr", after: true, decimals: 2 },
	PLN: { symbol: "zł", after: true, decimals: 2 },
	RUB: { symbol: "₽", after: true, decimals: 2 },
	CHF: { symbol: "CHF", after: false, decimals: 2 },
	INR: { symbol: "₹", after: false, decimals: 2 },
};

const LOCALE_CURRENCY: Record<string, string> = {
	en: "USD",
	fr: "EUR",
	de: "EUR",
	es: "EUR",
	it: "EUR",
	nl: "EUR",
	fi: "EUR",
	sv: "SEK",
	pl: "PLN",
	ru: "RUB",
	ja: "JPY",
	ko: "KRW",
	zh: "CNY",
};

const LOCALE_DATE: Record<string, string> = {
	en: "m/d/yyyy",
	fr: "dd/mm/yyyy",
	es: "dd/mm/yyyy",
	it: "dd/mm/yyyy",
	de: "dd.mm.yyyy",
	fi: "d.m.yyyy",
	pl: "dd.mm.yyyy",
	ru: "dd.mm.yyyy",
	nl: "d-m-yyyy",
	sv: "yyyy-mm-dd",
	ja: "yyyy/mm/dd",
	ko: "yyyy-mm-dd",
	zh: "yyyy/m/d",
};

export const localeCurrency = (locale: string): string =>
	LOCALE_CURRENCY[locale.slice(0, 2)] ?? "USD";

export const localeDate = (locale: string): string =>
	LOCALE_DATE[locale.slice(0, 2)] ?? "yyyy-mm-dd";

const quoted = (text: string) => `"${text.replaceAll('"', "")}"`;

/** `"$"#,##0.00` or `#,##0.00 "€"`, negatives with a minus. */
export function currencyFormat(code: string): string {
	const { symbol, after, decimals } = CURRENCIES[code] ?? {
		symbol: "$",
		after: false,
		decimals: 2,
	};
	const number = decimals > 0 ? `#,##0.${"0".repeat(decimals)}` : "#,##0";
	return after ? `${number}\\ ${quoted(symbol)}` : `${quoted(symbol)}${number}`;
}

/** Accounting: the symbol apart, negatives in parentheses, zero as a dash. */
export function accountingFormat(code: string): string {
	const { symbol, after, decimals } = CURRENCIES[code] ?? {
		symbol: "$",
		after: false,
		decimals: 2,
	};
	const number = decimals > 0 ? `#,##0.${"0".repeat(decimals)}` : "#,##0";
	const zero = decimals > 0 ? `"-"${"?".repeat(decimals)}` : '"-"';
	const sign = quoted(symbol);
	const wrap = (body: string) =>
		after ? `_(${body}\\ ${sign}_)` : `_(${sign}* ${body}_)`;
	return [
		wrap(number),
		wrap(`\\(${number}\\)`).replace(/_\)$/, ""),
		wrap(zero),
		"_(@_)",
	].join(";");
}

export type PresetId =
	| "automatic"
	| "plain"
	| "number"
	| "thousands"
	| "currency"
	| "accounting"
	| "percent"
	| "scientific"
	| "date"
	| "time"
	| "datetime"
	| "duration"
	| "text";

/** The menu's formats for a locale, in the menu's order. */
export function presets(locale: string): { id: PresetId; code?: string }[] {
	const currency = localeCurrency(locale);
	const date = localeDate(locale);
	return [
		{ id: "automatic" },
		{ id: "plain", code: "0" },
		{ id: "number", code: "0.00" },
		{ id: "thousands", code: "#,##0.00" },
		{ id: "currency", code: currencyFormat(currency) },
		{ id: "accounting", code: accountingFormat(currency) },
		{ id: "percent", code: "0.00%" },
		{ id: "scientific", code: "0.00E+00" },
		{ id: "date", code: date },
		{ id: "time", code: "h:mm:ss" },
		{ id: "datetime", code: `${date} h:mm:ss` },
		{ id: "duration", code: "[h]:mm:ss" },
		{ id: "text", code: "@" },
	];
}

// =========================================================================
// More and fewer decimals
// =========================================================================

/** One section's number placeholders given `delta` more (fewer) decimals. */
function shiftSection(section: string, delta: number): string {
	// Literals are blanked on a copy so their digits are never touched.
	const masked = section.replace(/"[^"]*"|\\.|\[[^\]]*\]|_.|\*./g, (m) =>
		" ".repeat(m.length),
	);
	const core = /[#0?,]*[#0?](?:\.[#0?]*)?|\.[#0?]+/.exec(masked);
	if (!core) {
		return section;
	}
	if (!/[#0]/.test(core[0])) {
		// Accounting's zero, `"-"??`: the question marks are its decimals.
		const marks = Math.max(0, core[0].length + delta);
		return (
			section.slice(0, core.index) +
			"?".repeat(marks) +
			section.slice(core.index + core[0].length)
		);
	}
	const [whole = "", fraction] = core[0].split(".");
	const digits = Math.max(0, (fraction?.length ?? 0) + delta);
	const body =
		digits > 0 ? `${whole || "0"}.${"0".repeat(digits)}` : whole || "0";
	return (
		section.slice(0, core.index) +
		body +
		section.slice(core.index + core[0].length)
	);
}

function splitSections(code: string): string[] {
	const out = [""];
	let quotedText = false;
	for (let i = 0; i < code.length; i++) {
		const char = code[i] ?? "";
		if (char === '"') {
			quotedText = !quotedText;
		}
		if (char === "\\" && !quotedText) {
			out[out.length - 1] += char + (code[i + 1] ?? "");
			i++;
			continue;
		}
		if (char === ";" && !quotedText) {
			out.push("");
			continue;
		}
		out[out.length - 1] += char;
	}
	return out;
}

/**
 * The format after the decimal buttons. A General cell starts from the
 * decimals its value shows, as Sheets does; dates and text are left alone.
 */
export function shiftDecimals(
	code: string | undefined,
	delta: number,
	value: Value,
): string | undefined {
	if (!code) {
		if (typeof value !== "number") {
			return code;
		}
		const shown = formatNumber(value).split(".")[1]?.length ?? 0;
		const digits = Math.max(0, shown + delta);
		return digits > 0 ? `0.${"0".repeat(digits)}` : "0";
	}
	if (isDateFormat(code) || /^@$/.test(code)) {
		return code;
	}
	return splitSections(code)
		.map((section) =>
			/@/.test(section.replace(/"[^"]*"/g, "")) && !/[#0?]/.test(section)
				? section
				: shiftSection(section, delta),
		)
		.join(";");
}
