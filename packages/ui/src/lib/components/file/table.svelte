<script lang="ts">
	import { EllipsisVerticalIcon } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ObjectItem } from '$lib/api';
	import FilePrefix from '$lib/components/file/prefix.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge/index';
	import { Button } from '$lib/components/ui/button';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index';
	import * as Table from '$lib/components/ui/table/index';
	import { route } from '$lib/ROUTES';
	import {
		capitalizeFirstLetter,
		cn,
		humanFileSize,
		isFolderItem,
		type SharedFileDisplayProps,
		shouldDisplayAction
	} from '$lib/utils';

	let {
		handleOpenItem,
		files,
		actionableItem = $bindable(),
		actionsContextOpen = $bindable(false),
		allSelected = $bindable(false),
		indeterminate = $bindable(false),
		loading = $bindable(false),
		confirmDeleteOpen = $bindable(false),
		deletingItem = $bindable(false),
		checkedItems = $bindable(),
		handleDeleteObject,
		searchValue,
		searchResults,
		itemActions
	}: SharedFileDisplayProps = $props();

	const iconSize = 'h-5 w-5';
	const loadingAmount = 20;

	let isSingleItemAction: boolean = $state(false);

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
</script>

{#snippet tableRow(objectItem: ObjectItem)}
	{@const isFolder = isFolderItem(objectItem)}
	<Table.Row>
		<Table.Cell class="w-4">
			<Checkbox
				checked={isChecked(objectItem)}
				onCheckedChange={(checked) => {
					checkedItems[objectItem.key] = checked;
					const someChecked = files.list.filter(
						(item) => checkedItems[item.key] === true
					);
					if (someChecked.length > 1) {
						isSingleItemAction = false;
					} else {
						isSingleItemAction = true;
					}
				}}
			/>
		</Table.Cell>
		<Table.Cell colspan={7}>
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					<div
						class="flex flex-col items-start gap-2"
						role="button"
						tabindex={-1}
						ontap={() => {
							if (isFolder) {
								const folder = objectItem.key.replace('/', '');
								goto(
									route('/browse/[...path]', {
										path: page.params.path
											? [page.params.path, folder]
											: [folder]
									})
								);
								return;
							}

							handleOpenItem(objectItem);
						}}
					>
						<FilePrefix
							bind:checkedItems
							{indeterminate}
							item={objectItem}
							{handleOpenItem}
							{iconSize}
							layout="list"
						/>
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					{#each itemActions as action}
						{#if shouldDisplayAction({ action, item: objectItem })}
							{@const Icon = action.icon}
							<DropdownMenu.Item
								onclick={() => action.action(objectItem)}
								disabled={action.disabled}
							>
								<Icon />
								{action.title}
							</DropdownMenu.Item>
						{/if}
					{/each}
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			{#if isFolder}
				<span>-</span>
			{:else}
				<Badge variant="outline" class="text-muted-foreground px-1.5">
					{objectItem.metadata?.category
						? capitalizeFirstLetter(objectItem.metadata.category)
						: 'No category'}
				</Badge>
			{/if}
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			<p class="text-xs">
				{humanFileSize(objectItem.size as number) ?? '-'}
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
							{#if shouldDisplayAction({ action, item: objectItem })}
								{@const Icon = action.icon}
								<DropdownMenu.Item
									onclick={() => action.action(objectItem)}
									disabled={action.disabled}
								>
									<Icon />
									{action.title}
								</DropdownMenu.Item>
							{/if}
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

<AlertDialog.Root bind:open={confirmDeleteOpen}>
	<AlertDialog.Content class="max-h-[70%] overflow-y-auto pb-16">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the following items from
				your storage device.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="overflow-y-auto">
			<div class="prose">
				<ul>
					{#each Object.keys(checkedItems) as item}
						<li class="text-foreground">{item}</li>
					{/each}
				</ul>
			</div>
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
