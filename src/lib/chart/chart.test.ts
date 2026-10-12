import { describe, expect, it } from "bun:test";
import { createWorkbook } from "../formula";
import {
	areaOf,
	type CellSource,
	chartArea,
	chartData,
	guessLayout,
	regionAround,
	seriesOf,
	sourceOf,
} from "./data";
import {
	cellAt,
	chartFor,
	moveCharts,
	nearestEdge,
	renameChartRefs,
	withColors,
	withData,
} from "./edit";
import { type Chart, canonical, checkChart, checkCharts } from "./model";
import { PRINT_THEME, renderChart } from "./render";

const GRID = [
	["Region", "North", "South"],
	["Q1", "10", "4"],
	["Q2", "20", "=B2*0.5"],
	["Q3", "30", "12"],
];

function bookOf(sheets: { name: string; rows: string[][] }[]): CellSource {
	return sourceOf(createWorkbook(sheets), sheets);
}

const source = bookOf([
	{ name: "Sheet1", rows: GRID },
	{
		name: "Q 1 figures",
		rows: [
			["a", "1"],
			["b", "2"],
		],
	},
]);

const anchor = { row: 0, col: 4, x: 0, y: 0, width: 480, height: 300 };

const column: Chart = {
	id: "c",
	anchor,
	type: "column",
	legend: "b",
	x: {},
	y: { gridlines: true },
	series: [
		{
			nameRef: "Sheet1!$B$1",
			categories: "Sheet1!$A$2:$A$4",
			values: "Sheet1!$B$2:$B$4",
		},
		{
			nameRef: "Sheet1!$C$1",
			categories: "Sheet1!$A$2:$A$4",
			values: "Sheet1!$C$2:$C$4",
			color: "#aa0000",
		},
	],
};

describe("reading references", () => {
	it("reads quoted sheet names, single cells and whole columns", () => {
		expect(areaOf("'Q 1 figures'!$B$1:$B$2", source, 0)).toEqual({
			sheet: 1,
			top: 0,
			left: 1,
			bottom: 1,
			right: 1,
		});
		expect(areaOf("B2", source, 0)).toMatchObject({
			sheet: 0,
			top: 1,
			left: 1,
		});
		expect(areaOf("Sheet1!B:B", source, 0)).toMatchObject({
			top: 0,
			bottom: 3,
		});
		expect(areaOf("(Sheet1!A1,Sheet1!A3)", source, 0)).toBeNull();
		expect(areaOf("Nowhere!A1:A3", source, 0)).toBeNull();
	});

	it("evaluates formulas and falls back to the file's cache", () => {
		const data = chartData(column, source, 0);
		expect(data.categories).toEqual(["Q1", "Q2", "Q3"]);
		expect(data.series.map((s) => [s.name, s.values])).toEqual([
			["North", [10, 20, 30]],
			["South", [4, 5, 12]],
		]);
		const lost: Chart = {
			...column,
			series: [
				{
					values: "[1]Other!$A$1:$A$2",
					cache: { name: "Old", values: [7, null], categories: ["x", "y"] },
				},
			],
		};
		expect(chartData(lost, source, 0)).toEqual({
			categories: ["x", "y"],
			series: [{ name: "Old", values: [7, null] }],
		});
	});
});

describe("guessing a chart from a selection", () => {
	it("takes a header row and a label column, series by column", () => {
		const area = regionAround(source, 0, 2, 1);
		expect(area).toEqual({ sheet: 0, top: 0, left: 0, bottom: 3, right: 2 });
		const layout = guessLayout(source, area);
		expect(layout).toMatchObject({
			headerRow: true,
			labelCol: true,
			byColumn: true,
		});
		expect(seriesOf(layout, source.names)).toEqual([
			{
				values: "Sheet1!$B$2:$B$4",
				nameRef: "Sheet1!$B$1",
				categories: "Sheet1!$A$2:$A$4",
			},
			{
				values: "Sheet1!$C$2:$C$4",
				nameRef: "Sheet1!$C$1",
				categories: "Sheet1!$A$2:$A$4",
			},
		]);
	});

	it("puts series in rows when there are more columns than rows", () => {
		const wide = bookOf([
			{
				name: "S",
				rows: [
					["", "Jan", "Feb", "Mar", "Apr"],
					["Sales", "1", "2", "3", "4"],
				],
			},
		]);
		const layout = guessLayout(wide, {
			sheet: 0,
			top: 0,
			left: 0,
			bottom: 1,
			right: 4,
		});
		expect(layout.byColumn).toBe(false);
		expect(seriesOf(layout, wide.names)).toEqual([
			{ values: "S!$B$2:$E$2", nameRef: "S!$A$2", categories: "S!$B$1:$E$1" },
		]);
	});

	it("makes a whole chart, and switches rows and columns keeping colours", () => {
		const area = { sheet: 0, top: 0, left: 0, bottom: 3, right: 2 };
		const chart = chartFor(source, area, [], anchor);
		expect(chart).toMatchObject({ type: "column", legend: "b", anchor });
		const coloured = {
			...chart,
			series: chart.series.map((s, i) =>
				i === 0 ? { ...s, color: "#123456" } : s,
			),
		};
		const flipped = withData(coloured, source, area, false);
		expect(flipped.series).toHaveLength(3);
		expect(flipped.series[0]).toMatchObject({
			values: "Sheet1!$B$2:$C$2",
			color: "#123456",
		});
		expect(chartArea(flipped, source, 0)).toEqual(area);
	});
});

describe("charts follow the sheet", () => {
	it("moves references and the anchor when rows are inserted above", () => {
		const [moved] =
			moveCharts(
				[{ ...column, anchor: { ...anchor, row: 5 } }],
				{ axis: "row", at: 0, count: 2 },
				"Sheet1",
				"Sheet1",
			) ?? [];
		expect(moved?.anchor.row).toBe(7);
		expect(moved?.series[0]?.values).toBe("Sheet1!$B$4:$B$6");
		expect(moved?.series[0]?.nameRef).toBe("Sheet1!$B$3");
	});

	it("leaves charts untouched by a change on another sheet", () => {
		const charts = [column];
		expect(
			moveCharts(charts, { axis: "row", at: 0, count: 1 }, "Other", "Sheet1"),
		).toBe(charts);
	});

	it("renames and breaks references with their sheet", () => {
		const book = { sheets: [{ charts: [column] }] };
		const renamed = renameChartRefs(book, "Sheet1", "Data 2");
		expect(renamed.sheets[0]?.charts?.[0]?.series[0]?.values).toBe(
			"'Data 2'!$B$2:$B$4",
		);
		const deleted = renameChartRefs(book, "Sheet1", null);
		expect(deleted.sheets[0]?.charts?.[0]?.series[0]?.values).toBe("#REF!");
	});

	it("snaps a pixel to the nearest cell edge", () => {
		const width = () => 100;
		expect(cellAt(250, width)).toEqual({ index: 2, offset: 50 });
		expect(nearestEdge(240, width)).toEqual({ index: 2, at: 200 });
		expect(nearestEdge(260, width)).toEqual({ index: 3, at: 300 });
	});
});

describe("checking charts from the network", () => {
	it("drops malformed charts and fields, keeps good ones", () => {
		const charts = checkCharts([
			column,
			{ ...column, id: "", type: "column" },
			{ ...column, id: "bad", type: "radar" },
			{ ...column, id: "x", series: [{ values: 3 }] },
			{ ...column, id: "y", anchor: { ...anchor, width: -1 } },
		]);
		expect(charts?.map((c) => c.id)).toEqual(["c"]);
		const odd = checkChart({
			...column,
			extra: 1,
			series: [{ values: "A1", color: "red", points: ["#ffffff", "x"] }],
		});
		expect(odd?.series).toEqual([{ values: "A1", points: ["#ffffff", null] }]);
		expect(odd && "extra" in odd).toBe(false);
	});

	it("compares charts whatever their key order", () => {
		const shuffled = JSON.parse(
			JSON.stringify({ series: column.series, id: column.id, ...column }),
		);
		expect(canonical(checkChart(shuffled))).toBe(canonical(checkChart(column)));
	});
});

describe("drawing a chart", () => {
	const draw = (chart: Chart) =>
		renderChart(chart, chartData(chart, source, 0), {
			width: 480,
			height: 300,
			theme: PRINT_THEME,
			empty: "Nothing",
		});

	it("draws one bar per value, coloured from the file or the palette", () => {
		const svg = draw(column);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg.match(/<rect [^>]*data-tip/g)).toHaveLength(6);
		expect(svg).toContain("fill:#aa0000");
		expect(svg).toContain(`fill:${PRINT_THEME.palette[0]}`);
		expect(svg).toContain('data-tip="South · Q2: 5"');
		expect(svg).toContain(">North</text>");
	});

	it("stacks to 100%, and labels the axis in percent", () => {
		const svg = draw({ ...column, grouping: "percent", labels: true });
		expect(svg).toContain(">100%</text>");
	});

	it("draws lines with markers, areas, scatter points, pies and doughnuts", () => {
		expect(
			draw({ ...column, type: "line", markers: true }).match(
				/<circle [^>]*r="3.5"/g,
			),
		).toHaveLength(6);
		expect(draw({ ...column, type: "area" })).toContain("fill-opacity:0.35");
		expect(
			draw({
				...column,
				type: "scatter",
				series: [
					{ values: "Sheet1!$C$2:$C$4", categories: "Sheet1!$B$2:$B$4" },
				],
			}),
		).toContain('data-tip="Series 1: (20, 5)"');
		const pie = draw({
			...column,
			type: "pie",
			series: [
				{
					values: "Sheet1!$B$2:$B$4",
					categories: "Sheet1!$A$2:$A$4",
					points: ["#010203", null, null],
				},
			],
		});
		expect(pie.match(/<path [^>]*data-tip/g)).toHaveLength(3);
		expect(pie).toContain("fill:#010203");
		expect(pie).toContain('data-tip="Q3: 30 (50%)"');
		expect(
			draw({
				...column,
				type: "doughnut",
				series: [{ values: "Sheet1!$B$2:$B$4" }],
			}),
		).toContain('fill-rule="evenodd"');
	});

	it("escapes everything the file or the user wrote", () => {
		const svg = draw({
			...column,
			title: '<script>alert("x")</script>',
			series: [
				{
					...column.series[0],
					name: "<b>",
					nameRef: undefined,
					color: 'red" onload="x',
				} as Chart["series"][number],
			],
		});
		expect(svg).not.toContain("<script>");
		expect(svg).not.toContain("<b>");
		expect(svg).not.toContain("onload");
		expect(svg).toContain("&lt;script&gt;");
	});

	it("says so when there is nothing to plot", () => {
		expect(draw({ ...column, series: [] })).toContain(">Nothing</text>");
	});
});

describe("colours for new charts", () => {
	it("gives each series its palette slot, and a pie each slice", () => {
		const area = { sheet: 0, top: 0, left: 0, bottom: 3, right: 2 };
		const chart = chartFor(source, area, ["#111111", "#222222"]);
		expect(chart.series.map((s) => s.color)).toEqual(["#111111", "#222222"]);
		const pie = withColors(
			{ ...chart, type: "pie", series: [{ values: "A1:A3" }] },
			["#111111", "#222222"],
			3,
		);
		expect(pie.series[0]).toEqual({
			values: "A1:A3",
			points: ["#111111", "#222222", "#111111"],
		});
		const kept = withColors(chart, ["#999999"]);
		expect(kept.series.map((s) => s.color)).toEqual(["#111111", "#222222"]);
	});
});
