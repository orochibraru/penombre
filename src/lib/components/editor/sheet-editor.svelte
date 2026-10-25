<script lang="ts">
	import { type Snippet, untrack } from "svelte";

	import { cellKey } from "#lib/editor/comments.js";
	import { cellName, parseName } from "#lib/sheet/selection.js";

	import ChartPanel from "./sheet/chart-panel.svelte";
	import DropdownPanel from "./sheet/dropdown-panel.svelte";
	import { dropdownsOf } from "./sheet/dropdowns.svelte.js";
	import FormatToolbar from "./sheet/format-toolbar.svelte";
	import FormulaBar from "./sheet/formula-bar.svelte";
	import SheetGrid from "./sheet/sheet-grid.svelte";
	import SheetMenu from "./sheet/sheet-menu.svelte";
	import SheetTabs from "./sheet/sheet-tabs.svelte";
	import { SheetState } from "./sheet/state.svelte.js";
	import type { Comments } from "./shell/comments.svelte.js";
	import type { EditorMenuContext } from "./shell/file-actions.js";

	/**
	 * A spreadsheet over a CSV file, or over every sheet of an `.xlsx`
	 * (`workbook`, whose content is then the workbook as JSON).
	 *
	 * A cell starting with `=` is a formula, stored as typed: Excel,
	 * LibreOffice and Google Sheets all evaluate `=…` in a CSV they open, so
	 * the file keeps meaning the same thing elsewhere. The grid shows the
	 * computed value and the formula bar the text.
	 */
	const {
		content,
		onChange,
		workbook = false,
		readOnly = false,
		menu,
		comments,
	}: {
		content: string;
		onChange: (content: string) => void;
		workbook?: boolean;
		readOnly?: boolean;
		/** The shared File menu, first in the menu bar. */
		menu?: Snippet<[EditorMenuContext]>;
		/** Threads on cells: flagged in the grid, started from the menus. */
		comments?: Comments;
	} = $props();

	const sheet = untrack(() => new SheetState(content, workbook, onChange));
	const drops = dropdownsOf(sheet);

	$effect(() => {
		// A cell still being typed in is written before editing stops.
		if (readOnly) {
			untrack(() => sheet.commit());
		}
		sheet.readOnly = readOnly;
	});

	if (untrack(() => comments)) {
		sheet.onComment = () => {
			const { row, col } = sheet.selection.anchor;
			comments?.start({
				kind: "cell",
				sheet: sheet.sheet?.name ?? "",
				cell: cellName({ row, col }),
			});
		};
	}

	/** Each open thread's cell, keyed as the grid asks. */
	const threadAt = $derived(
		new Map(
			(comments?.unresolved ?? []).flatMap(({ root }) =>
				root.anchor?.kind === "cell"
					? [[cellKey(root.anchor.sheet, root.anchor.cell), root.id] as const]
					: [],
			),
		),
	);

	$effect(() => {
		sheet.comments = new Set(threadAt.keys());
	});

	// Landing on a commented cell brings its thread up in an open panel.
	$effect(() => {
		const { row, col } = sheet.selection.anchor;
		const key = cellKey(sheet.sheet?.name ?? "", cellName({ row, col }));
		const id = threadAt.get(key);
		if (id) {
			untrack(() => comments?.follow(id));
		}
	});

	// A thread picked in the panel: its cell, on its sheet.
	$effect(() => {
		const request = comments?.reveal;
		if (!request) {
			return;
		}
		untrack(() => {
			const anchor = comments?.all.find((t) => t.root.id === request.id)?.root
				.anchor;
			if (anchor?.kind !== "cell") {
				return;
			}
			const index = sheet.book.sheets.findIndex((s) => s.name === anchor.sheet);
			if (index >= 0) {
				sheet.switchTo(index);
			}
			const cell = parseName(anchor.cell);
			if (cell) {
				sheet.select(cell);
			}
		});
	});
</script>

<div class="flex min-h-0 flex-1 flex-col gap-2">
	<SheetMenu {sheet} {menu} />
	{#if !sheet.readOnly}
		<FormatToolbar {sheet} />
	{/if}
	<FormulaBar {sheet} />
	<div class="flex min-h-0 flex-1 gap-2">
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			<SheetGrid {sheet} />
		</div>
		{#if sheet.chartPanel && sheet.chart && !sheet.readOnly}
			<ChartPanel {sheet} chart={sheet.chart} />
		{:else if drops.editing && !sheet.readOnly}
			<DropdownPanel {drops} dropdown={drops.editing} />
		{/if}
	</div>
	{#if sheet.workbook}
		<SheetTabs {sheet} />
	{/if}
</div>
