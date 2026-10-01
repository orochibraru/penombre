<script lang="ts">
	import type { CheckIcon } from "@lucide/svelte";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import { HUES, type Hue } from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";

	/** A swatch grid for a text or highlight colour, plus a way to clear it. */
	let {
		label,
		icon,
		colours,
		current,
		none,
		onPick,
		onClose,
	}: {
		label: string;
		icon: typeof CheckIcon;
		colours: Record<Hue, string>;
		current: string | null;
		/** What clearing the colour is called: "Default", "None". */
		none: string;
		onPick: (colour: string | null) => void;
		onClose: () => void;
	} = $props();

	const names: Record<Hue, () => string> = {
		gray: m.doc_colour_gray,
		red: m.doc_colour_red,
		orange: m.doc_colour_orange,
		yellow: m.doc_colour_yellow,
		green: m.doc_colour_green,
		blue: m.doc_colour_blue,
		purple: m.doc_colour_purple,
		pink: m.doc_colour_pink,
	};

	let open = $state(false);

	function pick(colour: string | null) {
		open = false;
		onPick(colour);
	}

	const Icon = $derived(icon);
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(toggleVariants({ size: "sm" }), "shrink-0 flex-col gap-0")}
		aria-label={label}
		title={label}
		onmousedown={(e: MouseEvent) => e.preventDefault()}
	>
		<Icon class="size-4" />
		<!-- The colour in use, under the icon, as every word processor shows it. -->
		<span
			class="bg-muted-foreground/40 h-1 w-4 rounded-full"
			style:background-color={current}
		></span>
	</Popover.Trigger>
	<Popover.Content
		class="w-auto p-2"
		onCloseAutoFocus={(e: Event) => {
			e.preventDefault();
			onClose();
		}}
	>
		<button
			type="button"
			class="hover:bg-muted mb-2 w-full rounded-sm px-2 py-1 text-start text-sm"
			onclick={() => pick(null)}
		>
			{none}
		</button>
		<div class="grid grid-cols-8 gap-1.5">
			{#each HUES as hue (hue)}
				{@const colour = colours[hue]}
				<button
					type="button"
					class="ring-offset-popover aria-pressed:ring-ring size-6 rounded-full border aria-pressed:ring-2 aria-pressed:ring-offset-2"
					style:background-color={colour}
					aria-label={names[hue]()}
					title={names[hue]()}
					aria-pressed={current?.toLowerCase() === colour}
					onclick={() => pick(colour)}
				></button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
