<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import Button from '$lib/components/ui/button/button.svelte';

	type Props = {
		title: string;
		children: Snippet;
		open: boolean;
		callback?: () => void;
	};

	let { title, children, open = $bindable(false), callback }: Props = $props();
</script>

{#if open}
	<div
		class="bottom-drawer lg:bottom-drawer-lg bg-sidebar/50 fixed right-5 bottom-5 rounded-xl border p-3 backdrop-blur-sm"
		transition:slide
	>
		<div class="mb-2 flex items-center justify-between">
			<p class="font-medium">{title}</p>
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
		</div>

		<div class="overflow-x-auto">
			{@render children()}
		</div>
	</div>
{/if}
