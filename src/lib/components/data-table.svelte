<script lang="ts" module>
	export const columns: ColumnDef<DataItem>[] = [
		{
			id: 'drag',
			header: () => null,
			cell: ({ row }) => renderSnippet(DragHandle, { id: row.original.id })
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
			accessorKey: 'title',
			header: 'Title',
			cell: ({ row }) => renderComponent(DataTableCellViewer, { item: row.original }),
			enableHiding: false
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ row }) => renderSnippet(DataTableCategory, { row })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => renderSnippet(DataTableStatus, { row })
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
			accessorKey: 'createdAt',
			header: 'Created At',
			cell: ({ row }) => renderSnippet(DataTableCreatedAt, { row })
		},
		{
			accessorKey: 'lastUpdated',
			header: 'Last updated',
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
		type PaginationState,
		type Row,
		type RowSelectionState,
		type SortingState,
		type VisibilityState
	} from '@tanstack/table-core';
	import type { DataItem } from './schemas.js';
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
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		FlexRender,
		renderComponent,
		renderSnippet
	} from '$lib/components/ui/data-table/index.js';
	import LayoutColumnsIcon from '@tabler/icons-svelte/icons/layout-columns';
	import GripVerticalIcon from '@tabler/icons-svelte/icons/grip-vertical';
	import ChevronDownIcon from '@tabler/icons-svelte/icons/chevron-down';
	import ChevronsLeftIcon from '@tabler/icons-svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@tabler/icons-svelte/icons/chevron-left';
	import ChevronRightIcon from '@tabler/icons-svelte/icons/chevron-right';
	import ChevronsRightIcon from '@tabler/icons-svelte/icons/chevrons-right';
	import CircleCheckFilledIcon from '@tabler/icons-svelte/icons/circle-check-filled';
	import LoaderIcon from '@tabler/icons-svelte/icons/loader';
	import DotsVerticalIcon from '@tabler/icons-svelte/icons/dots-vertical';
	import { toast } from 'svelte-sonner';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import DataTableCellViewer from './data-table-cell-viewer.svelte';
	import { createRawSnippet } from 'svelte';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import { prettyDate } from '$lib/utils';

	type Props = {
		data: DataItem[];
		title?: string;
		showPagination?: boolean;
	};

	let { title, data, showPagination = true }: Props = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
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

	const dataIds: UniqueIdentifier[] = $derived(data.map((item) => item.id));

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
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
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
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
<div class="mb-2 flex items-center justify-between">
	<div>
		{#if title}
			<h3 class="text-xl font-medium">
				{title}
			</h3>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" size="sm" {...props}>
						<LayoutColumnsIcon />
						<span class="hidden lg:inline">Customize Columns</span>
						<span class="lg:hidden">Columns</span>
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				{#each table
					.getAllColumns()
					.filter((col) => typeof col.accessorFn !== 'undefined' && col.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem
						class="capitalize"
						checked={column.getIsVisible()}
						onCheckedChange={(value) => column.toggleVisibility(!!value)}
					>
						{column.id}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<!-- <Button variant="outline" size="sm">
				<PlusIcon />
				<span class="hidden lg:inline">Add Section</span>
			</Button> -->
	</div>
</div>

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

<!-- Pagination -->
{#if showPagination}
	<div class="mt-5 flex items-center justify-between px-4">
		<div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
			{table.getFilteredSelectedRowModel().rows.length} of
			{table.getFilteredRowModel().rows.length} row(s) selected.
		</div>
		<div class="flex w-full items-center gap-8 lg:w-fit">
			<div class="hidden items-center gap-2 lg:flex">
				<Label for="rows-per-page" class="text-sm font-medium">Rows per page</Label>
				<Select.Root
					type="single"
					bind:value={
						() => `${table.getState().pagination.pageSize}`, (v) => table.setPageSize(Number(v))
					}
				>
					<Select.Trigger size="sm" class="w-20" id="rows-per-page">
						{table.getState().pagination.pageSize}
					</Select.Trigger>
					<Select.Content side="top">
						{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
							<Select.Item value={pageSize.toString()}>
								{pageSize}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex w-fit items-center justify-center text-sm font-medium">
				Page {table.getState().pagination.pageIndex + 1} of
				{table.getPageCount()}
			</div>
			<div class="ml-auto flex items-center gap-2 lg:ml-0">
				<Button
					variant="outline"
					class="hidden h-8 w-8 p-0 lg:flex"
					onclick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Go to first page</span>
					<ChevronsLeftIcon />
				</Button>
				<Button
					variant="outline"
					class="size-8"
					size="icon"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<span class="sr-only">Go to previous page</span>
					<ChevronLeftIcon />
				</Button>
				<Button
					variant="outline"
					class="size-8"
					size="icon"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Go to next page</span>
					<ChevronRightIcon />
				</Button>
				<Button
					variant="outline"
					class="hidden size-8 lg:flex"
					size="icon"
					onclick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<span class="sr-only">Go to last page</span>
					<ChevronsRightIcon />
				</Button>
			</div>
		</div>
	</div>
{/if}

{#snippet DataTableCategory({ row }: { row: Row<DataItem> })}
	<div class="w-32">
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{row.original.category}
		</Badge>
	</div>
{/snippet}

{#snippet DataTableStatus({ row }: { row: Row<DataItem> })}
	<Badge variant="outline" class="text-muted-foreground px-1.5">
		{#if row.original.status === 'Done'}
			<CircleCheckFilledIcon class="fill-green-500 dark:fill-green-400" />
		{:else}
			<LoaderIcon />
		{/if}
		{row.original.status}
	</Badge>
{/snippet}

{#snippet DataTableSize({ row }: { row: Row<DataItem> })}
	<div class="text-right">
		{row.original.size} mb
	</div>
{/snippet}

{#snippet DataTableCreatedAt({ row }: { row: Row<DataItem> })}
	<div class="w-32">
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{prettyDate(row.original.createdAt)}
		</Badge>
	</div>
{/snippet}

{#snippet DataTableLastUpdated({ row }: { row: Row<DataItem> })}
	<div class="w-32">
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{prettyDate(row.original.lastUpdated)}
		</Badge>
	</div>
{/snippet}

{#snippet DataTableActions()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon />
					<span class="sr-only">Open menu</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-32">
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item>Make a copy</DropdownMenu.Item>
			<DropdownMenu.Item>Favorite</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet DraggableRow({ row }: { row: Row<DataItem> })}
	{@const { transform, transition, node, isDragging } = useSortable({
		id: () => row.original.id
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

{#snippet DragHandle({ id }: { id: number })}
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
