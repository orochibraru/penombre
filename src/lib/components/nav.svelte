<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { WithoutChildren } from '$lib/utils.js';
	import { type Icon as IconType } from '@lucide/svelte';
	import type { Icon } from '@tabler/icons-svelte';
	import type { ComponentProps } from 'svelte';

	type Item = {
		title: string;
		url: string;
		icon: Icon | typeof IconType;
		target?: string;
	};

	type Props = WithoutChildren<ComponentProps<typeof Sidebar.Group>> & {
		title: string;
		items: Item[];
	};

	let { title, items, ...restProps }: Props = $props();

	function isActive(item: Item) {
		if (page.url.pathname === '/' && item.url === '/') {
			return true;
		}

		if (page.url.pathname !== '/' && item.url.startsWith(page.url.pathname)) {
			return true;
		}

		return false;
	}
</script>

<Sidebar.Group {...restProps}>
	<Sidebar.GroupLabel>{title}</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={isActive(item)}>
						{#snippet child({ props })}
							<a href={item.url} target={item.target ?? '_self'} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
