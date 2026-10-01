import { FUNCTION_NAMES } from "../formula";

/**
 * What the formula autocomplete offers: every function's one-line signature,
 * and where in a formula being typed a function name is.
 */

export const SIGNATURES: Record<string, string> = {
	ABS: "ABS(number)",
	AND: "AND(logical1, [logical2], …)",
	AVERAGE: "AVERAGE(number1, [number2], …)",
	AVERAGEIF: "AVERAGEIF(range, criterion, [average_range])",
	AVERAGEIFS: "AVERAGEIFS(average_range, range1, criterion1, …)",
	CEILING: "CEILING(number, [significance])",
	CHOOSE: "CHOOSE(index, value1, [value2], …)",
	CONCAT: "CONCAT(text1, [text2], …)",
	CONCATENATE: "CONCATENATE(text1, [text2], …)",
	COUNT: "COUNT(value1, [value2], …)",
	COUNTA: "COUNTA(value1, [value2], …)",
	COUNTBLANK: "COUNTBLANK(range)",
	COUNTIF: "COUNTIF(range, criterion)",
	COUNTIFS: "COUNTIFS(range1, criterion1, [range2, criterion2], …)",
	DATE: "DATE(year, month, day)",
	DATEVALUE: "DATEVALUE(text)",
	DAY: "DAY(date)",
	DAYS: "DAYS(end_date, start_date)",
	EDATE: "EDATE(start_date, months)",
	EOMONTH: "EOMONTH(start_date, months)",
	EXACT: "EXACT(text1, text2)",
	EXP: "EXP(number)",
	FALSE: "FALSE()",
	FIND: "FIND(find_text, within_text, [start])",
	FLOOR: "FLOOR(number, [significance])",
	HLOOKUP: "HLOOKUP(value, range, row, [approximate])",
	HOUR: "HOUR(time)",
	IF: "IF(test, value_if_true, [value_if_false])",
	IFERROR: "IFERROR(value, value_if_error)",
	IFNA: "IFNA(value, value_if_na)",
	IFS: "IFS(test1, value1, [test2, value2], …)",
	INDEX: "INDEX(range, row, [column])",
	INT: "INT(number)",
	ISBLANK: "ISBLANK(value)",
	ISERR: "ISERR(value)",
	ISERROR: "ISERROR(value)",
	ISLOGICAL: "ISLOGICAL(value)",
	ISNA: "ISNA(value)",
	ISNUMBER: "ISNUMBER(value)",
	ISTEXT: "ISTEXT(value)",
	LARGE: "LARGE(range, k)",
	LEFT: "LEFT(text, [count])",
	LEN: "LEN(text)",
	LN: "LN(number)",
	LOG: "LOG(number, [base])",
	LOG10: "LOG10(number)",
	LOWER: "LOWER(text)",
	MATCH: "MATCH(value, range, [match_type])",
	MAX: "MAX(number1, [number2], …)",
	MAXIFS: "MAXIFS(max_range, range1, criterion1, …)",
	MEDIAN: "MEDIAN(number1, [number2], …)",
	MID: "MID(text, start, count)",
	MIN: "MIN(number1, [number2], …)",
	MINIFS: "MINIFS(min_range, range1, criterion1, …)",
	MINUTE: "MINUTE(time)",
	MOD: "MOD(number, divisor)",
	MONTH: "MONTH(date)",
	NA: "NA()",
	NOT: "NOT(logical)",
	NOW: "NOW()",
	OR: "OR(logical1, [logical2], …)",
	PI: "PI()",
	POWER: "POWER(number, power)",
	PRODUCT: "PRODUCT(number1, [number2], …)",
	PROPER: "PROPER(text)",
	RAND: "RAND()",
	RANDBETWEEN: "RANDBETWEEN(low, high)",
	RANK: "RANK(number, range, [ascending])",
	"RANK.EQ": "RANK.EQ(number, range, [ascending])",
	REPLACE: "REPLACE(text, start, count, new_text)",
	REPT: "REPT(text, times)",
	RIGHT: "RIGHT(text, [count])",
	ROUND: "ROUND(number, [digits])",
	ROUNDDOWN: "ROUNDDOWN(number, [digits])",
	ROUNDUP: "ROUNDUP(number, [digits])",
	SEARCH: "SEARCH(find_text, within_text, [start])",
	SECOND: "SECOND(time)",
	SIGN: "SIGN(number)",
	SMALL: "SMALL(range, k)",
	SQRT: "SQRT(number)",
	STDEV: "STDEV(number1, [number2], …)",
	"STDEV.P": "STDEV.P(number1, [number2], …)",
	"STDEV.S": "STDEV.S(number1, [number2], …)",
	SUBSTITUTE: "SUBSTITUTE(text, old_text, new_text, [instance])",
	SUM: "SUM(number1, [number2], …)",
	SUMIF: "SUMIF(range, criterion, [sum_range])",
	SUMIFS: "SUMIFS(sum_range, range1, criterion1, …)",
	SUMPRODUCT: "SUMPRODUCT(range1, [range2], …)",
	SWITCH: "SWITCH(value, case1, result1, …, [default])",
	TEXT: "TEXT(value, format)",
	TEXTJOIN: "TEXTJOIN(delimiter, ignore_empty, text1, …)",
	TODAY: "TODAY()",
	TRIM: "TRIM(text)",
	TRUE: "TRUE()",
	TRUNC: "TRUNC(number, [digits])",
	UPPER: "UPPER(text)",
	VALUE: "VALUE(text)",
	VAR: "VAR(number1, [number2], …)",
	"VAR.P": "VAR.P(number1, [number2], …)",
	"VAR.S": "VAR.S(number1, [number2], …)",
	VLOOKUP: "VLOOKUP(value, range, column, [approximate])",
	WEEKDAY: "WEEKDAY(date, [type])",
	XLOOKUP:
		"XLOOKUP(value, lookup_range, return_range, [if_not_found], [match_mode], [search_mode])",
	XOR: "XOR(logical1, [logical2], …)",
	YEAR: "YEAR(date)",
};

export interface Completion {
	/** Where the name being typed starts and ends in the text. */
	start: number;
	end: number;
	names: string[];
}

/** How many suggestions the popup lists at most. */
const LIMIT = 8;

/** Whether `caret` sits inside a string literal of the formula. */
const inString = (before: string) =>
	(before.match(/"/g)?.length ?? 0) % 2 === 1;

/** The function names that complete what is typed at `caret`, if any. */
export function completionAt(text: string, caret: number): Completion | null {
	if (!text.startsWith("=")) {
		return null;
	}
	const before = text.slice(0, caret);
	const typed = /[A-Za-z_][\w.]*$/.exec(before);
	if (!typed || inString(before)) {
		return null;
	}
	const start = caret - typed[0].length;
	// Part of a reference (`$A`, `Sheet1!A`, `A1:B`), not a name.
	if (/[\w$!:'.]/.test(text[start - 1] ?? "")) {
		return null;
	}
	const rest = /^[\w.]*/.exec(text.slice(caret))?.[0] ?? "";
	const end = caret + rest.length;
	if (text[end] === "(") {
		return null;
	}
	const prefix = typed[0].toUpperCase();
	const names = FUNCTION_NAMES.filter((name) => name.startsWith(prefix)).slice(
		0,
		LIMIT,
	);
	return names.length > 0 ? { start, end, names } : null;
}

/** The text with a suggestion accepted, and where the caret goes. */
export function complete(
	text: string,
	completion: Completion,
	name: string,
): { text: string; caret: number } {
	const after = text.slice(completion.end);
	const next = `${text.slice(0, completion.start)}${name}(${after}`;
	return { text: next, caret: completion.start + name.length + 1 };
}

/** The signature of the function whose arguments the caret is in. */
export function signatureAt(text: string, caret: number): string | null {
	if (!text.startsWith("=")) {
		return null;
	}
	const open: string[] = [];
	const pattern = /"(?:[^"]|"")*"?|([A-Za-z_][\w.]*)\(|\(|\)/g;
	const before = text.slice(0, caret);
	for (const match of before.matchAll(pattern)) {
		const token = match[0];
		if (token.startsWith('"')) {
			if (!token.endsWith('"') || token.length === 1) {
				// An unclosed string: the caret is inside it.
				return null;
			}
			continue;
		}
		if (token === ")") {
			open.pop();
		} else {
			open.push((match[1] ?? "").toUpperCase());
		}
	}
	const name = open.at(-1);
	return name ? (SIGNATURES[name] ?? null) : null;
}
