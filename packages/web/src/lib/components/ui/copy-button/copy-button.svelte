<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import XIcon from "@lucide/svelte/icons/x";
	import { scale } from "svelte/transition";
	import { Button } from "$lib/components/ui/button";
	import type { CopyButtonProps } from "$lib/components/ui/copy-button/types";
	import { UseClipboard } from "$lib/hooks/use-clipboard.svelte";
	import { cn } from "$lib/utils/utils";

	let { text, class: className, children }: CopyButtonProps = $props();

	const animationDuration = 500;

	const clipboard = new UseClipboard();
</script>

<Button
	variant="ghost"
	size={children ? 'default' : 'icon'}
	class={cn('flex items-center gap-2', className)}
	type="button"
	name="copy"
	onclick={async () => {
		await clipboard.copy(text);
	}}
>
	{#if clipboard.status === 'success'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<CheckIcon tabindex={-1} />
			<span class="sr-only">Copied</span>
		</div>
	{:else if clipboard.status === 'failure'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<XIcon tabindex={-1} />
			<span class="sr-only">Failed to copy</span>
		</div>
	{:else}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<CopyIcon tabindex={-1} />
			<span class="sr-only">Copy</span>
		</div>
	{/if}
	{@render children?.()}
</Button>
