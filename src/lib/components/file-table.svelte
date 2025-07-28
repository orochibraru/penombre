<script lang="ts">
	import {
		EllipsisVerticalIcon,
		FileCodeIcon,
		FileIcon,
		FileImageIcon,
		FileMusicIcon,
		FileTextIcon,
		FolderIcon,
		XIcon
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ObjectItem, ObjectList } from '$lib/api';
	import FilePrefix from '$lib/components/file-prefix.svelte';
	import { Badge } from '$lib/components/ui/badge/index';
	import { Button } from '$lib/components/ui/button';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import { Skeleton } from '$lib/components/ui/skeleton/index';
	import * as Table from '$lib/components/ui/table/index';
	import { touchAction } from '$lib/file-actions';
	import { isCodeItem } from '$lib/file-utils';
	import { route } from '$lib/ROUTES';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import {
		capitalizeFirstLetter,
		cn,
		humanFileSize,
		type ItemAction,
		isFolderItem
	} from '$lib/utils';

	type Props = {
		handleOpenItem: (item: ObjectItem) => void;
		files: ObjectList;
		actionableItem: ObjectItem | undefined;
		actionsContextOpen: boolean;
		allSelected: boolean;
		indeterminate: boolean;
		itemActions: ItemAction[];
		loading: boolean;
		searchValue: string;
		searchResults: ObjectItem[];
	};

	let {
		handleOpenItem,
		files,
		actionableItem = $bindable(),
		actionsContextOpen = $bindable(false),
		allSelected = $bindable(false),
		indeterminate = $bindable(false),
		loading = $bindable(false),
		searchValue,
		searchResults,
		itemActions
	}: Props = $props();

	const iconSize = 'h-5 w-5';
	const loadingAmount = 20;

	let checkedItems: Record<string, boolean> = $state({});
	let isSingleItemAction: boolean = $state(false);
	let multiObjectActionsOpen = $derived((indeterminate || allSelected) && !isSingleItemAction);

	function toggleSelectAll(checked: boolean) {
		isSingleItemAction = false;
		files.list.forEach((item) => {
			checkedItems[item.key] = checked;
		});
	}

	const columns: TableHeadItem[] = [
		{
			title: 'Name',
			colSpan: 7
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
			title: 'Actions',
			colSpan: 1,
			class: 'w-4 text-right'
		}
	];

	type TableHeadItem = {
		title: string;
		colSpan: number;
		class?: string;
	};

	function isChecked(item: ObjectItem): boolean {
		return checkedItems[item.key] || false;
	}

	$effect(() => {
		allSelected = files.count > 0 && files.list.every((item) => checkedItems[item.key]);
		indeterminate =
			files.count > 0 && files.list.some((item) => checkedItems[item.key] === true) && !allSelected;

		if (files.count === 0) {
			checkedItems = {};
		}
	});
</script>

{#snippet tableRow(objectItem: ObjectItem)}
	{@const isCode = isCodeItem(objectItem.key)}
	{@const isFolder = isFolderItem(objectItem)}
	{@const isUploading = !isFolder && objectItem.size === 0 && !$uploadedItems[objectItem.key]}
	{@const item = $uploadedItems[objectItem.key] ?? objectItem}
	<Table.Row>
		<Table.Cell class="w-4">
			<Checkbox
				checked={isChecked(item)}
				onCheckedChange={(checked) => {
					checkedItems[item.key] = checked;
					const someChecked = files.list.filter((item) => checkedItems[item.key] === true);
					if (someChecked.length > 1) {
						isSingleItemAction = false;
					} else {
						isSingleItemAction = true;
					}
				}}
			/>
		</Table.Cell>
		<Table.Cell colspan={7}>
			<div
				class="flex flex-col items-start gap-2"
				role="button"
				tabindex={-1}
				use:touchAction
				ontap={() => {
					if (isFolder) {
						const folder = item.key.replace('/', '');
						goto(
							route('/browse/[...path]', {
								path: page.params.path ? [page.params.path, folder] : [folder]
							})
						);
						return;
					}

					handleOpenItem(item);
				}}
				onlongpress={() => {
					actionableItem = item;
					actionsContextOpen = true;
				}}
			>
				<FilePrefix item={objectItem} {handleOpenItem} {iconSize} />
			</div>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			{#if isFolder}
				<span>-</span>
			{:else}
				<Badge variant="outline" class="text-muted-foreground px-1.5">
					{item.metadata?.category ? capitalizeFirstLetter(item.metadata.category) : 'No category'}
				</Badge>
			{/if}
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			<p class="text-xs">
				{humanFileSize(item.size as number) ?? '-'}
			</p>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-4">
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
						{#each itemActions as action}
							{@const Icon = action.icon}
							<DropdownMenu.Item onclick={() => action.action(item)} disabled={action.disabled}>
								<Icon />
								{action.title}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</Table.Cell>
	</Table.Row>
{/snippet}

{#snippet emptyRow()}
	<Table.Row>
		<Table.Cell colspan={12} class="h-24 text-center">No results.</Table.Cell>
	</Table.Row>
{/snippet}

{#snippet loadingRows()}
	{#each Array(loadingAmount) as _}
		<Table.Row>
			<Table.Cell colspan={1}>
				<Checkbox disabled />
			</Table.Cell>
			<Table.Cell colspan={10} class="text-center">
				<Skeleton class="h-[30px] w-full rounded-sm" />
			</Table.Cell>
			<Table.Cell colspan={1} class="w-4">
				<div class="flex w-full items-center justify-end">
					<Button variant="ghost" size="icon" disabled>
						<EllipsisVerticalIcon />
						<span class="sr-only">Open menu</span>
					</Button>
				</div>
			</Table.Cell>
		</Table.Row>
	{/each}
{/snippet}

<div class="rounded-lg border">
	<Table.Root>
		<Table.Header class="bg-muted sticky top-0 z-10">
			<Table.Row>
				<Table.Head colspan={1} class="w-4">
					<Checkbox
						onCheckedChange={(e) => toggleSelectAll(e)}
						checked={allSelected}
						bind:indeterminate
					/>
				</Table.Head>
				{#each columns as headItem}
					<Table.Head colspan={headItem.colSpan} class={cn(headItem.class)}>
						{headItem.title}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if loading}
				{@render loadingRows()}
			{:else if searchValue}
				{#if searchResults.length > 0}
					{#each searchResults as item}
						{@render tableRow(item)}
					{/each}
				{:else}
					{@render emptyRow()}
				{/if}
			{:else if files.count > 0}
				{#each files.list as item}
					{@render tableRow(item)}
				{/each}
			{:else}
				{@render emptyRow()}
			{/if}
		</Table.Body>
	</Table.Root>
</div>
