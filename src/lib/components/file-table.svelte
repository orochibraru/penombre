<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { bridge } from '$lib/client/api';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { route } from '$lib/ROUTES';
	import type { ObjectList } from '$lib/server/services/storage';
	import { capitalizeFirstLetter, cn, humanFileSize, prettyDate } from '$lib/utils';
	import {
		CopyIcon,
		EllipsisVerticalIcon,
		FileIcon,
		FileImageIcon,
		FileMusicIcon,
		FolderIcon,
		FolderInputIcon,
		type Icon as IconType,
		ShareIcon,
		StarIcon,
		TrashIcon
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		data: ObjectList;
		title?: string;
	};

	let { title, data }: Props = $props();

	let confirmDeleteOpen: boolean = $state(false);
	let itemPendingDeletion: string = $state('');
	let deletingItem: boolean = $state(false);

	type ActionItem = {
		title: string;
		icon: typeof IconType;
		action: (key: string) => void;
	};

	const { api } = bridge(page.url, page.data.token);

	async function handleDeleteItem() {
		deletingItem = true;
		const promise = api.v1.storage.objects
			.delete(null, { query: { item: itemPendingDeletion } })
			.then(async ({ error }) => {
				if (error) {
					console.error(error);
					deletingItem = false;
					throw error;
				}

				await invalidateAll();
				confirmDeleteOpen = false;
				deletingItem = false;
			});

		toast.promise(promise, {
			loading: 'Deleting item',
			success: 'Item deleted',
			error: 'Failed to delete item'
		});
	}

	const actionItems: ActionItem[] = [
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
			action: async (item: string) => {
				itemPendingDeletion = page.params.path ? `${page.params.path}/${item}` : item;
				console.log(itemPendingDeletion);
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

	const iconSize = 'h-5 w-5';
</script>

{#snippet DataTableActions(key: string)}
	{#each actionItems as actionItem}
		{@const Icon = actionItem.icon}
		<ContextMenu.Item onclick={() => actionItem.action(key)}>
			<Icon />
			{actionItem.title}
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
				{#each columns as headItem}
					<Table.Head colspan={headItem.colSpan} class={cn(headItem.end ? 'text-right' : '')}>
						{headItem.title}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if data.count > 0}
				{#each data.list as item}
					<Table.Row>
						<ContextMenu.Root>
							<ContextMenu.Trigger style="display: contents;">
								<Table.Cell colspan={8}>
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
											<p>{item.Key}</p>
										{/if}
									</div>
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
												{#each actionItems as actionItem}
													{@const Icon = actionItem.icon}
													<DropdownMenu.Item onclick={() => actionItem.action(item.Key)}>
														<Icon />
														{actionItem.title}
													</DropdownMenu.Item>
												{/each}
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</div>
								</Table.Cell>
							</ContextMenu.Trigger>
							<ContextMenu.Content class="w-52">
								{@render DataTableActions(item.Key)}
							</ContextMenu.Content>
						</ContextMenu.Root>
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
				This action cannot be undone. This will permanently delete this item from your storage
				device.
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
