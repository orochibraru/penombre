<script lang="ts">
	import { EllipsisVerticalIcon } from '@lucide/svelte';
	import type { ObjectItem, ObjectList } from '$lib/api';
	import FilePrefix from '$lib/components/file-prefix.svelte';
	import type { ItemAction } from '$lib/utils';

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

	const iconSize = 'h-6 w-6';
</script>

<ul>
	{#each files.list as objectItem}
		<li class="flex items-center justify-between p-3">
			<FilePrefix item={objectItem} {handleOpenItem} {iconSize} />
			<button
				onclick={() => {
					actionableItem = objectItem;
					actionsContextOpen = true;
				}}
			>
				<EllipsisVerticalIcon class="h-5 w-5" />
			</button>
		</li>
	{/each}
</ul>
