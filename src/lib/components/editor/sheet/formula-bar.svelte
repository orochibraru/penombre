<script lang="ts">
	import { untrack } from "svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { parseName, rangeName } from "#lib/sheet/selection.js";
	import Completion from "./completion.svelte";
	import { editorKey } from "./keys.js";
	import type { SheetState } from "./state.svelte.js";

	/**
	 * The name box (where the selection is, and a way to jump) and the
	 * formula bar: the active cell's own text, formulas included, editable.
	 */
	const { sheet }: { sheet: SheetState } = $props();

	let input = $state<HTMLTextAreaElement | null>(null);
	let focused = $state(false);
	let completion = $state<ReturnType<typeof Completion>>();

	const anchor = $derived(sheet.selection.anchor);
	const text = $derived(
		sheet.editing?.draft ?? sheet.raw(anchor.row, anchor.col),
	);

	function jump(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if (event.key === "Escape") {
			event.currentTarget.value = rangeName(sheet.selection);
			sheet.focusGrid();
			return;
		}
		if (event.key !== "Enter") {
			return;
		}
		event.preventDefault();
		const target = parseName(event.currentTarget.value);
		if (target) {
			sheet.commit();
			sheet.select(target);
		}
		event.currentTarget.value = rangeName(sheet.selection);
		sheet.focusGrid();
	}

	$effect(() => {
		void sheet.caretMoved;
		untrack(() => {
			if (input && document.activeElement === input) {
				input.setSelectionRange(sheet.caret, sheet.caret);
			}
		});
	});

	function onkeydown(event: KeyboardEvent) {
		if (completion?.key(event) || editorKey(sheet, event, false)) {
			event.preventDefault();
		}
	}
</script>

<div class="flex items-center gap-2">
    <input
        class="border-input bg-muted/40 text-muted-foreground focus:text-foreground focus-visible:ring-ring h-8 w-20 shrink-0 rounded-md border px-2 text-center font-mono text-base outline-none md:text-xs focus-visible:ring-2"
        aria-label={m.sheet_name_box()}
        value={rangeName(sheet.selection)}
        onfocus={(e) => e.currentTarget.select()}
        onkeydown={jump}
        onblur={(e) => (e.currentTarget.value = rangeName(sheet.selection))}
    />
    <span class="text-muted-foreground font-mono text-xs italic select-none">fx</span>
    <!-- One line tall, but a textarea: an input drops line breaks. -->
    <textarea
        bind:this={input}
        class="border-input focus-visible:ring-ring h-8 min-w-0 flex-1 resize-none overflow-hidden rounded-md border bg-transparent px-2 py-1.5 font-mono text-base leading-5 outline-none md:text-sm focus-visible:ring-2"
        rows="1"
        wrap="off"
        data-sheet-editor
        aria-label={m.sheet_formula()}
        placeholder={sheet.readOnly ? "" : "=SUM(A1:A3)"}
        readonly={sheet.readOnly}
        spellcheck="false"
        autocomplete="off"
        value={text}
        onfocus={() => (focused = true)}
        onblur={(e) => {
            focused = false;
            // Leaving for anything but the cell editor writes what was typed.
            const to = e.relatedTarget as HTMLElement | null;
            if (sheet.editing && !to?.closest("[data-sheet-editor]")) {
                sheet.commit();
            }
        }}
        oninput={(e) => {
            sheet.setDraft(e.currentTarget.value);
            sheet.caret = e.currentTarget.selectionStart ?? 0;
        }}
        onkeyup={(e) => (sheet.caret = e.currentTarget.selectionStart ?? 0)}
        onclick={(e) => (sheet.caret = e.currentTarget.selectionStart ?? 0)}
        {onkeydown}
    ></textarea>
</div>

{#if focused}
    <Completion
        bind:this={completion}
        {text}
        caret={sheet.caret}
        anchor={input}
        onpick={(next) => {
            sheet.setDraft(next.text);
            sheet.placeCaret(next.caret);
        }}
    />
{/if}
