<script lang="ts">
	import { ChevronDownIcon } from "@lucide/svelte";
	import { m } from "#lib/paraglide/messages.js";
	import type { ChipColor } from "#lib/sheet/dropdowns.js";
	import { cn } from "#lib/utils.js";

	/**
	 * A dropdown cell's value as a chip in its colour, with the chevron that
	 * opens the list. An empty cell shows the chevron alone, once selected.
	 */
	const {
		text,
		color,
		arrow,
		active,
		onopen,
	}: {
		text: string;
		color?: ChipColor;
		arrow: boolean;
		active: boolean;
		onopen: () => void;
	} = $props();

	const stop = (event: Event) => event.stopPropagation();
</script>

{#snippet chevron()}
    <!-- Its own pointer events: the grid would otherwise take the press
         as the start of a drag and the tap as an edit. -->
    <button
        type="button"
        tabindex="-1"
        class="flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100"
        aria-label={m.sheet_dropdown_open()}
        onpointerdown={stop}
        onclick={(e) => {
            stop(e);
            onopen();
        }}
    >
        <ChevronDownIcon class="size-3" />
    </button>
{/snippet}

<span class="flex h-full min-w-0 items-center">
    {#if text}
        <span
            class={cn(
                "inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-full py-0.5 ps-2 text-xs leading-4",
                arrow ? "pe-1" : "pe-2",
                !color && "bg-muted text-foreground",
            )}
            style={color ? `background-color: ${color.fill}; color: ${color.text ?? "#000000"}` : undefined}
        >
            <span class="truncate">{text}</span>
            {#if arrow}
                {@render chevron()}
            {/if}
        </span>
    {:else if arrow && active}
        <span class="text-muted-foreground ms-auto">{@render chevron()}</span>
    {/if}
</span>
