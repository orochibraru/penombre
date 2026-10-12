<script lang="ts">
	import {
		AlignLeftIcon,
		AlignVerticalJustifyCenterIcon,
		BaselineIcon,
		CheckIcon,
		ChevronDownIcon,
		DecimalsArrowLeftIcon,
		DecimalsArrowRightIcon,
		DollarSignIcon,
		Grid2x2Icon,
		PaintBucketIcon,
		PaintbrushIcon,
		PercentIcon,
		RemoveFormattingIcon,
		TableCellsMergeIcon,
		WrapTextIcon,
	} from "@lucide/svelte";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import {
		HIGHLIGHT_COLORS,
		HUES,
		type Hue,
		TEXT_COLORS,
	} from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { BorderEdge } from "#lib/sheet/styles.js";
	import { cn } from "#lib/utils.js";
	import ColourMenu from "../document/colour-menu.svelte";
	import { MOD } from "./actions.js";
	import FormatDialog from "./format-dialog.svelte";
	import {
		alignTools,
		BORDER_LINES,
		borderTools,
		currencyTools,
		type FormatTool,
		fontTools,
		lineLabel,
		markTools,
		mergeTools,
		numberTools,
		sizeTools,
		valignTools,
		wrapTools,
	} from "./format-tools.js";
	import {
		clearFormatting,
		currency,
		decimals,
		paintFormat,
		setFormat,
		setStyle,
	} from "./formatting.js";
	import type { SheetState } from "./state.svelte.js";

	/**
	 * The formatting toolbar over the grid: one scrolling row on a phone,
	 * wrapped from `sm` up, as the document editor's. A CSV holds values
	 * only, so there every tool is off and the bar says why.
	 */
	const { sheet }: { sheet: SheetState } = $props();

	const disabled = $derived(!sheet.workbook);
	const style = $derived(
		sheet.styleAt(sheet.selection.anchor.row, sheet.selection.anchor.col),
	);

	let line = $state<BorderEdge>({ style: "thin" });

	const hueNames: Record<Hue, () => string> = {
		gray: m.doc_colour_gray,
		red: m.doc_colour_red,
		orange: m.doc_colour_orange,
		yellow: m.doc_colour_yellow,
		green: m.doc_colour_green,
		blue: m.doc_colour_blue,
		purple: m.doc_colour_purple,
		pink: m.doc_colour_pink,
	};

	const button = cn(toggleVariants({ size: "sm" }), "shrink-0");
	const back = (event: Event) => {
		event.preventDefault();
		sheet.focusGrid();
	};
</script>

{#snippet separator()}
    <div class="bg-border mx-0.5 h-5 w-px shrink-0"></div>
{/snippet}

{#snippet tool(item: FormatTool)}
    {@const Icon = item.icon}
    {@const on = item.active?.() ?? false}
    <button
        type="button"
        class={button}
        data-state={on ? "on" : "off"}
        aria-pressed={item.active ? on : undefined}
        aria-label={item.label}
        title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
        onmousedown={(e) => e.preventDefault()}
        onclick={() => item.run()}
    >
        {#if Icon}
            <Icon class="size-4" />
        {/if}
    </button>
{/snippet}

{#snippet choices(items: FormatTool[])}
    {#each items as item (item.label)}
        {@const Icon = item.icon}
        <DropdownMenu.Item style={item.style} onSelect={() => item.run()}>
            {#if Icon}
                <Icon class="size-4" />
            {/if}
            {item.label}
            {#if item.hint}
                <span class="text-muted-foreground ms-auto ps-4 text-xs tabular-nums">{item.hint}</span>
            {/if}
            {#if item.active?.()}
                <CheckIcon class={cn("text-primary size-4", !item.hint && "ms-auto")} />
            {/if}
        </DropdownMenu.Item>
    {/each}
{/snippet}

{#snippet dropdown(label: string, items: FormatTool[], Icon?: typeof CheckIcon, text?: string, width = "")}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger
            class={cn(button, "gap-1", width)}
            aria-label={label}
            title={label}
            onmousedown={(e: MouseEvent) => e.preventDefault()}
        >
            {#if Icon}
                <Icon class="size-4" />
            {/if}
            {#if text !== undefined}
                <span class="min-w-0 flex-1 truncate text-start">{text}</span>
            {/if}
            <ChevronDownIcon class="size-3 opacity-60" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="max-h-80" onCloseAutoFocus={back}>
            {@render choices(items)}
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/snippet}

<!-- A disabled fieldset lets the hover reach its title: buttons take none. -->
<fieldset
    {disabled}
    title={disabled ? m.sheet_format_csv() : undefined}
    aria-label={m.menu_format()}
    class={cn(
        "flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border p-1 sm:flex-wrap sm:overflow-visible",
        disabled && "opacity-50 [&_button]:pointer-events-none",
    )}
>
    {@render tool({
        label: m.sheet_paint_format(),
        icon: PaintbrushIcon,
        run: () => paintFormat(sheet),
        active: () => sheet.painter !== null,
    })}
    {@render separator()}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger
            class={cn(button, "gap-1 px-2 text-xs font-medium tabular-nums")}
            aria-label={m.sheet_number_format()}
            title={m.sheet_number_format()}
            onmousedown={(e: MouseEvent) => e.preventDefault()}
        >
            123
            <ChevronDownIcon class="size-3 opacity-60" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="max-h-96" onCloseAutoFocus={back}>
            {@render choices(numberTools(sheet))}
            <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>{m.sheet_more_currencies()}</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent class="max-h-80">
                    {@render choices(currencyTools(sheet))}
                </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => (sheet.formatDialog = true)}>
                {m.sheet_format_custom()}
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
    {@render tool({
        label: m.sheet_format_currency(),
        icon: DollarSignIcon,
        run: () => currency(sheet),
        shortcut: `${MOD}⇧4`,
    })}
    {@render tool({
        label: m.sheet_format_percent(),
        icon: PercentIcon,
        run: () => setFormat(sheet, "0.00%"),
        shortcut: `${MOD}⇧5`,
    })}
    {@render tool({
        label: m.sheet_decimals_fewer(),
        icon: DecimalsArrowLeftIcon,
        run: () => decimals(sheet, -1),
    })}
    {@render tool({
        label: m.sheet_decimals_more(),
        icon: DecimalsArrowRightIcon,
        run: () => decimals(sheet, 1),
    })}
    {@render separator()}
    {@render dropdown(m.doc_font(), fontTools(sheet), undefined, style.font ?? m.doc_default(), "w-28")}
    {@render dropdown(m.doc_font_size(), sizeTools(sheet), undefined, style.size ? String(style.size) : m.doc_default(), "w-20")}
    {@render separator()}
    {#each markTools(sheet) as item (item.label)}
        {@render tool(item)}
    {/each}
    <ColourMenu
        label={m.doc_text_colour()}
        icon={BaselineIcon}
        colours={TEXT_COLORS}
        current={style.color ?? null}
        none={m.doc_default()}
        onPick={(colour) => setStyle(sheet, { color: colour ?? undefined })}
        onClose={() => sheet.focusGrid()}
    />
    <ColourMenu
        label={m.sheet_fill_colour()}
        icon={PaintBucketIcon}
        colours={HIGHLIGHT_COLORS}
        current={style.fill ?? null}
        none={m.doc_colour_none()}
        onPick={(colour) => setStyle(sheet, { fill: colour ?? undefined })}
        onClose={() => sheet.focusGrid()}
    />
    {@render separator()}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger
            class={cn(button, "gap-1")}
            aria-label={m.sheet_borders()}
            title={m.sheet_borders()}
            onmousedown={(e: MouseEvent) => e.preventDefault()}
        >
            <Grid2x2Icon class="size-4" />
            <ChevronDownIcon class="size-3 opacity-60" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="max-h-96" onCloseAutoFocus={back}>
            {@render choices(borderTools(sheet, () => line))}
            <DropdownMenu.Separator />
            <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>{m.sheet_border_style()}</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                    {#each BORDER_LINES as kind (kind)}
                        <DropdownMenu.Item
                            closeOnSelect={false}
                            onSelect={() => (line = { ...line, style: kind })}
                        >
                            {lineLabel(kind)}
                            {#if line.style === kind}
                                <CheckIcon class="text-primary ms-auto size-4" />
                            {/if}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>{m.sheet_border_colour()}</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                    <DropdownMenu.Item
                        closeOnSelect={false}
                        onSelect={() => (line = { style: line.style })}
                    >
                        {m.doc_default()}
                        {#if !line.color}
                            <CheckIcon class="text-primary ms-auto size-4" />
                        {/if}
                    </DropdownMenu.Item>
                    {#each HUES as hue (hue)}
                        {@const colour = TEXT_COLORS[hue].toUpperCase()}
                        <DropdownMenu.Item
                            closeOnSelect={false}
                            onSelect={() => (line = { ...line, color: colour })}
                        >
                            <span class="size-4 rounded-full border" style:background-color={colour}></span>
                            {hueNames[hue]()}
                            {#if line.color === colour}
                                <CheckIcon class="text-primary ms-auto size-4" />
                            {/if}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
    {@render dropdown(m.sheet_merge(), mergeTools(sheet), TableCellsMergeIcon)}
    {@render separator()}
    {@render dropdown(m.editor_align(), alignTools(sheet), AlignLeftIcon)}
    {@render dropdown(m.sheet_valign(), valignTools(sheet), AlignVerticalJustifyCenterIcon)}
    {@render dropdown(m.sheet_wrapping(), wrapTools(sheet), WrapTextIcon)}
    {@render separator()}
    {@render tool({
        label: m.doc_clear_formatting(),
        icon: RemoveFormattingIcon,
        run: () => clearFormatting(sheet),
        shortcut: `${MOD}\\`,
    })}
</fieldset>

<FormatDialog {sheet} />
