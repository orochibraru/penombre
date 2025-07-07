<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import { MonitorIcon } from '@lucide/svelte';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		title="Toggle Theme"
		class={buttonVariants({ variant: 'outline', size: 'icon' })}
	>
		{#if userPrefersMode.current === 'light'}
			<SunIcon />
		{/if}
		{#if userPrefersMode.current === 'dark'}
			<MoonIcon />
		{/if}
		{#if userPrefersMode.current === 'system'}
			<MonitorIcon />
		{/if}
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item
			onclick={() => setMode('light')}
			class={cn(userPrefersMode.current === 'light' ? 'text-primary' : '')}
		>
			<SunIcon />
			Light
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={() => setMode('dark')}
			class={cn(userPrefersMode.current === 'dark' ? 'text-primary' : '')}
		>
			<MoonIcon />
			Dark
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={() => resetMode()}
			class={cn(userPrefersMode.current === 'system' ? 'text-primary' : '')}
		>
			<MonitorIcon />
			System
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
