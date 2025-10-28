<script lang="ts">
	import { EllipsisVerticalIcon } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ObjectItem } from '$lib/api';
	import FilePrefix from '$lib/components/file/prefix.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index';
	import { route } from '$lib/ROUTES';
	import { cn, isFolderItem, type SharedFileDisplayProps, shouldDisplayAction } from '$lib/utils';

	let {
		handleOpenItem,
		files,
		actionableItem = $bindable(),
		actionsContextOpen = $bindable(false),
		allSelected = $bindable(false),
		indeterminate,
		loading = $bindable(false),
		confirmDeleteOpen = $bindable(false),
		deletingItem = $bindable(false),
		handleDeleteObject,
		checkedItems = $bindable(),
		searchValue,
		searchResults,
		itemActions
	}: SharedFileDisplayProps = $props();

	const iconSize = 'h-36 w-36';
	const loadingAmount = 20;

	function isChecked(item: ObjectItem): boolean {
		return checkedItems[item.key] || false;
	}
</script>

{#snippet listItem(objectItem: ObjectItem)}
	{@const checked = isChecked(objectItem)}
	{@const isFolder = isFolderItem(objectItem)}
	<li
		class={cn(
			'flex items-end justify-between rounded-xl border p-5 transition-colors',
			checked ? 'bg-primary/5' : ''
		)}
	>
		<ContextMenu.Root>
			<ContextMenu.Trigger class="h-full w-full">
				<div
					class="flex h-full flex-col items-start justify-center gap-2"
					role="button"
					tabindex={-1}
					ontap={() => {
						if (isFolder) {
							const folder = objectItem.key.replace('/', '');
							goto(
								route('/browse/[...path]', {
									path: page.params.path ? [page.params.path, folder] : [folder]
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
						layout="grid"
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
	</li>
{/snippet}

{#snippet emptyListItem()}
	<li class="flex items-center justify-between py-3">
		<p>No results.</p>
	</li>
{/snippet}

{#snippet loadingRows()}
	{#each Array(loadingAmount) as _}
		<li class="flex items-center justify-between py-3">
			<Skeleton class="h-[30px] w-full rounded-sm" />
		</li>
	{/each}
{/snippet}

<ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
	{#if loading}
		{@render loadingRows()}
	{:else if searchValue}
		{#if searchResults.length > 0}
			{#each searchResults as objectItem}
				{@render listItem(objectItem)}
			{/each}
		{:else}
			{@render emptyListItem()}
		{/if}
	{:else if files.count > 0}
		{#each files.list as objectItem}
			{@render listItem(objectItem)}
		{/each}
	{:else}
		{@render emptyListItem()}
	{/if}
</ul>

<AlertDialog.Root bind:open={confirmDeleteOpen}>
	<AlertDialog.Content class="max-h-[70%] overflow-y-auto pb-16">
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the following items from
				your storage device.
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
