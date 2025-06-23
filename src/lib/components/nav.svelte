<script lang="ts" module>
	export type NavItem = {
		title: string;
		url: string;
		icon: Icon | typeof IconType;
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { WithoutChildren } from '$lib/utils.js';
	import { type Icon as IconType } from '@lucide/svelte';
	import type { Icon } from '@tabler/icons-svelte';
	import type { ComponentProps } from 'svelte';

	type Props = WithoutChildren<ComponentProps<typeof Sidebar.Group>> & {
		title: string;
		items: NavItem[];
	};

	let { title, items, ...restProps }: Props = $props();

	function isActive(item: NavItem) {
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
							<a href={item.url} {...props}>
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
