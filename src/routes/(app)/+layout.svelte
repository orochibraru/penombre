<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { bridge } from '$lib/client/api';
	import Nav, { type NavItem } from '$lib/components/nav.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import {
		ClockFadingIcon,
		CloudUploadIcon,
		FileIcon,
		FolderIcon,
		FolderPlusIcon,
		FolderSyncIcon,
		HardDriveIcon,
		ImageIcon,
		MusicIcon,
		PlugIcon,
		SettingsIcon,
		StarIcon,
		TrashIcon,
		UsersIcon
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const { children, data } = $props();

	let newFolderLoading: boolean = $state(false);
	let newFolderOpen: boolean = $state(false);
	let newFolderName: string = $state('New Folder');
	let newFolderError: string = $state('');

	async function handleNewFolder() {
		const { api } = bridge(page.url, data.token);

		newFolderLoading = true;

		const folderPath = page.params.path ? `${page.params.path}/${newFolderName}` : newFolderName;

		const promise = api.v1.storage.objects.folder.post(folderPath).then(async ({ error }) => {
			newFolderLoading = false;
			if (error) {
				console.error(error);
				throw error;
			}

			await invalidateAll();
			newFolderOpen = false;
		});

		toast.promise(promise, {
			loading: 'Creating folder',
			success: 'Folder created',
			error: 'Failed to create folder'
		});
	}

	type NavMenus = {
		[key: string]: NavItem[];
	};

	const nav: NavMenus = {
		general: [
			{
				title: 'My Drive',
				url: route('/browse'),
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
			<NavUser user={data.user} />
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col pb-20">
			<div class="main-container @container/main flex flex-1 flex-col gap-5 p-5">
				{@render children()}
			</div>
		</div>
		{#if page.url.pathname.startsWith('/browse')}
			<div class="fixed right-3 bottom-3 lg:right-10 lg:bottom-5">
				<div class="flex flex-col items-end gap-2">
					<Button href={route('/upload')}>
						Upload
						<CloudUploadIcon />
					</Button>
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							newFolderOpen = true;
						}}
					>
						New Folder
						<FolderPlusIcon class="h-5 w-5" />
					</Button>
				</div>
			</div>
		{/if}
	</Sidebar.Inset>
</Sidebar.Provider>

<Dialog.Root bind:open={newFolderOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create a new folder</Dialog.Title>
			<Dialog.Description>
				This will create a new folder in the current directory.
			</Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				await handleNewFolder();
			}}
			style="display: contents;"
		>
			<div class="flex flex-col gap-1">
				<Input
					required
					type="text"
					bind:value={newFolderName}
					placeholder="Folder name"
					class="w-full"
					aria-invalid={newFolderError !== ''}
				/>
				{#if newFolderError}
					<p class="text-xs text-red-600">
						{newFolderError}
					</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button onclick={() => (newFolderOpen = false)} variant="outline" type="button">
					Cancel
				</Button>
				<Button bind:loading={newFolderLoading} type="submit">Create</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
