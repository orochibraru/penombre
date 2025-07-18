<script lang="ts" module>
	export type NavItem = {
		title: string;
		url: string;
		icon: typeof IconType;
		accentColor?: 'indigo' | 'orange' | 'pink' | 'green';
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { cn, type WithoutChildren } from '$lib/utils.js';
	import { type Icon as IconType } from '@lucide/svelte';
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

		if (page.url.pathname.startsWith(item.url)) {
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
				{@const Icon = item.icon}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={isActive(item)}>
						{#snippet child({ props })}
							<a
								href={item.url}
								{...props}
								class={cn(
									props.class as string,
									item.accentColor === 'indigo' ? 'data-[active=true]:text-indigo-500' : '',
									item.accentColor === 'orange' ? 'data-[active=true]:text-orange-500' : '',
									item.accentColor === 'pink' ? 'data-[active=true]:text-pink-500' : '',
									item.accentColor === 'green' ? 'data-[active=true]:text-green-500' : ''
								)}
								title={item.title}
							>
								<Icon
									class={cn(
										'h-4.5 w-4.5',
										item.accentColor === 'indigo' ? 'text-indigo-500' : '',
										item.accentColor === 'orange' ? 'text-orange-500' : '',
										item.accentColor === 'pink' ? 'text-pink-500' : '',
										item.accentColor === 'green' ? 'text-green-500' : ''
									)}
								/>
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
