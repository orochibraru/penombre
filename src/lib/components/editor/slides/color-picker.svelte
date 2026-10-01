<script lang="ts">
	import type { CheckIcon } from "@lucide/svelte";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import {
		cssColor,
		hexColor,
		type Palette,
		rgbColor,
	} from "#lib/slides/color.js";
	import type { Color } from "#lib/slides/model.js";
	import { cn } from "#lib/utils.js";

	/**
	 * Theme colours first, as references so a theme switch recolours them,
	 * then a few fixed ones and the system picker for anything else.
	 */
	let {
		label,
		icon,
		value,
		palette,
		none,
		onPick,
	}: {
		label: string;
		icon: typeof CheckIcon;
		value: Color | undefined;
		palette: Palette;
		/** What clearing is called; absent when the colour cannot be cleared. */
		none?: string;
		onPick: (color: Color | null) => void;
	} = $props();

	const THEME = [
		"bg1",
		"tx1",
		"bg2",
		"tx2",
		"accent1",
		"accent2",
		"accent3",
		"accent4",
		"accent5",
		"accent6",
	];
	const SHADES: [string, number][][] = [
		[
			["lumMod", 20_000],
			["lumOff", 80_000],
		],
		[
			["lumMod", 60_000],
			["lumOff", 40_000],
		],
		[["lumMod", 75_000]],
		[["lumMod", 50_000]],
	];
	const FIXED = [
		"000000",
		"595959",
		"A6A6A6",
		"FFFFFF",
		"E03131",
		"F08C00",
		"FFD43B",
		"2F9E44",
		"1971C2",
		"9C36B5",
	];

	let open = $state(false);
	const Icon = $derived(icon);

	function pick(color: Color | null) {
		open = false;
		onPick(color);
	}
</script>

{#snippet swatch(color: Color, title: string)}
	<button
		type="button"
		class="ring-offset-popover aria-pressed:ring-ring size-5 rounded-sm border aria-pressed:ring-2 aria-pressed:ring-offset-1"
		style:background-color={cssColor(color, palette)}
		aria-label={title}
		{title}
		aria-pressed={value !== undefined && cssColor(value, palette) === cssColor(color, palette)}
		onclick={() => pick(color)}
	></button>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(toggleVariants({ size: "sm" }), "shrink-0 flex-col gap-0")}
		aria-label={label}
		title={label}
		onmousedown={(event: MouseEvent) => event.preventDefault()}
	>
		<Icon class="size-4" />
		<span
			class="bg-muted-foreground/40 h-1 w-4 rounded-full"
			style:background-color={value ? cssColor(value, palette) : undefined}
		></span>
	</Popover.Trigger>
	<Popover.Content class="w-auto p-2" onOpenAutoFocus={(event: Event) => event.preventDefault()}>
		<p class="text-muted-foreground mb-1 text-xs">{m.slides_theme_colours()}</p>
		<div class="grid grid-cols-10 gap-1">
			{#each THEME as name (name)}
				{@render swatch({ scheme: name }, hexColor({ scheme: name }, palette))}
			{/each}
			{#each SHADES as mods, row (row)}
				{#each THEME as name (name)}
					{@render swatch({ scheme: name, mods }, hexColor({ scheme: name, mods }, palette))}
				{/each}
			{/each}
		</div>
		<p class="text-muted-foreground mt-2 mb-1 text-xs">{m.slides_standard_colours()}</p>
		<div class="grid grid-cols-10 gap-1">
			{#each FIXED as hex (hex)}
				{@render swatch(rgbColor(hex), `#${hex}`)}
			{/each}
		</div>
		<div class="mt-2 flex items-center gap-2">
			{#if none}
				<button type="button" class="hover:bg-muted rounded-sm px-2 py-1 text-sm" onclick={() => pick(null)}>
					{none}
				</button>
			{/if}
			<label class="hover:bg-muted ms-auto flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm">
				{m.slides_custom_colour()}
				<input
					type="color"
					class="size-6 cursor-pointer border-0 bg-transparent p-0"
					value={hexColor(value, palette)}
					onchange={(event) => pick(rgbColor(event.currentTarget.value))}
				/>
			</label>
		</div>
	</Popover.Content>
</Popover.Root>
