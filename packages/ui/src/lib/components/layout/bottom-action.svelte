<script lang="ts">
	import { XIcon } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import Button from "$lib/components/ui/button/button.svelte";

	type Props = {
		title: string;
		children: Snippet;
		open: boolean;
		callback?: () => void;
		showCloseButton?: boolean;
	};

	let {
		title,
		children,
		open = $bindable(false),
		callback,
		showCloseButton = true,
	}: Props = $props();
</script>

{#if open}
	<div
		class="bottom-drawer lg:bottom-drawer-lg bg-sidebar/50 fixed right-5 bottom-20 rounded-xl border p-3 backdrop-blur-sm lg:bottom-5"
		transition:slide
	>
		<div class="mb-2 flex items-center justify-between">
			<p class="font-medium">{title}</p>
			{#if showCloseButton}
				<Button
					variant="ghost"
					title="Close"
					onclick={() => {
						if (callback) {
							return callback();
						}

						open = false;
					}}
				>
					<XIcon />
				</Button>
			{/if}
		</div>

		<div class="overflow-x-auto">
			{@render children()}
		</div>
	</div>
{/if}
