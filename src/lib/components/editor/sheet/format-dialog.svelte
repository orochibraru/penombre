<script lang="ts">
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Input } from "#lib/components/ui/input/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { formatted } from "#lib/sheet/number-formats.js";
	import { setFormat } from "./formatting.js";
	import type { SheetState } from "./state.svelte.js";

	/** A number format typed as Excel's code, previewed on the active cell. */
	const { sheet }: { sheet: SheetState } = $props();

	let code = $state("");

	const anchor = $derived(sheet.selection.anchor);
	const value = $derived(
		sheet.engine.value(sheet.active, anchor.row, anchor.col),
	);
	const preview = $derived.by(() => {
		try {
			return (
				formatted(typeof value === "number" ? value : 1234.5, code.trim()) ?? ""
			);
		} catch {
			return "";
		}
	});

	$effect(() => {
		if (sheet.formatDialog) {
			code = sheet.styleAt(anchor.row, anchor.col).format ?? "";
		}
	});

	function submit() {
		sheet.formatDialog = false;
		setFormat(sheet, code.trim() || undefined);
		sheet.focusGrid();
	}
</script>

<ResponsiveDialog
    bind:open={sheet.formatDialog}
    size="sm"
    title={m.sheet_format_custom_title()}
    submitLabel={m.sheet_format_apply()}
    submitDisabled={code.length > 255}
    onsubmit={submit}
>
    <div class="flex min-w-0 flex-col gap-2">
        <Input
            bind:value={code}
            aria-label={m.sheet_format_code()}
            placeholder="#,##0.00"
            class="font-mono"
            spellcheck="false"
            autocomplete="off"
        />
        <p class="text-muted-foreground min-w-0 truncate text-sm tabular-nums">
            {m.sheet_format_preview({ value: preview })}
        </p>
    </div>
</ResponsiveDialog>
