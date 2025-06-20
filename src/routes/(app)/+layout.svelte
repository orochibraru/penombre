<script lang="ts">
	import { route } from '$lib/ROUTES';
	import NavUser from '$lib/components/nav-user.svelte';
	import Nav from '$lib/components/nav.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { title } from '$lib/store/title';
	import {
		ClockFadingIcon,
		FolderIcon,
		FolderSyncIcon,
		PlugIcon,
		SettingsIcon,
		StarIcon,
		TrashIcon,
		UsersIcon
	} from '@lucide/svelte';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';

	const { children, data } = $props();

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
				title: 'API',
				url: route('/api-docs'),
				icon: PlugIcon
			},
			{
				title: 'Sync',
				url: route('/sync'),
				icon: FolderSyncIcon
			}
		]
	};
</script>

<svelte:head>
	<title>Opendrive - {$title}</title>
</svelte:head>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<Sidebar.Root collapsible="offcanvas" variant="inset">
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
			<NavUser user={data.user} />
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="main-container @container/main flex flex-1 flex-col gap-2">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
