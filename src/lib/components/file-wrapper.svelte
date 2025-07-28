<script lang="ts">
	import {
		CopyIcon,
		ExternalLinkIcon,
		FolderInputIcon,
		PencilLineIcon,
		ShareIcon,
		StarIcon,
		TrashIcon
	} from '@lucide/svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api, type ObjectItem, type ObjectList } from '$lib/api';
	import FileList from '$lib/components/file-list.svelte';
	import FileTable from '$lib/components/file-table.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge/index';
	import { Button, type ButtonVariant } from '$lib/components/ui/button/index';
	import * as Code from '$lib/components/ui/code/index';
	import type { SupportedLanguage } from '$lib/components/ui/code/shiki';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { determineCodeFileLanguage, isCodeItem } from '$lib/file-utils';
	import { playableMusic } from '$lib/store/music';
	import { humanFileSize, type ItemAction, type MultipleItemsAction } from '$lib/utils';

	type Props = {
		data: ObjectList;
	};

	let { data }: Props = $props();

	let allSelected: boolean = $state(false);
	let indeterminate: boolean = $state(false);
	let confirmDeleteOpen: boolean = $state(false);
	let deletingItem: boolean = $state(false);
	let checkedItems: Record<string, boolean> = $state({});
	let isSingleItemAction: boolean = $state(false);
	let searchValue: string = $state('');
	let searchResults: ObjectItem[] = $state([]);
	let searchTimeout: ReturnType<typeof setTimeout> | undefined = $state();
	let loading: boolean = $state(false);
	let actionsContextOpen: boolean = $state(false);
	let actionableItem: ObjectItem | undefined = $state();
	let viewFileOpen: boolean = $state(false);
	let fileToView: {
		item: ObjectItem;
		src: string;
		type: 'image' | 'code';
		content?: string;
		language?: SupportedLanguage;
	} | null = $state(null);

	let multiObjectActionsOpen = $derived((indeterminate || allSelected) && !isSingleItemAction);

	async function updateSearchResults() {
		searchResults = data.list.filter((item) => item.key.toLowerCase().includes(searchValue));

		loading = false;
		return;
	}

	const debounce = () => {
		if (searchValue === '') {
			searchResults = [];
			loading = false;
			return;
		}
		loading = true;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			await updateSearchResults();
		}, 750);
	};

	async function handleDeleteObject() {
		if (Object.keys(checkedItems).length === 0) {
			return;
		}

		const promises = [];

		for (const checkedItem of Object.keys(checkedItems)) {
			deletingItem = true;
			const itemPath = page.params.path ? `${page.params.path}/${checkedItem}` : checkedItem;
			if (itemPath.endsWith('/')) {
				const promise = api
					.DELETE('/api/v1/storage/objects/folder', {
						params: {
							query: {
								path: itemPath.slice(0, -1)
							}
						}
					})
					.then(async ({ error }) => {
						if (error) {
							console.error(error);
							deletingItem = false;
							throw error;
						}

						confirmDeleteOpen = false;
						deletingItem = false;
					});

				promises.push(promise);
			} else {
				const promise = api
					.DELETE('/api/v1/storage/objects/item', {
						params: {
							query: {
								item: itemPath
							}
						}
					})
					.then(async ({ error }) => {
						if (error) {
							console.error(error);
							deletingItem = false;
							throw error;
						}

						confirmDeleteOpen = false;
						deletingItem = false;
					});

				promises.push(promise);
			}
		}

		toast.promise(
			Promise.all(promises).finally(async () => {
				checkedItems = {};
				actionsContextOpen = false;
				actionableItem = undefined;
				await invalidateAll();
			}),
			{
				loading: 'Deleting items',
				success: 'Items deleted',
				error: 'Failed to delete items'
			}
		);
	}

	const itemActions: ItemAction[] = [
		{
			title: 'Rename',
			icon: PencilLineIcon,
			action: () => [],
			disabled: true
		},
		{
			title: 'Move',
			icon: FolderInputIcon,
			action: () => [],
			disabled: true
		},
		{
			title: 'Duplicate',
			icon: CopyIcon,
			action: () => [],
			disabled: true
		},
		{
			title: 'Star',
			icon: StarIcon,
			action: () => [],
			disabled: true
		},
		{
			title: 'Share',
			icon: ShareIcon,
			action: () => [],
			disabled: true
		},
		{
			title: 'Delete',
			icon: TrashIcon,
			action: async (item: ObjectItem) => {
				isSingleItemAction = true;
				checkedItems = {};
				checkedItems[item.key] = true;
				confirmDeleteOpen = true;
			}
		}
	];

	const multipleItemsActions: MultipleItemsAction[] = [
		{
			title: 'Move',
			icon: FolderInputIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Star',
			icon: StarIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Share',
			icon: ShareIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Delete',
			icon: TrashIcon,
			variant: 'destructive',
			action: async () => {
				isSingleItemAction = false;
				confirmDeleteOpen = true;
			}
		}
	];

	async function handleOpenItemWrapper(item: ObjectItem) {
		return toast.promise(handleOpenItem(item), {
			loading: `Opening "${item.key}"`,
			error: `Failed to open "${item.key}"`
		});
	}

	async function handleOpenItem(item: ObjectItem): Promise<void> {
		$playableMusic = null;

		const fullPath = page.params.path ? `${page.params.path}/${item.key}` : item.key;

		const { data: presignedUrl, error: err } = await api.GET('/api/v1/storage/objects/url', {
			params: {
				query: {
					item: fullPath
				}
			}
		});

		if (err) {
			console.error(err);
			throw err;
		}

		const finalUrl = `${page.url.origin}/p?url=${presignedUrl}`;

		if (isCodeItem(item.key)) {
			const codeReq = await fetch(finalUrl);
			if (!codeReq.ok) {
				toast.error('Failed to open code file.', {
					description: codeReq.statusText
				});
				return;
			}
			const code = await codeReq.text();
			fileToView = {
				item,
				src: finalUrl,
				content: code,
				type: 'code',
				language: determineCodeFileLanguage(item)
			};
			viewFileOpen = true;
			return;
		}

		if (item.contentType?.startsWith('image')) {
			fileToView = {
				item,
				src: finalUrl,
				type: 'image'
			};
			viewFileOpen = true;
			return;
		}

		if (item.contentType?.startsWith('audio')) {
			$playableMusic = {
				title: item.key,
				source: finalUrl
			};
			return;
		}

		const newTab = window.open(finalUrl, '_blank');
		if (newTab) {
			newTab.focus();
		}
	}

	const isDesktop = new MediaQuery('(min-width: 768px)');

	// TODO: Replace datatable with list on mobile
</script>

<!-- Filters -->

{#if multiObjectActionsOpen}
	<div class="ml-auto max-w-xl">
		<div class="flex items-center gap-2 pb-5">
			{#each multipleItemsActions as action}
				{@const Icon = action.icon}
				<div class="w-full">
					<Button variant={action.variant} onclick={() => action.action()} class="w-full text-xs">
						<Icon class="h-5 w-4" />
						{action.title}
					</Button>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="flex w-full items-center gap-2 pb-5">
		<Input
			bind:value={searchValue}
			type="search"
			placeholder="Search"
			onkeyup={() => {
				debounce();
			}}
		/>
	</div>
{/if}

<!-- Table -->
{#if isDesktop.current}
	<FileTable
		handleOpenItem={handleOpenItemWrapper}
		files={data}
		{itemActions}
		{searchValue}
		{searchResults}
		bind:loading
		bind:allSelected
		bind:indeterminate
		bind:actionableItem
		bind:actionsContextOpen
	/>
{:else}
	<FileList
		handleOpenItem={handleOpenItemWrapper}
		files={data}
		{itemActions}
		{searchValue}
		{searchResults}
		bind:loading
		bind:allSelected
		bind:indeterminate
		bind:actionableItem
		bind:actionsContextOpen
	/>
{/if}

<Drawer.Root bind:open={actionsContextOpen}>
	<Drawer.Content class="z-50">
		<Drawer.Header>
			{#if actionableItem}
				<Drawer.Title>
					{actionableItem.key}
				</Drawer.Title>
			{/if}
			<Drawer.Description>Operate actions on this item</Drawer.Description>
		</Drawer.Header>
		<Drawer.Footer>
			<div class="mx-auto flex w-full flex-col items-start gap-5">
				{#if actionableItem}
					{@const item = actionableItem}
					{#each itemActions as action}
						{@const Icon = action.icon}
						<button
							onclick={() => action.action(item)}
							disabled={action.disabled}
							class="disabled:text-muted hover:text-primary flex w-full items-center justify-start gap-3 text-balance transition-colors"
						>
							<Icon />
							{action.title}
						</button>
					{/each}
				{/if}
			</div>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>

{#if isDesktop.current}
	<AlertDialog.Root bind:open={confirmDeleteOpen}>
		<AlertDialog.Content class="max-h-[70%] overflow-y-auto pb-16">
			<AlertDialog.Header>
				<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. This will permanently delete the following items from your
					storage device.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="prose">
				<ul>
					{#each Object.keys(checkedItems) as item}
						<li class="text-foreground">{item}</li>
					{/each}
				</ul>
			</div>
			<AlertDialog.Footer class="fixed bottom-5 w-full px-10">
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={() => handleDeleteObject()}
					disabled={deletingItem}
					class="bg-red-600"
				>
					{#if deletingItem}
						<Spinner />
					{:else}
						Continue
					{/if}
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{:else}
	<Drawer.Root bind:open={confirmDeleteOpen}>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Are you sure absolutely sure?</Drawer.Title>
				<Drawer.Description>
					This action cannot be undone. This will permanently delete the following items from your
					storage device.
				</Drawer.Description>
			</Drawer.Header>
			<div class="prose">
				<ul>
					{#each Object.keys(checkedItems) as item}
						<li class="text-foreground">{item}</li>
					{/each}
				</ul>
			</div>
			<Drawer.Footer>
				<Button loading={deletingItem} onclick={() => handleDeleteObject()}>Continue</Button>
				<Drawer.Close>Cancel</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}

<Dialog.Root bind:open={viewFileOpen}>
	{#if fileToView}
		<Dialog.Content class="max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
			<div class="flex flex-col justify-between gap-5 lg:flex-row">
				<Dialog.Header class="text-start lg:text-center">
					<Dialog.Title>
						{fileToView.item.key}
					</Dialog.Title>
					<Dialog.Description class="flex items-center gap-2">
						<span>
							{humanFileSize(fileToView.item.size as number) ?? '-'}
						</span>
						{#if fileToView.language}
							<Badge variant="outline" class="text-xs">{fileToView.language}</Badge>
						{/if}
					</Dialog.Description>
				</Dialog.Header>
				<div class="pr-5">
					<Button
						type="button"
						class="w-full lg:w-auto"
						variant="outline"
						size="sm"
						href={fileToView.src}
						target="_blank"
					>
						Open in new tab
						<ExternalLinkIcon />
					</Button>
				</div>
			</div>
			<div class="flex h-[50vh] w-full items-center justify-center overflow-hidden">
				{#if fileToView.type === 'image'}
					<img
						src={fileToView.src}
						alt={fileToView.item.key}
						class="h-full max-w-full rounded-md object-contain"
					/>
				{:else if fileToView.type === 'code' && fileToView.language && fileToView.content}
					<Code.Root lang={fileToView.language} class="w-full" code={fileToView.content}>
						<Code.CopyButton />
					</Code.Root>
					<!-- <div class="h-[50vh] w-full overflow-y-auto">
						<pre><code>{fileToView.content}</code></pre>
					</div> -->
				{/if}
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
