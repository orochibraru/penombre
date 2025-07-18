<script lang="ts">
	import {
		CheckIcon,
		CopyIcon,
		EllipsisVerticalIcon,
		ExternalLinkIcon,
		FileCodeIcon,
		FileIcon,
		FileImageIcon,
		FileMusicIcon,
		FolderIcon,
		FolderInputIcon,
		type Icon as IconType,
		PencilLineIcon,
		ShareIcon,
		StarIcon,
		TrashIcon,
		XIcon
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { bridge } from '$lib/client/api';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Code from '$lib/components/ui/code';
	import type { SupportedLanguage } from '$lib/components/ui/code/shiki';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { determineCodeFileLanguage, isCodeItem } from '$lib/file-utils';
	import { route } from '$lib/ROUTES';
	import type { ObjectItem, ObjectList } from '$lib/server/services/storage';
	import { playableMusic } from '$lib/store/music';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import {
		capitalizeFirstLetter,
		cn,
		humanFileSize,
		prettyDate,
		secondsToMinutes
	} from '$lib/utils';

	type Props = {
		data: ObjectList;
	};

	let { data }: Props = $props();

	let allSelected: boolean = $state(false);
	let indeterminate: boolean = $state(false);
	let confirmDeleteOpen: boolean = $state(false);
	let deletingItem: boolean = $state(false);
	let checkedItems: Record<string, boolean> = $state({});
	let isSingleItemAction: boolean = $state(false);
	let searchValue: string = $state('');
	let searchTimeout: ReturnType<typeof setTimeout> | undefined = $state();
	let loading: boolean = $state(false);
	let searchResults: ObjectItem[] = $state([]);
	let viewFileOpen: boolean = $state(false);
	let fileToView: {
		item: ObjectItem;
		src: string;
		type: 'image' | 'code';
		content?: string;
		language?: SupportedLanguage;
	} | null = $state(null);

	async function updateSearchResults() {
		searchResults = data.list.filter((item) => item.Key.toLowerCase().includes(searchValue));

		loading = false;
		return;
	}

	const debounce = () => {
		if (searchValue === '') {
			searchResults = [];
			loading = false;
			return;
		}
		loading = true;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			await updateSearchResults();
		}, 750);
	};

	type MultipleItemsAction = {
		title: string;
		icon: typeof IconType;
		action: () => void;
		variant: ButtonVariant;
	};

	type ItemAction = {
		title: string;
		icon: typeof IconType;
		action: (item: ObjectItem) => void;
	};

	const { api } = bridge(page.url, page.data.token);

	async function handleDeleteItem() {
		if (Object.keys(checkedItems).length === 0) {
			return;
		}

		const promises = [];

		for (const checkedItem of Object.keys(checkedItems)) {
			deletingItem = true;
			const itemPath = page.params.path ? `${page.params.path}/${checkedItem}` : checkedItem;
			const promise = api.v1.storage.objects
				.delete(null, { query: { item: itemPath } })
				.then(async ({ error }) => {
					if (error) {
						console.error(error);
						deletingItem = false;
						throw error;
					}

					confirmDeleteOpen = false;
					deletingItem = false;
				});

			promises.push(promise);
		}

		toast.promise(
			Promise.all(promises).finally(async () => {
				checkedItems = {};
				await invalidateAll();
			}),
			{
				loading: 'Deleting items',
				success: 'Items deleted',
				error: 'Failed to delete items'
			}
		);
	}

	const itemActions: ItemAction[] = [
		{
			title: 'Rename',
			icon: PencilLineIcon,
			action: () => []
		},
		{
			title: 'Move',
			icon: FolderInputIcon,
			action: () => []
		},
		{
			title: 'Duplicate',
			icon: CopyIcon,
			action: () => []
		},
		{
			title: 'Star',
			icon: StarIcon,
			action: () => []
		},
		{
			title: 'Share',
			icon: ShareIcon,
			action: () => []
		},
		{
			title: 'Delete',
			icon: TrashIcon,
			action: async (item: ObjectItem) => {
				isSingleItemAction = true;
				checkedItems = {};
				checkedItems[item.Key] = true;
				confirmDeleteOpen = true;
			}
		}
	];

	const multipleItemsActions: MultipleItemsAction[] = [
		{
			title: 'Move',
			icon: FolderInputIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Star',
			icon: StarIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Share',
			icon: ShareIcon,
			variant: 'outline',
			action: () => []
		},
		{
			title: 'Delete',
			icon: TrashIcon,
			variant: 'destructive',
			action: async () => {
				isSingleItemAction = false;
				confirmDeleteOpen = true;
			}
		}
	];

	type TableHeadItem = {
		title: string;
		colSpan: number;
		class?: string;
	};

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
			title: 'Last Modified',
			colSpan: 1
		},
		{
			title: 'Actions',
			colSpan: 1,
			class: 'w-4 text-right'
		}
	];

	async function handleOpenItemWrapper(item: ObjectItem) {
		return toast.promise(handleOpenItem(item), {
			loading: `Opening "${item.Key}"`,
			error: `Failed to open "${item.Key}"`
		});
	}

	async function handleOpenItem(item: ObjectItem): Promise<void> {
		$playableMusic = null;
		const proxyurl = `${page.url.protocol}//${page.url.host}`;

		const fullPath = page.params.path ? `${page.params.path}/${item.Key}` : item.Key;

		const { data: presignedUrl, error } = await api.v1.storage.objects.url.get({
			query: { item: fullPath, proxyurl }
		});

		if (error || !presignedUrl) {
			toast.error('Failed to open this file.');
			return;
		}

		if (isCodeItem(item.Key)) {
			const codeReq = await fetch(presignedUrl);
			if (!codeReq.ok) {
				toast.error('Failed to open code file.', {
					description: codeReq.statusText
				});
				return;
			}
			const code = await codeReq.text();
			fileToView = {
				item,
				src: presignedUrl,
				content: code,
				type: 'code',
				language: determineCodeFileLanguage(item)
			};
			viewFileOpen = true;
			return;
		}

		if (item.ContentType?.startsWith('image')) {
			fileToView = {
				item,
				src: presignedUrl,
				type: 'image'
			};
			viewFileOpen = true;
			return;
		}

		if (item.ContentType?.startsWith('audio')) {
			$playableMusic = {
				title: item.Key,
				source: presignedUrl
			};
			return;
		}

		const newTab = window.open(new URL(presignedUrl), '_blank');
		if (newTab) {
			newTab.focus();
		}
	}

	function toggleSelectAll(checked: boolean) {
		isSingleItemAction = false;
		data.list.forEach((item) => {
			checkedItems[item.Key] = checked;
		});
	}

	$effect(() => {
		allSelected = data.count > 0 && data.list.every((item) => checkedItems[item.Key]);
		indeterminate =
			data.count > 0 && data.list.some((item) => checkedItems[item.Key] === true) && !allSelected;

		if (data.count === 0) {
			checkedItems = {};
		}
	});

	let actionsOpen = $derived((indeterminate || allSelected) && !isSingleItemAction);

	function isChecked(item: ObjectItem): boolean {
		return checkedItems[item.Key] || false;
	}

	function isFolderItem(item: ObjectItem) {
		return item.Key.endsWith('/');
	}

	const iconSize = 'h-5 w-5';

	const loadingAmount = 20;
</script>

{#snippet DataTableActions(item: ObjectItem)}
	{#each itemActions as itemAction}
		{@const Icon = itemAction.icon}
		<ContextMenu.Item onclick={() => itemAction.action(item)}>
			<Icon />
			{itemAction.title}
		</ContextMenu.Item>
	{/each}
{/snippet}

<!-- Filters -->

{#if actionsOpen}
	<div class="ml-auto max-w-xl">
		<div class="flex items-center gap-2 pb-5">
			{#each multipleItemsActions as action}
				{@const Icon = action.icon}
				<div class="w-full">
					<Button variant={action.variant} onclick={() => action.action()} class="w-full text-xs">
						<Icon class="h-5 w-4" />
						{action.title}
					</Button>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="flex w-full items-center gap-2 pb-5">
		<Input
			bind:value={searchValue}
			type="search"
			placeholder="Search"
			onkeyup={() => {
				debounce();
			}}
		/>
	</div>
{/if}

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

{#snippet tableRow(objectItem: ObjectItem)}
	{@const isCode = isCodeItem(objectItem.Key)}
	{@const isFolder = isFolderItem(objectItem)}
	{@const isUploading = !isFolder && objectItem.Size === 0 && !$uploadedItems[objectItem.Key]}
	{@const item = $uploadedItems[objectItem.Key] ?? objectItem}
	<Table.Row>
		<Table.Cell class="w-4">
			<Checkbox
				checked={isChecked(item)}
				onCheckedChange={(checked) => {
					checkedItems[item.Key] = checked;
					const someChecked = data.list.filter((item) => checkedItems[item.Key] === true);
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
				<ContextMenu.Trigger style="display: contents;" disabled={isUploading}>
					<div class="flex items-center gap-2">
						{#if isFolder}
							{@const folder = item.Key.replace('/', '')}
							<FolderIcon class={cn(iconSize, 'text-indigo-600')} fill="#1447e6" />
							<a
								href={route('/browse/[...path]', {
									path: page.params.path ? [page.params.path, folder] : [folder]
								})}
							>
								{folder}
							</a>
						{:else}
							<button
								onclick={() => handleOpenItemWrapper(item)}
								class="flex items-center gap-2"
								disabled={isUploading}
							>
								{#if isUploading}
									<div>
										{#if $uploadingItems[item.Key]}
											<span class="text-xs">
												{Math.round($uploadingItems[item.Key])}%
											</span>
										{:else}
											<XIcon class="h-4 w-4 text-red-600" />
										{/if}
									</div>
								{:else if item.ContentType}
									{#if item.ContentType === 'application/pdf'}
										<FileIcon class={cn(iconSize, 'text-indigo-400')} />
									{:else if item.ContentType.startsWith('audio')}
										<FileMusicIcon class={cn(iconSize, 'text-pink-400')} />
									{:else if item.ContentType.startsWith('image')}
										<FileImageIcon class={cn(iconSize, 'text-orange-400')} />
									{:else if isCode}
										<FileCodeIcon class={cn(iconSize, 'text-green-400')} />
									{:else}
										<FileIcon class={iconSize} />
									{/if}
								{:else}
									<FileIcon class={iconSize} />
								{/if}
								<div>
									<p class={cn(isUploading ? 'text-gray-500 dark:text-gray-300' : '')}>
										{item.Key}
									</p>
								</div>
								{#if item.Metadata?.category === 'music'}
									{#if item.Metadata.musicduration}
										<Badge variant="outline" class="text-muted-foreground px-1.5 text-xs">
											{secondsToMinutes(Number.parseFloat(item.Metadata.musicduration))}
										</Badge>
									{/if}
								{/if}
							</button>
						{/if}
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="w-52">
					{@render DataTableActions(item)}
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			<Badge variant="outline" class="text-muted-foreground px-1.5">
				{item.Metadata?.category ? capitalizeFirstLetter(item.Metadata.category) : 'No category'}
			</Badge>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			<p>
				{humanFileSize(item.Size as number) ?? '-'}
			</p>
		</Table.Cell>
		<Table.Cell colspan={1} class="w-32">
			{#if item.LastModified}
				{prettyDate(item.LastModified)}
			{/if}
		</Table.Cell>
		<Table.Cell colspan={1} class="w-4">
			<div class="flex w-full items-center justify-end">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						disabled={isUploading}
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
							<DropdownMenu.Item onclick={() => action.action(item)}>
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

<!-- Table -->
<div class="overflow-hidden rounded-lg border">
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
			{:else if data.count > 0}
				{#each data.list as item}
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
				This action cannot be undone. This will permanently delete the following items from your
				storage device.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="prose">
			<ul>
				{#each Object.keys(checkedItems) as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
		<AlertDialog.Footer class="fixed bottom-5 w-full px-10">
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => handleDeleteItem()}
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

<Dialog.Root bind:open={viewFileOpen}>
	{#if fileToView}
		<Dialog.Content class="max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
			<div class="flex justify-between gap-5">
				<Dialog.Header>
					<Dialog.Title>
						{fileToView.item.Key}
					</Dialog.Title>
					<Dialog.Description class="flex items-center gap-2">
						<span>
							{humanFileSize(fileToView.item.Size as number) ?? '-'}
						</span>
						{#if fileToView.language}
							<Badge variant="outline" class="text-xs">{fileToView.language}</Badge>
						{/if}
					</Dialog.Description>
				</Dialog.Header>
				<div class="pr-5">
					<Button type="button" variant="outline" size="sm" href={fileToView.src} target="_blank">
						Open in new tab
						<ExternalLinkIcon />
					</Button>
				</div>
			</div>
			<div class="flex h-[50vh] w-full items-center justify-center overflow-hidden">
				{#if fileToView.type === 'image'}
					<img
						src={fileToView.src}
						alt={fileToView.item.Key}
						class="h-full max-w-full rounded-md object-contain"
					/>
				{:else if fileToView.type === 'code' && fileToView.language && fileToView.content}
					<Code.Root lang={fileToView.language} class="w-full" code={fileToView.content}>
						<Code.CopyButton />
					</Code.Root>
				{/if}
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
