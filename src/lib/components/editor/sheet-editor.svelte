<script lang="ts">
	import { PlusIcon, Trash2Icon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { parseCsv, toCsv } from "$lib/documents";
	import { m } from "$lib/paraglide/messages.js";

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

	/** Columns is the widest row: a ragged CSV still renders as a rectangle. */
	const columnCount = $derived(Math.max(1, ...rows.map((row) => row.length)));

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

    <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
        <table class="w-full border-collapse text-sm">
            <thead class="bg-muted/50 sticky top-0 z-10">
                <tr>
                    <th class="text-muted-foreground w-10 border-b border-e p-1 text-xs font-normal"
                    ></th>
                    {#each Array.from({ length: columnCount }) as _, col (col)}
                        <th
                            class="text-muted-foreground border-b border-e p-1 text-xs font-medium"
                        >
                            {columnName(col)}
                        </th>
                    {/each}
                    <th class="w-10 border-b"></th>
                </tr>
            </thead>
            <tbody>
                {#each rows as row, rowIndex (rowIndex)}
                    <tr>
                        <td
                            class="text-muted-foreground bg-muted/30 border-b border-e p-1 text-center text-xs tabular-nums"
                        >
                            {rowIndex + 1}
                        </td>
                        {#each Array.from({ length: columnCount }) as _, col (col)}
                            <td class="border-b border-e p-0">
                                <input
                                    class="focus:bg-primary/5 focus:ring-primary w-full min-w-28 bg-transparent px-2 py-1 outline-none focus:ring-1 focus:ring-inset"
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
            </tbody>
        </table>
    </div>
</div>
