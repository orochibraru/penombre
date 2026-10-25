<script lang="ts">
	import { CopyIcon, PencilIcon, Trash2Icon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import { chartData } from "#lib/chart/data.js";
	import { nearestEdge } from "#lib/chart/edit.js";
	import {
		type Chart,
		type ChartAnchor,
		isEditable,
		MIN_CHART_SIZE,
	} from "#lib/chart/model.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import { seriesLabel } from "./chart-defaults.js";
	import ChartView from "./chart-view.svelte";
	import type { SheetState } from "./state.svelte.js";
	import { anchorTop } from "./view.js";

	/**
	 * The charts floating over the grid. They sit inside the grid's scroller,
	 * placed by their anchor cell, so they scroll with the cells whatever
	 * rows are mounted. Click or tap one to pick it; drag it to move, drag
	 * its corner to resize, both snapping to cell edges on release.
	 */
	const {
		sheet,
		gutter,
		rowHeight,
	}: { sheet: SheetState; gutter: number; rowHeight: number } = $props();

	const colLeft = (col: number) => {
		let x = gutter;
		for (let c = 0; c < col; c++) {
			x += sheet.widthOf(c);
		}
		return x;
	};

	interface Drag {
		id: string;
		mode: "move" | "resize";
		x: number;
		y: number;
		dx: number;
		dy: number;
		moved: boolean;
	}
	let drag = $state<Drag | null>(null);

	function boxOf(chart: Chart) {
		const { anchor } = chart;
		const box = {
			left: colLeft(anchor.col) + anchor.x,
			top: anchorTop(sheet, anchor, rowHeight),
			width: anchor.width,
			height: anchor.height,
		};
		if (drag?.id !== chart.id || !drag.moved) {
			return box;
		}
		return drag.mode === "move"
			? { ...box, left: box.left + drag.dx, top: box.top + drag.dy }
			: {
					...box,
					width: Math.max(MIN_CHART_SIZE, box.width + drag.dx),
					height: Math.max(MIN_CHART_SIZE, box.height + drag.dy),
				};
	}

	/** Where a drag lands: the box's corner on the nearest cell edges. */
	function dropped(chart: Chart, d: Drag): ChartAnchor {
		const box = boxOf(chart);
		const rows = () => rowHeight;
		if (d.mode === "move") {
			const col = nearestEdge(box.left - gutter, sheet.widthOf);
			const row = nearestEdge(box.top - rowHeight, rows);
			return { ...chart.anchor, col: col.index, row: row.index, x: 0, y: 0 };
		}
		const right = nearestEdge(box.left + box.width - gutter, sheet.widthOf);
		const bottom = nearestEdge(box.top + box.height - rowHeight, rows);
		return {
			...chart.anchor,
			width: Math.max(MIN_CHART_SIZE, right.at + gutter - box.left),
			height: Math.max(MIN_CHART_SIZE, bottom.at + rowHeight - box.top),
		};
	}

	function start(event: PointerEvent, chart: Chart, mode: Drag["mode"]) {
		if (event.button !== 0 || sheet.readOnly) {
			return;
		}
		event.stopPropagation();
		const picked = sheet.chartId === chart.id;
		sheet.selectChart(chart.id);
		// A finger's first touch picks; only a picked chart drags, so a swipe
		// over an unpicked one still scrolls the sheet.
		if (event.pointerType !== "mouse" && !picked && mode === "move") {
			return;
		}
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		drag = {
			id: chart.id,
			mode,
			x: event.clientX,
			y: event.clientY,
			dx: 0,
			dy: 0,
			moved: false,
		};
	}

	function move(event: PointerEvent) {
		if (!drag) {
			return;
		}
		const dx = event.clientX - drag.x;
		const dy = event.clientY - drag.y;
		drag = { ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 4 };
	}

	function end(chart: Chart) {
		const d = drag;
		drag = null;
		if (d?.moved && d.id === chart.id) {
			const anchor = dropped(chart, d);
			if (JSON.stringify(anchor) !== JSON.stringify(chart.anchor)) {
				sheet.updateChart({ ...chart, anchor });
			}
		}
	}

	function nudge(chart: Chart, rows: number, cols: number) {
		sheet.updateChart({
			...chart,
			anchor: {
				...chart.anchor,
				row: Math.max(0, chart.anchor.row + rows),
				col: Math.max(0, chart.anchor.col + cols),
			},
		});
	}

	function onkeydown(event: KeyboardEvent, chart: Chart) {
		const mod = event.metaKey || event.ctrlKey;
		const key = event.key.toLowerCase();
		const arrows: Record<string, [number, number]> = {
			arrowup: [-1, 0],
			arrowdown: [1, 0],
			arrowleft: [0, -1],
			arrowright: [0, 1],
		};
		if (key === "escape") {
			sheet.selectChart(null);
			sheet.focusGrid();
		} else if (sheet.readOnly) {
			return;
		} else if (key === "delete" || key === "backspace") {
			sheet.deleteChart(chart.id);
			sheet.focusGrid();
		} else if (key === "enter" && isEditable(chart)) {
			sheet.chartPanel = true;
		} else if (mod && key === "c") {
			sheet.copyChart();
		} else if (mod && key === "v") {
			sheet.pasteChart();
		} else if (mod && key === "z") {
			if (event.shiftKey) {
				sheet.redo();
			} else {
				sheet.undo();
			}
		} else if (mod && key === "y") {
			sheet.redo();
		} else if (arrows[key] && !mod) {
			const [rows, cols] = arrows[key];
			nudge(chart, rows, cols);
		} else {
			return;
		}
		event.preventDefault();
	}

	// A chart let go of hands the keys back to the cells.
	$effect(() => {
		if (!sheet.chartId) {
			untrack(() => {
				if (document.activeElement?.closest("[data-chart]")) {
					sheet.focusGrid();
				}
			});
		}
	});

	/** Each chart's box takes the focus once picked, for its keys. */
	function focusPicked(node: HTMLElement, picked: boolean) {
		if (picked && !node.contains(document.activeElement)) {
			node.focus({ preventScroll: true });
		}
		return {
			update(next: boolean) {
				if (next && !node.contains(document.activeElement)) {
					node.focus({ preventScroll: true });
				}
			},
		};
	}
</script>

{#each sheet.charts as chart (chart.id)}
	{@const box = boxOf(chart)}
	{@const picked = sheet.chartId === chart.id}
	{@const editable = isEditable(chart)}
	<div
		role="button"
		tabindex="-1"
		data-chart={chart.id}
		aria-label={chart.title || m.chart_untitled()}
		use:focusPicked={picked}
		class={cn(
			"bg-surface-base absolute overflow-visible rounded-md border shadow-sm outline-none",
			picked ? "ring-primary z-7 ring-2" : "z-6",
			picked && !sheet.readOnly && "cursor-move touch-none",
		)}
		style="left: {box.left}px; top: {box.top}px; width: {box.width}px; height: {box.height}px"
		onpointerdown={(e) => start(e, chart, "move")}
		onpointermove={move}
		onpointerup={() => end(chart)}
		onpointercancel={() => (drag = null)}
		ondblclick={() => {
			if (editable && !sheet.readOnly) {
				sheet.chartPanel = true;
			}
		}}
		oncontextmenu={(e) => {
			// The cells' menu does not apply here; the chart's buttons do.
			e.stopPropagation();
			e.preventDefault();
			sheet.selectChart(chart.id);
		}}
		onkeydown={(e) => onkeydown(e, chart)}
	>
		<ChartView
			{chart}
			data={chartData(chart, sheet.source, sheet.active, seriesLabel)}
			width={box.width}
			height={box.height}
			empty={m.chart_empty()}
			note={editable ? undefined : m.chart_approximate()}
		/>
		{#if picked && !sheet.readOnly}
			<div
				class="bg-popover absolute top-1 right-1 flex gap-0.5 rounded-md border p-0.5 shadow-sm"
			>
				{#if editable}
					<button
						type="button"
						class="hover:bg-muted text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded"
						aria-label={m.chart_edit()}
						title={m.chart_edit()}
						onpointerdown={(e) => e.stopPropagation()}
						onclick={() => (sheet.chartPanel = true)}
					>
						<PencilIcon class="size-4" />
					</button>
					<button
						type="button"
						class="hover:bg-muted text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded"
						aria-label={m.chart_duplicate()}
						title={m.chart_duplicate()}
						onpointerdown={(e) => e.stopPropagation()}
						onclick={() => sheet.pasteChart(chart)}
					>
						<CopyIcon class="size-4" />
					</button>
				{/if}
				<button
					type="button"
					class="hover:bg-muted text-destructive flex size-8 items-center justify-center rounded"
					aria-label={m.chart_delete()}
					title={m.chart_delete()}
					onpointerdown={(e) => e.stopPropagation()}
					onclick={() => {
						sheet.deleteChart(chart.id);
						sheet.focusGrid();
					}}
				>
					<Trash2Icon class="size-4" />
				</button>
			</div>
			<!-- A corner big enough for a finger, drawn small. -->
			<div
				role="separator"
				aria-label={m.chart_resize()}
				class="absolute -right-3 -bottom-3 flex size-7 cursor-nwse-resize touch-none items-center justify-center"
				onpointerdown={(e) => start(e, chart, "resize")}
				onpointermove={move}
				onpointerup={(e) => {
					e.stopPropagation();
					end(chart);
				}}
			>
				<span class="bg-primary border-background size-3 rounded-sm border-2"
				></span>
			</div>
		{/if}
	</div>
{/each}
