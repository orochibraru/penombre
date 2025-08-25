<script lang="ts">
	import {
		CircleCheckIcon,
		CircleIcon,
		FileCodeIcon,
		FileIcon,
		FileImageIcon,
		FileMusicIcon,
		FileTextIcon,
		FolderIcon,
		XIcon
	} from '@lucide/svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ObjectItem } from '$lib/api';
	import { Badge } from '$lib/components/ui/badge/index';
	import { touchAction } from '$lib/file-actions';
	import { isCodeItem } from '$lib/file-utils';
	import { route } from '$lib/ROUTES';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import { cn, isFolderItem, prettyDate, secondsToMinutes } from '$lib/utils';

	type Props = {
		item: ObjectItem;
		iconSize: string;
		handleOpenItem: (item: ObjectItem) => void;
		indeterminate: boolean;
		checkedItems: Record<string, boolean>;
	};

	let {
		item,
		iconSize,
		handleOpenItem,
		checkedItems = $bindable(),
		indeterminate
	}: Props = $props();

	function isChecked(item: ObjectItem): boolean {
		return checkedItems[item.key] || false;
	}

	const isCode = isCodeItem(item.key);
	const isFolder = isFolderItem(item);
	let isUploading: boolean = $derived(
		!isFolder &&
			item.size === 0 &&
			!$uploadedItems[item.key] &&
			$uploadingItems[item.key] &&
			$uploadingItems[item.key] !== 100
			? true
			: false
	);
	const folder = item.key.replace('/', '');
	const isDesktop = new MediaQuery('(min-width: 768px)');

	function toggleCheck() {
		if (isChecked(item)) {
			checkedItems[item.key] = false;
			return;
		}

		checkedItems[item.key] = true;
		return;
	}

	function handleClick() {
		if (indeterminate) {
			return toggleCheck();
		}

		if (isFolder) {
			goto(
				route('/browse/[...path]', {
					path: page.params.path ? [page.params.path, folder] : [folder]
				})
			);
			return;
		}

		return handleOpenItem(item);
	}

	function handleLongPress() {
		return toggleCheck();
	}
</script>

{#if isFolder}
	<button
		use:touchAction
		onclick={() => handleClick()}
		ontap={() => handleClick()}
		onlongpress={() => handleLongPress()}
		class="flex w-full items-center gap-2"
	>
		{#if !isDesktop.current && indeterminate}
			{#if isChecked(item)}
				<CircleCheckIcon class="text-primary" />
			{:else}
				<CircleIcon class="text-muted-foreground" />
			{/if}
		{:else}
			<FolderIcon class={cn(iconSize, 'text-indigo-600')} fill="#1447e6" />
		{/if}
		{folder}
	</button>
{:else}
	<button
		use:touchAction
		onclick={() => handleClick()}
		ontap={() => handleClick()}
		onlongpress={() => handleLongPress()}
		class="flex w-full items-center gap-2"
		disabled={isUploading}
	>
		{#if !isDesktop.current && indeterminate}
			{#if isChecked(item)}
				<CircleCheckIcon class="text-primary" />
			{:else}
				<CircleIcon class="text-muted-foreground" />
			{/if}
		{:else if isUploading}
			<div>
				{#if $uploadingItems[item.key] && !Number.isNaN($uploadingItems[item.key])}
					<span class="text-xs">
						{Math.round($uploadingItems[item.key] ?? 0)}%
					</span>
				{:else}
					<XIcon class="h-4 w-4 text-red-600" />
				{/if}
			</div>
		{:else if item.contentType}
			{#if item.contentType.includes('application/pdf')}
				<FileTextIcon class={cn(iconSize, 'text-red-600')} />
			{:else if item.contentType.startsWith('audio')}
				<FileMusicIcon class={cn(iconSize, 'text-pink-400')} />
			{:else if item.contentType.startsWith('image')}
				<FileImageIcon class={cn(iconSize, 'text-orange-400')} />
			{:else if isCode}
				<FileCodeIcon class={cn(iconSize, 'text-green-400')} />
			{:else}
				<FileIcon class={iconSize} />
			{/if}
		{:else}
			<FileIcon class={iconSize} />
		{/if}
		<div class="text-start">
			<p
				title={item.key}
				class={cn(
					'max-w-72 truncate text-base lg:text-sm',
					isUploading ? 'text-gray-500 dark:text-gray-300' : ''
				)}
			>
				{item.key}
			</p>
			{#if item.lastModified}
				<p class="text-xs dark:text-gray-500">Modified {prettyDate(item.lastModified)}</p>
			{/if}
		</div>
		{#if item.metadata?.category === 'music'}
			{#if item.metadata.musicduration}
				<Badge variant="outline" class="text-muted-foreground px-1.5 text-xs">
					{secondsToMinutes(Number.parseFloat(item.metadata.musicduration))}
				</Badge>
			{/if}
		{/if}
	</button>
{/if}
