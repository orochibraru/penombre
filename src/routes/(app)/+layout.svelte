<script lang="ts">
	import Nav, { type NavItem } from '$lib/components/nav.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import {
		ClockFadingIcon,
		FileIcon,
		FolderIcon,
		FolderSyncIcon,
		ImageIcon,
		MusicIcon,
		PlugIcon,
		SettingsIcon,
		StarIcon,
		TrashIcon,
		UsersIcon
	} from '@lucide/svelte';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';

	const { children, data } = $props();

	type NavMenus = {
		[key: string]: NavItem[];
	};

	const nav: NavMenus = {
		general: [
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
		categories: [
			{
				title: 'Music',
				url: route('/categories/[category]', {
					category: 'music'
				}),
				icon: MusicIcon
			},
			{
				title: 'Documents',
				url: route('/categories/[category]', {
					category: 'documents'
				}),
				icon: FileIcon
			},
			{
				title: 'Images',
				url: route('/categories/[category]', {
					category: 'images'
				}),
				icon: ImageIcon
			}
		],
		help: [
			{
				title: 'Settings',
				url: route('/settings'),
				icon: SettingsIcon
			},
			{
				title: 'Sync',
				url: route('/sync'),
				icon: FolderSyncIcon
			},
			{
				title: 'API',
				url: route('/api-docs'),
				icon: PlugIcon
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
	<Sidebar.Root collapsible="icon" variant="inset">
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
			<Nav title="General" items={nav.general} />
			<Nav title="Categories" items={nav.categories} />
			<Nav title="Help" items={nav.help} class="mt-auto" />
		</Sidebar.Content>
		<Sidebar.Footer>
			<NavUser user={data.user} />
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="main-container @container/main flex flex-1 flex-col gap-5 p-5">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
