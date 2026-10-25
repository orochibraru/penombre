<script lang="ts">
	import type { ChartData } from "#lib/chart/data.js";
	import type { Chart } from "#lib/chart/model.js";
	import { APP_THEME, renderChart } from "#lib/chart/render.js";
	import { getLocale } from "#lib/paraglide/runtime.js";

	/**
	 * One chart, drawn as inline SVG so its axes and labels take the theme's
	 * tokens and follow dark mode, with a tooltip for the mark under the
	 * pointer (or the finger).
	 */
	const {
		chart,
		data,
		width,
		height,
		empty,
		note,
	}: {
		chart: Chart;
		data: ChartData;
		width: number;
		height: number;
		empty: string;
		note?: string;
	} = $props();

	// The markup is ours: every text and attribute value is escaped by the
	// renderer, and colours are checked to be `#rrggbb`.
	const svg = $derived(
		renderChart(chart, data, {
			width,
			height,
			theme: APP_THEME,
			empty,
			note,
			locale: getLocale(),
		}),
	);

	let tip = $state<{ text: string; x: number; y: number } | null>(null);
	let box = $state<HTMLDivElement>();

	function show(event: PointerEvent) {
		const mark =
			event.target instanceof Element
				? event.target.closest<SVGElement>("[data-tip]")
				: null;
		const bounds = box?.getBoundingClientRect();
		if (!(mark && bounds)) {
			tip = null;
			return;
		}
		tip = {
			text: mark.dataset.tip ?? "",
			x: event.clientX - bounds.left,
			y: event.clientY - bounds.top,
		};
	}
</script>

<div
	bind:this={box}
	class="chart-palette relative size-full overflow-hidden"
	role="presentation"
	onpointermove={show}
	onpointerdown={show}
	onpointerleave={() => (tip = null)}
>
	{@html svg}
	{#if tip}
		<div
			class="bg-popover text-popover-foreground pointer-events-none absolute z-10 max-w-60 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-md"
			style="left: {Math.min(
				Math.max(tip.x, 60),
				width - 60,
			)}px; top: {Math.max(tip.y - 36, 2)}px"
		>
			{tip.text}
		</div>
	{/if}
</div>

<style>
	/* The categorical slots after the accent, `CATEGORICAL` in render.ts,
       stepped separately for each mode. Global so the chart editor's
       swatches can read them too. */
	:global(.chart-palette) {
		--chart-1: #2a78d6;
		--chart-2: #eb6834;
		--chart-3: #1baf7a;
		--chart-4: #eda100;
		--chart-5: #e87ba4;
		--chart-6: #008300;
		--chart-7: #6250d6;
		--chart-8: #e34948;
	}
	:global(.dark .chart-palette) {
		--chart-1: #3987e5;
		--chart-2: #d95926;
		--chart-3: #199e70;
		--chart-4: #c98500;
		--chart-5: #d55181;
		--chart-6: #008300;
		--chart-7: #9085e9;
		--chart-8: #e66767;
	}
</style>
