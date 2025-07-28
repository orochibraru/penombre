<script lang="ts">
	import { EllipsisVerticalIcon } from '@lucide/svelte';
	import type { ObjectItem, ObjectList } from '$lib/api';
	import FilePrefix from '$lib/components/file-prefix.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer/index';
	import { Skeleton } from '$lib/components/ui/skeleton/index';
	import { touchAction } from '$lib/file-actions';
	import { cn, type SharedFileDisplayProps } from '$lib/utils';

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
		handleDeleteObject,
		checkedItems = $bindable(),
		searchValue,
		searchResults,
		itemActions
	}: SharedFileDisplayProps = $props();

	const iconSize = 'h-6 w-6';
	const loadingAmount = 20;

	function isChecked(item: ObjectItem): boolean {
		return checkedItems[item.key] || false;
	}
</script>

{#snippet listItem(objectItem: ObjectItem)}
	{@const checked = isChecked(objectItem)}
	<li
		class={cn(
			'flex items-center justify-between rounded-xl px-1 py-3 transition-colors',
			checked ? 'bg-primary/5' : ''
		)}
		use:touchAction
		onlongpress={() => {
			if (checked) {
				checkedItems[objectItem.key] = false;
				return;
			}

			checkedItems[objectItem.key] = true;
		}}
	>
		<FilePrefix selected={checked} {indeterminate} item={objectItem} {handleOpenItem} {iconSize} />
		<button
			onclick={() => {
				actionableItem = objectItem;
				actionsContextOpen = true;
			}}
			class="py-1 pl-5"
		>
			<EllipsisVerticalIcon class="h-5 w-5" />
		</button>
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

<ul class="flex flex-col gap-1">
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

<Drawer.Root bind:open={actionsContextOpen}>
	<Drawer.Content class="z-50">
		<Drawer.Header>
			{#if actionableItem}
				<Drawer.Title class="border-b pb-3 text-lg">
					{actionableItem.key}
				</Drawer.Title>
			{/if}
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
							class="disabled:text-muted-foreground hover:text-primary flex w-full items-center justify-start gap-3 text-balance transition-colors"
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
