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
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { touchAction } from '$lib/file-actions';
	import { isCodeItem } from '$lib/file-utils';
	import { route } from '$lib/ROUTES';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import { getProxiedObjectUrl } from '$lib/url';
	import { cn, isFolderItem, prettyDate, secondsToMinutes, stripFolders } from '$lib/utils';

	type Props = {
		item: ObjectItem;
		iconSize: string;
		handleOpenItem: (item: ObjectItem) => void;
		indeterminate: boolean;
		checkedItems: Record<string, boolean>;
		layout: 'grid' | 'list';
	};

	let {
		item,
		iconSize,
		handleOpenItem,
		checkedItems = $bindable(),
		indeterminate,
		layout
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
			const basePath = page.params.path ? [page.params.path, folder] : [folder];
			goto(
				route('/browse/[...path]', {
					path: basePath
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

{#snippet previewItem(item: ObjectItem)}
	<div class="flex w-full items-center justify-between">
		{#await getProxiedObjectUrl(item)}
			<Spinner />
		{:then url}
			{#if item.contentType?.includes('application/pdf')}
				<iframe
					src={url}
					title={item.key}
					scrolling="no"
					class="overflow-hidden"
					loading="lazy"
					allowfullscreen={false}
					referrerpolicy="no-referrer-when-downgrade"
					width="100%"
					height="200px"
				></iframe>
			{:else if isCodeItem(item.key)}
				<iframe
					src={url}
					title={item.key}
					scrolling="no"
					class="overflow-hidden rounded-lg border p-3 shadow-sm"
					loading="lazy"
					allowfullscreen={false}
					referrerpolicy="no-referrer-when-downgrade"
					width="100%"
					height="200px"
				></iframe>
			{:else}
				<img src={url} alt={item.key} class="mx-auto max-h-[200px] min-w-[200px] rounded-xl" />
			{/if}
		{/await}
	</div>
{/snippet}

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
		class={cn(
			'flex h-full w-full gap-2',
			layout === 'grid' ? 'flex-col items-start' : 'flex-row items-center'
		)}
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
			<div
				class={cn(
					'flex h-full items-center',
					layout === 'grid' ? 'w-full justify-center' : 'justify-start'
				)}
			>
				{#if item.contentType.includes('application/pdf')}
					{#if layout === 'grid'}
						{@render previewItem(item)}
					{:else}
						<FileTextIcon class={cn(iconSize, 'text-red-600')} />
					{/if}
				{:else if item.contentType.startsWith('audio')}
					<FileMusicIcon class={cn(iconSize, 'text-pink-400')} />
				{:else if item.contentType.startsWith('image')}
					{#if layout === 'grid'}
						{@render previewItem(item)}
					{:else}
						<FileImageIcon class={cn(iconSize, 'text-orange-400')} />
					{/if}
				{:else if isCode}
					{#if layout === 'grid'}
						{@render previewItem(item)}
					{:else}
						<FileCodeIcon class={cn(iconSize, 'text-green-400')} />
					{/if}
				{:else}
					<FileIcon class={iconSize} />
				{/if}
			</div>
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
				{#if page.url.pathname.startsWith('/browse')}
					{item.key}
				{:else}
					{stripFolders(item.key)}
				{/if}
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
