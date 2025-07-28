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
	import { page } from '$app/state';
	import type { ObjectItem } from '$lib/api';
	import { Badge } from '$lib/components/ui/badge/index';
	import { isCodeItem } from '$lib/file-utils';
	import { route } from '$lib/ROUTES';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import { cn, isFolderItem, prettyDate, secondsToMinutes } from '$lib/utils';

	type Props = {
		item: ObjectItem;
		iconSize: string;
		handleOpenItem: (item: ObjectItem) => void;
		selected?: boolean;
		indeterminate: boolean;
	};

	let {
		item,
		iconSize,
		handleOpenItem,
		selected = $bindable(false),
		indeterminate
	}: Props = $props();

	const isCode = isCodeItem(item.key);
	const isFolder = isFolderItem(item);
	const isUploading = !isFolder && item.size === 0 && !$uploadedItems[item.key];
	const isDesktop = new MediaQuery('(min-width: 768px)');
</script>

<div class="flex w-full flex-1 items-center gap-2">
	{#if isFolder}
		{@const folder = item.key.replace('/', '')}
		<a
			href={route('/browse/[...path]', {
				path: page.params.path ? [page.params.path, folder] : [folder]
			})}
			class="flex w-full items-center gap-2"
		>
			{#if !isDesktop.current && (indeterminate || selected)}
				{#if selected}
					<CircleCheckIcon class="text-primary" />
				{:else}
					<CircleIcon class="text-muted-foreground" />
				{/if}
			{:else}
				<FolderIcon class={cn(iconSize, 'text-indigo-600')} fill="#1447e6" />
			{/if}
			{folder}
		</a>
	{:else}
		<button
			onclick={() => {
				if (indeterminate) {
					selected = !selected;
					return;
				}

				return handleOpenItem(item);
			}}
			class="flex w-full items-center gap-2"
			disabled={isUploading}
		>
			{#if !isDesktop.current && (indeterminate || selected)}
				{#if selected}
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
</div>
