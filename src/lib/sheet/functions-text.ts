import { formatValue } from "./format";
import {
	type Args,
	cells,
	num,
	type SheetFunction,
	scalar,
	text,
} from "./functions";
import {
	literal,
	NUM,
	serialFromUtc,
	toBool,
	toNumber,
	toText,
	utcFromSerial,
	VALUE,
	wildcard,
} from "./values";

/** Text and date functions. Dates are serial numbers, as in Excel. */

const substitute: SheetFunction = (a) => {
	const source = text(a, 0);
	const find = text(a, 1);
	const replacement = text(a, 2);
	if (find === "") {
		return source;
	}
	if (a[3] === undefined) {
		return source.split(find).join(replacement);
	}
	const nth = Math.trunc(num(a, 3));
	if (nth < 1) {
		throw VALUE;
	}
	let at = -1;
	for (let i = 0; i < nth; i++) {
		at = source.indexOf(find, at + 1);
		if (at < 0) {
			return source;
		}
	}
	return source.slice(0, at) + replacement + source.slice(at + find.length);
};

/** FIND and SEARCH: 1-based position of a needle, from `start`. */
function locate(a: Args, fuzzy: boolean): number {
	const needle = text(a, 0);
	const haystack = text(a, 1);
	const start = Math.trunc(num(a, 2, 1));
	if (start < 1 || start > haystack.length + 1) {
		throw VALUE;
	}
	let at: number;
	if (fuzzy) {
		const pattern = new RegExp(wildcard(needle).source.slice(1, -1), "i");
		const match = pattern.exec(haystack.slice(start - 1));
		at = match ? match.index + start - 1 : -1;
	} else {
		at = haystack.indexOf(needle, start - 1);
	}
	if (at < 0) {
		throw VALUE;
	}
	return at + 1;
}

const TEXT: Record<string, SheetFunction> = {
	CONCAT: (a) => a.flatMap(cells).map(toText).join(""),
	CONCATENATE: (a) => a.map((_, i) => text(a, i)).join(""),
	TEXTJOIN: (a) => {
		const delimiter = text(a, 0);
		const skipEmpty = a[1] !== undefined && toBool(scalar(a[1]));
		return a
			.slice(2)
			.flatMap(cells)
			.map(toText)
			.filter((part) => !(skipEmpty && part === ""))
			.join(delimiter);
	},
	LEN: (a) => text(a, 0).length,
	UPPER: (a) => text(a, 0).toUpperCase(),
	LOWER: (a) => text(a, 0).toLowerCase(),
	PROPER: (a) =>
		text(a, 0)
			.toLowerCase()
			.replace(
				/(^|[^\p{L}])(\p{L})/gu,
				(_, before, letter) => before + letter.toUpperCase(),
			),
	TRIM: (a) => text(a, 0).trim().replace(/ +/g, " "),
	LEFT: (a) => {
		const count = num(a, 1, 1);
		if (count < 0) {
			throw VALUE;
		}
		return text(a, 0).slice(0, count);
	},
	RIGHT: (a) => {
		const count = num(a, 1, 1);
		if (count < 0) {
			throw VALUE;
		}
		return count === 0 ? "" : text(a, 0).slice(-count);
	},
	MID: (a) => {
		const start = Math.trunc(num(a, 1));
		const count = Math.trunc(num(a, 2));
		if (start < 1 || count < 0) {
			throw VALUE;
		}
		return text(a, 0).slice(start - 1, start - 1 + count);
	},
	SUBSTITUTE: substitute,
	REPLACE: (a) => {
		const source = text(a, 0);
		const start = Math.trunc(num(a, 1));
		const count = Math.trunc(num(a, 2));
		if (start < 1 || count < 0) {
			throw VALUE;
		}
		return (
			source.slice(0, start - 1) + text(a, 3) + source.slice(start - 1 + count)
		);
	},
	FIND: (a) => locate(a, false),
	SEARCH: (a) => locate(a, true),
	REPT: (a) => {
		const times = Math.trunc(num(a, 1));
		if (times < 0) {
			throw VALUE;
		}
		return text(a, 0).repeat(times);
	},
	EXACT: (a) => text(a, 0) === text(a, 1),
	VALUE: (a) => {
		const value = scalar(a[0]);
		if (typeof value !== "string") {
			return toNumber(value);
		}
		// `1,234.50` and `$1,234.50`: separators and a leading currency sign.
		const plain = value.trim().replace(/^[$€£¥]/, "");
		return toNumber(
			/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(plain)
				? plain.replace(/,/g, "")
				: plain,
		);
	},
	TEXT: (a) => {
		const value = scalar(a[0]);
		const format = text(a, 1);
		if (typeof value === "string" && typeof literal(value) !== "number") {
			return value;
		}
		return formatValue(toNumber(value), format);
	},
};

// =========================================================================
// Dates
// =========================================================================

const day = (serial: number) => utcFromSerial(Math.floor(serial));

function dateSerial(year: number, month: number, date: number): number {
	// Excel reads a year under 1900 as an offset from 1900.
	const y = year < 1900 ? year + 1900 : year;
	const serial = serialFromUtc(Date.UTC(y, month - 1, date));
	if (serial < 0) {
		throw NUM;
	}
	return serial;
}

/** `months` after the date, clamped to the end of a shorter month. */
function addMonths(serial: number, months: number, lastDay: boolean): number {
	const start = day(serial);
	const year = start.getUTCFullYear();
	const month = start.getUTCMonth() + Math.trunc(months);
	const end = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const date = lastDay ? end : Math.min(start.getUTCDate(), end);
	return serialFromUtc(Date.UTC(year, month, date));
}

const WEEKDAY_OFFSETS: Record<number, [number, number]> = {
	1: [0, 1],
	2: [6, 1],
	3: [6, 0],
};

const DATES: Record<string, SheetFunction> = {
	TODAY: () => {
		const now = new Date();
		return serialFromUtc(
			Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
		);
	},
	NOW: () =>
		serialFromUtc(Date.now() - new Date().getTimezoneOffset() * 60_000),
	DATE: (a) =>
		dateSerial(
			Math.trunc(num(a, 0)),
			Math.trunc(num(a, 1)),
			Math.trunc(num(a, 2)),
		),
	YEAR: (a) => day(num(a, 0)).getUTCFullYear(),
	MONTH: (a) => day(num(a, 0)).getUTCMonth() + 1,
	DAY: (a) => day(num(a, 0)).getUTCDate(),
	HOUR: (a) => utcFromSerial(num(a, 0)).getUTCHours(),
	MINUTE: (a) => utcFromSerial(num(a, 0)).getUTCMinutes(),
	SECOND: (a) => utcFromSerial(num(a, 0)).getUTCSeconds(),
	WEEKDAY: (a) => {
		const offsets = WEEKDAY_OFFSETS[Math.trunc(num(a, 1, 1))];
		if (!offsets) {
			throw NUM;
		}
		const [shift, base] = offsets;
		return ((day(num(a, 0)).getUTCDay() + shift) % 7) + base;
	},
	EDATE: (a) => addMonths(num(a, 0), num(a, 1), false),
	EOMONTH: (a) => addMonths(num(a, 0), num(a, 1), true),
	DAYS: (a) => Math.floor(num(a, 0)) - Math.floor(num(a, 1)),
	DATEVALUE: (a) => {
		const serial = literal(text(a, 0));
		if (typeof serial !== "number") {
			throw VALUE;
		}
		return Math.floor(serial);
	},
};

export const TEXT_FUNCTIONS: Record<string, SheetFunction> = {
	...TEXT,
	...DATES,
};
