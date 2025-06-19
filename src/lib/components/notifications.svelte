<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { BellIcon, XIcon } from '@lucide/svelte';

	type Alert = {
		title: string;
		summary: string;
	};
</script>

{#snippet alert({ title, summary }: Alert)}
	<div class="flex items-center justify-between gap-5">
		<div>
			<p class="text-sm">
				{title}
			</p>
			<p class="text-muted-foreground text-xs">
				{summary}
			</p>
		</div>
		<XIcon class="ml-auto" />
	</div>
{/snippet}

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
		<BellIcon class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Show Notifications</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item>
			{@render alert({ title: 'Alert 1', summary: 'An example of what a notification can be' })}
		</DropdownMenu.Item>
		<DropdownMenu.Item>
			{@render alert({ title: 'Alert 2', summary: 'An example of what a notification can be' })}
		</DropdownMenu.Item>
		<DropdownMenu.Item>
			{@render alert({ title: 'Alert 3', summary: 'An example of what a notification can be' })}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
