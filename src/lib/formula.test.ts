import { describe, expect, it } from "bun:test";
import {
	adjustFormula,
	createSheet,
	createWorkbook,
	display,
	fromFileFormula,
	normalizeFormula,
	renameSheetRefs,
	shiftFormula,
	toFileFormula,
} from "./formula";

/** What the grid shows for the cell at `row`, `col` of `grid`. */
function run(grid: string[][], row = 0, col = 0): string {
	return createWorkbook([{ name: "Sheet1", rows: grid }]).shown(0, row, col);
}

/** Evaluates `formula` in A1 of a sheet whose later rows are `grid`. */
const calc = (formula: string, grid: string[][] = []) =>
	run([[formula], ...grid]);

/** Evaluates `formula` in A1, with `columns` beside it from B1 down. */
function beside(formula: string, columns: string[][]): string {
	const rows = columns.map((values, i) => [i === 0 ? formula : "", ...values]);
	return run(rows.length > 0 ? rows : [[formula]]);
}

describe("formulas", () => {
	it("does arithmetic with precedence, powers and percent", () => {
		expect(calc("=1+2*3")).toBe("7");
		expect(calc("=(1+2)*3")).toBe("9");
		expect(calc("=-2^2")).toBe("4");
		expect(calc("=2^3^2")).toBe("64");
		expect(calc("=50%*10")).toBe("5");
		expect(calc("=0.1+0.2")).toBe("0.3");
	});

	it("reads references and ranges", () => {
		const grid = [["=SUM(B1:B3)", "1"], ["", "2"], ["", "x"], ["=A1*2+B2"]];
		expect(run(grid)).toBe("3");
		expect(run(grid, 3, 0)).toBe("8");
	});

	it("reads whole columns and rows, stopping at the data", () => {
		const grid = [
			["=SUM(B:B)", "1", "2"],
			["", "3", "4"],
			["=SUM(2:2)"],
			["=COUNTA($B:$C)"],
		];
		expect(run(grid)).toBe("4");
		expect(run(grid, 2, 0)).toBe("7");
		expect(run(grid, 3, 0)).toBe("4");
	});

	it("treats a reference to a blank as zero", () => {
		expect(run([["=B1+1"]])).toBe("1");
		expect(run([["=B1"]])).toBe("0");
		expect(run([["=B1=0"]])).toBe("TRUE");
	});

	it("reports errors like a spreadsheet", () => {
		expect(calc("=1/0")).toBe("#DIV/0!");
		expect(calc('="a"+1')).toBe("#VALUE!");
		expect(calc("=NOPE(1)")).toBe("#NAME?");
		expect(calc("=Rate*2")).toBe("#NAME?");
		expect(calc("=1+")).toBe("#ERROR!");
		expect(calc("=#REF!+1")).toBe("#REF!");
		expect(calc("=SQRT(-1)")).toBe("#NUM!");
		expect(run([["=B1", "=A1"]])).toBe("#CYCLE!");
		expect(run([["=A1"]])).toBe("#CYCLE!");
	});

	it("propagates an error through what depends on it", () => {
		expect(run([["=B1+1", "=1/0"]])).toBe("#DIV/0!");
		expect(run([["=IFERROR(B1,0)", "=1/0"]])).toBe("0");
		expect(
			run([
				["=SUM(B1:B2)", "1", ""],
				["", "#N/A"],
			]),
		).toBe("#N/A");
	});

	it("only evaluates the branch IF takes", () => {
		expect(run([['=IF(B1=0,"none",1/B1)', "0"]])).toBe("none");
		expect(run([['=IF(B1=0,"none",A1)', "0"]])).toBe("none");
		expect(calc("=IF(FALSE,1)")).toBe("FALSE");
		expect(calc("=IF(TRUE,,1)")).toBe("0");
	});

	it("compares like Excel: numbers before text before booleans", () => {
		expect(calc('=IF(2>1,"yes","no")')).toBe("yes");
		expect(calc('="A"="a"')).toBe("TRUE");
		expect(calc('=5<"a"')).toBe("TRUE");
		expect(calc('="10"<9')).toBe("FALSE");
		expect(calc("=TRUE>1")).toBe("TRUE");
		expect(calc("=AND(TRUE,1<>1)")).toBe("FALSE");
		expect(calc("=NOT(OR(FALSE,0))")).toBe("TRUE");
		expect(calc("=XOR(TRUE,FALSE,TRUE)")).toBe("FALSE");
	});

	it("aggregates, skipping text in ranges", () => {
		const b = [["3"], ["hello"], ["5"], [""]];
		expect(beside("=SUM(B1:B4)", b)).toBe("8");
		expect(beside("=SUM(B2)", b)).toBe("0");
		expect(beside("=AVERAGE(B1:B4)", b)).toBe("4");
		expect(beside("=COUNT(B1:B4)", b)).toBe("2");
		expect(beside('=COUNT(B1:B4,1,"2","x")', b)).toBe("4");
		expect(beside("=COUNTA(B1:B4)", b)).toBe("3");
		expect(beside("=COUNTBLANK(B1:B4)", b)).toBe("1");
		expect(beside("=MIN(B1:B4)", b)).toBe("3");
		expect(beside("=MAX(B1:B4,10)", b)).toBe("10");
		expect(beside("=MEDIAN(B1:B4,1)", b)).toBe("3");
		expect(beside("=PRODUCT(B1:B4)", b)).toBe("15");
	});

	it("handles statistics", () => {
		const b = [["2"], ["4"], ["4"], ["4"], ["5"], ["5"], ["7"], ["9"]];
		expect(beside("=STDEV.P(B1:B8)", b)).toBe("2");
		expect(beside("=VAR.P(B1:B8)", b)).toBe("4");
		expect(beside("=VAR.S(B1:B8)", b)).toBe("4.57142857143");
		expect(beside("=VAR(B1:B8)", b)).toBe("4.57142857143");
		expect(beside("=ROUND(STDEV(B1:B8),4)", b)).toBe("2.1381");
		expect(beside("=ROUND(STDEV.S(B1:B8),4)", b)).toBe("2.1381");
		expect(beside("=LARGE(B1:B8,2)", b)).toBe("7");
		expect(beside("=SMALL(B1:B8,1)", b)).toBe("2");
		expect(beside("=SMALL(B1:B8,9)", b)).toBe("#NUM!");
		expect(beside("=RANK(5,B1:B8)", b)).toBe("3");
		expect(beside("=RANK(5,B1:B8,1)", b)).toBe("5");
		expect(beside("=RANK(6,B1:B8)", b)).toBe("#N/A");
		expect(calc("=STDEV(1)")).toBe("#DIV/0!");
	});

	it("counts and sums on conditions", () => {
		const b = [
			["apple", "3", "x"],
			["pear", "5", "y"],
			["apple", "7", "y"],
			["Apricot", "", "y"],
		];
		expect(beside('=COUNTIF(B1:B4,"apple")', b)).toBe("2");
		expect(beside('=COUNTIF(B1:B4,"ap*")', b)).toBe("3");
		expect(beside('=COUNTIF(C1:C4,">3")', b)).toBe("2");
		expect(beside('=COUNTIF(C1:C4,"")', b)).toBe("1");
		expect(beside('=COUNTIF(C1:C4,"<>")', b)).toBe("3");
		expect(beside('=SUMIF(B1:B4,"apple",C1:C4)', b)).toBe("10");
		expect(beside('=SUMIF(C1:C4,"<>5")', b)).toBe("10");
		expect(beside('=AVERAGEIF(B1:B4,"apple",C1:C4)', b)).toBe("5");
		expect(beside('=SUMIFS(C1:C4,B1:B4,"apple",D1:D4,"y")', b)).toBe("7");
		expect(beside('=COUNTIFS(B1:B4,"a*",D1:D4,"y")', b)).toBe("2");
		expect(beside('=AVERAGEIFS(C1:C4,D1:D4,"y")', b)).toBe("6");
		expect(beside('=MAXIFS(C1:C4,B1:B4,"apple")', b)).toBe("7");
		expect(beside('=MINIFS(C1:C4,B1:B4,"apple")', b)).toBe("3");
		expect(beside('=MINIFS(C1:C4,B1:B4,"kiwi")', b)).toBe("0");
		expect(beside('=SUMIFS(C1:C4,B1:B3,"apple")', b)).toBe("#VALUE!");
		expect(beside('=AVERAGEIFS(C1:C4,B1:B4,"kiwi")', b)).toBe("#DIV/0!");
		expect(beside("=SUMPRODUCT(C1:C4,C1:C4)", b)).toBe("83");
		expect(beside("=SUMPRODUCT(C1:C4,C1:C3)", b)).toBe("#VALUE!");
	});

	it("handles text", () => {
		expect(calc('=CONCAT("a",1,TRUE)')).toBe("a1TRUE");
		expect(calc('=CONCATENATE("a","b")')).toBe("ab");
		expect(calc('="x"&2')).toBe("x2");
		expect(calc('=LEFT("hello",2)&MID("hello",2,3)&RIGHT("hello")')).toBe(
			"heello",
		);
		expect(calc('=UPPER(TRIM("  a   b "))')).toBe("A B");
		expect(calc('=LOWER("AbC")')).toBe("abc");
		expect(calc('=PROPER("hello wORLD o\'neil")')).toBe("Hello World O'Neil");
		expect(calc('=LEN("four")')).toBe("4");
		expect(calc('=SUBSTITUTE("a-b-c","-","+")')).toBe("a+b+c");
		expect(calc('=SUBSTITUTE("a-b-c","-","+",2)')).toBe("a-b+c");
		expect(calc('=FIND("b","abcb")')).toBe("2");
		expect(calc('=FIND("b","abcb",3)')).toBe("4");
		expect(calc('=FIND("B","abc")')).toBe("#VALUE!");
		expect(calc('=SEARCH("B","abc")')).toBe("2");
		expect(calc('=SEARCH("c?e","abcdef")')).toBe("3");
		expect(calc('=REPLACE("abcdef",2,3,"X")')).toBe("aXef");
		expect(calc('=REPT("ab",3)')).toBe("ababab");
		expect(calc('=EXACT("a","A")')).toBe("FALSE");
		expect(
			calc('=TEXTJOIN(", ",TRUE,B2:B4)', [
				["", "a"],
				["", ""],
				["", "c"],
			]),
		).toBe("a, c");
		expect(calc('=TEXTJOIN("-",FALSE,"a","","b")')).toBe("a--b");
		expect(calc('=VALUE("1,234.5")')).toBe("1234.5");
		expect(calc('=VALUE("$12")')).toBe("12");
		expect(calc('=VALUE("50%")')).toBe("0.5");
		expect(calc('=VALUE("abc")')).toBe("#VALUE!");
	});

	it("formats numbers and dates with TEXT", () => {
		expect(calc('=TEXT(3.14159,"0.00")')).toBe("3.14");
		expect(calc('=TEXT(2.5,"0")')).toBe("3");
		expect(calc('=TEXT(1234567.891,"#,##0")')).toBe("1,234,568");
		expect(calc('=TEXT(1234.5,"#,##0.00")')).toBe("1,234.50");
		expect(calc('=TEXT(0.256,"0%")')).toBe("26%");
		expect(calc('=TEXT(0.256,"0.0%")')).toBe("25.6%");
		expect(calc('=TEXT(-5,"0.00")')).toBe("-5.00");
		expect(calc('=TEXT(5,"""$""#,##0.00")')).toBe("$5.00");
		expect(calc('=TEXT(-5,"0;(0)")')).toBe("(5)");
		expect(calc('=TEXT(1.005,"0.00")')).toBe("1.01");
		expect(calc('=TEXT(7,"000")')).toBe("007");
		expect(calc('=TEXT(DATE(2026,3,4),"yyyy-mm-dd")')).toBe("2026-03-04");
		expect(calc('=TEXT(DATE(2026,3,4),"dd/mm/yyyy")')).toBe("04/03/2026");
		expect(calc('=TEXT(DATE(2026,3,4),"d mmm yy")')).toBe("4 Mar 26");
		expect(calc('=TEXT(DATE(2026,3,4),"dddd, mmmm d")')).toBe(
			"Wednesday, March 4",
		);
		expect(calc('=TEXT(DATE(2026,3,4)+0.5625,"hh:mm")')).toBe("13:30");
		expect(calc('=TEXT(DATE(2026,3,4)+0.5625,"h:mm AM/PM")')).toBe("1:30 PM");
		expect(calc('=TEXT("2026-03-04","dd/mm/yyyy")')).toBe("04/03/2026");
		expect(calc('=TEXT("abc","0")')).toBe("abc");
		expect(calc('=TEXT(1.5,"General")')).toBe("1.5");
	});

	it("does maths", () => {
		expect(calc("=ROUND(2.5)")).toBe("3");
		expect(calc("=ROUND(-2.5)")).toBe("-3");
		expect(calc("=ROUND(1.005,2)")).toBe("1.01");
		expect(calc("=ROUND(1234,-2)")).toBe("1200");
		expect(calc("=ROUNDDOWN(1.99,1)")).toBe("1.9");
		expect(calc("=ROUNDUP(1.01,1)")).toBe("1.1");
		expect(calc("=TRUNC(-1.99)")).toBe("-1");
		expect(calc("=TRUNC(1.987,2)")).toBe("1.98");
		expect(calc("=INT(-1.5)")).toBe("-2");
		expect(calc("=MOD(-1,3)")).toBe("2");
		expect(calc("=MOD(5.5,1)")).toBe("0.5");
		expect(calc("=CEILING(2.1)")).toBe("3");
		expect(calc("=CEILING(2.1,0.5)")).toBe("2.5");
		expect(calc("=CEILING(-2.5,2)")).toBe("-2");
		expect(calc("=CEILING(-2.5,-2)")).toBe("-4");
		expect(calc("=CEILING(2.5,-2)")).toBe("#NUM!");
		expect(calc("=FLOOR(2.9)")).toBe("2");
		expect(calc("=FLOOR(-2.5,2)")).toBe("-4");
		expect(calc("=FLOOR(7,0)")).toBe("#DIV/0!");
		expect(calc("=SIGN(-3)")).toBe("-1");
		expect(calc("=ABS(-3)")).toBe("3");
		expect(calc("=POWER(2,10)")).toBe("1024");
		expect(calc("=SQRT(16)")).toBe("4");
		expect(calc("=LN(EXP(2))")).toBe("2");
		expect(calc("=LOG(8,2)")).toBe("3");
		expect(calc("=LOG(1000)")).toBe("3");
		expect(calc("=LOG10(0.01)")).toBe("-2");
		expect(calc("=LN(0)")).toBe("#NUM!");
		expect(calc("=ROUND(PI(),4)")).toBe("3.1416");
		const rand = Number(calc("=RAND()"));
		expect(rand >= 0 && rand < 1).toBe(true);
		const between = Number(calc("=RANDBETWEEN(3,5)"));
		expect([3, 4, 5]).toContain(between);
		expect(calc("=RANDBETWEEN(5,3)")).toBe("#NUM!");
	});

	it("picks among choices", () => {
		expect(calc('=IFS(1>2,"a",2>1,"b")')).toBe("b");
		expect(calc('=IFS(1>2,"a")')).toBe("#N/A");
		expect(calc('=SWITCH(2,1,"one",2,"two")')).toBe("two");
		expect(calc('=SWITCH(3,1,"one",2,"two","many")')).toBe("many");
		expect(calc('=SWITCH(3,1,"one")')).toBe("#N/A");
		expect(calc('=CHOOSE(2,"a","b","c")')).toBe("b");
		expect(calc('=CHOOSE(4,"a","b","c")')).toBe("#VALUE!");
		expect(calc('=CHOOSE(1,"a",1/0)')).toBe("a");
		expect(calc("=IFNA(NA(),1)")).toBe("1");
		expect(calc("=IFNA(1/0,1)")).toBe("#DIV/0!");
	});

	it("answers questions about values", () => {
		const grid = [["", "", "x", "3", "=1/0", "=NA()", "TRUE"]];
		const at = (f: string) => run([[f, ...(grid[0]?.slice(1) ?? [])]]);
		expect(at("=ISBLANK(B1)")).toBe("TRUE");
		expect(at('=ISBLANK("")')).toBe("FALSE");
		expect(at("=ISTEXT(C1)")).toBe("TRUE");
		expect(at("=ISTEXT(B1)")).toBe("FALSE");
		expect(at("=ISNUMBER(D1)")).toBe("TRUE");
		expect(at("=ISNUMBER(C1)")).toBe("FALSE");
		expect(at("=ISERROR(E1)")).toBe("TRUE");
		expect(at("=ISERROR(1/0)")).toBe("TRUE");
		expect(at("=ISERR(F1)")).toBe("FALSE");
		expect(at("=ISNA(F1)")).toBe("TRUE");
		expect(at("=ISNA(E1)")).toBe("FALSE");
		expect(at("=ISLOGICAL(G1)")).toBe("TRUE");
		expect(at("=NA()")).toBe("#N/A");
	});

	it("looks things up", () => {
		const table = [
			["1", "one", "uno"],
			["5", "five", "cinco"],
			["10", "ten", "diez"],
		];
		const at = (f: string) => beside(f, table);
		expect(at("=VLOOKUP(5,B1:D3,2,FALSE)")).toBe("five");
		expect(at("=VLOOKUP(7,B1:D3,2)")).toBe("five");
		expect(at("=VLOOKUP(7,B1:D3,2,FALSE)")).toBe("#N/A");
		expect(at("=VLOOKUP(5,B1:D3,4,FALSE)")).toBe("#REF!");
		expect(at('=VLOOKUP("t*",C1:D3,2,FALSE)')).toBe("diez");
		expect(at("=HLOOKUP(5,B1:D1,1,FALSE)")).toBe("#N/A");
		expect(at('=HLOOKUP("one",B1:D3,3,FALSE)')).toBe("ten");
		expect(at("=MATCH(5,B1:B3,0)")).toBe("2");
		expect(at("=MATCH(7,B1:B3)")).toBe("2");
		expect(at("=MATCH(0,B1:B3)")).toBe("#N/A");
		expect(at('=MATCH("TEN",C1:C3,0)')).toBe("3");
		expect(at("=INDEX(B1:D3,2,3)")).toBe("cinco");
		expect(at("=INDEX(B1:B3,3)")).toBe("10");
		expect(at("=INDEX(B1:D1,2)")).toBe("one");
		expect(at("=INDEX(B1:D3,4,1)")).toBe("#REF!");
		expect(at("=INDEX(C1:C3,MATCH(10,B1:B3,0))")).toBe("ten");
		expect(at("=XLOOKUP(5,B1:B3,C1:C3)")).toBe("five");
		expect(at('=XLOOKUP(6,B1:B3,C1:C3,"none")')).toBe("none");
		expect(at("=XLOOKUP(6,B1:B3,C1:C3)")).toBe("#N/A");
		expect(at("=XLOOKUP(6,B1:B3,C1:C3,,-1)")).toBe("five");
		expect(at("=XLOOKUP(6,B1:B3,C1:C3,,1)")).toBe("ten");
		expect(at('=XLOOKUP("f*",C1:C3,D1:D3,,2)')).toBe("cinco");
		expect(at('=XLOOKUP("one",C1:D1,C2:D2)')).toBe("five");
	});

	it("works with dates as serial numbers", () => {
		expect(calc("=DATE(2026,3,14)")).toBe("2026-03-14");
		expect(calc("=DATE(2026,14,1)")).toBe("2027-02-01");
		expect(calc("=DATE(2026,3,14)+1")).toBe("2026-03-15");
		expect(calc("=DATE(2026,3,14)-DATE(2026,3,1)")).toBe("13");
		expect(calc("=YEAR(DATE(2026,3,14))")).toBe("2026");
		expect(calc('=MONTH("2026-03-14")')).toBe("3");
		expect(calc("=DAY(46095)")).toBe("14");
		expect(calc("=WEEKDAY(DATE(2026,3,14))")).toBe("7");
		expect(calc("=WEEKDAY(DATE(2026,3,14),2)")).toBe("6");
		expect(calc("=WEEKDAY(DATE(2026,3,14),3)")).toBe("5");
		expect(calc("=EDATE(DATE(2026,1,31),1)")).toBe("2026-02-28");
		expect(calc("=EOMONTH(DATE(2026,1,15),1)")).toBe("2026-02-28");
		expect(calc('=DAYS("2026-03-14","2026-01-01")')).toBe("72");
		expect(calc("=HOUR(0.75)")).toBe("18");
		expect(calc("=YEAR(TODAY())>2000")).toBe("TRUE");
		expect(calc("=NOW()>TODAY()-1")).toBe("TRUE");
		expect(calc("=IF(TRUE,DATE(2026,1,1))")).toBe("2026-01-01");
	});

	it("reads a typed date as a date", () => {
		const grid = [
			["2026-03-14", "=A1+7", "=A1*2", "=MAX(A1:A2)"],
			["2026-01-01"],
		];
		expect(run(grid, 0, 1)).toBe("2026-03-21");
		expect(run(grid, 0, 2)).toBe("92190");
		expect(run(grid, 0, 3)).toBe("2026-03-14");
		expect(run([["=COUNT(B1:B2)", "2026-03-14", "x"]])).toBe("1");
	});

	it("leaves plain text and numbers alone", () => {
		expect(run([["hello"]])).toBe("hello");
		expect(run([["="]])).toBe("=");
		expect(run([["007"]])).toBe("007");
		expect(display(createSheet([["007"]]).value(0, 0))).toBe("7");
		expect(run([["=B1*2", "50%"]])).toBe("1");
	});

	it("reads another sheet by name", () => {
		const book = createWorkbook([
			{ name: "Main", rows: [["=Data!A1+'My Data'!B2", "=SUM(Data!A1:A2)"]] },
			{ name: "Data", rows: [["2"], ["3"]] },
			{ name: "My Data", rows: [[], ["", "40"]] },
		]);
		expect(display(book.value(0, 0, 0))).toBe("42");
		expect(display(book.value(0, 0, 1))).toBe("5");
		const missing = createWorkbook([{ name: "Main", rows: [["=Nope!A1"]] }]);
		expect(display(missing.value(0, 0, 0))).toBe("#REF!");
	});

	it("falls back to a file's recorded value for what it cannot compute", () => {
		const book = createWorkbook([
			{
				name: "S",
				rows: [["=CUBEVALUE(1)", "=Rate*2", "=A1+1", "=1/0"]],
				cached: {
					"0:0": ["=CUBEVALUE(1)", "10"],
					"0:1": ["=Old*2", "7"],
					"0:3": ["=1/0", "5"],
				},
			},
		]);
		expect(book.shown(0, 0, 0)).toBe("10");
		expect(book.shown(0, 0, 1)).toBe("#NAME?");
		expect(book.shown(0, 0, 2)).toBe("11");
		expect(book.shown(0, 0, 3)).toBe("#DIV/0!");
	});

	it("reads an .xlsx function name with its _xlfn prefix", () => {
		expect(calc('=_xlfn.CONCAT("a","b")')).toBe("ab");
	});
});

describe("shiftFormula", () => {
	it("moves relative references and keeps absolute ones", () => {
		expect(shiftFormula("=A1+$B$2+$C3+D$4", 2, 1)).toBe("=B3+$B$2+$C5+E$4");
		expect(shiftFormula("=SUM(A1:B2)", 1, 0)).toBe("=SUM(A2:B3)");
		expect(shiftFormula("=SUM(A:A)", 5, 1)).toBe("=SUM(B:B)");
		expect(shiftFormula("=SUM(1:1)", 1, 5)).toBe("=SUM(2:2)");
		expect(shiftFormula("=Data!A1*2", 1, 0)).toBe("=Data!A2*2");
	});

	it("turns a reference pushed off the sheet into #REF!", () => {
		expect(shiftFormula("=A1+B2", -1, 0)).toBe("=#REF!+B1");
		expect(shiftFormula("=SUM(A1:A3)", 0, -1)).toBe("=SUM(#REF!)");
	});

	it("leaves strings, names and plain text alone", () => {
		expect(shiftFormula('="A1"&A1', 1, 0)).toBe('="A1"&A2');
		expect(shiftFormula("=LOG10(A1)", 1, 0)).toBe("=LOG10(A2)");
		expect(shiftFormula("hello A1", 1, 0)).toBe("hello A1");
		expect(shiftFormula("=A1 +  B1", 1, 0)).toBe("=A2 +  B2");
		expect(shiftFormula('=1+"unclosed', 1, 0)).toBe('=1+"unclosed');
	});
});

describe("adjustFormula", () => {
	const rows = (at: number, count: number) => ({
		axis: "row" as const,
		at,
		count,
	});
	const cols = (at: number, count: number) => ({
		axis: "col" as const,
		at,
		count,
	});

	it("moves references past inserted rows and columns, absolute ones too", () => {
		expect(adjustFormula("=A1+A5+$A$6", rows(2, 2), null, null)).toBe(
			"=A1+A7+$A$8",
		);
		expect(adjustFormula("=A1+C1+$D$1", cols(1, 1), null, null)).toBe(
			"=A1+D1+$E$1",
		);
	});

	it("grows a range around inserted lines and shrinks it around deleted ones", () => {
		expect(adjustFormula("=SUM(A1:A10)", rows(4, 3), null, null)).toBe(
			"=SUM(A1:A13)",
		);
		expect(adjustFormula("=SUM(A1:A10)", rows(2, -3), null, null)).toBe(
			"=SUM(A1:A7)",
		);
		expect(adjustFormula("=SUM(A4:A11)", rows(2, -3), null, null)).toBe(
			"=SUM(A3:A8)",
		);
		expect(adjustFormula("=SUM(A1:A4)", rows(2, -3), null, null)).toBe(
			"=SUM(A1:A2)",
		);
		expect(adjustFormula("=SUM(B:D)", cols(2, -1), null, null)).toBe(
			"=SUM(B:C)",
		);
	});

	it("turns references into deleted cells into #REF!", () => {
		expect(adjustFormula("=A3*2", rows(2, -1), null, null)).toBe("=#REF!*2");
		expect(adjustFormula("=SUM(A3:B4)", rows(2, -2), null, null)).toBe(
			"=SUM(#REF!)",
		);
		expect(adjustFormula("=B1", cols(1, -1), null, null)).toBe("=#REF!");
	});

	it("leaves a whole column alone on a row change", () => {
		expect(adjustFormula("=SUM(A:A)", rows(0, -1), null, null)).toBe(
			"=SUM(A:A)",
		);
	});

	it("only touches references to the sheet that changed", () => {
		expect(adjustFormula("=A5+Data!A5", rows(0, 1), "Data", "Main")).toBe(
			"=A5+Data!A6",
		);
		expect(adjustFormula("=A5+Data!A5", rows(0, 1), "Main", "Main")).toBe(
			"=A6+Data!A5",
		);
		expect(adjustFormula("=A5+'My data'!A5", rows(0, 1), "my DATA", "x")).toBe(
			"=A5+'My data'!A6",
		);
	});
});

describe("renameSheetRefs", () => {
	it("renames a sheet everywhere it is named, quoting when needed", () => {
		expect(renameSheetRefs("=Data!A1+A1", "data", "My Data")).toBe(
			"='My Data'!A1+A1",
		);
		expect(renameSheetRefs("='My Data'!A1", "My Data", "Summary")).toBe(
			"=Summary!A1",
		);
		expect(renameSheetRefs("=Data!A1:B2", "Data", "A1")).toBe("='A1'!A1:B2");
		expect(renameSheetRefs("=Other!A1", "Data", "X")).toBe("=Other!A1");
	});

	it("turns references to a deleted sheet into #REF!", () => {
		expect(renameSheetRefs("=Data!A1+1", "Data", null)).toBe("=#REF!+1");
	});
});

describe("normalizeFormula", () => {
	it("capitalises names and references, never strings or sheet names", () => {
		expect(normalizeFormula('=sum(a1:b$2)&"abc"&Data!c3+my.fn(x1)')).toBe(
			'=SUM(A1:B$2)&"abc"&Data!C3+MY.FN(X1)',
		);
		expect(normalizeFormula("plain")).toBe("plain");
		expect(normalizeFormula("=sum(")).toBe("=SUM(");
		expect(normalizeFormula('=1+"open')).toBe('=1+"open');
	});
});

describe("file formulas", () => {
	it("prefixes newer functions for Excel and drops the prefix on the way in", () => {
		expect(toFileFormula("xlookup(a1,B:B,c:c)+sum('my sheet'!a1)")).toBe(
			"_xlfn.XLOOKUP(A1,B:B,C:C)+SUM('my sheet'!A1)",
		);
		expect(toFileFormula('IFS(A1>1,"STDEV.S")')).toBe(
			'_xlfn.IFS(A1>1,"STDEV.S")',
		);
		expect(fromFileFormula("_xlfn.STDEV.S(A1:A3)+_xlfn._xlws.SORT(B1)")).toBe(
			"STDEV.S(A1:A3)+SORT(B1)",
		);
		expect(fromFileFormula("SUM(A1")).toBe("SUM(A1");
	});
});
