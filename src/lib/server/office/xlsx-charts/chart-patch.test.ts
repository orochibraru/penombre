import { describe, expect, it } from "bun:test";

import type { ChartData } from "#lib/chart/data.js";
import type { Chart, ChartSeries } from "#lib/chart/model.js";

import { patchChart } from "./chart-patch";

const C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";

const space = (inner: string, attrs = `xmlns:a="${A}"`) =>
	`<c:chartSpace xmlns:c="${C}" ${attrs}><c:chart>${inner}</c:chart></c:chartSpace>`;

const AXES =
	'<c:catAx><c:axId val="1"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/><c:crossAx val="2"/></c:catAx><c:valAx><c:axId val="2"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="General" sourceLinked="1"/><c:crossAx val="1"/></c:valAx>';

const ser = (index: number, inner = "") =>
	`<c:ser><c:idx val="${index}"/><c:order val="${index}"/>${inner}<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f></c:numRef></c:val></c:ser>`;

const series = (overrides: Partial<ChartSeries> = {}): ChartSeries => ({
	values: "Sheet1!$B$2:$B$4",
	...overrides,
});

function chart(overrides: Partial<Chart> = {}): Chart {
	return {
		id: "c1",
		anchor: { col: 0, row: 0, dx: 0, dy: 0, width: 400, height: 300 },
		type: "column",
		legend: "r",
		x: {},
		y: {},
		series: [series()],
		...overrides,
	} as Chart;
}

const data: ChartData = {
	categories: ["Q1", "Q2", "Q3"],
	series: [
		{ name: "North", values: [1, 2, 3] },
		{ name: "South", values: [4, 5, 6] },
		{ name: "East", values: [7, 8, 9] },
	],
};

/** The patched part, or a failure naming why it came back null. */
function patched(source: string, prev: Chart, next: Chart): string {
	const result = patchChart(source, prev, next, data);
	if (result === null) {
		throw new Error("not patched");
	}
	return result;
}

describe("charts that cannot be patched", () => {
	const source = space(
		`<c:plotArea><c:barChart><c:barDir val="col"/>${ser(0)}</c:barChart>${AXES}</c:plotArea>`,
	);

	it("refuses another type family", () => {
		expect(
			patchChart(source, chart(), chart({ type: "pie" }), data),
		).toBeNull();
	});

	it("refuses a combo, a part with no group and other prefixes", () => {
		const combo = space(
			`<c:plotArea><c:barChart>${ser(0)}</c:barChart><c:lineChart>${ser(1)}</c:lineChart></c:plotArea>`,
		);
		expect(patchChart(combo, chart(), chart(), data)).toBeNull();
		const empty = space("<c:plotArea/>");
		expect(patchChart(empty, chart(), chart(), data)).toBeNull();
		const unprefixed = source.replace(`xmlns:a="${A}"`, `xmlns:d="${A}"`);
		expect(patchChart(unprefixed, chart(), chart(), data)).toBeNull();
	});

	it("patches an unchanged chart to the same part", () => {
		const prev = chart();
		expect(patchChart(source, prev, structuredClone(prev), data)).toContain(
			'<c:barDir val="col"/>',
		);
	});
});

describe("titles", () => {
	it("writes a title where there was none, and removes it", () => {
		const source = space(
			`<c:autoTitleDeleted val="1"/><c:plotArea><c:barChart>${ser(0)}</c:barChart>${AXES}</c:plotArea><c:legend><c:legendPos val="r"/></c:legend>`,
		);
		const titled = patched(source, chart(), chart({ title: "A & <B>" }));
		expect(titled).toContain("A &amp; &lt;B&gt;");
		expect(titled).toContain('<c:autoTitleDeleted val="0"/>');
		expect(titled.indexOf("<c:title>")).toBeLessThan(
			titled.indexOf("<c:autoTitleDeleted"),
		);

		const untitled = patched(
			titled,
			chart({ title: "A & <B>" }),
			chart({ title: undefined }),
		);
		expect(untitled).not.toContain("<c:title>");
		expect(untitled).toContain('<c:autoTitleDeleted val="1"/>');
	});

	it("keeps the look of a rich title's first run, line by line", () => {
		const source = space(
			`<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:rPr b="1"/><a:t>Old</a:t></a:r><a:r><a:t> tail</a:t></a:r><a:br/></a:p><a:p><a:endParaRPr/></a:p><a:p><a:r><a:rPr/></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:barChart>${ser(0)}</c:barChart>${AXES}</c:plotArea>`,
		);
		const xml = patched(
			source,
			chart({ title: "Old tail" }),
			chart({ title: "One\nTwo\nThree\nFour" }),
		);
		expect(xml).toContain(
			'<c:rich><a:bodyPr/><a:p><a:r><a:rPr b="1"/><a:t>One</a:t></a:r></a:p><a:p><a:r><a:t>Two</a:t></a:r><a:endParaRPr/></a:p><a:p><a:r><a:rPr/><a:t>Three</a:t></a:r></a:p><a:p><a:r><a:rPr b="1"/><a:t>Four</a:t></a:r></a:p></c:rich>',
		);
	});

	it("replaces a referenced title's text, or gives one with no text some", () => {
		const referenced = space(
			`<c:title><c:tx><c:strRef><c:f>Sheet1!$A$1</c:f></c:strRef></c:tx><c:overlay val="0"/></c:title><c:plotArea><c:barChart>${ser(0)}</c:barChart>${AXES}</c:plotArea>`,
		);
		const typed = patched(
			referenced,
			chart({ title: "Ref" }),
			chart({ title: "Typed" }),
		);
		expect(typed).not.toContain("<c:strRef><c:f>Sheet1!$A$1");
		expect(typed).toMatch(/<c:title><c:tx><c:rich>.*Typed.*<\/c:tx><c:overlay/);

		const bare = referenced.replace(
			"<c:tx><c:strRef><c:f>Sheet1!$A$1</c:f></c:strRef></c:tx>",
			"",
		);
		const given = patched(bare, chart(), chart({ title: "Given" }));
		expect(given).toMatch(/<c:title><c:tx><c:rich>.*Given.*<\/c:tx><c:overlay/);
	});
});

describe("the legend, axes and labels", () => {
	const source = space(
		`<c:plotArea><c:barChart><c:barDir val="col"/><c:grouping val="stacked"/>${ser(0, '<c:dLbls><c:showVal val="0"/></c:dLbls>')}${ser(1, '<c:dLbls><c:delete val="1"/></c:dLbls>')}<c:dLbls><c:delete val="1"/></c:dLbls><c:overlap val="100"/><c:axId val="1"/><c:axId val="2"/></c:barChart>${AXES.replace('<c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/>', '<c:orientation val="minMax"/><c:max val="9"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/>')}</c:plotArea><c:plotVisOnly val="1"/>`,
	);
	const prev = chart({
		grouping: "stacked",
		legend: "none",
		y: { max: 9, gridlines: true },
		series: [series(), series()],
	});

	it("adds a legend, then removes it", () => {
		const shown = patched(source, prev, { ...prev, legend: "t" });
		expect(shown).toContain(
			'<c:legend><c:legendPos val="t"/><c:overlay val="0"/></c:legend><c:plotVisOnly',
		);
		expect(
			patched(shown, { ...prev, legend: "t" }, { ...prev, legend: "none" }),
		).not.toContain("<c:legend>");
	});

	it("moves a legend that is there", () => {
		const shown = patched(source, prev, { ...prev, legend: "b" });
		expect(
			patched(shown, { ...prev, legend: "b" }, { ...prev, legend: "l" }),
		).toContain('<c:legendPos val="l"/>');
	});

	it("sets the scale, gridlines and an axis title", () => {
		const xml = patched(source, prev, {
			...prev,
			x: { gridlines: true, title: "Quarter" },
			y: { min: 2 },
		});
		expect(xml).toContain(
			'<c:scaling><c:orientation val="minMax"/><c:min val="2"/></c:scaling>',
		);
		expect(xml).toMatch(/<c:catAx>.*<c:majorGridlines\/><c:title>.*Quarter/);
		expect(xml).not.toMatch(/<c:valAx>.*<c:majorGridlines/);
	});

	it("shows values where the group deleted its labels, and on each series", () => {
		const xml = patched(source, prev, { ...prev, labels: true });
		expect(xml).toContain(
			'<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:overlap val="100"/>',
		);
		expect(xml).toContain('<c:dLbls><c:showVal val="1"/></c:dLbls><c:val>');
		expect(xml).toContain('<c:dLbls><c:delete val="1"/></c:dLbls><c:val>');
		const hidden = patched(
			xml,
			{ ...prev, labels: true },
			{ ...prev, labels: false },
		);
		expect(hidden).not.toContain('<c:showVal val="1"/>');
	});

	it("clusters again without the overlap, or stacks to 100%", () => {
		const clustered = patched(source, prev, { ...prev, grouping: "clustered" });
		expect(clustered).toContain('<c:grouping val="clustered"/>');
		expect(clustered).not.toContain("<c:overlap");
		const percent = patched(source, prev, { ...prev, grouping: "percent" });
		expect(percent).toContain('<c:grouping val="percentStacked"/>');
		expect(percent).toContain('<c:overlap val="100"/>');
	});

	it("turns column into bar by swapping the axis sides", () => {
		const xml = patched(source, prev, { ...prev, type: "bar" });
		expect(xml).toContain('<c:barDir val="bar"/>');
		expect(xml).toMatch(/<c:catAx>.*<c:axPos val="l"\/>.*<\/c:catAx>/);
		expect(xml).toMatch(/<c:valAx>.*<c:axPos val="b"\/>.*<\/c:valAx>/);
	});
});

describe("line charts", () => {
	const source = space(
		`<c:plotArea><c:lineChart><c:grouping val="standard"/>${ser(0, '<c:spPr><a:effectLst/></c:spPr><c:marker><c:symbol val="none"/></c:marker>')}${ser(1)}<c:marker val="0"/><c:axId val="1"/><c:axId val="2"/></c:lineChart>${AXES}</c:plotArea>`,
	);
	const prev = chart({ type: "line", series: [series(), series()] });

	it("colours a line through its outline, before its effects", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [series({ color: "#112233" }), series({ color: "#445566" })],
		});
		expect(xml).toContain(
			'<c:spPr><a:ln><a:solidFill><a:srgbClr val="112233"/></a:solidFill></a:ln><a:effectLst/></c:spPr>',
		);
		expect(xml).toContain(
			'<c:spPr><a:ln><a:solidFill><a:srgbClr val="445566"/></a:solidFill></a:ln></c:spPr>',
		);
	});

	it("shows and hides markers", () => {
		const shown = patched(source, prev, { ...prev, markers: true });
		expect(shown).toContain('<c:marker><c:symbol val="circle"/></c:marker>');
		expect(shown).toContain('<c:marker val="1"/>');
		const hidden = patched(
			shown,
			{ ...prev, markers: true },
			{ ...prev, markers: false },
		);
		expect(hidden.match(/<c:symbol val="none"\/>/g)).toHaveLength(2);
	});

	it("stacks with the line's own grouping name", () => {
		const xml = patched(
			source,
			{ ...prev, grouping: "stacked" },
			{ ...prev, grouping: "clustered" },
		);
		expect(xml).toContain('<c:grouping val="standard"/>');
		expect(patched(source, prev, { ...prev, grouping: "stacked" })).toContain(
			'<c:grouping val="stacked"/>',
		);
	});
});

describe("series", () => {
	const source = space(
		`<c:plotArea><c:barChart>${ser(0, "<c:tx><c:v>North</c:v></c:tx><c:spPr><a:ln/></c:spPr>")}${ser(3, '<c:spPr><a:noFill/></c:spPr><c:extLst><c:ext uri="x"/></c:extLst>')}<c:axId val="1"/></c:barChart>${AXES}</c:plotArea>`,
	);
	const prev = chart({
		series: [series({ name: "North" }), series({ color: undefined })],
	});

	it("clones the last for a new one, with the next index and no extLst", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [...prev.series, series({ name: "East" })],
		});
		expect(xml.match(/<c:ser>/g)).toHaveLength(3);
		expect(xml).toContain('<c:idx val="4"/><c:order val="4"/>');
		expect(xml.match(/<c:extLst>/g)).toHaveLength(1);
		expect(xml).toContain("<c:tx><c:v>East</c:v></c:tx>");
	});

	it("drops series the model no longer has", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [prev.series[0] as ChartSeries],
		});
		expect(xml.match(/<c:ser>/g)).toHaveLength(1);
		expect(xml).not.toContain('<c:idx val="3"/>');
	});

	it("rewrites a name or data reference only when it changed", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [
				series({ name: "North", nameRef: "Sheet1!$B$1" }),
				series({ values: "Sheet1!$C$2:$C$4", categories: "Sheet1!$A$2:$A$4" }),
			],
		});
		expect(xml).toContain("<c:tx><c:strRef><c:f>Sheet1!$B$1</c:f>");
		expect(xml).toContain("<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f>");
		expect(xml).toContain("<c:val><c:numRef><c:f>Sheet1!$C$2:$C$4</c:f>");
	});

	it("fills a series with no fill, after its geometry, and clears one", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [series({ name: "North", color: "#abcdef" }), series()],
		});
		expect(xml).toContain(
			'<c:spPr><a:solidFill><a:srgbClr val="ABCDEF"/></a:solidFill><a:ln/></c:spPr>',
		);
		const cleared = patched(
			source,
			{
				...prev,
				series: [prev.series[0] as ChartSeries, series({ color: "#000000" })],
			},
			prev,
		);
		expect(cleared).toContain('<c:idx val="3"/><c:order val="3"/><c:spPr/>');
	});

	it("a group with no series stays as it is", () => {
		const empty = space(
			`<c:plotArea><c:barChart><c:barDir val="col"/></c:barChart>${AXES}</c:plotArea>`,
		);
		const xml = patched(empty, chart({ series: [] }), chart({ series: [] }));
		expect(xml).not.toContain("<c:ser>");
	});
});

describe("pie slices", () => {
	const source = space(
		`<c:plotArea><c:pieChart><c:varyColors val="1"/>${ser(0, '<c:dPt><c:idx val="1"/><c:bubble3D val="0"/></c:dPt><c:dPt><c:idx val="3"/><c:spPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></c:spPr></c:dPt>')}</c:pieChart></c:plotArea>`,
	);
	const prev = chart({
		type: "pie",
		series: [series({ points: [null, null, null, "#ff0000"] })],
	});

	it("colours slices in index order, keeping the rest", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [
				series({ points: ["#000001", "#000002", "#000003", null, "#000005"] }),
			],
		});
		const slices = [...xml.matchAll(/<c:dPt><c:idx val="(\d)"\/>/g)].map(
			(match) => match[1],
		);
		expect(slices).toEqual(["0", "1", "2", "3", "4"]);
		expect(xml).toContain(
			'<c:dPt><c:idx val="1"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="000002"/></a:solidFill></c:spPr></c:dPt>',
		);
		expect(xml).toContain('<c:dPt><c:idx val="3"/><c:spPr/></c:dPt>');
	});

	it("adds no slice for an automatic colour", () => {
		const xml = patched(source, prev, {
			...prev,
			series: [series({ points: [null, null, null, "#ff0000", null, null] })],
		});
		expect(xml.match(/<c:dPt>/g)).toHaveLength(2);
	});
});

describe("scatter charts", () => {
	const source = space(
		`<c:plotArea><c:scatterChart><c:scatterStyle val="lineMarker"/>${ser(0, '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>')}</c:scatterChart><c:valAx><c:axId val="1"/><c:axPos val="b"/></c:valAx><c:valAx><c:axId val="2"/><c:axPos val="l"/></c:valAx></c:plotArea>`,
	);

	it("colours the markers it adds, never the line", () => {
		const prev = chart({ type: "scatter" });
		const xml = patched(source, prev, {
			...prev,
			series: [series({ color: "#00ff00" })],
		});
		expect(xml).toContain('<a:ln w="19050"><a:noFill/></a:ln>');
		expect(xml).toContain(
			'<c:marker><c:symbol val="circle"/><c:spPr><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill></c:spPr></c:marker>',
		);
	});

	it("ignores stacking", () => {
		const prev = chart({ type: "scatter" });
		const xml = patched(source, prev, { ...prev, grouping: "stacked" });
		expect(xml).not.toContain("<c:grouping");
	});
});
