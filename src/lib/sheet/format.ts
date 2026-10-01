import { formatNumber, utcFromSerial } from "./values";

/**
 * TEXT's format codes: the common number patterns (`0`, `0.00`, `#,##0`,
 * `0%`, `"$"#,##0.00`, sections split by `;`) and date patterns (`yyyy-mm-dd`,
 * `dd/mm/yyyy`, `mmm d`, `hh:mm AM/PM`). Month and day names are English, as
 * a format code carries no locale of its own.
 */

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const WEEKDAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/** Splits on `;` outside quotes. */
function sections(format: string): string[] {
	const out: string[] = [""];
	let quoted = false;
	for (let i = 0; i < format.length; i++) {
		const char = format[i] ?? "";
		if (char === '"') {
			quoted = !quoted;
		}
		if (char === "\\" && !quoted) {
			out[out.length - 1] += char + (format[i + 1] ?? "");
			i++;
			continue;
		}
		if (char === ";" && !quoted) {
			out.push("");
			continue;
		}
		out[out.length - 1] += char;
	}
	return out;
}

/** The literal text of a pattern fragment: quotes, escapes and `_x` padding. */
function literalText(fragment: string): string {
	return fragment
		.replace(/\[[^\]]*\]/g, "")
		.replace(/"([^"]*)"|\\(.)|_.|\*./g, (_, quoted, escaped) =>
			quoted === undefined ? (escaped ?? " ") : quoted,
		);
}

const unquoted = (pattern: string) =>
	pattern.replace(/"[^"]*"|\\.|\[[^\]]*\]/g, "");

function group(digits: string): string {
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberPattern(value: number, pattern: string): string {
	const plain = unquoted(pattern);
	const n = value * 100 ** (plain.match(/%/g)?.length ?? 0);
	// Found on a copy with quoted text blanked, so a quoted digit is literal.
	const masked = pattern.replace(/"[^"]*"|\\.|\[[^\]]*\]/g, (m) =>
		" ".repeat(m.length),
	);
	const core = /[#0?,.]*[#0?][#0?,.]*/.exec(masked);
	if (!core) {
		return literalText(pattern);
	}
	const [whole = "", fraction] = core[0].split(".");
	const decimals = fraction?.replace(/[^#0?]/g, "").length ?? 0;
	const required = fraction?.replace(/[^0]/g, "").length ?? 0;
	// Rounded half away from zero on the decimal value, not the binary one.
	const scale = 10 ** decimals;
	const rounded =
		Math.round(Number((Math.abs(n) * scale).toPrecision(15))) / scale;
	const [int = "", frac = ""] = rounded.toFixed(decimals).split(".");
	let digits = frac;
	while (digits.length > required && digits.endsWith("0")) {
		digits = digits.slice(0, -1);
	}
	let integer = int.padStart(whole.replace(/[^0]/g, "").length, "0");
	if (!whole.includes("0") && integer === "0") {
		integer = "";
	}
	if (whole.includes(",")) {
		integer = group(integer);
	}
	const body = digits ? `${integer}.${digits}` : integer;
	return (
		literalText(pattern.slice(0, core.index)) +
		body +
		literalText(pattern.slice(core.index + core[0].length))
	);
}

const DATE_TOKEN = /"[^"]*"|\\.|\[[^\]]*\]|am\/pm|a\/p|y+|m+|d+|h+|s+|./gi;

function pad(n: number, width = 2): string {
	return String(n).padStart(width, "0");
}

function datePattern(serial: number, pattern: string): string {
	const date = utcFromSerial(serial);
	const tokens = pattern.match(DATE_TOKEN) ?? [];
	const twelve = tokens.some((token) => /^(am\/pm|a\/p)$/i.test(token));
	const hours = date.getUTCHours();
	const lower = tokens.map((token) => token.toLowerCase());
	const isMinute = (i: number) =>
		lower
			.slice(0, i)
			.findLast((t) => /^[hdys]/.test(t))
			?.startsWith("h") ||
		lower
			.slice(i + 1)
			.find((t) => /^[hdyms]/.test(t))
			?.startsWith("s");

	return tokens
		.map((token, i) => {
			const t = lower[i] ?? "";
			switch (t[0]) {
				case "y":
					return t.length > 2
						? String(date.getUTCFullYear())
						: pad(date.getUTCFullYear() % 100);
				case "m": {
					if (t.length <= 2 && isMinute(i)) {
						return t.length === 2
							? pad(date.getUTCMinutes())
							: String(date.getUTCMinutes());
					}
					const month = date.getUTCMonth();
					const name = MONTHS[month] ?? "";
					return [
						String(month + 1),
						pad(month + 1),
						name.slice(0, 3),
						name,
						name.slice(0, 1),
					][Math.min(t.length, 5) - 1];
				}
				case "d": {
					const day = WEEKDAYS[date.getUTCDay()] ?? "";
					return [
						String(date.getUTCDate()),
						pad(date.getUTCDate()),
						day.slice(0, 3),
						day,
					][Math.min(t.length, 4) - 1];
				}
				case "h": {
					const h = twelve ? hours % 12 || 12 : hours;
					return t.length > 1 ? pad(h) : String(h);
				}
				case "s":
					return t.length > 1
						? pad(date.getUTCSeconds())
						: String(date.getUTCSeconds());
				default:
					if (t === "am/pm" || t === "a/p") {
						const pm = hours >= 12;
						const text = t === "a/p" ? (pm ? "P" : "A") : pm ? "PM" : "AM";
						return token === token.toLowerCase() ? text.toLowerCase() : text;
					}
					return literalText(token);
			}
		})
		.join("");
}

const isDatePattern = (pattern: string) => {
	const plain = unquoted(pattern);
	return /[ydhs]/i.test(plain) || (/m/i.test(plain) && !/[#0?]/.test(plain));
};

/** A number through a format code, as TEXT(value, format) shows it. */
export function formatValue(value: number, format: string): string {
	if (/^general$/i.test(format.trim())) {
		return formatNumber(value);
	}
	const parts = sections(format);
	let pattern = parts[0] ?? "";
	let n = value;
	if (value < 0 && parts[1] !== undefined) {
		pattern = parts[1];
		n = -value;
	} else if (value === 0 && parts[2] !== undefined) {
		pattern = parts[2];
	}
	if (isDatePattern(pattern)) {
		return datePattern(n, pattern);
	}
	const body = numberPattern(n, pattern);
	return n < 0 && /[#0?]/.test(unquoted(pattern)) ? `-${body}` : body;
}
