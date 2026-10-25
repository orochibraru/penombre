<script lang="ts">
	import { RemoveFormattingIcon } from "@lucide/svelte";

	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { m } from "#lib/paraglide/messages.js";

	import { MOD } from "./actions.js";
	import {
		alignTools,
		borderTools,
		currencyTools,
		fontTools,
		type FormatTool,
		markTools,
		mergeTools,
		numberTools,
		sizeTools,
		valignTools,
		wrapTools,
	} from "./format-tools.js";
	import { clearFormatting, decimals } from "./formatting.js";
	import type { SheetState } from "./state.svelte.js";

	/** Format in the menu bar: the toolbar's commands, with their keys. */
	const {
		sheet,
		onCloseAutoFocus,
	}: { sheet: SheetState; onCloseAutoFocus: (event: Event) => void } = $props();

	const disabled = $derived(!sheet.workbook);
</script>

{#snippet entries(items: FormatTool[])}
	{#each items as item (item.label)}
		{@const Icon = item.icon}
		<Menubar.Item
			{disabled}
			style={item.style}
			onSelect={() => void item.run()}
		>
			{#if Icon}
				<Icon class="size-4" />
			{/if}
			{item.label}
			{#if item.shortcut || item.hint}
				<Menubar.Shortcut class="tabular-nums"
					>{item.shortcut ?? item.hint}</Menubar.Shortcut
				>
			{/if}
		</Menubar.Item>
	{/each}
{/snippet}

{#snippet submenu(label: string, items: FormatTool[])}
	<Menubar.Sub>
		<Menubar.SubTrigger {disabled}>{label}</Menubar.SubTrigger>
		<Menubar.SubContent class="max-h-96 overflow-y-auto">
			{@render entries(items)}
		</Menubar.SubContent>
	</Menubar.Sub>
{/snippet}

<Menubar.Menu>
	<Menubar.Trigger>{m.menu_format()}</Menubar.Trigger>
	<Menubar.Content {onCloseAutoFocus}>
		{#if disabled}
			<Menubar.Label class="text-muted-foreground max-w-64 text-xs font-normal">
				{m.sheet_format_csv()}
			</Menubar.Label>
			<Menubar.Separator />
		{/if}
		<Menubar.Sub>
			<Menubar.SubTrigger {disabled}
				>{m.sheet_number_format()}</Menubar.SubTrigger
			>
			<Menubar.SubContent class="max-h-96 overflow-y-auto">
				{@render entries(numberTools(sheet))}
				{@render submenu(m.sheet_more_currencies(), currencyTools(sheet))}
				<Menubar.Separator />
				{@render entries([
					{ label: m.sheet_decimals_fewer(), run: () => decimals(sheet, -1) },
					{ label: m.sheet_decimals_more(), run: () => decimals(sheet, 1) },
				])}
				<Menubar.Separator />
				<Menubar.Item {disabled} onSelect={() => (sheet.formatDialog = true)}>
					{m.sheet_format_custom()}
				</Menubar.Item>
			</Menubar.SubContent>
		</Menubar.Sub>
		<Menubar.Separator />
		{@render entries(markTools(sheet))}
		<Menubar.Separator />
		{@render submenu(m.doc_font(), fontTools(sheet))}
		{@render submenu(m.doc_font_size(), sizeTools(sheet))}
		{@render submenu(m.editor_align(), [
			...alignTools(sheet),
			...valignTools(sheet),
		])}
		{@render submenu(m.sheet_wrapping(), wrapTools(sheet))}
		{@render submenu(m.sheet_merge(), mergeTools(sheet))}
		{@render submenu(
			m.sheet_borders(),
			borderTools(sheet, () => ({ style: "thin" })),
		)}
		<Menubar.Separator />
		<Menubar.Item {disabled} onSelect={() => clearFormatting(sheet)}>
			<RemoveFormattingIcon class="size-4" />
			{m.doc_clear_formatting()}
			<Menubar.Shortcut>{MOD}\</Menubar.Shortcut>
		</Menubar.Item>
	</Menubar.Content>
</Menubar.Menu>
