<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { ObjectList } from '$lib/server/services/storage';
	import { humanFileSize, prettyDate } from '$lib/utils';
	import {
		CopyIcon,
		EllipsisVerticalIcon,
		FileIcon,
		FolderIcon,
		FolderInputIcon,
		type Icon as IconType,
		ShareIcon,
		StarIcon,
		TrashIcon
	} from '@lucide/svelte';

	type Props = {
		data: ObjectList;
		title?: string;
	};

	let { title, data }: Props = $props();

	type ActionItem = {
		title: string;
		icon: typeof IconType;
	};

	const actionItems: ActionItem[] = [
		{
			title: 'Move',
			icon: FolderInputIcon
		},
		{
			title: 'Duplicate',
			icon: CopyIcon
		},
		{
			title: 'Star',
			icon: StarIcon
		},
		{
			title: 'Share',
			icon: ShareIcon
		},
		{
			title: 'Delete',
			icon: TrashIcon
		}
	];

	type TableHeadItem = {
		title: string;
		colSpan: number;
	};

	const columns: TableHeadItem[] = [
		{
			title: 'Name',
			colSpan: 2
		},
		{
			title: 'Tags',
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
			colSpan: 1
		}
	];
</script>

{#snippet DataTableActions()}
	{#each actionItems as actionItem}
		{@const Icon = actionItem.icon}
		<ContextMenu.Item>
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
					<Table.Head colspan={headItem.colSpan}>
						{headItem.title}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body class="**:data-[slot=table-cell]:first:w-8">
			{#if data.count > 0}
				{#each data.list as item}
					<ContextMenu.Root>
						<ContextMenu.Trigger class="col-span-2" style="display: contents;">
							<Table.Row>
								<Table.Cell colspan={2}>
									<div class="flex items-center gap-2">
										{#if item.Key.endsWith('/')}
											<FolderIcon class="h-4 w-4" />
											<button>{item.Key.replace('/', '')}</button>
										{:else}
											<!-- {@const meta = item.}
											{#if meta}
												{@const ct = (meta as Record<string, string> | undefined)?.['content-type']}
												{#if ct === 'application/pdf'}
													<FileIcon class="h-4 w-4" />
												{:else if ct?.startsWith('audio')}
													<FileMusicIcon class="h-4 w-4" />
												{/if}
											{/if} -->
											<FileIcon class="h-4 w-4" />
											<p>{item.Key}</p>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="w-32">
										<Badge variant="outline" class="text-muted-foreground px-1.5">
											<!-- {row.original.tags && row.original.tags.length > 0 ? row.original.tags.join(',') : 'No tags'} -->
											No tags
										</Badge>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="text-right">
										{humanFileSize(item.Size as number)}
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if item.LastModified}
										{prettyDate(item.LastModified)}
									{/if}
								</Table.Cell>
								<Table.Cell>
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
												<DropdownMenu.Item>
													<Icon />
													{actionItem.title}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						</ContextMenu.Trigger>
						<ContextMenu.Content class="w-52">
							{@render DataTableActions()}
						</ContextMenu.Content>
					</ContextMenu.Root>
				{/each}
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
