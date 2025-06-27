<script lang="ts" module>
	export const columns: ColumnDef<BucketObject>[] = [
		{
			id: 'drag',
			header: () => null,
			cell: () => renderSnippet(DragHandle, { id: generateUuid() })
		},
		{
			id: 'select',
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					'aria-label': 'Select all'
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					'aria-label': 'Select row'
				}),
			enableSorting: false,
			enableHiding: false
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({ row }) => renderSnippet(DataTableName, { row }),
			enableHiding: false
		},
		{
			accessorKey: 'tags',
			header: 'Tags',
			cell: ({ row }) => renderSnippet(DataTableTags, { row })
		},
		{
			accessorKey: 'size',
			header: () =>
				renderSnippet(
					createRawSnippet(() => ({
						render: () => '<div class="w-full text-right">Size</div>'
					}))
				),
			cell: ({ row }) => renderSnippet(DataTableSize, { row })
		},
		{
			accessorKey: 'lastModified',
			header: 'Last modified',
			cell: ({ row }) => renderSnippet(DataTableLastUpdated, { row })
		},
		{
			id: 'actions',
			cell: () => renderSnippet(DataTableActions)
		}
	];
</script>

<script lang="ts">
	import {
		getCoreRowModel,
		getFacetedRowModel,
		getFacetedUniqueValues,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type ColumnFiltersState,
		type Row,
		type RowSelectionState,
		type SortingState,
		type VisibilityState
	} from '@tanstack/table-core';
	import {
		useSensors,
		MouseSensor,
		TouchSensor,
		KeyboardSensor,
		useSensor,
		type DragEndEvent,
		type UniqueIdentifier,
		DndContext,
		closestCenter
	} from '@dnd-kit-svelte/core';
	import {
		arrayMove,
		SortableContext,
		useSortable,
		verticalListSortingStrategy
	} from '@dnd-kit-svelte/sortable';
	import { restrictToVerticalAxis } from '@dnd-kit-svelte/modifiers';
	import { createSvelteTable } from '$lib/components/ui/data-table/data-table.svelte.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		FlexRender,
		renderComponent,
		renderSnippet
	} from '$lib/components/ui/data-table/index.js';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import { createRawSnippet } from 'svelte';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import { humanFileSize, prettyDate, generateUuid } from '$lib/utils';
	import {
		CopyIcon,
		EllipsisVerticalIcon,
		FileIcon,
		FolderIcon,
		FolderInputIcon,
		GripVerticalIcon,
		ShareIcon,
		StarIcon,
		TrashIcon
	} from '@lucide/svelte';
	import type { BucketObject } from '$lib/server/services/storage';

	type Props = {
		data: BucketObject[];
		title?: string;
	};

	let { title, data }: Props = $props();

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});

	const sortableId = $props.id();

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	const dataIds: UniqueIdentifier[] = $derived(data.map(() => generateUuid()));

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getRowId: () => generateUuid(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		}
	});

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = dataIds.indexOf(active.id);
			const newIndex = dataIds.indexOf(over.id);
			data = arrayMove(data, oldIndex, newIndex);
		}
	}
</script>

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
	<DndContext
		collisionDetection={closestCenter}
		modifiers={[restrictToVerticalAxis]}
		onDragEnd={handleDragEnd}
		{sensors}
		id={sortableId}
	>
		<Table.Root>
			<Table.Header class="bg-muted sticky top-0 z-10">
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body class="**:data-[slot=table-cell]:first:w-8">
				{#if table.getRowModel().rows?.length}
					<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
						{#each table.getRowModel().rows as row (row.id)}
							{@render DraggableRow({ row })}
						{/each}
					</SortableContext>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</DndContext>
</div>

{#snippet DataTableName({ row }: { row: Row<BucketObject> })}
	<div class="flex items-center gap-2">
		{#if row.original.Key?.endsWith('/')}
			<FolderIcon class="h-4 w-4" />
			<button>{row.original.Key.replace('/', '')}</button>
		{:else}
			<!-- {@const meta = row.original.}
			{#if meta}
				{@const ct = (meta as Record<string, string> | undefined)?.['content-type']}
				{#if ct === 'application/pdf'}
					<FileIcon class="h-4 w-4" />
				{:else if ct?.startsWith('audio')}
					<FileMusicIcon class="h-4 w-4" />
				{/if}
			{/if} -->
			<FileIcon class="h-4 w-4" />
			<p>{row.original.Key}</p>
		{/if}
	</div>
{/snippet}

{#snippet DataTableTags({ row }: { row: Row<BucketObject> })}
	<div class="w-32">
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			<!-- {row.original.tags && row.original.tags.length > 0 ? row.original.tags.join(',') : 'No tags'} -->
			No tags
		</Badge>
	</div>
{/snippet}

{#snippet DataTableSize({ row }: { row: Row<BucketObject> })}
	<div class="text-right">
		{humanFileSize(row.original.Size as number)}
	</div>
{/snippet}

{#snippet DataTableLastUpdated({ row }: { row: Row<BucketObject> })}
	{#if row.original.LastModified}
		<div class="w-32">
			<Badge variant="outline" class="text-muted-foreground px-1.5">
				{prettyDate(row.original.LastModified)}
			</Badge>
		</div>
	{/if}
{/snippet}

{#snippet DataTableActions()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<EllipsisVerticalIcon />
					<span class="sr-only">Open menu</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-32">
			<DropdownMenu.Item>
				<FolderInputIcon />
				Move
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<CopyIcon />
				Duplicate
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<StarIcon />
				Star
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<ShareIcon />
				Share
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">
				<TrashIcon />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet DraggableRow({ row }: { row: Row<BucketObject> })}
	{@const { transform, transition, node, isDragging } = useSortable({
		id: () => generateUuid()
	})}

	<Table.Row
		data-state={row.getIsSelected() && 'selected'}
		data-dragging={isDragging.current}
		bind:ref={node.current}
		class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
		style="transition: {transition.current}; transform: {CSS.Transform.toString(transform.current)}"
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet DragHandle({ id }: { id: string })}
	{@const { attributes, listeners } = useSortable({ id: () => id })}

	<Button
		{...attributes.current}
		{...listeners.current}
		variant="ghost"
		size="icon"
		class="text-muted-foreground size-7 hover:bg-transparent"
	>
		<GripVerticalIcon class="text-muted-foreground size-3" />
		<span class="sr-only">Drag to reorder</span>
	</Button>
{/snippet}
