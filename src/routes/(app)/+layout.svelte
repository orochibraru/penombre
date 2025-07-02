<script lang="ts">
	import Nav, { type NavItem } from '$lib/components/nav.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
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
		ImageIcon,
		MusicIcon,
		PlugIcon,
		SettingsIcon,
		StarIcon,
		TrashIcon,
		UsersIcon
	} from '@lucide/svelte';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { bridge } from '$lib/client/api';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	const { children, data } = $props();

	let open: boolean = $state(false);

	let newFolderName: string = $state('New Folder');

	async function handleNewFolder() {
		const { api } = bridge(page.url, data.token);
		const promise = api.v1.storage.objects.folder.post(newFolderName).then(async ({ error }) => {
			if (error) {
				console.error(error);
				throw error;
			}

			await invalidateAll();
			open = false;
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

<Dialog.Root bind:open>
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
				<Sidebar.Menu>
					<div class="grid grid-cols-12 gap-2">
						<Button href={route('/upload')} class="col-span-9 w-full">
							<span>Upload</span>
							<CloudUploadIcon class="h-5 w-5" />
						</Button>
						<Dialog.Trigger style="display: contents;">
							<Button variant="outline" type="button" class="col-span-3 w-full">
								<span class="sr-only">New Folder</span>
								<FolderPlusIcon class="h-5 w-5" />
							</Button>
						</Dialog.Trigger>
					</div>
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
			<div>
				<Input
					required
					type="text"
					bind:value={newFolderName}
					placeholder="Folder name"
					class="w-full"
				/>
			</div>
			<Dialog.Footer>
				<Button onclick={() => (open = false)} variant="outline" type="button">Cancel</Button>
				<Button type="submit">Create</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
