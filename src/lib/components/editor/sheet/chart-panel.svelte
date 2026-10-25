<script lang="ts">
	import { XIcon } from "@lucide/svelte";
	import { areaName, areaOf, chartArea, chartData } from "#lib/chart/data.js";
	import { withColors, withData } from "#lib/chart/edit.js";
	import {
		type Chart,
		CHART_TYPES,
		type ChartAxis,
		type ChartType,
		type Grouping,
		isGroupable,
		type LegendPosition,
	} from "#lib/chart/model.js";
	import { APP_THEME } from "#lib/chart/render.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import { chartPalette, seriesLabel } from "./chart-defaults.js";
	import type { SheetState } from "./state.svelte.js";

	/**
	 * The chart editor, beside the grid (under it on a phone): type, data,
	 * labels, colours. Every change is one undo step; text fields apply when
	 * they lose the focus or on Enter.
	 */
	const { sheet, chart }: { sheet: SheetState; chart: Chart } = $props();

	const TYPE_LABELS: Record<ChartType, () => string> = {
		column: m.chart_type_column,
		bar: m.chart_type_bar,
		line: m.chart_type_line,
		area: m.chart_type_area,
		pie: m.chart_type_pie,
		doughnut: m.chart_type_doughnut,
		scatter: m.chart_type_scatter,
	};
	const LEGENDS: [LegendPosition, () => string][] = [
		["r", m.chart_legend_right],
		["b", m.chart_legend_bottom],
		["t", m.chart_legend_top],
		["l", m.chart_legend_left],
		["none", m.chart_legend_none],
	];

	const data = $derived(
		chartData(chart, sheet.source, sheet.active, seriesLabel),
	);
	const area = $derived(chartArea(chart, sheet.source, sheet.active));
	const range = $derived(
		area ? areaName(area, sheet.source.names, sheet.active) : "",
	);
	const round = $derived(chart.type === "pie" || chart.type === "doughnut");
	/** Whether the series run down columns, judged from the first one. */
	const byColumn = $derived.by(() => {
		const first = areaOf(chart.series[0]?.values, sheet.source, sheet.active);
		return !first || first.left === first.right;
	});
	let rangeProblem = $state(false);

	/** Every change lands with explicit colours for whatever lacks one. */
	const commit = (next: Chart) =>
		sheet.updateChart(
			withColors(
				next,
				chartPalette(),
				chartData(next, sheet.source, sheet.active).categories.length,
			),
		);

	const update = (patch: Partial<Chart>) => commit({ ...chart, ...patch });

	function setAxis(which: "x" | "y", patch: Partial<ChartAxis>) {
		const axis: ChartAxis = { ...chart[which], ...patch };
		for (const key of Object.keys(axis) as (keyof ChartAxis)[]) {
			if (axis[key] === undefined || axis[key] === "" || axis[key] === false) {
				delete axis[key];
			}
		}
		update({ [which]: axis });
	}

	function setRange(text: string) {
		const next = areaOf(text.trim(), sheet.source, sheet.active);
		rangeProblem = next === null;
		if (next && text !== range) {
			commit(withData(chart, sheet.source, next, byColumn));
		}
	}

	function setType(type: ChartType) {
		const patch: Partial<Chart> = { type };
		if (!isGroupable(type)) {
			patch.grouping = undefined;
		}
		if (type === "pie" || type === "doughnut") {
			patch.legend = chart.legend === "none" ? "r" : chart.legend;
		}
		update(patch);
	}

	const number = (text: string): number | undefined => {
		const n = Number(text.replace(",", "."));
		return text.trim() !== "" && Number.isFinite(n) ? n : undefined;
	};

	function setColor(index: number, color: string | undefined) {
		const series = chart.series.slice();
		const target = series[index];
		if (!target) {
			return;
		}
		series[index] = { ...target, color };
		if (!color) {
			delete series[index].color;
		}
		update({ series });
	}

	function setPoint(index: number, color: string | null) {
		const first = chart.series[0];
		if (!first) {
			return;
		}
		const points = Array.from(
			{ length: Math.max(data.categories.length, first.points?.length ?? 0) },
			(_, i) => first.points?.[i] ?? null,
		);
		points[index] = color;
		update({ series: [{ ...first, points }, ...chart.series.slice(1)] });
	}

	const enter = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			(event.currentTarget as HTMLInputElement).blur();
		}
	};

	const SELECT =
		"border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden";
</script>

{#snippet swatch(
	label: string,
	color: string | null | undefined,
	auto: string,
	pick: (color: string | undefined) => void,
)}
	<div class="flex min-w-0 items-center gap-2">
		<label
			class="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border"
			style="background: {color ?? auto}"
			title={label}
		>
			<input
				type="color"
				class="absolute inset-0 size-full cursor-pointer opacity-0"
				aria-label={m.chart_series_colour({ series: label })}
				value={color ?? "#888888"}
				onchange={(e) => pick(e.currentTarget.value)}
			/>
		</label>
		<span class="min-w-0 flex-1 truncate text-sm">{label}</span>
		{#if color}
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground text-xs"
				onclick={() => pick(undefined)}
			>
				{m.chart_colour_automatic()}
			</button>
		{/if}
	</div>
{/snippet}

<aside
	class="chart-palette bg-surface-base fixed inset-x-0 bottom-0 z-40 flex max-h-[55vh] flex-col overflow-hidden rounded-t-xl border shadow-lg md:static md:z-auto md:max-h-none md:w-80 md:shrink-0 md:rounded-lg md:shadow-none"
	aria-label={m.chart_editor()}
>
	<header class="flex items-center justify-between border-b px-3 py-2">
		<h2 class="text-sm font-medium">{m.chart_editor()}</h2>
		<button
			type="button"
			class="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-md"
			aria-label={m.chart_close()}
			onclick={() => (sheet.chartPanel = false)}
		>
			<XIcon class="size-4" />
		</button>
	</header>
	<div class="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-3">
		<div class="flex flex-col gap-2">
			<Label for="chart-type">{m.chart_type()}</Label>
			<select
				id="chart-type"
				class={SELECT}
				value={chart.type}
				onchange={(e) => setType(e.currentTarget.value as ChartType)}
			>
				{#each CHART_TYPES as type (type)}
					<option value={type}>{TYPE_LABELS[type]()}</option>
				{/each}
			</select>
		</div>
		{#if isGroupable(chart.type)}
			<div class="flex flex-col gap-2">
				<Label for="chart-stacking">{m.chart_stacking()}</Label>
				<select
					id="chart-stacking"
					class={SELECT}
					value={chart.grouping ?? "clustered"}
					onchange={(e) => {
						const value = e.currentTarget.value as Grouping;
						update({ grouping: value === "clustered" ? undefined : value });
					}}
				>
					<option value="clustered">{m.chart_stacking_none()}</option>
					<option value="stacked">{m.chart_stacking_stacked()}</option>
					<option value="percent">{m.chart_stacking_percent()}</option>
				</select>
			</div>
		{/if}
		<div class="flex flex-col gap-2">
			<Label for="chart-range">{m.chart_data_range()}</Label>
			<Input
				id="chart-range"
				value={range}
				placeholder="A1:C10"
				aria-invalid={rangeProblem}
				onchange={(e) => setRange(e.currentTarget.value)}
				onkeydown={enter}
			/>
			{#if rangeProblem}
				<p class="text-destructive text-xs">{m.chart_data_range_invalid()}</p>
			{/if}
			{#if area}
				<div class="flex gap-1" role="group" aria-label={m.chart_series_in()}>
					{#each [[true, m.chart_series_columns()], [false, m.chart_series_rows()]] as const as [value, label] (label)}
						<button
							type="button"
							aria-pressed={byColumn === value}
							class={cn(
								"h-8 flex-1 rounded-md border px-2 text-xs",
								byColumn === value
									? "bg-primary text-primary-foreground border-primary"
									: "hover:bg-muted",
							)}
							onclick={() => {
								if (byColumn !== value) {
									commit(withData(chart, sheet.source, area, value));
								}
							}}
						>
							{label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<Label for="chart-title">{m.chart_title()}</Label>
			<Input
				id="chart-title"
				value={chart.title ?? ""}
				onchange={(e) => update({ title: e.currentTarget.value || undefined })}
				onkeydown={enter}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label for="chart-legend">{m.chart_legend()}</Label>
			<select
				id="chart-legend"
				class={SELECT}
				value={chart.legend}
				onchange={(e) =>
					update({ legend: e.currentTarget.value as LegendPosition })}
			>
				{#each LEGENDS as [value, label] (value)}
					<option {value}>{label()}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-2">
			<Label>
				<Checkbox
					checked={chart.labels === true}
					onCheckedChange={(checked) =>
						update({ labels: checked || undefined })}
				/>
				{m.chart_labels()}
			</Label>
			{#if chart.type === "line"}
				<Label>
					<Checkbox
						checked={chart.markers === true}
						onCheckedChange={(checked) =>
							update({ markers: checked || undefined })}
					/>
					{m.chart_markers()}
				</Label>
			{/if}
		</div>
		{#if !round}
			<fieldset class="flex min-w-0 flex-col gap-2">
				<legend class="mb-2 text-sm font-medium">{m.chart_axes()}</legend>
				<Label for="chart-x-title" class="text-muted-foreground font-normal">
					{chart.type === "scatter"
						? m.chart_axis_x()
						: m.chart_axis_categories()}
				</Label>
				<Input
					id="chart-x-title"
					value={chart.x.title ?? ""}
					onchange={(e) => setAxis("x", { title: e.currentTarget.value })}
					onkeydown={enter}
				/>
				<Label for="chart-y-title" class="text-muted-foreground font-normal">
					{chart.type === "scatter" ? m.chart_axis_y() : m.chart_axis_values()}
				</Label>
				<Input
					id="chart-y-title"
					value={chart.y.title ?? ""}
					onchange={(e) => setAxis("y", { title: e.currentTarget.value })}
					onkeydown={enter}
				/>
				<div class="grid grid-cols-2 gap-2">
					<div class="flex min-w-0 flex-col gap-1">
						<Label for="chart-min" class="text-muted-foreground font-normal">
							{m.chart_axis_min()}
						</Label>
						<Input
							id="chart-min"
							inputmode="decimal"
							placeholder={m.chart_auto()}
							value={chart.y.min ?? ""}
							onchange={(e) =>
								setAxis("y", { min: number(e.currentTarget.value) })}
							onkeydown={enter}
						/>
					</div>
					<div class="flex min-w-0 flex-col gap-1">
						<Label for="chart-max" class="text-muted-foreground font-normal">
							{m.chart_axis_max()}
						</Label>
						<Input
							id="chart-max"
							inputmode="decimal"
							placeholder={m.chart_auto()}
							value={chart.y.max ?? ""}
							onchange={(e) =>
								setAxis("y", { max: number(e.currentTarget.value) })}
							onkeydown={enter}
						/>
					</div>
				</div>
				<Label class="mt-1">
					<Checkbox
						checked={chart.y.gridlines === true}
						onCheckedChange={(checked) => setAxis("y", { gridlines: checked })}
					/>
					{m.chart_gridlines()}
				</Label>
			</fieldset>
		{/if}
		<fieldset class="flex min-w-0 flex-col gap-2">
			<legend class="mb-2 text-sm font-medium">{m.chart_colours()}</legend>
			{#if round}
				{#each data.categories as label, i (i)}
					{@render swatch(
						label,
						chart.series[0]?.points?.[i],
						APP_THEME.palette[i % APP_THEME.palette.length] ?? "",
						(color) => setPoint(i, color ?? null),
					)}
				{/each}
			{:else}
				{#each chart.series as series, i (i)}
					{@render swatch(
						data.series[i]?.name ?? "",
						series.color,
						APP_THEME.palette[i % APP_THEME.palette.length] ?? "",
						(color) => setColor(i, color),
					)}
				{/each}
			{/if}
		</fieldset>
	</div>
</aside>
