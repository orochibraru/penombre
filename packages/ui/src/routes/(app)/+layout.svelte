<script lang="ts">
	import {
		ClockFadingIcon,
		CodeIcon,
		FileIcon,
		FolderIcon,
		FolderSyncIcon,
		HardDriveIcon,
		ImageIcon,
		MusicIcon,
		PlugIcon,
		SettingsIcon,
		StarIcon,
		TrashIcon,
		UserIcon,
		UsersIcon,
		VideoIcon
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/layout/header.svelte';
	import MusicPlayer from '$lib/components/layout/music-player.svelte';
	import Nav, { type NavItem } from '$lib/components/layout/nav.svelte';
	import NavUser from '$lib/components/layout/user-menu.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import { route } from '$lib/ROUTES';
	import { playableMusic } from '$lib/store/music';
	import { title } from '$lib/store/title';
	import { cn } from '$lib/utils';

	const { children, data } = $props();

	let newFolderOpen: boolean = $state(false);
	let uploadOpen: boolean = $state(false);

	type NavMenus = {
		[key: string]: NavItem[];
	};

	const nav: NavMenus = {
		general: [
			{
				title: 'My Drive',
				url: route('/browse'),
				icon: FolderIcon,
				hideOnMobile: true
			},
			{
				title: 'Recent',
				url: route('/recent'),
				icon: ClockFadingIcon,
				hideOnMobile: true
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
				icon: MusicIcon,
				accentColor: 'pink'
			},
			{
				title: 'Documents',
				url: route('/categories/[category]', {
					category: 'documents'
				}),
				icon: FileIcon,
				accentColor: 'indigo'
			},
			{
				title: 'Images',
				url: route('/categories/[category]', {
					category: 'images'
				}),
				icon: ImageIcon,
				accentColor: 'orange'
			},
			{
				title: 'Code',
				url: route('/categories/[category]', {
					category: 'code'
				}),
				icon: CodeIcon,
				accentColor: 'green'
			},
			{
				title: 'Video',
				url: route('/categories/[category]', {
					category: 'video'
				}),
				icon: VideoIcon,
				accentColor: 'purple'
			}
		],
		help: [
			{
				title: 'Settings',
				url: route('/settings'),
				icon: SettingsIcon,
				hideOnMobile: true
			},
			{
				title: 'Sync',
				url: route('/sync'),
				icon: FolderSyncIcon
			},
			{
				title: 'API',
				url: '/docs/index.html',
				icon: PlugIcon
			}
		]
	};

	const bottomNavItemClass = 'flex flex-col gap-1 items-center text-xs';
	const bottomNavItemIconClass = 'w-5.5 h-5.5';

	function isActive(itemUrl: string) {
		if (page.url.pathname === '/' && itemUrl === '/') {
			return true;
		}

		if (page.url.pathname.startsWith(itemUrl)) {
			return true;
		}

		return false;
	}
</script>

<svelte:head>
	<title>Opendrive - {$title ?? 'Home'}</title>
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
								<HardDriveIcon class="!size-5" />
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
			{#if data.user}
				<div class="hidden md:block">
					<NavUser user={data.user} />
				</div>
			{/if}
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<SiteHeader bind:newFolderOpen bind:uploadOpen />
		<div
			class={cn(
				'flex flex-1 flex-col pb-46 transition-all ',
				$playableMusic !== null ? 'lg:pb-26' : 'lg:pb-5'
			)}
		>
			<div class="main-container @container/main flex flex-1 flex-col gap-5 p-5">
				{@render children()}
			</div>
		</div>
		<MusicPlayer />
		<div
			class="bg-background/20 fixed bottom-0 left-0 w-full rounded-t-4xl border-t px-8 py-2 backdrop-blur-xl md:hidden"
		>
			<div class="flex items-center justify-between gap-5">
				<a
					href={route('/browse')}
					class={cn(bottomNavItemClass, isActive(route('/browse')) ? 'text-primary' : '')}
				>
					<FolderIcon class={bottomNavItemIconClass} />
					Home
				</a>
				<a
					href={route('/recent')}
					class={cn(bottomNavItemClass, isActive(route('/recent')) ? 'text-primary' : '')}
				>
					<ClockFadingIcon class={bottomNavItemIconClass} />
					Recent
				</a>
				<a
					href={route('/account')}
					class={cn(
						bottomNavItemClass,
						isActive(route('/account')) ? 'text-primary' : ''
					)}
				>
					<UserIcon class={bottomNavItemIconClass} />
					Profile
				</a>
				<a
					href={route('/settings')}
					class={cn(
						bottomNavItemClass,
						isActive(route('/settings')) ? 'text-primary' : ''
					)}
				>
					<SettingsIcon class={bottomNavItemIconClass} />
					Settings
				</a>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
