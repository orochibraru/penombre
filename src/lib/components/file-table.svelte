<script lang="ts">
	import {
		CopyIcon,
		EllipsisVerticalIcon,
		FileIcon,
		FileImageIcon,
		FileMusicIcon,
		FolderIcon,
		FolderInputIcon,
		type Icon as IconType,
		PencilLineIcon,
		ShareIcon,
		StarIcon,
		TrashIcon
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { bridge } from '$lib/client/api';
	import BottomAction from '$lib/components/layout/bottom-action.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { route } from '$lib/ROUTES';
	import type { ObjectItem, ObjectList } from '$lib/server/services/storage';
	import { playableMusic } from '$lib/store/music';
	import {
		capitalizeFirstLetter,
		cn,
		humanFileSize,
		prettyDate,
		secondsToMinutes
	} from '$lib/utils';

	type Props = {
		data: ObjectList;
		title?: string;
	};

	let { title, data }: Props = $props();

	type AugmentedItem = ObjectItem & {
		checked: boolean;
	};

	type AugmentedList = AugmentedItem[];

	let augmentedList: AugmentedList = $state([]);
	let allSelected: boolean = $state(false);
	let indeterminate: boolean = $state(false);
	let actionableItem: AugmentedItem | undefined = $state(undefined);
	let confirmDeleteOpen: boolean = $state(false);
	let deletingItem: boolean = $state(false);

	function augmentList() {
		augmentedList = data.list.map((item) => {
			return {
				checked: false,
				...item
			};
		});
	}

	onMount(() => {
		augmentList();
	});

	type ItemAction = {
		title: string;
		icon: typeof IconType;
		action: (item: AugmentedItem) => void;
	};

	const { api } = bridge(page.url, page.data.token);

	async function handleDeleteItem() {
		if (!actionableItem) {
			return;
		}

		deletingItem = true;
		const itemPath = page.params.path
			? `${page.params.path}/${actionableItem.Key}`
			: actionableItem.Key;
		const promise = api.v1.storage.objects
			.delete(null, { query: { item: itemPath } })
			.then(async ({ error }) => {
				if (error) {
					console.error(error);
					deletingItem = false;
					throw error;
				}

				await invalidateAll();
				augmentList();
				confirmDeleteOpen = false;
				deletingItem = false;
			});

		toast.promise(promise, {
			loading: 'Deleting item',
			success: 'Item deleted',
			error: 'Failed to delete item'
		});
	}

	const itemActions: ItemAction[] = [
		{
			title: 'Rename',
			icon: PencilLineIcon,
			action: () => []
		},
		{
			title: 'Move',
			icon: FolderInputIcon,
			action: () => []
		},
		{
			title: 'Duplicate',
			icon: CopyIcon,
			action: () => []
		},
		{
			title: 'Star',
			icon: StarIcon,
			action: () => []
		},
		{
			title: 'Share',
			icon: ShareIcon,
			action: () => []
		},
		{
			title: 'Delete',
			icon: TrashIcon,
			action: async (item: AugmentedItem) => {
				actionableItem = item;
				confirmDeleteOpen = true;
			}
		}
	];

	type TableHeadItem = {
		title: string;
		colSpan: number;
		end?: boolean;
	};

	const columns: TableHeadItem[] = [
		{
			title: 'Name',
			colSpan: 8
		},
		{
			title: 'Category',
			colSpan: 1
		},
		{
			title: 'Size',
			colSpan: 1
		},
		{
			title: 'Last Modified',
			colSpan: 1
		},
		{
			title: 'Actions',
			colSpan: 1,
			end: true
		}
	];

	async function openItem(item: ObjectItem) {
		const proxyurl = `${page.url.protocol}//${page.url.host}`;
		const { data: presignedUrl, error } = await api.v1.storage.objects.url.get({
			query: { item: item.Key, hostname: proxyurl }
		});
		if (error || !presignedUrl) {
			toast.error('Failed to open this file.');
			return;
		}
		if (item.ContentType?.startsWith('audio')) {
			$playableMusic = null;
			$playableMusic = {
				title: item.Key,
				source: presignedUrl
			};
			return;
		}

		const newTab = window.open(new URL(presignedUrl), '_blank');
		if (newTab) {
			newTab.focus();
		}
	}

	function toggleSelectAll(checked: boolean) {
		augmentedList = augmentedList.map((item) => ({ ...item, checked: checked }));
	}

	$effect(() => {
		allSelected = augmentedList.length > 0 && augmentedList.every((item) => item.checked);
		indeterminate = !allSelected && augmentedList.some((item) => item.checked);
	});

	let actionsOpen = $derived(indeterminate || allSelected);

	const iconSize = 'h-5 w-5';
</script>

{#snippet DataTableActions(item: AugmentedItem)}
	{#each itemActions as itemAction}
		{@const Icon = itemAction.icon}
		<ContextMenu.Item onclick={() => itemAction.action(item)}>
			<Icon />
			{itemAction.title}
		</ContextMenu.Item>
	{/each}
{/snippet}

<!-- Filters -->
{#if title}
	<div class="mb-2 flex items-center justify-between">
		<div>
			<h3 class="text-xl font-medium">
				{title}
			</h3>
		</div>
	</div>
{/if}

<!-- Table -->
<div class="overflow-hidden rounded-lg border">
	<Table.Root>
		<Table.Header class="bg-muted sticky top-0 z-10">
			<Table.Row>
				<Table.Head colspan={1} class="max-w-4">
					<Checkbox
						onCheckedChange={(e) => toggleSelectAll(e)}
						checked={allSelected}
						bind:indeterminate
					/>
				</Table.Head>
				{#each columns as headItem}
					<Table.Head colspan={headItem.colSpan} class={cn(headItem.end ? 'text-right' : '')}>
						{headItem.title}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if data.count > 0}
				{#each augmentedList as item}
					<Table.Row>
						<Table.Cell class="w-4">
							<Checkbox bind:checked={item.checked} />
						</Table.Cell>
						<Table.Cell colspan={8}>
							<ContextMenu.Root>
								<ContextMenu.Trigger style="display: contents;">
									<div class="flex items-center gap-2">
										{#if item.Key.endsWith('/')}
											{@const folder = item.Key.replace('/', '')}
											<FolderIcon class={cn(iconSize, 'text-indigo-600')} fill="#1447e6" />
											<a
												href={route('/browse/[...path]', {
													path: page.params.path ? [page.params.path, folder] : [folder]
												})}
											>
												{folder}
											</a>
										{:else}
											<button onclick={() => openItem(item)} class="flex items-center gap-2">
												{#if item.ContentType}
													{#if item.ContentType === 'application/pdf'}
														<FileIcon class={cn(iconSize, 'text-indigo-400')} />
													{:else if item.ContentType.startsWith('audio')}
														<FileMusicIcon class={cn(iconSize, 'text-pink-400')} />
													{:else if item.ContentType.startsWith('image')}
														<FileImageIcon class={cn(iconSize, 'text-orange-400')} />
													{:else}
														<FileIcon class={iconSize} />
													{/if}
												{:else}
													<FileIcon class={iconSize} />
												{/if}
												<div>
													<p>{item.Key}</p>
												</div>
												{#if item.Metadata?.category === 'music'}
													{#if item.Metadata.musicduration}
														<Badge variant="outline" class="text-muted-foreground px-1.5 text-xs">
															{secondsToMinutes(Number.parseFloat(item.Metadata.musicduration))}
														</Badge>
													{/if}
												{/if}
											</button>
										{/if}
									</div>
								</ContextMenu.Trigger>
								<ContextMenu.Content class="w-52">
									{@render DataTableActions(item)}
								</ContextMenu.Content>
							</ContextMenu.Root>
						</Table.Cell>
						<Table.Cell colspan={1} class="w-32">
							<Badge variant="outline" class="text-muted-foreground px-1.5">
								{item.Metadata?.category
									? capitalizeFirstLetter(item.Metadata.category)
									: 'No category'}
							</Badge>
						</Table.Cell>
						<Table.Cell colspan={1} class="w-32">
							<p>
								{humanFileSize(item.Size as number) ?? '-'}
							</p>
						</Table.Cell>
						<Table.Cell colspan={1} class="w-32">
							{#if item.LastModified}
								{prettyDate(item.LastModified)}
							{/if}
						</Table.Cell>
						<Table.Cell colspan={1} class="w-32">
							<div class="flex w-full items-center justify-end">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="data-[state=open]:bg-muted text-muted-foreground flex size-8"
									>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" {...props}>
												<EllipsisVerticalIcon />
												<span class="sr-only">Open menu</span>
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										{#each itemActions as itemAction}
											{@const Icon = itemAction.icon}
											<DropdownMenu.Item onclick={() => itemAction.action(item)}>
												<Icon />
												{itemAction.title}
											</DropdownMenu.Item>
										{/each}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row>
					<Table.Cell colspan={12} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>

<AlertDialog.Root bind:open={confirmDeleteOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete <b>{actionableItem?.Key}</b> from
				your storage device.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={() => handleDeleteItem()} disabled={deletingItem}>
				{#if deletingItem}
					<Spinner />
				{:else}
					Continue
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<BottomAction title="File actions" bind:open={actionsOpen}>
	<div class="flex w-full items-center gap-2 pb-5">
		{#each itemActions as itemAction}
			{#if itemAction.title !== 'Rename'}
				{@const Icon = itemAction.icon}
				<Button variant="outline" size="sm">
					<Icon />
					{itemAction.title}
				</Button>
			{/if}
		{/each}
	</div>
</BottomAction>
