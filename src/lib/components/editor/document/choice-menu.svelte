<script lang="ts">
	import { CheckIcon, ChevronDownIcon } from "@lucide/svelte";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import { cn } from "#lib/utils.js";
	import type { Tool } from "./tools.js";

	/** A toolbar dropdown of mutually exclusive choices: font, size, style. */
	let {
		label,
		text,
		icon,
		items,
		onClose,
		class: className,
	}: {
		/** The accessible name; the trigger shows `text` or `icon`. */
		label: string;
		text?: string;
		icon?: typeof CheckIcon;
		items: Tool[];
		/** Where focus goes back to: the text, not this trigger. */
		onClose: () => void;
		class?: string;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(toggleVariants({ size: "sm" }), "shrink-0 gap-1", className)}
		aria-label={label}
		title={label}
		onmousedown={(e: MouseEvent) => e.preventDefault()}
	>
		{#if icon}
			{@const Icon = icon}
			<Icon class="size-4" />
		{/if}
		{#if text !== undefined}
			<span class="min-w-0 flex-1 truncate text-start">{text}</span>
		{/if}
		<ChevronDownIcon class="size-3 opacity-60" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		class="max-h-72"
		onCloseAutoFocus={(e: Event) => {
			e.preventDefault();
			onClose();
		}}
	>
		{#each items as item, index (index)}
			<DropdownMenu.Item style={item.style} onSelect={() => item.run()}>
				{item.label}
				{#if item.active?.()}
					<CheckIcon class="text-primary ms-auto size-4" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
