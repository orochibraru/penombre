<script lang="ts">
	import { PlusIcon, Trash2Icon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import { parseCsv, toCsv } from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";

	/**
	 * A spreadsheet grid over a CSV file.
	 *
	 * Values only — no formulas. A CSV that stored formulas would either lose
	 * them on every other tool that opens it, or stop being a CSV; keeping to
	 * the format's own semantics is what makes the file portable.
	 */
	let {
		content,
		onChange,
	}: { content: string; onChange: (csv: string) => void } = $props();

	let rows = $state<string[][]>(untrack(() => parseCsv(content)));

	/**
	 * Columns is the widest row: a ragged CSV still renders as a rectangle.
	 * Reduced rather than spread into `Math.max` — a real spreadsheet export
	 * is tens of thousands of rows, and that many arguments is a RangeError.
	 */
	const columnCount = $derived(
		rows.reduce((widest, row) => Math.max(widest, row.length), 1),
	);

	/**
	 * Only the rows on screen are in the DOM. A 20k-row CSV is an ordinary
	 * export, and one `<input>` per cell was ~200k elements: the page never
	 * finished loading and the tab died. Height per row is fixed so the
	 * scrollbar can be the real one rather than a simulated position.
	 */
	const ROW_HEIGHT = 33;
	const OVERSCAN = 6;

	let scrollTop = $state(0);
	let viewportHeight = $state(0);

	/** Before measurement — SSR, first paint — assume a tall-ish viewport. */
	const windowHeight = $derived(viewportHeight || 720);
	const firstRow = $derived(
		Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN),
	);
	const lastRow = $derived(
		Math.min(
			rows.length,
			Math.ceil((scrollTop + windowHeight) / ROW_HEIGHT) + OVERSCAN,
		),
	);
	const padTop = $derived(firstRow * ROW_HEIGHT);
	const padBottom = $derived((rows.length - lastRow) * ROW_HEIGHT);

	/** Spreadsheet-style column names: A…Z, AA, AB… */
	function columnName(index: number): string {
		let name = "";
		let n = index;
		do {
			name = String.fromCharCode(65 + (n % 26)) + name;
			n = Math.floor(n / 26) - 1;
		} while (n >= 0);
		return name;
	}

	function commit() {
		onChange(toCsv(rows));
	}

	function setCell(rowIndex: number, colIndex: number, value: string) {
		const row = rows[rowIndex];
		if (!row) {
			return;
		}
		// Pad so editing a cell past the end of a short row works.
		while (row.length <= colIndex) {
			row.push("");
		}
		row[colIndex] = value;
		commit();
	}

	function addRow() {
		rows.push(Array.from({ length: columnCount }, () => ""));
		commit();
	}

	function addColumn() {
		for (const row of rows) {
			while (row.length < columnCount) {
				row.push("");
			}
			row.push("");
		}
		commit();
	}

	function removeRow(index: number) {
		// Never leave the grid with nothing to type into.
		if (rows.length <= 1) {
			rows = [Array.from({ length: columnCount }, () => "")];
		} else {
			rows.splice(index, 1);
		}
		commit();
	}
</script>

<div class="flex min-h-0 flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onclick={addRow}>
            <PlusIcon class="size-3.5" />
            {m.sheet_add_row()}
        </Button>
        <Button variant="outline" size="sm" onclick={addColumn}>
            <PlusIcon class="size-3.5" />
            {m.sheet_add_column()}
        </Button>
    </div>

    <div
        class="min-h-0 flex-1 overflow-auto rounded-lg border"
        bind:clientHeight={viewportHeight}
        onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}
    >
        <table
            class="w-full table-fixed border-collapse text-sm"
            style="min-width: {2.5 + columnCount * 7 + 2.5}rem"
        >
            <colgroup>
                <col style="width: 2.5rem" />
                {#each Array.from({ length: columnCount }) as _, col (col)}
                    <col />
                {/each}
                <col style="width: 2.5rem" />
            </colgroup>
            <!-- `bg-surface-base` under the cells' tint. Every panel token in
                 this theme carries alpha so the aurora washes through, and a
                 header that is sticky over thousands of rows is the one place
                 that cannot: `bg-muted` alone left them scrolling visibly
                 through it. `--surface-base` is the opaque one. -->
            <thead class="bg-surface-base sticky top-0 z-10">
                <tr>
                    <th
                        class="text-muted-foreground bg-muted border-b border-e p-1 text-xs font-normal"
                    ></th>
                    {#each Array.from({ length: columnCount }) as _, col (col)}
                        <th
                            class="text-muted-foreground bg-muted border-b border-e p-1 text-xs font-medium"
                        >
                            {columnName(col)}
                        </th>
                    {/each}
                    <th class="bg-muted border-b"></th>
                </tr>
            </thead>
            <tbody>
                <!-- Two spacers stand in for the rows that are not rendered,
                     so the scrollbar measures the whole sheet. A row with no
                     cell in it is laid out at zero height however tall it is
                     told to be, so each one carries a spanning `td`. -->
                {#if padTop > 0}
                    <tr aria-hidden="true">
                        <td colspan={columnCount + 2} style="height: {padTop}px"
                        ></td>
                    </tr>
                {/if}
                {#each rows.slice(firstRow, lastRow) as row, offset (firstRow + offset)}
                    {@const rowIndex = firstRow + offset}
                    <tr style="height: {ROW_HEIGHT}px">
                        <td
                            class="text-muted-foreground bg-muted/30 border-b border-e p-1 text-center text-xs tabular-nums"
                        >
                            {rowIndex + 1}
                        </td>
                        {#each Array.from({ length: columnCount }) as _, col (col)}
                            <td class="border-b border-e p-0">
                                <input
                                    class="focus:bg-primary/5 focus:ring-primary w-full bg-transparent px-2 py-1 outline-none focus:ring-1 focus:ring-inset"
                                    value={row[col] ?? ""}
                                    oninput={(e) =>
                                        setCell(
                                            rowIndex,
                                            col,
                                            e.currentTarget.value,
                                        )}
                                />
                            </td>
                        {/each}
                        <td class="border-b p-0 text-center">
                            <button
                                type="button"
                                class="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                aria-label={m.sheet_delete_row()}
                                onclick={() => removeRow(rowIndex)}
                            >
                                <Trash2Icon class="size-3.5" />
                            </button>
                        </td>
                    </tr>
                {/each}
                {#if padBottom > 0}
                    <tr aria-hidden="true">
                        <td
                            colspan={columnCount + 2}
                            style="height: {padBottom}px"
                        ></td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>
