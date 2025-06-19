<script lang="ts">
	import { route } from '$lib/ROUTES';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import {
		ClockFadingIcon,
		FolderIcon,
		FolderSyncIcon,
		StarIcon,
		TrashIcon,
		UsersIcon
	} from '@lucide/svelte';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import type { User } from 'better-auth';
	import type { ComponentProps } from 'svelte';
	import NavUser from './nav-user.svelte';
	import Nav from './nav.svelte';

	const nav = {
		main: [
			{
				title: 'My Drive',
				url: route('/'),
				icon: FolderIcon
			},
			{
				title: 'Recent',
				url: route('/recent'),
				icon: ClockFadingIcon
			},
			{
				title: 'Starred',
				url: route('/starred'),
				icon: StarIcon
			},
			{
				title: 'Shared',
				url: route('/shared'),
				icon: UsersIcon
			},
			{
				title: 'Trash',
				url: route('/trash'),
				icon: TrashIcon
			}
		],
		secondary: [
			{
				title: 'Settings',
				url: route('/settings'),
				icon: SettingsIcon
			},
			{
				title: 'Sync',
				url: route('/sync'),
				icon: FolderSyncIcon
			}
		]
	};

	type Props = ComponentProps<typeof Sidebar.Root> & {
		user: User;
	};

	let { user, ...restProps }: Props = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href={route('/')} {...props}>
							<InnerShadowTopIcon class="!size-5" />
							<span class="text-base font-semibold">Opendrive.</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Nav title="General" items={nav.main} />
		<Nav title="Help" items={nav.secondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
