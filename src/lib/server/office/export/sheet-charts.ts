import type { Content } from "pdfmake/interfaces";
import { chartData, sourceOf } from "#lib/chart/data.js";
import type { Chart } from "#lib/chart/model.js";
import { PRINT_THEME, renderChart } from "#lib/chart/render.js";
import { createWorkbook, type SheetSource } from "#lib/formula.js";

/**
 * Each sheet's charts as PDF blocks, below its table: the same SVG the
 * editor draws, in plain colours, scaled down to fit the page.
 */

/** Landscape A4 inside its margins, in points. */
const PAGE = { width: 841.89 - 72, height: 595.28 - 72 - 40 };
const POINTS_PER_PIXEL = 0.75;

export function chartBlocks(
	sheets: (SheetSource & { charts?: Chart[] })[],
): Content[][] {
	if (!sheets.some((sheet) => sheet.charts?.length)) {
		return sheets.map(() => []);
	}
	const source = sourceOf(createWorkbook(sheets), sheets);
	return sheets.map((sheet, index) =>
		(sheet.charts ?? []).map((chart): Content => {
			const { width, height } = chart.anchor;
			const scale = Math.min(
				POINTS_PER_PIXEL,
				PAGE.width / width,
				PAGE.height / height,
			);
			return {
				svg: renderChart(chart, chartData(chart, source, index), {
					width,
					height,
					theme: PRINT_THEME,
				}),
				width: width * scale,
				margin: [0, 12, 0, 0],
				unbreakable: true,
			};
		}),
	);
}
