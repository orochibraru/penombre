<script lang="ts">
	import {
		ArrowDownAZIcon,
		ArrowUpZAIcon,
		ChevronDownIcon,
		PlusIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { flushSync, untrack } from "svelte";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { columnName } from "#lib/formula.js";
	import { m } from "#lib/paraglide/messages.js";
	import { type Cell, inRect, type Rect } from "#lib/sheet/selection.js";
	import { cn } from "#lib/utils.js";
	import CellMenu from "./cell-menu.svelte";
	import Completion from "./completion.svelte";
	import { editorKey, gridKey } from "./keys.js";
	import type { SheetState } from "./state.svelte.js";

	/**
	 * The grid. Only the rows on screen are in the DOM: a 20k-row CSV is an
	 * ordinary export, and one element per cell never finished loading. Rows
	 * are a fixed height so the scrollbar is the real one, and two spacer rows
	 * stand in for the rest. Cells are text; the one being edited holds the
	 * only input.
	 */
	const { sheet }: { sheet: SheetState } = $props();

	const ROW_HEIGHT = 33;
	const OVERSCAN = 6;
	/** The row numbers' column. */
	const GUTTER = 40;

	let scroller = $state<HTMLDivElement>();
	let clipboardArea = $state<HTMLTextAreaElement>();
	let editor = $state<HTMLTextAreaElement | null>(null);
	let completion = $state<ReturnType<typeof Completion>>();
	let scrollTop = $state(0);
	let viewportHeight = $state(0);
	/** Whether the cell editor, not the formula bar, has the focus. */
	let editorFocused = $state(false);

	const cols = $derived(Array.from({ length: sheet.bounds.cols }, (_, c) => c));
	const tableWidth = $derived(
		cols.reduce((sum, col) => sum + sheet.widthOf(col), GUTTER),
	);
	/** Before measurement — SSR, first paint — assume a tall-ish viewport. */
	const windowHeight = $derived(viewportHeight || 720);
	const bodyCount = $derived(sheet.bounds.rows - sheet.bodyStart);
	const firstRow = $derived(
		Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN),
	);
	const lastRow = $derived(
		Math.min(
			bodyCount,
			Math.ceil((scrollTop + windowHeight) / ROW_HEIGHT) + OVERSCAN,
		),
	);
	const padTop = $derived(firstRow * ROW_HEIGHT);
	const padBottom = $derived((bodyCount - lastRow) * ROW_HEIGHT);

	$effect(() => {
		sheet.focusGrid = () => scroller?.focus({ preventScroll: true });
	});

	/** Scrolls a cell into the part of the grid the headers do not cover. */
	function reveal({ row, col }: Cell) {
		const box = scroller;
		if (!box) {
			return;
		}
		const head = (1 + sheet.bodyStart) * ROW_HEIGHT;
		if (row >= sheet.bodyStart) {
			const y = (row - sheet.bodyStart) * ROW_HEIGHT;
			if (y < box.scrollTop) {
				box.scrollTop = y;
			} else if (y + ROW_HEIGHT + head > box.scrollTop + box.clientHeight) {
				box.scrollTop = y + ROW_HEIGHT + head - box.clientHeight;
			}
		}
		let x = 0;
		for (let c = 0; c < col; c++) {
			x += sheet.widthOf(c);
		}
		const width = sheet.widthOf(col);
		if (x < box.scrollLeft) {
			box.scrollLeft = x;
		} else if (x + width + GUTTER > box.scrollLeft + box.clientWidth) {
			box.scrollLeft = x + width + GUTTER - box.clientWidth;
		}
		scrollTop = box.scrollTop;
	}

	$effect(() => {
		const focus = sheet.selection.focus;
		untrack(() => reveal(focus));
	});

	// =====================================================================
	// Pointer
	// =====================================================================

	let dragging = false;
	/** Dragging out a range to put into the formula being typed. */
	let picking = false;
	let pointer = "mouse";

	function cellAt(target: EventTarget | null): Cell | null {
		const td =
			target instanceof Element
				? target.closest<HTMLElement>("td[data-col]")
				: null;
		return td
			? { row: Number(td.dataset.row), col: Number(td.dataset.col) }
			: null;
	}

	function onpointerdown(event: PointerEvent) {
		pointer = event.pointerType;
		const cell = cellAt(event.target);
		if (!cell || event.target instanceof HTMLTextAreaElement) {
			return;
		}
		if (sheet.pointing) {
			// Typing a formula: the click names the cell, the editor keeps
			// the focus. Touch does it on click.
			if (pointer === "mouse" && event.button === 0) {
				event.preventDefault();
				sheet.pointAt(cell, event.shiftKey);
				picking = true;
			}
			return;
		}
		if (event.button === 2) {
			// A right click outside the selection selects what it is on.
			if (!sheet.selected(cell.row, cell.col)) {
				sheet.selectCell(cell);
			}
			return;
		}
		// Touch selects on click instead, so a swipe still scrolls.
		if (event.button !== 0 || pointer !== "mouse") {
			return;
		}
		event.preventDefault();
		sheet.commit();
		sheet.focusGrid();
		sheet.selectCell(cell, event.shiftKey);
		dragging = true;
	}

	function onpointermove(event: PointerEvent) {
		if (!(dragging || picking)) {
			return;
		}
		const cell = cellAt(
			document.elementFromPoint(event.clientX, event.clientY),
		);
		if (cell && picking) {
			sheet.pointAt(cell, true);
		} else if (cell) {
			sheet.selectCell(cell, true);
		}
	}

	/** A tap: selects, and a second tap on the same cell edits it. */
	function onclick(event: MouseEvent) {
		const cell = cellAt(event.target);
		if (
			pointer === "mouse" ||
			!cell ||
			event.target instanceof HTMLTextAreaElement
		) {
			return;
		}
		if (sheet.pointing && sheet.editing && !sheet.editing.bar) {
			sheet.pointAt(cell, false);
			editor?.focus();
			return;
		}
		const { anchor } = sheet.selection;
		const again =
			sheet.singleCell && anchor.row === cell.row && anchor.col === cell.col;
		sheet.commit();
		if (again) {
			sheet.begin("edit");
			// Mounted and focused inside the tap, or iOS keeps its keyboard shut.
			flushSync();
		} else {
			sheet.selectCell(cell);
		}
	}

	function ondblclick(event: MouseEvent) {
		const cell = cellAt(event.target);
		if (cell && !sheet.editing) {
			sheet.selectCell(cell);
			sheet.begin("edit");
			flushSync();
		}
	}

	function selectLine(event: PointerEvent, pick: () => void) {
		event.preventDefault();
		sheet.commit();
		sheet.focusGrid();
		pick();
	}

	// =====================================================================
	// Keyboard and clipboard
	// =====================================================================

	/**
	 * The browser only copies and pastes where there is text, so for the
	 * length of the shortcut the focus moves to an off-screen textarea
	 * holding the selection, and comes back once the browser is done.
	 */
	function clipboard(kind: "copy" | "cut" | "paste") {
		const area = clipboardArea;
		if (!area) {
			return;
		}
		area.value = kind === "paste" ? "" : sheet.copy(kind === "cut");
		area.focus({ preventScroll: true });
		area.select();
		setTimeout(() => sheet.focusGrid(), 0);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.target !== event.currentTarget) {
			return;
		}
		const result = gridKey(sheet, event, {
			clipboard,
			page: Math.max(1, Math.floor(windowHeight / ROW_HEIGHT) - 2),
			typeInto: () => flushSync(),
		});
		if (result === "prevent") {
			event.preventDefault();
		}
		if (sheet.editing) {
			// The next key must land in the editor, however fast it comes.
			flushSync();
		}
	}

	function onEditorKey(event: KeyboardEvent) {
		if (completion?.key(event) || editorKey(sheet, event, true)) {
			event.preventDefault();
		}
		event.stopPropagation();
	}

	/** The cell editor takes the focus as it mounts, caret at the end. */
	function focusEditor(node: HTMLTextAreaElement) {
		node.focus({ preventScroll: true });
		node.setSelectionRange(node.value.length, node.value.length);
		sheet.caret = node.value.length;
	}

	$effect(() => {
		void sheet.caretMoved;
		untrack(() => {
			if (editor && document.activeElement === editor) {
				editor.setSelectionRange(sheet.caret, sheet.caret);
			}
		});
	});

	// =====================================================================
	// Column widths
	// =====================================================================

	function startResize(event: PointerEvent, col: number) {
		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
		const startX = event.clientX;
		const startWidth = sheet.widthOf(col);
		const move = (e: PointerEvent) =>
			sheet.setWidth(col, startWidth + e.clientX - startX);
		const stop = () => {
			handle.removeEventListener("pointermove", move);
			handle.removeEventListener("pointerup", stop);
		};
		handle.addEventListener("pointermove", move);
		handle.addEventListener("pointerup", stop);
	}

	/** Double-click on a column's edge: as wide as its widest text. */
	function autofit(col: number) {
		const context = document.createElement("canvas").getContext("2d");
		if (!(context && scroller)) {
			return;
		}
		context.font = getComputedStyle(scroller).font;
		let widest = context.measureText(columnName(col)).width;
		for (let row = 0; row < sheet.rows.length; row++) {
			widest = Math.max(
				widest,
				context.measureText(sheet.shown(row, col)).width,
			);
		}
		// The cell's own padding, and a little air.
		sheet.setWidth(col, Math.min(widest + 24, 640));
	}

	/** The sides of `rect` that `row`, `col` sits on, for drawing its outline. */
	function edges(rect: Rect, row: number, col: number): string {
		return [
			row === rect.top ? "2px" : "0",
			col === rect.right ? "2px" : "0",
			row === rect.bottom ? "2px" : "0",
			col === rect.left ? "2px" : "0",
		].join(" ");
	}
</script>

{#snippet cell(row: number, col: number)}
    {@const anchor = sheet.selection.anchor}
    {@const active = anchor.row === row && anchor.col === col}
    {@const selected = sheet.selected(row, col)}
    {@const editing =
        sheet.editing?.row === row && sheet.editing.col === col ? sheet.editing : null}
    <td
        data-row={row}
        data-col={col}
        role="gridcell"
        aria-selected={selected}
        class={cn(
            "relative truncate border-e border-b px-2 whitespace-nowrap",
            col === 0 && sheet.frozen && "bg-surface-base sticky left-10 z-5",
            sheet.numeric(row, col) && "text-end tabular-nums",
            sheet.failed(row, col) && "text-destructive",
            row === 0 && sheet.bodyStart > 0 && "font-medium",
        )}
    >
        {#if editing && !editing.bar}
            <!-- A textarea, not an input: an input drops the line breaks of a
                 cell that has them. Alt+Enter adds one. -->
            <textarea
                bind:this={editor}
                use:focusEditor
                data-sheet-editor
                aria-label={m.sheet_formula()}
                spellcheck="false"
                autocomplete="off"
                rows="1"
                wrap="off"
                class="bg-surface-base absolute inset-0 z-2 w-full resize-none overflow-hidden px-2 py-1.5 font-mono text-base leading-5 outline-none select-text md:text-sm"
                value={sheet.editing?.draft ?? ""}
                oninput={(e) => {
                    sheet.setDraft(e.currentTarget.value);
                    sheet.caret = e.currentTarget.selectionStart ?? 0;
                }}
                onkeyup={(e) => (sheet.caret = e.currentTarget.selectionStart ?? 0)}
                onclick={(e) => (sheet.caret = e.currentTarget.selectionStart ?? 0)}
                onkeydown={onEditorKey}
                onfocus={() => (editorFocused = true)}
                onblur={(e) => {
                    editorFocused = false;
                    const to = e.relatedTarget as HTMLElement | null;
                    if (sheet.editing && to !== scroller && !to?.closest("[data-sheet-editor]")) {
                        sheet.commit();
                    }
                }}
            ></textarea>
        {:else if editing}
            {editing.draft}
        {:else}
            {sheet.shown(row, col)}
        {/if}
        {#if active}
            <span
                class="ring-primary pointer-events-none absolute inset-0 z-3 ring-2 ring-inset"
            ></span>
        {:else if selected && !sheet.singleCell}
            <!-- A tint of its own, over an opaque cell: a frozen column's
                 cells hide the ones scrolling under them. -->
            <span
                class="border-primary bg-primary/10 pointer-events-none absolute inset-0"
                style="border-width: {edges(sheet.rect, row, col)}"
            ></span>
        {/if}
        {#if sheet.picked && inRect(sheet.picked, row, col)}
            <span
                class="border-primary bg-primary/5 pointer-events-none absolute inset-0 border-dotted"
                style="border-width: {edges(sheet.picked, row, col)}"
            ></span>
        {/if}
        {#if sheet.commented(row, col)}
            <!-- A comment: the corner flag spreadsheets use. -->
            <span
                class="border-t-primary pointer-events-none absolute inset-e-0 top-0 z-4 border-t-8 border-s-8 border-s-transparent"
            ></span>
        {/if}
        {#if sheet.isCopied(row, col) && sheet.copied}
            <span
                class="border-primary pointer-events-none absolute inset-0 border-dashed"
                style="border-width: {edges(sheet.copied.rect, row, col)}"
            ></span>
        {/if}
    </td>
{/snippet}

{#snippet line(row: number)}
    {@const selected = sheet.rect.top <= row && row <= sheet.rect.bottom}
    <tr style="height: {ROW_HEIGHT}px">
        <td role="rowheader" class="bg-surface-base sticky left-0 z-10 border-e border-b p-0">
            <button
                type="button"
                tabindex="-1"
                class={cn(
                    "size-full text-xs tabular-nums",
                    selected ? "bg-primary/15 text-foreground" : "bg-muted/40 text-muted-foreground",
                )}
                onpointerdown={(e) => selectLine(e, () => sheet.selectRows(row, e.shiftKey))}
            >
                {row + 1}
            </button>
        </td>
        {#each cols as col (col)}
            {@render cell(row, col)}
        {/each}
    </tr>
{/snippet}

<CellMenu {sheet}>
    <div
        bind:this={scroller}
        bind:clientHeight={viewportHeight}
        role="grid"
        aria-multiselectable="true"
        aria-label={m.sheet_grid()}
        tabindex="0"
        class="focus-visible:ring-ring/50 min-h-0 flex-1 touch-manipulation overflow-auto rounded-lg border outline-none select-none focus-visible:ring-2"
        onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}
        {onkeydown}
        {onpointerdown}
        {onpointermove}
        {onclick}
        {ondblclick}
    >
        <table
            class="table-fixed border-separate border-spacing-0 text-sm"
            style="width: {tableWidth}px"
        >
            <colgroup>
                <col style="width: {GUTTER}px" />
                {#each cols as col (col)}
                    <col style="width: {sheet.widthOf(col)}px" />
                {/each}
            </colgroup>
            <!-- `bg-surface-base` under the headers' tint. Every panel token in
                 this theme carries alpha so the aurora washes through, and a
                 header that is sticky over thousands of rows is the one place
                 that cannot: `bg-muted` alone left them scrolling visibly
                 through it. `--surface-base` is the opaque one. -->
            <thead class="bg-surface-base sticky top-0 z-20">
                <tr style="height: {ROW_HEIGHT}px">
                    <th class="bg-surface-base sticky left-0 z-10 border-e border-b p-0">
                        <button
                            type="button"
                            tabindex="-1"
                            aria-label={m.sheet_select_all()}
                            class="bg-muted size-full"
                            onpointerdown={(e) => selectLine(e, sheet.selectAll)}
                        ></button>
                    </th>
                    {#each cols as col (col)}
                        {@const selected = sheet.rect.left <= col && col <= sheet.rect.right}
                        <th
                            aria-label={columnName(col)}
                            class={cn(
                                "relative border-e border-b p-0 text-xs font-medium",
                                col === 0 && sheet.frozen && "bg-surface-base sticky left-10 z-5",
                            )}
                        >
                            <button
                                type="button"
                                tabindex="-1"
                                class={cn(
                                    "size-full",
                                    selected ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                                )}
                                onpointerdown={(e) => selectLine(e, () => sheet.selectCols(col, e.shiftKey))}
                            >
                                {columnName(col)}
                            </button>
                            {#if !sheet.readOnly}
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger
                                    class="text-muted-foreground hover:text-foreground absolute inset-e-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded"
                                    aria-label={m.sheet_column_menu({ column: columnName(col) })}
                                >
                                    <ChevronDownIcon class="size-3" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="start">
                                    <DropdownMenu.Item onclick={() => sheet.sort(false, col)}>
                                        <ArrowDownAZIcon class="size-4" />
                                        {m.sheet_sort_ascending()}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item onclick={() => sheet.sort(true, col)}>
                                        <ArrowUpZAIcon class="size-4" />
                                        {m.sheet_sort_descending()}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item
                                        onclick={() => {
                                            sheet.selectCols(col, false);
                                            sheet.insertCols(false);
                                        }}
                                    >
                                        <PlusIcon class="size-4" />
                                        {m.sheet_insert_column_left()}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onclick={() => {
                                            sheet.selectCols(col, false);
                                            sheet.insertCols(true);
                                        }}
                                    >
                                        <PlusIcon class="size-4" />
                                        {m.sheet_insert_column_right()}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        variant="destructive"
                                        onclick={() => {
                                            sheet.selectCols(col, false);
                                            sheet.deleteCols();
                                        }}
                                    >
                                        <Trash2Icon class="size-4" />
                                        {m.sheet_delete_column()}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                            {/if}
                            <!-- Drag to resize, double-click to fit; wide
                                 enough for a finger. -->
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                aria-label={m.sheet_resize_column()}
                                class="hover:bg-primary/40 absolute inset-y-0 -inset-e-1.5 z-10 w-3 cursor-col-resize touch-none"
                                onpointerdown={(e) => startResize(e, col)}
                                ondblclick={() => autofit(col)}
                            ></div>
                        </th>
                    {/each}
                </tr>
                {#if sheet.bodyStart > 0}
                    {@render line(0)}
                {/if}
            </thead>
            <tbody>
                <!-- A row with no cell in it is laid out at zero height however
                     tall it is told to be, so each spacer carries a spanning
                     `td`. -->
                {#if padTop > 0}
                    <tr aria-hidden="true">
                        <td colspan={cols.length + 1} style="height: {padTop}px"></td>
                    </tr>
                {/if}
                {#each { length: lastRow - firstRow } as _, offset (sheet.bodyStart + firstRow + offset)}
                    {@render line(sheet.bodyStart + firstRow + offset)}
                {/each}
                {#if padBottom > 0}
                    <tr aria-hidden="true">
                        <td colspan={cols.length + 1} style="height: {padBottom}px"></td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</CellMenu>

<!-- Where the browser copies from and pastes into; see `clipboard`. -->
<textarea
    bind:this={clipboardArea}
    aria-hidden="true"
    tabindex="-1"
    class="pointer-events-none fixed top-0 left-[-9999px] size-px opacity-0"
    oncopy={(e) => {
        e.clipboardData?.setData("text/plain", e.currentTarget.value);
        e.preventDefault();
    }}
    oncut={(e) => {
        e.clipboardData?.setData("text/plain", e.currentTarget.value);
        e.preventDefault();
    }}
    onpaste={(e) => {
        e.preventDefault();
        sheet.paste(e.clipboardData?.getData("text/plain") ?? "");
    }}
></textarea>

<svelte:window
    onpointerup={() => {
        dragging = false;
        picking = false;
    }}
/>

{#if sheet.editing && editorFocused}
    <Completion
        bind:this={completion}
        text={sheet.editing.draft}
        caret={sheet.caret}
        anchor={editor}
        onpick={(next) => {
            sheet.setDraft(next.text);
            sheet.placeCaret(next.caret);
        }}
    />
{/if}
